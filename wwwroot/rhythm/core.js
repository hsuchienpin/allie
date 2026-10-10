(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RhythmCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const keys=[60,62,64,65,67,69,71,72],names=['C','D','E','F','G','A','B','C'];
  function parse(notation){
    let beat=0;const notes=notation.trim().split(/\s+/).map(token=>{
      const m=/^(R|[A-G](?:#|b)?[0-7]):(\d*\.?\d+)$/.exec(token);if(!m)throw Error('Invalid notation: '+token);
      const duration=Number(m[2]);if(duration<=0||duration>8)throw Error('Invalid duration');
      let midi=null;if(m[1]!=='R'){const p=/^([A-G])([#b]?)(\d)$/.exec(m[1]);midi=(Number(p[3])+1)*12+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[p[1]]+(p[2]==='#'?1:p[2]==='b'?-1:0);}
      const result={beat,duration,midi};beat+=duration;return result;
    });return {notes,beats:beat};
  }
  function chart(song,mode){
    if(!['piano','drums'].includes(mode)||!song||!Number.isFinite(song.bpm)||song.bpm<60||song.bpm>120)throw Error('Invalid song');
    const phrase=parse(song.notation),step=60/song.bpm;
    const repeats=Math.max(1,Math.round(52/(phrase.beats*step))),lead=3;
    const melody=[];for(let r=0;r<repeats;r++)for(const n of phrase.notes)if(n.midi!==null)melody.push({time:lead+(r*phrase.beats+n.beat)*step,duration:n.duration*step,midi:n.midi});
    const beats=phrase.beats*repeats,notes=[];
    if(mode==='piano'){for(const n of melody){const lane=keys.indexOf(n.midi);if(lane<0||n.duration<.7)throw Error('Piano requires slow white-key single notes');notes.push({...n,lane});}}
    else{
      // One pulse per beat, with breathing space at phrase ends. Alternating hands,
      // a few left-left/right-right accents and sparse two-hand phrase accents.
      for(let b=0;b<beats;b++){if(b%8===7)continue;const lane=b%8===3?0:b%8===5?1:b%2;notes.push({time:lead+b*step,lane,duration:.16,midi:lane?69:60});if(b%16===0&&b>0)notes.push({time:lead+b*step,lane:1,duration:.16,midi:69});}
    }
    const backing=[];for(let b=0;b<beats;b+=2){const active=melody.find(n=>n.time>=lead+b*step&&n.time<lead+(b+2)*step);const bass=active?active.midi-24:36;backing.push({time:lead+b*step,midi:Math.max(28,bass),duration:1.7*step});}
    return {mode,songId:song.id,lead,step,melody,backing,end:lead+beats*step+1.2,window:mode==='piano'?.34:.29,great:mode==='piano'?.16:.13,travel:mode==='piano'?2.55:2.2,notes:notes.map((n,i)=>({...n,id:i,state:'pending'}))};
  }
  class Game{
    constructor(track){this.track=track;this.notes=track.notes.map(n=>({...n}));this.elapsed=0;this.score=0;this.hits=0;this.great=0;this.misses=0;this.combo=0;this.bestCombo=0;this.finished=false;}
    advance(time){if(!Number.isFinite(time)||time<this.elapsed||this.finished)return;this.elapsed=time;for(const n of this.notes)if(n.state==='pending'&&time>n.time+this.track.window){n.state='miss';this.misses++;this.combo=0;}if(time>=this.track.end)this.finished=true;}
    hit(lane,time){if(!Number.isFinite(time)||time<this.elapsed)return null;this.advance(time);if(this.finished||!Number.isInteger(lane)||lane<0||lane>=(this.track.mode==='piano'?8:2))return null;let best=null,diff=Infinity;for(const n of this.notes){const d=Math.abs(n.time-time);if(n.state==='pending'&&n.lane===lane&&d<=this.track.window&&d<diff){best=n;diff=d;}}if(!best)return null;const great=diff<=this.track.great;best.state='hit';this.hits++;this.great+=Number(great);this.score+=great?100:50;this.combo++;this.bestCombo=Math.max(this.combo,this.bestCombo);return {note:best,label:great?'Great!':'Good!',points:great?100:50};}
    get eligible(){return this.finished&&this.hits>0;}
  }
  function records(raw,songs,mode){const result={best:{},last:songs[0].id,pending:[]};if(!raw||typeof raw!=='object')return result;if(songs.some(s=>s.id===raw.last))result.last=raw.last;for(const s of songs){const n=raw.best?.[s.id];if(Number.isInteger(n)&&n>=0&&n<=100000)result.best[s.id]=n;}if(Array.isArray(raw.pending))result.pending=raw.pending.filter(p=>p&&typeof p.id==='string'&&new RegExp('^'+mode+':[a-zA-Z0-9-]{10,100}$').test(p.id)&&songs.some(s=>s.id===p.song)&&Number.isInteger(p.score)&&p.score>0&&p.score<=100000).slice(-20);return result;}
  return {keys,names,parse,chart,Game,records};
});
