(() => {
  const INSTALL_FLAG = "__phase3LegacyPanelMountInstalled";
  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  const WINDOW_SELECTOR = [
    ".dashboard-window",
    ".floating-window",
    ".dashboard-floating-window",
    "[data-window-id]",
    "[data-dashboard-window]"
  ].join(",");

  const BODY_SELECTOR = [
    ".dashboard-window-body",
    ".floating-window-body",
    ".window-body",
    "[data-window-body]",
    ".dashboard-panel-body",
    ".panel-body"
  ].join(",");

  const TITLE_SELECTOR = [
    ".dashboard-window-title",
    ".floating-window-title",
    ".window-title",
    "[data-window-title]",
    ".dashboard-window-header",
    ".floating-window-header",
    ".window-header"
  ].join(",");

  const PANEL_REGISTRY = {
    music: {
      label: "Module 4",
      aliases: ["module 4", "module04", "module 04", "music", "sound", "sounds", "audio", "player", "neon player"],
      selectors: [
        '.customizer-section[data-panel="music"]',
        '[data-customizer-panel="music"]',
        '[data-panel="music"]',
        '[data-panel-id="music"]',
        '#musicPanel',
        '#module4Panel',
        '#module04Panel',
        '[data-module="music"]',
        '[data-module="player"]',
        '[data-module-id="module-4"]',
        '[data-module-id="module4"]',
        '.module-4-player',
        '.module4-player',
        '.module-player',
        '.neon-player',
        '.music-player',
        '.audio-player',
        '.player-module'
      ]
    },

    lyrics: {
      label: "Lyrics",
      aliases: ["lyrics", "lyric", "media", "karaoke"],
      selectors: [
        '.customizer-section[data-panel="lyrics"]',
        '[data-customizer-panel="lyrics"]',
        '[data-panel="lyrics"]',
        '[data-panel-id="lyrics"]',
        '#lyricsPanel',
        '#lyricPanel',
        '[data-lyrics-editor]',
        '[data-lyric-editor]',
        '.lyrics-editor',
        '.lyric-editor',
        '.lyrics-panel',
        '.lyric-panel',
        '.lyrics-controls',
        '.lyric-controls'
      ]
    },

    background: {
      label: "Background",
      aliases: ["background", "wallpaper", "bg"],
      selectors: [
        '.customizer-section[data-panel="background"]',
        '[data-customizer-panel="background"]',
        '[data-panel="background"]',
        '[data-panel-id="background"]',
        '#backgroundPanel',
        '.background-panel',
        '.background-controls'
      ]
    },

    layout: {
      label: "Layout",
      aliases: ["layout", "arrange", "canvas", "position", "positions"],
      selectors: [
        '.customizer-section[data-panel="layout"]',
        '[data-customizer-panel="layout"]',
        '[data-panel="layout"]',
        '[data-panel-id="layout"]',
        '#layoutPanel',
        '.layout-panel',
        '.layout-controls'
      ]
    },

    profile: {
      label: "Profile",
      aliases: ["profile", "artist", "card", "profile card", "artist card", "artist mode"],
      selectors: [
        '[data-panel="profile"]',
        '[data-panel-id="profile"]',
        '[data-profile-card]',
        '#profilePanel',
        '#profileCard',
        '.profile-panel',
        '.profile-card',
        '.artist-profile-card',
        '.artist-card',
        '.profile-widget'
      ]
    },

    customizer: {
      label: "Customizer",
      aliases: ["customizer", "customiser", "tune", "settings", "setting"],
      selectors: [
        '#customizerPanel',
        '.customizer-panel',
        '[data-customizer]',
        '[data-panel="customizer"]'
      ]
    }
  };

  const panelCache = new Map();

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^a-z0-9à-ỹ\s_-]/gi, "");
  }

  function textOf(el) {
    return normalize(el?.innerText || el?.textContent || "");
  }

  function getWindowId(win) {
    const title = win.querySelector(TITLE_SELECTOR);

    return normalize(
      win.dataset.windowId ||
      win.dataset.panelId ||
      win.dataset.dashboardWindow ||
      win.dataset.legacyPanel ||
      win.id ||
      title?.textContent ||
      ""
    );
  }

  function resolvePanelId(win) {
    const explicit = normalize(win.dataset.legacyPanel || win.dataset.panelId || win.dataset.windowId);
    if (PANEL_REGISTRY[explicit]) return explicit;

    const title = textOf(win.querySelector(TITLE_SELECTOR));
    const haystack = `${getWindowId(win)} ${title}`.trim();

    for (const [panelId, config] of Object.entries(PANEL_REGISTRY)) {
      if (config.aliases.some((alias) => haystack.includes(normalize(alias)))) {
        return panelId;
      }
    }

    return "";
  }

  function isInsideWindow(el) {
    return Boolean(el?.closest?.(WINDOW_SELECTOR));
  }

  function findFirstAvailable(selectors) {
    for (const selector of selectors) {
      const list = Array.from(document.querySelectorAll(selector));

      const outsideWindow = list.find((node) => !isInsideWindow(node));
      if (outsideWindow) return outsideWindow;

      if (list[0]) return list[0];
    }

    return null;
  }

  function findLegacyPanel(panelId) {
    const cached = panelCache.get(panelId);
    if (cached && document.contains(cached)) return cached;

    const config = PANEL_REGISTRY[panelId];
    if (!config) return null;

    const panel = findFirstAvailable(config.selectors);
    if (panel) {
      panelCache.set(panelId, panel);
    }

    return panel;
  }

  function findBody(win) {
    if (!win) return null;

    const body = win.querySelector(BODY_SELECTOR);
    if (body) return body;

    const children = Array.from(win.children);
    return children.find((child) => !child.matches(".dashboard-resize-handle, .resize-handle, [data-resize-handle]")) || win;
  }

  function preparePanel(panel, panelId) {
    panel.hidden = false;
    panel.removeAttribute("hidden");
    panel.removeAttribute("aria-hidden");

    panel.classList.add("is-active");
    panel.classList.add("dashboard-legacy-panel");
    panel.dataset.dashboardLegacyPanelId = panelId;

    if (panel.style.display === "none") panel.style.display = "";
    panel.style.maxWidth = "100%";
  }

  function mountPanelIntoWindow(win, panelId) {
    const body = findBody(win);
    if (!body) return;

    const current = body.querySelector(`:scope > .dashboard-legacy-mount[data-panel-id="${panelId}"]`);
    if (current) return;

    const panel = findLegacyPanel(panelId);
    if (!panel) {
      if (!body.dataset.phase3MissingPanelNotice) {
        body.dataset.phase3MissingPanelNotice = "1";
        const missing = document.createElement("div");
        missing.className = "dashboard-legacy-missing";
        missing.innerHTML = `
          <strong>Panel not found:</strong> ${panelId}<br>
          <small>Phase 3 could not find the original DOM for this panel. Add a data-panel attribute to the original panel or update PANEL_REGISTRY selectors.</small>
        `;
        body.replaceChildren(missing);
      }
      return;
    }

    preparePanel(panel, panelId);

    const mount = document.createElement("section");
    mount.className = "dashboard-legacy-mount";
    mount.dataset.panelId = panelId;
    mount.dataset.panelLabel = PANEL_REGISTRY[panelId]?.label || panelId;

    body.replaceChildren(mount);
    mount.appendChild(panel);

    win.dataset.legacyPanel = panelId;
    win.dataset.phase3Mounted = "1";
    body.dataset.phase3MissingPanelNotice = "";
  }

  function installStyle() {
    if (document.getElementById("phase3-legacy-panel-mount-style")) return;

    const style = document.createElement("style");
    style.id = "phase3-legacy-panel-mount-style";
    style.textContent = `
      .dashboard-legacy-mount {
        width: 100%;
        height: 100%;
        min-height: 100%;
        overflow: auto;
        display: grid;
        align-content: start;
        gap: 14px;
        box-sizing: border-box;
      }

      .dashboard-legacy-mount > .dashboard-legacy-panel,
      .dashboard-legacy-mount > * {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      .dashboard-legacy-panel {
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }

      .dashboard-legacy-mount input,
      .dashboard-legacy-mount select,
      .dashboard-legacy-mount textarea,
      .dashboard-legacy-mount button {
        font-size: 14px;
      }

      .dashboard-legacy-mount button {
        min-height: 40px;
        padding: 9px 12px;
        border-radius: 12px;
      }

      .dashboard-legacy-mount textarea {
        min-height: 180px;
        resize: vertical;
      }

      .dashboard-legacy-missing {
        padding: 14px;
        border-radius: 16px;
        border: 1px solid rgba(125, 190, 255, .24);
        background: rgba(12, 20, 38, .66);
        color: rgba(240, 248, 255, .88);
        line-height: 1.45;
      }
    `;

    document.head.appendChild(style);
  }

  function scan() {
    installStyle();

    const windows = Array.from(document.querySelectorAll(WINDOW_SELECTOR));

    windows.forEach((win) => {
      const panelId = resolvePanelId(win);
      if (!panelId) return;
      mountPanelIntoWindow(win, panelId);
    });
  }

  function scheduleScan() {
    clearTimeout(window.__phase3LegacyPanelMountTimer);
    window.__phase3LegacyPanelMountTimer = setTimeout(scan, 90);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan, { once: true });
  } else {
    scan();
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["hidden", "style", "class", "data-window-id", "data-panel-id"]
  });

  window.addEventListener("resize", scheduleScan);
})();
