const test=require('node:test');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const C=require('../wwwroot/doll/catalog.js');
const Core=require('../wwwroot/doll/core.js');
const R=require('../wwwroot/doll/renderer.js');

test('outfit switching restores the original separate outfit and its colors',()=>{
  let c=Core.normalize({...C.defaults,top:13,bottom:3,colors:{...C.defaults.colors,top:5,bottom:4}});
  c=Core.choose(c,'outfit',9);
  assert.equal(c.outfit,9);
  c=Core.choose(c,'outfit',0);
  assert.equal(c.top,13);assert.equal(c.bottom,3);assert.equal(c.colors.top,5);assert.equal(c.colors.bottom,4);
  c=Core.choose(c,'outfit',12);c=Core.choose(c,'top',8);
  assert.equal(c.outfit,0);assert.equal(c.top,8);assert.equal(c.bottom,3);
});
test('gender never replaces hair or clothes',()=>{
  const c=Core.normalize({...C.defaults,hair:9,outfit:9});
  for(let value=0;value<3;value++){const changed=Core.choose(c,'gender',value);assert.equal(changed.hair,9);assert.equal(changed.outfit,9);}
});
test('untrusted and outdated saves are normalized to library selections',()=>{
  const c=Core.normalize({hair:-1,top:'3',outfit:999,skin:Infinity,colors:{hair:'url(https://example.com)'},patterns:{top:-1},unrecognized:'x'});
  assert.deepEqual(c,Core.normalize(C.defaults));
  assert.deepEqual(Core.normalize(null),Core.normalize(C.defaults));
  const invalid=Core.choose(c,'__proto__',2);assert.deepEqual(invalid,c);
});
test('undo and redo preserve full outfit, colors and patterns without aliasing',()=>{
  const h=new Core.History(C.defaults),initial=Core.clone(h.current),next=Core.clone(initial);
  next.outfit=12;next.colors.outfit=4;next.patterns.outfit=6;
  assert.equal(h.push(next),true);next.colors.outfit=0;
  assert.equal(h.current.colors.outfit,4);assert.equal(h.undo(),true);assert.deepEqual(h.current,initial);
  assert.equal(h.redo(),true);assert.equal(h.current.outfit,12);assert.equal(h.current.patterns.outfit,6);
  h.undo();h.push(Core.choose(h.current,'hair',5));assert.equal(h.redo(),false);
});
test('character names have a 12 grapheme limit and preserve family emoji',()=>{
  assert.equal(Core.cleanName('  小森林  '),'小森林');
  assert.equal(Core.cleanName('一二三四五六七八九十一二三'),'一二三四五六七八九十一二');
  assert.equal(Core.cleanName('👨‍👩‍👧‍👦'.repeat(13)),'👨‍👩‍👧‍👦'.repeat(12));
  assert.equal(Core.cleanName('小\u202e森林\n'),'小森林');
});
test('all 160 material selections produce valid self-contained vector output',()=>{
  assert.equal(C.categories.length,14);
  assert.equal(Object.values(C.items).reduce((n,v)=>n+v.length,0),160);
  for(const [part,values] of Object.entries(C.items)){
    const hashes=new Set();
    for(const option of values){
      const svg=R.thumbnail(C.defaults,part,option.id);
      assert.match(svg,/^<svg xmlns=/);assert.ok(!/undefined|NaN|Infinity|https?:\/\/(?!www\.w3\.org)/.test(svg),part+' '+option.label);
      if(part!=='gender'){
        const hash=createHash('sha256').update(svg.replace(/doll\d+/g,'doll')).digest('hex');
        assert.ok(!hashes.has(hash),'two identical renderings in '+part+': '+option.label);hashes.add(hash);
      }
    }
  }
});
test('all height and body combinations render with both separate and full outfits',()=>{
  for(let height=0;height<5;height++)for(let body=0;body<4;body++)for(let outfit=0;outfit<17;outfit++){
    const svg=R.draw({...C.defaults,height,body,outfit});
    assert.ok(!/undefined|NaN|Infinity/.test(svg));
    const ids=new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
    for(const ref of svg.matchAll(/url\(#([^)]*)\)/g))assert.ok(ids.has(ref[1]),'missing SVG definition '+ref[1]);
    assert.match(svg,/viewBox="0 -35 360 680"/);
  }
});
test('random characters always use valid catalog indices',()=>{
  for(let i=0;i<80;i++){const c=Core.randomize();assert.deepEqual(c,Core.normalize(c));}
});
