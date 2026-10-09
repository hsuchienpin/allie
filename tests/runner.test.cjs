const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../wwwroot/runner/core.js');
const neutral = { horizontal: 0, speed: 'normal' };
function hit(game, kind = 'obstacle') { game.rowTravel = 0; game.add({ kind, type: kind === 'obstacle' ? 'cactus' : kind, x: game.x, y: game.y, w: 40, h: 40 }); game.step(1 / 60, neutral); }
function memoryStorage() { const data = new Map(); return { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value) }; }

test('multiple pointers and keyboard sources release independently; brake wins and left/right cancel', () => {
  const c = new C.Controls(); c.hold('p:1', 'boost'); c.hold('p:2', 'right'); assert.deepEqual(c.read(), { horizontal: 1, speed: 'boost' });
  c.hold('p:3', 'boost'); c.release('p:1'); assert.equal(c.read().speed, 'boost');
  c.hold('p:4', 'brake'); c.hold('k:left', 'left'); assert.deepEqual(c.read(), { horizontal: 0, speed: 'brake' }); c.release('p:2'); assert.equal(c.read().horizontal, -1);
  c.clear(); assert.deepEqual(c.read(), neutral);
});
test('swept collision catches vertical and horizontal tunneling and rejects separated paths', () => {
  assert.ok(C.sweptCollision({ x: 100, y: 400 }, { x: 100, y: 400 }, { x: 100, y: 100 }, { x: 100, y: 700 }, 20, 30));
  assert.ok(C.sweptCollision({ x: 0, y: 300 }, { x: 200, y: 300 }, { x: 100, y: 300 }, { x: 100, y: 300 }, 20, 30));
  assert.equal(C.sweptCollision({ x: 0, y: 300 }, { x: 200, y: 300 }, { x: 100, y: 500 }, { x: 100, y: 500 }, 20, 30), false);
});
test('collision loses one life, applies protection, ends at zero, and ended games freeze', () => {
  const game = new C.Game('runner', C.seededRandom(1)); hit(game); assert.equal(game.lives, 2); assert.equal(game.hurt, 1.5);
  hit(game); assert.equal(game.lives, 2); game.hurt = 0; hit(game); assert.equal(game.lives, 1); game.hurt = 0; hit(game); assert.equal(game.lives, 0); assert.ok(game.ended);
  const distance = game.distance; game.step(1 / 60, neutral); assert.equal(game.distance, distance);
});
test('car armor absorbs the first collision; star protects and repeated stars refresh to five seconds', () => {
  const car = new C.Game('car'); hit(car); assert.equal(car.armor, 0); assert.equal(car.lives, 3); assert.ok(car.events.includes('armor'));
  car.hurt = 0; hit(car); assert.equal(car.lives, 2);
  const game = new C.Game('bicycle'); hit(game, 'star'); assert.equal(game.invincible, 5); hit(game); assert.equal(game.lives, 3); game.invincible = 1; hit(game, 'star'); assert.equal(game.invincible, 5);
});
test('coin score is awarded once and consumed objects are recycled', () => {
  const game = new C.Game('bicycle'); hit(game, 'coin'); assert.equal(game.coins, 1); const score = game.score; game.step(1 / 60, neutral); assert.equal(game.coins, 1); assert.equal(game.score, score); assert.equal(game.objects.length, 0); assert.ok(game.pool.length > 0);
});
test('braking keeps forward movement, acceleration response differs, and difficulty is capped', () => {
  const values = {};
  for (const id of Object.keys(C.VEHICLES)) { const game = new C.Game(id); game.rowTravel = -1e9; for (let i = 0; i < 30; i++) game.step(1 / 60, { horizontal: 0, speed: 'boost' }); values[id] = game.speed / game.baseSpeed; game.distance = 100000; assert.equal(game.baseSpeed, 320); for (let i = 0; i < 300; i++) game.step(1 / 60, { horizontal: 0, speed: 'brake' }); assert.ok(game.speed >= 320 * .65 - .01); assert.ok(game.speed < 210); }
  assert.ok(values.motorcycle > values.bicycle); assert.ok(C.VEHICLES.runner.lateral > C.VEHICLES.car.lateral);
});
test('horizontal boundaries include the full hitbox; invalid or huge time steps cannot teleport', () => {
  const game = new C.Game('car'); game.rowTravel = -1e9;
  for (let i = 0; i < 300; i++) game.step(1 / 60, { horizontal: -1, speed: 'normal' }); assert.equal(game.x, C.LEFT + game.vehicle.width / 2 + 5);
  for (let i = 0; i < 500; i++) game.step(1 / 60, { horizontal: 1, speed: 'normal' }); assert.equal(game.x, C.RIGHT - game.vehicle.width / 2 - 5);
  const elapsed = game.elapsed; game.step(NaN); game.step(-1); assert.equal(game.elapsed, elapsed); game.step(100); assert.ok(game.elapsed - elapsed <= 1 / 30 + 1e-8);
});
test('all four routes advance at 500 m and cycle seamlessly in logical state', () => {
  const game = new C.Game(); for (const [distance, index] of [[0, 0], [499.9, 0], [500, 1], [1000, 2], [1500, 3], [2000, 0], [4500, 1]]) { game.distance = distance; assert.equal(game.sceneIndex, index); }
  game.distance = 499.99; game.rowTravel = -1e9; game.step(1 / 60); assert.ok(game.events.includes('scene'));
});
test('seeded generation reserves adjacent continuous corridors; moving hazards cannot invade either corridor', () => {
  let checked = 0;
  for (const id of Object.keys(C.VEHICLES)) for (let scene = 0; scene < 4; scene++) for (let seed = 1; seed <= 32; seed++) {
    const game = new C.Game(id, C.seededRandom(seed)); game.distance = scene * 500 + 420;
    for (let row = 0; row < 80; row++) {
      const previous = game.safeLane; game.objects.length = 0; game.spawnRow(); assert.ok(Math.abs(previous - game.safeLane) <= 1);
      for (const item of game.objects.filter(x => x.kind === 'obstacle')) {
        assert.ok(C.SCENES[scene].obstacles.includes(item.type));
        for (const lane of item.reserved) { const clearance = Math.abs(item.homeX - C.center(lane)) - item.span - item.w / 2 - C.VEHICLES.car.width / 2; assert.ok(clearance >= 5, `${id} ${item.type} invades lane ${lane}`); }
        assert.ok(item.homeX - item.span - item.w / 2 >= C.LEFT); assert.ok(item.homeX + item.span + item.w / 2 <= C.RIGHT);
        assert.ok(game.rowGap / (game.baseSpeed * game.vehicle.boost) >= C.LANE_WIDTH / game.vehicle.lateral + .65); checked++;
      }
    }
  }
  assert.ok(checked > 30000);
});
test('15-minute simulated sessions cover all routes and retain bounded live objects and pool', () => {
  for (const id of Object.keys(C.VEHICLES)) {
    const game = new C.Game(id, C.seededRandom(99)), scenes = new Set();
    for (let i = 0; i < 15 * 60 * 60; i++) { game.hurt = 2; game.step(1 / 60, { horizontal: Math.sin(i / 600), speed: i % 1200 < 600 ? 'boost' : 'brake' }); scenes.add(game.sceneIndex); }
    assert.equal(scenes.size, 4); assert.ok(game.distance > 2000); assert.equal(game.ended, false); assert.ok(game.maxObjects <= 70); assert.ok(game.objects.length + game.pool.length <= 70);
  }
});
test('records keep independent score/distance maxima, cap history at 20, and survive reload', () => {
  const storage = memoryStorage(), records = new C.Records(storage);
  records.finish({ vehicle: 'car', score: 1000, distance: 100 }); records.finish({ vehicle: 'car', score: 900, distance: 300 }); assert.deepEqual(records.data.best.car, { score: 1000, distance: 300 });
  for (let i = 0; i < 25; i++) records.finish({ vehicle: 'runner', score: i, distance: i });
  const loaded = new C.Records(storage); assert.equal(loaded.data.history.length, 20); assert.equal(loaded.data.history[0].score, 24); assert.equal(loaded.data.best.car.score, 1000); assert.equal(loaded.data.best.runner.score, 24);
  loaded.reset(); assert.equal(new C.Records(storage).data.history.length, 0);
});
test('corrupt, unavailable and invalid storage recover without blocking play', () => {
  const broken = new C.Records({ getItem: () => '{', setItem() {} }); assert.equal(broken.corrupt, true); assert.deepEqual(broken.data.best, {});
  const blocked = new C.Records({ getItem() { throw Error(); }, setItem() { throw Error(); } }); assert.equal(blocked.available, false); assert.doesNotThrow(() => blocked.finish({ vehicle: 'car', score: 50, distance: 50 })); assert.equal(blocked.data.best.car.score, 50);
  const clean = C.cleanRecords({ version: 1, vehicle: '__proto__', best: { car: { score: NaN, distance: 1 }, runner: { score: -1, distance: 0 } }, history: [{ vehicle: 'car', score: Infinity, distance: 0, date: 'bad' }] }); assert.equal(clean.vehicle, 'bicycle'); assert.equal(clean.history.length, 0); assert.deepEqual(clean.best, {});
});
test('catalog entries and each game entrypoint exist; studio assets remain available', () => {
  const base = path.resolve(__dirname, '../wwwroot'), catalog = JSON.parse(fs.readFileSync(path.join(base, 'portal/games.json'), 'utf8'));
  for (const id of ['studio', 'runner']) assert.ok(catalog.some(game => game.id === id));
  assert.equal(new Set(catalog.map(x => x.id)).size, catalog.length);
  for (const game of catalog) assert.ok(fs.existsSync(path.join(base, game.href, 'index.html')));
  const studio = fs.readFileSync(path.join(base, 'studio/index.html'), 'utf8'); assert.ok(studio.includes('id="layer-bottom"')); assert.ok(studio.includes('返回樂園'));
  const gallery = JSON.parse(fs.readFileSync(path.join(base, 'gallery.json'), 'utf8')); assert.ok(gallery.length > 0);
  for (const card of gallery) assert.ok(fs.existsSync(path.join(base, card.imagePath)), `Missing gallery asset ${card.imagePath}`);
});
