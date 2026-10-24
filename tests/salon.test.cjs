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
