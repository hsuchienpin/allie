(function () {
  'use strict';
  if (window.AllieScreen?.isHost) return;
  const C = RunnerCore, A = RunnerArt, $ = id => document.getElementById(id);
  let storage;
  try { storage = window.localStorage; } catch (_) { storage = { getItem() { throw Error('Storage unavailable'); }, setItem() { throw Error('Storage unavailable'); } }; }
  const records = new C.Records(storage), controls = new C.Controls();
  let taskId=null;
  let selected = records.data.vehicle, game = null, mode = 'menu', last = 0, accumulator = 0, countdown = 3, hudAge = 0;
  let announcementTime = 0, toastTimer = 0, audio = null, lastSound = 0, saved = false;
  const renderer = new A.Renderer($('game')), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const portraitCanvases=new Map(); $('start').disabled=true;
  function portrait(ctx,id,x,y,height){A.vehicle(ctx,id,x,y,height/100);}
  A.ready.then(()=>{for(const [id,canvas]of portraitCanvases){const ctx=canvas.getContext('2d');ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,170,100);portrait(ctx,id,85,50,100);}$('start').disabled=false;}).catch(()=>{toast('部分圖片未能載入，請重新整理再試一次。');});
  function toast(text) { clearTimeout(toastTimer); $('toast').textContent = text; $('toast').hidden = false; toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3500); }
  function show(id) { for (const screen of ['selection', 'play', 'result']) $(screen).hidden = screen !== id; document.body.classList.toggle('playing', id === 'play'); }
  function clearControls() { controls.clear(); syncButtons(); }
  function syncButtons() { document.querySelectorAll('[data-action]').forEach(b => { const held = [...controls.sources.values()].includes(b.dataset.action); b.classList.toggle('held', held); b.setAttribute('aria-pressed', String(held)); }); }
  function storageNotice() {
    const text = !records.available ? '這個瀏覽器目前無法保存紀錄，仍可以遊玩；關閉後成績可能會消失。' : records.corrupt ? '舊紀錄無法讀取，已改用新的本機紀錄。' : '';
    $('storage-notice').hidden = !text; $('storage-notice').textContent = text;
    $('result-storage').textContent = records.available ? '紀錄保存在這台裝置' : '這次成績暫存在頁面中，關閉後可能會消失';
  }
  function soundUI() { for (const id of ['sound-menu', 'sound-pause']) { $(id).textContent = `Sound: ${records.data.sound ? 'On' : 'Off'}`; $(id).setAttribute('aria-pressed', String(records.data.sound)); } }
  function enableAudio() {
    if (!records.data.sound) return;
    try { const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return; audio ||= new Audio(); const promise = audio.resume(); if (promise) promise.catch(() => {}); }
    catch (_) { toast('這台裝置暫時無法播放音效，遊戲仍可以繼續。'); }
  }
  function tone(event) {
    if (!records.data.sound || !audio || audio.state !== 'running') return;
    const now = audio.currentTime; if (now - lastSound < .065) return; lastSound = now;
    const notes = { coin: [880, 1175, .09], star: [660, 1320, .25], hit: [180, 90, .19], armor: [330, 220, .16], end: [392, 196, .35], scene: [523, 784, .23] }; if (!notes[event]) return;
    try { const [from, to, duration] = notes[event], oscillator = audio.createOscillator(), gain = audio.createGain(); oscillator.type = event === 'hit' ? 'triangle' : 'sine'; oscillator.frequency.setValueAtTime(from, now); oscillator.frequency.exponentialRampToValueAtTime(to, now + duration); gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.09, now + .015); gain.gain.exponentialRampToValueAtTime(.0001, now + duration); oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(now); oscillator.stop(now + duration + .03); oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); }; } catch (_) {}
  }
  for (const id of ['sound-menu', 'sound-pause']) $(id).addEventListener('click', () => { records.data.sound = !records.data.sound; records.save(); Allie.preferences({sound:records.data.sound}).catch(()=>{}); soundUI(); storageNotice(); enableAudio(); });
  function choose(id) {
    selected = id; records.data.vehicle = id;
    document.querySelectorAll('.vehicle').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.vehicle === id)));
    $('vehicle-detail').textContent = C.VEHICLES[id].hint + (id === 'car' ? ' · 裝甲抵擋第一次撞擊' : '');
    $('menu-best').textContent = `Best: ${(records.data.best[id]?.score || 0).toLocaleString()}`;
  }
  for (const [id, spec] of Object.entries(C.VEHICLES)) {
    const button = document.createElement('button'); button.className = 'vehicle'; button.dataset.vehicle = id; button.type = 'button'; button.setAttribute('aria-label', `${spec.name}，${spec.hint}`); button.setAttribute('aria-pressed', 'false');
    const art = document.createElement('canvas'); art.width = 340; art.height = 200; art.setAttribute('aria-hidden', 'true'); const ctx = art.getContext('2d'); ctx.scale(2, 2); A.vehicle(ctx, id, 85, 49, id === 'car' ? .97 : 1.15); portraitCanvases.set(id, art);
    const name = document.createElement('strong'); name.textContent = spec.name; const note = document.createElement('small'); note.textContent = { runner: '靈活閃避', bicycle: '平穩好上手', motorcycle: '快速加速', car: '一次防撞裝甲' }[id];
    button.append(art, name, note); button.addEventListener('click', () => choose(id)); $('vehicles').append(button);
  }
  function updateHUD() {
    if (!game) return;
    $('goal-fill').style.width=Math.min(100,game.elapsed/30*100)+'%';$('goal-time').textContent=Math.min(30,Math.floor(game.elapsed))+' / 30';$('goal').setAttribute('aria-valuenow',String(Math.min(30,Math.floor(game.elapsed))));$('finish-run').hidden=game.elapsed<30;
    $('score').textContent = game.score.toLocaleString(); $('distance').textContent = Math.floor(game.distance).toLocaleString();
    $('lives').textContent = '♥'.repeat(game.lives) + '♡'.repeat(3 - game.lives); $('lives').setAttribute('aria-label', `${game.lives} 顆生命`); $('scene').textContent = C.SCENES[game.sceneIndex].name;
    const effect = game.invincible > 0 ? `Shield ${Math.ceil(game.invincible)}s` : game.armor > 0 ? 'Shield' : game.hurt > 0 ? 'Safe' : '';
    $('power').textContent = effect; $('power').hidden = !effect; $('speed-label').textContent = { boost: 'Fast', brake: 'Slow', normal: 'Go!' }[controls.read().speed];
  }
  function announce(text, seconds = 2.1) { $('announcement').textContent = text; $('announcement').hidden = false; announcementTime = seconds; }
  function begin() {
    clearControls(); saved = false; records.data.vehicle = selected; records.save(); storageNotice(); enableAudio(); if ($('pause-dialog').open) $('pause-dialog').close();
    taskId=Allie.session('runner'); const oldReward=document.querySelector('#result .allie-reward'); if(oldReward)oldReward.remove(); game = new C.Game(selected); mode = 'countdown'; countdown = 3; accumulator = 0; last = 0; announcementTime = 0; $('announcement').hidden = true;
    show('play'); renderer.resize(); renderer.draw(game, (reduced.matches||records.data.reduced)); updateHUD(); $('countdown').hidden = false; $('countdown').textContent = '3';
  }
  function pause(reason = '準備好再繼續冒險。') {
    if (!['running', 'countdown'].includes(mode)) return;
    mode = 'paused'; clearControls(); accumulator = 0; $('countdown').hidden = true; $('pause-reason').textContent = reason; if (!$('pause-dialog').open) $('pause-dialog').showModal();
  }
  function resume() {
    if (mode !== 'paused' || document.hidden) return;
    $('pause-dialog').close(); enableAudio(); clearControls(); mode = 'countdown'; countdown = 3; last = 0; accumulator = 0; $('countdown').hidden = false; $('countdown').textContent = '3';
  }
  function finish() {
    if (!game || saved) return; saved = true; mode = 'result'; clearControls(); if ($('pause-dialog').open) $('pause-dialog').close();
    const isBest = records.finish(game.status); storageNotice(); $('result-score').textContent = game.score.toLocaleString(); $('result-distance').textContent = `${Math.floor(game.distance).toLocaleString()} m`;
    $('result-best').textContent = records.data.best[game.vehicleId].score.toLocaleString(); $('best-label').textContent = `${game.vehicle.name}: Best`; $('result-subtitle').textContent = isBest ? '新紀錄！你又比上次更進步了。' : '每一次出發，都是新的冒險。';
    const canvas = $('result-art'), ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); A.star(ctx, 35, 35, 16); A.star(ctx, 168, 54, 20); portrait(ctx, game.vehicleId, 100, 78, 150);
    show('result'); if(game.elapsed>=30) Allie.award($('result'),taskId,'runner'); else {const note=document.createElement('p');note.className='allie-reward';note.textContent='再玩久一點吧！累積 30 秒有效遊玩，結算就能得到一張貼紙。';$('result').append(note);} $('result-title').setAttribute('tabindex', '-1'); $('result-title').focus({ preventScroll: true });
  }
  $('finish-run').addEventListener('click',()=>{if(game?.elapsed>=30)finish();});
  $('start').addEventListener('click', begin); $('restart').addEventListener('click', begin); $('pause').addEventListener('click', () => pause()); $('resume').addEventListener('click', resume); $('quit').addEventListener('click', finish);
  $('pause-dialog').addEventListener('cancel', e => { e.preventDefault(); resume(); }); $('change-vehicle').addEventListener('click', () => { mode = 'menu'; show('selection'); choose(selected); $('start').focus({ preventScroll: true }); });
  document.querySelectorAll('[data-action]').forEach(button => {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('pointerdown', event => { if (mode !== 'running' || event.button !== 0) return; event.preventDefault(); controls.hold(`p:${event.pointerId}`, button.dataset.action); try { button.setPointerCapture(event.pointerId); } catch (_) {} syncButtons(); });
    const release = event => { controls.release(`p:${event.pointerId}`); syncButtons(); }; for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, release);
    button.addEventListener('contextmenu', event => event.preventDefault());
  });
  window.addEventListener('pointerup', event => { controls.release(`p:${event.pointerId}`); syncButtons(); });
  const keys = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'boost', ArrowDown: 'brake', a: 'left', d: 'right', w: 'boost', s: 'brake' };
  window.addEventListener('keydown', event => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
    if (mode === 'running' && keys[event.key]) { event.preventDefault(); controls.hold(`k:${event.key}`, keys[event.key]); syncButtons(); }
    if (['running', 'countdown'].includes(mode) && (event.code === 'Space' || event.key === 'Escape') && !event.repeat) { event.preventDefault(); pause(); }
  });
  window.addEventListener('keyup', event => { if (keys[event.key]) { controls.release(`k:${event.key}`); syncButtons(); } });
  window.addEventListener('blur', () => pause('畫面已離開遊戲，按「繼續前進」再出發。')); document.addEventListener('visibilitychange', () => { if (document.hidden) pause('遊戲已自動暫停，回來後再繼續。'); }); window.addEventListener('pagehide', () => pause());
  let orientation = innerWidth > innerHeight; window.addEventListener('resize', () => { const now = innerWidth > innerHeight; if (now !== orientation) { orientation = now; pause('畫面方向已改變，確認按鍵位置後再繼續。'); } renderer.resize(); if (game) renderer.draw(game, (reduced.matches||records.data.reduced)); });
  new ResizeObserver(() => { renderer.resize(); if (game) renderer.draw(game, (reduced.matches||records.data.reduced)); }).observe($('game'));
  function renderHistory() {
    $('best-list').replaceChildren(); $('history-list').replaceChildren();
    for (const [id, spec] of Object.entries(C.VEHICLES)) { const row = document.createElement('div'); row.className = 'best-row'; const name = document.createElement('strong'); name.textContent = spec.name; const value = document.createElement('span'); const best = records.data.best[id]; value.textContent = best ? `${best.score.toLocaleString()} points · ${best.distance.toLocaleString()} m` : '還沒出發'; row.append(name, value); $('best-list').append(row); }
    if (!records.data.history.length) { const item = document.createElement('li'); item.textContent = '第一次冒險，從現在開始！'; $('history-list').append(item); }
    for (const entry of records.data.history) { const li = document.createElement('li'), date = document.createElement('small'); li.textContent = `${C.VEHICLES[entry.vehicle].name} · ${entry.score.toLocaleString()} points · ${entry.distance.toLocaleString()} m`; date.textContent = new Date(entry.date).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }); li.append(date); $('history-list').append(li); }
    $('clear-history').disabled = !records.data.history.length && !Object.keys(records.data.best).length;
  }
  $('open-history').addEventListener('click', () => { renderHistory(); $('history-dialog').showModal(); }); $('close-history').addEventListener('click', () => $('history-dialog').close()); $('clear-history').addEventListener('click', () => $('reset-dialog').showModal()); $('cancel-reset').addEventListener('click', () => $('reset-dialog').close());
  $('confirm-reset').addEventListener('click', () => { records.reset(); records.corrupt = false; renderHistory(); choose(selected); storageNotice(); $('reset-dialog').close(); toast(records.available ? '冒險紀錄已清除。' : '頁面中的紀錄已清除，但瀏覽器無法保存這次變更。'); });
  function frame(timestamp) {
    const dt = last ? Math.min(.1, Math.max(0, (timestamp - last) / 1000)) : 0; last = timestamp;
    if (mode === 'countdown') { countdown -= dt; $('countdown').textContent = String(Math.max(1, Math.ceil(countdown))); if (countdown <= 0) { mode = 'running'; $('countdown').hidden = true; accumulator = 0; clearControls(); } }
    else if (mode === 'running') {
      accumulator += dt; while (accumulator >= 1 / 60 && mode === 'running') { game.step(1 / 60, controls.read()); accumulator -= 1 / 60; for (const event of game.events) { tone(event); if (event === 'scene') announce(C.SCENES[game.sceneIndex].name); else if (event === 'armor') announce('Safe!', 1.2); else if (event === 'star') announce('Star!', 1.2); else if (event === 'end') { finish(); break; } } }
      announcementTime -= dt; if (announcementTime <= 0) $('announcement').hidden = true;
    }
    if (['running', 'countdown'].includes(mode)) { renderer.draw(game, (reduced.matches||records.data.reduced)); hudAge += dt; if (hudAge >= .1 || mode === 'countdown') { updateHUD(); hudAge = 0; } } requestAnimationFrame(frame);
  }

  Allie.bindPreferences(records.data,soundUI); choose(selected); soundUI(); storageNotice(); requestAnimationFrame(frame);
})();
