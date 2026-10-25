(function () {
  'use strict';
  const C = SalonCore;
  const paths = {
    lipstick: new Path2D('M262 374Q278 375 290 370Q296 368 300 372Q305 368 312 371Q329 377 338 374Q324 397 301 398Q279 398 262 374Z'),
    eyeshadow: new Path2D('M190 264C200 241 244 239 267 274L262 280C246 260 221 256 198 273ZM410 264C400 241 356 239 333 274L338 280C354 260 379 256 402 273Z'),
    eyeliner: new Path2D('M176 270Q187 278 200 267C218 251 241 255 262 283L264 289C241 265 218 260 201 276Q185 287 176 270ZM424 270Q413 278 400 267C382 251 359 255 338 283L336 289C359 265 382 260 399 276Q415 287 424 270Z'),
    blush: new Path2D('M175 343C175 315 258 318 269 345C278 381 188 386 175 343ZM425 343C425 315 342 318 331 345C322 381 412 386 425 343Z')
  };
  const shape = (ctx, path, color, stroke, width = 1) => {
    ctx.fillStyle = color; ctx.fill(path);
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(path); }
  };
  function ellipse(ctx, x, y, rx, ry, color) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  }
  function line(ctx, d, color, width = 2) {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(new Path2D(d));
  }
  function gradient(ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(s => g.addColorStop(...s)); return g;
  }
  function glow(ctx, x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, color.slice(0, 7) + '00');
    ellipse(ctx, x, y, r, r * .65, g);
  }
  class Renderer {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.makeup = document.createElement('canvas'); this.makeup.width = C.W; this.makeup.height = C.H;
      this.paint = this.makeup.getContext('2d');
      this.liner = document.createElement('canvas'); this.liner.width = C.W; this.liner.height = C.H;
      this.ink = this.liner.getContext('2d');
      this.blush = document.createElement('canvas'); this.blush.width = C.W; this.blush.height = C.H;
      this.cheeks = this.blush.getContext('2d');
      this.blushBase = document.createElement('canvas'); this.blushBase.width = C.W; this.blushBase.height = C.H;
      this.activeBlush = null; this.blushDirty = false;
    }
    touches(tool, x, y, radius) {
      const path = paths[tool];
      if (!path) return false;
      if (this.paint.isPointInPath(path, x, y)) return true;
      for (let i = 0; i < 8; i++) if (this.paint.isPointInPath(path, x + Math.cos(i * Math.PI / 4) * radius, y + Math.sin(i * Math.PI / 4) * radius)) return true;
      return false;
    }
    dab(stroke, x, y) {
      if(stroke.tool === 'blush') {
        if(this.activeBlush !== stroke){
          this.flushBlush();const base=this.blushBase.getContext('2d');base.clearRect(0,0,C.W,C.H);base.drawImage(this.blush,0,0);this.activeBlush=stroke;
        }
        this.blushDirty=true;return;
      }
      const ctx = stroke.tool === 'eyeliner' ? this.ink : this.paint, r = stroke.size / 2;
      const alpha = stroke.tool === 'eyeliner' ? ['ed','df'] : stroke.tool === 'eyeshadow' ? ['35','26'] : ['80','70'];
      ctx.save(); ctx.clip(paths[stroke.tool]);
      const brush = at => {
        const g = ctx.createRadialGradient(at, y, 0, at, y, r);
        g.addColorStop(0, stroke.color + alpha[0]);
        g.addColorStop(.55, stroke.color + alpha[1]);
        g.addColorStop(1, stroke.color + '00');
        ellipse(ctx, at, y, r, r, g);
      };
      brush(x); if (stroke.mirror) brush(C.W - x);
      ctx.restore();
    }
    drawBlush(ctx,stroke) {
      if(!stroke.points.length)return;
      ctx.save();ctx.clip(paths.blush);ctx.strokeStyle=stroke.color;ctx.lineCap='round';ctx.lineJoin='round';
      // Feather the whole gesture once. Color density stays even instead of forming a grid
      // where hundreds of low-alpha circular dabs overlap on a slow tablet drag.
      for(const mirrored of stroke.mirror ? [false,true] : [false]){
        ctx.beginPath();stroke.points.forEach(([x,y],i)=>{const at=mirrored?C.W-x:x;i?ctx.lineTo(at,y):ctx.moveTo(at,y);});
        if(stroke.points.length===1){const [x,y]=stroke.points[0];ctx.lineTo((mirrored?C.W-x:x)+.01,y);}
        for(let i=10;i>=1;i--){ctx.lineWidth=stroke.size*i/10;ctx.globalAlpha=.027;ctx.stroke();}
      }
      ctx.restore();
    }
    flushBlush() {
      if(!this.blushDirty)return;
      this.cheeks.clearRect(0,0,C.W,C.H);this.cheeks.drawImage(this.blushBase,0,0);
      this.drawBlush(this.cheeks,this.activeBlush);this.blushDirty=false;
    }
    rebuild(state) {
      this.paint.clearRect(0, 0, C.W, C.H);
      this.ink.clearRect(0, 0, C.W, C.H);
      this.cheeks.clearRect(0,0,C.W,C.H);this.activeBlush=null;this.blushDirty=false;
      for (const stroke of state.strokes) {
        if(stroke.tool==='blush')this.drawBlush(this.cheeks,stroke);
        else for (const p of stroke.points) this.dab(stroke, p[0], p[1]);
      }
    }
    face(ctx) {
      if (!SalonHair.loaded) return;
      ctx.drawImage(SalonHair.face, 68, 33, 464, 512);
      this.flushBlush(); ctx.drawImage(this.blush,0,0);
      ctx.save(); ctx.globalCompositeOperation='multiply'; ctx.drawImage(this.makeup,0,0); ctx.restore();
      ctx.drawImage(this.liner,0,0);
    }
    tool(ctx, tool, p, time) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (tool === 'lipstick') {
        ctx.rotate(.45); shape(ctx, new Path2D('M-7 0V-26Q-6-40 7-37V0Z'), '#ce7b9b');
        shape(ctx, new Path2D('M-10 0H10V20H-10Z'), '#e3c282');
        shape(ctx, new Path2D('M-12 17H12V50Q0 55-12 50Z'), '#a179ae'); line(ctx, 'M-8 24V45', '#b99f9955', 2);
      } else if (tool === 'eyeliner') {
        ctx.rotate(-.55);shape(ctx,new Path2D('M0-5L-4 9H4Z'),'#51405d');
        shape(ctx,new Path2D('M-4 9H4V58H-4Z'),'#8e75a9');line(ctx,'M-4 18H4','#e9cf8c',5);line(ctx,'M-2 26V52','#dfc9e5',1);
      } else if (tool === 'eyeshadow' || tool === 'blush') {
        ctx.rotate(-.55); ellipse(ctx, 0, -3, 12, 16, '#cfa8b2');
        if(tool==='blush'){ellipse(ctx,0,-8,22,21,'#e8a9c1');line(ctx,'M-13-12Q0-23 13-12','#f5d0dc',2);}
        shape(ctx, new Path2D('M-7 8H7L5 28H-5Z'), '#e5c689');
        line(ctx, 'M0 28V75', '#a880b5', 9); line(ctx, 'M-2 32V69', '#cfb2bb66', 2);
      } else if (tool === 'scissors') {
        const a = Math.sin(time / 90) * (p.active ? .2 : 0) + .25;
        for (const sign of [-1, 1]) { ctx.save(); ctx.rotate(a * sign); line(ctx, 'M0 0L-32-44', '#a2a6bc', 6); line(ctx, 'M0 0L22 25', '#b990bb', 7); ctx.strokeStyle = '#b990bb'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(27, 32, 10, 14, -.3, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        ellipse(ctx, 0, 0, 4, 4, '#d4bf95');
      } else if (tool === 'dryer') {
        const dir = p.x > 300 ? -1 : 1; ctx.scale(dir, 1); ctx.translate(-45, 0);
        shape(ctx, new Path2D('M-10-23Q-43-23-43 0T-10 23L23 15V-15Z'), '#c09bd2', '#9876af', 1.5);
        shape(ctx, new Path2D('M23-15H43V15H23Z'), '#d6b774');
        shape(ctx, new Path2D('M-17 20L-9 65Q-5 73 9 67L2 17Z'), '#c9a5d6');
        line(ctx, 'M-23-8V8M-16-9V9M-9-9V9', '#ead0c6', 2);
        if (p.active) for (let i = -1; i <= 1; i++) line(ctx, `M53 ${i * 12}q18 -7 35 0t35 0`, '#b0c6bf99', 2);
      }
      ctx.restore();
    }
    render(state, motion, options = {}) {
      const ctx = this.ctx, scale = this.canvas.width / C.W;
      ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.clearRect(0, 0, C.W, C.H);
      ctx.fillStyle = gradient(ctx,0,0,600,720,[[0,'#f8eaf1'],[.45,'#fff6ec'],[1,'#e9e0f0']]);ctx.fillRect(0,0,C.W,C.H);
      glow(ctx,300,230,320,'#fffef9cc');
      line(ctx,'M57 650V244C57-34 543-34 543 244V650','#d6b77955',2);
      line(ctx,'M69 650V244C69-16 531-16 531 244V650','#ffffffbb',4);
      for(const [x,y,r] of [[111,202,6],[487,244,7],[98,404,4],[496,464,4],[145,79,3],[445,108,4]]){
        line(ctx,`M${x-r} ${y}Q${x} ${y} ${x} ${y-r*1.5}Q${x} ${y} ${x+r} ${y}Q${x} ${y} ${x} ${y+r*1.5}Q${x} ${y} ${x-r} ${y}`,'#c9ab6c99',1.3);
      }
      const view = C.view(options.tool); ctx.translate(view.x, view.y); ctx.scale(view.scale, view.scale);
      this.face(ctx);
      SalonHair.draw(ctx,state,motion,options.chips);
      const a=state.accessories||{};
      SalonHair.jewel(ctx,a.head,204,23,192,128);
      SalonHair.jewel(ctx,a.clip,407,169,75,64);
      for(const x of [174,426]) SalonHair.jewel(ctx,a.ears,x-24,333,48,59);
      SalonHair.jewel(ctx,a.neck,250,459,100,67);
      if (options.pointer) {
        const p = options.pointer;
        if (C.isPaint(options.tool)) {
          ctx.beginPath(); ctx.arc(p.x, p.y, (options.size || 20) / 2, 0, Math.PI * 2); ctx.strokeStyle = '#a77f8980'; ctx.lineWidth = 1.2; ctx.stroke();
          if (options.tool !== 'lipstick' && options.mirror) { ctx.beginPath(); ctx.arc(600 - p.x, p.y, (options.size || 20) / 2, 0, Math.PI * 2); ctx.strokeStyle = '#a77f8940'; ctx.stroke(); }
        }
        this.tool(ctx, options.tool, p, options.time || 0);
      }
    }
  }
  window.SalonRenderer = {Renderer, paths};
})();
