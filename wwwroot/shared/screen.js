/* A persistent outer document keeps browser fullscreen across game navigation. */
(function () {
  'use strict';
  const base = new URL('../', document.currentScript.src);
  let host;
  try { if (parent !== window && parent.AllieScreen?.isHost) host = parent.AllieScreen; } catch (_) { /* Standalone embed. */ }
  if (host) {
    document.documentElement.classList.add('allie-framed');
    let homeHandler;
    window.AllieScreen = {
      isHost: false,
      isFull: host.isFull,
      enter: host.enter,
      toggle: host.toggle,
      navigate: host.navigate,
      onHome(handler) { homeHandler = handler; },
      home() { if (homeHandler) homeHandler(); else host.navigate(base.href); }
    };
    return;
  }
  document.documentElement.classList.add('allie-host');
  let frame, fullButton, notice, homeButton;
  const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function sync() {
    if (!fullButton) return;
    const active = isFull(), label = active ? 'Exit full screen' : 'Full screen';
    fullButton.setAttribute('aria-pressed', String(active));
    fullButton.setAttribute('aria-label', label);
    fullButton.querySelector('span:last-child').textContent = label;
    try { frame.contentWindow.dispatchEvent(new Event('allie-fullscreen-change')); } catch (_) {}
  }
  async function fullscreen(exit) {
    if (notice) notice.hidden = true;
    try {
      const target = exit ? document : document.documentElement;
      const action = exit ? document.exitFullscreen || document.webkitExitFullscreen : target.requestFullscreen || target.webkitRequestFullscreen;
      if (!action) throw Error('unsupported');
      await action.call(target);
    } catch (_) {
      if (notice) { notice.textContent = '這個瀏覽器暫時無法開啟全螢幕，仍可正常遊玩。可使用瀏覽器的全螢幕功能，或加入主畫面後開啟。'; notice.hidden = false; }
    }
    sync();
  }
  function navigate(path) {
    const target = new URL(path || base.href, base);
    if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname)) return;
    frame.src = target.href;
  }
  function home() {
    const screen = frame?.contentWindow.AllieScreen;
    if (screen && !screen.isHost) screen.home(); else navigate(base.href);
  }
  window.AllieScreen = { isHost: true, isFull, enter: () => isFull() ? Promise.resolve() : fullscreen(false), toggle: () => fullscreen(isFull()), navigate, home };
  for (const event of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(event, sync);
  document.addEventListener('DOMContentLoaded', () => {
    const initial = location.href;
    document.body.removeAttribute('data-allie');
    document.body.className = 'allie-screen-host';
    const bar = document.createElement('nav');
    bar.className = 'allie-screenbar'; bar.setAttribute('aria-label', 'Playground controls');
    homeButton = document.createElement('button'); homeButton.id = 'allie-home'; homeButton.type = 'button'; homeButton.setAttribute('aria-label', 'Home'); homeButton.innerHTML = '<span aria-hidden="true">⌂</span><span>Home</span>'; homeButton.onclick = home;
    const name = document.createElement('span'); name.className = 'allie-screen-name'; name.textContent = "Allie's Playground";
    fullButton = document.createElement('button'); fullButton.id = 'allie-fullscreen'; fullButton.type = 'button'; fullButton.innerHTML = '<span aria-hidden="true">⛶</span><span>Full screen</span>'; fullButton.onclick = window.AllieScreen.toggle;
    // Keep pointer clicks on the toolbar from stealing game keyboard focus.
    for (const button of [homeButton, fullButton]) button.addEventListener('pointerdown', event => event.preventDefault());
    bar.append(homeButton, name, fullButton);
    notice = document.createElement('p'); notice.id = 'allie-screen-notice'; notice.className = 'allie-screen-notice'; notice.hidden = true; notice.lang = 'zh-Hant'; notice.setAttribute('role', 'status');
    frame = document.createElement('iframe'); frame.id = 'allie-game'; frame.name = 'allie-game'; frame.title = "Allie's Playground game"; frame.allow = 'fullscreen; autoplay'; frame.allowFullscreen = true;
    frame.addEventListener('load', () => {
      try {
        const current = new URL(frame.contentWindow.location.href);
        if (current.origin === base.origin && current.pathname.startsWith(base.pathname)) {
          // Child navigation owns history. Reflect its route without another reload.
          history.replaceState(null, '', current.href);
          document.title = frame.contentDocument.title;
          frame.title = frame.contentDocument.title;
        }
      } catch (_) {}
      sync();
    });
    document.body.replaceChildren(bar, frame, notice);
    frame.src = initial;
    sync();
  });
})();
