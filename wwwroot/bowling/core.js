(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BowlingCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY = 'little-game-park.bowling.v1';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const BALLS = [
    { id: 'watermelon', name: 'Pink Ball', stars: 0, sprite: 0 },
    { id: 'donut', name: 'Blue Ball', stars: 3, sprite: 1 },
    { id: 'hedgehog', name: 'Mint Ball', stars: 6, sprite: 2 },
    { id: 'magic', name: 'Rainbow Ball', stars: 10, sprite: 3 }
  ];
  const TARGETS = [
    { id: 'pin', name: 'Happy Pins', stars: 0, sprite: 4 },
    { id: 'alien', name: 'Balloons', stars: 4, sprite: 5 },
    { id: 'castle', name: 'Castle', stars: 8, sprite: 6 },
    { id: 'jelly', name: 'Jelly', stars: 12, sprite: 7 }
  ];
  const STICKERS = [
    ['heart', '愛心', '♥'], ['star', '小星星', '★'], ['rainbow', '彩虹', '🌈'],
    ['sun', '太陽', '☀'], ['watermelon', '西瓜', '🍉'], ['flower', '花朵', '🌼'],
    ['butterfly', '蝴蝶', '🦋'], ['rocket', '火箭', '🚀'], ['castle', '城堡', '🏰'],
    ['balloon', '氣球', '🎈'], ['donut', '甜甜圈', '🍩'], ['crown', '皇冠', '👑']
  ];
  const MODES = {
    hundred: { name: 'Lots of Pins', hint: '一起滾出大大的快樂！' },
    shapes: { name: 'Shapes', hint: '找一找，今天是什麼形狀？' },
    ramp: { name: 'Jump!', hint: '飛起來，咻！' },
    boost: { name: 'Fast!', hint: '踩到箭頭，飛快向前！' },
    bumper: { name: 'Bounce!', hint: '彈一下，再彈一下！' },
    giant: { name: 'Big Ball', hint: '大大的球，大大的驚喜！' },
    monster: { name: 'Jelly Friend', hint: '讓大朋友搖搖晃晃！' }
  };
  const MASKS = {
    '星星': ['0001000','1001001','0111110','0011100','0111110','0100010'],
    '愛心': ['0110110','1111111','1111111','0111110','0011100','0001000'],
    '笑臉': ['0111110','1000001','1010101','1000001','1011101','1000001','0111110'],
    'A': ['00100','01010','10001','11111','10001','10001'],
    'B': ['11110','10001','11110','10001','10001','11110'],
    'C': ['01111','10000','10000','10000','10000','01111'],
    '1': ['00100','01100','00100','00100','00100','01110'],
    '2': ['01110','10001','00010','00100','01000','11111'],
    '3': ['11110','00001','01110','00001','00001','11110']
  };
  function seededRandom(seed) {
    let v = seed >>> 0;
    return () => { v += 0x6D2B79F5; let t = v; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function shuffle(list, random) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  // Segment-circle distance catches accelerated balls between simulation steps.
  function sweptHit(a, b, p, radius) {
    const dx = b.x - a.x, dy = b.y - a.y, d = dx * dx + dy * dy;
    const t = d ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / d, 0, 1) : 0;
    return (a.x + t * dx - p.x) ** 2 + (a.y + t * dy - p.y) ** 2 <= radius * radius;
  }
  function makePins(mode, shape, random) {
    const positions = [];
    if (mode === 'monster') positions.push([0, 850]);
    else if (mode === 'hundred') {
      for (let row = 0; row < 10; row++) for (let col = 0; col < 10; col++) positions.push([(col - 4.5) * 43, 745 + row * 23]);
    } else if (mode === 'shapes') {
      const mask = MASKS[shape] || MASKS['愛心'];
      // First mask row is the farthest row so symbols face the player correctly.
      mask.forEach((row, i) => [...row].forEach((v, j) => { if (v === '1') positions.push([(j - (row.length - 1) / 2) * 65, 945 - i * 34]); }));
    } else {
      for (let row = 0; row < 6; row++) for (let col = 0; col <= row; col++) positions.push([(col - row / 2) * 68, 750 + row * 37]);
    }
    return positions.map(([x, y], id) => ({ id, x, y, homeX: x, homeY: y, down: false, chainAt: Infinity, vx: 0, vy: 0, z: 0, vz: 0, rotation: 0, spin: 0, age: 0, r: mode === 'monster' ? 72 : 20, phase: random() * 6.28 }));
  }
  class Game {
    constructor(options = {}) {
      this.random = options.random || Math.random;
      this.count = options.count === 5 ? 5 : 3;
      this.schedule = Array.isArray(options.schedule) ? options.schedule.filter(m => Object.hasOwn(MODES, m)) : null;
      this.monsterRound = this.schedule ? this.schedule[0] === 'monster' : !options.firstAdventure && this.random() < .14;
      this.bag = shuffle(['hundred','shapes','ramp','boost','bumper','giant'], this.random);
      if (options.firstAdventure && !this.schedule) this.bag = ['hundred', ...this.bag.filter(m => m !== 'hundred')];
      this.index = 0; this.ratios = []; this.totalKnocked = 0; this.monsterHP = this.count;
      this.state = 'aim'; this.paused = false; this.completed = false; this.events = []; this.clock = 0;
      this.setupShot();
    }
    setupShot() {
      if (!this.bag.length) this.bag = shuffle(['hundred','shapes','ramp','boost','bumper','giant'], this.random);
      this.mode = this.monsterRound ? 'monster' : this.schedule ? this.schedule[this.index % this.schedule.length] : this.bag.shift();
      this.shape = Object.keys(MASKS)[Math.floor(this.random() * Object.keys(MASKS).length)];
      this.pins = makePins(this.mode, this.shape, this.random);
      this.ball = { x: 0, y: 80, vx: 0, vy: 0, r: this.mode === 'giant' ? 110 : 36, z: 0, rotation: 0 };
      this.bumpers = this.mode === 'bumper' ? [{ x: -105, y: 370, r: 56, flash: 0 }, { x: 120, y: 545, r: 56, flash: 0 }] : [];
      this.angle = 0; this.state = 'aim'; this.knocked = 0; this.rollTime = 0; this.effectsTime = 0;
      this.slow = 0; this.boosted = false; this.jumped = false; this.assisted = false; this.rescued = false; this.monsterHit = false; this.firstImpact = false;
      this.aimElapsed = 0; this.trail = []; this.events = [];
    }
    get title() { return MODES[this.mode].name + (this.mode === 'shapes' ? ' · ' + ({'星星':'Star','愛心':'Heart','笑臉':'Smile','箭頭':'Arrow','蝴蝶':'Butterfly','花朵':'Flower','月亮':'Moon','皇冠':'Crown','彩虹':'Rainbow'}[this.shape]||'Fun') : ''); }
    get ratio() { return this.mode === 'monster' ? Number(this.monsterHit) : this.knocked / this.pins.length; }
    get progress() { return clamp((this.ratios.reduce((a,b) => a+b, 0) + (['rolling','celebrate'].includes(this.state) ? this.ratio : 0)) / this.count, 0, 1); }
    get stars() { const mean = this.ratios.reduce((a,b) => a+b, 0) / this.count; return 1 + Number(mean >= .5) + Number(mean >= .85); }
    aim(value) { if (this.state === 'aim' && !this.paused && Number.isFinite(value)) this.angle = clamp(value, -1.06, 1.06); }
    launch() {
      if (this.state !== 'aim' || this.paused) return false;
      this.ball.vx = Math.sin(this.angle) * 420; this.ball.vy = Math.cos(this.angle) * 420;
      this.state = 'rolling'; this.events.push({ type: 'launch' }); return true;
    }
    knock(pin, power = 1) {
      if (pin.down || this.mode === 'monster') return false;
      pin.down = true; pin.chainAt = Infinity; this.knocked++; this.totalKnocked++;
      pin.vx = (this.random() - .5) * 540 * power; pin.vy = (this.random() - .25) * 360;
      pin.z = 2; pin.vz = 180 + this.random() * 240; pin.spin = (this.random() - .5) * 11; pin.age = 0;
      this.events.push({ type: 'knock', x: pin.x, y: pin.y });
      // Bounded propagation gives the hundred-pin firework a readable cascade.
      const reach = this.mode === 'hundred' ? 76 : this.mode === 'giant' ? 160 : 84;
      for (const other of this.pins) if (!other.down && Math.hypot(pin.homeX - other.homeX, pin.homeY - other.homeY) < reach) other.chainAt = Math.min(other.chainAt, this.effectsTime + .04 + this.random() * .1);
      if (!this.firstImpact) { this.firstImpact = true; this.slow = .32; this.events.push({ type: 'impact' }); }
      return true;
    }
    hitMonster() {
      if (this.monsterHit) return;
      this.monsterHit = true; this.monsterHP = Math.max(0, this.monsterHP - 1);
      this.knocked = this.monsterHP === 0 ? 1 : 0; this.totalKnocked += this.knocked;
      this.firstImpact = true; this.slow = .32;
      this.events.push({ type: this.monsterHP === 0 ? 'monster-down' : 'monster-hit', x: 0, y: 850 });
      if (!this.monsterHP) { const p = this.pins[0]; p.down = true; p.vz = 180; p.vx = 90; p.spin = 2; }
    }
    step(dt, reduced = false) {
      if (!Number.isFinite(dt) || dt <= 0 || this.paused || this.state === 'result') return;
      dt = Math.min(dt, 1 / 30); this.clock += dt;
      if (this.state === 'aim') { this.aimElapsed += dt; return; }
      if (this.state === 'next') return;
      this.rollTime += dt;
      const physicsDt = dt * (this.slow > 0 && !reduced ? .3 : 1);
      this.slow = Math.max(0, this.slow - dt); this.effectsTime += physicsDt;
      for (const p of this.pins) {
        if (!p.down && p.chainAt <= this.effectsTime) this.knock(p);
        if (p.down) {
          p.age += dt; p.x += p.vx * physicsDt; p.y += p.vy * physicsDt;
          p.vz -= 510 * physicsDt; p.z = Math.max(0, p.z + p.vz * physicsDt); p.rotation += p.spin * physicsDt;
          if (p.z === 0) { p.vx *= .9; p.vy *= .9; p.spin *= .92; }
        }
      }
      if (this.state === 'celebrate') {
        this.settle += dt;
        if (this.settle > 1.65) this.finishShot();
        return;
      }
      const b = this.ball, before = { x: b.x, y: b.y };
      // Guidance happens before the pin deck, allowing bumpers to remain fun.
      if (b.y > 620 && !this.firstImpact) {
        const target = this.pins.reduce((best,p) => !p.down && (!best || Math.hypot(p.x-b.x,p.y-b.y) < Math.hypot(best.x-b.x,best.y-b.y)) ? p : best, null);
        if (target) b.vx += clamp((target.x - b.x) * 4 - b.vx, -900 * physicsDt, 900 * physicsDt);
        b.vy = Math.max(230, b.vy);
      }
      b.x += b.vx * physicsDt; b.y += b.vy * physicsDt; b.rotation += Math.hypot(b.vx,b.vy) * physicsDt / b.r;
      const bound = 335 - b.r;
      if (b.x < -bound || b.x > bound) { b.x = clamp(b.x, -bound, bound); b.vx = -b.vx * .88; b.vy = Math.max(b.vy, 230); this.events.push({ type: 'bounce' }); }
      for (const bumper of this.bumpers) {
        bumper.flash = Math.max(0, bumper.flash - dt);
        if (sweptHit(before, b, bumper, b.r + bumper.r) && bumper.flash === 0) {
          const dx = b.x-bumper.x, dy = b.y-bumper.y, len = Math.hypot(dx,dy) || 1;
          b.x = bumper.x + dx / len * (b.r + bumper.r + 3);
          b.y = bumper.y + dy / len * (b.r + bumper.r + 3);
          b.vx = clamp(dx / len * 540, -500, 500); b.vy = Math.max(160, Math.abs(dy / len * 480)); bumper.flash = .25;
          this.events.push({ type: 'spring' });
        }
      }
      if (this.mode === 'boost' && b.y > 420 && !this.boosted) { this.boosted = true; b.vx *= 1.5; b.vy = Math.max(b.vy * 2, 700); this.events.push({ type: 'boost' }); }
      if (this.mode === 'ramp' && b.y > 425 && !this.jumped) { this.jumped = true; this.jumpStart = this.effectsTime; this.events.push({ type: 'jump' }); }
      if (this.jumped) { const t = this.effectsTime - this.jumpStart; b.z = t < 1.05 ? Math.max(0, 370*t - 350*t*t) : 0; }
      for (const p of this.pins) if (!p.down && b.z < 82 && sweptHit(before, b, p, b.r + p.r)) {
        if (this.mode === 'monster') this.hitMonster(); else this.knock(p, this.mode === 'giant' ? 1.4 : 1);
      }
      this.trail.push({ x: b.x, y: b.y, z: b.z }); if (this.trail.length > (reduced ? 8 : 28)) this.trail.shift();
      // A finite rescue handles every angle/obstacle path, independent of luck.
      if (!this.firstImpact && (this.rollTime > 5 || b.y > 1040)) {
        const target = this.pins.find(p => !p.down);
        if (target) { b.x = target.x; b.y = target.y; b.z = 0; this.assisted = true; if (this.mode === 'monster') this.hitMonster(); else this.knock(target); this.events.push({ type: 'rescue' }); }
      }
      if (this.firstImpact && (b.y > 1050 || this.rollTime > 6 || (this.mode === 'monster' && this.monsterHit))) { this.state = 'celebrate'; this.settle = 0; }
    }
    finishShot() {
      if (this.state !== 'celebrate') return;
      this.ratios.push(this.ratio); this.state = this.index + 1 >= this.count ? 'result' : 'next';
      if (this.state === 'result') this.completed = true;
      this.events.push({ type: this.completed ? 'result' : 'next' });
    }
    next() { if (this.state !== 'next' || this.paused) return false; this.index++; this.setupShot(); return true; }
    drainEvents() { return this.events.splice(0); }
    aimPath() {
      const result = [{ x: 0, y: 80 }]; let x = 0, y = 80, vx = Math.sin(this.angle)*420, vy = Math.cos(this.angle)*420;
      const bound = 335 - this.ball.r;
      for (let i = 0; i < 20; i++) { x += vx * .09; y += vy * .09; if (x < -bound || x > bound) { x = clamp(x, -bound, bound); vx = -vx; } result.push({x,y}); if (y > 720) break; }
      return result;
    }
  }
  function defaults() { return { version: 1, stars: 0, rounds: 0, stickers: [], ball: 'watermelon', target: 'pin', count: 3, sound: true, reduced: false }; }
  function validProgress(raw) {
    const p = defaults(); if (!raw || raw.version !== 1) return p;
    for (const key of ['stars','rounds']) if (Number.isSafeInteger(raw[key]) && raw[key] >= 0) p[key] = Math.min(raw[key], 1000000);
    p.stickers = Array.isArray(raw.stickers) ? [...new Set(raw.stickers.filter(id => STICKERS.some(s => s[0] === id)))].slice(0,12) : [];
    for (const [key, list] of [['ball', BALLS], ['target', TARGETS]]) if (list.some(i => i.id === raw[key])) p[key] = raw[key];
    p.count = raw.count === 5 ? 5 : 3;
    p.sound = typeof raw.sound === 'boolean' ? raw.sound : true; p.reduced = raw.reduced === true; return p;
  }
  class Store {
    constructor(storage) { this.storage = storage; this.available = true; this.claimed = new WeakSet(); this.error = '';
      try { const raw = storage.getItem(KEY); this.data = validProgress(raw ? JSON.parse(raw) : null); }
      catch (_) { this.data = defaults(); this.available = false; this.error = '紀錄暫存於目前頁面，關閉後可能消失。'; }
    }
    save() { try { this.storage.setItem(KEY, JSON.stringify(this.data)); this.available = true; this.error = ''; } catch (_) { this.available = false; this.error = '紀錄暫存於目前頁面，關閉後可能消失。'; } return this.available; }
    select(key, id) { const list = key === 'ball' ? BALLS : key === 'target' ? TARGETS : []; if (!list.some(i => i.id === id && i.stars <= this.data.stars)) return false; this.data[key] = id; this.save(); return true; }
    claim(game) {
      if (!game.completed || this.claimed.has(game)) return null;
      this.claimed.add(game);
      const before = this.data.stars, stars = game.stars;
      this.data.stars = Math.min(1000000, before + stars); this.data.rounds = Math.min(1000000, this.data.rounds + 1);
      const sticker = STICKERS.find(s => !this.data.stickers.includes(s[0]));
      if (sticker) this.data.stickers.push(sticker[0]);
      const unlocked = [...BALLS, ...TARGETS].filter(i => i.stars > before && i.stars <= this.data.stars).map(i => i.name);
      this.save(); return { stars, sticker: sticker || null, unlocked, collectionComplete: !sticker };
    }
    reset() { this.data = defaults(); this.save(); }
  }
  return { Game, Store, KEY, BALLS, TARGETS, STICKERS, MODES, MASKS, clamp, seededRandom, sweptHit, makePins, validProgress };
});
