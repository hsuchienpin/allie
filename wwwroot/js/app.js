/* All user images stay in this page. Network reads are limited to bundled assets. */
$(function () {
  'use strict';
  if (window.AllieScreen?.isHost) return;
  const W = 1024, H = 768;
  const bottom = document.getElementById('layer-bottom'), top = document.getElementById('layer-top');
  const ctx = bottom.getContext('2d', { willReadFrequently: true }), lineCtx = top.getContext('2d', { willReadFrequently: true });
  const preview = document.getElementById('import-preview'), previewCtx = preview.getContext('2d');
  const state = { color: '#d7839b', size: 20, material: 'pen', tool: 'fill', stamp: null, mask: new Uint8Array(W * H), history: [], future: [], dirty: false, busy: false, pointer: null, last: null, cardId: null, cards: [], stamps: [], imported: null, importResult: null, importSequence: 0, mode: 'generate', theme: '一隻可愛的獨角獸公主', palettePage: 0, exportUrl: null, exportBlob: null };
  const stickers = StudioStickers.create({bottom,top,state,toast,syncUndo,closeTools});
  const colors = [
    ['#ed786b','Red'],['#e65258','Berry'],['#d7839b','Rose'],['#efb3bd','Pink'],['#f2a267','Orange'],['#e9bc69','Honey'],['#f2d574','Yellow'],['#ebe19c','Cream'],['#d5df9c','Sprout'],
    ['#a7be88','Apple'],['#6f9c80','Forest'],['#7bb8ac','Mint'],['#77b9cc','Sky'],['#6094bb','Ocean'],['#7c8fab','Blue'],['#a397ba','Grape'],['#c6b3d0','Lilac'],['#c99d7f','Cookie'],
    ['#ab533e','Brick'],['#b63d5b','Berry'],['#cd668b','Pink'],['#f4c9b5','Peach'],['#d78738','Pumpkin'],['#c5a244','Gold'],['#f6e931','Lemon'],['#b0d658','Lime'],['#58824b','Grass'],
    ['#32735e','Pine'],['#267e83','Lake'],['#3f9fe0','Sky'],['#3e62a5','Blue'],['#66528c','Purple'],['#8e6494','Plum'],['#855d48','Brown'],['#343d3a','Black'],['#ffffff','White']
  ];
  const workerRequests = new Map(); let requestId = 0, worker = null;
  try {
    worker = new Worker(Allie.url('js/pixel-worker.js'));
    worker.onmessage = ({ data }) => { const pending = workerRequests.get(data.id); if (!pending) return; workerRequests.delete(data.id); clearTimeout(pending.timer); if (data.error) pending.reject(new Error(data.error)); else pending.resolve(data); };
    worker.onerror = () => { worker.terminate(); worker = null; for (const p of workerRequests.values()) { clearTimeout(p.timer); p.reject(new Error('圖片處理暫時失敗，請再試一次。')); } workerRequests.clear(); };
  } catch (_) { worker = null; }
  function pixels(type, data) {
    if (!worker) return new Promise((resolve, reject) => setTimeout(() => {
      try {
        const rgba = new Uint8ClampedArray(data.rgba);
        if (type === 'lineart') { const r = ColoringCore.binarize(rgba, W, H, data.threshold, data.repair); resolve({ rgba: r.rgba.buffer, mask: r.mask.buffer, difficulty: ColoringCore.estimateDifficulty(r.mask, W, H) }); }
        else resolve({ rgba: rgba.buffer, changed: ColoringCore.floodFill(rgba, new Uint8Array(data.mask), W, H, data.x, data.y, data.color) });
      } catch (e) { reject(e); }
    }, 30));
    return new Promise((resolve, reject) => {
      const id = ++requestId;
      const timer = setTimeout(() => { if (worker) worker.terminate(); worker = null; for (const p of workerRequests.values()) { clearTimeout(p.timer); p.reject(new Error('圖片處理逾時，請再試一次。')); } workerRequests.clear(); }, 30000);
      workerRequests.set(id, { resolve, reject, timer });
      try { const transfer = [data.rgba]; if (data.mask) transfer.push(data.mask); worker.postMessage({ ...data, type, id, width: W, height: H }, transfer); }
      catch (error) { clearTimeout(timer); workerRequests.delete(id); reject(error); }
    });
  }
  let toastTimer;
  function toast(message) { clearTimeout(toastTimer); $('#toast').text(message).prop('hidden', false); toastTimer = setTimeout(() => $('#toast').prop('hidden', true), 4500); }
  function busy(value) { state.busy = value; $('#tools button,#open-gallery,#free-draw').prop('disabled',value); $('#busy').prop('hidden', !value); syncUndo(); $('#use-import').prop('disabled', value || !state.importResult); }
  function available() { if (state.busy || stickers.busy) { toast('稍等一下，畫布正在準備中。'); return false; } return true; }
  function activate(container, button) { $(container).find('button').removeClass('active').attr('aria-pressed', 'false'); $(button).addClass('active').attr('aria-pressed', 'true'); }
  function snapshot() { state.history.push(stickers.snapshot()); if (state.history.length > 8) state.history.shift(); state.future=[]; syncUndo(); }
  function syncUndo() { $('#undo').prop('disabled', state.busy || !state.history.length); $('#redo').prop('disabled', state.busy || !state.future.length); }
  let focused = false, savedScroll = 0, returnToLeave = false;
  const drawer = document.getElementById('tool-drawer');
  function fitDrawing() {
    const surround=document.querySelector('.canvas-surround'),availableHeight=surround.clientHeight-36;
    const width=Math.max(120,Math.min(surround.clientWidth-30,availableHeight*W/H));
    document.getElementById('canvas-frame').style.width=width+'px';
  }
  function toolSummary(){ $('#focus-color').css('background-color',state.color);$('#focus-tool-name').text({pen:'Draw',fill:'Color',stamp:'Stamps',sticker:'Sticker'}[state.tool]);document.body.dataset.tool=state.tool; }
  function closeTools(){for(const id of ['tool-drawer','brush-drawer','stamp-drawer']){const d=document.getElementById(id);if(d.open)d.close();}$('#focus-tools').attr('aria-expanded','false');toolSummary();}
  async function enterDrawing(){if(!available()||focused)return;finishStroke();savedScroll=scrollY;focused=true;document.body.classList.add('drawing-focus');$('#focus-controls').prop('hidden',false);try{await AllieScreen.enter();}catch(_){}fitDrawing();}
  async function exitDrawing(){finishStroke();closeTools();focused=false;document.body.classList.remove('drawing-focus');$('#focus-controls').prop('hidden',true);window.scrollTo(0,savedScroll);fitDrawing();}
  $('#start-drawing,#fullscreen').on('click',enterDrawing);$('#focus-back').on('click',exitDrawing);
  $('#focus-tools').on('click',()=>{finishStroke();drawer.showModal();});$('#drawer-done').on('click',closeTools);
  $('#open-gallery').on('click',()=>{finishStroke();document.getElementById('paper-drawer').showModal();});
  $('#brush-open').on('click',()=>{finishStroke();document.getElementById('brush-drawer').showModal();});
  $('#studio-help').on('click',()=>document.getElementById('studio-help-dialog').showModal());
  drawer.addEventListener('close',toolSummary);
  window.addEventListener('resize',()=>{finishStroke();fitDrawing();});document.addEventListener('fullscreenchange',fitDrawing);
  new ResizeObserver(fitDrawing).observe(document.querySelector('.canvas-surround'));if(window.visualViewport)window.visualViewport.addEventListener('resize',fitDrawing);
  toolSummary();fitDrawing();
  $('.brand').on('click', e => { e.preventDefault(); if (focused) exitDrawing(); else window.scrollTo({ top: 0, behavior: 'smooth' }); });
  AllieScreen.onHome(()=>document.querySelector('.park-link').click());
  $('.park-link').on('click', e => {
    e.preventDefault(); finishStroke();
    if (state.busy) { toast('請等畫布準備好，再返回樂園。'); return; }
    if (state.dirty) document.getElementById('leave-dialog').showModal(); else window.location.assign(Allie.url(''));
  });
  $('#leave-save').on('click', () => { document.getElementById('leave-dialog').close(); returnToLeave = true; document.getElementById('export-dialog').showModal(); });
  $('#leave-yes').on('click', async () => {try{await stickers.flush();state.dirty=false;window.location.assign(Allie.url(''));}catch(e){toast(e.message);} });
  document.querySelectorAll('.allie-nav a').forEach(link=>link.addEventListener('click',async event=>{event.preventDefault();finishStroke();if(!available())return;try{await stickers.flush();window.location.assign(link.href);}catch(e){toast(e.message);}}));
  function confirmAction(title, message) {
    return new Promise(resolve => {
      const dialog = document.getElementById('confirm-dialog'); let accepted = false;
      $('#confirm-title').text(title); $('#confirm-message').text(message);
      $('#confirm-yes').off('click').one('click', () => { accepted = true; dialog.close(); });
      dialog.addEventListener('close', () => resolve(accepted), { once: true }); dialog.showModal();
    });
  }
  async function permitReplacement() { return !state.dirty || await confirmAction('New picture?' , '會先保存目前草稿，再開啟另一張圖。也可以先按 Save 下載作品。'); }
  $('[data-close]').on('click', function () { this.closest('dialog').close(); });
  $('dialog').on('click', function (e) { if (e.target !== this) return; const r = this.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) this.close(); });
  function image(url) { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('無法開啟這張圖片，請選擇其他圖片。')); img.src = Allie.url(url); }); }
  function rasterize(img) {
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const c = canvas.getContext('2d', { willReadFrequently: true }); c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
    const scale = Math.min(W / img.width, H / img.height), width = img.width * scale, height = img.height * scale;
    c.drawImage(img, (W - width) / 2, (H - height) / 2, width, height);
    return c.getImageData(0, 0, W, H).data;
  }
  function applyCard(result, title, id = null) {
    ctx.clearRect(0, 0, W, H); lineCtx.putImageData(new ImageData(new Uint8ClampedArray(result.rgba), W, H), 0, 0);
    state.mask = new Uint8Array(result.mask); state.history = []; state.future=[]; state.dirty = false; state.cardId = id;
    $('#card-title').text(title);
    $('.gallery-card').removeClass('selected').attr('aria-pressed', 'false'); if (id) $(`[data-card="${id}"]`).addClass('selected').attr('aria-pressed', 'true'); syncUndo();
  }
  async function loadCard(card, ask = true) {
    if (!available()) return;
    if (ask && !await permitReplacement()) return;
    if (ask) { try { await stickers.flush(); } catch(e) { toast(e.message); return; } }
    busy(true);
    try { const source = rasterize(await image(card.imagePath)); const result = await pixels('lineart', { rgba: source.buffer, threshold: 170, repair: false }); applyCard(result, card.name, card.id); await stickers.restore(card.id); document.getElementById('paper-drawer').close(); }
    catch (e) { toast(e.message); } finally { busy(false); }
  }
  function gallery() {
    const list = state.cards; $('#gallery').empty();
    for (const card of list) {
      const button = $('<button>', { class: 'gallery-card', 'data-card': card.id, 'aria-label': card.name, 'aria-pressed': String(state.cardId === card.id) });
      if (state.cardId === card.id) button.addClass('selected');
      button.append($('<img>', { src: Allie.url(card.imagePath), alt: '', decoding: 'async' }), $('<strong>').text(card.name));
      button.on('click', () => loadCard(card)); $('#gallery').append(button);
    }
    $('#gallery-count').text(`${list.length} pictures`);
  }
  function palette() {
    $('#palette').empty();
    const entries=colors.slice(state.palettePage*9,state.palettePage*9+9);
    $('#palette-page').prop('hidden',false);
    for (const [hex, name] of entries) {
      const button = $('<button>', { class: 'color-button', title: name, 'aria-label': name, 'aria-pressed': String(state.color === hex) }).css('background-color', hex);
      if (state.color === hex) button.addClass('active');
      button.on('click', () => { state.color = hex; $('#current-color').css('background-color', hex); $('#color-name').text(name); palette(); closeTools(); }); $('#palette').append(button);
    }
  }
  $('#palette-page').on('click', () => { state.palettePage = (state.palettePage + 1) % 4; palette(); });
  window.matchMedia('(min-width:1500px)').addEventListener('change', palette);
  $('#current-color').css('background-color', state.color); palette();
  $('#brush-size button').on('click', function () { state.size = Number(this.dataset.size); activate('#brush-size', this); });
  $('#brush-material button').on('click', function () { state.material = this.dataset.material; activate('#brush-material', this); });
  $('#tools button').on('click', function () {
    if(!available())return;
    state.tool = this.dataset.tool; activate('#tools', this); $('#canvas-frame').removeClass('fill stamp').addClass(state.tool);
    $('#stamp-picker').prop('hidden', state.tool !== 'stamp'); stickers.setTool();
    $('#drawing-hint').text({ pen: '用喜歡的顏色，把想像力畫出來！', fill: '點一下封閉的區塊，變出繽紛顏色。', stamp: '挑個小印章，點一下畫布！', sticker: '選貼紙，再點畫布放上。每張只能貼一次。' }[state.tool]);
    toolSummary();closeTools();if(state.tool==='sticker')drawer.showModal();if(state.tool==='stamp')document.getElementById('stamp-drawer').showModal();
  });
  function position(e) { const r = bottom.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
  function paintSegment(a, b) {
    ctx.save(); ctx.strokeStyle = state.color; ctx.fillStyle = state.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = state.size;
    if (state.material === 'pen') {
      if (a.x === b.x && a.y === b.y) { ctx.beginPath(); ctx.arc(a.x, a.y, state.size / 2, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    } else {
      const width = state.material === 'pencil' ? state.size * .55 : state.size, distance = Math.hypot(b.x - a.x, b.y - a.y);
      const steps = Math.min(1200, Math.max(1, Math.ceil(distance / 2)));
      for (let s = 0; s <= steps; s++) for (let n = 0; n < Math.max(8, width * 1.2); n++) {
        const t = s / steps, angle = Math.random() * Math.PI * 2, radius = Math.sqrt(Math.random()) * width / 2;
        ctx.globalAlpha = .15 + Math.random() * .5; ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * t + Math.cos(angle) * radius, a.y + (b.y - a.y) * t + Math.sin(angle) * radius, .45 + Math.random() * .9, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
  function finishStroke(e) { if (state.pointer === null || e && e.pointerId !== undefined && e.pointerId !== state.pointer) return; if (bottom.hasPointerCapture(state.pointer)) bottom.releasePointerCapture(state.pointer); state.pointer = null; state.last = null; stickers.scheduleSave(); }
  bottom.addEventListener('pointerdown', async e => {
    if (e.button !== 0 || state.busy || stickers.busy || state.pointer !== null) return;
    e.preventDefault(); const p = position(e);
    if (state.tool === 'pen') { snapshot(); state.dirty = true; state.pointer = e.pointerId; state.last = p; bottom.setPointerCapture(e.pointerId); paintSegment(p, p); }
    else if (state.tool === 'stamp') {
      if (!state.stamp) { toast('印章還在準備中，稍等一下。'); return; }
      snapshot(); const stamp = document.createElement('canvas'); const size = 72 + state.size * 2; stamp.width = size; stamp.height = size;
      const sc = stamp.getContext('2d'); sc.drawImage(state.stamp, 4, 4, size - 8, size - 8); sc.globalCompositeOperation = 'source-in'; sc.fillStyle = state.color; sc.fillRect(0, 0, size, size);
      ctx.drawImage(stamp, p.x - size / 2, p.y - size / 2); state.dirty = true; stickers.scheduleSave();
    } else {
      const before = ctx.getImageData(0, 0, W, H), historyBefore=stickers.snapshot(); busy(true);
      try {
        const result = await pixels('fill', { rgba: before.data.slice().buffer, mask: state.mask.slice().buffer, x: p.x, y: p.y, color: ColoringCore.hexToRgb(state.color) });
        if (result.changed) { state.history.push(historyBefore); if (state.history.length > 8) state.history.shift(); state.future=[]; ctx.putImageData(new ImageData(new Uint8ClampedArray(result.rgba), W, H), 0, 0); state.dirty = true; stickers.scheduleSave(); }
      } catch (err) { toast(err.message); } finally { busy(false); }
    }
  });
  bottom.addEventListener('pointermove', e => {
    if (e.pointerId !== state.pointer || !state.last) return; e.preventDefault();
    const samples = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const sample of samples.length ? samples : [e]) { const p = position(sample); paintSegment(state.last, p); state.last = p; }
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(name => bottom.addEventListener(name, finishStroke)); window.addEventListener('blur', () => finishStroke());
  async function historyStep(redo){if(!available())return;const from=redo?state.future:state.history,to=redo?state.history:state.future;if(!from.length)return;finishStroke();busy(true);const before=stickers.snapshot(),item=from[from.length-1];if(await stickers.undo(item)){from.pop();to.push(before);state.dirty=true;}busy(false);syncUndo();}
  $('#undo').on('click',()=>historyStep(false));$('#redo').on('click',()=>historyStep(true));
  $('#clear').on('click', async () => { if (!available() || !state.dirty) return; if (await confirmAction('Clear colors?' , '黑色線稿會留下。清除後也可以按 Undo 找回顏色。')) { snapshot(); ctx.clearRect(0, 0, W, H); state.dirty = true; stickers.scheduleSave(); } });
  $('#free-draw').on('click', async () => { if (!available() || !await permitReplacement()) return; try { await stickers.flush(); } catch(e) { toast(e.message); return; } applyCard({ rgba: new Uint8ClampedArray(W * H * 4).buffer, mask: new Uint8Array(W * H).buffer }, 'Free Draw'); await stickers.restore('free'); document.getElementById('paper-drawer').close(); });
  function chooseFile() { if (available()) {document.getElementById('paper-drawer').close();document.getElementById('file-input').click();} }
  $('#open-image').on('click', chooseFile);
  $('#magic-import').on('click', () => { document.getElementById('magic-dialog').close(); chooseFile(); });
  async function updatePreview() {
    if (!state.imported) return; const sequence = ++state.importSequence;
    state.importResult = null; $('#use-import').prop('disabled', true);
    const threshold = Number($('#threshold').val()); $('#threshold-value').text(threshold);
    try {
      const result = await pixels('lineart', { rgba: state.imported.slice().buffer, threshold, repair: $('#repair-gaps').prop('checked') });
      if (sequence !== state.importSequence || !state.imported) return;
      state.importResult = result; previewCtx.clearRect(0,0,W,H); previewCtx.putImageData(new ImageData(new Uint8ClampedArray(result.rgba), W, H), 0, 0);
      $('#use-import').prop('disabled', false);
    } catch (e) { if (sequence === state.importSequence) toast(e.message); }
  }
  let previewTimer;
  $('#threshold').on('input', () => { $('#threshold-value').text($('#threshold').val()); state.importSequence++; state.importResult = null; $('#use-import').prop('disabled', true); clearTimeout(previewTimer); previewTimer = setTimeout(() => updatePreview(), 180); });
  $('#repair-gaps').on('change', () => { clearTimeout(previewTimer); updatePreview(); });
  $('#file-input').on('change', async function () {
    const file = this.files[0]; this.value = ''; if (!file || !available()) return; busy(true); let url;
    try {
      if (file.size > 12 * 1024 * 1024) throw new Error('圖片太大了，請選擇小於 12 MB 的圖片。');
      const bytes = await file.arrayBuffer(), info = ImageFile.inspect(bytes); url = URL.createObjectURL(new Blob([bytes], { type: info.type }));
      const img = await image(url); if (img.naturalWidth * img.naturalHeight > 24000000) throw new Error('圖片尺寸太大，請先縮小圖片。');
      state.imported = rasterize(img); state.importResult = null; $('#threshold').val(170); $('#repair-gaps').prop('checked', true);
      document.getElementById('import-dialog').showModal(); await updatePreview();
    } catch (e) { toast(e.message); } finally { if (url) URL.revokeObjectURL(url); busy(false); }
  });
  document.getElementById('import-dialog').addEventListener('close', () => { clearTimeout(previewTimer); state.importSequence++; });
  $('#use-import').on('click', async () => {
    if (!available() || !state.importResult) return;
    const result = state.importResult; document.getElementById('import-dialog').close();
    if (!await permitReplacement()) { document.getElementById('import-dialog').showModal(); return; }
    try { await stickers.flush(); } catch(e) {toast(e.message); return;} applyCard(result, 'My Picture'); await stickers.restore('import:'+crypto.randomUUID()); state.imported = null; state.importResult = null; enterDrawing(); toast('準備好了，來幫它加上顏色吧！');
  });
  const themes = [['🦄','Unicorn','一隻可愛的獨角獸'],['👑','Princess','一位原創獨角獸公主'],['🪼','Jellyfish','一隻微笑水母'],['🐧','Penguin','一隻可愛企鵝'],['🛝','Playground','戶外遊樂場'],['🍦','Ice Cream','霜淇淋與水果冰棒'],['🎈','Balloons','各式造型氣球'],['🍭','Candy','造型棉花糖與造型雞蛋糕']];
  themes.forEach(([emoji, name, topic], i) => { const button = $('<button>', { class: i === 0 ? 'active' : '', 'aria-pressed': String(i === 0) }).text(`${emoji} ${name}`); button.on('click', () => { state.theme = topic; $('#custom-topic').val(''); activate('#themes', button); prompt(); }); $('#themes').append(button); });
  function prompt() {
    const topic = String($('#custom-topic').val()).trim() || state.theme;
    const first = state.mode === 'photo' ? '請將我在這個 AI 平台提供的照片，重新繪製成適合 2～8 歲兒童的可愛卡通著色線稿。保留主要主體，簡化背景；不要直接把照片轉成灰階。' : `請畫一張適合 2～8 歲兒童的卡通著色線稿，主題是「${topic}」。`;
    $('#prompt-output').val(`${first}\n以單一可愛主體為主，約 15～25 個寬闊封閉區塊，適合 6 歲孩子用手指點選著色。用粗黑線，保留有意義的結構細節，避免微小、細長區域與重複裝飾。\n畫面採橫向 4:3 構圖，主體完整並保留邊界留白。純白背景、清晰純黑線條、封閉輪廓；不要填黑大面積區塊，不要彩色、陰影、灰階、漸層、文字、簽名或浮水印。內容必須溫和、可愛、適合幼兒，不要暴力或令人害怕的元素。\n請輸出可下載的靜態 PNG 或 JPG 圖片檔案，建議 1024×768 像素。`);
    $('#photo-note').prop('hidden', state.mode !== 'photo'); $('#themes,.text-label:has(#custom-topic)').prop('hidden', state.mode === 'photo');
  }
  $('#prompt-mode button').on('click', function () { state.mode = this.dataset.mode; activate('#prompt-mode', this); prompt(); });
  $('#custom-topic').on('input', prompt);
  $('#magic').on('click', () => { document.getElementById('paper-drawer').close(); prompt(); document.getElementById('magic-dialog').showModal(); });
  $('#copy-prompt').on('click', async () => {
    const output = document.getElementById('prompt-output');
    try { if (!navigator.clipboard || !window.isSecureContext) throw new Error(); await navigator.clipboard.writeText(output.value); toast('提示詞已複製！交給你自己的 AI 產生圖片吧。'); }
    catch (_) { output.focus(); output.select(); toast('請長按或按 Ctrl+C 複製選取的提示詞。'); }
  });
  $('#save').on('click', () => { if (available()) { closeTools(); document.getElementById('export-dialog').showModal(); } });
  $('.export-format').on('click', async function () {
    if (!available()) return;
    const type = this.dataset.format, canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const c = canvas.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0,0,W,H); c.drawImage(bottom,0,0); c.drawImage(top,0,0); await stickers.exportTo(c);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, type, .94)); if (!blob) { toast('圖片儲存失敗，請再試一次。'); return; }
    if (state.exportUrl) URL.revokeObjectURL(state.exportUrl); state.exportBlob = blob; state.exportUrl = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = state.exportUrl; a.download = `my_drawing.${type === 'image/png' ? 'png' : 'jpg'}`; document.body.append(a); a.click(); a.remove();
    $('#export-preview').attr('src', state.exportUrl).prop('hidden', false); $('#export-help').prop('hidden', false);
    const file = new File([blob], a.download, { type: blob.type }); $('#share-image').prop('hidden', !navigator.canShare || !navigator.canShare({ files: [file] }));
    toast('作品準備好了！若沒有下載，可以長按預覽圖片儲存。');
  });
  $('#share-image').on('click', async () => { if (!state.exportBlob) return; const file = new File([state.exportBlob], `my_drawing.${state.exportBlob.type === 'image/png' ? 'png' : 'jpg'}`, { type: state.exportBlob.type }); try { await navigator.share({ files: [file], title: '我的小小作品' }); } catch (e) { if (e.name !== 'AbortError') toast('無法分享，可以長按預覽圖片儲存。'); } });
  document.getElementById('export-dialog').addEventListener('close', () => { if (state.exportUrl) URL.revokeObjectURL(state.exportUrl); state.exportUrl = null; state.exportBlob = null; $('#export-preview').removeAttr('src').prop('hidden', true); $('#export-help,#share-image').prop('hidden', true); if (returnToLeave) { returnToLeave = false; document.getElementById('leave-dialog').showModal(); } });
  window.addEventListener('beforeunload', e => { if (state.dirty && !window.indexedDB) { e.preventDefault(); e.returnValue = ''; } });
  busy(true);
  Promise.all([$.getJSON(Allie.url('gallery.json')), $.getJSON(Allie.url('stamps.json'))]).then(async ([cards, stamps]) => {
    state.cards = cards; gallery();
    for (const stamp of stamps) {
      try {
        const img = await image(stamp.path); state.stamps.push(img); if (!state.stamp) state.stamp = img;
        const button = $('<button>', { 'aria-label': stamp.name, 'aria-pressed': String(state.stamps.length === 1), class: state.stamps.length === 1 ? 'active' : '' }).append($('<img>', { src: Allie.url(stamp.path), alt: '' }));
        button.on('click', () => { state.stamp = img; activate('#stamp-picker', button); closeTools(); }); $('#stamp-picker').append(button);
      } catch (_) { toast('部分印章無法載入，其他工具仍可使用。'); }
    }
    const last=await Allie.lastDraft().catch(()=>null), listed=cards.find(c=>c.id===last);
    // Older papers remain restorable from their saved pixels when removed from the picker.
    if(last&&!listed&&await Allie.getDraft(last).catch(()=>null)){try{await stickers.restore(last);}finally{busy(false);}}else {busy(false);await loadCard(listed||cards[0],false);}
    const requested=new URLSearchParams(location.search).get('sticker');if(requested)await stickers.choose(requested);fitDrawing();
  }).catch(() => {busy(false);toast('圖庫暫時無法載入，可以先在空白畫布畫畫。');});
});
