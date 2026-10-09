importScripts('engine.js');
self.onmessage = function ({ data }) {
  try {
    const rgba = new Uint8ClampedArray(data.rgba);
    if (data.type === 'lineart') {
      const result = ColoringCore.binarize(rgba, data.width, data.height, data.threshold, data.repair);
      const difficulty = ColoringCore.estimateDifficulty(result.mask, data.width, data.height);
      self.postMessage({ id: data.id, rgba: result.rgba.buffer, mask: result.mask.buffer, difficulty }, [result.rgba.buffer, result.mask.buffer]);
    } else if (data.type === 'fill') {
      const changed = ColoringCore.floodFill(rgba, new Uint8Array(data.mask), data.width, data.height, data.x, data.y, data.color);
      self.postMessage({ id: data.id, rgba: rgba.buffer, changed }, [rgba.buffer]);
    }
  } catch (error) { self.postMessage({ id: data.id, error: '圖片處理失敗，請換一張圖片再試。' }); }
};
