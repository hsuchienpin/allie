(function(root){
'use strict';
if(window.AllieScreen?.isHost)return;
const C=RunnerCore,images={},map={runner:'princess-rainbow',bicycle:'unicorn',motorcycle:'penguin',car:'princess-candy'};
const ready=Promise.all(['garden','playground','playhouse','softserve','ball-pink','ball-blue','balloon-heart',...Object.values(map),...Object.values(map).map(id=>id+'-walk')].map(async id=>{images[id]=await Allie.art(id);}));
function star(c,x,y,r,fill='#d6b66e'){c.save();c.translate(x,y);c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fillStyle=fill;c.fill();c.restore();}
function picture(c,id,x,y,size,angle=0){const im=images[id];if(!im)return;c.save();c.translate(x,y);c.rotate(angle);c.drawImage(im,-size/2,-size/2,size,size);c.restore();}
function vehicle(c,id,x,y,scale=1,time=0,steer=0,reduced=false){const phase=reduced?0:time*9,bob=reduced?0:Math.abs(Math.sin(phase))*4*scale;c.save();c.translate(x,y-bob);c.rotate(reduced?0:steer*.07+Math.sin(phase)*.018);c.scale(1+(reduced?0:Math.sin(phase*2)*.018),1-(reduced?0:Math.sin(phase*2)*.018));const frame=!reduced&&time>0&&Math.floor(time*5)%2?map[id]+'-walk':map[id];picture(c,frame,0,0,100*scale);c.restore();}
class Renderer{
constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.previousX=null;this.steer=0;this.resize();}
resize(){const b=this.canvas.getBoundingClientRect();this.w=Math.max(1,b.width);this.h=Math.max(1,b.height);const d=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(this.w*d);this.canvas.height=Math.round(this.h*d);this.ctx.setTransform(d,0,0,d,0,0);}
project(x,y){const z=Math.max(-.15,Math.min(1.3,y/C.H)),depth=.22+.78*z;return{x:this.w/2+(x-C.W/2)/(C.RIGHT-C.LEFT)*this.w*.87*depth,y:this.h*(.25+.72*z),s:depth*this.w*.87/(C.RIGHT-C.LEFT)};}
shadow(x,y,w){const c=this.ctx;c.fillStyle='#7c667e25';c.beginPath();c.ellipse(x,y,w,w*.25,0,0,Math.PI*2);c.fill();}
draw(g,reduced){const c=this.ctx,w=this.w,h=this.h;c.clearRect(0,0,w,h);c.fillStyle='#e7eddf';c.fillRect(0,0,w,h);if(images.garden){const im=images.garden,scale=Math.max(w/im.width,h/im.height);c.drawImage(im,(w-im.width*scale)/2,(h-im.height*scale)/2,im.width*scale,im.height*scale);}c.fillStyle=['#fff6eb20','#d5e4cf22','#d7daf033','#f5d8df33'][g.sceneIndex];c.fillRect(0,0,w,h);
const left=this.project(C.LEFT,0),right=this.project(C.RIGHT,0),bl=this.project(C.LEFT,C.H*1.15),br=this.project(C.RIGHT,C.H*1.15);c.beginPath();c.moveTo(left.x,left.y);c.lineTo(right.x,right.y);c.lineTo(br.x,br.y);c.lineTo(bl.x,bl.y);c.closePath();const road=c.createLinearGradient(0,0,0,h);road.addColorStop(0,'#eee1cf');road.addColorStop(1,'#f7edde');c.fillStyle=road;c.fill();c.strokeStyle='#d9c6b5';c.lineWidth=2;c.stroke();
// Ground markers use the same projection as the collision world.
c.strokeStyle='#d9cbb870';c.lineWidth=1;for(let lane=1;lane<5;lane++){for(let y=((g.scroll%110)-110);y<C.H;y+=110){const x=C.LEFT+(C.RIGHT-C.LEFT)*lane/5,a=this.project(x,y),b=this.project(x,y+35);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}}
const decor=['playground','playground','playhouse','softserve'][g.sceneIndex];if(g.sceneIndex>0)picture(c,decor,w*.11,h*.39,Math.min(w*.21,h*.36),-.035);picture(c,'balloon-heart',w*.88,h*.25,Math.min(w*.13,h*.27),.07);
for(const o of g.objects.slice().sort((a,b)=>a.y-b.y)){if(o.consumed)continue;const p=this.project(o.x,o.y);if(p.y<0)continue;const size=Math.max(12,o.w*p.s*1.65);this.shadow(p.x,p.y+size*.28,size*.25);if(o.kind==='coin'||o.kind==='star'){star(c,p.x,p.y,Math.max(6,o.w*p.s*.53),o.kind==='star'?'#b9a7cf':'#d6b66e');}else{picture(c,o.id%2?'ball-pink':'ball-blue',p.x,p.y,size,reduced?0:o.age*.35);if(o.warning){c.fillStyle='#9472a0';c.font='bold 18px sans-serif';c.textAlign='center';c.fillText('!',p.x,p.y-size*.55);}}}
const p=this.project(g.x,g.y),size=Math.max(72,Math.min(132,Math.max(g.vehicle.width,g.vehicle.height)*p.s*1.7));this.shadow(p.x,p.y+size*.32,size*.24);if(g.armor>0||g.invincible>0){c.strokeStyle='#b9a7cf99';c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y,size*.43,size*.49,0,0,Math.PI*2);c.stroke();}const delta=this.previousX==null?0:g.x-this.previousX;this.steer=this.steer*.82+Math.sign(delta)*.18;this.previousX=g.x;c.save();if(g.hurt>0)c.globalAlpha=reduced?.7:.55+Math.abs(Math.sin(g.hurt*9))*.45;vehicle(c,g.vehicleId,p.x,p.y,size/100,g.elapsed,this.steer,reduced);c.restore();
}
}
root.RunnerArt={Renderer,star,vehicle,ready,images};
})(window);
