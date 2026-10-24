(function () {
  'use strict';
  const C = SalonCore;
  const paths = {
    face: new Path2D('M191 240C181 158 236 133 300 137C365 132 417 172 409 250L406 330C401 398 350 468 300 475C247 467 200 400 194 333Z'),
    lipstick: new Path2D('M265 393Q277 388 286 382Q293 380 300 386Q307 380 314 382Q325 389 335 393Q320 414 300 415Q279 413 265 393Z'),
    eyeshadow: new Path2D('M211 291C212 249 268 242 283 284Q254 298 211 291ZM317 284C332 242 388 249 389 291Q346 298 317 284Z')
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
    }
    touches(tool, x, y, radius) {
      const path = paths[tool];
      if (!path) return false;
      if (this.paint.isPointInPath(path, x, y)) return true;
      for (let i = 0; i < 8; i++) if (this.paint.isPointInPath(path, x + Math.cos(i * Math.PI / 4) * radius, y + Math.sin(i * Math.PI / 4) * radius)) return true;
      return false;
    }
    dab(stroke, x, y) {
      const ctx = this.paint, r = stroke.size / 2, eye = stroke.tool === 'eyeshadow';
      ctx.save(); ctx.clip(paths[stroke.tool]);
      const brush = at => {
        const g = ctx.createRadialGradient(at, y, 0, at, y, r);
        g.addColorStop(0, stroke.color + (eye ? '35' : '80'));
        g.addColorStop(.55, stroke.color + (eye ? '26' : '70'));
        g.addColorStop(1, stroke.color + '00');
        ellipse(ctx, at, y, r, r, g);
      };
      brush(x); if (stroke.mirror) brush(C.W - x);
      ctx.restore();
    }
    rebuild(state) {
      this.paint.clearRect(0, 0, C.W, C.H);
      for (const stroke of state.strokes) for (const p of stroke.points) this.dab(stroke, p[0], p[1]);
    }
    hair(ctx, strand, length, bend, from = 0, style) {
      const points = C.samples(strand, length, bend, style).filter(p => p.t >= from);
      if (points.length < 2) return;
      const first = points[0], last = points[points.length - 1];
      const g = gradient(ctx, first.x - strand.width / 2, 0, first.x + strand.width / 2, 0,
        [[0, '#63433c'], [.35, '#93664e'], [.62, '#ac7d58'], [1, '#705044']]);
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
      ctx.strokeStyle = '#d9ad7645'; ctx.lineWidth = 1.05; ctx.stroke();
      ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x + 4, p.y) : ctx.moveTo(p.x + 4, p.y));
      ctx.strokeStyle = '#513b3c22'; ctx.lineWidth = 1; ctx.stroke();
    }
    face(ctx) {
      const neck = new Path2D('M263 428L263 539Q261 558 272 572Q300 589 328 572Q339 558 337 539L337 428Z');
      shape(ctx, neck, gradient(ctx, 264, 455, 327, 570, [[0, '#dba38a'], [.4, '#f2c5a6'], [1, '#f9d8b9']]));
      line(ctx, 'M268 478Q299 502 332 478', '#cd977e55', 2);
      for (const side of [-1, 1]) {
        ellipse(ctx, 300 + side * 111, 314, 20, 34, '#edbb9f');
        line(ctx, `M${300 + side * 115} 298q${side * 13} 8 0 26`, '#cd967f', 2);
      }
      shape(ctx, paths.face, gradient(ctx, 192, 245, 416, 340, [[0, '#e8b599'], [.25, '#f7d1b3'], [.55, '#ffdfc2'], [.8, '#f6ccad'], [1, '#e7af94']]), '#d59e842a');
      ctx.save(); ctx.clip(paths.face);
      glow(ctx, 231, 354, 36, '#e3948650'); glow(ctx, 368, 354, 36, '#e3948650');
      glow(ctx, 297, 210, 65, '#fff8df35'); glow(ctx, 300, 418, 38, '#ffe7c950');
      ctx.restore();
      ctx.drawImage(this.makeup, 0, 0);
    }
    details(ctx, closed) {
      // Soft arched brows, separate from the makeup areas.
      line(ctx, 'M212 252Q246 237 277 251', '#815640', 6);
      line(ctx, 'M323 251Q354 237 388 252', '#815640', 6);
      for (const x of [247, 353]) {
        if (closed) {
          line(ctx, `M${x - 32} 299Q${x} 315 ${x + 32} 299`, '#5d4141', 3.6);
          const sign = x < 300 ? -1 : 1;
          for (let i = 0; i < 3; i++) line(ctx, `M${x + sign * (20 + i * 5)} ${303 - i * 2}l${sign * 5} 6`, '#5d4141', 2);
        } else {
          const eye = new Path2D(`M${x - 33} 300Q${x - 4} 276 ${x + 32} 299Q${x + 4} 324 ${x - 33} 300Z`);
          shape(ctx, eye, '#fff9eb'); ctx.save(); ctx.clip(eye);
          ellipse(ctx, x, 300, 15, 19, gradient(ctx, x, 282, x, 319, [[0, '#3e3737'], [.5, '#785b42'], [1, '#b59866']]));
          ellipse(ctx, x, 298, 7.5, 13, '#343033'); ellipse(ctx, x - 5, 291, 4.7, 5.2, '#fffdf3'); ellipse(ctx, x + 6, 306, 2, 2, '#fffdf3bb');
          ctx.restore(); line(ctx, `M${x - 33} 300Q${x - 4} 276 ${x + 32} 299`, '#5c4140', 3.6);
          line(ctx, `M${x - 29} 304Q${x} 323 ${x + 28} 304`, '#b17e6c', 1.1);
          const sign = x < 300 ? -1 : 1;
          for (let i = 0; i < 3; i++) line(ctx, `M${x + sign * (22 + i * 4)} ${295 + i}q${sign * 6} -2 ${sign * 7} -7`, '#5c4140', 2);
        }
      }
      line(ctx, 'M300 313Q294 338 293 348Q299 356 309 349', '#d29b80', 1.7);
      line(ctx, 'M286 357Q291 362 296 359M305 359Q310 362 314 356', '#c78e7a88', 1.4);
      line(ctx, 'M268 394Q284 397 300 395Q317 397 332 394', '#9e52675c', 1.6);
      line(ctx, 'M284 405Q300 409 314 404', '#ffe3d17a', 2.7);
      ellipse(ctx, 273, 364, 1, 1, '#bf867b55'); ellipse(ctx, 331, 364, 1, 1, '#bf867b55');
    }
    tool(ctx, tool, p, time) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (tool === 'lipstick') {
        ctx.rotate(.45); shape(ctx, new Path2D('M-7 0V-26Q-6-40 7-37V0Z'), '#c1677d');
        shape(ctx, new Path2D('M-10 0H10V20H-10Z'), '#ddba8a');
        shape(ctx, new Path2D('M-12 17H12V50Q0 55-12 50Z'), '#675157'); line(ctx, 'M-8 24V45', '#b99f9955', 2);
      } else if (tool === 'eyeshadow') {
        ctx.rotate(-.55); ellipse(ctx, 0, -3, 12, 16, '#cfa8b2');
        shape(ctx, new Path2D('M-7 8H7L5 28H-5Z'), '#ccb08a');
        line(ctx, 'M0 28V75', '#79616b', 9); line(ctx, 'M-2 32V69', '#cfb2bb66', 2);
      } else if (tool === 'scissors') {
        const a = Math.sin(time / 90) * (p.active ? .2 : 0) + .25;
        for (const sign of [-1, 1]) { ctx.save(); ctx.rotate(a * sign); line(ctx, 'M0 0L-32-44', '#9caaa5', 6); line(ctx, 'M0 0L22 25', '#839c87', 7); ctx.strokeStyle = '#839c87'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(27, 32, 10, 14, -.3, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        ellipse(ctx, 0, 0, 4, 4, '#d4bf95');
      } else {
        const dir = p.x > 300 ? -1 : 1; ctx.scale(dir, 1); ctx.translate(-45, 0);
        shape(ctx, new Path2D('M-10-23Q-43-23-43 0T-10 23L23 15V-15Z'), '#be8e95', '#a87380', 1.5);
        shape(ctx, new Path2D('M23-15H43V15H23Z'), '#7b666b');
        shape(ctx, new Path2D('M-17 20L-9 65Q-5 73 9 67L2 17Z'), '#cfa1a3');
        line(ctx, 'M-23-8V8M-16-9V9M-9-9V9', '#ead0c6', 2);
        if (p.active) for (let i = -1; i <= 1; i++) line(ctx, `M53 ${i * 12}q18 -7 35 0t35 0`, '#b0c6bf99', 2);
      }
      ctx.restore();
    }
    render(state, motion, options = {}) {
      const ctx = this.ctx, scale = this.canvas.width / C.W;
      ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.clearRect(0, 0, C.W, C.H);
      ctx.fillStyle = gradient(ctx, 0, 0, 600, 720, [[0, '#fffaf0'], [.55, '#fbf0e2'], [1, '#eee1d0']]); ctx.fillRect(0, 0, C.W, C.H);
      glow(ctx, 305, 220, 300, '#ffffff80');
      const view = C.view(options.tool); ctx.translate(view.x, view.y); ctx.scale(view.scale, view.scale);
      shape(ctx, new Path2D('M154 299Q132 87 256 77Q405 43 446 213L449 342Q401 395 300 377Q181 392 154 299Z'), gradient(ctx, 155, 180, 445, 230, [[0, '#68453c'], [.3, '#91654b'], [.6, '#ad8058'], [1, '#694a40']]));
      for (const s of C.template.filter(s => s.layer === 'back')) this.hair(ctx, s, state.lengths[s.id], motion[s.id].bend, 0, state.styles[s.id]);
      this.face(ctx);
      // The base lip color belongs beneath the paint, drawn on the face itself.
      ctx.save(); ctx.clip(paths.lipstick); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#d5958b'; ctx.fillRect(260, 376, 80, 45); ctx.drawImage(this.makeup, 0, 0); ctx.restore();
      this.details(ctx, options.tool === 'eyeshadow');
      for (const s of C.template.filter(s => s.layer === 'side')) this.hair(ctx, s, state.lengths[s.id], motion[s.id].bend, 0, state.styles[s.id]);
      // Swept crown roots blend into independently trimmable fringe tips.
      shape(ctx, new Path2D('M160 246Q144 112 245 88Q355 57 414 151Q352 105 285 123Q221 136 195 232L181 269Z'), gradient(ctx, 172, 100, 382, 200, [[0, '#69493d'], [.4, '#a47651'], [.65, '#b28a60'], [1, '#78513e']]));
      for (const s of C.template.filter(s => s.layer === 'fringe')) this.hair(ctx, s, state.lengths[s.id], motion[s.id].bend * .35, 0, state.styles[s.id]);
      line(ctx, 'M172 204Q179 115 264 100M180 217Q192 133 268 111M303 103Q361 83 399 141', '#e1bd8240', 1.5);
      for (const chip of options.chips || []) {
        ctx.save(); ctx.translate(chip.dx, chip.dy); ctx.globalAlpha = Math.max(0, 1 - chip.age / 1.2);
        this.hair(ctx, chip.strand, chip.to, chip.bend, chip.from, chip.style); ctx.restore();
      }
      if (options.pointer) {
        const p = options.pointer;
        if (options.tool === 'lipstick' || options.tool === 'eyeshadow') {
          ctx.beginPath(); ctx.arc(p.x, p.y, (options.size || 20) / 2, 0, Math.PI * 2); ctx.strokeStyle = '#a77f8980'; ctx.lineWidth = 1.2; ctx.stroke();
          if (options.tool === 'eyeshadow' && options.mirror) { ctx.beginPath(); ctx.arc(600 - p.x, p.y, (options.size || 20) / 2, 0, Math.PI * 2); ctx.strokeStyle = '#a77f8940'; ctx.stroke(); }
        }
        this.tool(ctx, options.tool, p, options.time || 0);
      }
    }
  }
  window.SalonRenderer = {Renderer, paths};
})();
