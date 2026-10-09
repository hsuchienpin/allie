(function () {
  'use strict';
  const C = SliceCore, A = SliceArt, $ = id => document.getElementById(id);
  let storage; try { storage = window.localStorage; } catch (_) { storage = { getItem() { throw Error('Unavailable'); }, setItem() { throw Error('Unavailable'); } }; }
  const records = new C.Records(storage, matchMedia('(prefers-reduced-motion: reduce)').matches), settings = records.data.settings;
  let assets = null, renderer = null, game = null, ready = false, loading = false, starting = false, last = 0, pending = null, reveal = null;
  if(!records.data.rewardEpoch){records.data.rewardEpoch=Allie.session('slice');records.save();}
  Allie.bindPreferences(settings,syncSettings);
  const pointers = new Map(), sounds = ['slice','pop','progress','burst','chest','cheer'];
  let audio = null, audioReady = null, audioRaw = {}, audioBuffers = {}, lastAudio = -Infinity, hudEnergy = -1;
  const canVibrate = typeof navigator.vibrate === 'function';
  function savedNotice() { $('storage-notice').hidden = records.available; }
  function save() { records.save(); savedNotice(); }
  function savePreferences(){Allie.preferences({sound:settings.sound,reduced:settings.reduced}).catch(()=>{});}
  function announce(text) { $('announcement').textContent = text; }
  function syncSettings() {
    for (const b of document.querySelectorAll('[data-theme]')) b.setAttribute('aria-pressed', String(b.dataset.theme === settings.theme));
    for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === settings.mode));
    for (const k of ['sound','tap','vibration','reduced']) $(k + '-setting').checked = settings[k];
    $('sound-play').setAttribute('aria-pressed', String(settings.sound)); $('sound-play').textContent = settings.sound ? '♫' : '♪̸';
    $('sound-play').setAttribute('aria-label', settings.sound ? '關閉音效' : '開啟音效');
    $('sound-pause').textContent = settings.sound ? 'Sound: On' : 'Sound: Off';
  }
  $('vibration-setting').disabled = !canVibrate;
  if (!canVibrate) $('vibration-note').textContent = '這台裝置沒有網頁震動功能，仍然可以正常遊玩。';
  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image(), timer = setTimeout(() => { img.src = ''; reject(Error('Image timeout')); }, 15000);
      img.onload = () => { clearTimeout(timer); resolve(img); }; img.onerror = () => { clearTimeout(timer); reject(Error('Image unavailable')); }; img.src = Allie.url(url);
    });
  }
  async function loadSound(name) {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000);
    try { const response = await fetch(Allie.url('slice/assets/' + name + '.wav'), { signal: controller.signal }); if (!response.ok) throw Error('Audio unavailable'); audioRaw[name] = await response.arrayBuffer(); }
    finally { clearTimeout(timer); }
  }
  async function preload() {
    if (loading || ready) return; loading = true; $('retry').hidden = true; $('start').disabled = true;
    $('loading').textContent = '正在準備所有主題、貼紙與音效…';
    const images = Promise.all([loadImage('/assets/allie/stickers.webp'), loadImage('/slice/assets/stickers.png'), loadImage('/assets/allie/world.webp')]);
    const soundResults = Promise.allSettled(sounds.map(loadSound));
    try {
      const [atlas, stickers, forest] = await images; const results = await soundResults;
      assets = A.prepare(atlas, stickers); renderer = new A.Renderer($('game'), assets, forest);
      for (const b of document.querySelectorAll('[data-theme]')) renderer.theme(b.querySelector('canvas'), b.dataset.theme);
      ready = true; $('start').disabled = false; $('collection-menu').disabled = false; $('start').textContent = records.data.pending ? 'Open' : 'Play';
      $('loading').textContent = results.some(r => r.status === 'rejected') ? '圖片準備好了；部分音效未能載入，仍然可以玩。' : '準備好了！選個喜歡的主題，開始玩。';
    } catch (_) {
      await soundResults; $('loading').textContent = '圖片還沒準備好，請再試一次。'; $('retry').hidden = false; $('start').textContent = 'Loading…';
    } finally { loading = false; }
  }
  function unlockAudio() {
    if (audioReady) { if (audio && audio.state === 'suspended') audio.resume().catch(() => {}); return audioReady; }
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return Promise.resolve();
      audio = new Context(); audio.resume().catch(() => {});
      audioReady = Promise.all(sounds.map(async name => {
        if (!audioRaw[name]) return;
        try { audioBuffers[name] = await audio.decodeAudioData(audioRaw[name].slice(0)); } catch (_) { /* Silent fallback preserves play. */ }
      })); return audioReady;
    } catch (_) { return Promise.resolve(); }
  }
  function sound(name) {
    if (!settings.sound || !audio || audio.state !== 'running' || !audioBuffers[name]) return;
    const now = audio.currentTime;
    if (['slice','pop','progress'].includes(name) && now - lastAudio < .055) return;
    lastAudio = now;
    const src = audio.createBufferSource(), gain = audio.createGain(); src.buffer = audioBuffers[name]; gain.gain.value = name === 'cheer' ? .24 : .32;
    src.connect(gain); gain.connect(audio.destination); src.onended = () => { src.disconnect(); gain.disconnect(); }; src.start();
  }
  function feedback() { if (canVibrate && settings.vibration) { try { navigator.vibrate(12); } catch (_) {} } }
  function updateHUD() {
    if (!game) return;
    if (hudEnergy !== game.energy) { hudEnergy = game.energy; $('energy-fill').style.width = game.energy / C.TARGET * 100 + '%'; $('energy').setAttribute('aria-valuenow', String(game.energy)); }
    const rewarding = game.state === 'chest' || game.state === 'reveal';
    if ($('play-hint').hidden !== rewarding) $('play-hint').hidden = rewarding;
    if ($('pause').disabled !== rewarding) $('pause').disabled = rewarding;
    const hint = game.objects.some(o => o.type === 'balloon') ? '大氣球來啦！來回滑幾下！' : settings.tap ? '輕輕滑，點一下也可以！' : '輕輕滑，就切開！';
    if ($('play-hint').textContent !== hint) $('play-hint').textContent = hint;
  }
  function showChest() {
    delete $('open-chest').dataset.earned; pending = records.prepare(); savedNotice(); reveal = null; game.state = 'chest'; clearPointers();
    $('reward').hidden = false; $('reward-title').textContent = 'Great job!'; $('open-chest').disabled = false;
    $('open-chest').setAttribute('aria-label', '打開寶箱'); $('chest-instruction').hidden = false;
    $('reward-actions').hidden = true; $('sticker-name').hidden = true;
    announce('能量集滿了，按 Open 領取一張貼紙！'); $('open-chest').focus();
  }
  function events() {
    if (!game) return;
    for (const e of game.takeEvents()) {
      if (e.kind === 'slice') {
        records.slice(e.energy); savedNotice(); feedback();
        sound(e.balloon ? 'burst' : settings.theme === 'toys' ? 'cheer' : settings.theme === 'space' ? 'pop' : 'slice');
      } else if (e.kind === 'balloonHit') { sound('progress'); feedback(); }
      else if (e.kind === 'chest') { showChest(); sound('chest'); }
    }
    updateHUD();
  }
  async function start() {
    if (!ready || starting) return;
    starting = true; $('start').disabled = true;
    await unlockAudio();
    $('menu').hidden = true; $('play').hidden = false;document.body.classList.add('playing'); $('reward').hidden = true;
    renderer.resize(); orientation = innerWidth > innerHeight;
    game = new C.Game({ theme: settings.theme, mode: settings.mode, reduced: settings.reduced, energy: records.data.energy, width: renderer.w, height: renderer.h });
    renderer.clearTrails(); last = 0;
    if (records.data.pending) { game.energy = C.TARGET; showChest(); }
    else { records.start(); savedNotice(); $('game').focus(); announce('開始切切樂，輕輕滑動切開物品。'); }
    updateHUD(); $('start').disabled = false; starting = false;
  }
  function clearPointers() {
    for (const id of pointers.keys()) { if (game) game.release(id); try { $('game').releasePointerCapture(id); } catch (_) {} }
    pointers.clear(); if (renderer) renderer.clearTrails();
  }
  function pause(reason = '準備好了，再繼續切切樂。') {
    if (!game || game.state !== 'running' || $('play').hidden) return;
    game.pause(); clearPointers(); $('pause-reason').textContent = reason;
    if (audio) audio.suspend().catch(() => {});
    $('pause-dialog').showModal(); save();
  }
  function resume() {
    if (!game || game.state !== 'paused') return;
    $('pause-dialog').close(); clearPointers(); game.resume(); last = 0; unlockAudio(); $('game').focus();
  }
  function toMenu() {
    if ($('pause-dialog').open) $('pause-dialog').close(); clearPointers(); save();
    game = null; $('play').hidden = true;document.body.classList.remove('playing'); $('menu').hidden = false;
    $('start').textContent = records.data.pending ? 'Open' : 'Play'; $('start').focus();
  }
  function point(e) { const b = $('game').getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
  function move(e) {
    const p = pointers.get(e.pointerId); if (!p || !game || game.state !== 'running') return;
    const next = point(e); p.distance += Math.hypot(next.x - p.last.x, next.y - p.last.y);
    renderer.trail(p.last, next, performance.now() / 1000); game.swipe(p.last, next, e.pointerId); p.last = next; events();
  }
  $('game').addEventListener('pointerdown', e => {
    if (!game || game.state !== 'running' || e.button !== 0) return;
    e.preventDefault(); $('game').focus({ preventScroll: true });
    pointers.set(e.pointerId, { last: point(e), distance: 0 }); $('game').setPointerCapture(e.pointerId);
  });
  $('game').addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return; e.preventDefault();
    const samples = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    if (samples.length) for (const sample of samples) move(sample); else move(e);
  });
  $('game').addEventListener('pointerup', e => {
    const p = pointers.get(e.pointerId); if (!p || !game) return; move(e);
    if (settings.tap && p.distance < 12 && game.state === 'running') { const at = point(e); game.tap(at.x, at.y); renderer.trail({ x: at.x - 12, y: at.y + 10 }, { x: at.x + 12, y: at.y - 10 }, performance.now() / 1000); events(); }
    pointers.delete(e.pointerId); game.release(e.pointerId);
  });
  for (const name of ['pointercancel','lostpointercapture']) $('game').addEventListener(name, e => { pointers.delete(e.pointerId); if (game) game.release(e.pointerId); });
  $('game').addEventListener('contextmenu', e => e.preventDefault());
  $('game').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); pause(); return; }
    if (!['Enter',' '].includes(e.key) || e.repeat || !game || game.state !== 'running') return;
    e.preventDefault(); const o = game.objects.filter(o => o.y > 0 && o.y < game.height).sort((a, b) => b.y - a.y)[0];
    if (o) { game.tap(o.x, o.y); renderer.trail({ x: o.x - o.r, y: o.y + 6 }, { x: o.x + o.r, y: o.y - 6 }, performance.now() / 1000); events(); }
  });
  $('open-chest').addEventListener('click', async () => {
    if (!game || game.state !== 'chest' || !pending) return;
    $('open-chest').disabled=true;
    try { const earned=await Allie.reward(records.data.rewardEpoch+':'+pending.id,'slice'); reveal={fresh:true}; records.data.pending=null;save(); game.state='reveal';$('chest-instruction').hidden=true;$('reward-title').textContent='A new sticker!';$('sticker-name').hidden=true;$('reward-actions').hidden=false;
      const image=await Allie.sticker(earned.type),canvas=$('chest-art'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,(canvas.width-240)/2,0,240,240);$('open-chest').dataset.earned='true';
      const item=Allie.catalog.find(i=>i.id===earned.type);$('sticker-name').textContent=item.name+' · 已放進共用貼紙背包';$('sticker-name').hidden=false;sound('cheer');feedback();savedNotice();$('continue').focus();
    } catch(error) {$('open-chest').disabled=false;announce('貼紙未能保存，請再按 Open 試一次。');$('sticker-name').textContent=error.message;$('sticker-name').hidden=false;}

  });
  $('continue').addEventListener('click', () => {
    if (!game || game.state !== 'reveal') return;
    pending = null; reveal = null; $('reward').hidden = true; game.nextRound(); records.data.energy = 0; save(); last = 0; updateHUD(); $('game').focus();
  });
  function collection() { window.location.assign(Allie.url('stickers/')); }
  for (const b of document.querySelectorAll('[data-theme]')) b.addEventListener('click', () => { settings.theme = b.dataset.theme; syncSettings(); save(); });
  for (const b of document.querySelectorAll('[data-mode]')) b.addEventListener('click', () => { settings.mode = b.dataset.mode; settings.tap = settings.mode === 'gentle'; syncSettings(); save(); });
  for (const k of ['sound','tap','vibration','reduced']) $(k + '-setting').addEventListener('change', e => { settings[k] = e.target.checked; syncSettings(); save(); if(k==='sound'||k==='reduced')savePreferences(); });
  $('settings-open').addEventListener('click', () => { syncSettings(); $('settings').showModal(); });
  for (const id of ['settings-close','settings-done']) $(id).addEventListener('click', () => $('settings').close());
  for (const id of ['collection-menu','collection-reward']) $(id).addEventListener('click', collection);
  for (const id of ['collection-close','collection-done']) $(id).addEventListener('click', () => $('collection').close());
  for (const id of ['sound-play','sound-pause']) $(id).addEventListener('click', () => { settings.sound = !settings.sound; if (settings.sound) unlockAudio(); syncSettings(); save(); savePreferences(); });
  $('start').addEventListener('click', start); $('retry').addEventListener('click', preload);
  $('pause').addEventListener('click', () => pause()); $('resume').addEventListener('click', resume); $('back-menu').addEventListener('click', toMenu);
  $('pause-dialog').addEventListener('cancel', e => { e.preventDefault(); resume(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause('遊戲已自動暫停，回來再繼續。'); });
  window.addEventListener('blur', () => pause('畫面離開了，休息一下再繼續。'));
  window.addEventListener('pagehide', () => { if (game) clearPointers(); save(); });
  let orientation = innerWidth > innerHeight;
  function resize() {
    if (!renderer || !game || $('play').hidden) return;
    const changed = (innerWidth > innerHeight) !== orientation; orientation = innerWidth > innerHeight;
    if (changed) pause('畫面方向改變了，準備好再繼續。');
    clearPointers(); renderer.resize(); game.resize(renderer.w, renderer.h); renderer.draw(game, performance.now() / 1000);
  }
  window.addEventListener('resize', resize); new ResizeObserver(resize).observe($('game'));
  function frame(timestamp) {
    const now = timestamp / 1000;
    if (game && !$('play').hidden && renderer) {
      game.step(last ? Math.min(.05, now - last) : 0); events(); renderer.draw(game, now);
      if (!$('reward').hidden && !$('open-chest').dataset.earned) renderer.reward($('chest-art'), reveal ? reveal.sticker : null, now, settings.reduced);
    }
    last = now; requestAnimationFrame(frame);
  }
  syncSettings(); savedNotice(); preload(); requestAnimationFrame(frame);
})();
