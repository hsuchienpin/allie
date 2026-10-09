(function () {
  'use strict';
  const IDS = ['watermelon','apple','banana','grapes','giftPink','giftMint','giftPurple','bear','meteor','ufo','alien','robot','balloon','chest','car','gem'];
  function star(ctx, x, y, r, color, rotation = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * .48 : r; ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius); }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }
  function tile(image, col, row, cols, rows, size = 256) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    c.getContext('2d').drawImage(image, col * image.width / cols + 2, row * image.height / rows + 2, image.width / cols - 4, image.height / rows - 4, 0, 0, size, size);
    return c;
  }
  function prepare(atlas, stickers) {
    const mapping={watermelon:12,apple:13,banana:14,grapes:7,giftPink:9,giftMint:10,giftPurple:11,bear:8,meteor:16,ufo:17,alien:15,robot:8,balloon:20,chest:21,car:18,gem:8};
    const sprites={},halves={};
    IDS.forEach(id=>{const i=mapping[id];const whole=tile(atlas,i%6,Math.floor(i/6),6,4);sprites[id]=whole;
      halves[id]=[-1,1].map(side=>{const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.beginPath();ctx.rect(side<0?0:128,0,128,256);ctx.clip();ctx.drawImage(whole,0,0);return c;});
    });
    return {sprites,halves,stickers:Array.from({length:12},(_,i)=>tile(stickers,i%4,Math.floor(i/4),4,3,320))};
  }
  function sprite(ctx, assets, id, x, y, size, angle = 0, alpha = 1, side = 0) {
    if (id === 'star') { star(ctx, x, y, size * .35, '#ffe485', angle); return; }
    const image = side && assets.halves[id] ? assets.halves[id][side < 0 ? 0 : 1] : assets.sprites[id];
    if (!image) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = alpha; ctx.drawImage(image, -size / 2, -size / 2, size, size); ctx.restore();
  }
  class Renderer {
    constructor(canvas, assets, forest) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.assets = assets; this.forest = forest; this.trails = []; this.w = 960; this.h = 600; }
    resize() {
      const box = this.canvas.getBoundingClientRect(); this.w = Math.max(1, box.width); this.h = Math.max(1, box.height);
      const dpr = Math.min(devicePixelRatio || 1, 2); this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr); this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    trail(a, b, time) { if (this.trails.length >= 180) this.trails.shift(); this.trails.push({ a, b, time }); }
    clearTrails() { this.trails.length = 0; }
    draw(game, now) {
      const ctx = this.ctx, w = this.w, h = this.h, space = game.theme === 'space';
      const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, space ? '#c8eafa' : game.theme === 'toys' ? '#f8d6e3' : '#abe2f5'); bg.addColorStop(1, space ? '#f3e5f7' : '#fff7dc'); ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      if (space) {
        for (let i = 0; i < 36; i++) star(ctx, (i * 137.5 + 40) % w, (i * 79.3 + 21) % h, i % 4 === 0 ? 7 : 3, '#fff3bc');
        ctx.globalAlpha = .18; ctx.fillStyle = '#d7b0ff'; ctx.beginPath(); ctx.ellipse(w * .85, h * .17, 65, 28, -.3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = .82; if (this.forest) { const strip = Math.min(h * .25, 150); ctx.drawImage(this.forest, 0, this.forest.height * .5, this.forest.width, this.forest.height * .5, 0, h - strip, w, strip); } ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffffa0'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse((i * .29 + .06) * w, (i % 2 ? .22 : .08) * h, 65, 22, 0, 0, Math.PI * 2); ctx.fill(); }
      }
      for (const o of game.objects) {
        sprite(ctx, this.assets, o.type, o.x, o.y, o.r * 2.35);
        if (o.type === 'balloon') {
          const n = game.spec.balloonHits, gap = Math.min(29, o.r * .28), start = o.x - (n - 1) * gap / 2;
          for (let i = 0; i < n; i++) { star(ctx, start + i * gap, o.y + o.r * .53, gap * .42, i < o.hits ? '#ffde4b' : '#ffffffaa'); }
          ctx.save(); ctx.font = 'bold 19px "Microsoft JhengHei",sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = space ? '#c8eafa' : '#fff8ec'; ctx.strokeText('再滑幾下！', o.x, Math.min(h - 25, o.y + o.r * 1.22)); ctx.fillStyle = space ? '#fff1b0' : '#855339'; ctx.fillText('再滑幾下！', o.x, Math.min(h - 25, o.y + o.r * 1.22)); ctx.restore();
        }
      }
      for (const p of game.pieces) sprite(ctx, this.assets, p.type, p.x, p.y, p.r * 2.35, p.angle, Math.min(1, p.life * 2), p.side);
      for (const p of game.surprises) sprite(ctx, this.assets, p.type, p.x, p.y, p.r * 2.4, p.angle, Math.min(1, p.life));
      for (const p of game.particles) {
        ctx.save(); ctx.globalAlpha = Math.min(1, p.life / p.maxLife * 2); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
        if (p.bubble) { ctx.strokeStyle = '#ffffffcc'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#ffffffaa'; ctx.beginPath(); ctx.arc(-p.r * .3, -p.r * .3, 2, 0, Math.PI * 2); ctx.fill(); }
        else if (p.shape === 0) star(ctx, 0, 0, p.r, p.color);
        else { ctx.fillStyle = p.color; ctx.beginPath(); if (p.shape === 1) ctx.ellipse(0, 0, p.r * .65, p.r, 0, 0, Math.PI * 2); else ctx.rect(-p.r / 2, -p.r / 2, p.r, p.r * .7); ctx.fill(); }
        ctx.restore();
      }
      this.trails = this.trails.filter(t => now - t.time < .5);
      const rainbow = ['#ff8cab','#ffdb72','#8de8be','#92ceff'];
      for (const t of this.trails) {
        const alpha = Math.max(0, 1 - (now - t.time) / .5); ctx.save(); ctx.globalAlpha = alpha;
        ctx.lineCap = 'round'; ctx.shadowBlur = game.reduced ? 0 : 14; ctx.shadowColor = '#fffdf6';
        for (let i = 0; i < 4; i++) { ctx.strokeStyle = rainbow[i]; ctx.lineWidth = 17 - i * 3.7; ctx.beginPath(); ctx.moveTo(t.a.x, t.a.y); ctx.lineTo(t.b.x, t.b.y); ctx.stroke(); }
        ctx.shadowBlur = 0; star(ctx, t.b.x, t.b.y, 7, '#fffef5'); ctx.restore();
      }
      if (game.state === 'chest' || game.state === 'reveal') { ctx.fillStyle = '#25324a80'; ctx.fillRect(0, 0, w, h); }
    }
    theme(canvas, theme) {
      const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height);
      const sets = { fruit: ['watermelon','apple','banana'], toys: ['giftPink','giftMint','giftPurple'], space: ['ufo','meteor','alien'] };
      const [a, b, c] = sets[theme]; sprite(ctx, this.assets, a, 132, 111, 180, -.08); sprite(ctx, this.assets, b, 227, 145, 121, .08); sprite(ctx, this.assets, c, 49, 174, 85, -.12);
      star(ctx, 45, 44, 12, '#ffe171'); star(ctx, 254, 50, 9, '#fff6c3');
    }
    reward(canvas, sticker, now, reduced) {
      const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height; ctx.clearRect(0, 0, w, h);
      const bounce = reduced ? 0 : Math.sin(now * 3) * 5;
      const glow = ctx.createRadialGradient(w / 2, h * .5, 10, w / 2, h * .5, w * .48); glow.addColorStop(0, '#ffe78ccd'); glow.addColorStop(1, '#ffe78c00'); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      if (sticker == null) sprite(ctx, this.assets, 'chest', w / 2, h * .52 + bounce, w * .88);
      else {
        ctx.save(); ctx.translate(w / 2, h * .66); ctx.rotate(-.10); ctx.fillStyle = '#fbd579'; ctx.strokeStyle = '#b97937'; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(-102, -37, 204, 70, 12); ctx.fill(); ctx.stroke(); ctx.restore();
        sprite(ctx, this.assets, 'chest', w / 2, h * .78, w * .66);
        ctx.drawImage(this.assets.stickers[sticker], w * .20, h * .02 + bounce, w * .6, w * .6);
      }
      for (let i = 0; i < 7; i++) star(ctx, (i * 63 + 20) % w, (i * 49 + 21) % h, 5 + i % 3 * 2, '#fff0a4', reduced ? 0 : now * .3);
    }
  }
  window.SliceArt = { prepare, sprite, star, Renderer };
})();
