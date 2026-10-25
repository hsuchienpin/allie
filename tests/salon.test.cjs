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
  const removed = C.cut(state, motion, C.deformedPoint(state,motion,s.x,s.y+s.full*.8), 2);
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
  assert.deepEqual(s.strokes[0].points,[[229.2,255.85],[-80,800]]); assert.equal(s.strokes[0].size,50);
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
  assert.equal(next.version,4);assert.deepEqual(next.lengths,old.lengths);assert.deepEqual(next.strokes[0].points,[[300,383]]);assert.equal(next.strokes[0].color,old.strokes[0].color);
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
    assert.ok((outside.x-inside.x)*side>95);assert.ok(inside.y<base.y-45);
    const originalMid=C.point(strand,.5),fluffy=C.point(strand,.5,0,volume);
    assert.ok((fluffy.x-originalMid.x)*side>30);assert.ok(fluffy.y<originalMid.y);
    assert.ok(Math.abs(C.point(strand,.7,0,straight).x-originalMid.x)>3);
  }
});

function blow(state,mode,p,frames=240){const motion=C.newMotion();for(let i=0;i<frames;i++)C.styleAt(state,motion,{...p,mode,power:1},1/60);return motion;}
test('blowing styles nearby left hair while leaving the opposite side untouched',()=>{
  const state=C.fresh();blow(state,'outward',{x:110,y:400});
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
  const before=C.point(s,.4,0,state.styles[s.id]),hit=C.deformedPoint(state,motion,s.x,s.y+s.full*.76);
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


test('v2 saved styles and makeup migrate intact with default princess accessories',()=>{
  const old=C.fresh();old.version=2;delete old.accessories;old.styles[3].curl=.7;old.lengths[4]=.5;
  old.strokes=[{tool:'eyeshadow',color:'#ad83ba',size:32,mirror:true,points:[[240,270]]}];
  const result=C.normalize(old);assert.equal(result.version,4);assert.deepEqual(result.styles,old.styles);assert.deepEqual(result.lengths,old.lengths);assert.deepEqual(result.strokes[0].points,[[229.2,255.85]]);assert.equal(result.strokes[0].mirror,true);assert.equal(result.accessories.head,'tiara');
});
test('saved new makeup and accessories are bounded by tool and slot',()=>{
  const s=C.normalize({version:3,accessories:{head:'royal',clip:'__proto__',ears:'bow',neck:'moon',extra:'bad'},strokes:[
    {tool:'eyeliner',color:'#443449',size:200,mirror:true,points:[[215,295]]},
    {tool:'blush',color:'#e0809b',size:0.5,mirror:true,points:[[240,350]]}]});
  assert.deepEqual(s.accessories,{head:'royal',clip:'none',ears:'none',neck:'moon'});
  assert.equal(s.strokes[0].size,14);assert.equal(s.strokes[1].size,20);assert.ok(s.strokes.every(s=>s.mirror));
  assert.deepEqual(C.normalize(JSON.parse(JSON.stringify(s))),s);
});


test('hair dye is whitelisted, old saves default to gold, and v4 migration is idempotent',()=>{
  for(const [id] of C.hairColors){const state=C.fresh();state.hairColor=id;assert.deepEqual(C.normalize(state),state);}
  assert.equal(C.normalize({version:3,hairColor:'url(evil)'}).hairColor,'gold');
  const old={version:3,accessories:{head:'flowers',clip:'rose',ears:'stars',neck:'moon'},strokes:[{tool:'blush',color:'#e0809b',size:40,mirror:true,points:[[240,350]]}]};
  const next=C.normalize(old);assert.deepEqual(next.accessories,old.accessories);assert.deepEqual(next.strokes[0].points,[[219,350]]);assert.deepEqual(C.normalize(next),next);
});

test('natural mesh preserves the approved illustration and transparent holes cannot be cut or styled',()=>{
  for(const s of C.template)for(const t of [0,.3,.7,1])assert.deepEqual(C.point(s,t),C.sourcePoint(s,t));
  const state=C.fresh(),before=C.clone(state),s=C.template.find(s=>s.layer==='side');
  C.setHairVisibility(()=>false);
  try{assert.equal(C.cut(state,C.newMotion(),C.point(s,.6)).length,0);assert.equal(C.styleAt(state,C.newMotion(),{...C.point(s,.6),mode:'volume',power:1},1/60),0);assert.deepEqual(state,before);}
  finally{C.setHairVisibility(null);}
});


test('neighboring differently styled locks share smooth boundaries and cuts follow the rendered mesh',()=>{
 const state=C.fresh(),motion=C.newMotion();
 for(const s of C.template)if(s.side<0)state.styles[s.id]={straight:.35,curl:-1,volume:0,extent:1};
 for(const x of [179.999,180.001,419.999,420.001])for(const y of [229.999,230.001,450,620]){
   const a=C.deformedPoint(state,motion,x-.001,y),b=C.deformedPoint(state,motion,x+.001,y);
   assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.02);
 }
 const s=C.template.find(s=>s.layer==='side'),p=C.deformedPoint(state,motion,s.x,s.y+s.full*.7);
 assert.ok(C.cut(state,motion,p,2).some(c=>c.strand.id===s.id));
});
