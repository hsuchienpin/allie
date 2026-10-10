'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const C = require('../wwwroot/slice/core.js');
const storage = () => { const values = new Map(); return { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, v) }; };
function advance(game, seconds) { for (let i = 0; i < Math.ceil(seconds * 60); i++) game.step(1 / 60); }
function object(game, type = 'apple', x = 350, y = 250) { const o = game.spawn(type === 'balloon'); Object.assign(o, { type, x, homeX: x, y, amplitude: 0 }); return o; }

test('segment hit testing catches fast passes, accepts expanded edge, rejects distant paths', () => {
  const g = new C.Game(), o = object(g);
  assert.equal(g.swipe({x:0,y:o.y + o.r * 1.21},{x:800,y:o.y + o.r * 1.21}), 0);
  assert.equal(g.swipe({x:0,y:o.y + o.r * 1.19},{x:800,y:o.y + o.r * 1.19}), 1);
  assert.equal(g.energy, 1); assert.equal(g.objects.length, 0);
  assert.equal(g.swipe({x:0,y:o.y},{x:800,y:o.y}), 0); assert.equal(g.energy, 1);
  object(g); assert.equal(g.swipe({x:0,y:500},{x:800,y:500}), 0);
});
test('one swipe cuts multiple objects; threshold freezes additional hits and emits one chest', () => {
  const g = new C.Game({energy:19}); object(g, 'apple', 200); object(g, 'grapes', 600);
  assert.equal(g.swipe({x:0,y:250},{x:900,y:250}), 1); assert.equal(g.energy, 20); assert.equal(g.state, 'chest'); assert.equal(g.objects.length, 1);
  const y = g.objects[0].y; advance(g, 3); assert.equal(g.objects[0].y, y);
  assert.equal(g.takeEvents().filter(e => e.kind === 'chest').length, 1); assert.equal(g.tap(600,250), false);
});
test('sweets produce material-matched crumbs, not unrelated toys or gems',()=>{
  for(const [type,material]of [['apple','gummy'],['grapes','cotton'],['cottonFlower','cotton'],['giftMint','cake'],['meteor','ice']]){
    const g=new C.Game();g.cut(object(g,type));assert.equal(g.pieces.length,2);assert.ok(g.particles.every(p=>p.material===material));assert.equal(g.surprises.length,0);
    if(material==='cake')assert.ok(g.particles.every(p=>p.r<5&&p.gravity>200));
  }
});
test('swipes split sweets along the gesture, with pieces moving apart across the cut',()=>{
  for(const [a,b,expected]of [[{x:0,y:250},{x:800,y:250},0],[{x:350,y:0},{x:350,y:550},Math.PI/2],[{x:0,y:-100},{x:700,y:600},Math.PI/4]]){
    const g=new C.Game({rng:()=>.5});object(g);assert.equal(g.swipe(a,b),1);const [p,q]=g.pieces;assert.ok(Math.abs(p.cutAngle-expected)<1e-8);const dx=b.x-a.x,dy=b.y-a.y;assert.ok((q.vx-p.vx)*(-dy)+(q.vy-p.vy)*dx>0);assert.equal(g.energy,1);
  }
});
test('balloon requires separate traversals or real reversals; stationary and small jitter cannot fill it', () => {
  const g = new C.Game(), b = object(g,'balloon',480,250);
  g.swipe({x:200,y:250},{x:480,y:250},1); assert.equal(b.hits,1);
  for(let i=0;i<60;i++){ g.step(1/60); g.swipe({x:480,y:b.y},{x:480,y:b.y},1); }
  assert.equal(b.hits,1);
  g.swipe({x:480,y:b.y},{x:483,y:b.y},1); advance(g,.2); g.swipe({x:483,y:b.y},{x:480,y:b.y},1); assert.equal(b.hits,1);
  for(let i=0;i<100;i++){ advance(g,.02); g.swipe({x:480 + (i%2)*3,y:b.y},{x:483 - (i%2)*3,y:b.y},1); }
  assert.equal(b.hits,1);
  g.swipe({x:480,y:b.y},{x:620,y:b.y},1); advance(g,.2); g.swipe({x:620,y:b.y},{x:350,y:b.y},1); assert.equal(b.hits,3);
  for(let i=0;i<5;i++){ advance(g,.2); g.release(1); g.swipe({x:0,y:b.y},{x:950,y:b.y},1); }
  assert.equal(g.objects.length,0); assert.equal(g.energy,3); assert.equal(g.cuts,1);
});
test('balloon takes eight hits; keyboard activation debounce prevents repeated hits', () => {
  const g = new C.Game(), b = object(g,'balloon',480,250);
  for(let i=0;i<7;i++){ advance(g,.2); assert.equal(g.tap(b.x,b.y),true); assert.equal(g.tap(b.x,b.y),false); }
  assert.equal(b.hits,7); assert.equal(g.objects.length,1); advance(g,.2); g.tap(b.x,b.y); assert.equal(g.objects.length,0);
});
test('missing normal objects or the balloon keeps energy and allows continued play', () => {
  const g = new C.Game({energy:6}); object(g,'apple',300,g.height + 120); object(g,'balloon',480,g.height + 500); g.balloonUsed = true;
  g.step(1/60); assert.equal(g.energy,6); assert.equal(g.state,'running');
  assert.equal(g.takeEvents().filter(e=>e.kind==='miss').length,2); advance(g,4); assert.ok(g.objects.length > 0);
});
test('balloon event clears the ordinary wave and is limited to one per round', () => {
  const g = new C.Game(); g.cuts=9; const a=object(g); g.step(.02); assert.equal(g.objects.length,1); assert.equal(g.objects[0].type,'apple');
  g.cut(a); g.step(.02); assert.equal(g.objects.length,1); assert.equal(g.objects[0].type,'balloon'); assert.ok(g.balloonUsed);
  const b=g.objects[0]; b.y=g.height+500; g.step(.02); advance(g,4); assert.ok(g.objects.every(o=>o.type!=='balloon'));
  g.nextRound(); assert.equal(g.balloonUsed,false); assert.equal(g.energy,0);
});
test('pause freezes objects and effects; resizing maintains positions and clears stale gestures', () => {
  const g=new C.Game({width:960,height:600}); const o=object(g); g.burst(o.x,o.y,10); g.gestures.set(1,{}); g.pause();
  const snapshot=JSON.stringify([g.objects,g.particles,g.time]); advance(g,2); assert.equal(JSON.stringify([g.objects,g.particles,g.time]),snapshot); assert.equal(g.gestures.size,0);
  g.resize(480,900); assert.equal(o.x,175); assert.equal(o.y,375); g.resume(); g.step(1/60); assert.ok(o.y>375);
  const before=g.time; g.step(NaN);g.step(-1);g.step(100);assert.ok(g.time-before<=.05+1e-9);
});
test('pending rewards survive reload, prefer uncollected stickers, and cannot be claimed twice', () => {
  const s=storage(), r=new C.Records(s); r.start(); r.slice(10);
  for(let i=0;i<12;i++){
    const p=r.prepare(()=>0); assert.equal(p.sticker,i); assert.deepEqual(r.prepare(()=>.99),p);
    const restored=new C.Records(s); assert.deepEqual(restored.data.pending,p);
    const result=r.claim(p.id);assert.ok(result.fresh);assert.equal(r.claim(p.id),null);
  }
  assert.equal(r.data.stickers.length,12); const p=r.prepare(()=>0);assert.equal(r.claim(p.id).fresh,false);
  const restored=new C.Records(s);assert.equal(restored.data.sessions,1);assert.equal(restored.data.slices,1);assert.equal(restored.data.pending,null);
});
test('records reject corrupt values and fall back to memory when storage is blocked', () => {
  const s=storage();s.setItem(C.KEY,JSON.stringify({sessions:-4,slices:'NaN',energy:900,stickers:[0,0,-1,12,'1'],settings:{theme:'unknown',mode:'bad',sound:'yes'},pending:{id:1,sticker:999}}));
  const r=new C.Records(s);assert.equal(r.data.sessions,0);assert.equal(r.data.energy,19);assert.deepEqual(r.data.stickers,[0]);assert.equal(r.data.pending,null);assert.equal(r.data.settings.theme,undefined);
  const bad=new C.Records({getItem(){throw Error();},setItem(){throw Error();}}); bad.start();bad.slice(3);const p=bad.prepare(()=>0);assert.ok(bad.claim(p.id));assert.equal(bad.available,false);assert.equal(bad.data.stickers.length,1);
});
test('15-minute mixed-round simulations across aspect ratios keep effects bounded', () => {
  let balloons=0, chests=0;
  for(const [width,height] of [[390,680],[1024,680]]){
    const g=new C.Game({width,height,rng:C.seededRandom(19)});
    for(let i=0;i<15*60*60;i++){
      g.step(1/60);
      if(i%15===0)for(const o of [...g.objects])if(o.y>o.r && o.y<g.height-o.r){const was=o.type==='balloon';g.tap(o.x,o.y);if(was&&!g.objects.includes(o))balloons++;}
      if(g.state==='chest'){chests++;g.nextRound();}
      g.takeEvents();assert.ok(g.objects.length<=g.spec.max);assert.ok(g.particles.length<=360);assert.ok(g.pieces.length<=30);assert.ok(g.surprises.length<=12);assert.ok(g.gestures.size<=2);
    }
  }
  assert.ok(balloons>30);assert.ok(chests>30);
});
test('all eleven treats are reachable in one round, with local assets', () => {
  const g=new C.Game({rng:C.seededRandom(99)}),seen=new Set();
  for(let i=0;i<160;i++){seen.add(g.spawn().type);g.objects.length=0;}assert.equal(seen.size,11);assert.deepEqual([...seen].sort(),[...C.ITEMS].sort());
  const root=path.join(__dirname,'..','wwwroot');const catalog=JSON.parse(fs.readFileSync(path.join(root,'portal/games.json')));
  const entry=catalog.find(g=>g.id==='slice');assert.equal(entry.href,'/slice/');assert.ok(fs.existsSync(path.join(root,entry.image)));
  for(const f of ['index.html','core.js','renderer.js','app.js','style.css','assets/sprites.png','assets/stickers.png','assets/slice.wav','assets/pop.wav','assets/progress.wav','assets/burst.wav','assets/chest.wav','assets/cheer.wav'])assert.ok(fs.statSync(path.join(root,'slice',f)).size>0,f);
});

test('old easy/theme choices cannot change the fixed pace or erase saved progress and pending reward',()=>{
  const s=storage(),epoch='slice:12345678-1234-1234-1234-123456789abc';
  s.setItem(C.KEY,JSON.stringify({energy:14,serial:8,rewardEpoch:epoch,settings:{theme:'toys',mode:'gentle',tap:true,sound:false,reduced:true}}));
  const r=new C.Records(s);assert.equal(r.data.energy,14);assert.equal(r.data.rewardEpoch,epoch);assert.deepEqual(r.data.settings,{sound:false,vibration:false,reduced:true});
  const g=new C.Game({theme:'toys',mode:'gentle',energy:r.data.energy});assert.equal(g.spec.travel,11);assert.equal(g.spec.interval,1.9);assert.equal(g.spec.max,5);assert.equal(g.spec.hit,1.2);assert.equal(g.spec.balloonHits,8);assert.equal(g.energy,14);
  const pending=r.prepare(()=>0);assert.deepEqual(new C.Records(s).data.pending,pending);
});
