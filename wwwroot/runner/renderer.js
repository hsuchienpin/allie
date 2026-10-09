(function (root) {
  'use strict';
  const C = root.RunnerCore;
  const ink = '#513065'; const allieImages={};
  ['unicorn','princess-rainbow','penguin','princess-candy','playground','playhouse','softserve','ball-pink','balloon-heart'].forEach(id=>Allie.sticker(id).then(image=>allieImages[id]=image).catch(()=>{}));
  function rounded(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function circle(ctx, x, y, r, fill, stroke) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function line(ctx, points, color, width) {
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  }
  function star(ctx, x, y, radius, fill = '#ffda63') {
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? radius * .48 : radius; const xx = x + Math.cos(a) * r, yy = y + Math.sin(a) * r; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = '#c69435'; ctx.lineWidth = 2; ctx.stroke();
  }
  function cactus(ctx, x, y, scale = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    line(ctx, [[-13, 4], [-13, -8], [-13, 4], [0, 4], [0, -20], [0, 20]], '#376a47', 11);
    line(ctx, [[0, 8], [14, 8], [14, -3]], '#376a47', 10);
    line(ctx, [[-2, -18], [-2, 18]], '#76a863', 3); ctx.restore();
  }
  function tree(ctx, x, y, scale = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    rounded(ctx, -5, -5, 10, 30, 3, '#80674c');
    circle(ctx, 0, -8, 24, '#23654d'); circle(ctx, -14, -12, 17, '#4da470'); circle(ctx, 13, -14, 18, '#67b87b'); circle(ctx, 0, -25, 18, '#86c787'); ctx.restore();
  }
  function person(ctx, color, t, moving) {
    const swing = moving ? Math.sin(t * 12) * 5 : 0;
    line(ctx, [[-6, 9], [-8 - swing, 23]], '#426a79', 8); line(ctx, [[6, 9], [8 + swing, 23]], '#426a79', 8);
    circle(ctx, -8 - swing, 24, 5, '#354a45'); circle(ctx, 8 + swing, 24, 5, '#354a45');
    line(ctx, [[-8, -4], [-17, 8 + swing]], '#f6c499', 6); line(ctx, [[8, -4], [17, 8 - swing]], '#f6c499', 6);
    rounded(ctx, -12, -11, 24, 28, 8, color, ink); circle(ctx, 0, -17, 12, '#f6c499', ink);
    rounded(ctx, -12, -26, 24, 11, 6, '#825541');
  }
  function vehicle(ctx, id, x, y, scale = 1, time = 0, moving = false) {
    const art=allieImages[{runner:'princess-rainbow',bicycle:'unicorn',motorcycle:'penguin',car:'princess-candy'}[id]]; if(art){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);const w=id==='car'?66:54,h=id==='car'?84:78;ctx.drawImage(art,-w/2,-h/2,w,h);ctx.restore();return;}
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = '#34463824'; ctx.beginPath(); ctx.ellipse(3, 8, id === 'car' ? 26 : 17, id === 'car' ? 37 : 26, 0, 0, Math.PI * 2); ctx.fill();
    if (id === 'runner') person(ctx, '#f58247', time, moving);
    else if (id === 'car') {
      for (const side of [-1, 1]) { rounded(ctx, side * 24 - 4, -22, 8, 17, 3, '#354a45'); rounded(ctx, side * 24 - 4, 13, 8, 17, 3, '#354a45'); }
      rounded(ctx, -24, -38, 48, 76, 13, '#488fc0', ink); rounded(ctx, -19, -23, 38, 16, 6, '#c5eee8', ink);
      rounded(ctx, -19, 17, 38, 12, 4, '#315a7a'); rounded(ctx, -16, -4, 32, 21, 6, '#72b4d6');
      rounded(ctx, -19, -34, 10, 5, 2, '#ffe9a1'); rounded(ctx, 9, -34, 10, 5, 2, '#ffe9a1');
      rounded(ctx, -18, 32, 9, 4, 1, '#ee7966'); rounded(ctx, 9, 32, 9, 4, 1, '#ee7966');
    } else {
      const moto = id === 'motorcycle';
      rounded(ctx, -5, -36, 10, 21, 5, '#314a43'); rounded(ctx, -5, 21, 10, 23, 5, '#314a43');
      line(ctx, [[0, -28], [0, 28]], moto ? '#d85c48' : '#3c9b65', moto ? 17 : 6);
      line(ctx, [[-17, -19], [17, -19]], '#354f48', 5);
      line(ctx, [[-8, 8], [-11, 22]], '#426a79', 7); line(ctx, [[8, 8], [11, 22]], '#426a79', 7);
      rounded(ctx, -12, -15, 24, 30, 8, '#f28d46', ink);
      line(ctx, [[-9, -10], [-16, -19]], '#f6c499', 6); line(ctx, [[9, -10], [16, -19]], '#f6c499', 6);
      circle(ctx, 0, -21, 13, moto ? '#ed6951' : '#4da9ce', ink);
      line(ctx, [[-5, -26], [-5, -20]], '#277b99', 2); line(ctx, [[2, -27], [2, -20]], '#277b99', 2);
    }
    ctx.restore();
  }
  function hazard(ctx, item, time) {
    const obstacle=allieImages[item.type==='animal'?'balloon-heart':'ball-pink']; if(obstacle){ctx.drawImage(obstacle,item.x-item.w*.65,item.y-item.h*.65,item.w*1.3,item.h*1.3);return;}
    ctx.save(); ctx.translate(item.x, item.y); const { type, w, h } = item;
    ctx.fillStyle = '#263c3123'; ctx.beginPath(); ctx.ellipse(3, 9, w * .55, h * .38, 0, 0, Math.PI * 2); ctx.fill();
    if (type === 'cactus') cactus(ctx, 0, 0, 1);
    else if (type === 'tumbleweed') {
      ctx.rotate(time * 2); circle(ctx, 0, 0, 20, '#bc8b4e', '#82633b');
      for (let i = 0; i < 7; i++) { ctx.rotate(Math.PI / 7); ctx.beginPath(); ctx.ellipse(0, 0, 7, 19, 0, 0, Math.PI * 2); ctx.strokeStyle = i % 2 ? '#e4bc73' : '#896539'; ctx.lineWidth = 2; ctx.stroke(); }
    } else if (type === 'wagon') {
      rounded(ctx, -22, -32, 44, 64, 5, '#b48453', '#755134');
      for (const y of [-19, 19]) for (const x of [-25, 25]) rounded(ctx, x - 4, y - 9, 8, 18, 4, '#715541');
      rounded(ctx, -17, -24, 34, 39, 12, '#ffe2ad', '#bb9864'); line(ctx, [[-17, 20], [17, 20]], '#725039', 4);
    } else if (type === 'log' || type === 'barrier') {
      rounded(ctx, -w / 2, -h / 2, w, h, 9, type === 'log' ? '#9b7250' : '#d9dcd9', type === 'log' ? '#664c36' : '#8b9692');
      if (type === 'log') { circle(ctx, -w / 2 + 8, 0, 12, '#dbb47c', '#806144'); circle(ctx, -w / 2 + 8, 0, 6, null, '#b18a57'); line(ctx, [[-8, -12], [22, -12]], '#6e543b', 3); }
      else { line(ctx, [[-18, -8], [16, -8]], '#9fa8a4', 4); rounded(ctx, -20, 8, 12, 7, 1, '#ffe8a3'); rounded(ctx, 8, 8, 12, 7, 1, '#ffe8a3'); }
    } else if (type === 'vine') {
      line(ctx, [[-15, -25], [-10, 0], [13, 5], [7, 23]], '#386b46', 6);
      for (const [x, y] of [[-14, -15], [-5, 0], [13, 7], [8, 21]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(.8); ctx.beginPath(); ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2); ctx.fillStyle = '#80b955'; ctx.fill(); ctx.restore(); }
    } else if (type === 'animal') {
      ctx.save(); ctx.rotate(Math.cos(item.age * 1.8 + item.phase) > 0 ? Math.PI / 2 : -Math.PI / 2);
      rounded(ctx, -14, -16, 28, 32, 10, '#d18b4e', '#835a3c');
      for (const x of [-12, 12]) circle(ctx, x, -16, 7, '#d18b4e', '#835a3c');
      circle(ctx, 0, -12, 12, '#e9b16c', '#835a3c'); circle(ctx, -5, -16, 2, '#344a40'); circle(ctx, 5, -16, 2, '#344a40'); circle(ctx, 0, -9, 3, '#835a3c'); ctx.restore();
    } else if (type === 'cone') {
      rounded(ctx, -22, 13, 44, 9, 3, '#e97946', ink); ctx.beginPath(); ctx.moveTo(-17, 15); ctx.lineTo(0, -22); ctx.lineTo(17, 15); ctx.closePath(); ctx.fillStyle = '#ef8b4d'; ctx.fill(); ctx.strokeStyle = '#be673e'; ctx.stroke(); line(ctx, [[-9, -2], [9, -2]], '#fff3d6', 7);
    } else if (type === 'sign' || type === 'gate') {
      rounded(ctx, -24, -24, 48, 48, 5, type === 'sign' ? '#ffc55d' : '#f9efe0', '#997c50');
      if (type === 'sign') { line(ctx, [[-15, 7], [0, -8], [15, 7]], '#936c38', 5); }
      else { for (let x = -19; x < 22; x += 15) line(ctx, [[x, -9], [x + 9, 9]], '#df7356', 7); }
    } else if (type === 'traffic') {
      rounded(ctx, -20, -32, 40, 64, 10, '#e8bd62', '#876c46'); rounded(ctx, -15, -20, 30, 13, 4, '#d1efdf'); rounded(ctx, -15, 18, 30, 9, 3, '#8d9690');
      if (item.motion) circle(ctx, Math.cos(item.age * 1.8 + item.phase) > 0 ? 16 : -16, -26, 3, time % .5 < .25 ? '#fffcc1' : '#e49a38');
    } else if (type === 'truck') {
      rounded(ctx, -25, -50, 50, 100, 6, '#d5e1da', '#71847d'); rounded(ctx, -22, -47, 44, 23, 6, '#8bb9b3', '#527a75'); rounded(ctx, -17, -43, 34, 12, 3, '#e4f3df');
      for (let y = -14; y < 44; y += 10) line(ctx, [[-20, y], [20, y]], '#afc5bc', 2);
      for (const x of [-27, 27]) { rounded(ctx, x - 3, -32, 6, 18, 2, '#364e46'); rounded(ctx, x - 3, 25, 6, 18, 2, '#364e46'); }
    }
    ctx.restore();
    if (item.warning) {
      ctx.save(); ctx.translate(item.x, item.y - item.h / 2 - 16); circle(ctx, 0, 0, 13, '#ffe09b', '#ac783a'); ctx.fillStyle = '#755129'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', 0, 6); ctx.restore();
    }
  }
  function environment(ctx, index, scroll) {
    const scene = C.SCENES[index]; ctx.fillStyle = scene.ground; ctx.fillRect(0, 0, C.W, C.H);
    ctx.fillStyle = scene.edge; ctx.fillRect(C.LEFT - 9, 0, C.RIGHT - C.LEFT + 18, C.H);
    ctx.fillStyle = scene.road; ctx.fillRect(C.LEFT, 0, C.RIGHT - C.LEFT, C.H);
    ctx.strokeStyle = index < 2 ? '#fff0bd88' : '#eff3dfaa'; ctx.lineWidth = 3;
    ctx.setLineDash(index === 1 ? [5, 35] : [28, 30]); ctx.lineDashOffset = -(scroll % 58);
    for (let lane = 1; lane < 5; lane++) { const x = C.LEFT + lane * C.LANE_WIDTH; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, C.H); ctx.stroke(); } ctx.setLineDash([]);
    for (let i = -1; i < 7; i++) {
      const y = (i * 128 + scroll % 128), x = i % 2 ? 22 : 458;
      const decoration=allieImages[['unicorn','playground','playhouse','softserve'][index]]; if(decoration){ctx.drawImage(decoration,x-38,y-42,76,84);ctx.drawImage(decoration,480-x-30,y+20,60,66);continue;}
      if (index === 0) { cactus(ctx, x, y, .75); circle(ctx, x + 7, y + 54, 9, '#c88752'); }
      else if (index === 1) { tree(ctx, x, y, 1); tree(ctx, 480 - x, y + 50, .65); }
      else if (index === 2) { rounded(ctx, x - 21, y - 38, 42, 78, 7, i % 2 ? '#e9d8b0' : '#d6e3d1', '#97b29b'); rounded(ctx, x - 9, y - 22, 18, 18, 2, '#8db3b2'); tree(ctx, 480 - x, y + 30, .7); }
      else { rounded(ctx, x - 10, y, 20, 55, 4, '#c4d5c6', '#7a9b8e'); line(ctx, [[x - 8, y + 18], [x + 8, y + 18]], '#d8e9bc', 4); }
    }
    if (index === 2) {
      const crossingY = scroll % 660;
      ctx.fillStyle = '#e8eddfa0'; for (let x = 58; x < 432; x += 32) ctx.fillRect(x, crossingY, 18, 32);
    }
    if (index === 3) {
      const tunnelY = scroll % 1250 - 260;
      if (tunnelY > -260 && tunnelY < C.H) { ctx.fillStyle = '#1d35472a'; ctx.fillRect(C.LEFT, tunnelY, C.RIGHT - C.LEFT, 240); ctx.fillStyle = '#b9d0c5'; ctx.fillRect(C.LEFT - 8, tunnelY, 8, 240); ctx.fillRect(C.RIGHT, tunnelY, 8, 240); }
    }
  }
  class Renderer {
    constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false }); this.scale = 1; this.resize(); }
    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.scale = Math.min(1.5, Math.max(.65, rect.width / C.W * Math.min(window.devicePixelRatio || 1, 2)));
      const width = Math.round(C.W * this.scale), height = Math.round(C.H * this.scale);
      if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
    }
    draw(game, reduced = false) {
      const ctx = this.ctx; ctx.setTransform(this.canvas.width / C.W, 0, 0, this.canvas.height / C.H, 0, 0);
      const current = game.sceneIndex, local = game.distance % 500;
      if (game.distance >= 500 && local < C.H / 9) {
        environment(ctx, (current + 3) % 4, game.scroll);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, C.W, local * 9); ctx.clip(); environment(ctx, current, game.scroll); ctx.restore();
        const edge = local * 9, blend = ctx.createLinearGradient(0, edge - 18, 0, edge + 18);
        blend.addColorStop(0, C.SCENES[current].road); blend.addColorStop(1, C.SCENES[(current + 3) % 4].road);
        ctx.fillStyle = blend; ctx.fillRect(C.LEFT, edge - 18, C.RIGHT - C.LEFT, 36);
      } else environment(ctx, current, game.scroll);
      for (const item of game.objects) {
        if (item.kind === 'obstacle') hazard(ctx, item, reduced ? 0 : game.elapsed);
        else if (item.kind === 'coin') { circle(ctx, item.x, item.y, 12, '#ffcf54', '#bd8532'); circle(ctx, item.x, item.y, 8, null, '#f5a93a'); line(ctx, [[item.x, item.y - 4], [item.x, item.y + 4]], '#fff0a1', 3); }
        else {rounded(ctx,item.x-15,item.y-17,30,34,10,'#cbe9f6','#9872b1');line(ctx,[[item.x-7,item.y],[item.x-1,item.y+6],[item.x+8,item.y-7]],'#775299',3);}
      }
      if (game.invincible > 0 || game.hurt > 0 || game.armor > 0) {
        ctx.save(); ctx.globalAlpha = .8; circle(ctx, game.x, game.y, game.vehicleId === 'car' ? 47 : 39, '#f9e79f22', game.invincible > 0 ? '#ffe47a' : game.armor > 0 ? '#9fe0d8' : '#fff5c5'); ctx.restore();
      }
      if (reduced || !game.hurt || Math.floor(game.elapsed * 8) % 2 === 0) vehicle(ctx, game.vehicleId, game.x, game.y, 1, game.elapsed, !reduced);
    }
  }
  root.RunnerArt = { Renderer, vehicle, star, cactus, tree, rounded, circle };
})(globalThis);
