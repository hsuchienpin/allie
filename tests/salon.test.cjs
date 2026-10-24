const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../wwwroot/salon/core.js');

test('hair can be cut at the touched length and regrown or undone with makeup intact', () => {
  const state = C.fresh(), motion = C.newMotion(), h = new C.History(state);
  state.strokes.push({tool:'lipstick',color:'#bd5d78',size:20,mirror:false,points:[[300,395]]}); h.push(state);
  const s = C.template.find(s => s.layer === 'side'), p = C.point(s, .65);
  const removed = C.cut(state, motion, p);
  assert.ok(removed.length); assert.ok(state.lengths[s.id] < .7); assert.ok(state.lengths[s.id] > .5);
  assert.equal(state.strokes.length, 1); h.push(state);
  assert.ok(h.undo()); assert.equal(h.current.lengths[s.id], 1); assert.equal(h.current.strokes.length, 1);
  assert.ok(h.redo()); assert.ok(h.current.lengths[s.id] < .7);
  const restore = {...C.clone(state), lengths:C.fresh().lengths}; h.push(restore);
  assert.ok(h.current.lengths.every(n => n === 1)); assert.equal(h.current.strokes.length, 1);
  assert.ok(h.undo()); assert.ok(h.current.lengths[s.id] < .7);
});
test('touching face cannot cut the back hair hidden behind it', () => {
  const state = C.fresh();
  for (const p of [{x:300,y:300},{x:270,y:340},{x:300,y:510}]) C.cut(state, C.newMotion(), p, 1);
  for (const s of C.template.filter(s => s.layer === 'back')) assert.equal(state.lengths[s.id], 1);
});
test('scissors follow a blown hair ribbon instead of its old resting position', () => {
  const state = C.fresh(), motion = C.newMotion(), s = C.template.find(s => s.layer === 'side');
  motion[s.id].bend = -110;
  const removed = C.cut(state, motion, C.point(s, .8, -110), 2);
  assert.ok(removed.some(r => r.strand.id === s.id)); assert.ok(state.lengths[s.id] < .85);
});
test('fringe can be shortened and repeated cuts never create invalid lengths', () => {
  const state = C.fresh(), motion = C.newMotion(), s = C.template.find(s => s.layer === 'fringe');
  C.cut(state, motion, C.point(s, .55), 2); assert.ok(state.lengths[s.id] < .7);
  for (let i=0;i<80;i++) for (const h of C.template) C.cut(state, motion, C.point(h,.01), 15);
  assert.ok(state.lengths.every(n => n >= .16 && n <= 1));
});
test('nearby wind bends hair, distant wind does not, and released hair settles', () => {
  const state = C.fresh(), motion = C.newMotion(), far = C.newMotion();
  for(let i=0;i<120;i++) { C.advance(state,motion,{x:100,y:380,power:1},1/60); C.advance(state,far,{x:-1000,y:-1000,power:1},1/60); }
  assert.ok(motion.some(m=>Math.abs(m.bend)>30)); assert.ok(far.every(m=>m.bend===0));
  for(let i=0;i<1000;i++) C.advance(state,motion,null,1/60);
  assert.ok(motion.every(m=>m.bend===0&&m.velocity===0)); assert.ok(state.lengths.every(n=>n===1));
});
test('wind stays finite at uneven frame rates and never changes saved haircut data', () => {
  const state = C.fresh(), motion = C.newMotion(), saved = JSON.stringify(state);
  for(let i=0;i<3000;i++) C.advance(state,motion,{x:300+Math.sin(i*.01)*260,y:360,power:1.4},[1/120,1/60,.5][i%3]);
  assert.ok(motion.every(m=>Number.isFinite(m.bend)&&Number.isFinite(m.velocity)&&Math.abs(m.bend)<=145));
  assert.equal(JSON.stringify(state),saved);
});
test('saved progress validates colors, lengths, points and version instead of trusting stored objects', () => {
  const s=C.normalize({version:1,lengths:[-4,NaN,Infinity,2],strokes:[null,{tool:'bad'},
    {tool:'lipstick',color:'url(https://example.test)',points:[[1,2]]},
    {tool:'eyeshadow',color:'#AD83BA',size:999,mirror:true,points:[[240,270],[Infinity,1],[-999,999]]}]});
  assert.deepEqual(s.lengths.slice(0,4),[.16,1,1,1]); assert.equal(s.strokes.length,1);
  assert.deepEqual(s.strokes[0].points,[[240,270],[-80,800]]); assert.equal(s.strokes[0].size,50);
  assert.deepEqual(C.normalize({version:99}),C.fresh()); assert.deepEqual(C.normalize(null),C.fresh());
});
test('fast drags have intermediate samples and makeup view maps both ends correctly', () => {
  const list=C.interpolate({x:100,y:200},{x:400,y:200},3);
  assert.equal(list.length,100); assert.deepEqual(list.at(-1),{x:400,y:200});
  for(const tool of ['lipstick','eyeshadow','scissors','dryer']) {
    const v=C.view(tool),p={x:300,y:395},display={x:p.x*v.scale+v.x,y:p.y*v.scale+v.y};
    assert.equal((display.x-v.x)/v.scale,p.x); assert.equal((display.y-v.y)/v.scale,p.y);
  }
});

