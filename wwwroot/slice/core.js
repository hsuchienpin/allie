(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SliceCore = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const TARGET = 20, KEY = 'little-game-park.slice.v1';
  const THEMES = {
    fruit: { name: 'Candy', items: ['watermelon', 'apple', 'banana', 'grapes'], colors: ['#ff6778', '#a9df64', '#ffe17a'] },
    toys: { name: 'Cakes', items: ['giftPink', 'giftMint', 'giftPurple'], colors: ['#ff9bbb', '#7bdcca', '#ffdb6d'] },
    space: { name: 'Ice Pops', items: ['meteor', 'ufo', 'alien'], colors: ['#cfa8ff', '#7de5ed', '#ffe18a'] }
  };
  const MODES = {
    gentle: { name: 'Easy', travel: 17, interval: 2.9, max: 3, hit: 1.3, balloonHits: 5, balloonTravel: 24 },
    happy: { name: 'More', travel: 11, interval: 1.9, max: 5, hit: 1.2, balloonHits: 8, balloonTravel: 20 }
  };
  const ITEM_COLORS = {
    watermelon: ['#ff6778','#9bda62','#e3f5b8'], apple: ['#ff727d','#ffc28a','#ffe19b'],
    banana: ['#ffdb64','#fff1aa','#ffc15d'], grapes: ['#b782e8','#e7b4f7','#8f6cce']
  };
  const STICKERS = ['小兔子', '小熊', '小貓咪', '小狗狗', '小恐龍', '小象', '小雞', '小狐狸', '小企鵝', '小烏龜', '小貓頭鷹', '無尾熊'];
  function seededRandom(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const count = v => Number.isSafeInteger(v) && v >= 0 ? Math.min(v, 1e9) : 0;
  function segmentDistance(a, b, p) {
    const dx = b.x - a.x, dy = b.y - a.y, d = dx * dx + dy * dy;
    const t = d ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / d, 0, 1) : 0;
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  }
  class Records {
    constructor(storage, reduced = false) {
      this.storage = storage; this.available = true;
      this.data = { sessions: 0, slices: 0, energy: 0, stickers: [], pending: null, serial: 0,
        settings: { theme: 'fruit', mode: 'gentle', sound: true, tap: true, vibration: false, reduced } };
      try {
        const raw = JSON.parse(storage.getItem(KEY) || 'null');
        if (raw && typeof raw === 'object') {
          for (const k of ['sessions', 'slices', 'serial']) this.data[k] = count(raw[k]);
          if(typeof raw.rewardEpoch==='string' && /^slice:[a-z0-9-]{36}$/.test(raw.rewardEpoch)) this.data.rewardEpoch=raw.rewardEpoch;
          this.data.energy = Math.min(TARGET - 1, count(raw.energy));
          if (Array.isArray(raw.stickers)) this.data.stickers = [...new Set(raw.stickers.filter(i => Number.isInteger(i) && i >= 0 && i < STICKERS.length))];
          const s = raw.settings || {};
          if (THEMES[s.theme]) this.data.settings.theme = s.theme;
          if (MODES[s.mode]) this.data.settings.mode = s.mode;
          for (const k of ['sound', 'tap', 'vibration', 'reduced']) if (typeof s[k] === 'boolean') this.data.settings[k] = s[k];
          if (raw.pending && Number.isSafeInteger(raw.pending.id) && raw.pending.id > 0 && Number.isInteger(raw.pending.sticker) && raw.pending.sticker >= 0 && raw.pending.sticker < STICKERS.length) {
            this.data.pending = { id: raw.pending.id, sticker: raw.pending.sticker };
            this.data.serial = Math.max(this.data.serial, raw.pending.id); this.data.energy = 0;
          }
        }
      } catch (_) { this.available = false; }
    }
    save() { try { this.storage.setItem(KEY, JSON.stringify(this.data)); } catch (_) { this.available = false; } return this.available; }
    start() { this.data.sessions = count(this.data.sessions + 1); this.save(); }
    slice(energy) { this.data.slices = count(this.data.slices + 1); this.data.energy = Math.min(TARGET - 1, energy); this.save(); }
    prepare(rng = Math.random) {
      if (this.data.pending) return this.data.pending;
      let choices = STICKERS.map((_, i) => i).filter(i => !this.data.stickers.includes(i));
      if (!choices.length) choices = STICKERS.map((_, i) => i);
      const sticker = choices[Math.min(choices.length - 1, Math.floor(rng() * choices.length))];
      this.data.pending = { id: ++this.data.serial, sticker }; this.data.energy = 0; this.save(); return this.data.pending;
    }
    claim(id) {
      const p = this.data.pending;
      if (!p || p.id !== id) return null;
      const fresh = !this.data.stickers.includes(p.sticker);
      if (fresh) this.data.stickers.push(p.sticker);
      this.data.pending = null; this.save(); return { sticker: p.sticker, fresh };
    }
  }
  class Game {
    constructor(options = {}) {
      this.theme = THEMES[options.theme] ? options.theme : 'fruit';
      this.mode = MODES[options.mode] ? options.mode : 'gentle'; this.spec = MODES[this.mode];
      this.width = options.width || 960; this.height = options.height || 600;
      this.rng = options.rng || Math.random; this.reduced = !!options.reduced;
      this.energy = Math.min(TARGET - 1, count(options.energy)); this.state = 'running';
      this.time = 0; this.serial = 0; this.timer = .25; this.cuts = 0; this.balloonUsed = false;
      this.objects = []; this.particles = []; this.pieces = []; this.surprises = []; this.events = []; this.gestures = new Map(); this.lastTap = -Infinity;
    }
    resize(width, height) {
      if (!(width > 0 && height > 0)) return;
      const sx = width / this.width, sy = height / this.height, scale = Math.min(width, height) / Math.min(this.width, this.height);
      for (const o of this.objects) { o.x *= sx; o.homeX *= sx; o.y *= sy; o.r *= scale; o.amplitude *= sx; o.vy *= sy; }
      for (const list of [this.particles, this.pieces, this.surprises]) for (const p of list) { p.x *= sx; p.y *= sy; p.vx *= sx; p.vy *= sy; p.r *= scale; }
      this.width = width; this.height = height; this.gestures.clear();
    }
    spawn(balloon = false) {
      const r = balloon ? Math.min(this.width * .34, this.height * .30) : clamp(Math.min(this.width, this.height) * .105, 31, 82);
      const margin = r * 1.12;
      const homeX = balloon ? this.width / 2 : margin + this.rng() * (this.width - 2 * margin);
      const items = THEMES[this.theme].items;
      const o = { id: ++this.serial, type: balloon ? 'balloon' : items[Math.floor(this.rng() * items.length)],
        x: homeX, homeX, y: -r * 1.25, r, phase: this.rng() * Math.PI * 2, amplitude: balloon ? 0 : Math.min(this.width * .025, r * .18),
        vy: (this.height + r * 2.5) / (balloon ? this.spec.balloonTravel : this.spec.travel), hits: 0, lastHit: -Infinity };
      this.objects.push(o); return o;
    }
    step(dt) {
      if (!Number.isFinite(dt) || dt <= 0 || this.state === 'paused') return;
      dt = Math.min(dt, .05); this.time += dt;
      this.effects(dt);
      if (this.state !== 'running') return;
      for (const o of this.objects) { o.y += o.vy * dt; o.x = clamp(o.homeX + Math.sin(this.time * .65 + o.phase) * o.amplitude, o.r, this.width - o.r); }
      const lost = this.objects.filter(o => o.y - o.r > this.height);
      for (const o of lost) { this.burst(o.x, this.height - 12, 9, true); this.events.push({ kind: 'miss', object: o }); }
      this.objects = this.objects.filter(o => o.y - o.r <= this.height);
      const queued = this.cuts >= 9 && !this.balloonUsed;
      if (queued) {
        if (!this.objects.length) { this.spawn(true); this.balloonUsed = true; }
        return;
      }
      if (this.objects.some(o => o.type === 'balloon')) return;
      this.timer -= dt;
      if (this.timer <= 0 && this.objects.length < this.spec.max) { this.spawn(); this.timer = this.spec.interval; }
    }
    effects(dt) {
      for (const list of [this.particles, this.pieces, this.surprises]) {
        for (const p of list) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.bubble ? -8 : p.gravity || 115) * dt; p.angle += p.spin * dt; }
        for (let i = list.length - 1; i >= 0; i--) if (list[i].life <= 0) list.splice(i, 1);
      }
    }
    burst(x, y, n, bubble = false, fullscreen = false, palette = null) {
      const colors = palette || THEMES[this.theme].colors;
      n = this.reduced ? Math.min(n, 18) : n;
      for (let i = 0; i < n; i++) {
        if (this.particles.length >= (this.reduced ? 90 : 360)) this.particles.shift();
        const a = this.rng() * Math.PI * 2, v = 60 + this.rng() * (fullscreen ? 340 : 160);
        this.particles.push({ x: fullscreen ? this.rng() * this.width : x, y: fullscreen ? this.rng() * this.height * .6 : y,
          vx: bubble ? (this.rng() - .5) * 32 : Math.cos(a) * v, vy: bubble ? -30 - this.rng() * 40 : Math.sin(a) * v - 55,
          r: 4 + this.rng() * 7, color: colors[i % colors.length], shape: i % 3, bubble,
          life: bubble ? .8 : fullscreen ? 2.5 : 1.1, maxLife: bubble ? .8 : fullscreen ? 2.5 : 1.1,
          angle: a, spin: (this.rng() - .5) * 6 });
      }
    }
    cut(o) {
      if (this.state !== 'running' || !this.objects.includes(o)) return false;
      this.objects.splice(this.objects.indexOf(o), 1); this.cuts++;
      const balloon = o.type === 'balloon'; this.energy = Math.min(TARGET, this.energy + (balloon ? 3 : 1));
      this.burst(o.x, o.y, balloon ? 140 : 26, false, balloon, ITEM_COLORS[o.type]);
      if (!balloon) {
        for (const side of [-1, 1]) {
          if (this.pieces.length >= 30) this.pieces.shift();
          this.pieces.push({ type: o.type, side, x: o.x, y: o.y, r: o.r, vx: side * (75 + this.rng() * 65), vy: -80 - this.rng() * 55,
            gravity: 230, angle: 0, spin: this.reduced ? 0 : side * (1 + this.rng()), life: 1.6, maxLife: 1.6 });
        }
      }
      let surprise = null;
      if (this.theme === 'toys') surprise = ['bear', 'car', 'robot'][Math.floor(this.rng() * 3)];
      if (this.theme === 'space') surprise = o.type === 'meteor' ? 'gem' : 'star';
      if (surprise) {
        if (this.surprises.length >= 12) this.surprises.shift();
        this.surprises.push({ type: surprise, x: o.x, y: o.y, r: o.r * .7, vx: 0, vy: -100, gravity: 60, angle: 0, spin: .25, life: 2, maxLife: 2 });
      }
      this.events.push({ kind: 'slice', object: o, energy: this.energy, balloon });
      if (this.energy >= TARGET) { this.state = 'chest'; this.gestures.clear(); this.events.push({ kind: 'chest' }); }
      return true;
    }
    swipe(a, b, pointer = 0) {
      if (this.state !== 'running' || ![a.x, a.y, b.x, b.y].every(Number.isFinite)) return 0;
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      if (distance < 2) return 0;
      const direction = { x: (b.x - a.x) / distance, y: (b.y - a.y) / distance };
      let hits = 0;
      for (const o of [...this.objects]) {
        if (this.state !== 'running') break;
        const radius = o.r * this.spec.hit;
        if (o.type !== 'balloon') { if (segmentDistance(a, b, o) <= radius && this.cut(o)) hits++; continue; }
        let g = this.gestures.get(pointer);
        if (!g || g.id !== o.id) g = { id: o.id, inside: false, distance: 0, direction: null, legHit: false };
        const touches = segmentDistance(a, b, o) <= radius;
        const endsInside = Math.hypot(b.x - o.x, b.y - o.y) <= radius;
        const reversal = g.direction && g.direction.x * direction.x + g.direction.y * direction.y < -.35;
        if (reversal) { g.distance = distance; g.legHit = false; } else g.distance += distance;
        if (touches && this.time - o.lastHit >= .16 && (!g.inside || !g.legHit && g.distance >= Math.max(22, o.r * .3))) {
          o.lastHit = this.time; o.hits++; hits++; g.distance = 0; g.legHit = true;
          this.burst(b.x, b.y, 5); this.events.push({ kind: 'balloonHit', hits: o.hits });
          if (o.hits >= this.spec.balloonHits) this.cut(o);
        }
        g.inside = endsInside; g.direction = direction; this.gestures.set(pointer, g);
      }
      return hits;
    }
    tap(x, y) {
      if (this.state !== 'running' || !Number.isFinite(x) || !Number.isFinite(y) || this.time - this.lastTap < .16) return false;
      const o = [...this.objects].reverse().find(p => Math.hypot(x - p.x, y - p.y) <= p.r * this.spec.hit);
      if (!o) return false;
      this.lastTap = this.time;
      if (o.type !== 'balloon') return this.cut(o);
      if (this.time - o.lastHit < .16) return false;
      o.lastHit = this.time; o.hits++; this.events.push({ kind: 'balloonHit', hits: o.hits }); this.burst(x, y, 5);
      if (o.hits >= this.spec.balloonHits) this.cut(o);
      return true;
    }
    release(pointer) { this.gestures.delete(pointer); }
    pause() { if (this.state === 'running') { this.state = 'paused'; this.gestures.clear(); } }
    resume() { if (this.state === 'paused') this.state = 'running'; }
    nextRound() { this.energy = 0; this.cuts = 0; this.balloonUsed = false; this.timer = .4; this.objects.length = 0; this.gestures.clear(); this.lastTap = -Infinity; this.state = 'running'; }
    takeEvents() { return this.events.splice(0); }
  }
  return { TARGET, KEY, THEMES, MODES, STICKERS, Records, Game, segmentDistance, seededRandom };
});
