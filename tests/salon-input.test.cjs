const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../wwwroot/salon/core.js');
const source=fs.readFileSync(require.resolve('../wwwroot/salon/app.js'),'utf8');

// Controller tests use the real core and storage/history behavior; drawing is tested separately.
function game(saved){
  class Element{
    constructor(){this.dataset={};this.attributes={};this.listeners={};this.disabled=false;this.value='';this.checked=true;this.style={setProperty(){}};this.classList={toggle(){}};}
    setAttribute(k,v){this.attributes[k]=String(v);}removeAttribute(k){delete this.attributes[k];}
    addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}
    emit(k,event){for(const fn of this.listeners[k]||[])fn(event);}
    replaceChildren(){}getBoundingClientRect(){return{left:0,top:0,width:600,height:720};}
    setPointerCapture(id){this.capture=id;}hasPointerCapture(id){return this.capture===id;}
    releasePointerCapture(id){this.capture=null;this.emit('lostpointercapture',{pointerId:id});}
  }
  const ids=new Map(),el=id=>{if(!ids.has(id))ids.set(id,new Element());return ids.get(id);};
  const tools=['lipstick','eyeshadow','scissors','dryer'].map(tool=>Object.assign(new Element(),{dataset:{tool}}));
  const modes=['straight','inward','outward','volume'].map(style=>Object.assign(new Element(),{dataset:{style,label:style}}));
  const document=Object.assign(new Element(),{body:new Element(),getElementById:el,createElement:()=>new Element(),querySelector:selector=>el(selector),querySelectorAll:selector=>selector==='[data-tool]'?tools:selector==='[data-style]'?modes:[]});
  el('wind-power').value='1';el('mirror-eyes').checked=true;
  let last,clock=0,serial=0,stored=saved,navigation;
  const timers=new Map(),frames=new Map();
  class Renderer{
    rebuild(){}touches(tool,x,y){return tool==='lipstick'&&x>=265&&x<=335&&y>=380&&y<=415;}dab(){}
    render(state,motion,options){last=C.clone(state);}
  }
  const window=Object.assign(new Element(),{AllieScreen:{isHost:false,onHome(fn){window.home=fn;},navigate(url){navigation=url;}}});
  const sandbox={SalonCore:C,SalonRenderer:{Renderer},document,window,location:{href:'https://example.test/allie/salon/'},URL,
    localStorage:{getItem:()=>stored||null,setItem:(key,value)=>{stored=value;}},performance:{now:()=>clock},
    setTimeout:fn=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id),
    requestAnimationFrame:fn=>{frames.set(++serial,fn);return serial;},ResizeObserver:class{observe(){}}};
  vm.runInNewContext(source,sandbox);
  const pointer=(type,x=155,y=400,id=1)=>el('portrait').emit(type,{clientX:x,clientY:y,pointerId:id,pointerType:'touch',button:0,preventDefault(){}});
  return{el,tool:name=>tools.find(b=>b.dataset.tool===name).onclick(),mode:name=>modes.find(b=>b.dataset.style===name).onclick(),
    pointer,frames(n){for(let i=0;i<n;i++){clock+=1000/60;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(clock));}},
    flush(){const pending=[...timers.values()];timers.clear();pending.forEach(fn=>fn());},state:()=>last,saved:()=>stored,home:()=>window.home(),navigation:()=>navigation};
}
const styled=state=>state.styles.some(s=>Math.abs(s.curl)+s.straight+s.volume>.05);

test('release sets the hairstyle as one undo step and the saved shape survives reopening',()=>{
  const g=game();g.tool('dryer');g.mode('inward');g.pointer('pointerdown');g.frames(150);g.pointer('pointerup');g.frames(240);
  assert.ok(styled(g.state()));const fixed=C.clone(g.state());assert.equal(g.el('undo').disabled,false);
  g.flush();assert.deepEqual(game(g.saved()).state(),fixed);
  g.el('undo').onclick();assert.equal(styled(g.state()),false);assert.equal(g.el('undo').disabled,true);
  g.el('redo').onclick();assert.deepEqual(g.state(),fixed);
});
test('continuous styling commits once when Finish is tapped and can be undone while running',()=>{
  const g=game();g.tool('dryer');g.mode('volume');g.el('dryer-toggle').onclick();g.frames(180);
  assert.ok(styled(g.state()));assert.equal(g.el('undo').disabled,true);
  g.el('dryer-toggle').onclick();assert.equal(g.el('undo').disabled,false);g.el('undo').onclick();assert.equal(styled(g.state()),false);
  g.el('redo').onclick();g.el('dryer-toggle').onclick();g.frames(60);g.el('undo').onclick();
  assert.equal(g.el('dryer-toggle').attributes['aria-pressed'],'false');
});
test('a cancelled hair touch and a pending autosave never persist an unfinished style',()=>{
  const g=game();g.pointer('pointerdown',300,487.5);g.pointer('pointerup',302,488);g.frames(1);
  assert.equal(g.state().strokes.length,1);g.tool('dryer');g.mode('outward');g.pointer('pointerdown');g.frames(120);assert.ok(styled(g.state()));
  g.flush();assert.equal(styled(JSON.parse(g.saved())),false);
  g.pointer('pointercancel');g.frames(1);assert.equal(styled(g.state()),false);assert.equal(g.state().strokes.length,1);
  g.el('undo').onclick();assert.equal(g.state().strokes.length,0);assert.equal(g.el('undo').disabled,true);
});
test('a second finger cancellation does not interrupt the active styling finger',()=>{
  const g=game();g.tool('dryer');g.mode('inward');g.pointer('pointerdown');g.frames(60);
  g.pointer('pointerdown',450,400,2);g.pointer('pointercancel',450,400,2);g.frames(60);g.pointer('pointerup');
  assert.ok(styled(g.state()));assert.equal(g.el('undo').disabled,false);
});
test('changing styles ends the prior continuous operation and Home commits the next result',()=>{
  const g=game();g.tool('dryer');g.mode('outward');g.el('dryer-toggle').onclick();g.frames(180);g.mode('inward');
  const first=C.clone(g.state());assert.ok(first.styles.some(s=>s.curl>.2));
  g.el('dryer-toggle').onclick();g.frames(180);g.home();assert.equal(g.navigation(),'https://example.test/allie/');
  assert.ok(JSON.parse(g.saved()).styles.some(s=>s.curl<-.2));g.el('undo').onclick();assert.deepEqual(g.state(),first);
});
test('clearing styling retains a haircut, and undo restores the styled shortened hair',()=>{
  const g=game();const s=C.template.find(s=>s.layer==='side'),p=C.point(s,.65);
  g.tool('scissors');g.pointer('pointerdown',p.x,p.y);g.pointer('pointerup',p.x,p.y);g.frames(1);
  assert.ok(g.state().lengths.some(n=>n<1));g.tool('dryer');g.mode('inward');g.el('dryer-toggle').onclick();g.frames(180);g.el('dryer-toggle').onclick();
  const before=C.clone(g.state());g.el('reset-style').onclick();assert.equal(styled(g.state()),false);assert.deepEqual(g.state().lengths,before.lengths);
  g.el('undo').onclick();assert.deepEqual(g.state(),before);g.el('regrow').onclick();assert.ok(g.state().lengths.every(n=>n===1));assert.equal(styled(g.state()),false);
});