test('old progress migrates to fixed styles without losing makeup or haircut',()=>{
  const old={version:1,lengths:C.template.map(()=>.7),strokes:[{tool:'lipstick',color:'#bd5d78',size:20,mirror:false,points:[[300,395]]}]};
  const next=C.normalize(old);
  assert.equal(next.version,2);assert.deepEqual(next.lengths,old.lengths);assert.deepEqual(next.strokes,old.strokes);
  assert.ok(next.styles.every(s=>s.curl===0&&s.volume===0&&s.straight===0));
  next.styles[0].curl=1;assert.equal(next.styles[1].curl,0);
  const safe=C.normalize({version:2,styles:[{straight:99,curl:-8,volume:NaN,extent:Infinity}]});
  assert.deepEqual(safe.styles[0],{straight:1,curl:-1,volume:0,extent:1});
});

test('four styles have distinct shapes and leave hair roots fixed on both sides',()=>{
  for(const side of [-1,1]){
    const strand=C.template.find(s=>s.layer==='side'&&s.side===side);
    const straight={straight:1,curl:0,volume:0,extent:1}, inward={straight:.35,curl:-1,volume:0,extent:1},outward={...inward,curl:1},volume={straight:0,curl:0,volume:1,extent:1};
    for(const style of [straight,inward,outward,volume])assert.deepEqual(C.point(strand,0,0,style),{x:strand.x,y:strand.y});
    const base=C.point(strand,1,0,straight), inside=C.point(strand,1,0,inward),outside=C.point(strand,1,0,outward);
    assert.ok((outside.x-inside.x)*side>190);assert.ok(inside.y<base.y-80);
    const originalMid=C.point(strand,.5),fluffy=C.point(strand,.5,0,volume);
    assert.ok((fluffy.x-originalMid.x)*side>60);assert.ok(fluffy.y<originalMid.y);
    assert.equal(C.point(strand,.7,0,straight).x,strand.x);
  }
});

function blow(state,mode,p,frames=240){const motion=C.newMotion();for(let i=0;i<frames;i++)C.styleAt(state,motion,{...p,mode,power:1},1/60);return motion;}
test('blowing styles nearby left hair while leaving the opposite side untouched',()=>{
  const state=C.fresh();blow(state,'outward',{x:155,y:400});
  assert.ok(C.template.filter(s=>s.layer==='side'&&s.side===-1).every(s=>state.styles[s.id].curl>.8));
  assert.ok(C.template.filter(s=>s.layer==='side'&&s.side===1).every(s=>state.styles[s.id].curl===0));
});
test('a hairstyle remains after wind stops, saves, reloads, and undo or redo',()=>{
  const state=C.fresh(),history=new C.History(state);state.strokes=[{tool:'lipstick',color:'#bd5d78',size:20,mirror:false,points:[[300,395]]}];
  history.push(state);blow(state,'inward',{x:155,y:400});history.push(state);
  const fixed=JSON.stringify(state.styles),motion=C.newMotion();
  for(let i=0;i<600;i++)C.advance(state,motion,null,1/60);
  assert.equal(JSON.stringify(state.styles),fixed);assert.equal(JSON.stringify(C.normalize(JSON.parse(JSON.stringify(state))).styles),fixed);
  assert.ok(history.undo());assert.ok(history.current.styles.every(s=>s.curl===0));assert.equal(history.current.strokes.length,1);
  assert.ok(history.redo());assert.equal(JSON.stringify(history.current.styles),fixed);
});
test('cutting a styled ribbon preserves the remaining curve and can restyle the shorter hair',()=>{
  const state=C.fresh(),motion=C.newMotion(),s=C.template.find(s=>s.layer==='side');
  state.styles[s.id]={straight:.35,curl:1,volume:0,extent:1};
  const before=C.point(s,.4,0,state.styles[s.id]),hit=C.point(s,.76,0,state.styles[s.id]);
  const cut=C.cut(state,motion,hit,2);
  assert.ok(cut.some(c=>c.strand.id===s.id));assert.ok(state.lengths[s.id]<.8);assert.deepEqual(C.point(s,.4,0,state.styles[s.id]),before);
  const left=C.point(s,.3,0,state.styles[s.id]);blow(state,'outward',left,600);
  assert.ok(Math.abs(state.styles[s.id].extent-state.lengths[s.id])<.01);
});
test('styling rate is stable across frame rates and invalid modes do not mutate progress',()=>{
  const a=C.fresh(),b=C.fresh(),m=C.newMotion(),wind={x:155,y:400,mode:'volume',power:1};
  for(let i=0;i<120;i++)C.styleAt(a,m,wind,1/60);
  for(let i=0;i<240;i++)C.styleAt(b,m,wind,1/120);
  for(let i=0;i<a.styles.length;i++)assert.ok(Math.abs(a.styles[i].volume-b.styles[i].volume)<.015);
  const saved=JSON.stringify(a);
  for(const invalid of [{mode:'unknown',x:150,y:400},{mode:'__proto__',x:150,y:400},{mode:'straight',x:NaN,y:400}])C.styleAt(a,m,invalid,1);
  C.styleAt(a,m,wind,NaN);assert.equal(JSON.stringify(a),saved);
});
