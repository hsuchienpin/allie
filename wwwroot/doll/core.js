(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./catalog.js') : root.DollCatalog);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DollCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Catalog) {
  'use strict';
  const clone = x => JSON.parse(JSON.stringify(x));
  const valid = (v, max, fallback) => Number.isInteger(v) && v >= 0 && v < max ? v : fallback;
  function normalize(input) {
    const d = Catalog.defaults, out = {};
    input = input && typeof input === 'object' ? input : {};
    for (const key of Object.keys(Catalog.items)) out[key] = valid(input[key], Catalog.items[key].length, d[key]);
    out.colors = {}; out.patterns = {};
    for (const [key, colors] of Object.entries(Catalog.palettes)) out.colors[key] = valid(input.colors?.[key], colors.length, d.colors[key]);
    for (const key of Object.keys(d.patterns)) out.patterns[key] = valid(input.patterns?.[key], Catalog.patterns.length, 0);
    return out;
  }
  function choose(current, part, value) {
    const out = normalize(current);
    if (!Catalog.items[part] || !Number.isInteger(value) || !Catalog.items[part][value]) return out;
    out[part] = value;
    if (part === 'top' || part === 'bottom') out.outfit = 0;
    return out;
  }
  function randomize() {
    const out = normalize(Catalog.defaults), pick = max => Math.floor(Math.random() * max);
    for (const key of Object.keys(Catalog.items)) out[key] = pick(Catalog.items[key].length);
    for (const key of Object.keys(out.colors)) out.colors[key] = pick(Catalog.palettes[key].length);
    for (const key of Object.keys(out.patterns)) out.patterns[key] = pick(Catalog.patterns.length);
    out.outfit = Math.random() < .65 ? 0 : out.outfit;
    return out;
  }
  function cleanName(input) {
    const value = String(input || '').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '').trim();
    const units = typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter('zh-Hant', {granularity:'grapheme'}).segment(value)].map(x => x.segment) : Array.from(value);
    return units.slice(0, 12).join('');
  }
  function randomName() {
    const words = ['小星星','布丁','彩虹','小豆','泡泡','可可','棉花糖','小栗子','花生','小月亮','桃子','小森林','米米','暖暖','小橘子','小海星'];
    return words[Math.floor(Math.random() * words.length)];
  }
  class History {
    constructor(initial) { this.current = normalize(initial); this.past = []; this.future = []; }
    push(next) {
      next = normalize(next);
      if (JSON.stringify(next) === JSON.stringify(this.current)) return false;
      this.past.push(clone(this.current)); if (this.past.length > 80) this.past.shift();
      this.current = next; this.future = []; return true;
    }
    undo() { if (!this.past.length) return false; this.future.push(this.current); this.current = this.past.pop(); return true; }
    redo() { if (!this.future.length) return false; this.past.push(this.current); this.current = this.future.pop(); return true; }
    reset(next) { this.current = normalize(next); this.past = []; this.future = []; }
  }
  return {clone,normalize,choose,randomize,cleanName,randomName,History};
});
