(function(root){
  'use strict';
  const C=BowlingCore,colors=['#ed80b1','#77b9f2','#78cfbf','#b598e7'];let atlas;
  async function load(){await new Promise(resolve=>{atlas=new Image();atlas.onload=atlas.onerror=resolve;atlas.src=Allie.url('bowling/assets/sprites.png');});}
  function ball(ctx,x,y,r,index,rotation=0){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);const grad=ctx.createRadialGradient(-r*.35,-r*.45,r*.05,0,0,r);grad.addColorStop(0,'#fff');grad.addColorStop(.25,colors[index]||colors[0]);grad.addColorStop(1,'#755c9c');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#514562';for(const [dx,dy]of [[-.16,-.25],[.2,-.24],[.03,.05]]){ctx.beginPath();ctx.arc(dx*r,dy*r,r*.095,0,Math.PI*2);ctx.fill();}ctx.restore();}
  function pin(ctx,x,y,s,rotation=0){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);if(atlas?.naturalWidth)ctx.drawImage(atlas,157,431,174,404,-s*29,-s*140,s*58,s*140);else{ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,-s*50,s*26,s*48,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ed80b1';ctx.fillRect(-s*15,-s*81,s*30,s*10);}ctx.restore();}
  class Renderer{
    constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.resize();}
    resize(){const box=this.canvas.getBoundingClientRect();this.width=Math.max(1,box.width);this.height=Math.max(1,box.height);const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);this.scale=Math.min(this.width*.93/770,this.height/750);}
    project(x,y){const depth=1-.62*y/C.LENGTH;return{x:this.width/2+x*this.scale*depth,y:this.height*.94-y/C.LENGTH*this.height*.84,s:this.scale*depth};}
    unproject(x,y){const ly=(this.height*.94-y)/(.84*this.height)*C.LENGTH;return{x:(x-this.width/2)/(this.scale*(1-.62*ly/C.LENGTH)),y:ly};}
    ballPosition(g){const p=this.project(g.ball.x,g.ball.y);return{...p,r:Math.max(22,C.BALL_RADIUS*p.s)};}
    draw(g,id,shot){const ctx=this.ctx,w=this.width,h=this.height;ctx.clearRect(0,0,w,h);const polygon=(xs,fill)=>{ctx.fillStyle=fill;ctx.beginPath();xs.forEach(([x,y],i)=>{const p=this.project(x,y);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.closePath();ctx.fill();};
      polygon([[-390,0],[390,0],[390,C.LENGTH],[-390,C.LENGTH]],'#cbb6dd');polygon([[-375,0],[-302,0],[-302,C.LENGTH],[-375,C.LENGTH]],'#857391');polygon([[302,0],[375,0],[375,C.LENGTH],[302,C.LENGTH]],'#857391');polygon([[-300,0],[300,0],[300,C.LENGTH],[-300,C.LENGTH]],'#f7dfb6');
      ctx.strokeStyle='#d9b992';ctx.lineWidth=1;for(let x=-250;x<=250;x+=50){const a=this.project(x,0),b=this.project(x,C.LENGTH);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}const a=this.project(-300,165),b=this.project(300,165);ctx.strokeStyle='#ad79ab';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      ctx.fillStyle='#b99588';for(let x=-210;x<=210;x+=70){const p=this.project(x,405);ctx.beginPath();ctx.moveTo(p.x,p.y-5);ctx.lineTo(p.x-4,p.y+4);ctx.lineTo(p.x+4,p.y+4);ctx.fill();}
      if(g.state==='aim'&&shot){ctx.fillStyle='#9579bc';for(const point of g.preview(shot).slice(1)){const p=this.project(point.x,point.y);ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fill();}}
      for(const p of g.pins.slice().sort((a,b)=>b.y-a.y)){if(p.down&&p.age>1.5)continue;const pos=this.project(p.x,p.y);ctx.globalAlpha=p.down?Math.max(0,1-p.age/1.5):1;pin(ctx,pos.x,pos.y,pos.s,p.down?Math.PI/2+p.rotation:0);}ctx.globalAlpha=1;
      if(g.state==='aim'||g.state==='rolling'){const pos=this.ballPosition(g);if(g.ball.y<C.LENGTH+60)ball(ctx,pos.x,pos.y,pos.r,C.BALLS.findIndex(b=>b.id===id),g.ball.rotation);}
      if(g.state==='aim'){const pos=this.ballPosition(g);ctx.strokeStyle='#a283c1';ctx.lineWidth=2;for(const direction of [-1,1]){const x=pos.x+direction*(pos.r+18);ctx.beginPath();ctx.moveTo(x-direction*7,pos.y-5);ctx.lineTo(x,pos.y);ctx.lineTo(x-direction*7,pos.y+5);ctx.stroke();}}
    }
  }
  function icon(canvas,index){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ball(ctx,canvas.width/2,canvas.height/2,canvas.height*.35,index);}
  function menu(canvas,index){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);for(let row=3;row>=0;row--)for(let col=0;col<=row;col++)pin(ctx,canvas.width*.63+(col-row/2)*48,70+(3-row)*40,.8);ball(ctx,canvas.width*.3,150,62,index);}
  root.BowlingArt={Renderer,load,icon,menu};
})(window);
