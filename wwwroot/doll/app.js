(async function () {
  'use strict';
  const C=DollCatalog, Core=DollCore, R=DollRenderer, $=id=>document.getElementById(id);
  // Reuse the playground's persistent fullscreen shell when entered from its home.
  try {
    if(parent!==window&&parent.AllieScreen?.isHost){
      const host=parent.AllieScreen,base=new URL('../',location.href);
      window.AllieScreen={isHost:false,toggle:host.toggle,home:()=>host.navigate(base.href)};
    }
  } catch(_) { /* The standalone game also works without a parent playground. */ }
  const history=new Core.History(C.defaults), store=new DollStore();
  let category='hair', part='hair', identity=null, name='', baseline='', ready=false, busy=false;
  let draftTimer, toastTimer, recordAction=null, collectionTicket=0;
  const sessionId=globalThis.crypto?.randomUUID?.()||Math.random().toString(36);
  const fingerprint=()=>JSON.stringify({name,config:history.current});
  const dirty=()=>fingerprint()!==baseline;
  const escapeText=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function icons(container=document) {container.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=R.icon(el.dataset.icon);});}
  icons();
  function toast(message) {clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,3400);}
  function storageWarning(message) {$('storage-warning').textContent=message;$('storage-warning').hidden=false;}
  function errorText(e) {
    if(e.code==='CONFLICT'||e.code==='NAME'||e.code==='BLOCKED')return e.message;
    if(e.name==='QuotaExceededError')return '這個瀏覽器的保存空間已滿。請先下載角色圖片，再整理不需要的收藏後重試。';
    return '這次沒有保存成功，請再試一次。你仍可下載角色圖片，保留這次的創作。';
  }
  function focusKey() {return document.activeElement?.dataset.focusKey;}
  function restoreFocus(key) {if(key) document.querySelector('[data-focus-key="'+key+'"]')?.focus({preventScroll:true});}
  function currentPalette() {
    if(part==='eyes')return 'eyes';if(part==='glasses')return 'glasses';if(part==='earrings')return 'jewelry';
    return C.categories.find(c=>c.id===category)?.palette;
  }
  function renderPreview() {
    $('doll-preview').innerHTML=R.draw(history.current);
    $('character-name').textContent=name||'還沒取名的小可愛';
    $('undo').disabled=!history.past.length;$('redo').disabled=!history.future.length;
    $('save-character').innerHTML=R.icon('save')+(identity?'完成，保存修改':'完成，幫它取名')+'<span aria-hidden="true">↗</span>';
  }
  function renderOptions() {
    const key=focusKey(),c=history.current,options=C.items[part];
    $('option-count').textContent=options.length+' 款';
    $('options').innerHTML=options.map(option=>{
      let art=part==='skin'?`<span class="skin-sample" style="--skin:${C.skinColors[option.id]}"></span>`:part==='gender'?`<span class="gender-art">${R.icon('person')}<span class="gender-symbol">${['♂','♀','✧'][option.id]}</span></span>`:R.thumbnail(c,part,option.id);
      return `<button type="button" class="option-tile" data-option="${option.id}" data-focus-key="option-${option.id}" aria-label="${escapeText(option.label)}" aria-pressed="${c[part]===option.id}"><span class="selected-badge" aria-hidden="true">✓</span><span class="option-art" aria-hidden="true">${art}</span><span class="option-label">${escapeText(option.label)}</span></button>`;
    }).join('');
    const palette=currentPalette();
    $('color-section').hidden=!palette;
    if(palette){
      const names={hair:['黑','深棕','淺棕','金','紅棕','銀白','粉紅','紫','藍','綠'],eyes:['黑','深棕','淺棕','藍','綠','灰','紫'],glasses:['黑','棕','紅','黃','藍','紫','粉紅']};
      const swatchNames=names[palette]||['第一色','第二色','第三色','第四色','第五色','第六色','第七色','第八色'];
      $('color-swatches').innerHTML=C.palettes[palette].map((color,i)=>`<button type="button" class="swatch-hit" data-color="${i}" data-focus-key="color-${i}" aria-label="${swatchNames[i]}" aria-pressed="${c.colors[palette]===i}" title="${swatchNames[i]}"><span class="swatch" style="--swatch:${color}" aria-pressed="${c.colors[palette]===i}" aria-hidden="true"></span></button>`).join('');
    }
    const hasPattern=['top','bottom','outfit'].includes(part);
    $('pattern-section').hidden=!hasPattern;
    if(hasPattern)$('pattern-select').value=String(c.patterns[part]);
    $('outfit-notice').hidden=!(c.outfit&&['top','bottom'].includes(part));
    restoreFocus(key);
  }
  function selectCategory(next) {
    category=next;const info=C.categories.find(c=>c.id===category);part=info.parts?info.parts[0][0]:category;
    document.querySelectorAll('.category-button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));
    $('category-title').textContent=info.label;$('category-hint').textContent=info.hint;
    $('part-tabs').hidden=!info.parts;
    $('part-tabs').innerHTML=(info.parts||[]).map(([id,label])=>`<button type="button" data-part="${id}" aria-pressed="${id===part}">${label}</button>`).join('');
    document.querySelector('.materials-content').scrollTop=0;
    renderOptions();
  }
  function update(changed=true) {
    renderPreview();renderOptions();if(changed)scheduleDraft();
  }
  async function writeDraft() {
    if(!ready)return;
    try {
      await store.draft({config:history.current,name,identity,baseline,owner:sessionId});
      $('draft-status').textContent=dirty()?'♡ 草稿已留在這裡，完成後記得存進收藏冊。':identity?'♡ 修改完成後，再按一次保存就好。':'♡ 慢慢挑，每一種樣子都很可愛。';
    } catch(e) {$('draft-status').textContent='草稿尚未保存，請試著存進收藏冊或下載圖片。';storageWarning(errorText(e));}
  }
  function scheduleDraft() {clearTimeout(draftTimer);draftTimer=setTimeout(writeDraft,250);}
  function ask(title,message,label='確定') {
    const dialog=$('confirm-dialog');$('confirm-title').textContent=title;$('confirm-message').textContent=message;$('confirm-ok').textContent=label;
    return new Promise(resolve=>{
      let answer=false;
      $('confirm-ok').onclick=()=>{answer=true;dialog.close();};$('confirm-cancel').onclick=()=>dialog.close();
      dialog.addEventListener('close',()=>resolve(answer),{once:true});dialog.showModal();
    });
  }
  function showSave(action=null) {
    if(!ready){toast('這個瀏覽器目前無法存檔，可以先下載角色圖片。');return;}
    recordAction=action;
    const rename=action?.kind==='rename',record=action?.record;
    $('save-title').textContent=rename?'換個可愛的名字':identity?'把這次的想像收藏起來':'給它一個可愛的名字';
    $('name-input').value=rename?record.name:name;
    $('save-preview').innerHTML=R.draw(rename?record.config:history.current,{thumbnail:true});
    $('confirm-save').querySelector('span:last-child').textContent=rename?'保存新名字':identity?'更新這個角色':'存進收藏冊';
    $('save-copy').hidden=rename||!identity;$('name-error').textContent='';$('save-dialog').showModal();
    // Avoid opening a tablet keyboard until the child taps the name field.
    $('random-name').focus({preventScroll:true});
  }
  async function saveCharacter(asCopy=false) {
    if(busy)return;
    const input=Core.cleanName($('name-input').value);$('name-input').value=input;
    if(!input){$('name-error').textContent='先替小角色取個名字吧。';$('name-input').focus();return;}
    busy=true;$('confirm-save').disabled=true;$('save-copy').disabled=true;
    try {
      if(recordAction?.kind==='rename') {
        const old=recordAction.record,record=await store.save(old.config,input,old);
        if(identity?.id===old.id){identity={id:record.id,revision:record.revision};name=record.name;baseline=JSON.stringify({name,config:old.config});renderPreview();await writeDraft();}
      } else {
        const record=await store.save(history.current,input,asCopy?null:identity);
        identity={id:record.id,revision:record.revision};name=record.name;baseline=fingerprint();
        renderPreview();await writeDraft();
      }
      $('save-dialog').close();toast('「'+input+'」已好好收藏 ♡');await refreshCollection();
    } catch(e){$('name-error').textContent=errorText(e);}
    finally{busy=false;$('confirm-save').disabled=false;$('save-copy').disabled=false;}
  }
  async function refreshCollection() {
    if(!ready)return;
    const ticket=++collectionTicket;
    try {
      const records=await store.list();if(ticket!==collectionTicket)return;
      $('collection-count').textContent=records.length;$('collection-error').textContent='';
      const root=$('collection-grid');root.replaceChildren();
      if(!records.length){root.innerHTML='<div class="collection-empty"><span class="empty-flower" aria-hidden="true">✿</span><strong>第一個朋友，會是什麼模樣？</strong><p>完成角色、取個名字，就會出現在這裡。</p><button class="button secondary" type="button" id="empty-create">回到創作桌</button></div>';$('empty-create').onclick=()=>$('collection-dialog').close();return;}
      for(const record of records){
        const card=document.createElement('article');card.className='collection-card';card.dataset.id=record.id;
        const art=document.createElement('div');art.className='collection-art';art.innerHTML=R.draw(record.config,{thumbnail:true});
        const title=document.createElement('h3');title.textContent=record.name;
        const date=document.createElement('p');date.className='card-date';date.textContent='收藏於 '+new Intl.DateTimeFormat('zh-TW',{month:'numeric',day:'numeric'}).format(record.updatedAt);
        const edit=document.createElement('button');edit.className='button secondary edit-character';edit.textContent='繼續修改';edit.onclick=async()=>{
          if(dirty()&&!await ask('打開這個小角色？','目前尚未存進收藏冊的造型會被替換，可以先按「再想一下」回去存檔。','打開角色'))return;
          history.reset(record.config);identity={id:record.id,revision:record.revision};name=record.name;baseline=fingerprint();update();$('collection-dialog').close();toast('歡迎回來，'+name+'！');
        };
        const actions=document.createElement('div');actions.className='card-actions';
        const rename=document.createElement('button');rename.textContent='改名字';rename.onclick=()=>showSave({kind:'rename',record});
        const duplicate=document.createElement('button');duplicate.textContent='複製';duplicate.onclick=async()=>{
          if(duplicate.disabled)return;duplicate.disabled=true;
          try{await store.save(record.config,Core.cleanName(record.name+'副本'));await refreshCollection();toast('已複製一個小角色。');}catch(e){$('collection-error').textContent=errorText(e);duplicate.disabled=false;}
        };
        const remove=document.createElement('button');remove.textContent='刪除';remove.onclick=async()=>{
          if(!await ask('和「'+record.name+'」說再見？','這個角色會從收藏冊移除。','刪除角色'))return;
          try{await store.remove(record);if(identity?.id===record.id){identity=null;baseline='';renderPreview();scheduleDraft();}await refreshCollection();toast('已從收藏冊移除。');}catch(e){$('collection-error').textContent=errorText(e);}
        };
        actions.append(rename,duplicate,remove);card.append(art,title,date,edit,actions);root.append(card);
      }
    } catch(e){$('collection-error').textContent=errorText(e);}
  }
  $('categories').innerHTML=C.categories.map(info=>`<button type="button" class="category-button" data-category="${info.id}" aria-label="${info.label}" aria-pressed="${info.id===category}">${R.icon(info.icon)}<span>${info.label}</span></button>`).join('');
  $('pattern-select').innerHTML=C.patterns.map(p=>`<option value="${p.id}">${p.label}</option>`).join('');
  $('categories').addEventListener('click',e=>{const button=e.target.closest('[data-category]');if(button)selectCategory(button.dataset.category);});
  $('part-tabs').addEventListener('click',e=>{const button=e.target.closest('[data-part]');if(!button)return;part=button.dataset.part;$('part-tabs').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderOptions();});
  $('options').addEventListener('click',e=>{const button=e.target.closest('[data-option]');if(!button)return;if(history.push(Core.choose(history.current,part,Number(button.dataset.option))))update();});
  $('color-swatches').addEventListener('click',e=>{const button=e.target.closest('[data-color]');if(!button)return;const c=Core.clone(history.current);c.colors[currentPalette()]=Number(button.dataset.color);if(history.push(c))update();});
  $('pattern-select').onchange=()=>{const c=Core.clone(history.current);c.patterns[part]=Number($('pattern-select').value);if(['top','bottom'].includes(part))c.outfit=0;if(history.push(c))update();};
  $('undo').onclick=()=>{if(history.undo())update();};$('redo').onclick=()=>{if(history.redo())update();};
  $('randomize').onclick=()=>{history.push(Core.randomize());update();toast('叮！一個新的靈感。');};
  $('new-character').onclick=async()=>{
    if(dirty()&&!await ask('開始一個新的小角色？','目前尚未存進收藏冊的造型會被替換，可以先回去取名存檔。','開始創作'))return;
    history.reset(C.defaults);identity=null;name='';baseline=fingerprint();selectCategory('hair');update();toast('新的紙張，新的想像。');
  };
  $('save-character').onclick=()=>showSave();$('save-form').onsubmit=e=>{e.preventDefault();saveCharacter(false);};$('save-copy').onclick=()=>saveCharacter(true);
  $('random-name').onclick=()=>{$('name-input').value=Core.randomName();$('name-error').textContent='';};
  $('name-input').addEventListener('input',()=>{
    const value=$('name-input').value,clean=Core.cleanName(value);
    if(Array.from(value).length>12&&clean!==value.trim()){$('name-input').value=clean;$('name-error').textContent='名字最多 12 個字，已保留前面的名字。';}else $('name-error').textContent='';
  });
  $('open-collection').onclick=async()=>{$('collection-dialog').showModal();await refreshCollection();};
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{if(!busy)$(b.dataset.close).close();});
  $('save-dialog').addEventListener('cancel',e=>{if(busy)e.preventDefault();});
  $('fullscreen').onclick=async()=>{
    try{if(window.AllieScreen){await AllieScreen.toggle();return;}if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('這個瀏覽器不支援全螢幕，仍可正常遊玩。');}catch(_){toast('這個瀏覽器暫時無法開啟全螢幕，仍可正常遊玩。');}
  };
  $('download').onclick=async()=>{
    const button=$('download');button.disabled=true;let url;
    try{
      const svg=R.draw(history.current).replace('viewBox="0 -35 360 680"','viewBox="0 -35 360 680" width="720" height="1360"');
      url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
      const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});
      const canvas=document.createElement('canvas');canvas.width=900;canvas.height=1500;const ctx=canvas.getContext('2d');
      ctx.fillStyle='#f8f3e5';ctx.fillRect(0,0,900,1500);
      let seed=42;for(let i=0;i<30000;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%900;seed=(seed*1664525+1013904223)>>>0;const y=seed%1500;ctx.fillStyle=i%2?'#ad91630c':'#ffffff35';ctx.fillRect(x,y,1.2,1.2);}
      ctx.strokeStyle='#ded3b9';ctx.lineWidth=2;ctx.strokeRect(35,35,830,1430);ctx.drawImage(image,90,40,720,1360);
      ctx.fillStyle='#706951';ctx.font='30px "Microsoft JhengHei",sans-serif';ctx.textAlign='center';ctx.fillText(name||'我的紙娃娃',450,1420,760);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('export');
      const png=URL.createObjectURL(blob),a=document.createElement('a');a.href=png;a.download=(name||'我的紙娃娃').replace(/[<>:"/\\|?*]/g,'_')+'.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(png),30000);toast('角色圖片已準備下載。');
    }catch(_){toast('這次無法下載圖片，請再試一次。');}finally{if(url)URL.revokeObjectURL(url);button.disabled=false;}
  };
  document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)history.redo();else history.undo();update();}});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){clearTimeout(draftTimer);writeDraft();}else if(ready)refreshCollection();});
  window.addEventListener('pagehide',()=>{clearTimeout(draftTimer);writeDraft();});
  baseline=fingerprint();selectCategory('hair');renderPreview();
  try{
    await store.open();ready=true;
    const draft=await store.draft();
    if(draft?.config){history.reset(draft.config);name=Core.cleanName(draft.name);identity=draft.identity&&typeof draft.identity.id==='string'&&Number.isInteger(draft.identity.revision)?{id:draft.identity.id,revision:draft.identity.revision}:null;baseline=typeof draft.baseline==='string'?draft.baseline:fingerprint();renderPreview();renderOptions();$('draft-status').textContent='♡ 歡迎回來，已打開上次的創作。';}
    await refreshCollection();
  }catch(e){
    ready=false;$('save-character').disabled=true;$('open-collection').disabled=true;
    storageWarning('這個瀏覽器目前無法保存角色。仍可自由搭配與下載圖片；若要存檔，請允許網站儲存資料後重新開啟。');
  }
})();
