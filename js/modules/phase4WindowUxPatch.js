(() => {
  const FLAG = '__phase4WindowUxPatchInstalled';
  if (window[FLAG]) return;
  window[FLAG] = true;

  const TAB_SELECTOR = [
    '.dashboard-sidebar button',
    '.dashboard-dock button',
    '.dashboard-nav button',
    '.dashboard-tab-button',
    '[data-window-tab]',
    '[data-panel-tab]',
    '[data-dashboard-tab]'
  ].join(',');

  const WINDOW_SELECTOR = [
    '.dashboard-window',
    '.floating-window',
    '.dashboard-floating-window',
    '[data-window-id]',
    '[data-dashboard-window]'
  ].join(',');

  const TITLE_SELECTOR = [
    '.dashboard-window-title',
    '.floating-window-title',
    '.window-title',
    '[data-window-title]',
    '.dashboard-window-header',
    '.floating-window-header',
    '.window-header'
  ].join(',');

  const KEYWORDS = {
    profile: ['profile', 'artist card', 'profile card', 'artist mode'],
    lyrics: ['lyrics', 'lyric', 'karaoke'],
    intro: ['intro', 'artist profile canvas', 'neon artist shell'],
    creative: ['creative', 'creative box', 'background visual scene'],
    clock: ['focusclock', 'clock', 'pomodoro', 'module 05'],
    music: ['module 04', 'module 4', 'music', 'player', 'neon player', 'audio']
  };

  function normalize(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9à-ỹ\s_-]/gi, '');
  }

  function textOf(el) {
    return normalize(el?.innerText || el?.textContent || '');
  }

  function isVisible(el) {
    if (!el) return false;
    if (el.hidden) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
  }

  function getTabKey(tab) {
    return normalize(
      tab?.dataset.windowTab ||
      tab?.dataset.panelTab ||
      tab?.dataset.dashboardTab ||
      tab?.dataset.windowId ||
      tab?.dataset.panelId ||
      tab?.getAttribute('aria-controls') ||
      tab?.getAttribute('data-target') ||
      textOf(tab)
    );
  }

  function getWindowKey(win) {
    const title = win?.querySelector(TITLE_SELECTOR);
    return normalize(
      win?.dataset.windowId ||
      win?.dataset.panelId ||
      win?.dataset.dashboardWindow ||
      win?.dataset.legacyPanel ||
      win?.id ||
      title?.textContent ||
      textOf(win)
    );
  }

  function allTabs() {
    return Array.from(document.querySelectorAll(TAB_SELECTOR));
  }

  function allWindows() {
    return Array.from(document.querySelectorAll(WINDOW_SELECTOR));
  }

  function keyMatches(ruleName, haystack) {
    return (KEYWORDS[ruleName] || []).some((keyword) => haystack.includes(normalize(keyword)));
  }

  function classifyWindow(win) {
    const key = getWindowKey(win);
    if (keyMatches('lyrics', key)) return 'lyrics';
    if (keyMatches('profile', key)) return 'profile';
    if (keyMatches('clock', key)) return 'clock';
    if (keyMatches('music', key)) return 'music';
    if (keyMatches('creative', key)) return 'creative';
    if (keyMatches('intro', key)) return 'intro';
    return '';
  }

  function findWindowForTab(tab) {
    const key = getTabKey(tab);
    const wins = allWindows();
    if (!key) return null;

    const directId = tab.getAttribute('aria-controls');
    if (directId) {
      const direct = document.getElementById(directId);
      if (direct) return direct;
    }

    let exact = wins.find((win) => getWindowKey(win) === key);
    if (exact) return exact;

    let fuzzy = wins.find((win) => {
      const winKey = getWindowKey(win);
      return winKey.includes(key) || key.includes(winKey);
    });
    if (fuzzy) return fuzzy;

    return wins.find((win) => {
      const role = classifyWindow(win);
      return role && keyMatches(role, key);
    }) || null;
  }

  function setTabActive(tab, active) {
    if (!tab) return;
    tab.classList.toggle('is-active', !!active);
    tab.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  function zIndexFront(win) {
    const current = Number(document.documentElement.dataset.phase4Z || 220);
    const next = current + 1;
    document.documentElement.dataset.phase4Z = String(next);
    win.style.zIndex = String(next);
  }

  function closeWindow(win) {
    if (!win) return;
    const closeButton = win.querySelector('[data-window-close], .dashboard-window-close, .floating-window-close, .window-close, [aria-label*="close" i], [title*="close" i]');
    if (closeButton) {
      closeButton.click();
    } else {
      win.hidden = true;
      win.style.display = 'none';
      win.classList.remove('is-active', 'is-open');
      win.setAttribute('aria-hidden', 'true');
    }
  }

  function showWindow(win) {
    if (!win) return;
    win.hidden = false;
    win.style.display = '';
    win.classList.add('is-active', 'is-open');
    win.removeAttribute('aria-hidden');
    zIndexFront(win);
    maybePlaceWindow(win, true);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function viewportRect(type) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rects = {
      profile: { left: 170, top: 274, width: 210, height: 200 },
      lyrics: { left: 470, top: 24, width: clamp(vw - 940, 700, 860), height: 330 },
      intro: { left: 410, top: Math.max(460, vh - 340), width: 260, height: 250 },
      creative: { left: 655, top: Math.max(470, vh - 330), width: 160, height: 160 },
      clock: { left: vw - 235 - 40, top: 146, width: 235, height: 220 },
      music: { left: vw - 285 - 40, top: Math.max(400, vh - 330), width: 285, height: 290 }
    };

    const base = rects[type];
    if (!base) return null;

    base.left = clamp(base.left, 12, Math.max(12, vw - base.width - 12));
    base.top = clamp(base.top, 12, Math.max(12, vh - base.height - 12));
    return base;
  }

  function maybePlaceWindow(win, force = false) {
    if (!win || !isVisible(win)) return;
    if (win.dataset.phase4Manual === '1' && !force) return;

    const type = classifyWindow(win);
    if (!type) return;

    const rect = viewportRect(type);
    if (!rect) return;

    win.style.position = 'absolute';
    win.style.left = rect.left + 'px';
    win.style.top = rect.top + 'px';
    win.style.width = rect.width + 'px';
    win.style.height = rect.height + 'px';
    win.dataset.phase4Placed = '1';
  }

  function bindTab(tab) {
    if (!tab || tab.dataset.phase4ToggleBound === '1') return;
    tab.dataset.phase4ToggleBound = '1';

    tab.addEventListener('click', (event) => {
      const win = findWindowForTab(tab);
      if (win && isVisible(win)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeWindow(win);
        setTabActive(tab, false);
        return;
      }
      window.setTimeout(() => {
        const linked = findWindowForTab(tab);
        if (linked) {
          showWindow(linked);
          setTabActive(tab, true);
        }
      }, 10);
    }, true);

    tab.addEventListener('dblclick', (event) => {
      const win = findWindowForTab(tab);
      if (!win) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      closeWindow(win);
      setTabActive(tab, false);
    }, true);
  }

  function bindWindow(win) {
    if (!win || win.dataset.phase4WindowBound === '1') return;
    win.dataset.phase4WindowBound = '1';

    win.addEventListener('mousedown', () => zIndexFront(win));

    const header = win.querySelector('.dashboard-window-header, .floating-window-header, .window-header, [data-window-header]');
    if (header) {
      header.addEventListener('mousedown', () => {
        win.dataset.phase4Manual = '1';
      });
    }

    const resizeHandle = win.querySelector('.dashboard-resize-handle, .resize-handle, [data-resize-handle]');
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', () => {
        win.dataset.phase4Manual = '1';
      });
    }
  }

  function syncTabStates() {
    allTabs().forEach((tab) => {
      const win = findWindowForTab(tab);
      setTabActive(tab, !!(win && isVisible(win)));
    });
  }

  function installStyle() {
    if (document.getElementById('phase4-window-ux-style')) return;

    const style = document.createElement('style');
    style.id = 'phase4-window-ux-style';
    style.textContent = `
      .dashboard-sidebar,
      .dashboard-dock,
      .dashboard-nav {
        gap: 12px !important;
      }

      .dashboard-sidebar button,
      .dashboard-dock button,
      .dashboard-nav button,
      .dashboard-tab-button,
      [data-window-tab],
      [data-panel-tab],
      [data-dashboard-tab] {
        min-width: 52px !important;
        min-height: 52px !important;
        width: 52px !important;
        height: 52px !important;
        padding: 10px !important;
        border-radius: 16px !important;
        font-size: 15px !important;
        line-height: 1 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        user-select: none !important;
      }

      .dashboard-sidebar button.is-active,
      .dashboard-dock button.is-active,
      .dashboard-nav button.is-active,
      .dashboard-tab-button.is-active,
      [data-window-tab].is-active,
      [data-panel-tab].is-active,
      [data-dashboard-tab].is-active {
        box-shadow: 0 0 0 1px rgba(160, 215, 255, 0.65), 0 0 24px rgba(53, 150, 255, 0.22) !important;
      }

      .dashboard-window,
      .floating-window,
      .dashboard-floating-window,
      [data-window-id],
      [data-dashboard-window] {
        min-width: 220px !important;
        min-height: 150px !important;
        border-radius: 22px !important;
        overflow: hidden !important;
        transition: box-shadow .18s ease, transform .18s ease !important;
      }

      .dashboard-window.is-active,
      .floating-window.is-active,
      .dashboard-floating-window.is-active,
      [data-window-id].is-active,
      [data-dashboard-window].is-active {
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.30), 0 0 0 1px rgba(160, 215, 255, 0.20) !important;
      }

      .dashboard-window-header,
      .floating-window-header,
      .window-header,
      [data-window-header] {
        min-height: 48px !important;
        padding: 10px 14px !important;
      }

      .dashboard-window-body,
      .floating-window-body,
      .window-body,
      [data-window-body] {
        padding: 12px !important;
      }

      .dashboard-resize-handle,
      .resize-handle,
      [data-resize-handle] {
        width: 32px !important;
        height: 32px !important;
      }
    `;
    document.head.appendChild(style);
  }

  function scan(forcePlace = false) {
    installStyle();
    allTabs().forEach(bindTab);
    allWindows().forEach((win) => {
      bindWindow(win);
      maybePlaceWindow(win, forcePlace);
    });
    syncTabStates();
  }

  function scheduleScan(forcePlace = false) {
    clearTimeout(window.__phase4UxTimer);
    window.__phase4UxTimer = setTimeout(() => scan(forcePlace), 70);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scan(true), { once: true });
  } else {
    scan(true);
  }

  const observer = new MutationObserver(() => scheduleScan(false));
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'style', 'class'] });

  window.addEventListener('resize', () => {
    allWindows().forEach((win) => {
      if (win.dataset.phase4Manual !== '1') {
        maybePlaceWindow(win, true);
      }
    });
    syncTabStates();
  });
})();
