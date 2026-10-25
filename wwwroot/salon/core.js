(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SalonCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const W = 600, H = 720, MAX_STROKES = 180;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const clone = value => JSON.parse(JSON.stringify(value));
  const paintTools = ['lipstick', 'eyeshadow', 'eyeliner', 'blush'];
  const isPaint = tool => paintTools.includes(tool);
  const brushRange = tool => tool === 'eyeliner' ? [2, 14] : tool === 'blush' ? [20, 70] : [8, 50];
  const accessories = {
    head: [['none', '不戴皇冠'], ['tiara', '水晶皇冠'], ['royal', '玫瑰王冠'], ['flowers', '花朵花環']],
    clip: [['none', '不戴髮飾'], ['bow', '緞帶蝴蝶結'], ['butterfly', '寶石蝴蝶'], ['rose', '玫瑰髮夾']],
    ears: [['none', '不戴耳環'], ['pearls', '珍珠耳環'], ['stars', '星星耳環'], ['hearts', '愛心耳環']],
    neck: [['none', '不戴項鍊'], ['pearl', '珍珠項鍊'], ['ruby', '玫瑰寶石'], ['moon', '月光項鍊']]
  };
  const view = tool => isPaint(tool) ? {scale: 1.5, x: -150, y: -105} : {scale: 1, x: 0, y: 0};
  function hair() {
    const strands = [];
    // Behind the face and neck. Every hanging ribbon has its own cut length.
    for (let i = 0; i < 34; i++) {
      const x = 169 + i * 7.95, side = x < 300 ? -1 : 1;
      strands.push({id: strands.length, layer: 'back', x, y: 189 - Math.sin(i / 33 * Math.PI) * 65,
        full: 408 + Math.sin(i / 33 * Math.PI) * 38, width: 19, side, phase: side < 0 ? .3 : .7, length: 1});
    }
    for (const side of [-1, 1]) for (let i = 0; i < 8; i++) {
      strands.push({id: strands.length, layer: 'side', x: side < 0 ? 174 + i * 5 : 426 - i * 5,
        y: 167 + i * 5, full: 440 - i * 7, width: 18,
        side, phase: side < 0 ? .3 : .7, length: 1});
    }
    for (let i = 0; i < 18; i++) {
      const x = 211 + i * 10.5;
      strands.push({id: strands.length, layer: 'fringe', x, y: 126 - Math.sin(i / 17 * Math.PI) * 28,
        full: 58 + i * 2.3, width: 18,
        side: 1, phase: .4, length: 1});
    }
    return strands;
  }
  const template = hair();
  const naturalStyle = () => ({straight: 0, curl: 0, volume: 0, extent: 1});
  const styles = {
    straight: {straight: 1, curl: 0, volume: 0},
    inward: {straight: .35, curl: -1, volume: 0},
    outward: {straight: .35, curl: 1, volume: 0},
    volume: {straight: 0, curl: 0, volume: 1}
  };
  function fresh() { return {version: 3, lengths: template.map(() => 1), styles: template.map(naturalStyle), strokes: [], accessories: {head: 'tiara', clip: 'none', ears: 'none', neck: 'none'}}; }
  function normalize(value) {
    const result = fresh();
    if (!value || ![1, 2, 3].includes(value.version)) return result;
    if (Array.isArray(value.lengths)) result.lengths = template.map((_, i) =>
      Number.isFinite(value.lengths[i]) ? clamp(value.lengths[i], .16, 1) : 1);
    if (value.version >= 2 && Array.isArray(value.styles)) result.styles = template.map((_, i) => {
      const s = value.styles[i];
      if (!s || typeof s !== 'object') return naturalStyle();
      const safe = (key, low, high, fallback = 0) => Number.isFinite(s[key]) ? clamp(s[key], low, high) : fallback;
      return {straight: safe('straight', 0, 1), curl: safe('curl', -1, 1), volume: safe('volume', 0, 1), extent: safe('extent', .16, 1, 1)};
    });
    if (Array.isArray(value.strokes)) result.strokes = value.strokes.slice(-MAX_STROKES).flatMap(s => {
      if (!s || !isPaint(s.tool) || !/^#[a-f0-9]{6}$/i.test(s.color) || !Array.isArray(s.points)) return [];
      const points = s.points.slice(0, 2500).filter(p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))
        .map(p => [clamp(p[0], -80, W + 80), clamp(p[1], -80, H + 80)]);
      return points.length ? [{tool: s.tool, color: s.color, size: clamp(Number(s.size) || 20, ...brushRange(s.tool)), mirror: s.tool !== 'lipstick' && !!s.mirror, points}] : [];
    });
    if (value.version === 3 && value.accessories && typeof value.accessories === 'object') {
      for (const [slot, items] of Object.entries(accessories)) {
        if (items.some(([id]) => id === value.accessories[slot])) result.accessories[slot] = value.accessories[slot];
      }
    }
    return result;
  }
  function point(strand, t, bend = 0, style) {
    const sweep = strand.layer === 'fringe' ? strand.side * 28 * Math.sin(t * 1.3) :
      strand.side * (23 * Math.sin(t * Math.PI * .65) + 10 * t) + Math.sin(t * 5 + strand.phase) * 8 * t;
    const straight = style?.straight || 0, curl = style?.curl || 0, volume = style?.volume || 0;
    // The styled extent is retained when cutting, so scissors remove the actual curved tip.
    const extent = style?.extent || 1, u = clamp(t / extent, 0, 1), arc = clamp((u - .52) / .48, 0, 1) * 2.4;
    const radius = Math.min(66, strand.full * extent * .22);
    const curlX = strand.side * curl * radius * (1 - Math.cos(arc));
    const curlY = -Math.abs(curl) * radius * (arc - Math.sin(arc));
    const lift = Math.sin(u * Math.PI);
    return {x: strand.x + sweep * (1 - straight) + curlX + strand.side * volume * (65 * lift + 9 * u) + bend * t * t,
      y: strand.y + strand.full * t + curlY - volume * 24 * lift - Math.abs(bend) * .12 * t * t};
  }
  function samples(strand, length, bend = 0, style) {
    return Array.from({length: 37}, (_, i) => { const t = length * i / 36; return {...point(strand, t, bend, style), t}; });
  }
  function distanceToSegment(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
    const t = length ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / length, 0, 1) : 0;
    return {distance: Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy), t};
  }
  // Occluded back hair cannot be cut by touching the face or neck.
  function covered(x, y) {
    return ((x - 300) / 120) ** 2 + ((y - 305) / 171) ** 2 < 1 ||
      (y > 443 && y < 574 && x > 261 && x < 339);
  }
  function cut(state, motion, p, radius = 12) {
    const removed = [];
    for (const s of template) {
      if (s.layer === 'back' && covered(p.x, p.y)) continue;
      const length = state.lengths[s.id], bend = motion[s.id]?.bend || 0, style = state.styles?.[s.id], list = samples(s, length, bend, style);
      let next = length;
      for (let i = 1; i < list.length; i++) {
        const hit = distanceToSegment(p, list[i - 1], list[i]);
        if (hit.distance <= radius + s.width * .35) {
          const t = list[i - 1].t + (list[i].t - list[i - 1].t) * hit.t;
          next = Math.min(next, clamp(t, .16, 1));
        }
      }
      if (next < length - .006) {
        removed.push({strand: s, from: next, to: length, bend, style: style && clone(style)});
        state.lengths[s.id] = next;
      }
    }
    return removed;
  }
  function newMotion() { return template.map(() => ({bend: 0, velocity: 0})); }
  function styleAt(state, motion, wind, seconds) {
    const target = Object.prototype.hasOwnProperty.call(styles, wind?.mode) ? styles[wind.mode] : null;
    if (!target || !Number.isFinite(wind.x) || !Number.isFinite(wind.y) || !Number.isFinite(seconds) || seconds <= 0) return 0;
    const dt = Math.min(seconds, .05), power = clamp(Number(wind.power) || 1, .4, 1.4);
    let changed = 0;
    for (const strand of template) {
      const old = state.styles[strand.id], list = samples(strand, state.lengths[strand.id], motion[strand.id]?.bend || 0, old);
      let distance = Infinity;
      for (let i = 1; i < list.length; i++) {
        const a = list[i - 1], b = list[i];
        if (strand.layer === 'back' && covered((a.x + b.x) / 2, (a.y + b.y) / 2)) continue;
        distance = Math.min(distance, distanceToSegment(wind, a, b).distance);
      }
      // A small brush radius lets the two sides be styled independently.
      if (distance >= 95) continue;
      const rate = 1 - Math.exp(-3.8 * dt * power * (1 - distance / 95));
      let touched = false;
      for (const key of ['straight', 'curl', 'volume']) {
        const value = old[key] + (target[key] - old[key]) * rate;
        const next = Math.abs(value - target[key]) < .003 ? target[key] : value;
        if (Math.abs(next - old[key]) > .000001) { old[key] = next; touched = true; }
      }
      const extent = old.extent + (state.lengths[strand.id] - old.extent) * rate;
      const nextExtent = Math.abs(extent - state.lengths[strand.id]) < .0005 ? state.lengths[strand.id] : extent;
      if (Math.abs(nextExtent - old.extent) > .000001) { old.extent = nextExtent; touched = true; }
      if (touched) changed++;
    }
    return changed;
  }
  function advance(state, motion, wind, seconds) {
    const dt = clamp(seconds, 0, .035) * 60;
    let active = false;
    for (const s of template) {
      const m = motion[s.id], mid = point(s, state.lengths[s.id] * .65, m.bend, state.styles?.[s.id]);
      const distance = wind ? Math.hypot(mid.x - wind.x, (mid.y - wind.y) * .65) : Infinity;
      const falloff = Math.max(0, 1 - distance / 275);
      const direction = wind ? (mid.x >= wind.x ? 1 : -1) : 0;
      const target = direction * 125 * falloff * (wind?.power || 1) * state.lengths[s.id] * (wind?.mode ? .3 : 1);
      m.velocity += ((target - m.bend) * .035 - m.velocity * .19) * dt;
      m.bend = clamp(m.bend + m.velocity * dt, -145, 145);
      if (Math.abs(m.bend) + Math.abs(m.velocity) < .04 && !wind) { m.bend = 0; m.velocity = 0; }
      if (Math.abs(m.bend) + Math.abs(m.velocity) > .04) active = true;
    }
    return active;
  }
  function interpolate(a, b, spacing = 3) {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / spacing));
    return Array.from({length: n}, (_, i) => ({x: a.x + (b.x - a.x) * (i + 1) / n, y: a.y + (b.y - a.y) * (i + 1) / n}));
  }
  class History {
    constructor(state) { this.current = clone(state); this.past = []; this.future = []; }
    push(state) {
      if (JSON.stringify(state) === JSON.stringify(this.current)) return false;
      this.past.push(this.current); if (this.past.length > 24) this.past.shift();
      this.current = clone(state); this.future = []; return true;
    }
    undo() { if (!this.past.length) return false; this.future.push(this.current); this.current = this.past.pop(); return true; }
    redo() { if (!this.future.length) return false; this.past.push(this.current); this.current = this.future.pop(); return true; }
  }
  return {W, H, MAX_STROKES, template, clamp, clone, view, isPaint, brushRange, accessories, fresh, normalize, point, samples, cut, covered, newMotion, styleAt, advance, interpolate, History};
});
