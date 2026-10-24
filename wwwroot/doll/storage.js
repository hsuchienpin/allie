(function (root) {
  'use strict';
  const Core = root.DollCore;
  const error = (code, message) => Object.assign(new Error(message), {code});
  class DollStore {
    async open() {
      this.db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('paper-doll-workshop-v1', 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          db.createObjectStore('characters', {keyPath:'id'});
          db.createObjectStore('drafts', {keyPath:'id'});
        };
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(error('BLOCKED','請關閉其他舊版遊戲分頁，再重新開啟。'));
        request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
      });
      return this;
    }
    transaction(table, mode, work) {
      return new Promise((resolve,reject) => {
        let tx, result, failure;
        try {
          tx=this.db.transaction(table,mode);
          tx.oncomplete=()=>resolve(result);
          tx.onerror=()=>{};
          tx.onabort=()=>reject(failure||tx.error||error('FAILED','保存沒有完成。'));
          work(tx.objectStore(table), value=>{result=value;}, reason=>{failure=reason;tx.abort();});
        } catch(e) {reject(e);}
      });
    }
    async list() {
      const records = await this.transaction('characters','readonly',(store,done)=>{const r=store.getAll();r.onsuccess=()=>done(r.result);});
      return records.filter(r=>r && typeof r.id==='string' && Number.isInteger(r.revision)).map(r=>({...r,name:Core.cleanName(r.name)||'我的紙娃娃',config:Core.normalize(r.config)})).sort((a,b)=>b.updatedAt-a.updatedAt);
    }
    async save(config,name,identity=null) {
      name=Core.cleanName(name);
      if(!name) throw error('NAME','幫角色取個名字吧。');
      const id=identity?.id || (globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
      return this.transaction('characters','readwrite',(store,done,fail)=>{
        const r=store.get(id);
        r.onsuccess=()=>{
          const old=r.result;
          if(identity&&(!old||old.revision!==identity.revision)) {fail(error('CONFLICT','這個角色已在另一個分頁更新或刪除。請另存新角色，保留這次的創作。'));return;}
          const now=Date.now(),record={id,name,config:Core.normalize(config),revision:(old?.revision||0)+1,createdAt:old?.createdAt||now,updatedAt:now};
          store.put(record);done(record);
        };
      });
    }
    async remove(record) {
      return this.transaction('characters','readwrite',(store,done,fail)=>{
        const r=store.get(record.id);
        r.onsuccess=()=>{
          if(!r.result||r.result.revision!==record.revision){fail(error('CONFLICT','收藏冊有新的變更，請關閉後重新開啟收藏冊再試一次。'));return;}
          store.delete(record.id);done(true);
        };
      });
    }
    draft(value) {
      if(value) return this.transaction('drafts','readwrite',(store,done)=>{store.put({id:'last',...value,config:Core.normalize(value.config),updatedAt:Date.now()});done(true);});
      return this.transaction('drafts','readonly',(store,done)=>{const r=store.get('last');r.onsuccess=()=>done(r.result);});
    }
  }
  root.DollStore=DollStore;
})(globalThis);
