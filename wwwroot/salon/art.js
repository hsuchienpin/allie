(function (root, factory) {
  const art = factory();
  if (typeof module === 'object' && module.exports) module.exports = art;
  else root.SalonArt = art;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // One small vector collection supplies both the wearable artwork and its menu preview.
  const gold = '#c69850', light = '#fff0bb', rose = '#d9749e', violet = '#9978c8';
  const p = (d, fill = 'none', stroke = gold, width = 2) => ({d, fill, stroke, width});
  const circle = (x, y, r, fill = '#fff9ed') => p(`M${x-r} ${y}a${r} ${r} 0 1 0 ${r*2} 0a${r} ${r} 0 1 0 ${-r*2} 0`, fill, gold, .8);
  const gem = (x, y, r, color = violet) => [p(`M${x} ${y-r}L${x+r*.72} ${y} ${x} ${y+r} ${x-r*.72} ${y}Z`, color), p(`M${x} ${y-r+2}L${x+1} ${y} ${x-r*.5} ${y}Z`, '#ffffff99', 'none'), p(`M${x} ${y+r-2}L${x+1} ${y} ${x+r*.5} ${y}Z`, '#664c7122', 'none')];
  const star = (x,y,r,fill=light) => p(`M${x} ${y-r}l${r*.29} ${r*.6} ${r*.66} ${r*.09} ${-r*.48} ${r*.46} ${r*.11} ${r*.66} ${-r*.58} ${-r*.31} ${-r*.58} ${r*.31} ${r*.11} ${-r*.66} ${-r*.48} ${-r*.46} ${r*.66} ${-r*.09}Z`,fill,gold,1.2);
  const flower = (x,y,r) => [...Array.from({length:5},(_,i)=>circle(x+Math.cos(i*1.256)*r*.55,y+Math.sin(i*1.256)*r*.55,r*.53,'#f5b6cc')),circle(x,y,r*.3,light)];
  const chain = p('M14 18Q60 78 106 18','none',gold,2.6);
  const art = {
    none: [p('M47 33l26 26M73 33L47 59', 'none', '#b6a4b3', 2)],
    tiara: [p('M12 65Q60 82 108 65L103 43Q88 67 79 34Q73 49 60 13Q47 49 41 34Q32 67 17 43Z', '#f8e6b2'), p('M14 67Q60 85 106 67', 'none',gold,4), ...gem(60,43,13), ...gem(31,57,6,'#e998ba'), ...gem(89,57,6,'#e998ba'), ...[17,41,60,79,103].map((x,i)=>circle(x,[41,32,11,32,41][i],3.2)),p('M26 68Q60 77 94 68','none','#fff9dc',2)],
    royal: [p('M16 68L10 24L36 43L60 9L84 43L110 24L104 68Q60 81 16 68Z', '#edcf86'),p('M18 63Q60 74 102 63L103 73Q60 84 17 73Z', '#fff0bd'),...gem(60,45,17,rose),...gem(29,53,7),...gem(91,53,7),...[10,60,110].map((x,i)=>circle(x,[23,8,23][i],4)),p('M24 68Q60 76 96 68','none','#b58140',1)],
    flowers: [p('M7 68Q60 30 113 68','none','#8d9b70',5),p('M16 64Q5 39 30 49M96 57Q111 36 115 59M44 49Q47 23 59 44','#b6c599','#8d9b70',1),...flower(24,57,13),...flower(46,47,12),...flower(72,47,14),...flower(98,58,12)],
    bow: [p('M57 46Q4 6 12 45Q8 78 57 52M63 46Q116 6 108 45Q112 78 63 52', '#c18bc2','#9f6eaa',2),p('M54 51L31 84L48 80L55 90L66 53M66 51L88 85L74 81L68 89L55 51', '#e1b1d5','#b780b8',1),p('M53 37Q60 33 68 37L67 58Q59 62 52 57Z','#f3d1e7','#b780b8',1),p('M18 35L49 45M101 35L72 45','none','#f6dbed',2),...gem(60,47,7,rose)],
    butterfly: [p('M58 47Q8-1 13 35Q12 62 52 52Q18 64 31 80Q53 91 59 57M62 47Q112-1 107 35Q108 62 68 52Q102 64 89 80Q67 91 61 57', '#b8a0de','#8970af',2),p('M54 43L26 22L28 45Z M66 43L94 22L92 45Z','#e5d2f5','none'),p('M60 37V64M58 38L51 26M62 38L69 26','none',gold,3),...gem(60,49,12,rose)],
    rose: [p('M63 60Q95 33 99 56Q90 79 63 68M53 58Q22 33 20 58Q34 82 53 69','#adc199','#82936b',1),p('M60 18Q82 9 88 30Q110 45 87 64Q70 87 51 72Q22 77 24 53Q10 30 34 24Q41 7 60 18Z','#e5a0b8','#c37395',1.5),p('M42 30Q64 18 77 36Q91 48 69 63Q50 72 38 52Q29 35 54 35Q76 31 69 50Q56 62 49 49Q45 40 60 42','none','#bf6c91',2.5),circle(60,45,3,light)],
    pearls: [circle(60,22,8),p('M60 30V46'),circle(60,59,15),circle(55,54,4,'#ffffff')],
    stars: [circle(60,18,5),p('M60 23V44'),star(60,59,21),circle(60,59,4,'#fff9ea')],
    hearts: [circle(60,18,6),p('M60 24V38'),p('M60 78Q23 52 40 40Q51 32 60 46Q69 32 80 40Q97 52 60 78Z', '#e99db9'),p('M44 48Q48 41 53 46','none','#ffe9ed',3)],
    pearl: [chain,...Array.from({length:11},(_,i)=>{const x=15+i*9;return circle(x,20+Math.sin(i/10*Math.PI)*32,5.5);}),...gem(60,69,10,'#d9afd8')],
    ruby: [chain,p('M17 22Q60 92 103 22','none','#f0d58d',1),...gem(60,64,18,rose),...gem(34,43,6),...gem(86,43,6)],
    moon: [chain,p('M67 47A20 20 0 1 0 78 76Q49 78 67 47Z',light),star(78,52,9),circle(50,44,3)]
  };
  function svg(id) {
    return '<svg viewBox="0 0 120 90" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">' + (art[id] || art.none).map(s=>`<path d="${s.d}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.width}"/>`).join('') + '</svg>';
  }
  function draw(ctx,id,x,y,width,height=width*.75) {
    if (!id || id === 'none' || !Object.prototype.hasOwnProperty.call(art,id)) return;
    ctx.save();ctx.translate(x,y);ctx.scale(width/120,height/90);ctx.lineJoin='round';ctx.lineCap='round';
    for(const s of art[id]){const path=new Path2D(s.d);if(s.fill!=='none'){ctx.fillStyle=s.fill;ctx.fill(path);}if(s.stroke!=='none'){ctx.strokeStyle=s.stroke;ctx.lineWidth=s.width;ctx.stroke(path);}}
    ctx.restore();
  }
  return {svg,draw};
});
