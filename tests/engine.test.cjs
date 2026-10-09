const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../wwwroot/js/engine.js');
const { inspect } = require('../wwwroot/js/import-validator.js');

test('transparent black and white become transparent; continuous dark lines remain pure black', () => {
  const rgba = new Uint8ClampedArray(5 * 5 * 4);
  for (let i = 0; i < 25; i++) { rgba[i*4] = rgba[i*4+1] = rgba[i*4+2] = 255; rgba[i*4+3] = 255; }
  for (const i of [6,7,8]) { rgba[i*4] = rgba[i*4+1] = rgba[i*4+2] = 90; }
  rgba[0] = rgba[1] = rgba[2] = rgba[3] = 0;
  const result = core.binarize(rgba,5,5,170,false);
  assert.equal(result.mask[0],0); assert.equal(result.mask[7],1); assert.equal(result.rgba[7*4+3],255); assert.equal(result.rgba[7*4],0); assert.equal(result.rgba[24*4+3],0);
});
test('fill uses top-layer boundary and never crosses an enclosed ring', () => {
  const w=9,h=9, rgba=new Uint8ClampedArray(w*h*4), mask=new Uint8Array(w*h);
  for(let i=2;i<=6;i++){mask[2*w+i]=mask[6*w+i]=mask[i*w+2]=mask[i*w+6]=1;}
  assert.equal(core.floodFill(rgba,mask,w,h,4,4,[255,0,0]),9);
  assert.equal(rgba[(4*w+4)*4],255); assert.equal(rgba[3],0); assert.equal(rgba[(2*w+4)*4+3],0);
  assert.equal(core.floodFill(rgba,mask,w,h,4,4,[0,0,255]),9);
  assert.equal(rgba[(4*w+4)*4+2],255);
  assert.equal(core.floodFill(rgba,mask,w,h,4,4,[0,0,255]),0);
  assert.equal(core.floodFill(rgba,mask,w,h,2,4,[1,2,3]),0);
});
test('existing bottom color also forms a fill boundary and white fill on transparency is a no-op', () => {
  const w=7,h=7,rgba=new Uint8ClampedArray(w*h*4),mask=new Uint8Array(w*h);
  for(let y=0;y<h;y++){const p=(y*w+3)*4;rgba[p+2]=255;rgba[p+3]=255;}
  assert.equal(core.floodFill(rgba,mask,w,h,1,1,[255,255,255]),0);
  assert.equal(core.floodFill(rgba,mask,w,h,1,1,[255,0,0]),21);
  assert.equal(rgba[(1*w+5)*4+3],0); assert.equal(rgba[(1*w+3)*4+2],255);
});
test('large flood fill completes iteratively and rejects out-of-bounds seeds', () => {
  const w=1024,h=768,rgba=new Uint8ClampedArray(w*h*4),mask=new Uint8Array(w*h);
  assert.equal(core.floodFill(rgba,mask,w,h,-1,0,[10,20,30]),0);
  assert.equal(core.floodFill(rgba,mask,w,h,0,0,[10,20,30]),w*h);
  assert.equal(rgba[rgba.length-1],255);
});
test('small-gap repair closes a one-pixel break in a ring', () => {
  const w=11,h=11, mask=new Uint8Array(w*h);
  for(let i=2;i<=8;i++){mask[2*w+i]=mask[8*w+i]=mask[i*w+2]=mask[i*w+8]=1;} mask[2*w+5]=0;
  const closed=core.closeMask(mask,w,h);
  assert.equal(closed[2*w+5],1);
  const rgba=new Uint8ClampedArray(w*h*4);
  assert.equal(core.floodFill(rgba,closed,w,h,5,5,[0,0,255]),25);
});
test('complexity estimation is bounded and increases for many small enclosed regions', () => {
  const w=100,h=100, blank=new Uint8Array(w*h), busy=new Uint8Array(w*h);
  assert.equal(core.estimateDifficulty(blank,w,h),1);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(x%10===0||y%10===0)busy[y*w+x]=1;
  assert.equal(core.estimateDifficulty(busy,w,h),3);
});
test('narrow enclosed targets raise difficulty even when region count stays the same', () => {
  const w=400,h=300, wide=new Uint8Array(w*h), narrow=new Uint8Array(w*h);
  function ring(mask,x,y,rw,rh){
    for(let a=x;a<x+rw;a++)mask[y*w+a]=mask[(y+rh-1)*w+a]=1;
    for(let b=y;b<y+rh;b++)mask[b*w+x]=mask[b*w+x+rw-1]=1;
  }
  for(let i=0;i<6;i++){ring(wide,10+i*60,30,42,42);ring(narrow,10+i*60,30,10,202);}
  assert.equal(core.estimateDifficulty(wide,w,h),1);
  assert.equal(core.estimateDifficulty(narrow,w,h),2);
});
function png(width,height,animation=false){
  const bytes=Buffer.alloc(animation?65:57); Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);bytes.writeUInt32BE(13,8);bytes.write('IHDR',12);bytes.writeUInt32BE(width,16);bytes.writeUInt32BE(height,20);
  if(animation){bytes.writeUInt32BE(8,33);bytes.write('acTL',37);bytes.writeUInt32BE(0,53);bytes.write('IEND',57);}else{bytes.writeUInt32BE(12,33);bytes.write('IDAT',37);}
  return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
}
test('import rejects SVG, animated PNG, oversized dimensions and truncated files before decoding', () => {
  assert.deepEqual(inspect(png(1024,768)),{width:1024,height:768,type:'image/png'});
  assert.throws(()=>inspect(png(1024,768,true)),/動畫/);
  assert.throws(()=>inspect(png(20000,20000)),/尺寸/);
  const svg=new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');assert.throws(()=>inspect(svg.buffer),/PNG/);
  assert.throws(()=>inspect(new ArrayBuffer(10)),/圖片/);
});
test('bundled gallery has 42 different compositions, fourteen per difficulty, and ten local stamps', () => {
  const root=path.join(__dirname,'../wwwroot'), gallery=JSON.parse(fs.readFileSync(path.join(root,'gallery.json'))),stamps=JSON.parse(fs.readFileSync(path.join(root,'stamps.json')));
  assert.equal(gallery.length,42);assert.equal(new Set(gallery.map(c=>c.id)).size,42);
  for(let level=1;level<=3;level++)assert.equal(gallery.filter(c=>c.difficultyLevel===level).length,14);
  for(const c of [...gallery,...stamps]){const asset=c.imagePath||c.path;assert.ok(asset.startsWith('/assets/'));assert.ok(fs.existsSync(path.join(root,asset)));const svg=fs.readFileSync(path.join(root,asset),'utf8');assert.ok(!/https?:\/\/(?!www.w3.org)|<script|<image|<foreignObject/.test(svg));}
  assert.equal(stamps.length,10);
  assert.equal(new Set(gallery.map(c=>c.name)).size,42);
  const bodies=gallery.map(c=>fs.readFileSync(path.join(root,c.imagePath),"utf8").replace(/<title>.*?<\/title>/,""));
  assert.equal(new Set(bodies).size,42);
  assert.equal(fs.readdirSync(path.join(root,"assets/cards")).filter(f=>f.endsWith(".svg")).length,42);
});
