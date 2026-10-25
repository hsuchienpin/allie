(function () {
  'use strict';
  const C = SalonCore;
  const paths = {
    face: new Path2D('M191 240C181 158 236 133 300 137C365 132 417 172 409 250L406 330C401 398 350 468 300 475C247 467 200 400 194 333Z'),
    lipstick: new Path2D('M265 393Q277 388 286 382Q293 380 300 386Q307 380 314 382Q325 389 335 393Q320 414 300 415Q279 413 265 393Z'),
    eyeshadow: new Path2D('M211 291C212 249 268 242 283 284Q254 298 211 291ZM317 284C332 242 388 249 389 291Q346 298 317 284Z'),
    eyeliner: new Path2D('M198 279Q209 290 214 293Q245 269 283 295L281 300Q246 277 216 303Q204 298 198 279ZM402 279Q391 290 386 293Q355 269 317 295L319 300Q354 277 384 303Q396 298 402 279Z'),
    blush: new Path2D('M201 350C201 320 269 317 279 347C286 384 213 386 201 350ZM399 350C399 320 331 317 321 347C314 384 387 386 399 350Z')
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
    hair(ctx, strand, length, bend, from = 0, style) {
      const points = C.samples(strand, length, bend, style).filter(p => p.t >= from);
      if (points.length < 2) return;
      const first = points[0], last = points[points.length - 1];
      const g = gradient(ctx, first.x, first.y, last.x, last.y,
        [[0, '#c99b61'], [.25, '#f0d095'], [.5, '#e5be7e'], [.72, '#efcd90'], [1, '#cda264']]);
      const normals = points.map((p, i) => {
        const a = points[Math.max(0, i - 1)], b = points[Math.min(points.length - 1, i + 1)];
        const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy) || 1;
        return {x: dy / distance, y: -dx / distance};
      });
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const p = points[i], taper = .8 + .2 * (1 - i / points.length), half = strand.width * taper / 2;
        const n = normals[i];
        if (i === 0) ctx.moveTo(p.x - n.x * half, p.y - n.y * half); else ctx.lineTo(p.x - n.x * half, p.y - n.y * half);
      }
      const end = normals[normals.length - 1];
      ctx.quadraticCurveTo(last.x - end.y * 6, last.y + end.x * 6, last.x + end.x * strand.width * .4, last.y + end.y * strand.width * .4);
      for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i], half = strand.width * (.8 + .2 * (1 - i / points.length)) / 2, n = normals[i]; ctx.lineTo(p.x + n.x * half, p.y + n.y * half);
      }
      ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x - 2, p.y + 2) : ctx.moveTo(p.x - 2, p.y + 2));
      ctx.strokeStyle = '#fff0c96b'; ctx.lineWidth = 1.05; ctx.stroke();
      ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x + 4, p.y) : ctx.moveTo(p.x + 4, p.y));
      ctx.strokeStyle = '#94653735'; ctx.lineWidth = .8; ctx.stroke();
    }
    face(ctx) {
      const neck = new Path2D('M263 428L263 539Q261 558 272 572Q300 589 328 572Q339 558 337 539L337 428Z');
      shape(ctx, neck, gradient(ctx, 264, 455, 327, 570, [[0, '#dca18d'], [.4, '#f5c9b4'], [1, '#ffe2cb']]));
      line(ctx, 'M268 478Q299 502 332 478', '#cd977e55', 2);
      for (const side of [-1, 1]) {
        ellipse(ctx, 300 + side * 111, 314, 20, 34, '#f0bca8');
        line(ctx, `M${300 + side * 115} 298q${side * 13} 8 0 26`, '#ce9585', 2);
      }
      shape(ctx, paths.face, gradient(ctx, 192, 245, 416, 340, [[0, '#eab59e'], [.22, '#fbd7bf'], [.5, '#ffe9d5'], [.78, '#f8d0b9'], [1, '#e6ae99']]), '#c9897c38');
      ctx.save(); ctx.clip(paths.face);
      glow(ctx, 231, 354, 37, '#ed9ba62c'); glow(ctx, 368, 354, 37, '#ed9ba62c');
      glow(ctx, 297, 210, 65, '#fff8df35'); glow(ctx, 300, 418, 38, '#ffe7c950');
      ctx.restore();
      this.flushBlush();ctx.drawImage(this.blush,0,0);ctx.drawImage(this.makeup, 0, 0);
    }
    details(ctx, closed) {
      // Tapered storybook brows and jewel-like irises share the original paint landmarks.
      shape(ctx,new Path2D('M211 250Q243 231 276 248L274 252Q242 242 211 253Z'),'#a27654');
      shape(ctx,new Path2D('M389 250Q357 231 324 248L326 252Q358 242 389 253Z'),'#a27654');
      for (const x of [247, 353]) {
        if (closed) {
          line(ctx, `M${x - 32} 299Q${x} 315 ${x + 32} 299`, '#5d4141', 3.6);
          const sign = x < 300 ? -1 : 1;
          for (let i = 0; i < 3; i++) line(ctx, `M${x + sign * (20 + i * 5)} ${303 - i * 2}l${sign * 5} 6`, '#5d4141', 2);
        } else {
          const eye = new Path2D(`M${x - 33} 300Q${x - 4} 272 ${x + 32} 299Q${x + 4} 333 ${x - 33} 300Z`);
          shape(ctx, eye, '#fff9eb'); ctx.save(); ctx.clip(eye);
          ellipse(ctx, x, 301, 17, 23, gradient(ctx, x, 278, x, 324, [[0, '#49385f'], [.45, '#8675b8'], [.75, '#b6a0d9'], [1, '#ddc9ec']]));
          for(let i=0;i<12;i++){const a=i*Math.PI/6;line(ctx,`M${x+Math.cos(a)*10} ${302+Math.sin(a)*12}L${x+Math.cos(a)*15} ${302+Math.sin(a)*20}`,'#f3dded70',.9);}
          ellipse(ctx, x, 299, 8, 14, '#3b304c'); ellipse(ctx, x-6, 290, 5, 5.7, '#fffef9'); ellipse(ctx, x+6, 310, 2.6, 2.6, '#fffdf3dd');
          ctx.restore(); line(ctx, `M${x - 33} 300Q${x - 4} 272 ${x + 32} 299`, '#65505c', 2.6);
          line(ctx, `M${x - 29} 305Q${x} 332 ${x + 28} 304`, '#bb8c90', 1.1);
          const sign = x < 300 ? -1 : 1;
          for (let i = 0; i < 4; i++) line(ctx, `M${x + sign * (19 + i * 4)} ${292 + i*2}q${sign * 7} -1 ${sign * 9} -8`, '#65505c', 1.9);
        }
      }
      line(ctx, 'M300 313Q294 338 293 348Q299 356 309 349', '#d29b80', 1.7);
      line(ctx, 'M286 357Q291 362 296 359M305 359Q310 362 314 356', '#c78e7a88', 1.4);
      line(ctx, 'M268 394Q284 397 300 395Q317 397 332 394', '#9e52675c', 1.6);
      line(ctx, 'M284 405Q300 409 314 404', '#ffe3d17a', 2.7);
      glow(ctx,300,343,8,'#fff6e780');
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
      shape(ctx, new Path2D('M154 299Q132 87 256 77Q405 43 446 213L449 342Q401 395 300 377Q181 392 154 299Z'), gradient(ctx,155,180,445,230,[[0,'#a97747'],[.3,'#e2bd7e'],[.6,'#f1d49a'],[1,'#b68a50']]));
      for (const s of C.template.filter(s => s.layer === 'back')) this.hair(ctx, s, state.lengths[s.id], motion[s.id].bend, 0, state.styles[s.id]);
      this.face(ctx);
      // The base lip color belongs beneath the paint, drawn on the face itself.
      ctx.save(); ctx.clip(paths.lipstick); ctx.fillStyle = gradient(ctx,300,381,300,416,[[0,'#d78a9c'],[.5,'#e8a5af'],[1,'#f1b9bd']]); ctx.fillRect(260, 376, 80, 45); ctx.drawImage(this.makeup, 0, 0); ctx.restore();
      this.details(ctx, false);
      for (const s of C.template.filter(s => s.layer === 'side')) this.hair(ctx, s, state.lengths[s.id], motion[s.id].bend, 0, state.styles[s.id]);
      // Swept crown roots blend into independently trimmable fringe tips.
      shape(ctx, new Path2D('M160 246Q144 112 245 88Q355 57 414 151Q352 105 285 123Q221 136 195 232L181 269Z'), gradient(ctx,172,100,382,200,[[0,'#ba8a51'],[.4,'#eac686'],[.65,'#f5dba0'],[1,'#c99d60']]));
      for (const s of C.template.filter(s => s.layer === 'fringe')) this.hair(ctx, s, state.lengths[s.id], motion[s.id].bend * .35, 0, state.styles[s.id]);
      line(ctx,'M172 204Q179 115 264 100M180 217Q192 133 268 111M303 103Q361 83 399 141','#fff2ca90',1.5);
      const a=state.accessories||{};
      SalonArt.draw(ctx,a.head,206,30,188,141);
      SalonArt.draw(ctx,a.clip,366,182,86,65);
      for(const x of [185,415])SalonArt.draw(ctx,a.ears,x-28,320,56,62);
      SalonArt.draw(ctx,a.neck,251,487,98,74);
      for (const chip of options.chips || []) {
        ctx.save(); ctx.translate(chip.dx, chip.dy); ctx.globalAlpha = Math.max(0, 1 - chip.age / 1.2);
        this.hair(ctx, chip.strand, chip.to, chip.bend, chip.from, chip.style); ctx.restore();
      }
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
