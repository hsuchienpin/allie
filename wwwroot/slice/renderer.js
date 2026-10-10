(function () {
  'use strict';
  const IDS = ['watermelon','apple','banana','grapes','giftPink','giftMint','giftPurple','bear','meteor','ufo','alien','robot','balloon','chest','car','gem'];
  function star(ctx, x, y, r, color, rotation = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * .48 : r; ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius); }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }
  async function prepare(){
    const mapping={watermelon:'gummy-berry',apple:'gummy-orange',banana:'gummy-grape',grapes:'cotton-unicorn',cottonFlower:'cotton-flower',giftPink:'cake-unicorn',giftMint:'cake-penguin',giftPurple:'cake-heart',meteor:'pop-rainbow',ufo:'pop-berry',alien:'softserve',balloon:'balloon-unicorn',chest:'gift'},sprites={};
    await Promise.all(Object.entries(mapping).map(async([id,name])=>{sprites[id]=await Allie.art(name);}));return {sprites};
  }
  function sprite(ctx,assets,id,x,y,size,angle=0,alpha=1,side=0,cutAngle=0,squash=0){
    const im=assets.sprites[id];if(!im)return;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;ctx.scale(1+squash,1-squash);
    if(side){ctx.rotate(cutAngle);ctx.beginPath();ctx.rect(-size,side<0?-size:0,size*2,size);ctx.clip();ctx.rotate(-cutAngle);}
    ctx.drawImage(im,-size/2,-size/2,size,size);ctx.restore();
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
      const ctx = this.ctx, w = this.w, h = this.h;
      const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#fff7eb');bg.addColorStop(1,'#f7ece6');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      // Quiet sweet-shop canopy and countertop keep the moving treats readable.
      const stripe=70;for(let x=-stripe;x<w;x+=stripe){ctx.fillStyle=Math.round(x/stripe)%2?'#eddbe18c':'#f6eadf';ctx.beginPath();ctx.roundRect(x,-15,stripe+1,45,[0,0,18,18]);ctx.fill();}
      ctx.fillStyle='#e2c6ab';ctx.fillRect(0,h-20,w,20);ctx.fillStyle='#f0dbc4';ctx.fillRect(0,h-24,w,7);
      for (const o of game.objects) {
        sprite(ctx, this.assets, o.type, o.x, o.y, o.r * 2.35);
        if (o.type === 'balloon') {
          const n = game.spec.balloonHits, gap = Math.min(29, o.r * .28), start = o.x - (n - 1) * gap / 2;
          for (let i = 0; i < n; i++) { star(ctx, start + i * gap, o.y + o.r * .53, gap * .42, i < o.hits ? '#ffde4b' : '#ffffffaa'); }
          ctx.save(); ctx.font = 'bold 19px "Microsoft JhengHei",sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = '#fff8ec'; ctx.strokeText('Swipe!' , o.x, Math.min(h - 25, o.y + o.r * 1.22)); ctx.fillStyle = '#855339'; ctx.fillText('Swipe!' , o.x, Math.min(h - 25, o.y + o.r * 1.22)); ctx.restore();
        }
      }
      for (const p of game.pieces) sprite(ctx, this.assets, p.type, p.x, p.y, p.r * 2.35, p.angle, Math.min(1, p.life * 2), p.side, p.cutAngle, p.material==='gummy'&&!game.reduced?Math.sin((p.maxLife-p.life)*18)*.07:0);
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
    menu(canvas) {
      const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
      const items=['grapes','giftPink','alien','watermelon','giftMint','meteor','apple','giftPurple','ufo','banana','cottonFlower'];
      for(const [i,type] of items.entries()){const top=i<6,col=top?i:i-6; sprite(ctx,this.assets,type,top?70+col*132:136+col*132,top?110:255,top?150:130,(i%2?1:-1)*.07);}
    }
    reward(canvas, sticker, now, reduced) {
      const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height; ctx.clearRect(0, 0, w, h);
      const bounce = reduced ? 0 : Math.sin(now * 3) * 5;
      const glow = ctx.createRadialGradient(w / 2, h * .5, 10, w / 2, h * .5, w * .48); glow.addColorStop(0, '#ffe78ccd'); glow.addColorStop(1, '#ffe78c00'); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      if (sticker == null) sprite(ctx, this.assets, 'chest', w / 2, h * .52 + bounce, w * .88);
      else {
        ctx.save(); ctx.translate(w / 2, h * .66); ctx.rotate(-.10); ctx.fillStyle = '#fbd579'; ctx.strokeStyle = '#b97937'; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(-102, -37, 204, 70, 12); ctx.fill(); ctx.stroke(); ctx.restore();
        sprite(ctx, this.assets, 'chest', w / 2, h * .78, w * .66);

      }
      for (let i = 0; i < 7; i++) star(ctx, (i * 63 + 20) % w, (i * 49 + 21) % h, 5 + i % 3 * 2, '#fff0a4', reduced ? 0 : now * .3);
    }
  }
  window.SliceArt = { prepare, sprite, star, Renderer };
})();
