const {gamePage}=require('./game-page.cjs');
/* Acceptance for ten coloring papers, one Slice mode, Home, and fullscreen.
 * Fixture data stays in an isolated browser. Slice fixtures stop movement only. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=(process.env.BASE_URL||'http://127.0.0.1:8768/allie/').replace(/\/?$/,'/'),out=process.env.SCREENSHOTS||'artifacts/allie-redesign-v2/options';fs.mkdirSync(out,{recursive:true});let activePage;
(async()=>{const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1180,height:820}}),page=await gamePage(context),errors=[];
 activePage=page;page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 async function go(route=''){await page.goto(base+route);await page.evaluate(()=>Allie.ready);}
 async function readyPaper(){await page.waitForFunction(()=>document.querySelectorAll('#gallery .gallery-card').length===10&&document.getElementById('busy').hidden&&!document.querySelector('#tools button').disabled);}
 await go();await page.shell.click('#allie-fullscreen');await page.shell.waitForFunction(()=>!!document.fullscreenElement);await page.shell.click('#allie-fullscreen');await page.shell.waitForFunction(()=>!document.fullscreenElement);await page.shell.screenshot({path:out+'/home.png'});console.log('Persistent fullscreen toolbar available on homepage');
 await go('studio/');await readyPaper();assert.equal(await page.locator('#difficulty-filter,#import-difficulty,#prompt-difficulty,#card-stars').count(),0);await page.click('#open-gallery');await page.locator('#gallery img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));await page.screenshot({path:out+'/ten-paper-picker.png'});const cards=await page.locator('#gallery .gallery-card').evaluateAll(bs=>bs.map(b=>({id:b.dataset.card,name:b.getAttribute('aria-label')})));await page.locator('#paper-drawer [data-close]').click();
 const fillResults=[];
 for(const card of cards){
  await page.click('#open-gallery');await page.locator(`[data-card="${card.id}"]`).click();
  if(await page.locator('#confirm-dialog').evaluate(d=>d.open))await page.click('#confirm-yes');
  await page.waitForFunction(name=>document.getElementById('card-title').textContent===name&&document.getElementById('busy').hidden,card.name);
  // Find the largest enclosed coloring region, excluding the paper background.
  const region=await page.evaluate(()=>{const canvas=document.getElementById('layer-top'),w=canvas.width,h=canvas.height,rgba=canvas.getContext('2d').getImageData(0,0,w,h).data,mask=ColoringCore.binarize(rgba,w,h,170,false).mask,seen=new Uint8Array(w*h),q=new Int32Array(w*h);let best=null,regions=0;
   for(let seed=0;seed<mask.length;seed++){if(mask[seed]||seen[seed])continue;let head=0,tail=1,edge=false,sumX=0,sumY=0;q[0]=seed;seen[seed]=1;
    while(head<tail){const p=q[head++],x=p%w,y=Math.floor(p/w);sumX+=x;sumY+=y;if(x===0||x===w-1||y===0||y===h-1)edge=true;for(const n of [x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(n>=0&&!mask[n]&&!seen[n]){seen[n]=1;q[tail++]=n;}}
    if(!edge&&tail>200){regions++;if(!best||tail>best.area){const cx=sumX/tail,cy=sumY/tail;let chosen=q[0],distance=Infinity;for(let i=0;i<tail;i++){const p=q[i],d=(p%w-cx)**2+(Math.floor(p/w)-cy)**2;if(d<distance){distance=d;chosen=p;}}best={x:chosen%w,y:Math.floor(chosen/w),area:tail};}}
   }return {...best,regions};});
  assert.ok(region.area>6000,card.name+' needs a large enclosed area');assert.ok(region.regions>=6,card.name+' needs multiple coloring regions');
  const box=await page.locator('#layer-bottom').boundingBox();await page.mouse.click(box.x+region.x/1024*box.width,box.y+region.y/768*box.height);await page.waitForFunction(()=>document.getElementById('busy').hidden);
  const filled=await page.evaluate(({x,y})=>{const c=document.getElementById('layer-bottom').getContext('2d'),d=c.getImageData(0,0,1024,768).data;let pixels=0;for(let i=3;i<d.length;i+=4)if(d[i])pixels++;return{center:d[(y*1024+x)*4+3],corner:d[3],pixels};},region);
  assert.equal(filled.center,255,card.name+' actual fill');assert.equal(filled.corner,0,card.name+' fill must not leak to outside');assert.ok(filled.pixels>=region.area*.98&&filled.pixels<=region.area*1.02,card.name+' region boundary');fillResults.push({name:card.name,...region,filled:filled.pixels});
 }
 fs.writeFileSync(out+'/coloring-regions.json',JSON.stringify(fillResults,null,2));console.log('All ten cards open, have broad enclosed regions, and actual tap fills stay inside');
 await page.screenshot({path:out+'/draw.png'});
 await page.shell.locator('#allie-home').click();await page.click('#leave-yes');await page.waitForURL(base);const saved=await page.evaluate(async()=>Allie.getDraft(await Allie.lastDraft()));
 await page.evaluate(async d=>{await Allie.saveDraft({...d,id:'allie-jellyfish',cardId:'allie-jellyfish',title:'Old Picture',placements:[]},0);},saved);
 await go('studio/');await readyPaper();await page.waitForFunction(()=>document.getElementById('card-title').textContent==='Old Picture');const restored=await page.evaluate(()=>({bottom:document.getElementById('layer-bottom').toDataURL(),top:document.getElementById('layer-top').toDataURL()}));assert.equal(restored.bottom,saved.bottom);assert.equal(restored.top,saved.top);console.log('A removed legacy paper reopens its saved colors and lines without entering the ten-card picker');
 await go('slice/');await page.waitForFunction(()=>!document.getElementById('start').disabled);assert.equal(await page.locator('[data-theme],[data-mode],#tap-setting').count(),0);await page.screenshot({path:out+'/slice-menu.png'});
 await page.evaluate(()=>{const G=SliceCore.Game;SliceCore.Game=class extends G{constructor(o){super(o);window.testGame=this;this.balloonUsed=true;}};});await page.click('#start');
 const spec=await page.evaluate(()=>testGame.spec);assert.equal(spec.travel,11);assert.equal(spec.interval,1.9);assert.equal(spec.max,5);assert.equal(spec.balloonHits,8);
 for(const type of await page.evaluate(()=>SliceCore.ITEMS)){
  await page.evaluate(type=>{const g=testGame;g.objects=[];const o=g.spawn();Object.assign(o,{type,x:g.width/2,homeX:g.width/2,y:g.height/2,amplitude:0,vy:0});},type);
  const box=await page.locator('#game').boundingBox(),before=await page.evaluate(()=>testGame.energy);await page.mouse.click(box.x+box.width/2,box.y+box.height/2);assert.equal(await page.evaluate(()=>testGame.energy),before,'tap alone must not cut');
  await page.mouse.move(box.x+box.width*.1,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.9,box.y+box.height/2,{steps:6});await page.mouse.up();assert.equal(await page.evaluate(()=>testGame.energy),before+1,type+' swipes');
 }
 assert.equal(await page.locator('#energy-number').textContent(),'11 / 20');await page.shell.locator('#allie-home').click();await page.waitForURL(base);await go('slice/');await page.waitForFunction(()=>!document.getElementById('start').disabled);await page.click('#start');await page.locator('#play').waitFor({state:'visible'});assert.equal(await page.locator('#energy-number').textContent(),'11 / 20');console.log('All eleven treats cut by real swipes, tap alone does nothing, and Home preserves energy');
 for(const size of [{width:768,height:1024},{width:1024,height:768},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(size);await go();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'home overflow');assert.ok(await page.shell.locator('#allie-fullscreen').isVisible());
  for(const route of ['studio/','runner/','slice/','bowling/']){
   console.log('Layout/Home',size.width,size.height,route);await go(route);if(route==='studio/')await readyPaper();else{await page.waitForFunction(()=>!document.getElementById('start').disabled);await page.click('#start');await page.locator('#game').waitFor({state:'visible'});}
   if(route==='studio/'){assert.equal(await page.locator('#card-title').textContent(),'Old Picture');assert.equal(await page.locator('#layer-bottom').evaluate(c=>c.toDataURL()),saved.bottom,'legacy color survives repeated Home navigation');const point=fillResults.at(-1),pixels=await page.evaluate(({x,y})=>['layer-bottom','layer-top'].map(id=>Array.from(document.getElementById(id).getContext('2d').getImageData(x,y,1,1).data)),point);assert.deepEqual(pixels[0],[215,131,155,255],'saved color is still pink');assert.equal(pixels[1][3],0,'line layer remains transparent over color');}
   const home=page.shell.locator('#allie-home'),b=await home.boundingBox();assert.ok(b&&b.x<85&&b.y<35&&b.width>=44&&b.height>=44,route+' Home position '+size.width+': '+JSON.stringify(b));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+' overflow '+size.width);
   if(route!=='studio/'){const field=await page.locator('#game').boundingBox();assert.ok(field.height>=105&&field.width>=290,route+' field');const controls=route==='slice/'?field:await page.locator('.controls').boundingBox();assert.ok(controls.y+controls.height<=size.height+2,route+' clipped controls');}
   if(size.width===390||size.width===1024)await page.screenshot({path:out+'/'+route.replace('/','')+'-'+size.width+'.png'});
   await home.click();if(route==='studio/'&&await page.locator('#leave-dialog').count()&&await page.locator('#leave-dialog').evaluate(d=>d.open))await page.click('#leave-yes');await page.waitForURL(base);
  }
 }
 console.log('All four games keep a working upper-left Home at four phone/tablet sizes');assert.deepEqual(errors,[]);await browser.close();console.log('Options acceptance PASS');
})().catch(async e=>{console.error(e);if(activePage){console.error('Failure URL',activePage.url());console.error((await activePage.locator('body').innerText()).slice(-1500));await activePage.screenshot({path:out+'/failure.png'});}process.exit(1);});
