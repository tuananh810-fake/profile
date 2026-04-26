import "./phase3LegacyPanelMount.js";

(() => {
  const ENHANCER_FLAG = "__dashboardUiEnhancerLoaded";
  if (window[ENHANCER_FLAG]) return;
  window[ENHANCER_FLAG] = true;

  const style = document.createElement("style");
  style.id = "dashboard-ui-enhancer-style";
  style.textContent = `
    .dashboard-sidebar, .dashboard-dock, .dashboard-nav { gap: 12px !important; }
    .dashboard-sidebar button,
    .dashboard-sidebar .dashboard-tab,
    .dashboard-dock button,
    .dashboard-nav button,
    .dashboard-tab-button,
    .dashboard-icon-button {
      min-width: 54px !important;
      min-height: 54px !important;
      padding: 10px !important;
      border-radius: 16px !important;
      font-size: 15px !important;
      line-height: 1.2 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
    }
    .dashboard-window,
    .floating-window,
    .window-card {
      min-width: 340px !important;
      min-height: 220px !important;
      border-radius: 24px !important;
      overflow: hidden !important;
      backdrop-filter: blur(18px) !important;
      -webkit-backdrop-filter: blur(18px) !important;
    }
    .dashboard-window-header,
    .floating-window-header,
    .window-header {
      min-height: 54px !important;
      padding: 12px 16px !important;
      cursor: move;
    }
    .dashboard-window-title,
    .floating-window-title,
    .window-title {
      font-size: 15px !important;
      font-weight: 700 !important;
      letter-spacing: .02em !important;
    }
    .dashboard-window-body,
    .floating-window-body,
    .window-body {
      padding: 16px !important;
      overflow: auto !important;
    }
    .dashboard-window .dashboard-resize-handle,
    .floating-window .dashboard-resize-handle,
    .dashboard-resize-handle,
    .resize-handle {
      position: absolute !important;
      width: 28px !important;
      height: 28px !important;
      right: 0 !important;
      bottom: 0 !important;
      cursor: nwse-resize !important;
      z-index: 30 !important;
      background: transparent !important;
      display: block !important;
      pointer-events: auto !important;
    }
    .dashboard-window .dashboard-resize-handle::after,
    .floating-window .dashboard-resize-handle::after,
    .dashboard-resize-handle::after,
    .resize-handle::after {
      content: "";
      position: absolute;
      right: 7px;
      bottom: 7px;
      width: 11px;
      height: 11px;
      border-right: 2px solid rgba(190, 225, 255, 0.9);
      border-bottom: 2px solid rgba(190, 225, 255, 0.9);
      border-radius: 2px;
    }
    .dashboard-window [data-panel="lyrics"],
    .dashboard-window .lyrics-panel,
    .dashboard-window .lyrics-editor { font-size: 14px !important; }
    .dashboard-window input,
    .dashboard-window select,
    .dashboard-window textarea,
    .dashboard-window button,
    .floating-window input,
    .floating-window select,
    .floating-window textarea,
    .floating-window button {
      min-height: 42px !important;
      font-size: 14px !important;
    }
    .dashboard-window textarea,
    .floating-window textarea {
      min-height: 140px !important;
      resize: vertical !important;
    }
  `;
  document.head.appendChild(style);

  const POSITION_RULES = [
    { keys: ["module 4", "music", "player", "neon player"], left: 24, top: 96, width: 320, height: 720 },
    { keys: ["intro", "profile intro", "intro panel"], left: 360, top: 72, width: 580, height: 250 },
    { keys: ["lyrics", "lyric"], left: 320, top: 340, width: 660, height: 360 },
    { keys: ["profile", "artist mode", "profile card"], left: 1000, top: 280, width: 340, height: 430 },
    { keys: ["creative"], left: 1000, top: 96, width: 260, height: 180 },
    { keys: ["clock", "focusclock", "focus"], left: 1280, top: 104, width: 220, height: 190 },
    { keys: ["customizer", "layout", "background"], left: 1520, top: 8, width: 320, height: 820 }
  ];

  function textOf(el) {
    return (el?.innerText || el?.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function applyRect(el, rect) {
    el.style.position = "absolute";
    el.style.left = `${rect.left}px`;
    el.style.top = `${rect.top}px`;
    el.style.width = `${rect.width}px`;
    el.style.height = `${rect.height}px`;
  }

  function classifyWindow(win) {
    const header = win.querySelector(".dashboard-window-title, .floating-window-title, .window-title, .dashboard-window-header, .floating-window-header, .window-header");
    const content = textOf(win);
    const title = textOf(header);
    const haystack = `${title} ${content.slice(0, 500)}`;
    return POSITION_RULES.find((rule) => rule.keys.some((key) => haystack.includes(key)));
  }

  function layoutWindows() {
    const wins = Array.from(document.querySelectorAll(".dashboard-window, .floating-window, .window-card"))
      .filter((el) => el.offsetParent !== null && el.dataset.enhancerManualLayout !== "1");

    wins.forEach((win) => {
      const rule = classifyWindow(win);
      if (!rule) return;
      applyRect(win, rule);
      win.dataset.enhancerManualLayout = "1";
    });
  }

  function findSidebarButtons() {
    return Array.from(document.querySelectorAll(".dashboard-sidebar button, .dashboard-dock button, .dashboard-nav button, .dashboard-tab-button"));
  }

  function findWindowByButton(btn) {
    const name = textOf(btn);
    const wins = Array.from(document.querySelectorAll(".dashboard-window, .floating-window, .window-card"));
    return wins.find((win) => textOf(win).includes(name) || textOf(win.querySelector(".dashboard-window-title, .floating-window-title, .window-title")).includes(name));
  }

  function closeWindow(win) {
    if (!win) return;
    const closeBtn = win.querySelector('[aria-label*="close" i], [title*="close" i], .close, .window-close, .dashboard-window-close');
    if (closeBtn) {
      closeBtn.click();
      return;
    }
    win.style.display = "none";
    win.setAttribute("data-manually-closed", "true");
  }

  function bindDoubleClickToClose() {
    findSidebarButtons().forEach((btn) => {
      if (btn.dataset.enhancerDblclickBound === "1") return;
      btn.dataset.enhancerDblclickBound = "1";
      btn.addEventListener("dblclick", (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeWindow(findWindowByButton(btn));
      });
    });
  }

  function ensureResizeHandles() {
    const wins = Array.from(document.querySelectorAll(".dashboard-window, .floating-window, .window-card"));
    wins.forEach((win) => {
      let handle = win.querySelector(".dashboard-resize-handle, .resize-handle");
      if (!handle) {
        handle = document.createElement("button");
        handle.type = "button";
        handle.className = "dashboard-resize-handle";
        handle.setAttribute("data-edge", "se");
        win.appendChild(handle);
      }
      if (handle.dataset.enhancerResizeBound === "1") return;
      handle.dataset.enhancerResizeBound = "1";
      handle.addEventListener("mousedown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const startX = event.clientX;
        const startY = event.clientY;
        const startW = win.offsetWidth;
        const startH = win.offsetHeight;
        function onMove(e) {
          win.style.width = `${Math.max(340, startW + (e.clientX - startX))}px`;
          win.style.height = `${Math.max(220, startH + (e.clientY - startY))}px`;
        }
        function onUp() {
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);
        }
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
      });
    });
  }

  function tick() {
    bindDoubleClickToClose();
    ensureResizeHandles();
    layoutWindows();
  }

  const mo = new MutationObserver(() => {
    clearTimeout(window.__dashboardUiEnhancerTimer);
    window.__dashboardUiEnhancerTimer = setTimeout(tick, 80);
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("load", () => setTimeout(tick, 200));
  setTimeout(tick, 300);
})();
