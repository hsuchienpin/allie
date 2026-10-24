(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SalonCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const W = 600, H = 720, MAX_STROKES = 180;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const clone = value => JSON.parse(JSON.stringify(value));
  const view = tool => ['lipstick', 'eyeshadow'].includes(tool) ? {scale: 1.5, x: -150, y: -105} : {scale: 1, x: 0, y: 0};
  function hair() {
    const strands = [];
    // Behind the face and neck. Every hanging ribbon has its own cut length.
    for (let i = 0; i < 34; i++) {
      const x = 169 + i * 7.95, side = x < 300 ? -1 : 1;
      strands.push({id: strands.length, layer: 'back', x, y: 189 - Math.sin(i / 33 * Math.PI) * 65,
        full: 410 + Math.sin(i * 1.7) * 24, width: 19, side, phase: i * .63, length: 1});
    }
    for (const side of [-1, 1]) for (let i = 0; i < 8; i++) {
      strands.push({id: strands.length, layer: 'side', x: side < 0 ? 174 + i * 5 : 426 - i * 5,
        y: 167 + i * 5, full: 415 - i * 4 + Math.sin(i) * 12, width: 18,
        side, phase: i * .7, length: 1});
    }
    for (let i = 0; i < 18; i++) {
      const x = 211 + i * 10.5;
      strands.push({id: strands.length, layer: 'fringe', x, y: 126 - Math.sin(i / 17 * Math.PI) * 28,
        full: 60 + Math.sin(i / 17 * Math.PI) * 28, width: 18,
        side: i < 5 ? -1 : 1, phase: i * .4, length: 1});
    }
    return strands;
  }
  const template = hair();
  function fresh() { return {version: 1, lengths: template.map(() => 1), strokes: []}; }
  function normalize(value) {
    const result = fresh();
    if (!value || value.version !== 1) return result;
    if (Array.isArray(value.lengths)) result.lengths = template.map((_, i) =>
      Number.isFinite(value.lengths[i]) ? clamp(value.lengths[i], .16, 1) : 1);
    if (Array.isArray(value.strokes)) result.strokes = value.strokes.slice(-MAX_STROKES).flatMap(s => {
      if (!s || !['lipstick', 'eyeshadow'].includes(s.tool) || !/^#[a-f0-9]{6}$/i.test(s.color) || !Array.isArray(s.points)) return [];
      const points = s.points.slice(0, 2500).filter(p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))
        .map(p => [clamp(p[0], -80, W + 80), clamp(p[1], -80, H + 80)]);
      return points.length ? [{tool: s.tool, color: s.color, size: clamp(Number(s.size) || 20, 8, 50), mirror: s.tool === 'eyeshadow' && !!s.mirror, points}] : [];
    });
    return result;
  }
  function point(strand, t, bend = 0) {
    const sweep = strand.layer === 'fringe' ? strand.side * 28 * Math.sin(t * 1.3) :
      strand.side * (23 * Math.sin(t * Math.PI * .65) + 10 * t) + Math.sin(t * 5 + strand.phase) * 8 * t;
    return {x: strand.x + sweep + bend * t * t, y: strand.y + strand.full * t - Math.abs(bend) * .12 * t * t};
  }
  function samples(strand, length, bend = 0) {
    return Array.from({length: 23}, (_, i) => { const t = length * i / 22; return {...point(strand, t, bend), t}; });
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
      const length = state.lengths[s.id], bend = motion[s.id]?.bend || 0, list = samples(s, length, bend);
      let next = length;
      for (let i = 1; i < list.length; i++) {
        const hit = distanceToSegment(p, list[i - 1], list[i]);
        if (hit.distance <= radius + s.width * .35) {
          const t = list[i - 1].t + (list[i].t - list[i - 1].t) * hit.t;
          next = Math.min(next, clamp(t, .16, 1));
        }
      }
      if (next < length - .006) {
        removed.push({strand: s, from: next, to: length, bend});
        state.lengths[s.id] = next;
      }
    }
    return removed;
  }
  function newMotion() { return template.map(() => ({bend: 0, velocity: 0})); }
  function advance(state, motion, wind, seconds) {
    const dt = clamp(seconds, 0, .035) * 60;
    let active = false;
    for (const s of template) {
      const m = motion[s.id], mid = point(s, state.lengths[s.id] * .65, m.bend);
      const distance = wind ? Math.hypot(mid.x - wind.x, (mid.y - wind.y) * .65) : Infinity;
      const falloff = Math.max(0, 1 - distance / 275);
      const direction = wind ? (mid.x >= wind.x ? 1 : -1) : 0;
      const target = direction * 125 * falloff * (wind?.power || 1) * state.lengths[s.id];
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
  return {W, H, MAX_STROKES, template, clamp, clone, view, fresh, normalize, point, samples, cut, covered, newMotion, advance, interpolate, History};
});
