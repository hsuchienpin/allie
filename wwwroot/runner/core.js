(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RunnerCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const W = 480, H = 640, LEFT = 48, RIGHT = 432, PLAYER_Y = 462;
  const LANE_WIDTH = (RIGHT - LEFT) / 5;
  const center = lane => LEFT + LANE_WIDTH * (lane + .5);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const VEHICLES = Object.freeze({
    runner: { name: 'Princess', width: 22, height: 32, lateral: 265, boost: 1.22, response: 5, armor: 0, color: '#f47c46', hint: '身形小巧，左右閃避最靈活' },
    bicycle: { name: 'Unicorn', width: 28, height: 46, lateral: 235, boost: 1.38, response: 2.5, armor: 0, color: '#329d66', hint: '加減速平滑，穩穩向前' },
    motorcycle: { name: 'Penguin', width: 32, height: 50, lateral: 210, boost: 1.45, response: 8, armor: 0, color: '#ee7253', hint: '加速反應快，挑戰更遠里程' },
    car: { name: 'Candy Princess', width: 42, height: 64, lateral: 185, boost: 1.34, response: 3, armor: 1, color: '#488fc0', hint: '體積較大，有一次防撞裝甲' }
  });
  const SCENES = [
    { id: 'desert', name: 'Garden', ground: '#e6d6f0', road: '#fce9f2', edge: '#c7aadf', accent: '#49844a', obstacles: ['cactus', 'tumbleweed', 'wagon'] },
    { id: 'jungle', name: 'Playground', ground: '#cbe5d7', road: '#f6e3f2', edge: '#b7a4cf', accent: '#b8dd7e', obstacles: ['log', 'vine', 'animal'] },
    { id: 'city', name: 'Playhouse', ground: '#d9ecf7', road: '#f4e2ef', edge: '#b4bce2', accent: '#ee9854', obstacles: ['cone', 'sign', 'traffic'] },
    { id: 'highway', name: 'Sweet Street', ground: '#f8d7e4', road: '#fbeacd', edge: '#d4b8d5', accent: '#93cbcb', obstacles: ['gate', 'truck', 'barrier'] }
  ];
  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => { value += 0x6D2B79F5; let t = value; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function inputs(values) {
    const set = new Set(values);
    return { horizontal: Number(set.has('right')) - Number(set.has('left')), speed: set.has('brake') ? 'brake' : set.has('boost') ? 'boost' : 'normal' };
  }
  // Pointer IDs remain independent even when two fingers hold the same action.
  class Controls {
    constructor() { this.sources = new Map(); }
    hold(id, action) { if (['left', 'right', 'boost', 'brake'].includes(action)) this.sources.set(id, action); }
    release(id) { this.sources.delete(id); }
    clear() { this.sources.clear(); }
    read() { return inputs(this.sources.values()); }
  }
  // Swept relative AABB: checks the whole segment, including fast lateral movement.
  function sweptCollision(a0, a1, b0, b1, halfWidth, halfHeight) {
    const x = a0.x - b0.x, y = a0.y - b0.y;
    const dx = (a1.x - b1.x) - x, dy = (a1.y - b1.y) - y;
    let entry = 0, exit = 1;
    for (const [p, d, h] of [[x, dx, halfWidth], [y, dy, halfHeight]]) {
      if (Math.abs(d) < 1e-9) { if (Math.abs(p) > h) return false; continue; }
      let lo = (-h - p) / d, hi = (h - p) / d;
      if (lo > hi) [lo, hi] = [hi, lo];
      entry = Math.max(entry, lo); exit = Math.min(exit, hi);
      if (entry > exit) return false;
    }
    return exit >= 0 && entry <= 1;
  }
  class Game {
    constructor(vehicle = 'bicycle', random = Math.random) {
      this.vehicleId = Object.hasOwn(VEHICLES, vehicle) ? vehicle : 'bicycle';
      this.vehicle = VEHICLES[this.vehicleId]; this.random = random;
      this.x = center(2); this.y = PLAYER_Y; this.speed = 180; this.distance = 0; this.elapsed = 0;
      this.scroll = 0; this.lives = 3; this.armor = this.vehicle.armor; this.coins = 0;
      this.invincible = 0; this.hurt = 0; this.ended = false; this.objects = []; this.events = [];
      this.safeLane = 2; this.rowTravel = 1000; this.rowGap = 350; this.nextId = 1; this.row = 0;
      this.pool = []; this.maxObjects = 0;
    }
    get score() { return Math.floor(this.distance) + this.coins * 50; }
    get sceneIndex() { return Math.floor(this.distance / 500) % SCENES.length; }
    get baseSpeed() { return Math.min(320, 180 + this.distance * .046); }
    get status() { return { score: this.score, distance: Math.floor(this.distance), vehicle: this.vehicleId, coins: this.coins, lives: this.lives, armor: this.armor, scene: SCENES[this.sceneIndex].name }; }
    add(data) {
      if (this.objects.length >= 70) return null;
      const item = this.pool.pop() || {};
      for (const key of Object.keys(item)) delete item[key];
      Object.assign(item, { id: this.nextId++, x: 0, y: 0, w: 36, h: 48, age: 0, phase: this.random() * Math.PI * 2, motion: 0, span: 0, warning: false, consumed: false }, data);
      item.homeX = item.x; this.objects.push(item); this.maxObjects = Math.max(this.maxObjects, this.objects.length); return item;
    }
    spawnRow() {
      const previous = this.safeLane;
      this.safeLane = clamp(previous + Math.floor(this.random() * 3) - 1, 0, 4);
      const reserved = new Set([previous, this.safeLane]);
      const candidates = [0, 1, 2, 3, 4].filter(lane => !reserved.has(lane));
      // No random comparator: seeded runs must remain reproducible.
      for (let i = candidates.length - 1; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [candidates[i], candidates[j]] = [candidates[j], candidates[i]]; }
      const scene = SCENES[this.sceneIndex];
      const transition = this.distance >= 440 && (this.distance % 500 > 440 || this.distance % 500 < 65);
      const count = Math.min(candidates.length, transition ? 1 : 1 + Math.floor(this.distance / 650));
      const occupied = new Set();
      for (const lane of candidates) {
        if (occupied.size >= count || occupied.has(lane)) continue;
        const type = scene.obstacles[Math.floor(this.random() * scene.obstacles.length)];
        let motion = 0, span = 0, homeLane = lane;
        // Moving hazards may use two blocked lanes but never enter either reserved corridor.
        const neighbor = [lane - 1, lane + 1].find(n => candidates.includes(n) && !occupied.has(n));
        if (['animal', 'traffic', 'tumbleweed'].includes(type) && neighbor !== undefined && this.random() > .4) {
          homeLane = (lane + neighbor) / 2; span = LANE_WIDTH / 2; occupied.add(neighbor); motion = 1;
        } else if (type === 'tumbleweed') { span = 6; motion = 1; }
        occupied.add(lane);
        const h = type === 'truck' ? 100 : type === 'wagon' ? 70 : type === 'traffic' ? 64 : 44;
        const w = ['log', 'gate', 'barrier', 'sign'].includes(type) ? 56 : type === 'truck' ? 50 : 40;
        this.add({ kind: 'obstacle', type, scene: this.sceneIndex, lane, x: center(homeLane), y: -110, w, h, motion, span, warning: ['vine', 'animal', 'traffic'].includes(type), reserved: [...reserved] });
      }
      const lane = this.safeLane;
      for (let i = 0; i < 3; i++) this.add({ kind: 'coin', type: 'coin', x: center(lane), y: -190 - i * 45, w: 23, h: 23 });
      if (++this.row % 6 === 0) this.add({ kind: 'star', type: 'star', x: center(lane), y: -340, w: 30, h: 30 });
      // Conservative spacing uses max boost speed, tallest hazard, and one-lane car travel.
      // Reserving BOTH old and new lanes gives a continuous route between consecutive rows.
      const maximum = this.baseSpeed * this.vehicle.boost;
      this.rowGap = Math.max(330, maximum * (LANE_WIDTH / this.vehicle.lateral + .65) + 145);
      this.rowTravel = 0;
    }
    step(dt, input = { horizontal: 0, speed: 'normal' }) {
      if (this.ended || !Number.isFinite(dt) || dt <= 0) return;
      // Caller uses fixed steps; the cap also prevents resume/tab gaps from becoming teleports.
      dt = Math.min(dt, 1 / 30); this.events.length = 0;
      const priorScene = this.sceneIndex;
      this.elapsed += dt; this.invincible = Math.max(0, this.invincible - dt); this.hurt = Math.max(0, this.hurt - dt);
      const target = this.baseSpeed * (input.speed === 'brake' ? .65 : input.speed === 'boost' ? this.vehicle.boost : 1);
      this.speed += (target - this.speed) * (1 - Math.exp(-this.vehicle.response * dt));
      const previousPlayer = { x: this.x, y: this.y };
      this.x = clamp(this.x + clamp(Number(input.horizontal) || 0, -1, 1) * this.vehicle.lateral * dt, LEFT + this.vehicle.width / 2 + 5, RIGHT - this.vehicle.width / 2 - 5);
      const travel = this.speed * dt;
      this.scroll += travel; this.distance += travel / 9; this.rowTravel += travel;
      if (this.sceneIndex !== priorScene) this.events.push('scene');
      if (this.rowTravel >= this.rowGap) this.spawnRow();
      for (const item of this.objects) {
        const before = { x: item.x, y: item.y };
        item.age += dt; item.y += travel;
        if (item.motion) item.x = item.homeX + Math.sin(item.age * 1.8 + item.phase) * item.span;
        item.warning = ['vine', 'animal', 'traffic'].includes(item.type) && item.y < 165;
        if (item.consumed) continue;
        if (!sweptCollision(previousPlayer, { x: this.x, y: this.y }, before, item, (this.vehicle.width + item.w) / 2, (this.vehicle.height + item.h) / 2)) continue;
        item.consumed = true;
        if (item.kind === 'coin') { this.coins++; this.events.push('coin'); }
        else if (item.kind === 'star') { this.invincible = 5; this.events.push('star'); }
        else if (this.invincible > 0 || this.hurt > 0) this.events.push('shield');
        else {
          if (this.armor > 0) { this.armor--; this.events.push('armor'); }
          else { this.lives--; this.events.push('hit'); }
          this.hurt = 1.5;
          if (this.lives <= 0) { this.ended = true; this.events.push('end'); break; }
        }
      }
      let write = 0;
      for (const item of this.objects) {
        if (item.consumed || item.y > H + 150) { if (this.pool.length < 70) this.pool.push(item); }
        else this.objects[write++] = item;
      }
      this.objects.length = write;
    }
  }
  const STORAGE_KEY = 'little-game-park.runner.v1';
  function emptyRecords() { return { version: 1, best: {}, history: [], sound: true, vehicle: 'bicycle' }; }
  function cleanRecords(raw) {
    const result = emptyRecords();
    if (!raw || raw.version !== 1) return result;
    result.sound = typeof raw.sound === 'boolean' ? raw.sound : true;
    if (Object.hasOwn(VEHICLES, raw.vehicle)) result.vehicle = raw.vehicle;
    const validNumber = x => Number.isFinite(x) && x >= 0 && x <= 1e9;
    for (const id of Object.keys(VEHICLES)) {
      const item = raw.best && raw.best[id];
      if (item && validNumber(item.score) && validNumber(item.distance)) result.best[id] = { score: Math.floor(item.score), distance: Math.floor(item.distance) };
    }
    if (Array.isArray(raw.history)) result.history = raw.history.filter(r => r && Object.hasOwn(VEHICLES, r.vehicle) && validNumber(r.score) && validNumber(r.distance) && typeof r.date === 'string' && !Number.isNaN(Date.parse(r.date))).slice(0, 20).map(r => ({ vehicle: r.vehicle, score: Math.floor(r.score), distance: Math.floor(r.distance), date: r.date }));
    return result;
  }
  class Records {
    constructor(storage) {
      this.storage = storage; this.available = true; this.corrupt = false; this.data = emptyRecords();
      try {
        const text = storage.getItem(STORAGE_KEY);
        if (text) {
          try { this.data = cleanRecords(JSON.parse(text)); }
          catch (_) { this.corrupt = true; }
        }
      } catch (_) { this.available = false; }
    }
    save() {
      try { this.storage.setItem(STORAGE_KEY, JSON.stringify(this.data)); this.available = true; return true; }
      catch (_) { this.available = false; return false; }
    }
    finish(status, date = new Date().toISOString()) {
      const prior = this.data.best[status.vehicle] || { score: 0, distance: 0 };
      this.data.best[status.vehicle] = { score: Math.max(prior.score, status.score), distance: Math.max(prior.distance, status.distance) };
      this.data.history.unshift({ vehicle: status.vehicle, score: status.score, distance: status.distance, date });
      this.data.history.length = Math.min(this.data.history.length, 20); this.save();
      return status.score > prior.score;
    }
    reset() { const sound = this.data.sound, vehicle = this.data.vehicle; this.data = emptyRecords(); this.data.sound = sound; this.data.vehicle = vehicle; return this.save(); }
  }
  return { W, H, LEFT, RIGHT, PLAYER_Y, LANE_WIDTH, center, clamp, VEHICLES, SCENES, Controls, Game, Records, STORAGE_KEY, inputs, sweptCollision, seededRandom, cleanRecords };
});
