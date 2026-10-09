(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BowlingCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='little-game-park.bowling.v1',HALF_WIDTH=300,LENGTH=1450,BALL_RADIUS=58,PIN_RADIUS=29;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const BALLS=[{id:'watermelon',name:'Pink Ball',sprite:0},{id:'donut',name:'Blue Ball',sprite:1},{id:'hedgehog',name:'Mint Ball',sprite:2},{id:'magic',name:'Purple Ball',sprite:3}];
  const LEGACY_STICKERS=['heart','star','rainbow','sun','watermelon','flower','butterfly','rocket','castle','balloon','donut','crown'];
  function seededRandom(seed){let v=seed>>>0;return()=>{v+=0x6D2B79F5;let t=v;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
  function frameComplete(index,rolls){if(index<9)return rolls[0]===10||rolls.length===2;return rolls.length===3||(rolls.length===2&&rolls[0]!==10&&rolls[0]+rolls[1]<10);}
  function rackCapacity(index,rolls){if(!rolls.length)return 10;if(index<9)return 10-rolls[0];if(rolls.length===1)return rolls[0]===10?10:10-rolls[0];return rolls[0]!==10||rolls[1]===10?10:10-rolls[1];}
  function marks(index,rolls){return rolls.map((n,i)=>{if(i>0&&((index<9&&i===1)||(index===9&&i===1&&rolls[0]<10)||(index===9&&i===2&&rolls[0]===10&&rolls[1]<10))&&rolls[i-1]+n===10)return '/';return n===10?'X':n===0?'−':String(n);});}
  function scoreFrames(frames){let total=0,contiguous=true;const rows=frames.map((rolls,i)=>{let score=null;const future=frames.slice(i+1).flat();if(frameComplete(i,rolls)){if(i===9)score=rolls.reduce((a,b)=>a+b,0);else if(rolls[0]===10){if(future.length>=2)score=10+future[0]+future[1];}else if(rolls[0]+rolls[1]===10){if(future.length)score=10+future[0];}else score=rolls[0]+rolls[1];}if(score===null)contiguous=false;else if(contiguous)total+=score;return{rolls:rolls.slice(),marks:marks(i,rolls),score,total:contiguous?total:null};});return{rows,total,complete:frames.length===10&&frames.every((r,i)=>frameComplete(i,r))};}
  class Scorecard{
    constructor(){this.frames=Array.from({length:10},()=>[]);this.index=0;this.completed=false;}
    get capacity(){return this.completed?0:rackCapacity(this.index,this.frames[this.index]);}
    get scores(){return scoreFrames(this.frames);}
    add(pins){if(this.completed||!Number.isInteger(pins)||pins<0||pins>this.capacity)throw Error('Invalid pinfall');const index=this.index,rolls=this.frames[index];rolls.push(pins);const roll=rolls.length,strike=pins===10&&(roll===1||index===9&&rackCapacity(index,rolls.slice(0,-1))===10),spare=roll>1&&marks(index,rolls).at(-1)==='/';const complete=frameComplete(index,rolls);if(complete){if(index===9)this.completed=true;else this.index++;}const newRack=complete||pins===10||index===9&&roll===2&&rolls[0]+rolls[1]===10;return{frame:index+1,roll,pins,strike,spare,frameComplete:complete,newRack,completed:this.completed};}
  }
  function makePins(random=Math.random){const pins=[];for(let row=0;row<4;row++)for(let col=0;col<=row;col++){const x=(col-row/2)*155,y=855+row*134.25;pins.push({id:pins.length,x,y,homeX:x,homeY:y,vx:0,vy:0,r:PIN_RADIUS,mass:1.6*(.97+random()*.06),down:false,rotation:0,spin:0,age:0});}return pins;}
  // Gesture samples use lane coordinates, with y increasing toward the pins.
  function shotFromGesture(samples){if(!Array.isArray(samples)||samples.length<2||!samples.every(p=>[p.x,p.y,p.t].every(Number.isFinite)))return null;const first=samples[0],last=samples.at(-1),dy=last.y-first.y,ms=last.t-first.t;if(dy<85||ms<20||ms>8000||last.y<Math.max(...samples.map(p=>p.y))-45)return null;const mid=samples[Math.floor((samples.length-1)/2)];let hook=0;if(mid.y-first.y>30&&last.y-mid.y>30){hook=clamp(((last.x-mid.x)/(last.y-mid.y)-(mid.x-first.x)/(mid.y-first.y))*90,-75,75);}return{angle:clamp(Math.atan2(last.x-first.x,dy),-.68,.68),speed:clamp(350+dy/ms*135,370,690),hook};}
  function collide(a,b){const dx=b.x-a.x,dy=b.y-a.y,r=a.r+b.r,d=Math.hypot(dx,dy);if(d>=r)return;const nx=d?dx/d:0,ny=d?dy/d:1,ia=1/a.mass,ib=1/b.mass,penetration=r-d;
    a.x-=nx*penetration*ia/(ia+ib);a.y-=ny*penetration*ia/(ia+ib);b.x+=nx*penetration*ib/(ia+ib);b.y+=ny*penetration*ib/(ia+ib);
    const approach=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(approach>=0)return;const impulse=-(1+.24)*approach/(ia+ib);a.vx-=impulse*ia*nx;a.vy-=impulse*ia*ny;b.vx+=impulse*ib*nx;b.vy+=impulse*ib*ny;
  }
  class Game{
    constructor(options={}){this.random=options.random||Math.random;this.card=new Scorecard();this.startX=0;this.pins=makePins(this.random);this.state='aim';this.paused=false;this.completed=false;this.clock=0;this.events=[];this.lastRoll=null;this.setupBall();}
    setupBall(){this.ball={x:this.startX,y:85,vx:0,vy:0,r:BALL_RADIUS,mass:8,rotation:0};this.gutter=false;this.hook=0;this.trail=[];this.rollTime=0;this.settleTime=0;this.beforeDown=this.pins.filter(p=>p.down).length;this.state='aim';}
    get frame(){return this.state==='aim'?this.card.index+1:this.lastRoll&&this.state==='next'?this.lastRoll.frame:this.card.index+1;}
    get roll(){return this.card.completed?this.lastRoll.roll:this.card.frames[this.card.index].length+1;}
    get score(){return this.card.scores.total;}
    get progress(){return this.completed?1:this.card.index/10;}
    get standing(){return this.pins.filter(p=>!p.down).length;}
    moveStart(x){if(this.state!=='aim'||this.paused||!Number.isFinite(x))return false;this.startX=clamp(x,-HALF_WIDTH+BALL_RADIUS+8,HALF_WIDTH-BALL_RADIUS-8);this.ball.x=this.startX;return true;}
    launch(shot){if(this.state!=='aim'||this.paused||!shot||![shot.angle,shot.speed,shot.hook??0].every(Number.isFinite)||shot.speed<=0)return false;const angle=clamp(shot.angle,-.68,.68),speed=clamp(shot.speed,370,690);this.ball.vx=Math.sin(angle)*speed;this.ball.vy=Math.cos(angle)*speed;this.hook=clamp(shot.hook||0,-75,75);this.state='rolling';this.events.push({type:'launch'});return true;}
    // A fallen pin occupies more floor space; only actual contact transfers momentum.
    knock(pin){if(pin.down)return false;pin.down=true;pin.age=0;pin.spin=clamp(pin.vx/90,-5,5);pin.r=55;this.events.push({type:'knock',x:pin.x,y:pin.y});return true;}
    physics(dt){const b=this.ball;for(const p of this.pins){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-1.6*dt);p.vy*=Math.exp(-1.6*dt);if(p.down){p.age+=dt;p.rotation+=p.spin*dt;p.spin*=Math.exp(-2*dt);}}
      if(this.state==='rolling'){if(!this.gutter&&b.y>260)b.vx+=this.hook*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=Math.exp(-.035*dt);b.vy*=Math.exp(-.035*dt);b.rotation+=Math.hypot(b.vx,b.vy)*dt/b.r;
        if(!this.gutter&&Math.abs(b.x)>=HALF_WIDTH){this.gutter=true;b.x=Math.sign(b.x)*(HALF_WIDTH+42);b.vx=0;this.events.push({type:'gutter'});}
        if(!this.gutter)for(const p of this.pins)if(p.y<LENGTH+100&&p.age<2.5)collide(b,p);
      }
      for(let i=0;i<this.pins.length;i++)for(let j=i+1;j<this.pins.length;j++){const a=this.pins[i],p=this.pins[j];if(a.age<2.5&&p.age<2.5&&(!a.down||!p.down||Math.hypot(a.vx,a.vy)+Math.hypot(p.vx,p.vy)>30))collide(a,p);}
      for(const p of this.pins)if(!p.down&&Math.hypot(p.vx,p.vy)>105)this.knock(p);
    }
    step(dt,reduced=false){if(!Number.isFinite(dt)||dt<=0||this.paused||this.state==='next'||this.state==='result')return;dt=Math.min(dt,1/30);this.clock+=dt;if(this.state==='aim')return;this.rollTime+=dt;const steps=Math.ceil(dt*120);for(let i=0;i<steps;i++)this.physics(dt/steps);
      if(this.state==='rolling'){this.trail.push({x:this.ball.x,y:this.ball.y});if(this.trail.length>(reduced?8:22))this.trail.shift();if(this.ball.y>LENGTH+70||this.rollTime>=7){this.state='settle';this.settleTime=0;}}
      else if(this.state==='settle'){this.settleTime+=dt;if((this.settleTime>1.1&&this.pins.every(p=>Math.hypot(p.vx,p.vy)<14))||this.settleTime>=2.5)this.finishRoll();}
    }
    finishRoll(){if(this.state!=='settle')return;const count=this.pins.filter(p=>p.down).length-this.beforeDown;this.lastRoll={...this.card.add(count),gutter:this.gutter&&count===0};this.completed=this.card.completed;this.state=this.completed?'result':'next';this.events.push({type:this.completed?'result':'next',...this.lastRoll});}
    next(){if(this.state!=='next'||this.paused)return false;if(this.lastRoll.newRack)this.pins=makePins(this.random);else this.pins=this.pins.filter(p=>!p.down).map(p=>({...p,vx:0,vy:0,rotation:0,spin:0,age:0}));this.setupBall();return true;}
    drainEvents(){return this.events.splice(0);}
    preview(shot){const points=[{x:this.startX,y:85}];if(!shot)return points;let x=this.startX,y=85,vx=Math.sin(shot.angle)*shot.speed,vy=Math.cos(shot.angle)*shot.speed;for(let i=0;i<12;i++){if(y>260)vx+=(shot.hook||0)*.05;x+=vx*.05;y+=vy*.05;points.push({x,y});if(Math.abs(x)>HALF_WIDTH)break;}return points;}
  }
  function defaults(){return{version:1,stars:0,rounds:0,stickers:[],ball:'watermelon',target:'pin',sound:true,reduced:false,best:0,lastScore:0};}
  function validProgress(raw){const p=defaults();if(!raw||raw.version!==1)return p;for(const key of ['stars','rounds'])if(Number.isSafeInteger(raw[key])&&raw[key]>=0)p[key]=Math.min(raw[key],1000000);p.stickers=Array.isArray(raw.stickers)?[...new Set(raw.stickers.filter(id=>LEGACY_STICKERS.includes(id)))]:[];if(BALLS.some(i=>i.id===raw.ball))p.ball=raw.ball;for(const key of ['best','lastScore'])if(Number.isInteger(raw[key])&&raw[key]>=0&&raw[key]<=300)p[key]=raw[key];p.sound=typeof raw.sound==='boolean'?raw.sound:true;p.reduced=raw.reduced===true;return p;}
  class Store{constructor(storage){this.storage=storage;this.available=true;this.error='';try{this.data=validProgress(JSON.parse(storage.getItem(KEY)||'null'));}catch(_){this.data=defaults();this.available=false;this.error='紀錄暫存於目前頁面，關閉後可能消失。';}}save(){try{this.storage.setItem(KEY,JSON.stringify(this.data));this.available=true;this.error='';}catch(_){this.available=false;this.error='紀錄暫存於目前頁面，關閉後可能消失。';}return this.available;}selectBall(id){if(!BALLS.some(b=>b.id===id))return false;this.data.ball=id;this.save();return true;}}
  return{Game,Scorecard,scoreFrames,marks,frameComplete,shotFromGesture,makePins,Store,validProgress,KEY,BALLS,HALF_WIDTH,LENGTH,BALL_RADIUS,PIN_RADIUS,clamp,seededRandom};
});
