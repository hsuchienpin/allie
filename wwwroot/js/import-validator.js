(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ImageFile = api;
})(globalThis, function () {
  'use strict';
  function inspect(buffer) {
    const b = new Uint8Array(buffer), v = new DataView(buffer);
    if (b.length > 12 * 1024 * 1024) throw new Error('圖片太大了，請選擇小於 12 MB 的圖片。');
    if (b.length < 24) throw new Error('這個檔案不是可用的圖片。');
    const text = (p, n) => String.fromCharCode(...b.subarray(p, p + n));
    let width, height, type;
    if (text(1, 3) === 'PNG' && b[0] === 137 && b[4] === 13 && b[5] === 10 && b[6] === 26 && b[7] === 10 && text(12, 4) === 'IHDR') {
      type = 'image/png'; width = v.getUint32(16); height = v.getUint32(20);
      for (let p = 8; p + 12 <= b.length;) {
        const size = v.getUint32(p), name = text(p + 4, 4);
        if (name === 'acTL') throw new Error('請選擇靜態圖片，動畫圖片暫不支援。');
        if (size > b.length - p - 12) throw new Error('圖片檔案不完整。');
        p += size + 12;
      }
    } else if (b[0] === 255 && b[1] === 216) {
      type = 'image/jpeg';
      for (let p = 2; p + 4 <= b.length;) {
        if (b[p] !== 255) break;
        while (b[p] === 255) p++;
        const marker = b[p++];
        if (marker === 217 || marker === 218) break;
        if (marker === 1 || marker >= 208 && marker <= 215) continue;
        if (p + 2 > b.length) break;
        const length = v.getUint16(p);
        if (length < 2 || p + length > b.length) throw new Error('圖片檔案不完整。');
        if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)) {
          if (length < 8) throw new Error('圖片檔案不完整。');
          height = v.getUint16(p + 3); width = v.getUint16(p + 5); break;
        }
        p += length;
      }
    } else if (text(0, 4) === 'RIFF' && text(8, 4) === 'WEBP') {
      type = 'image/webp';
      for (let p = 12; p + 8 <= b.length;) {
        const name = text(p,4), size = v.getUint32(p + 4,true), d = p + 8;
        if (d + size > b.length) throw new Error('圖片檔案不完整。');
        if (name === 'ANIM' || name === 'ANMF' || name === 'VP8X' && (b[d] & 2)) throw new Error('請選擇靜態圖片，動畫圖片暫不支援。');
        if (name === 'VP8X' && size >= 10) { width = 1 + b[d+4] + (b[d+5]<<8) + (b[d+6]<<16); height = 1 + b[d+7] + (b[d+8]<<8) + (b[d+9]<<16); }
        if (name === 'VP8 ' && size >= 10 && !width) { width = v.getUint16(d+6,true)&16383; height = v.getUint16(d+8,true)&16383; }
        if (name === 'VP8L' && size >= 5 && !width) { width = 1 + b[d+1] + ((b[d+2]&63)<<8); height = 1 + (b[d+2]>>6) + (b[d+3]<<2) + ((b[d+4]&15)<<10); }
        p = d + size + (size & 1);
      }
    } else throw new Error('請選擇 PNG、JPG 或 WebP 圖片。');
    if (!width || !height || width * height > 24000000 || width > 12000 || height > 12000) throw new Error('圖片尺寸太大或格式不完整，請先縮小圖片。');
    return { width, height, type };
  }
  return { inspect };
});
