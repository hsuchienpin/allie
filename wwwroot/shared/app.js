(function() {
  'use strict';
  const base=new URL('../',document.currentScript.src), C=AllieCore;
  // Retain the original storage namespace when the published project path is renamed.
  const storagePath=base.pathname==='/allie/'?'/allies-playground/':base.pathname;
  const url=path=>new URL(String(path).replace(/^\//,''),base).href;
  let database, opening, unavailable=false;
  const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('allie:'+storagePath):null;
  function changed() { window.dispatchEvent(new Event('allie-change')); channel?.postMessage('change'); }
  if(channel) channel.onmessage=()=>window.dispatchEvent(new Event('allie-change'));
  function open() {
    if(opening) return opening;
    opening=new Promise((resolve,reject)=>{
      const request=indexedDB.open('allie-playground:'+storagePath,1);
      request.onupgradeneeded=()=>{request.result.createObjectStore('data');};
      request.onsuccess=()=>{database=request.result;database.onversionchange=()=>database.close();resolve(database);};
      request.onerror=()=>reject(request.error); request.onblocked=()=>reject(Error('請關閉其他舊版分頁，再重新開啟。'));
    }).catch(error=>{unavailable=true;window.dispatchEvent(new Event('allie-storage-error'));throw error;});
    return opening;
  }
  async function transaction(write,action) {
    const db=await open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('data',write?'readwrite':'readonly'), store=tx.objectStore('data'); let output;
      tx.oncomplete=()=>{if(write)changed();resolve(output);};
      tx.onabort=()=>reject(tx.error||Error('無法保存，這次操作沒有扣除貼紙。'));
      tx.onerror=()=>{};
      const request=store.get('state');
      request.onsuccess=()=>{try{output=action(store,request.result||C.fresh(),tx);}catch(e){tx.abort();reject(e);}};
    });
  }
  async function initialize() {
    return transaction(true,(store,state)=>{
      for(const source of ['slice','bowling']) {try{C.migrate(state,source,JSON.parse(localStorage.getItem('little-game-park.'+source+'.v1')||'null'));}catch(_){}}
      store.put(state,'state'); return state;
    });
  }
  let ready=initialize(); ready.catch(()=>{});
  const getState=async()=>{await ready;return transaction(false,(_,state)=>state);};
  const session=game=>game+':'+crypto.randomUUID();
  async function reward(taskId,game) {
    await ready;
    const candidate=C.ids[Math.floor(Math.random()*C.ids.length)];
    return transaction(true,(store,state)=>{const result=C.claim(state,taskId,game,candidate);store.put(state,'state');return result;});
  }
  async function getDraft(id) {await ready;const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('data');const r=tx.objectStore('data').get('draft:'+id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  async function saveDraft(next,expectedRevision,refundRemoved=false) {
    await ready; const db=await open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('data','readwrite'),store=tx.objectStore('data');let result;
      tx.oncomplete=()=>{changed();resolve(result);};tx.onabort=()=>reject(tx.error||Error('保存失敗，這次操作沒有扣除貼紙。'));tx.onerror=()=>{};
      const a=store.get('state');a.onsuccess=()=>{const b=store.get('draft:'+next.id);b.onsuccess=()=>{try{const state=a.result||C.fresh();result=C.updateDraft(state,b.result,next,expectedRevision,refundRemoved);store.put(state,'state');store.put(result,'draft:'+next.id);store.put(next.id,'last-draft');}catch(e){tx.abort();reject(e);}};};
    });
  }
  async function lastDraft() {await ready;const db=await open();return new Promise(resolve=>{const r=db.transaction('data').objectStore('data').get('last-draft');r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null);});}
  async function preferences(values) {await ready;return transaction(true,(store,state)=>{for(const k of ['sound','reduced'])if(typeof values[k]==='boolean')state.preferences[k]=values[k];store.put(state,'state');return state.preferences;});}
  function bindPreferences(target,notify) {async function sync(){try{const state=await getState();Object.assign(target,state.preferences);notify();}catch(_){}}window.addEventListener('allie-change',sync);sync();}
  const cached=new Map();
  function loadImage(path) {return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('圖片載入失敗，請重新整理。'));image.src=url(path);});}
  function sticker(type) {
    if(cached.has(type))return cached.get(type);
    const item=C.catalog.find(i=>i.id===type);if(!item)return Promise.reject(Error('Unknown sticker'));
    const promise=(async()=>{
      const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');
      if(item.atlas==='symbol'){ctx.font='150px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(item.symbol,128,128);return canvas;}
      const path=item.atlas==='new'?'assets/allie/stickers.webp':'slice/assets/stickers.png';
      let atlas=cached.get('atlas:'+path);if(!atlas){atlas=loadImage(path);cached.set('atlas:'+path,atlas);}const image=await atlas;
      const cols=item.atlas==='new'?6:4,rows=item.atlas==='new'?4:3,w=image.width/cols,h=image.height/rows;
      ctx.drawImage(image,(item.index%cols)*w,Math.floor(item.index/cols)*h,w,h,0,0,256,256);return canvas;
    })();cached.set(type,promise);return promise;
  }
  function stickerImage(type,alt='') {const image=document.createElement('img');image.alt=alt;sticker(type).then(c=>image.src=c.toDataURL()).catch(()=>image.alt='圖片暫時無法載入');return image;}
  async function rewardView(container,result) {
    const item=C.catalog.find(i=>i.id===result.type);container.replaceChildren();
    const title=document.createElement('h2');title.textContent='A new sticker!';
    const image=stickerImage(result.type,item.name);image.className='allie-reward-image';
    const name=document.createElement('strong');name.textContent=item.name;
    const help=document.createElement('p');help.textContent='獲得一張貼紙，已放進共用背包。帶到畫室，每張只能貼一次。';
    const actions=document.createElement('div');actions.className='allie-links';
    for(const [label,path] of [['Draw','studio/'],['My Stickers','stickers/']]){const link=document.createElement('a');link.textContent=label;link.href=url(path);link.className='allie-button';actions.append(link);}
    container.append(title,image,name,help,actions);
  }
  function rewardBox(parent) {let el=parent.querySelector('.allie-reward');if(!el){el=document.createElement('section');el.className='allie-reward';el.setAttribute('aria-live','polite');parent.append(el);}return el;}
  async function award(parent,taskId,game) {const el=rewardBox(parent);el.textContent='正在保存貼紙…';try{await rewardView(el,await reward(taskId,game));}catch(error){el.replaceChildren();const p=document.createElement('p');p.textContent='貼紙未能保存：'+error.message;const retry=document.createElement('button');retry.textContent='Try again';retry.onclick=()=>award(parent,taskId,game);el.append(p,retry);}}
  function header() {
    if(document.body.dataset.allie==='home')return;
    const nav=document.createElement('nav');nav.className='allie-nav';nav.setAttribute('aria-label','Allie’s Playground');
    const brand=document.createElement('a');brand.href=url('');brand.textContent="Allie's Playground";
    const link=document.createElement('a');link.href=url('stickers/');link.textContent='My Stickers';
    nav.append(brand,link);document.body.prepend(nav);
    const note=document.createElement('p');note.className='allie-storage';note.hidden=true;note.textContent='這台裝置無法保存貼紙與草稿。遊戲仍可玩；請下載作品，暫時無法使用獎勵貼紙。';document.body.append(note);
    window.addEventListener('allie-storage-error',()=>note.hidden=false);if(unavailable)note.hidden=false;
  }
  window.Allie={base,url,ready,getState,session,reward,getDraft,saveDraft,lastDraft,preferences,bindPreferences,sticker,stickerImage,rewardView,award,counts:C.counts,catalog:C.catalog};
  document.addEventListener('DOMContentLoaded',header);
})();
