(function (root) {
  'use strict';
  const COLORS = ['#f17a57','#f5bd43','#9bc849','#55b5a1','#5da6d2','#a389c9'];
  const images = {};
  // Read from each illustration's actual bounds; the generated atlas has uneven gutters.
  const SPRITE_RECTS = [[84,62,323,322],[514,61,324,322],[938,54,337,335],[1380,65,315,318],[157,431,174,404],[579,429,197,399],[959,444,293,373],[1367,504,336,321]];
  async function load() {
    await Promise.all(['/bowling/assets/sprites.png','/assets/allie/world.webp','/assets/allie/stickers.webp'].map((url,i) => new Promise(resolve => {
      const img = new Image(); img.onload = () => { images[['sprites','forest','allie'][i]] = img; resolve(); }; img.onerror = () => resolve(); img.src = Allie.url(url);
    })));
    return Boolean(images.sprites && images.forest);
  }
  function round(ctx,x,y,w,h,r,fill,stroke) { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); } }
  function star(ctx,x,y,r,color = '#f8c54b',rotation = 0) {
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI/2 + i*Math.PI/5 + rotation, rad = i%2 ? r*.48 : r; const px = x+Math.cos(a)*rad, py=y+Math.sin(a)*rad; if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.closePath(); ctx.fillStyle=color; ctx.fill();
  }
  function fallback(ctx,index,x,y,w,h) {
    ctx.save(); ctx.translate(x,y); ctx.fillStyle = ['#6eaa48','#a06a35','#ad7d4c','#a896d6','#fffcef','#9bd4a0','#efb25e','#a48dcd'][index];
    if (index < 4) { ctx.beginPath(); ctx.arc(0,0,w/2,0,Math.PI*2); ctx.fill(); if(index===0) {ctx.strokeStyle='#346d34';ctx.lineWidth=w*.06;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.ellipse(i*w*.2,0,w*.08,h*.45,0,0,Math.PI*2);ctx.stroke();}} if(index===1){ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(0,0,w*.13,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';} }
    else { round(ctx,-w*.33,-h*.5,w*.66,h,w*.25,ctx.fillStyle); if(index===4){round(ctx,-w*.18,-h*.38,w*.36,h*.14,3,'#ec7655');} }
    ctx.fillStyle='#364d39';for(const s of [-1,1]){ctx.beginPath();ctx.arc(s*w*.12,0,w*.026,0,7);ctx.fill();}ctx.beginPath();ctx.arc(0,h*.07,w*.1,0,Math.PI);ctx.lineWidth=2;ctx.strokeStyle='#364d39';ctx.stroke();ctx.restore();
  }
  function sprite(ctx,index,x,y,w,h = w,rotation = 0,alpha = 1) {
    ctx.save(); ctx.translate(x,y); ctx.rotate(rotation); ctx.globalAlpha = alpha;
    if(index<4){
      const r=Math.min(w,h)/2,palettes=[['#ffdbed','#ec83b7'],['#d7f0ff','#83bdeb'],['#e2fff5','#8dcdbd'],['#f1dfff','#ad83dd']],colors=palettes[index];
      const gradient=ctx.createRadialGradient(-r*.3,-r*.4,r*.05,0,0,r);gradient.addColorStop(0,'#fffafc');gradient.addColorStop(.3,colors[0]);gradient.addColorStop(1,colors[1]);ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff8fc';ctx.lineWidth=Math.max(2,r*.03);ctx.stroke();
      ctx.strokeStyle='#a876b680';ctx.lineWidth=Math.max(2,r*.025);ctx.beginPath();ctx.ellipse(0,0,r,r*.22,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(0,0,r*.28,r,0,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.restore();return;
    }
    if(images.allie&&(index===5||index===7)) {const i=index===5?20:1,sw=images.allie.width/6,sh=images.allie.height/4;ctx.drawImage(images.allie,(i%6)*sw,Math.floor(i/6)*sh,sw,sh,-w/2,-h/2,w,h);ctx.restore();return;}
    if (images.sprites) {
      const [sx,sy,sw,sh]=SPRITE_RECTS[index],scale=Math.min(w/sw,h/sh),dw=sw*scale,dh=sh*scale;
      ctx.drawImage(images.sprites,sx,sy,sw,sh,-dw/2,-dh/2,dw,dh);
    } else fallback(ctx,index,0,0,w,h);
    ctx.restore();
  }
  function cover(ctx,w,h) {
    ctx.fillStyle = '#ece0f5'; ctx.fillRect(0,0,w,h);
    if(images.forest){const img=images.forest;const s=Math.max(w/img.width,h/img.height);ctx.drawImage(img,(w-img.width*s)/2,(h-img.height*s)/2,img.width*s,img.height*s);}
    const gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'#fffae000');gradient.addColorStop(1,'#fffae0dd');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  }
  function icon(canvas,index) {
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);const size=Math.min(canvas.width,canvas.height)*.95;sprite(ctx,index,canvas.width/2,canvas.height/2,size,size);
  }
  function menu(canvas,ball = 0,target = 4) {
    const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
    ctx.save();ctx.beginPath();ctx.moveTo(w*.27,h*.27);ctx.lineTo(w*.73,h*.27);ctx.lineTo(w*.95,h*.96);ctx.lineTo(w*.05,h*.96);ctx.closePath();ctx.clip();
    for(let i=0;i<COLORS.length;i++){ctx.fillStyle=COLORS[i]+'45';ctx.fillRect(w*.05+i*w*.15,h*.25,w*.15,h*.75);}ctx.restore();
    for(let i=0;i<7;i++)sprite(ctx,target,w*.24+i*w*.088,h*.32+Math.abs(i-3)*h*.015,105,125,(i-3)*.025);
    ctx.save();ctx.globalAlpha=.14;ctx.fillStyle='#364d39';ctx.beginPath();ctx.ellipse(w*.5,h*.82,95,18,0,0,7);ctx.fill();ctx.restore();
    sprite(ctx,ball,w*.5,h*.64,230);star(ctx,w*.14,h*.45,24);star(ctx,w*.84,h*.3,19,'#f39b65',.4);star(ctx,w*.79,h*.78,22,'#99be53');
  }
  function reward(canvas,count) {
    const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
    for(let i=0;i<12;i++){const a=i*Math.PI/6;star(ctx,w*.5+Math.cos(a)*w*.36,h*.53+Math.sin(a)*h*.36,8+i%3*3,COLORS[i%6],a);}
    ctx.save();ctx.shadowColor='#b78a3760';ctx.shadowBlur=12;ctx.shadowOffsetY=6;star(ctx,w*.5,h*.5,h*.42);ctx.restore();
    ctx.fillStyle='#4c5a39';for(const side of [-1,1]){ctx.beginPath();ctx.arc(w*.5+side*22,h*.5,4,0,7);ctx.fill();}ctx.beginPath();ctx.arc(w*.5,h*.53,15,0,Math.PI);ctx.lineWidth=4;ctx.strokeStyle='#4c5a39';ctx.stroke();
    if(count>1)star(ctx,w*.23,h*.57,34);if(count>2)star(ctx,w*.78,h*.53,34);
  }
  class Renderer {
    constructor(canvas) { this.canvas=canvas;this.ctx=canvas.getContext('2d');this.width=1000;this.height=650;this.particles=[];this.sparks=[];this.shake=0;this.autoReduced=false;this.frames=[]; }
    resize() { const r=this.canvas.getBoundingClientRect(); if(!r.width||!r.height)return;this.width=r.width;this.height=r.height;const d=Math.min(window.devicePixelRatio||1,2);if(this.canvas.width!==Math.round(r.width*d)||this.canvas.height!==Math.round(r.height*d)){this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);}this.ctx.setTransform(d,0,0,d,0,0); }
    project(x,y,z=0) { const laneWidth=Math.min(this.width*.94,this.height*1.65),scale=laneWidth/670,depth=1-.61*y/1100; return { x:this.width/2+x*scale*depth, y:this.height*.94-y/1100*this.height*.85-z*scale*depth, scale:scale*depth }; }
    ballPosition(game) { const p=this.project(game.ball.x,game.ball.y,game.ball.z);return{...p,r:Math.max(40,game.ball.r*1.4*p.scale)}; }
    aimAt(game,screenX,screenY) { const p=this.ballPosition(game);game.aim(Math.atan2((screenX-p.x)/Math.max(.45,p.scale),Math.max(75,(p.y-screenY)/Math.max(.45,p.scale)))); }
    events(events,reduced) {
      for(const e of events){if(['knock','monster-down','monster-hit'].includes(e.type)){if(this.particles.length<(reduced?24:120)){for(let i=0;i<(reduced?1:3);i++)this.particles.push({x:e.x,y:e.y,z:50,vx:(Math.random()-.5)*280,vy:Math.random()*150,vz:120+Math.random()*200,t:0,c:COLORS[Math.floor(Math.random()*6)]});} }if(['impact','monster-down'].includes(e.type)&&!reduced)this.shake=.24;}
    }
    step(dt,reduced) { this.shake=Math.max(0,this.shake-dt);for(const p of this.particles){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=360*dt;}this.particles=this.particles.filter(p=>p.t<1.3&&p.z>-20);if(reduced&&this.particles.length>24)this.particles.length=24; }
    draw(game,ballId,targetId,reduced) {
      this.resize();const ctx=this.ctx,w=this.width,h=this.height;ctx.clearRect(0,0,w,h);cover(ctx,w,h);ctx.save();if(this.shake&&!reduced)ctx.translate(Math.sin(game.clock*75)*this.shake*13,0);
      const nearL=this.project(-335,0),nearR=this.project(335,0),farL=this.project(-335,1080),farR=this.project(335,1080);
      const wood=ctx.createLinearGradient(0,farL.y,0,nearL.y);wood.addColorStop(0,'#efbe7a');wood.addColorStop(.6,'#ffdc9b');wood.addColorStop(1,'#f9ce84');
      ctx.save();ctx.beginPath();ctx.moveTo(nearL.x,nearL.y+20);ctx.lineTo(farL.x,farL.y);ctx.lineTo(farR.x,farR.y);ctx.lineTo(nearR.x,nearR.y+20);ctx.closePath();ctx.fillStyle=wood;ctx.fill();ctx.clip();
      for(let x=-335;x<=335;x+=55){const a=this.project(x,0),b=this.project(x,1080);ctx.beginPath();ctx.moveTo(a.x,a.y+20);ctx.lineTo(b.x,b.y);ctx.strokeStyle='#bb843e40';ctx.lineWidth=2;ctx.stroke();}
      for(let j=0;j<18;j++){const y=(j*71+32)%1100;const x=((j*83)%600)-300;const p=this.project(x,y);ctx.beginPath();ctx.ellipse(p.x,p.y,18*p.scale,3*p.scale,-.4,0,7);ctx.strokeStyle='#bb843e22';ctx.lineWidth=1;ctx.stroke();}ctx.restore();
      for(const side of [-1,1]){const a=this.project(side*342,0),b=this.project(side*342,1080);ctx.beginPath();ctx.moveTo(a.x,a.y+10);ctx.lineTo(b.x,b.y);ctx.strokeStyle='#38694b';ctx.lineWidth=Math.max(18,nearL.scale*30);ctx.lineCap='round';ctx.stroke();ctx.beginPath();ctx.moveTo(a.x-side*3,a.y);ctx.lineTo(b.x-side*3,b.y-4);ctx.strokeStyle='#94cf91';ctx.lineWidth=Math.max(12,nearL.scale*23);ctx.stroke();ctx.beginPath();ctx.moveTo(a.x-side*5,a.y-2);ctx.lineTo(b.x-side*5,b.y-7);ctx.strokeStyle='#d1ebac99';ctx.lineWidth=5;ctx.stroke();}
      if(game.mode==='boost')this.arrowStrip(460,game.clock,'#79bcb7',game.boosted);
      if(game.mode==='ramp'){const a=this.project(-190,415),b=this.project(190,415);round(ctx,a.x,a.y-10,b.x-a.x,28*a.scale,8,'#eaa06a','#bf784c');this.arrowStrip(440,game.clock,'#f6bf41',game.jumped);}
      for(const b of game.bumpers){const p=this.project(b.x,b.y);ctx.fillStyle='#705c8433';ctx.beginPath();ctx.ellipse(p.x,p.y+12,b.r*p.scale,15*p.scale,0,0,7);ctx.fill();const grad=ctx.createRadialGradient(p.x-10,p.y-25,2,p.x,p.y,b.r*p.scale);grad.addColorStop(0,b.flash?'#fff5a0':'#f7bdd4');grad.addColorStop(1,'#bd75a0');ctx.fillStyle=grad;ctx.beginPath();ctx.ellipse(p.x,p.y-22*p.scale,b.r*p.scale,b.r*.8*p.scale,0,0,7);ctx.fill();star(ctx,p.x,p.y-25*p.scale,24*p.scale,'#ffebac',game.clock*.2);}
      const ballSprite=(BowlingCore.BALLS.find(i=>i.id===ballId)||BowlingCore.BALLS[0]).sprite;
      const targetSprite=(BowlingCore.TARGETS.find(i=>i.id===targetId)||BowlingCore.TARGETS[0]).sprite;
      if(game.state==='aim'){
        game.aimPath().forEach((point,i)=>{if(!i)return;const p=this.project(point.x,point.y);ctx.beginPath();ctx.arc(p.x,p.y,5*p.scale+1.5,0,7);ctx.fillStyle=COLORS[(i-1)%6];ctx.fill();});
      }else if(ballId==='magic'||game.boosted){for(const [i,t] of game.trail.entries()){const p=this.project(t.x,t.y,t.z);ctx.globalAlpha=(i/game.trail.length)*.6;ctx.beginPath();ctx.arc(p.x,p.y,(game.ball.r+6)*p.scale,0,7);ctx.fillStyle=COLORS[i%6];ctx.fill();}ctx.globalAlpha=1;}
      const objects=game.pins.map(p=>({kind:'pin',object:p,y:p.y}));objects.push({kind:'ball',object:game.ball,y:game.ball.y});objects.sort((a,b)=>b.y-a.y);
      for(const object of objects){const p=object.object,point=this.project(p.x,p.y,p.z);if(object.kind==='ball'){if(game.state==='celebrate'&&game.mode!=='monster'&&p.y>1100)continue;const shadow=this.project(p.x,p.y);ctx.fillStyle='#71582b2b';ctx.beginPath();ctx.ellipse(shadow.x,shadow.y+8,p.r*point.scale,10*point.scale,0,0,7);ctx.fill();sprite(ctx,ballSprite,point.x,point.y-p.r*.6*point.scale,p.r*3.2*point.scale,p.r*3.2*point.scale,p.rotation*.22);}
        else{if(p.age>1.8&&p.down)continue;const monster=game.mode==='monster',size=(monster?330:110)*point.scale;if(point.x < -size || point.x>w+size||point.y<-size||point.y>h+size)continue;const wobble=reduced?0:monster&&game.monsterHit?Math.sin(game.clock*16)*.14:targetId==='jelly'||monster?Math.sin(game.clock*2.5+p.phase)*.045:0;sprite(ctx,monster?7:targetSprite,point.x,point.y-size*.36,size,size,p.down?p.rotation:wobble,p.down?Math.max(0,1-p.age/2):1);}
      }
      for(const particle of this.particles){const p=this.project(particle.x,particle.y,particle.z);ctx.globalAlpha=Math.max(0,1-particle.t/1.3);star(ctx,p.x,p.y,12*p.scale+3,particle.c,particle.t*3);}ctx.globalAlpha=1;
      if(game.state==='aim'&&game.aimElapsed<4){const p=this.ballPosition(game),bob=reduced?0:Math.sin(game.clock*3)*6;ctx.font=`${Math.max(25,Math.min(42,w*.08))}px sans-serif`;ctx.textAlign='center';ctx.fillText('☝',p.x+p.r+20,p.y+bob);}
      if(game.assisted&&!reduced){const p=this.project(game.ball.x,game.ball.y);star(ctx,p.x,p.y-60,20,'#fffaad',game.clock);}
      ctx.restore();
    }
    arrowStrip(y,time,color,active){const ctx=this.ctx;for(let i=-2;i<=2;i++){const p=this.project(i*75,y);ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.scale,p.scale);ctx.globalAlpha=active?.55:.8+Math.sin(time*4)*.15;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-24,10);ctx.lineTo(0,-14);ctx.lineTo(24,10);ctx.lineTo(24,27);ctx.lineTo(0,3);ctx.lineTo(-24,27);ctx.closePath();ctx.fill();ctx.restore();}}
  }
  root.BowlingArt = { load, sprite, icon, menu, reward, Renderer, star, round };
})(typeof globalThis !== 'undefined' ? globalThis : this);
