(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./catalog.js'):root.DollCatalog,typeof module==='object'&&module.exports?require('./core.js'):root.DollCore);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.DollRenderer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C,Core){
  'use strict';
  let serial=0;
  const cream='#fff9ec',ink='#5d423c',pink='#eaa296',gold='#e6bc69';
  const p=(d,f='none',a='')=>`<path d="${d}" fill="${f}" ${a}/>`;
  const e=(x,y,rx,ry,f,a='')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" ${a}/>`;
  const dot=(x,y,r,f,a='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${a}/>`;
  const rect=(x,y,w,h,r,f,a='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}" ${a}/>`;
  const st=(c=ink,w=2)=>`stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const g=(s,t='',a='')=>`<g transform="${t}" ${a}>${s}</g>`;
  function mix(c,target,amount){return '#'+[1,3,5].map(i=>Math.round(parseInt(c.slice(i,i+2),16)*(1-amount)+parseInt(target.slice(i,i+2),16)*amount).toString(16).padStart(2,'0')).join('');}
  const light=c=>mix(c,cream,.45),dark=c=>mix(c,ink,.3);
  const cut=(d,c,fill=c)=>p(d,fill,st(dark(c),1.65));
  const seam=(d,c=cream,w=1.5)=>p(d,'none',st(c,w)+' stroke-dasharray="3 4"');
  function star(x,y,r,c){return `<polygon points="${Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2,k=i%2?r*.48:r;return `${(x+Math.cos(a)*k).toFixed(2)},${(y+Math.sin(a)*k).toFixed(2)}`;}).join(' ')}" fill="${c}" stroke-linejoin="round"/>`;}
  const heart=(x,y,r,c)=>g(p('M0 9C-25-5-10-21 0-9C10-21 25-5 0 9Z',c),`translate(${x} ${y}) scale(${r/12})`);
  const flower=(x,y,r,c)=>Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5;return dot(x+Math.sin(a)*r*.62,y+Math.cos(a)*r*.62,r*.48,c);}).join('')+dot(x,y,r*.31,gold);
  const bow=(x,y,r,c)=>g(cut('M0 0Q-25-20-23 0Q-24 18 0 4Q24 18 23 0Q25-20 0 0Z',c)+dot(0,2,5,light(c)),`translate(${x} ${y}) scale(${r/24})`);
  function bear(x,y,r,c){return dot(x-r*.57,y-r*.53,r*.36,c)+dot(x+r*.57,y-r*.53,r*.36,c)+e(x,y,r*.85,r*.76,c)+e(x,y+r*.28,r*.4,r*.28,cream)+dot(x-r*.3,y,1.8,ink)+dot(x+r*.3,y,1.8,ink)+e(x,y+r*.19,r*.14,r*.1,ink);}
  function motif(k,x,y,r,c=cream){
    if(k===4)return star(x,y,r,c)+dot(x-r*.2,y-r*.25,r*.1,cream);
    if(k===5)return heart(x,y,r,c);
    if(k===6)return ['#e8988b','#edc76e','#a8c4a0','#a4c7d5'].map((a,i)=>p(`M${x-r+i*r*.2} ${y+r*.5}a${r-i*r*.2} ${r-i*r*.2} 0 0 1 ${2*(r-i*r*.2)} 0`,'none',st(a,r*.2))).join('')+e(x-r,y+r*.55,r*.3,r*.19,cream)+e(x+r,y+r*.55,r*.3,r*.19,cream);
    if(k===7)return g(cut('M-20 10Q-11 7-8-3Q-9-18 4-17Q17-17 14-5L6-1V13H0V6H-6v7h-6v-5Z','#8db899')+dot(7,-11,1.6,ink)+p('M-10-1l-5-6 7-1M-6-10l-4-8 7 1',gold),`translate(${x} ${y}) scale(${r/20})`);
    if(k===8)return p(`M${x-r*.65} ${y}l-2-${r} ${r*.65} ${r*.4} ${r*.65}-${r*.4}-2 ${r}Z`,c)+e(x,y,r*.8,r*.68,c)+dot(x-r*.28,y,1.8,ink)+dot(x+r*.28,y,1.8,ink)+heart(x,y+r*.28,r*.15,pink)+p(`M${x-r} ${y+3}h${r*.3}m${r*1.4} 0h${r*.3}`,'none',st(ink,1));
    if(k===9)return e(x-r*.67,y,r*.3,r*.7,dark(c))+e(x+r*.67,y,r*.3,r*.7,dark(c))+e(x,y,r*.73,r*.65,c)+e(x,y+r*.22,r*.36,r*.26,cream)+dot(x-r*.27,y-r*.08,1.8,ink)+dot(x+r*.27,y-r*.08,1.8,ink)+e(x,y+r*.12,3,2.5,ink);
    if(k===10)return p(`M${x} ${y-r*.45}q-2-${r*.45} 3-${r*.55}`,'none',st(ink,2))+e(x+5,y-r*.7,r*.32,r*.16,'#9ab998','transform="rotate(-25 '+(x+5)+' '+(y-r*.7)+')"')+e(x-r*.22,y+r*.12,r*.52,r*.7,'#e69586')+e(x+r*.22,y+r*.12,r*.52,r*.7,'#e69586')+p(`M${x-r*.43} ${y-r*.17}q-3 3-2 7`,'none',st(cream,2));
    return '';
  }
  const faceShape='M92 190Q87 122 180 122Q273 122 268 190L270 231Q271 300 180 302Q89 300 90 231Z';
  function hairBack(h,c){
    if(h===19)return '';
    let s=cut('M91 191Q75 96 180 94Q285 96 269 191L265 257Q180 284 95 257Z',c);
    if(h>=6&&h<=11){const end=h===6?291:h<=8?330:401;s+=cut(`M91 171Q180 120 269 171L277 ${end-18}Q253 ${end+21} 212 ${end-2}Q180 ${end+13} 148 ${end-2}Q107 ${end+21} 83 ${end-18}Z`,c);if([8,10,11].includes(h))for(let i=0;i<8;i++)s+=dot(i%2?266:94,222+Math.floor(i/2)*(end-221)/3,h===11?26:18,c,st(dark(c),1));s+=p(`M107 210Q96 ${end-45} 113 ${end-12}M253 210Q264 ${end-45} 247 ${end-12}`,'none',st(light(c),3));}
    if(h===12||h===13){const y=h===12?139:250;s+=cut(`M253 ${y}Q331 ${y-56} 303 ${y+50}Q285 ${y+90} 313 ${y+115}Q246 ${y+113} 265 ${y+44}Q276 ${y+8} 253 ${y+18}Z`,c)+bow(263,y+9,17,pink);}
    if(h===14)for(const side of [-1,1])s+=g(cut('M0-25Q52-58 49-7Q51 25 22 66Q-7 63 5 28Q21-2 0-2Z',c)+bow(2,1,17,pink),`translate(${180+side*82} 205) scale(${side} 1)`);
    if(h===15||h===16)for(const side of h===15?[1]:[-1,1]){s+=g(Array.from({length:5},(_,i)=>e(i%2?5:-5,i*20,19-i*1.5,17,c,st(dark(c),1.4))).join('')+cut('M-9 99l-8 30q18 12 32 0L7 99Z',c)+bow(0,103,18,pink),`translate(${180+side*83} 264) rotate(${-side*7})`);}
    if(h===17)s+=e(180,91,43,32,c,st(dark(c),1.6))+p('M154 88q28-23 46 1','none',st(light(c),3))+bow(202,111,20,pink);
    if(h===18)for(const side of [-1,1])s+=dot(180+side*76,119,36,c,st(dark(c),1.6))+p(`M${180+side*76-17} 118q12-21 30-9`,'none',st(light(c),3))+bow(180+side*73,148,16,pink);
    return s;
  }
  function hairFront(h,c){
    if(h===19)return '';
    let d='M91 207Q74 94 180 95Q286 94 269 207L253 182Q216 184 196 157Q171 185 139 176Q125 199 108 191Z';
    if(h===0)d='M95 174Q96 107 180 107Q264 107 265 174Q223 149 180 153Q137 149 95 174Z';
    if(h===1)d='M91 207Q76 96 180 97Q284 96 269 207L252 195Q230 176 218 162Q182 180 151 165Q127 185 110 194Z';
    if([2,6,7,9,16].includes(h))d='M91 207Q76 96 180 97Q284 96 269 207L252 196 249 176Q222 184 206 178L200 155 196 179Q171 188 151 179L145 159 141 180Q121 184 111 177L109 198Z';
    if([3,12,13,15].includes(h))d='M91 208Q72 101 180 95Q279 96 269 207L250 184Q226 181 215 145Q182 193 115 181L109 204Z';
    if(h===4)d='M91 205L81 157 106 151 97 119 132 125 141 84 170 107 196 79 216 109 247 97 247 125 274 137 264 158 273 199 253 183Q221 178 204 153Q168 183 111 179L108 203Z';
    let s=cut(d,c);
    if(h===5||h===8||h===10||h===11){s='';for(let i=0;i<7;i++){const x=102+i*26,y=155-Math.sin(i/6*Math.PI)*42;s+=e(x,y,25,30,c,st(dark(c),1.4))+p(`M${x-8} ${y+2}q15-15 17 2q-2 8-10 4`,'none',st(light(c),2));}s+=e(101,185,13,23,c)+e(259,185,13,23,c);}
    else s+=p(h===0?'M124 140q57-28 111 0':'M120 143q23-26 52-24M194 118q36 4 48 29','none',st(light(c),4)+' opacity=".55"');
    if(h===6)s+=rect(101,197,21,7,3,pink,'transform="rotate(-15 111 200)"');
    return s;
  }
  function ears(k,c){return [-1,1].map(side=>{const x=180+side*88;const rx=[11,15,20,8,23,19][k],ry=[16,20,23,22,18,22][k];return k===5?g(cut('M0-12L28-27Q25 9 0 18Z',c)+p('M5-5l11-8-6 19','none',st(dark(c),1.4)),`translate(${x} 231) scale(${side} 1)`):e(x,231,rx,ry,c,st(dark(c),1.3))+p(`M${x-side*2} 223q${side*12} 0 ${side*7} 15`,'none',st(mix(c,pink,.5),2));}).join('');}
  function eyes(k,c){return [142,218].map((x,i)=>{let s='';if(k===7)s=p(`M${x-12} 225q12-17 24 0`,'none',st(c,4));else if(k===8)s=star(x,224,16,c)+star(x-3,220,5,cream);else if(k===9)s=heart(x,223,14,c)+dot(x-5,217,2.5,cream);else{const rx=[10,14,9,13,13,12,12][k],ry=[14,18,17,11,7,12,12][k];s=g(e(x,223,rx,ry,c)+e(x-3,218,rx*.32,ry*.26,cream)+dot(x+3,228,2.1,light(c)),k===5||k===6?`rotate(${(i?1:-1)*(k===5?10:-12)} ${x} 223)`:'');}return p(`M${x-11} 198q10-5 20 0`,'none',st(light(c),2.5))+s;}).join('');}
  function nose(k,skin){const c=dark(skin);return [e(180,244,5,3.8,mix(skin,pink,.32)),dot(180,245,2.7,c),cut('M180 239l-5 8q5 4 10 0Z',skin),p('M179 239v8q3 3 6 0','none',st(c,1.6)),p('M180 236l-4 13q5 4 10 0','none',st(c,1.6)),e(180,246,8,4,mix(skin,pink,.3))+dot(176,247,1.2,c)+dot(184,247,1.2,c),p('M176 246q0-8 8-6M177 248q4 2 7-1','none',st(c,1.6)),e(180,245,7,6,mix(skin,pink,.36))+e(178,243,2.3,1.4,light(skin))][k];}
  function mouth(k){const smile=p('M169 263q11 12 22 0','none',st(ink,2.4));const open=cut('M166 262Q180 269 194 262Q193 284 180 284Q167 284 166 262Z',ink);return [smile,open+e(180,280,8,3,pink),open+p('M169 264q11 5 22 0l-2 7h-18Z',cream),p('M174 266h12','none',st(ink,2.4)),e(180,269,6,8,ink)+e(178,267,2,2,pink),p('M176 262l8 4-8 4','none',st('#bc756f',2.4)),p('M171 264q4 9 9 0q5 9 9 0','none',st(ink,2.2)),open+p('M169 264l7 1-4 8Z',cream),open+p('M170 265h9v7h-8Zm13 0h7l-1 7h-6Z',cream),p('M168 264q12 15 24 0','none',st(ink,2.5))+cut('M180 269h9v7q-5 8-9 0Z',pink)+p('M185 271v5','none',st('#b87577',1.3))][k];}
  function glasses(k,c){if(!k)return '';let s=p('M168 223q12-8 24 0M88 216l24 7M248 223l24-7','none',st(c,3.5));for(const x of [142,218]){if(k===6||k===7){const lens=k===6?star(x,224,32,c):heart(x,224,29,c);s+=lens+g(k===6?star(0,0,24,cream):heart(0,0,21,cream),`translate(${x} 224)`,'opacity=".7"');}else{const fill=k===8?dark(c):'#ffffff';const a=st(c,3.7)+(k===8?'':' fill-opacity=".12"');s+=k===1?dot(x,223,28,fill,a):k===3?e(x,224,30,23,fill,a):rect(x-(k===4?33:29),k===4?195:201,k===4?66:58,k===4?58:46,k===2?9:17,fill,a);if(k===5)s+=p(`M${x-27} 217q27-23 54 0`,'none',st(c,6));s+=p(`M${x-15} 212l9-6`,'none',st(cream,3)+' opacity=".7"');}}return s;}
  function earrings(k,c,compact=false){if(!k)return '';return [-1,1].map(side=>{const x=compact?180+side*31:180+side*91,y=249;let s=dot(x,y,3,c);if(k===1)return dot(x,y+2,5,c)+dot(x-1,y,1.5,cream);s+=p(`M${x} ${y}v7`,'none',st(c,1.6));if(k===2)s+=star(x,y+15,9,c);if(k===3)s+=heart(x,y+15,8,c);if(k===4)s+=flower(x,y+15,9,c);if(k===5)s+=e(x-5,y+11,5,7,c,'transform="rotate(-25 '+(x-5)+' '+(y+11)+')"')+e(x+5,y+11,5,7,c,'transform="rotate(25 '+(x+5)+' '+(y+11)+')"')+e(x,y+15,2,8,gold);if(k===6)s+=p(`M${x} ${y+5}l-5 11m5-11 5 11`,'none',st('#8aab80',1.8))+dot(x-5,y+18,5,pink)+dot(x+5,y+18,5,pink);if(k===7)s+=e(x,y+13,7,10,'none',st(c,3));return s;}).join('');}
  function necklace(k,c){if(!k)return '';let s=p('M152 307Q154 344 180 345Q206 344 208 307','none',st(c,2));if(k===2)s+=Array.from({length:9},(_,i)=>{const a=Math.PI+i*Math.PI/8;return dot(180+Math.cos(a)*27,309-Math.sin(a)*36,4.5,['#eaa296','#a9bf9c','#e6bc69','#acb4d4'][i%4]);}).join('');if(k===3)s+=star(180,352,10,c);if(k===4)s+=heart(180,351,9,c);if(k===5)s+=p('M187 343a11 11 0 1 0 4 17q-15 0-4-17Z',c);if(k===6)s+=flower(180,353,10,c);if(k===7)s+=cut('M168 349q1-13 7-6q5-8 10 0q7-7 8 6l-8 12h-10Z',c)+p('M175 348l5 10 5-10','none',st(light(c),1.4));if(k===8)s+=motif(6,180,351,12);if(k===9)s+=bear(180,352,11,c);return s;}
  const shortTop='M151 305Q180 316 209 305Q231 310 244 326L257 353Q249 367 231 364L221 349 227 423Q180 437 133 423L139 349 129 364Q110 367 103 353L116 326Q129 310 151 305Z';
  const longTop='M151 305Q180 316 209 305Q231 310 244 326L265 399Q270 416 249 419L234 413 223 370 228 423Q180 438 132 423L137 370 126 413 111 419Q90 416 95 399L116 326Q129 310 151 305Z';
  const collar=(c=cream)=>cut('M151 307l29 12-16 17-19-22Z',c)+cut('M209 307l-29 12 16 17 19-22Z',c);
  const buttons=(x,start,n,c=cream,step=19)=>Array.from({length:n},(_,i)=>dot(x,start+i*step,3.3,c)+dot(x,start+i*step,1,dark(c))).join('');
  function top(k,c,f=c){
    const long=[1,5,7,8,9,13,14,15].includes(k);let s=cut(long?longTop:shortTop,c,f);
    s+=p('M151 306q29 25 58 0','none',st(light(c),6))+seam('M139 418q41 11 82 0');
    if(!long)s+=seam('M109 352l21 6M230 358l21-6');
    if(k===1)s+=p('M101 403l22 6M237 409l22-6','none',st(light(c),10));
    if(k===2)s+=p('M137 344h86M137 364h86M135 384h90M134 404h92','none',st(cream,7)+' opacity=".72"');
    if(k===3)s+=cut('M136 366h88l3 57q-47 13-94 0Z',c,light(c))+rect(150,337,22,23,6,cream)+seam('M153 342h16',c);
    if(k===4||k===5)s+=collar()+p(k===5?'M180 320v101':'M180 320v37','none',st(light(c),4))+buttons(180,340,k===5?4:2)+rect(193,345,22,22,4,light(c))+seam('M196 350h16',dark(c));
    if(k===6)s+=p('M149 307q3 24 13 17q6 16 18 1q12 15 18-1q10 7 13-17l-31 12Z',cream,st(light(c),1.3))+bow(180,330,13,pink);
    if(k===7)s+=p('M135 418q45 11 90 0M102 404l21 6M237 410l21-6','none',st(light(c),9))+p('M174 325l6 9 6-9','none',st(cream,2));
    if(k===8)s+=cut('M147 307Q143 283 180 286Q217 283 213 307L203 332 180 318 157 332Z',c,light(c))+p('M165 326v30M195 326v30','none',st(cream,2))+dot(165,356,3,cream)+dot(195,356,3,cream)+cut('M157 375h46l11 26q-34 13-68 0Z',c,light(c))+seam('M154 399q26 8 52 0',c);
    if(k===9){s+=p('M135 418q45 11 90 0M102 404l21 6M237 410l21-6','none',st(light(c),10));for(let x=150;x<=210;x+=15)s+=p(`M${x} 341q-7 7 0 14t0 14t0 14t0 14t0 14`,'none',st(light(c),2.5));}
    if(k===10)s+=p('M130 326l-14 25M230 326l14 25M143 350l-6 66M217 350l6 66','none',st(cream,5))+star(200,342,9,gold);
    if(k===11)s+=p('M132 315q-14 8-24 36l20 7 17-24M228 315q14 8 24 36l-20 7-17-24',cream)+p('M180 320v105','none',st(cream,3))+buttons(180,339,4)+star(203,349,9,cream);
    if(k===12)s+=cut('M147 309l33 28 33-28 9 111q-42 13-84 0Z',c)+p('M149 316l31 29 31-29M142 415q38 11 76 0','none',st(cream,4));
    if(k===13||k===14){s+=p('M162 312l18 14 18-14v113h-36Z',cream)+cut('M151 308l21 19-12 23 8 77-35-5 7-71Z',c)+cut('M209 308l-21 19 12 23-8 77 35-5-7-71Z',c)+buttons(194,357,3);if(k===13)s+=collar(light(c))+rect(145,351,18,19,3,light(c))+rect(200,351,18,19,3,light(c))+seam('M145 354h18M200 354h18M141 410h25M197 410h23');else s+=p('M125 322l-26 79 21 7 21-62M235 322l26 79-21 7-21-62',cream)+star(150,353,9,cream)+p('M135 418h29M197 418h29','none',st(light(c),7));}
    if(k===15)s+=cut('M147 308Q143 280 180 282Q217 280 213 308L202 331 180 316 158 331Z',c,light(c))+p('M180 324v99','none',st(light(c),3))+buttons(169,345,4,gold)+buttons(191,345,4,gold)+rect(139,375,25,28,6,light(c))+rect(196,375,25,28,6,light(c));
    return s;
  }
  function bottom(k,c,f=c){
    if(k>=8){const end=k===11?527:482,w=k===10?83:k===9?76:67;let s=cut(`M133 403q47-12 94 0l${w-47} ${end-403}q-${w} 24-${w*2} 0Z`,c,f);if(k===9||k===11)for(let i=-2;i<=2;i++)s+=p(`M${180+i*17} 415l${i*9} ${end-419}`,'none',st(dark(c),1.2));if(k===10)s+=p('M130 425q50 21 100 0l16 27q-66 27-132 0Z',light(c))+p('M115 450q65 23 130 0l15 28q-80 25-160 0Z',c,'fill-opacity=".5"')+seam('M105 478q75 22 150 0');s+=p('M134 406q46 11 92 0','none',st(light(c),8))+bow(180,414,15,cream);return s;}
    const end=k===0?461:k===1?487:528,wide=k===5?9:k===7?-6:0;let s=cut(`M132 403q48-12 96 0l${5+wide} ${end-415}q-18 11-${39+wide} 4l-10-${end-434}h-8l-10 ${end-434}q-${20+wide} 7-${39+wide}-4Z`,c,f);
    s+=p('M134 407q46 8 92 0','none',st(light(c),7))+p('M180 410v25','none',st(dark(c),1.5))+dot(180,412,3,cream);
    s+=seam(`M${132-wide} ${end-10}h33M195 ${end-10}h${33+wide}`);
    if(k!==7)s+=p('M143 417q1 16 17 13M217 417q-1 16-17 13','none',st(light(c),2));
    if(k===3)s+=seam('M139 438l-1 74M221 438l1 74')+rect(139,467,21,26,4,light(c),'transform="rotate(-7 150 480)"')+seam('M142 470l16-2M142 489l16-2',c)+p('M130 520h35M195 520h35','none',st(light(c),8));
    if(k===4)s+=p('M136 424l-2 90M224 424l2 90','none',st(cream,5));
    if(k===6)s+=rect(128,457,29,31,5,light(c))+rect(203,457,29,31,5,light(c))+p('M129 465h27M204 465h27','none',st(dark(c),1.4))+dot(142,471,2,cream)+dot(217,471,2,cream);
    return s;
  }
  function shoes(k,c,skin='#edc8a6'){return [148,212].map((x,i)=>{let s='',a=st(dark(c),1.5);if(!k){s=e(2,12,24,13,skin,st(dark(skin),1.2))+p('M15 7v4m6-2v4','none',st(dark(skin),1.3));return g(s,`translate(${x} 527) scale(${i?1:-1} 1)`);}
    const high=k===11?65:k===9?49:k===10?34:k===4?31:15;
    s=cut(`M-19 ${-high}q19-7 38 0l1 ${high-2}q25-1 25 18q-1 10-14 10h-51q-10-3-9-14Z`,c);
    s+=p('M-26 20q34 6 67 0v8q-30 6-62 0Z',cream,a)+seam('M-23 25h61',c,1);
    if(k===1||k===4)s+=p('M20 1q23 0 23 17H15q-2-12 5-17Z',cream,a)+p('M-4-10l18 3M-4-3l18 3M-4 4l17 3','none',st(cream,2.5));
    if(k===4)s+=star(-7,-20,7,cream)+p('M-16-27h30','none',st(light(c),4));
    if(k===2)s+=p('M-19-9l17 11 14-8 15 18-7 3-13-10-11 8-19-9Z',cream)+p('M-4-7l14 3M-3 0l16 3','none',st(light(c),3));
    if(k===3)s+=rect(-11,-10,31,7,3,cream)+rect(-11,1,34,7,3,cream)+dot(15,-7,1.6,gold)+dot(18,4,1.6,gold);
    if(k===5)s+=p('M-15 10Q-11-10 18-4q18 2 15 18Z',light(c),st(dark(c),1))+p('M-12 6h42','none',st(c,5));
    if(k===6)s+=p('M-12-8v22M0-7v22M12-4v19','none',st(cream,5));
    if(k===7)s+=p('M-19-8l40 20M17-9l-34 23','none',st(cream,7))+rect(-8,-2,12,11,2,'none',st(gold,2));
    if(k===8)s+=p('M-18-12q21-12 38 10l9 13q-24-8-50 0Z',light(c),a)+flower(4,-2,8,cream);
    if(k===9)s+=p('M-18-44h36','none',st(light(c),8))+flower(0,-21,11,cream);
    if(k===10)s+=p('M-1-25v29M-8-20h15M-8-11h15M-8-2h15','none',st(cream,2.5));
    if(k===11)s+=p('M-18-59h36M-17-10h35','none',st(light(c),8))+rect(4,-15,10,10,2,'none',st(gold,2));
    if(k===12)s+=e(0,-6,14,6,cream)+p('M-16-1h33','none',st(c,7))+bow(2,-2,10,light(c));
    if(k===13)s+=bear(4,-5,24,light(c));
    return g(s,`translate(${x} 527) scale(${i?1:-1} 1)`);
  }).join('');}
  function outfit(k,c,f=c){
    if(!k)return '';
    if([1,2,3,5,9,12].includes(k)){
      const end=k===12?540:k===9?526:492,w=k===9?99:k===12?78:76;
      let s=top(k===2||k===12?1:k===5?6:0,c,f);
      if(k===3)s=top(0,cream)+cut('M146 307h13v58h42v-58h13l10 97h-88Z',c,f);
      s+=cut(`M139 369q41-8 82 0l${w-41} ${end-369}q-${w} 26-${w*2} 0Z`,c,f)+p('M141 371q39 10 78 0','none',st(cream,8));
      s+=p(`M151 393l-23 ${end-404}M209 393l23 ${end-404}`,'none',st(dark(c),1.2))+seam(`M${185-w} ${end-5}q${w-5} 18 ${2*w-10} 0`);
      if([1,2,3].includes(k))s+=collar()+bow(180,375,20,light(c));
      if(k===5)s+=cut('M149 309h12v44h38v-44h12l6 70h-74Z',c)+dot(155,337,4,gold)+dot(205,337,4,gold)+rect(163,350,34,22,5,light(c))+rect(153,422,54,37,10,light(c))+flower(180,441,12,cream);
      if(k===9)s+=cut('M151 313l29 20 29-20-10 54h-38Z',c,cream)+bow(180,375,23,gold)+p('M139 386q-2 61-47 102q63 4 88-48q25 52 88 48q-45-41-47-102Z',light(c),st(cream,2))+[124,180,236].map((x,i)=>flower(x,500+(i===1?5:0),8,cream)).join('');
      if(k===12)s+=collar(gold)+star(180,343,12,gold)+Array.from({length:8},(_,i)=>star(129+(i%3)*48,406+Math.floor(i/3)*40,7,gold)).join('');
      return s;
    }
    let s=bottom(k===4?3:k===6?6:k===7?4:2,c,f)+top(k===4?0:k===7?10:k===8?5:1,c,f);
    if(k===4)s=bottom(3,c,f)+top(0,cream)+cut('M145 308h14v44h42v-44h14l8 111q-43 13-86 0Z',c,f)+dot(153,337,4,gold)+dot(207,337,4,gold)+rect(163,357,34,28,6,light(c))+seam('M167 362h26M145 414h70');
    if(k===6)s+=p('M180 319v105','none',st(cream,3))+rect(144,342,24,26,5,light(c))+rect(192,342,24,26,5,light(c))+p('M136 409h88','none',st(dark(c),7))+rect(171,404,18,11,2,gold);
    if(k===7)s+=p('M180 320v104','none',st(cream,4))+star(200,346,10,gold);
    if(k===8)s+=Array.from({length:7},(_,i)=>star(146+(i%3)*34,360+Math.floor(i/3)*49,6,gold)).join('')+p('M207 330a10 10 0 1 0 3 15q-14-1-3-15Z',cream);
    if(k===10)s+=collar(gold)+p('M154 334h52M154 351h52M154 368h52','none',st(gold,2.5))+buttons(156,334,3,gold,17)+buttons(204,334,3,gold,17)+p('M135 411h90','none',st(cream,9))+rect(172,404,16,14,3,gold)+p('M124 322l18 5M218 327l18-5','none',st(gold,8));
    if(k===11)s+=rect(150,337,60,47,10,cream,st(dark(c),1.5))+rect(158,344,44,20,5,'#99bdc7')+dot(164,374,4,pink)+dot(180,374,4,gold)+dot(196,374,4,'#9fba99')+p('M138 415h84M130 491h36M194 491h36M101 399l23 8M236 407l23-8','none',st(cream,10))+p('M207 375q37 17 12 39','none',st(gold,6));
    if(k===13)s+=p('M155 330h50l-5 38-20 16-20-16Z',cream,st(gold,2))+star(180,351,16,gold)+p('M134 411h92','none',st(gold,11))+rect(172,405,16,13,3,cream);
    if(k>=14)s+=e(180,369,34,45,cream,st(light(c),2))+p('M180 328v80','none',st(light(c),2))+dot(180,338,3,gold)+(k===15?bow(180,321,16,pink):k===16?bear(180,367,19,light(c)):p('M161 344l6-6 6 6M181 357l6-6 6 6M166 377l6-6 6 6','none',st(light(c),2)));
    return s;
  }
  function costumeHead(k,c){
    if(k===9||k===10)return cut('M144 124l-7-38 26 18 17-32 17 32 26-18-7 38Z',gold)+dot(180,104,6,pink)+dot(153,111,4,cream)+dot(207,111,4,cream)+p('M148 119h64','none',st(cream,3));
    if(k===12)return cut('M112 134l57-116 26 9 58 107Z',c)+cut('M87 136q93-29 186 0l-5 16q-88-21-176 0Z',c)+p('M123 116q57-14 114 0','none',st(gold,12))+star(183,73,13,gold);
    if(k===11)return p('M82 234Q52 94 180 85Q308 94 278 234','none',st(cream,19))+rect(65,194,22,49,9,cream,st(dark(c),1.5))+rect(273,194,22,49,9,cream,st(dark(c),1.5))+p('M100 152Q128 112 174 110','none',st('#b9d7dc',8));
    if(k<14)return '';
    let s='';
    if(k===15)s+=e(122,94,24,72,c,'transform="rotate(-16 122 94)" '+st(dark(c),1.5))+e(238,94,24,72,c,'transform="rotate(16 238 94)" '+st(dark(c),1.5))+e(122,87,11,46,pink,'transform="rotate(-16 122 87)"')+e(238,87,11,46,pink,'transform="rotate(16 238 87)"');
    if(k===16)s+=dot(108,127,33,c,st(dark(c),1.5))+dot(252,127,33,c,st(dark(c),1.5))+dot(108,127,18,cream)+dot(252,127,18,cream);
    if(k===14)s+=p('M151 112l13-26 16 20 17-26 15 34Z',gold,st(dark(gold),1.5));
    s+=cut('M88 211Q65 99 180 102Q295 99 272 211L254 190Q246 156 180 155Q114 156 106 190Z',c);
    if(k===14)s+=dot(136,138,9,cream)+dot(224,138,9,cream)+dot(138,140,4,ink)+dot(222,140,4,ink)+p('M116 172l8 13 8-20M228 165l8 20 8-13',cream)+e(164,143,3,2,dark(c))+e(196,143,3,2,dark(c));
    if(k===15)s+=e(148,131,3.5,5,ink)+e(212,131,3.5,5,ink)+heart(180,144,5,pink);
    if(k===16)s+=e(180,138,24,16,cream)+e(180,134,7,5,ink)+dot(143,131,4,ink)+dot(217,131,4,ink)+p('M180 139q-3 8-8 3M180 139q3 8 8 3','none',st(ink,1.5));
    return s;
  }
  function draw(input,options={}){
    const c=Core.normalize(input),id='doll'+(++serial),col=k=>C.palettes[k][c.colors[k]],skin=C.skinColors[c.skin],hc=col('hair'),focus=options.focus||'full';
    const textile=k=>c.patterns[k]>0&&c.patterns[k]<4?`url(#${id}-${k})`:col(k);
    let defs=`<filter id="${id}-paper" x="-35%" y="-35%" width="170%" height="170%"><feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="edge"/><feFlood flood-color="${cream}"/><feComposite in2="edge" operator="in"/><feDropShadow dx="1" dy="2.5" stdDeviation="1.5" flood-color="#785944" flood-opacity=".16"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    for(const k of ['top','bottom','outfit']){defs+=`<pattern id="${id}-${k}" width="20" height="20" patternUnits="userSpaceOnUse">${rect(0,0,20,20,0,col(k))}`;if(c.patterns[k]===1)defs+=p('M0 5h20M0 15h20','none',st(cream,3)+' opacity=".5"');if(c.patterns[k]===2)defs+=p('M0 10h20M10 0v20','none',st(cream,4)+' opacity=".4"');if(c.patterns[k]===3)defs+=dot(5,5,2,cream)+dot(15,15,2,cream);defs+='</pattern>';}
    const paper=s=>g(s,'',`filter="url(#${id}-paper)"`);
    const topArt=top(c.top,col('top'),textile('top'))+motif(c.patterns.top,180,366,19);
    const bottomArt=bottom(c.bottom,col('bottom'),textile('bottom'))+motif(c.patterns.bottom,208,445,12);
    const outfitArt=outfit(c.outfit,col('outfit'),textile('outfit'))+motif(c.patterns.outfit,180,369,17);
    let head=ears(c.ears,skin)+cut(faceShape,skin)+e(118,249,16,8,pink,'opacity=".42"')+e(242,249,16,8,pink,'opacity=".42"')+dot(114,246,2,light(skin))+dot(238,246,2,light(skin))+eyes(c.eyes,col('eyes'))+nose(c.nose,skin)+mouth(c.mouth)+hairFront(c.hair,hc)+earrings(c.earrings,col('jewelry'))+glasses(c.glasses,col('glasses'));
    const none=dot(180,180,30,cream,st('#c8bca7',2)+' stroke-dasharray="4 5"')+p('M170 180h20','none',st('#a59681',3));
    const views={full:'0 -35 360 680',face:'55 103 250 208',hair:'32 51 296 369',top:'77 272 206 177',bottom:'77 387 206 159',outfit:'62 290 236 268',shoes:'100 451 160 116',necklace:'128 297 104 75',earrings:'130 235 100 44',none:'140 140 80 80'};
    let art='',view=views[focus]||views.full;
    if(focus==='hair'&&([0,1,2,3,4,5,17,18,19].includes(c.hair)))view='50 54 260 267';
    if(focus==='costume')view='30 -5 300 600';
    if(focus==='top')art=paper(topArt);
    else if(focus==='bottom')art=paper(bottomArt);
    else if(focus==='shoes')art=paper(shoes(c.shoes,col('shoes'),skin));
    else if(focus==='necklace'||focus==='earrings'){if(c[focus]===0){art=none;view=views.none;}else art=paper(focus==='necklace'?necklace(c.necklace,col('jewelry')):earrings(c.earrings,col('jewelry'),true));}
    else if(focus==='outfit'&&c.outfit===0){art=paper(g(topArt,'translate(19 35) scale(.82)')+g(bottomArt,'translate(40 103) scale(.78)'));}
    else if(focus==='outfit')art=paper(outfitArt);
    else if(focus==='face'||focus==='hair')art=paper(hairBack(c.hair,hc)+head);
    else{
      const sy=[.78,.86,.94,1.02,1.10][c.height],sx=[.9,1,1.16,1.08][c.body],offset=250*(1-sy);
      let body=cut('M160 281h40v43q-20 13-40 0Z',skin)+cut('M127 313q53-23 106 0l7 110q-60 35-120 0Z',skin)+cut('M126 321Q109 321 102 342L85 408Q81 431 94 440Q105 446 114 435Q121 428 120 415L140 360Z',skin)+cut('M234 321Q251 321 258 342L275 408Q279 431 266 440Q255 446 246 435Q239 428 240 415L220 360Z',skin)+cut('M129 414h42l-2 105q-4 22-21 22t-23-22Z',skin)+cut('M189 414h42l4 105q-6 22-23 22t-21-22Z',skin);
      body+=c.outfit?outfitArt:bottomArt+topArt;
      body+=necklace(c.necklace,col('jewelry'))+shoes(c.shoes,col('shoes'),skin);
      const cape=c.outfit===10||c.outfit===13?cut('M137 310Q103 350 86 478Q180 524 274 478Q257 350 223 310Z',col('outfit'),light(col('outfit'))):'';
      art=paper(g(hairBack(c.hair,hc),`translate(0 ${offset})`))+paper(g(cape+body,`translate(180 550) scale(${sx} ${sy}) translate(-180 -550)`))+paper(g(head+costumeHead(c.outfit,col('outfit')),`translate(0 ${offset})`));
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}" role="img" aria-label="可愛紙娃娃角色" class="doll-svg"><defs>${defs}</defs>${art}</svg>`;
  }
  function thumbnail(input,part,value){
    const c=Core.choose(input,part,value);
    if(part==='eyes')c.glasses=0;
    if(part==='ears'||part==='earrings')c.hair=0;
    if(part==='gender')c.hair=[3,6,18][value];
    const focus=part==='outfit'&&value>=9?'costume':['gender','skin','eyes','glasses','nose','mouth','ears'].includes(part)?'face':['hair','top','bottom','outfit','shoes','necklace','earrings'].includes(part)?part:'full';
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
