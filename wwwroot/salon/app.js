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
    lipstick:'<g stroke="none" transform="rotate(24 12 12)"><path d="M9 12V4q0-5 6-3v11" fill="#bf657d"/><path d="M9 5l6-2v9H9" fill="#db8f9d"/><path d="M7.5 11h9v5h-9" fill="#dbbd91"/><rect x="7" y="15" width="10" height="8" rx="1.5" fill="#775760"/><path d="M9 17v4" stroke="#aa8890" stroke-width=".7"/></g>',
    eyeshadow:'<g stroke="none"><ellipse cx="11" cy="15" rx="10" ry="7" fill="#baa5bd"/><ellipse cx="11" cy="14" rx="8.5" ry="5.6" fill="#dec7d8"/><ellipse cx="11" cy="14" rx="6" ry="3.5" fill="#b58ab7"/><g transform="rotate(35 16 10)"><rect x="15" y="5" width="2.8" height="17" rx="1.4" fill="#a18a76"/><rect x="14.5" y="5" width="3.8" height="5" rx="1" fill="#d3bca4"/><ellipse cx="16.4" cy="4" rx="3.6" ry="5" fill="#9e798c"/></g></g>',
    scissors:'<g stroke-width="1.6"><path d="M10 12L3 2M14 12l7-10" stroke="#889d98"/><path d="M10 12l7 8M14 12l-7 8" stroke="#8da38c"/><ellipse cx="5" cy="19" rx="3" ry="4" stroke="#8da38c"/><ellipse cx="19" cy="19" rx="3" ry="4" stroke="#8da38c"/><circle cx="12" cy="11" r="1.5" fill="#d0b184" stroke="#d0b184"/></g>',
    dryer:'<g stroke="none" transform="rotate(-16 12 12)"><path d="M11 13l3 9q4 2 5-1l-3-10" fill="#d0a1a4"/><path d="M9 2C-3 2-3 14 9 14l11-3V5Z" fill="#be8c9a"/><rect x="19" y="4" width="4" height="8" rx="1" fill="#7c6974"/><path d="M4 5v6M7 5v6" stroke="#ead1ca" stroke-width=".8"/></g>'
  };
  document.querySelectorAll('[data-icon]').forEach(el => {
    el.outerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (el.className ? ' class="' + el.className + '"' : '') + '>' + (ICONS[el.dataset.icon] || '') + '</svg>';
  });
  const palettes = {
    lipstick: [['Rose','#bd5d78'],['Peach','#db8a76'],['Cherry','#ba354d'],['Berry','#974464'],['Coral','#de6a65'],['Petal','#d99ba5']],
    eyeshadow: [['Lilac','#ad83ba'],['Rose','#c18198'],['Sky','#789fbd'],['Sage','#8b9b76'],['Honey','#bd945d'],['Cocoa','#936c62']]
  };
  const STORAGE = 'allie-little-salon-v1';
  let state = C.fresh(), canSave = true;
  try {
    const saved = localStorage.getItem(STORAGE);
    if (saved) { try { state = C.normalize(JSON.parse(saved)); } catch (_) { state = C.fresh(); } }
  }
  catch (_) { canSave = false; $('storage-warning').hidden = false; }
  const renderer = new SalonRenderer.Renderer(canvas), history = new C.History(state);
  let tool = 'lipstick', pointer = null, gesture = null, dryerOn = false, stylingBefore = null, stylingMode = 'straight', motion = C.newMotion(), chips = [], frame = 0, lastTime = 0, saveTimer = 0;
  const selection = {lipstick: 0, eyeshadow: 0}, sizes = {lipstick: 20, eyeshadow: 32};
  renderer.rebuild(state);
  function status(message) { $('save-status').textContent = message; }
  function saveNow() {
    clearTimeout(saveTimer);
    if (!canSave) return;
    try { localStorage.setItem(STORAGE, JSON.stringify(history.current)); status('已保存在這個瀏覽器 ♡'); }
    catch (_) { canSave = false; $('storage-warning').hidden = false; status('可以用 Save photo 下載作品'); }
  }
  function updateHistory() { $('undo').disabled = !history.past.length; $('redo').disabled = !history.future.length; }
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
    if (tool === 'lipstick' || tool === 'eyeshadow') paintAt(p);
    if (tool === 'scissors') {
      const cut = C.cut(state, motion, p);
      for (const item of cut) chips.push({...item, age: 0, dx: 0, dy: 0});
      if (cut.length) { chips = chips.slice(-100); status('喀嚓！不喜歡可以按上一步'); }
    }
  }
  canvas.addEventListener('pointerdown', event => {
    if (gesture || event.button !== 0) return;
    event.preventDefault();
    if (tool === 'lipstick' || tool === 'eyeshadow') {
      if (state.strokes.length >= C.MAX_STROKES) { status('畫得好豐富！先卸妝或下載照片再繼續'); return; }
    }
    gesture = {id: event.pointerId, before: C.clone(state), last: point(event), added: false};
    if (tool === 'dryer') startStyling();
    if (tool === 'lipstick' || tool === 'eyeshadow') gesture.stroke = {
      tool, color: palettes[tool][selection[tool]][1], size: sizes[tool], mirror: tool === 'eyeshadow' && $('mirror-eyes').checked, points: []
    };
    canvas.setPointerCapture(event.pointerId); pointer = {...point(event), active: true}; applyAt(pointer); animate();
  });
  canvas.addEventListener('pointermove', event => {
    if (gesture && event.pointerId !== gesture.id) return;
    if (!gesture && event.pointerType !== 'mouse') return;
    pointer = point(event);
    if (gesture) {
      event.preventDefault();
      const positions = C.interpolate(gesture.last, pointer, tool === 'scissors' ? 5 : 2.5);
      for (const p of positions) applyAt(p);
      gesture.last = pointer;
    }
    if (gesture || dryerOn || chips.length) animate(); else render();
  });
  function finish(event) {
    if (!gesture || gesture.id !== event.pointerId) return;
    // pointerup can be the only move delivered by a fast touch gesture.
    const end = point(event);
    for (const p of C.interpolate(gesture.last, end, 3)) applyAt(p);
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
    const painting = next === 'lipstick' || next === 'eyeshadow';
    $('paint-options').hidden = !painting; $('hair-options').hidden = painting;
    $('mirror-option').hidden = next !== 'eyeshadow'; $('cut-note').hidden = next !== 'scissors'; $('wind-options').hidden = next !== 'dryer';
    const hints = {
      lipstick: '在嘴唇上慢慢塗。<br>顏色只會留在嘴唇裡。',
      eyeshadow: '在眼皮上輕輕刷，疊出喜歡的顏色。<br>勾選 Both eyes，兩邊會一起上色。',
      scissors: '沿著想要的長度，橫向滑過頭髮。<br>瀏海也可以剪短一點點。',
      dryer: '選造型，在想整理的髮束上按住。<br>放開會定型，Undo 可以復原。'
    };
    $('tool-hint').innerHTML = hints[next];
    if (painting) {
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
  document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => choose(b.dataset.tool));
  $('brush-size').oninput = () => { sizes[tool] = Number($('brush-size').value); $('size-value').value = sizes[tool]; render(); };
  $('mirror-eyes').onchange = () => render();
  $('wind-power').oninput = () => { $('wind-name').value = Number($('wind-power').value) < .8 ? 'Gentle' : Number($('wind-power').value) > 1.1 ? 'Whoosh!' : 'Breezy'; };
  $('dryer-toggle').onclick = () => {
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
  if (state.strokes.length || state.lengths.some(n => n < 1)) status('歡迎回來，接著玩吧 ♡');
})();
