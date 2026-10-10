(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AllieCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const names = ['Unicorn','Jellyfish','Penguin','Rainbow Princess','Flower Princess','Ocean Princess','Candy Princess','Unicorn Candy','Flower Candy','Unicorn Cake','Penguin Cake','Heart Cake','Berry Candy','Orange Candy','Grape Candy','Ice Cream','Rainbow Ice Pop','Berry Ice Pop','Pink Ball','Blue Ball','Unicorn Balloon','Heart Balloon','Playground','Playhouse'];
  const ids = ['unicorn','jellyfish','penguin','princess-rainbow','princess-flower','princess-ocean','princess-candy','cotton-unicorn','cotton-flower','cake-unicorn','cake-penguin','cake-heart','gummy-berry','gummy-orange','gummy-grape','softserve','pop-rainbow','pop-berry','ball-pink','ball-blue','balloon-unicorn','balloon-heart','playground','playhouse'];
  const catalog = ids.map((id,index) => ({id,name:names[index],index,atlas:'new',image:'assets/allie/v2/'+id+'.webp'}));
  const animals = ['Bunny','Bear','Cat','Dog','Dino','Elephant','Chick','Fox','Penguin','Turtle','Owl','Koala'];
  animals.forEach((name,index) => catalog.push({id:'legacy-slice-'+index,name,index,atlas:'slice'}));
  const old = ['heart','star','rainbow','sun','watermelon','flower','butterfly','rocket','castle','balloon','donut','crown'];
  old.forEach((id,index) => catalog.push({id:'legacy-bowl-'+id,name:['Heart','Star','Rainbow','Sun','Melon','Flower','Butterfly','Rocket','Castle','Balloon','Donut','Crown'][index],symbol:['♥','★','🌈','☀','🍉','🌼','🦋','🚀','🏰','🎈','🍩','👑'][index],atlas:'symbol'}));
  const valid = id => catalog.some(item => item.id === id);
  const fresh = () => ({version:1,units:[],claims:{},migrations:{},preferences:{sound:true,reduced:false}});
  function claim(state, taskId, game, type) {
    if (!['runner','slice','bowling','piano','drums'].includes(game) || typeof taskId !== 'string' || !taskId.startsWith(game+':') || taskId.length>180 || !ids.includes(type)) throw Error('Invalid reward');
    if (Object.hasOwn(state.claims,taskId)) return {fresh:false,...state.claims[taskId]};
    const unit = {id:'reward:'+taskId,type,status:'available',draftId:null};
    state.units.push(unit); state.claims[taskId] = {unitId:unit.id,type};
    return {fresh:true,unitId:unit.id,type};
  }
  function counts(state) { const result={}; for(const u of state.units) if(u.status==='available') result[u.type]=(result[u.type]||0)+1; return result; }
  function migrate(state, source, raw) {
    if(state.migrations[source]) return false;
    if(!raw || typeof raw!=='object') {state.migrations[source]=true;return true;}
    let types=[];
    if(source==='slice' && Array.isArray(raw.stickers)) types=[...new Set(raw.stickers.filter(i=>Number.isInteger(i)&&i>=0&&i<12))].map(i=>'legacy-slice-'+i);
    if(source==='bowling' && Array.isArray(raw.stickers)) types=[...new Set(raw.stickers.filter(i=>old.includes(i)))].map(i=>'legacy-bowl-'+i);
    types.forEach(type=>state.units.push({id:'migration:'+source+':'+type,type,status:'available',draftId:null}));
    state.migrations[source]=true; return true;
  }
  function updateDraft(state, previous, next, expectedRevision, refundRemoved=false) {
    if((previous?.revision||0)!==expectedRevision) throw Error('作品已在另一個分頁更新，請重新開啟畫室。');
    if(!next || typeof next.id!=='string' || !Array.isArray(next.placements) || next.placements.length>300) throw Error('Invalid draft');
    const seen=new Set(), prior=new Set((previous?.placements||[]).map(p=>p.unitId));
    for(const p of next.placements) {
      const unit=state.units.find(u=>u.id===p.unitId);
      if(!unit||seen.has(p.unitId)||!valid(p.type)||unit.type!==p.type||!['available','placed','used'].includes(unit.status)||unit.status!=='available'&&unit.draftId!==next.id) throw Error('這張貼紙已經用完，請選另一張。');
      if(![p.x,p.y,p.size,p.angle].every(Number.isFinite)||p.x<0||p.x>1024||p.y<0||p.y>768||p.size<40||p.size>400) throw Error('Invalid placement');
      seen.add(p.unitId);
    }
    for(const unit of state.units) {
      if(seen.has(unit.id)) { unit.status='placed'; unit.draftId=next.id; }
      else if(prior.has(unit.id)) { unit.status=refundRemoved?'available':'used'; unit.draftId=refundRemoved?null:next.id; }
    }
    return {...next,revision:expectedRevision+1};
  }
  function inventory(state, includeEmpty=false) {
    const stock=counts(state),latest=new Map();
    state.units.forEach((unit,index)=>{if(unit.status==='available')latest.set(unit.type,index);});
    return catalog.filter(item=>stock[item.id]||includeEmpty&&item.atlas==='new').slice().sort((a,b)=>Number(!!stock[b.id])-Number(!!stock[a.id])||(latest.get(b.id)??-1)-(latest.get(a.id)??-1)||a.index-b.index);
  }
  return {catalog,ids,fresh,claim,counts,migrate,updateDraft,inventory};
});
