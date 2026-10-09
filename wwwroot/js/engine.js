/* Pure pixel algorithms shared by the browser worker and local tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ColoringCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function closeMask(mask, w, h) {
    const expanded = new Uint8Array(mask.length), closed = new Uint8Array(mask.length);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let black = 0;
      for (let dy = -1; dy <= 1 && !black; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h && mask[yy * w + xx]) { black = 1; break; }
      }
      expanded[y * w + x] = black;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let black = 1;
      for (let dy = -1; dy <= 1 && black; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h && !expanded[yy * w + xx]) { black = 0; break; }
      }
      closed[y * w + x] = black;
    }
    return closed;
  }
  function binarize(rgba, w, h, threshold = 170, repair = true) {
    let mask = new Uint8Array(w * h);
    for (let i = 0; i < mask.length; i++) {
      const p = i * 4, a = rgba[p + 3] / 255;
      const luminance = (rgba[p] * .2126 + rgba[p + 1] * .7152 + rgba[p + 2] * .0722) * a + 255 * (1 - a);
      mask[i] = luminance < threshold ? 1 : 0;
    }
    // Only remove isolated specks; do not erase thin continuous line work.
    const clean = mask.slice();
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (!mask[i]) continue;
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) neighbors += mask[i + dy * w + dx];
      if (!neighbors) clean[i] = 0;
    }
    mask = repair ? closeMask(clean, w, h) : clean;
    const output = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < mask.length; i++) output[i * 4 + 3] = mask[i] ? 255 : 0;
    return { rgba: output, mask };
  }
  function floodFill(rgba, mask, w, h, x, y, color, tolerance = 8) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= w || y >= h || mask[y * w + x]) return 0;
    const pixelColor = (i, channel) => rgba[i * 4 + channel] * (rgba[i * 4 + 3] / 255) + 255 * (1 - rgba[i * 4 + 3] / 255);
    const seed = y * w + x, target = [0, 1, 2].map(c => pixelColor(seed, c));
    if (target.every((v, c) => Math.abs(v - color[c]) <= tolerance)) return 0;
    const visited = new Uint8Array(w * h), stack = [seed];
    const matches = i => !visited[i] && !mask[i] && target.every((v, c) => Math.abs(pixelColor(i, c) - v) <= tolerance);
    let count = 0;
    while (stack.length) {
      const start = stack.pop();
      if (!matches(start)) continue;
      const row = Math.floor(start / w), rowStart = row * w;
      let left = start, right = start;
      while (left > rowStart && matches(left - 1)) left--;
      while (right < rowStart + w - 1 && matches(right + 1)) right++;
      let above = false, below = false;
      for (let i = left; i <= right; i++) {
        visited[i] = 1;
        rgba[i * 4] = color[0]; rgba[i * 4 + 1] = color[1]; rgba[i * 4 + 2] = color[2]; rgba[i * 4 + 3] = 255; count++;
        if (row > 0) { const valid = matches(i - w); if (valid && !above) stack.push(i - w); above = valid; }
        if (row < h - 1) { const valid = matches(i + w); if (valid && !below) stack.push(i + w); below = valid; }
      }
    }
    return count;
  }
  function estimateDifficulty(mask, w, h) {
    const visited = new Uint8Array(mask.length), queue = new Int32Array(mask.length);
    let regions = 0, difficultTargets = 0;
    for (let i = 0; i < mask.length; i++) {
      if (mask[i]) continue;
      if (visited[i]) continue;
      let head = 0, tail = 1, edge = false, perimeter = 0;
      let minX = w, maxX = 0, minY = h, maxY = 0;
      queue[0] = i; visited[i] = 1;
      while (head < tail) {
        const p = queue[head++], x = p % w, y = Math.floor(p / w);
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        if (!x || !y || x === w - 1 || y === h - 1) edge = true;
        const neighbors = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
        for (const n of neighbors) {
          if (n < 0 || mask[n]) perimeter++;
          else if (!visited[n]) { visited[n] = 1; queue[tail++] = n; }
        }
      }
      // Tiny isolated marks are ignored; real enclosed targets are judged by area and width.
      if (!edge && tail > 16) {
        regions++;
        const minimumWidth = Math.min(w, h) * .04;
        const effectiveWidth = perimeter ? 2 * tail / perimeter : 0;
        if (tail < w * h * .003 || Math.min(maxX - minX + 1, maxY - minY + 1) < minimumWidth || effectiveWidth < minimumWidth / 2) difficultTargets++;
      }
    }
    let level = regions > 20 ? 3 : regions > 9 ? 2 : 1;
    if (regions > 3 && difficultTargets / regions >= .25) level++;
    return Math.min(3, level);
  }
  function hexToRgb(hex) { return [1, 3, 5].map(p => parseInt(hex.slice(p, p + 2), 16)); }
  return { binarize, floodFill, estimateDifficulty, hexToRgb, closeMask };
});
