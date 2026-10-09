const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../wwwroot/bowling/core.js');
function memoryStorage() { const m = new Map(); return { getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),m }; }
function shot(game,angle=0,reduced=false) {
  game.aim(angle);assert.equal(game.launch(),true);assert.equal(game.launch(),false);
  const events=[];let steps=0;
  while(!['next','result'].includes(game.state)&&steps++<720){game.step(1/60,reduced);events.push(...game.drainEvents());}
  assert.ok(steps<720,'shot must finish in 12 seconds');
  assert.ok(game.ratios.at(-1)>0,'every throw must hit a target');
  return events;
}
function round(options={}) { const game=new C.Game({random:C.seededRandom(2),...options});do{shot(game,options.angle||0);if(game.state==='next')game.next();}while(game.state!=='result');return game; }
test('hundred-pin mode really has 100 unique targets; all nine masks have targets',()=>{
  const game=new C.Game({schedule:['hundred'],random:C.seededRandom(1)});assert.equal(game.pins.length,100);assert.equal(new Set(game.pins.map(p=>`${p.x},${p.y}`)).size,100);
  for(const shape of Object.keys(C.MASKS)){const pins=C.makePins('shapes',shape,C.seededRandom(9));assert.ok(pins.length>=7);assert.ok(pins.every(p=>Math.abs(p.x)+p.r<335&&p.y>=720&&p.y<1000));}
});
test('all modes, 25 angles and eight seeds finish and hit; reduced effects preserve playability',()=>{
  for(const mode of Object.keys(C.MODES))for(let seed=1;seed<=8;seed++)for(let i=0;i<25;i++){
    const angle=-1.06+2.12*i/24,options={schedule:[mode],random:C.seededRandom(seed)};
    const a=new C.Game(options),b=new C.Game({...options,random:C.seededRandom(seed)});
    shot(a,angle);shot(b,angle,true);assert.ok(a.ball.x>=-335&&a.ball.x<=335);assert.ok(a.ratios[0]>0&&b.ratios[0]>0);
    assert.ok(a.trail.length<=28&&b.trail.length<=8);assert.ok(a.totalKnocked<=a.pins.length);
  }
});
test('accelerated swept collisions catch objects between positions',()=>{
  assert.equal(C.sweptHit({x:0,y:0},{x:0,y:1000},{x:0,y:500},10),true);
  assert.equal(C.sweptHit({x:0,y:0},{x:0,y:1000},{x:35,y:500},10),false);
});
test('a hundred-pin center throw cascades all pins, never awards a pin twice',()=>{
  const game=new C.Game({schedule:['hundred'],random:C.seededRandom(33)});shot(game);assert.equal(game.knocked,100);assert.equal(game.totalKnocked,100);assert.equal(game.knock(game.pins[0]),false);assert.equal(game.totalKnocked,100);
});
test('boost, jump and spring events fire; finite rescue ends a stalled path',()=>{
  for(const [mode,event] of [['boost','boost'],['ramp','jump'],['bumper','spring']]){
    const game=new C.Game({schedule:[mode],random:C.seededRandom(3)});const events=shot(game,mode==='bumper'?-.2:0);assert.ok(events.some(e=>e.type===event),mode+' should trigger '+event);
  }
  const g=new C.Game({schedule:['hundred']});g.launch();g.ball.vx=0;g.ball.vy=0;
  for(let i=0;i<720&&!['next','result'].includes(g.state);i++)g.step(1/60);
  assert.ok(g.assisted);assert.equal(g.state,'next');assert.ok(g.knocked>0);
});
test('monster retains health for three/five throws and takes damage once per throw',()=>{
  for(const count of [3,5]){const game=new C.Game({count,schedule:['monster'],random:C.seededRandom(4)});
    for(let i=0;i<count;i++){shot(game,i%2?1.06:-1.06);assert.equal(game.monsterHP,count-i-1);game.hitMonster();assert.equal(game.monsterHP,count-i-1);if(i<count-1){assert.equal(game.totalKnocked,0);game.next();}}
    assert.equal(game.completed,true);assert.equal(game.totalKnocked,1);assert.equal(game.stars,3);
  }
});
test('pause freezes simulation and launch; invalid time and angles cannot teleport',()=>{
  const g=new C.Game({firstAdventure:true});assert.equal(g.mode,'hundred');g.aim(Infinity);assert.equal(g.angle,0);g.aim(100);assert.equal(g.angle,1.06);g.paused=true;assert.equal(g.launch(),false);g.step(1);assert.equal(g.clock,0);g.paused=false;g.launch();g.step(NaN);g.step(-2);assert.equal(g.clock,0);g.step(100);assert.ok(g.clock<=1/30);const clock=g.clock,y=g.ball.y;g.paused=true;g.step(1/60);assert.equal(g.clock,clock);assert.equal(g.ball.y,y);
});
test('bag has no repeated mode and new shots reset transient state',()=>{
  const g=new C.Game({count:5,random:C.seededRandom(22),firstAdventure:true});const modes=[];for(let i=0;i<5;i++){modes.push(g.mode);shot(g,.9);if(g.state==='next'){g.next();assert.equal(g.trail.length,0);assert.equal(g.knocked,0);assert.equal(g.slow,0);}}assert.equal(new Set(modes).size,5);assert.equal(g.ratios.length,5);assert.equal(g.progress,g.ratios.reduce((a,b)=>a+b,0)/5);
});
test('reward is once per completed round; unlocks gated; all 12 stickers unique',()=>{
  const storage=memoryStorage(),s=new C.Store(storage),unfinished=new C.Game();assert.equal(s.claim(unfinished),null);assert.equal(s.select('ball','magic'),false);const earned=[];
  for(let i=0;i<13;i++){const g=round({schedule:['hundred']});const r=s.claim(g);assert.equal(r.stars,3);assert.equal(s.claim(g),null);if(r.sticker)earned.push(r.sticker[0]);}
  assert.equal(s.data.stars,39);assert.equal(s.data.rounds,13);assert.equal(new Set(earned).size,12);assert.equal(s.data.stickers.length,12);assert.equal(s.select('ball','magic'),true);assert.equal(s.select('target','jelly'),true);const restored=new C.Store(storage);assert.equal(restored.data.ball,'magic');assert.equal(restored.data.target,'jelly');assert.equal(restored.data.stars,39);
});
test('blocked, malformed, versioned and quota storage fall back without stopping play',()=>{
  const bad=new C.Store({getItem(){throw Error('blocked');},setItem(){throw Error('quota');}});assert.equal(bad.available,false);const g=round({schedule:['hundred']});assert.equal(bad.claim(g).stars,3);assert.equal(bad.data.stars,3);assert.equal(bad.available,false);
  const storage=memoryStorage();storage.setItem(C.KEY,'{');const s=new C.Store(storage);assert.equal(s.data.stars,0);assert.equal(s.available,false);
  const p=C.validProgress({version:1,stars:-1,rounds:NaN,stickers:['heart','heart','evil'],ball:'magic',target:'jelly',count:99});assert.equal(p.ball,'magic');assert.equal(p.target,'jelly');assert.equal(p.count,3);assert.deepEqual(p.stickers,['heart']);assert.equal(C.validProgress({version:2,stars:999}).stars,0);
});
test('15-minute simulated play remains bounded and covers all seven modes',()=>{
  const modes=Object.keys(C.MODES),seen=new Set();let simulated=0,rounds=0;
  while(simulated<900){const g=new C.Game({schedule:[modes[rounds%modes.length]],random:C.seededRandom(rounds+1)});while(!g.completed){if(g.state==='aim')g.launch();g.step(1/60);simulated+=1/60;assert.ok(g.pins.length<=100);assert.ok(g.trail.length<=28);seen.add(g.mode);if(g.state==='next')g.next();}rounds++;}assert.equal(seen.size,7);assert.ok(rounds>25);
});
test('catalog/resources exist locally and game source has no fetch/XHR/external CDN',()=>{
  const root=path.join(__dirname,'../wwwroot'),catalog=JSON.parse(fs.readFileSync(path.join(root,'portal/games.json'),'utf8'));const item=catalog.find(i=>i.id==='bowling');assert.equal(item.href,'/bowling/');assert.ok(fs.existsSync(path.join(root,item.image)));assert.equal(new Set(catalog.map(i=>i.id)).size,catalog.length);
  for(const name of ['index.html','core.js','renderer.js','app.js','style.css','assets/sprites.png'])assert.ok(fs.existsSync(path.join(root,'bowling',name)));
  for(const name of ['core.js','renderer.js','app.js']){const source=fs.readFileSync(path.join(root,'bowling',name),'utf8');assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|https?:\/\//);}
});
