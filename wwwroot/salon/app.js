(function () {
  'use strict';
  if (window.AllieScreen?.isHost) return;
  const C = SalonCore, $ = id => document.getElementById(id), canvas = $('portrait');
  const ICONS = {
    camera:'<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M8 6l2-3h4l2 3"/><circle cx="12" cy="13" r="4"/>',
    undo:'<path d="M8 5L3 10l5 5M3 10h10a7 7 0 0 1 0 14" transform="translate(0 -3)"/>',
    redo:'<path d="M16 5l5 5-5 5M21 10h-10a7 7 0 0 0 0 14" transform="translate(0 -3)"/>',
    reset:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
    droplet:'<path d="M12 3C10 7 5 11 5 15a7 7 0 0 0 14 0c0-4-5-8-7-12Z"/><path d="M8 15q0 4 4 4"/>',
    spark:'<path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4M18 4h4"/>',
    hand:'<path d="M9 12V4a2 2 0 0 1 4 0v7-3a2 2 0 0 1 4 0v4-2a2 2 0 0 1 4 0v6q0 7-8 7-4 0-6-4l-4-6a2 2 0 0 1 3-2l3 3"/>',
    lipstick:'<g stroke="none" transform="rotate(24 12 12)"><path d="M9 11V4Q9 0 15 1V11Z" fill="#ce7b9b"/><path d="M9 4l6-2v2l-6 3" fill="#efa9bd"/><rect x="7.5" y="10" width="9" height="5" rx="1" fill="#e3c282"/><rect x="7" y="14" width="10" height="9" rx="2" fill="#a179ae"/><path d="M8 16h8M9 18v3" stroke="#e7c5d9" stroke-width=".7"/><path d="M11 19l1-1 1 1-1 1Z" fill="#e8c98c"/></g>',
    eyeshadow:'<g stroke="none"><ellipse cx="10" cy="15" rx="9" ry="7" fill="#d7b574"/><ellipse cx="10" cy="14" rx="8" ry="5.5" fill="#f4e2b9"/><ellipse cx="10" cy="14" rx="6.4" ry="3.7" fill="#bf9bcc"/><path d="M7 12l2 1-1 2" fill="#dcc2e5"/><g transform="rotate(30 17 10)"><rect x="15.5" y="5" width="3" height="17" rx="1.5" fill="#a880b5"/><rect x="14.8" y="5" width="4.4" height="5" rx="1" fill="#e5c689"/><ellipse cx="17" cy="4" rx="3.8" ry="4.5" fill="#d5a4c2"/></g></g>',
    scissors:'<g stroke-width="1.7"><path d="M10 12L3 2M14 12l7-10" stroke="#a2a6bc"/><path d="M10 12l7 8M14 12l-7 8" stroke="#b990bb"/><ellipse cx="5" cy="19" rx="3" ry="4" stroke="#b990bb" fill="#f5e6f5"/><ellipse cx="19" cy="19" rx="3" ry="4" stroke="#b990bb" fill="#f5e6f5"/><circle cx="12" cy="11" r="1.8" fill="#e8c687" stroke="#ca9d60"/><path d="M5 4l4 6M19 4l-4 6" stroke="#edf0f8" stroke-width=".7"/></g>',
    dryer:'<g stroke="none" transform="rotate(-16 12 12)"><path d="M11 13l3 9q4 2 5-1l-3-10" fill="#c9a5d6"/><path d="M9 2C-3 2-3 14 9 14l11-3V5Z" fill="#b895ce"/><rect x="19" y="4" width="4" height="8" rx="1" fill="#d7b678"/><path d="M4 5v6M7 5v6" stroke="#f6e9f8" stroke-width=".8"/></g>',
    eyeliner:'<g transform="rotate(35 12 12)" stroke="none"><path d="M10 6L12 0L14 6Z" fill="#594463"/><rect x="9.5" y="6" width="5" height="16" rx="1" fill="#a280b4"/><path d="M9.5 10h5" stroke="#e4c17e" stroke-width="2"/><path d="M11 13v6" stroke="#e7cdec"/></g>',
    blush:'<g stroke="none"><ellipse cx="9" cy="18" rx="8" ry="5" fill="#d8b478"/><ellipse cx="9" cy="17" rx="6" ry="3.4" fill="#e89eb7"/><g transform="rotate(20 17 10)"><rect x="15" y="8" width="4" height="15" rx="2" fill="#a981b4"/><rect x="14" y="7" width="6" height="5" rx="1" fill="#e5c180"/><path d="M14 8C4-3 28-3 20 8Z" fill="#dfa0bb"/><path d="M12 4q5-5 10 0" stroke="#f6cadd"/></g></g>',
    dye:'<path d="M7 10h10l2 12H5ZM9 3h6v7H9Z" fill="#c6a1d6"/><path d="M9 15h6M12 12v6" stroke="#fff6ef"/><path d="M8 3h8" stroke="#d7b678" stroke-width="3"/>',
    accessories:'<path d="M3 18L1 6l6 5 5-9 5 9 6-5-2 12Q12 22 3 18Z" fill="#f0d493" stroke="#c39954"/><path d="M12 8l3 5-3 4-3-4Z" fill="#bc8aca" stroke="#a278ad"/><path d="M5 17q7 3 14 0" stroke="#fff5d6"/>'
  };
  document.querySelectorAll('[data-icon]').forEach(el => {
    el.outerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (el.className ? ' class="' + el.className + '"' : '') + '>' + (ICONS[el.dataset.icon] || '') + '</svg>';
  });
  const palettes = {
    lipstick: [['玫瑰','#bd5d78'],['蜜桃','#db8a76'],['櫻桃','#ba354d'],['莓果','#974464'],['珊瑚','#de6a65'],['花瓣','#d99ba5']],
    eyeshadow: [['紫藤','#ad83ba'],['玫瑰','#c18198'],['天空','#789fbd'],['鼠尾草','#8b9b76'],['香檳','#bd945d'],['可可','#936c62']],
    eyeliner: [['黑莓','#443449'],['可可','#755044'],['梅紫','#89568d'],['海藍','#426b91'],['森林','#496e65'],['玫瑰金','#a77b4e']],
    blush: [['玫瑰','#e0809b'],['蜜桃','#ebaa90'],['珊瑚','#e58173'],['櫻花','#edacc1'],['莓果','#be6b91'],['杏桃','#e4a064']]
  };
  const STORAGE = 'allie-little-salon-v1';
  let state = C.fresh(), canSave = true;
  try {
    const saved = localStorage.getItem(STORAGE);
    if (saved) { try { state = C.normalize(JSON.parse(saved)); } catch (_) { state = C.fresh(); } }
  }
  catch (_) { canSave = false; $('storage-warning').hidden = false; }
  const renderer = new SalonRenderer.Renderer(canvas), history = new C.History(state);
  let tool = 'accessories', pointer = null, gesture = null, dryerOn = false, stylingBefore = null, stylingMode = 'straight', motion = C.newMotion(), chips = [], frame = 0, lastTime = 0, saveTimer = 0;
  const selection = {lipstick: 0, eyeshadow: 0, eyeliner: 0, blush: 0}, sizes = {lipstick: 20, eyeshadow: 32, eyeliner: 8, blush: 48};
  let accessorySlot = 'head', assetsReady = !window.SalonHair;
  if (window.SalonHair) {
    $('asset-status').hidden = false; $('photo').disabled = true;
    SalonHair.ready.then(() => { assetsReady = true; $('asset-status').hidden = true; $('photo').disabled = false; render(); }).catch(() => {
      $('asset-message').textContent = '公主圖片尚未載入，請檢查連線後重試。'; $('asset-retry').hidden = false;
    });
    $('asset-retry').onclick = () => location.reload();
  }
  renderer.rebuild(state);
  function status(message) { $('save-status').textContent = message; }
  function saveNow() {
    clearTimeout(saveTimer);
    if (!canSave) return;
    try { localStorage.setItem(STORAGE, JSON.stringify(history.current)); status('已保存在這個瀏覽器 ♡'); }
    catch (_) { canSave = false; $('storage-warning').hidden = false; status('可以用 Save photo 下載作品'); }
  }
  function updateHistory() { $('undo').disabled = !history.past.length; $('redo').disabled = !history.future.length; syncAccessories(); syncDye(); }
  function commit() {
    if (!history.push(state)) return false;
    updateHistory(); status('好可愛，繼續創作吧 ♡'); clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 450);
    return true;
  }
  function render(time = performance.now()) {
    renderer.render(state, motion, {tool, pointer, size: sizes[tool], mirror: $('mirror-eyes').checked, chips, time});
  }
  function tick(time) {
    frame = 0;
    const dt = lastTime ? Math.min((time - lastTime) / 1000, .035) : 1 / 60; lastTime = time;
    const wind = tool === 'dryer' && (gesture || dryerOn) ? {...pointer, power: Number($('wind-power').value), mode: stylingMode} : null;
    if (wind) C.styleAt(state, motion, wind, dt);
    const moving = C.advance(state, motion, wind, dt);
    chips = chips.filter(p => p.age < 1.2);
    for (const p of chips) { p.age += dt; p.dy += (80 + p.age * 270) * dt; p.dx += p.strand.side * 32 * dt; }
    render(time);
    if (wind || moving || chips.length) frame = requestAnimationFrame(tick); else lastTime = 0;
  }
  function animate() { if (!frame) frame = requestAnimationFrame(tick); }
  function startStyling() {
    if (!stylingBefore) stylingBefore = C.clone(state);
    status('慢慢吹整，放開就會保留造型 ♡');
  }
  function stopDryer(keep = true) {
    const before = stylingBefore; stylingBefore = null;
    dryerOn = false; $('dryer-toggle').setAttribute('aria-pressed', 'false'); $('dryer-label').textContent = 'Turn on · 持續造型';
    if (pointer) pointer.active = !!gesture;
    if (!before) return;
    if (!keep) { state = before; renderer.rebuild(state); chips = []; }
    else if (commit()) status('造型已定型，Undo 可以復原 ♡');
    else status('把吹風機移近想整理的髮束，再吹一吹');
  }
  function cancel() {
    const old = gesture; gesture = null;
    stopDryer(!(old && tool === 'dryer'));
    if (!old) return;
    if (old.before && tool !== 'dryer') { state = old.before; renderer.rebuild(state); chips = []; }
    if (canvas.hasPointerCapture(old.id)) canvas.releasePointerCapture(old.id);
    pointer = null; animate();
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect(), view = C.view(tool);
    return {x: ((event.clientX - rect.left) * C.W / rect.width - view.x) / view.scale,
      y: ((event.clientY - rect.top) * C.H / rect.height - view.y) / view.scale, active: !!gesture || dryerOn};
  }
  function paintAt(p) {
    const s = gesture.stroke;
    if (s.points.length >= 2500) return;
    // Empty strokes don't consume history; dragging across a face still catches the lip edge.
    if (!renderer.touches(tool, p.x, p.y, s.size / 2)) return;
    if (!gesture.added) { state.strokes.push(s); gesture.added = true; }
    s.points.push([Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10]); renderer.dab(s, p.x, p.y);
  }
  function applyAt(p) {
    if (C.isPaint(tool)) paintAt(p);
    if (tool === 'scissors') {
      const cut = C.cut(state, motion, p);
      for (const item of cut) chips.push({...item, age: 0, dx: 0, dy: 0});
      if (cut.length) { chips = chips.slice(-100); status('喀嚓！不喜歡可以按上一步'); }
    }
  }
  canvas.addEventListener('pointerdown', event => {
    if (!assetsReady || gesture || event.button !== 0 || ['accessories','dye'].includes(tool)) return;
    event.preventDefault();
    if (C.isPaint(tool)) {
      if (state.strokes.length >= C.MAX_STROKES) { status('畫得好豐富！先卸妝或下載照片再繼續'); return; }
    }
    gesture = {id: event.pointerId, before: C.clone(state), last: point(event), added: false};
    if (tool === 'dryer') startStyling();
    if (C.isPaint(tool)) gesture.stroke = {
      tool, color: palettes[tool][selection[tool]][1], size: sizes[tool], mirror: tool !== 'lipstick' && $('mirror-eyes').checked, points: []
    };
    canvas.setPointerCapture(event.pointerId); pointer = {...point(event), active: true}; applyAt(pointer); animate();
  });
  canvas.addEventListener('pointermove', event => {
    if (!assetsReady || ['accessories','dye'].includes(tool)) return;
    if (gesture && event.pointerId !== gesture.id) return;
    if (!gesture && event.pointerType !== 'mouse') return;
    pointer = point(event);
    if (gesture) {
      event.preventDefault();
      const positions = C.interpolate(gesture.last, pointer, tool === 'scissors' ? 5 : C.isPaint(tool) ? Math.min(2.5,sizes[tool]/3) : 3);
      for (const p of positions) applyAt(p);
      gesture.last = pointer;
    }
    if (gesture || dryerOn || chips.length) animate(); else render();
  });
  function finish(event) {
    if (!gesture || gesture.id !== event.pointerId) return;
    // pointerup can be the only move delivered by a fast touch gesture.
    const end = point(event);
    for (const p of C.interpolate(gesture.last, end, C.isPaint(tool) ? Math.min(2.5,sizes[tool]/3) : 3)) applyAt(p);
    const id = gesture.id; gesture = null; pointer = event.pointerType === 'mouse' || dryerOn ? {...end, active: dryerOn} : null;
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    if (tool === 'dryer') { if (!dryerOn) stopDryer(); }
    else commit();
    animate();
  }
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', event => { if (!gesture || event.pointerId === gesture.id) cancel(); });
  canvas.addEventListener('lostpointercapture', () => { if (gesture) cancel(); });
  canvas.addEventListener('pointerleave', () => { if (!gesture && !dryerOn) { pointer = null; render(); } });
  window.addEventListener('blur', cancel);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancel(); saveNow(); } });
  window.addEventListener('pagehide', () => { cancel(); saveNow(); });
  function choose(next) {
    cancel(); tool = next; pointer = null;
    document.body.dataset.tool = next;
    document.querySelectorAll('[data-tool]').forEach(b => { const yes = b.dataset.tool === next; b.classList.toggle('selected', yes); b.setAttribute('aria-pressed', String(yes)); });
    const painting = C.isPaint(next);
    $('paint-options').hidden = !painting; $('hair-options').hidden = !['scissors','dryer'].includes(next);
    $('accessory-options').hidden = next !== 'accessories';
    $('dye-options').hidden = next !== 'dye';
    $('mirror-option').hidden = !painting || next === 'lipstick'; $('cut-note').hidden = next !== 'scissors'; $('wind-options').hidden = next !== 'dryer';
    $('mirror-caption').textContent = next === 'blush' ? '兩頰一起畫' : '兩眼一起畫';
    const hints = {
      lipstick: '在嘴唇上慢慢塗，顏色只會留在嘴唇裡。<br>換個顏色，也能疊出自己的妝容。',
      eyeshadow: '在眼皮上輕輕畫，試試夢幻的眼影。<br>勾選「兩眼一起畫」，兩邊就能同步。',
      eyeliner: '沿著上眼皮慢慢描畫，也能畫出翹翹的眼尾。<br>可以調整筆刷大小。',
      blush: '在兩頰畫小圈圈，慢慢疊上紅潤的顏色。<br>取消「兩頰一起畫」就能分開畫。',
      accessories: '點選就能戴上，不同類別可以一起搭配。<br>選「不戴」可取下，也能按上一步復原。',
      scissors: '在兩側長髮或瀏海上滑動剪刀。<br>剪短了也能按上一步，或恢復長髮。',
      dryer: '選造型，在想整理的髮束上按住。<br>放開會定型，上一步可以復原。',
      dye: '點選髮色，就能幫整頭秀髮換顏色。<br>保留剪髮與吹整造型，也能復原。'
    };
    $('tool-hint').innerHTML = hints[next];
    if (painting) {
      const range = C.brushRange(next); $('brush-size').min = range[0]; $('brush-size').max = range[1];
      $('brush-size').value = sizes[next]; $('size-value').value = sizes[next];
      $('colors').replaceChildren(...palettes[next].map(([name, color], i) => {
        const b = document.createElement('button'); b.className = 'swatch'; b.style.setProperty('--swatch', color); b.type = 'button';
        b.setAttribute('aria-label', name); b.title = name; b.setAttribute('aria-pressed', String(selection[next] === i));
        b.onclick = () => { selection[next] = i; choose(next); }; return b;
      }));
      $('color-name').textContent = palettes[next][selection[next]][0];
    }
    render();
  }
  function syncDye() {
    document.querySelectorAll('[data-dye]').forEach(b => b.setAttribute('aria-pressed',String(state.hairColor === b.dataset.dye)));
    $('hair-color-name').textContent = C.hairColors.find(c=>c[0]===state.hairColor)[1];
    $('restore-color').disabled = state.hairColor === 'gold';
  }
  function dye(id) { cancel(); state.hairColor=id; commit(); syncDye(); render(); }
  $('hair-colors').replaceChildren(...C.hairColors.map(([id,label,color])=>{
    const b=document.createElement('button');b.type='button';b.className='dye-choice';b.dataset.dye=id;
    b.style.setProperty('--swatch',color);b.innerHTML='<i aria-hidden="true"></i><span>'+label+'</span>';
    b.setAttribute('aria-label',label);b.onclick=()=>dye(id);return b;
  }));
  $('restore-color').onclick=()=>dye('gold');
  function syncAccessories() {
    document.querySelectorAll('[data-accessory]').forEach(b => b.setAttribute('aria-pressed',String(state.accessories[accessorySlot] === b.dataset.accessory)));
    const current = C.accessories[accessorySlot].find(([id])=>id === state.accessories[accessorySlot]);
    $('accessory-name').textContent = current[1];
  }
  function showAccessories(slot) {
    accessorySlot = slot;
    document.querySelectorAll('[data-slot]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.slot === slot)));
    $('accessory-choices').replaceChildren(...C.accessories[slot].map(([id,label])=>{
      const b = document.createElement('button'); b.type='button'; b.className='accessory-choice'; b.dataset.accessory=id;
      b.innerHTML=SalonArt.svg(id)+'<span>'+label+'</span>';
      b.onclick=()=>{cancel();state.accessories[slot]=id;commit();syncAccessories();render();};return b;
    }));
    syncAccessories();
  }
  document.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>showAccessories(b.dataset.slot));
  $('remove-accessories').onclick=()=>replace({...C.clone(state),accessories:{head:'none',clip:'none',ears:'none',neck:'none'}});
  showAccessories(accessorySlot);
  document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => choose(b.dataset.tool));
  $('brush-size').oninput = () => { sizes[tool] = Number($('brush-size').value); $('size-value').value = sizes[tool]; render(); };
  $('mirror-eyes').onchange = () => render();
  $('wind-power').oninput = () => { $('wind-name').value = Number($('wind-power').value) < .8 ? 'Gentle' : Number($('wind-power').value) > 1.1 ? 'Whoosh!' : 'Breezy'; };
  $('dryer-toggle').onclick = () => {
    if (!assetsReady) return;
    if (dryerOn) stopDryer();
    else { startStyling(); dryerOn = true; }
    $('dryer-toggle').setAttribute('aria-pressed', String(dryerOn)); $('dryer-label').textContent = dryerOn ? 'Finish · 完成定型' : 'Turn on · 持續造型';
    if (dryerOn && !pointer) pointer = {x: 100, y: 390, active: true};
    if (pointer) pointer.active = dryerOn; animate();
  };
  document.querySelectorAll('[data-style]').forEach(button => button.onclick = () => {
    cancel(); stylingMode = button.dataset.style; pointer = null;
    document.querySelectorAll('[data-style]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    $('style-name').textContent = button.dataset.label;
    status('在想整理的髮束上按住吹，放開就會定型'); render();
  });
  function replace(next) { cancel(); state = next; motion = C.newMotion(); chips = []; pointer = null; renderer.rebuild(state); commit(); render(); }
  $('undo').onclick = () => { cancel(); if (history.undo()) { state = C.clone(history.current); renderer.rebuild(state); motion = C.newMotion(); chips = []; pointer = null; updateHistory(); saveNow(); render(); } };
  $('redo').onclick = () => { cancel(); if (history.redo()) { state = C.clone(history.current); renderer.rebuild(state); motion = C.newMotion(); chips = []; pointer = null; updateHistory(); saveNow(); render(); } };
  $('wash').onclick = () => replace({...C.clone(state), strokes: []});
  $('regrow').onclick = () => replace({...C.clone(state), lengths: C.fresh().lengths, styles: C.fresh().styles});
  $('reset-style').onclick = () => replace({...C.clone(state), styles: C.fresh().styles});
  $('reset').onclick = () => { replace(C.fresh()); status('全新的一天！上一步仍能回到剛才的造型'); };
  $('photo').onclick = () => {
    if (!assetsReady) return;
    cancel();
    const photo = document.createElement('canvas'); photo.width = 1200; photo.height = 1440;
    const art = new SalonRenderer.Renderer(photo); art.rebuild(state); art.render(state, C.newMotion(), {tool: 'photo'});
    try {
      // A self-contained image also supports saving from tablet browsers and embedded previews.
      const photoUrl = photo.toDataURL('image/png'); $('photo-preview').src = photoUrl; $('download-photo').href = photoUrl;
      $('photo-dialog').showModal(); status('照片準備好了 ♡');
    } catch (_) { status('照片暫時無法產生，請再試一次'); }
  };
  $('photo-close').onclick = () => $('photo-dialog').close();
  $('photo-dialog').addEventListener('close', () => {
    $('photo-preview').removeAttribute('src'); $('download-photo').removeAttribute('href');
  });
  const stage = document.querySelector('.mirror-stage'), wrap = document.querySelector('.canvas-wrap');
  new ResizeObserver(() => {
    const css = getComputedStyle(stage), availableW = stage.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight),
      availableH = stage.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom),
      width = Math.max(1, Math.min(availableW, availableH * 5 / 6));
    cancel(); wrap.style.width = width + 'px'; wrap.style.height = width * 6 / 5 + 'px'; render();
  }).observe(stage);
  window.AllieScreen?.onHome(() => { cancel(); saveNow(); window.AllieScreen.navigate(new URL('../', location.href).href); });
  // No input is serialized while a gesture is incomplete; interrupted touches roll back.
  choose(tool); updateHistory();
  if (state.strokes.length || state.lengths.some(n => n < 1) || state.styles.some(s=>s.straight || s.curl || s.volume)) status('歡迎回來，接著玩吧 ♡');
})();
