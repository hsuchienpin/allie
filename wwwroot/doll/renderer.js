(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./catalog.js') : root.DollCatalog,
    typeof module === 'object' && module.exports ? require('./core.js') : root.DollCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DollRenderer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (C, Core) {
  'use strict';
  let serial = 0;
  const line = '#665245', white = '#fffaf0';
  const p = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
  const circle = (x,y,r,fill,extra='') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
  const ellipse = (x,y,rx,ry,fill,extra='') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
  const stroke = (color=line, width=2.4) => `stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;
  function star(x,y,r,fill) {
    const points = Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2, rr=i%2?r*.45:r;return `${(x+Math.cos(a)*rr).toFixed(1)},${(y+Math.sin(a)*rr).toFixed(1)}`;}).join(' ');
    return `<polygon points="${points}" fill="${fill}"/>`;
  }
  const heart = (x,y,r,fill) => `<g transform="translate(${x} ${y}) scale(${r/12})">${p('M0 10C-25-4-10-20 0-9C10-20 25-4 0 10Z',fill)}</g>`;
  function flower(x,y,r,fill) {
    return Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5;return circle(x+Math.sin(a)*r*.65,y+Math.cos(a)*r*.65,r*.49,fill);}).join('')+circle(x,y,r*.32,'#eac56e');
  }
  function motif(kind,x,y,size,color) {
    if(kind===4) return star(x,y,size,color);
    if(kind===5) return heart(x,y,size,color);
    if(kind===6) return `<g fill="none" stroke-width="${size*.24}">${['#d38e7e','#dfb75e','#91aa91'].map((c,i)=>`<path d="M${x-size+i*size*.23} ${y+size*.5}a${size-i*size*.23} ${size-i*size*.23} 0 0 1 ${2*(size-i*size*.23)} 0" stroke="${c}"/>`).join('')}</g>`;
    if(kind===7) return p(`M${x-size} ${y+size*.5}q${size*.4}-${size} ${size}-${size*.8}v-${size*.7}h${size*.7}v${size*.9}l-${size*.5} ${size*.1}v${size*.8}h-${size*.4}v${size*.4}h-${size*.3}v-${size*.4}Z`,color)+circle(x+size*.5,y-size*.8,1.6,line);
    if(kind===8 || kind===9) return circle(x,y,size*.7,color)+p(`M${x-size*.6} ${y-size*.3}l-${size*.15}-${size*.6} ${size*.6} ${size*.3}M${x+size*.6} ${y-size*.3}l${size*.15}-${size*.6}-${size*.6} ${size*.3}`,color)+circle(x-size*.23,y,1.8,line)+circle(x+size*.23,y,1.8,line)+(kind===9?ellipse(x,y+size*.3,size*.2,size*.13,line):p(`M${x-3} ${y+3}l3 3 3-3`,'none',stroke(line,1.3)));
    if(kind===10) return circle(x-4,y+3,size*.55,'#c98476')+circle(x+5,y+3,size*.55,'#c98476')+ellipse(x+3,y-size*.65,size*.5,size*.22,'#8caa7f',`transform="rotate(-25 ${x+3} ${y-size*.65})"`);
    return '';
  }
  function hairBack(h,color) {
    if(h===19) return '';
    let out='';
    if(h>=6 && h<=11) {
      const end=h<=8?280:352;
      out+=p(`M111 109Q104 44 181 42Q254 46 253 119L${h===10?271:257} ${end}Q224 ${end+20} 182 ${end-5}Q135 ${end+20} 103 ${end}Z`,color);
      if([8,10,11].includes(h)) for(let i=0;i<8;i++) out+=circle(i%2?245:113,165+Math.floor(i/2)*48,h===11?23:16,color);
      out+=p(`M123 181Q112 249 123 ${end-10}M238 170Q250 260 239 ${end-12}`,'none',stroke('#ffffff',2)+' opacity=".12"');
    } else out+=ellipse(180,125,75,86,color);
    if(h===12 || h===13) {
      const y=h===12?73:185;
      out+=p(`M232 ${y}Q317 ${y-28} 277 ${y+95}Q275 ${y+128} 292 ${y+140}Q233 ${y+138} 249 ${y+55}Q256 ${y+23} 232 ${y+24}Z`,color);
      out+=ellipse(243,y+14,9,17,'#c69083');
    }
    if(h===14) for(const side of [-1,1]) out+=`<g transform="translate(${180+side*74} 164) scale(${side} 1)">${p('M0-35Q55-57 39 17Q30 48 41 71Q-13 66 3 8Z',color)}${ellipse(3,-12,7,14,'#c697a8')}</g>`;
    if(h===15||h===16) for(const side of h===15?[1]:[-1,1]) {
      for(let i=0;i<7;i++) out+=ellipse(180+side*(73+(i%2)*5),205+i*18,13-i*.65,15,color,`transform="rotate(${side*12} ${180+side*73} ${205+i*18})"`);
      out+=p(`M${180+side*76-9} 327l9 23 9-23Z`,color)+ellipse(180+side*76,325,11,5,'#c78f83');
    }
    if(h===17) out+=circle(180,38,32,color)+p('M159 25q18-13 38 3','none',stroke('#ffffff',2)+' opacity=".15"');
    if(h===18) out+=circle(117,66,28,color)+circle(243,66,28,color);
    return out;
  }
  function hairFront(h,color) {
    if(h===19) return '';
    let d='M108 139Q97 58 151 49Q214 26 247 81Q258 105 249 146L236 116Q224 84 206 84Q147 70 124 119L117 145Z';
    if(h===0) d='M113 104Q116 53 181 52Q242 57 246 108L230 94Q179 74 132 99Z';
    if([1,2,6].includes(h)) d='M107 143Q95 48 180 46Q261 49 252 146L236 132 234 106 217 114 203 102 190 114 172 104 156 115 141 104 124 119 121 146Z';
    if(h===1)d='M108 140Q97 47 180 46Q262 48 252 142L236 132 234 108Q180 137 126 108L122 142Z';
    if(h===3 || h===13) d='M109 146Q91 63 163 47Q224 26 248 86L245 137 232 108Q217 79 202 71Q176 111 123 119L120 147Z';
    if(h===4) d='M109 139L103 86 119 85 115 60 144 63 157 35 180 52 204 36 217 62 242 59 244 87 258 99 246 141 235 110 217 102 198 94 177 104 156 97 130 113 119 146Z';
    let out=p(d,color);
    if([5,8,11].includes(h)) for(let i=0;i<8;i++) out+=circle(117+i*18,91-Math.sin(i/7*Math.PI)*35,17+(i%2)*3,color);
    out+=p('M135 77Q155 58 181 60M207 64Q224 72 231 87','none',stroke('#ffffff',2.5)+' opacity=".18"');
    return out;
  }
  function earShapes(kind,skin) {
    if(kind===5) return p('M116 145L81 119 98 179 120 179Z',skin)+p('M244 145L279 119 262 179 240 179Z',skin)+p('M104 153l-11-16 10 32M256 153l11-16-10 32','none',stroke('#ac7c65',2));
    const rx=[10,14,19,8,20][kind], ry=[16,20,25,19,18][kind];
    return [110,250].map(x=>ellipse(x,160,rx,ry,skin)+p(`M${x-2} 152q${x<180?-10:10} 1 0 15`,'none',stroke('#a87b65',1.8)+' opacity=".65"')).join('');
  }
  function eyes(kind,color) {
    return [151,209].map((x,i)=>{
      if(kind===7) return p(`M${x-11} 151q11-15 22 0`,'none',stroke(line,3));
      if(kind===8) return star(x,149,12,color)+star(x-3,145,3,white);
      if(kind===9) return heart(x,148,11,color)+circle(x-3,144,2.5,white);
      const rx=[8,11,7,11,12,10,10][kind],ry=[10,13,13,8,5,8,8][kind];
      const tilt=kind===5?(i?14:-14):kind===6?(i?-13:13):0;
      return `<g transform="rotate(${tilt} ${x} 149)">${ellipse(x,149,rx+2,ry+2,white)}${ellipse(x,150,rx,ry,color)}${ellipse(x,152,rx*.52,ry*.68,'#392f2a')}${circle(x-3,145,Math.min(3.2,ry*.3),white)}${circle(x+3,153,1.4,white)}${p(`M${x-rx-1} ${147-ry*.4}q${rx+1}-${ry} ${2*rx+2} 0`,'none',stroke(line,2))}</g>`;
    }).join('')+p('M139 127q10-5 21-1M199 126q10-4 21 1','none',stroke(line,2.4)+' opacity=".7"');
  }
  function glasses(kind,color) {
    if(!kind) return '';
    let out='';
    for(const x of [151,209]) {
      const st=stroke(color,3.6);
      if(kind===1) out+=circle(x,149,23,'#ffffff15',st);
      if(kind===2) out+=`<rect x="${x-24}" y="131" width="48" height="37" rx="8" fill="#ffffff15" ${st}/>`;
      if(kind===3) out+=ellipse(x,149,25,17,'#ffffff15',st);
      if(kind===4) out+=`<rect x="${x-26}" y="125" width="52" height="47" rx="16" fill="#ffffff15" ${st}/>`;
      if(kind===5) out+=p(`M${x-24} 147v-12h48v12M${x-23} 148q0 20 23 20t23-20`,'#ffffff18',st);
      if(kind===6) out+=`<g ${st}>${star(x,149,28,'#ffffff18')}</g>`;
      if(kind===7) out+=`<g ${st}>${heart(x,151,21,'#ffffff18')}</g>`;
      if(kind===8) out+=p(`M${x-25} 132h50l-4 26q-20 20-42 0Z`,color,st)+p(`M${x-14} 136l12 23M${x-7} 135l12 23`,'none',stroke(white,2)+' opacity=".3"');
    }
    return out+p('M175 144q5-5 10 0M126 141l-14-4M234 141l14-4','none',stroke(color,3.6));
  }
  function nose(kind) {
    const st=stroke('#ad7a62',2.2);
    return [ellipse(180,172,5,4,'#bd8c72','opacity=".65"'),circle(180,172,2.7,'#af7c63'),p('M180 165l-6 11h12Z','#c28d74','opacity=".7"'),p('M179 167l-2 8h7','none',st),p('M179 163l-3 16q6 3 10-1','none',st),p('M171 174q9 8 18 0','none',st),p('M175 175q10 2 7-7','none',st),ellipse(180,173,8,6,'#bd8c72','opacity=".6"')][kind];
  }
  function mouth(kind) {
    const st=stroke('#935e51',2.6);
    if(kind===0||kind===6) return p(kind===0?'M169 190q11 11 22 0':'M163 188q17 20 34 0','none',st);
    if(kind===3) return p('M170 194h20','none',st);
    if(kind===4) return ellipse(180,194,7,9,'#935e51')+ellipse(180,197,4,4,'#d8938d');
    if(kind===5) return p('M174 188q14 1 5 7q14 6-5 6','#c98580');
    let out=p('M164 188q16 5 32 0q-2 24-16 24t-16-24Z','#8b5149');
    if([2,7,8].includes(kind)) out+=p('M167 190q13 4 26 0l-3 7h-20Z',white);
    if(kind===7) out+=p('M169 193l4 10 5-9',white);
    if(kind===8) out+=`<rect x="178" y="191" width="5" height="7" fill="#8b5149"/>`;
    out+=ellipse(180,207,8,3.5,'#d08c8b');
    if(kind===9) out+=p('M178 201q13-4 12 5q-2 14-10 8Z','#d99293')+p('M184 204l-1 6','none',stroke('#b27079',1.2));
    return out;
  }
  function earrings(kind,color) {
    if(!kind) return '';
    return [108,252].map(x=>{
      let out=circle(x,179,3.5,color);
      if(kind===1) return out+circle(x,181,5,color)+circle(x-1,179,1.3,white);
      out+=p(`M${x} 181v8`,'none',stroke(color,2));
      if(kind===2) out+=star(x,196,10,color);
      if(kind===3) out+=heart(x,196,9,color);
      if(kind===4) out+=flower(x,196,9,color);
      if(kind===5) out+=ellipse(x-5,194,6,8,color)+ellipse(x+5,194,6,8,color)+ellipse(x,197,2,7,'#a87d5d');
      if(kind===6) out+=circle(x-3,199,5,'#c78070')+circle(x+4,198,5,'#c78070')+p(`M${x-3} 194q1-9 7-10`,'none',stroke('#83a073',1.7));
      if(kind===7) out+=circle(x,196,9,'none',stroke(color,3));
      return out;
    }).join('');
  }
  function necklace(kind,color) {
    if(!kind) return '';
    let out=p('M151 246q29 55 58 0','none',stroke(color,kind===2?4:2));
    if(kind===2) return out+Array.from({length:9},(_,i)=>circle(154+i*6.5,252+Math.sin(i/8*Math.PI)*24,4.4,['#c68b7a','#d8bc69','#9daf9b','#a896bb'][i%4])).join('');
    if(kind===3)out+=star(180,281,11,color);
    if(kind===4)out+=heart(180,281,10,color);
    if(kind===5)out+=p('M185 272q-18 0-12 15q10 13 17-1q-13 3-5-14Z',color);
    if(kind===6)out+=flower(180,282,11,color);
    if(kind===7)out+=p('M168 284q0-22 12-16q12-6 12 16l-12 6Z',color)+p('M180 271v13M174 275l3 10M186 275l-3 10','none',stroke('#fffaf0',1.2));
    if(kind===8)out+=motif(6,180,277,13,color);
    if(kind===9)out+=motif(8,180,282,12,color);
    return out;
  }
  function shoes(kind,color) {
    if(!kind) return '';
    let out='';
    for(const [i,x] of [153,207].entries()) {
      const boot=kind===9?49:kind===10?34:kind===11?76:kind===4?31:16;
      const top=573-boot;
      out+=p(`M${x-17} ${top}h32l2 ${573-top}q${i?-2:12} 1 ${i?17:19} 10q4 13-14 13h-34q-10-1-9-11Z`,color);
      out+=p(`M${x-22} 590h55`,'none',stroke(white,5));
      if([1,2,4].includes(kind)) out+=p(`M${x-9} 568h18M${x-8} 575h18M${x-6} 582h18`,'none',stroke(white,2.5));
      if(kind===2) out+=p(`M${x-13} 574l10 10 20-7`,'none',stroke(white,5))+p(`M${x-20} 593h48`,'none',stroke(color,3));
      if(kind===3) out+=p(`M${x-12} 568h26M${x-10} 579h26`,'none',stroke(white,5));
      if([6,7,8].includes(kind)) out+=p(`M${x-14} 574h30M${x-5} 558v25`,'none',stroke(white,kind===8?8:6));
      if(kind===6)out+=p(`M${x+6} 583q17-10 25 2v9h-29Z`,color)+circle(x+17,586,1.6,white)+circle(x+24,587,1.6,white);
      if(kind===12) out+=p(`M${x-15} 566q16 10 28 0`,'none',stroke(white,3));
      if(kind===13) out+=circle(x+9,577,12,'#ecdbc1')+circle(x+1,565,5,'#ecdbc1')+circle(x+17,565,5,'#ecdbc1')+circle(x+5,575,1.5,line)+circle(x+13,575,1.5,line)+ellipse(x+9,581,2.5,1.8,line);
      if(kind===9||kind===11) out+=p(`M${x-11} ${top+9}h18`,'none',stroke(white,3)+' opacity=".55"');
    }
    return out;
  }
  function bottom(kind,color,fill) {
    if(kind>=8) {
      const end=kind===11?554:kind===10?460:470;
      const wide=kind===10?89:70;
      let out=p(`M135 377h90l${wide-45} ${end-387}q-${wide} 25-${wide*2} 0Z`,fill);
      if(kind===9) for(let i=0;i<7;i++) out+=p(`M${140+i*13} 390l${(i-3)*5} 77`,'none',stroke(line,1.6)+' opacity=".22"');
      if(kind===10) out+=p(`M102 441q78 30 156 0M94 455q86 25 172 0`,'none',stroke(white,4)+' opacity=".6"');
      return out+p('M136 386h88','none',stroke(color,9));
    }
    const end=kind===0?452:kind===1?485:566;
    const wide=kind===5?12:kind===7?-7:0;
    let out=p(`M134 375h92l6 ${end-375}h-${39+wide}l-10-${end-414}h-6l-11 ${end-414}h-${39+wide}Z`,fill);
    out+=p(`M139 387h82M180 393v20`,'none',stroke(line,2)+' opacity=".22"');
    if(kind===3) out+=p(`M140 399q9 20 24 5M219 399q-9 20-24 5M135 ${end-9}h33M194 ${end-9}h34`,'none',stroke('#f7e6c4',2));
    if(kind===4) out+=p(`M139 405l-6 ${end-415}M219 405l8 ${end-415}`,'none',stroke(white,4));
    if(kind===6)out+=`<rect x="125" y="437" width="30" height="35" rx="4" fill="${color}" ${stroke(line,1)} opacity=".7"/><rect x="206" y="437" width="30" height="35" rx="4" fill="${color}" ${stroke(line,1)} opacity=".7"/>`;
    return out;
  }
  function top(kind,color,fill) {
    const long=[1,5,7,8,9,13,14,15].includes(kind), edge=long?365:295;
    let out=p(`M151 240Q180 257 209 240L236 251 261 ${edge} 235 ${edge+10} 220 287 226 388Q180 400 134 388L140 287 125 ${edge+10} 99 ${edge} 124 251Z`,fill);
    out+=p('M151 240q29 33 58 0','none',stroke(white,5));
    if([2,7,10].includes(kind))out+=p(kind===2?'M138 292h84M136 312h88M135 332h90M134 352h92M134 372h92':'M137 377h86','none',stroke(white,kind===2?8:5)+' opacity=".65"');
    if(kind===3)out+=p('M151 247l28 23v123h-45l6-108-15 20-26-10 25-44Z','#ead8bd');
    if(kind===4||kind===5)out+=p('M151 242l29 19-16 22-22-34M209 242l-29 19 16 22 22-34',white)+p('M180 263v120','none',stroke(line,1.5)+' opacity=".3"')+[282,308,335].map(y=>circle(180,y,2.2,line)).join('');
    if(kind===6)out+=p('M135 252q5-11 11 0t11 0t11 0t11 0t11 0t11 0t11 0t11 0l-2 9q-7 10-13 0t-12 0t-12 0t-12 0t-12 0t-12 0t-12 0Z',white)+p('M131 287l-7 12-28-6 7-15M229 287l7 12 28-6-7-15',white);
    if(kind===8)out+=p('M150 245q-19 5-12 23q42 33 84 0q6-18-12-23q-30 37-60 0Z',color,stroke(white,2))+p('M166 274v36M194 274v36M155 343q25-15 50 0v29h-50Z','none',stroke(white,2.5));
    if(kind===9)out+=Array.from({length:8},(_,i)=>p(`M${145+i*10} 282l-5 6 5 6-5 6 5 6-5 6 5 6-5 6 5 6-5 6 5 6-5 6`,'none',stroke(white,1.7)+' opacity=".4"')).join('');
    if(kind===10||kind===11)out+=p('M128 256l-14 35M232 256l14 35','none',stroke(white,6));
    if(kind===11)out+=p('M173 270l-10 77M187 270l10 77','none',stroke(white,2))+`<text x="180" y="328" text-anchor="middle" fill="${white}" font-family="Georgia,serif" font-size="27">8</text>`;
    if(kind===12)out+=p('M145 251l-10 134q45 11 90 0l-10-134-18 16-17-10-17 10Z',color)+p('M159 264l21 25 21-25','none',stroke(white,3));
    if(kind>=13)out+=p('M147 245l26 21-12 127-28-6 7-102-15 90-29-9 28-116Z',color)+p('M213 245l-26 21 12 127 28-6-7-102 15 90 29-9-28-116Z',color)+p('M165 274l-8 110M195 274l8 110','none',stroke(white,2))+circle(205,305,3,white)+circle(205,331,3,white);
    if(kind===13)out+=p('M139 298h23v25h-23ZM198 298h23v25h-23Z',color,stroke('#e7d7b8',1.7))+p('M135 375h25M201 375h25','none',stroke('#e7d7b8',2));
    if(kind===14)out+=p('M124 251l19 12-20 109-27-7Z',white)+p('M236 251l-19 12 20 109 27-7Z',white)+p('M147 251l12 12M213 251l-12 12M136 380h23M201 380h23','none',stroke(white,5));
    if(kind===15)out+=p('M149 247q-18-22-16-39q46-26 93 0q2 17-16 39l-17 17q18-25 16-43-29-12-58 0-2 18 16 43Z',color,stroke(white,2))+p('M136 336h25v27h-25ZM200 336h25v27h-25Z',color,stroke(white,2));
    return out;
  }
  function outfit(kind,color,fill) {
    if(!kind) return '';
    if([4,6,7,8,11,14,15,16].includes(kind)) {
      let out=bottom(kind===4?3:2,color,fill)+top(kind===4?12:kind===7?10:kind===8?5:1,color,fill);
      if(kind===4) out+=p('M151 253h12v58h34v-58h12l6 147h-70Z',fill)+`<rect x="161" y="313" width="38" height="30" rx="5" fill="${color}" ${stroke(white,2)}/>`+circle(157,270,3,white)+circle(204,270,3,white);
      if(kind===11)out+=p('M140 263h80v88h-80Z',white)+`<rect x="154" y="278" width="52" height="43" rx="7" fill="#b2c5cb"/>`+circle(164,333,4,'#c78370')+circle(181,333,4,'#a3b391')+p('M136 411h88M130 487h42M190 487h42','none',stroke(white,10));
      if(kind>=14) {
        out+=ellipse(180,326,31,54,'#f0e1c3')+p('M180 270v112','none',stroke(white,2));
        if(kind===14)out+=p('M153 251l10-17 15 15 14-17 15 19','#dfbb73');
      }
      return out;
    }
    let out=top(kind===2||kind===12?1:0,color,fill);
    const end=kind===9||kind===12?552:kind===5?488:506,wide=kind===9?108:kind===12?82:78;
    out+=p(`M140 332h80l${wide-40} ${end-332}q-${wide} 30-${wide*2} 0Z`,fill);
    out+=p('M140 338q40 11 80 0','none',stroke(white,8));
    if(kind===3||kind===5)out+=p('M142 250l10 2v77h56v-77l10-2 2 97h-80Z',color)+circle(148,275,4,white)+circle(212,275,4,white);
    if(kind===9)out+=p('M146 278l34 36 34-36-13 63h-42Z','#f0dcc1')+p('M108 420q72 50 144 0M96 461q84 48 168 0','none',stroke(white,4)+' opacity=".7"')+star(180,344,12,'#d9b664');
    if(kind===10)out+=p('M146 248l34 41 34-41-13 92h-42Z','#ecddba')+p('M139 342h82','none',stroke('#bd9658',9))+circle(180,342,6,'#ead4a2');
    if(kind===12)out+=Array.from({length:9},(_,i)=>star(137+(i%3)*44,364+Math.floor(i/3)*57,7,'#efdab0')).join('');
    if(kind===13)out+=p('M154 254l26 35 26-35-6 83h-40Z','#e9d5a8')+star(180,306,17,'#c68d70')+p('M137 344h86','none',stroke('#dcb467',10));
    return out;
  }
  function draw(input, options={}) {
    const c=Core.normalize(input), id='doll'+(++serial), col=key=>C.palettes[key][c.colors[key]],skin=C.skinColors[c.skin],hc=col('hair');
    const textile=(key)=>{const pat=c.patterns[key];return pat>0&&pat<4?`url(#${id}-${key})`:col(key);};
    let defs=`<filter id="${id}-shadow" x="-40%" y="-30%" width="180%" height="180%"><feDropShadow dx="1.5" dy="3" stdDeviation="2" flood-color="#6b5037" flood-opacity=".16"/></filter>`;
    for(const key of ['top','bottom','outfit']){
      const pat=c.patterns[key];
      defs+=`<pattern id="${id}-${key}" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="${col(key)}"/>`;
      if(pat===1)defs+='<path d="M0 5h22M0 16h22" stroke="#fffaf0" stroke-width="4" opacity=".5"/>';
      if(pat===2)defs+='<path d="M0 11h22M11 0v22" stroke="#fffaf0" stroke-width="4" opacity=".4"/>';
      if(pat===3)defs+=circle(6,6,2.5,white,'opacity=".7"')+circle(17,17,2.5,white,'opacity=".7"');
      defs+='</pattern>';
    }
    const paper = (s) => `<g stroke="${white}" stroke-width="4" stroke-linejoin="round" paint-order="stroke fill"${options.thumbnail?'':` filter="url(#${id}-shadow)"`}>${s}</g>`;
    let back='';
    if(c.outfit===13||c.outfit===10)back=paper(p('M135 245Q92 338 83 487Q180 534 277 487Q267 338 225 245Z',c.outfit===13?'#b47e71':'#99aab4'));
    let body=p('M157 203h46v49q-23 24-46 0Z',skin)+p('M136 247Q111 259 100 306L84 390q-2 22 10 22q14-2 16-19l29-79-8 104h98l-8-104 29 79q2 18 16 19q12 0 10-22l-16-84q-11-47-36-59Z',skin)+p('M137 395h87l-4 172q-14 17-30 0l-6-128h-8l-7 128q-15 17-30 0Z',skin)+p('M137 372h87v59h-36l-8-16-8 16h-35Z','#eee1cc');
    body+=paper(bottom(c.bottom,col('bottom'),textile('bottom')))+paper(top(c.top,col('top'),textile('top')));
    if(c.outfit) body=p('M157 203h46v49q-23 24-46 0Z',skin)+p('M136 247Q111 259 100 306L84 390q-2 22 10 22q14-2 16-19l29-79-8 104h98l-8-104 29 79q2 18 16 19q12 0 10-22l-16-84q-11-47-36-59Z',skin)+p('M137 395h87l-4 172q-14 17-30 0l-6-128h-8l-7 128q-15 17-30 0Z',skin)+paper(outfit(c.outfit,col('outfit'),textile('outfit')));
    const active=c.outfit?'outfit':'top';
    if(c.patterns[active]>=4)body+=motif(c.patterns[active],180,310,19,'#f5e6c5');
    if(!c.outfit&&c.patterns.bottom>=4)body+=motif(c.patterns.bottom,209,428,12,'#f5e6c5');
    body+=paper(necklace(c.necklace,col('jewelry')))+paper(shoes(c.shoes,col('shoes')));
    const widths=[.87,1,1.16,1.09],scale=[.78,.84,.9,.95,1][c.height];
    let head=paper(earShapes(c.ears,skin))+paper(ellipse(180,139,66,80,skin))+ellipse(139,174,13,7,'#d58e7b','opacity=".32"')+ellipse(221,174,13,7,'#d58e7b','opacity=".32"')+eyes(c.eyes,col('eyes'))+nose(c.nose)+mouth(c.mouth)+paper(earrings(c.earrings,col('jewelry')))+paper(hairFront(c.hair,hc))+glasses(c.glasses,col('glasses'));
    if(c.outfit===12)head+=paper(p('M104 84l70-88 19 8 32 76Z',col('outfit'))+p('M93 83q87-26 174 0l-6 14q-81-20-162 0Z',col('outfit'))+star(182,45,10,'#e9d3a2'));
    if(c.outfit===14)head+=paper(p('M108 111Q96 23 181 18Q264 24 252 112l-15-22q-57-35-114 0Z',col('outfit')))+circle(135,66,7,white)+circle(225,66,7,white)+circle(135,67,3,line)+circle(225,67,3,line);
    if(c.outfit===15)head+=paper(ellipse(131,40,18,59,col('outfit'), 'transform="rotate(-16 131 40)"')+ellipse(229,40,18,59,col('outfit'),'transform="rotate(16 229 40)"')+ellipse(131,39,8,41,'#deb4ac','transform="rotate(-16 131 40)"')+ellipse(229,39,8,41,'#deb4ac','transform="rotate(16 229 40)"'));
    if(c.outfit===16)head+=paper(circle(119,60,28,col('outfit'))+circle(241,60,28,col('outfit'))+circle(119,60,15,'#edddc7')+circle(241,60,15,'#edddc7'));
    const focus=options.focus||'full', views={full:'0 -35 360 680',face:'64 21 232 218',hair:'55 -32 250 390',top:'66 222 228 193',bottom:'65 365 230 225',outfit:'50 218 260 385',shoes:'95 477 175 139',necklace:'122 226 116 89'};
    const view=views[focus]||views.full;
    // Detail thumbnails use the same unscaled source coordinates as the live character.
    const transform=focus==='full'?`translate(180 610) scale(${scale}) translate(-180 -610)`:'';
    const full=`<g transform="${transform}">${back}${paper(hairBack(c.hair,hc))}<g transform="translate(180 0) scale(${widths[c.body]} 1) translate(-180 0)">${body}</g>${head}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}" role="img" aria-label="紙娃娃角色" class="doll-svg"><defs>${defs}</defs>${full}</svg>`;
  }
  function thumbnail(input,part,value) {
    const c=Core.choose(input,part,value);
    if(part==='eyes') c.glasses=0;
    if(part==='ears'||part==='earrings')c.hair=0;
    if(part==='necklace') c.outfit=0;
    const focus=['eyes','glasses','nose','mouth','ears','earrings','skin'].includes(part)?'face':['hair','top','bottom','outfit','shoes','necklace'].includes(part)?part:'full';
    return draw(c,{thumbnail:true,focus});
  }
  function icon(name) {
    const shapes={
      person:'<circle cx="12" cy="7" r="3"/><path d="M6 21v-5a6 6 0 0 1 12 0v5M12 15v6"/>',
      ruler:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M7 7h5M7 12h4M7 17h5"/>',
      body:'<path d="M8 3q4 3 8 0l4 5-3 3-1-1 2 12H6l2-12-1 1-3-3Z"/>',
      palette:'<path d="M12 3a9 9 0 1 0 0 18c5 0 1-5 4-5h2c6 0 4-13-6-13Z"/><circle cx="7" cy="10" r="1"/><circle cx="11" cy="6" r="1"/><circle cx="16" cy="8" r="1"/>',
      hair:'<path d="M4 14V9a8 8 0 0 1 16 0v10l-4 2v-8l-4-6-5 5v9l-3-2Z"/><path d="M8 15q4 5 8 0"/>',
      eyes:'<circle cx="6.5" cy="12" r="4.5"/><circle cx="17.5" cy="12" r="4.5"/><path d="M11 11h2M2 10 0 9M22 10l2-1"/>',
      nose:'<path d="M12 3 7 16q5 5 10 0M8 21h8"/>',
      smile:'<circle cx="12" cy="12" r="9"/><path d="M7 13q5 8 10 0M8 8h.1M16 8h.1"/>',
      ear:'<path d="M7 12c-7-11 13-15 12-3 0 5-5 5-6 10-1 4-7 3-7-1M10 11q-2-7 4-6 5 2 0 7"/>',
      necklace:'<path d="M4 4q0 14 8 14T20 4"/><path d="m12 14 4 5-4 4-4-4Z"/>',
      shirt:'<path d="m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4q-4 5-8 0Z"/>',
      pants:'<path d="M6 3h12l2 18h-6l-2-12-2 12H4Z"/>',
      dress:'<path d="M8 2q4 4 8 0l2 6-3 2 6 12H3l6-12-3-2Z"/><path d="M9 11h6"/>',
      shoe:'<path d="M4 5h7v7l5 3 5 1q3 6-2 6H5q-3 0-3-4Z"/><path d="M3 18h18M11 12l-2 3M15 14l-2 3"/>',
      undo:'<path d="m8 4-5 5 5 5M3 9h11a6 6 0 0 1 0 12h-3"/>',
      redo:'<path d="m16 4 5 5-5 5M21 9H10a6 6 0 0 0 0 12h3"/>',
      spark:'<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/><path d="M21 2v4M19 4h4"/>',
      book:'<path d="M12 5Q6 1 2 4v16q5-3 10 1 5-4 10-1V4q-4-3-10 1Zm0 0v16"/>',
      save:'<path d="M4 3h13l4 4v14H3V3Z"/><path d="M7 3v7h10V3M7 21v-7h10v7"/>',
      plus:'<path d="M12 4v16M4 12h16"/>',
      download:'<path d="M12 2v13m-5-5 5 5 5-5M3 16v6h18v-6"/>',
      close:'<path d="m5 5 14 14M19 5 5 19"/>',
      check:'<path d="m4 12 5 5L20 6"/>',
      scissors:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m8 8 13 13M8 16 21 3"/>',
      home:'<path d="m2 11 10-9 10 9M5 9v13h14V9M10 22v-8h4v8"/>',
      full:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name]||shapes.spark}</svg>`;
  }
  return {draw,thumbnail,icon};
});
