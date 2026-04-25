(() => {
  "use strict";

  const STORAGE_KEY = "profile.dashboard.legacyBridge.v1";
  const CREATED = "data-legacy-dashboard-bridge";
  const PANEL_SELECTOR = ".customizer-section[data-panel]";

  const ITEMS = [
    { id: "music", label: "Module 4", icon: "♪", panel: "music", title: "Module 4 player", selectors: ["#module4Player", "#musicPlayer", ".module-04-player", ".module-player", ".music-player", ".neon-player", ".audio-player", "[data-module='music']", "[data-module='player']"], rect: { x: 76, y: 86, width: 440, height: 640 } },
    { id: "lyrics", label: "Lyrics", icon: "♫", panel: "lyrics", title: "Lyrics editor / overlay", selectors: ["#lyricsOverlay", "#lyricsPanel", "#lyricsEditor", ".lyrics-overlay", ".lyrics-panel", ".lyrics-editor", "[data-module='lyrics']", "[data-lyrics-overlay]"], rect: { x: 128, y: 86, width: 760, height: 720 } },
    { id: "profile", label: "Profile", icon: "◎", panel: "profile", title: "Profile card", selectors: ["#profileCard", "#artistProfileCard", ".profile-card", ".artist-card", ".artist-profile-card", ".profile-shell", "[data-module='profile']", "[data-profile-card]"], rect: { x: 232, y: 112, width: 500, height: 620 } },
    { id: "background", label: "Background", icon: "◌", panel: "background", title: "Background controls", selectors: [], rect: { x: 180, y: 100, width: 620, height: 700 } },
    { id: "layout", label: "Layout", icon: "▣", panel: "layout", title: "Layout controls", selectors: [], rect: { x: 220, y: 100, width: 620, height: 700 } }
  ];

  const windows = new Map();
  const state = readState();

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch { return {}; }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function q(selector, root = document) {
    try { return root.querySelector(selector); }
    catch { return null; }
  }

  function create(tag, className = "", attrs = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === "text") element.textContent = value;
      else if (key === "html") element.innerHTML = value;
      else element.setAttribute(key, value);
    });
    return element;
  }

  function injectStyles() {
    if (q("#legacy-dashboard-bridge-style")) return;
    const style = create("style", "", { id: "legacy-dashboard-bridge-style" });
    style.textContent = `
      [${CREATED}] { box-sizing: border-box; }
      [${CREATED}] *, [${CREATED}] *::before, [${CREATED}] *::after { box-sizing: inherit; }
      .legacy-dashboard-dock { position: fixed; left: 16px; top: 50%; transform: translateY(-50%); z-index: 2147482500; display: grid; gap: 10px; padding: 10px; border: 1px solid rgba(132,204,255,.24); border-radius: 22px; background: rgba(8,15,34,.62); backdrop-filter: blur(18px); box-shadow: 0 24px 70px rgba(0,0,0,.34); }
      .legacy-dashboard-tab { width: 48px; min-height: 48px; border: 1px solid rgba(132,204,255,.28); border-radius: 16px; background: rgba(255,255,255,.08); color: rgba(245,250,255,.92); cursor: pointer; display: grid; place-items: center; font: 700 18px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
      .legacy-dashboard-tab span { display: block; font-size: 10px; font-weight: 800; letter-spacing: .04em; margin-top: 3px; }
      .legacy-dashboard-tab.is-open { border-color: rgba(120,220,255,.72); background: rgba(82,169,255,.2); box-shadow: inset 0 0 0 1px rgba(255,255,255,.12), 0 0 24px rgba(78,171,255,.34); }
      .legacy-dashboard-window { position: fixed; z-index: 2147482400; min-width: 360px; min-height: 280px; max-width: calc(100vw - 32px); max-height: calc(100vh - 32px); display: grid; grid-template-rows: auto minmax(0,1fr); border: 1px solid rgba(132,204,255,.28); border-radius: 24px; background: rgba(10,20,42,.74); backdrop-filter: blur(22px); box-shadow: 0 34px 90px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.14); color: rgba(245,250,255,.95); resize: both; overflow: hidden; }
      .legacy-dashboard-window.is-hidden { display: none; }
      .legacy-dashboard-header { min-height: 48px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px 10px 16px; border-bottom: 1px solid rgba(132,204,255,.16); cursor: grab; user-select: none; }
      .legacy-dashboard-title { display: inline-flex; align-items: center; gap: 10px; font: 800 12px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; text-transform: uppercase; letter-spacing: .08em; }
      .legacy-dashboard-actions { display: inline-flex; gap: 8px; }
      .legacy-dashboard-action { width: 34px; height: 30px; border: 1px solid rgba(255,255,255,.18); border-radius: 999px; background: rgba(255,255,255,.08); color: inherit; cursor: pointer; }
      .legacy-dashboard-body { min-width: 0; min-height: 0; overflow: auto; padding: 16px; }
      .legacy-dashboard-empty { margin: 0; padding: 16px; border: 1px dashed rgba(132,204,255,.28); border-radius: 18px; color: rgba(245,250,255,.74); font: 600 13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
      .legacy-mounted-panel { width: 100% !important; max-width: none !important; min-width: 0 !important; }
      .legacy-mounted-panel input, .legacy-mounted-panel textarea, .legacy-mounted-panel select, .legacy-mounted-panel button { max-width: 100%; }
      .legacy-dashboard-resize-cue { position: absolute; right: 9px; bottom: 9px; width: 16px; height: 16px; border-right: 2px solid rgba(145,222,255,.8); border-bottom: 2px solid rgba(145,222,255,.8); border-radius: 2px; pointer-events: none; }
    `;
    document.head.appendChild(style);
  }

  function rememberOrigin(node) {
    if (!node || node.__legacyDashboardOrigin) return;
    node.__legacyDashboardOrigin = {
      parent: node.parentNode,
      next: node.nextSibling,
      hidden: node.hidden,
      display: node.style.display,
      position: node.style.position,
      width: node.style.width,
      height: node.style.height,
      maxWidth: node.style.maxWidth
    };
  }

  function activateNode(node) {
    if (!node) return;
    node.hidden = false;
    node.removeAttribute("aria-hidden");
    node.classList.add("is-active", "legacy-mounted-panel");
    node.style.display = node.matches(PANEL_SELECTOR) ? "grid" : "";
    node.style.position = node.matches(PANEL_SELECTOR) ? "relative" : node.style.position;
    node.style.width = "100%";
    node.style.maxWidth = "none";
  }

  function findFirst(selectors) {
    for (const selector of selectors) {
      const found = q(selector);
      if (found && !found.closest(`[${CREATED}]`)) return found;
    }
    return null;
  }

  function findPanel(panel) {
    return panel ? q(`${PANEL_SELECTOR}[data-panel="${panel}"]`) : null;
  }

  function createDock() {
    const dock = create("nav", "legacy-dashboard-dock", { [CREATED]: "", "aria-label": "Dashboard tabs" });
    ITEMS.forEach((item) => {
      const tab = create("button", "legacy-dashboard-tab", { type: "button", title: `${item.label}: click để mở, nhấn 2 lần để tắt`, "data-legacy-tab": item.id, html: `${item.icon}<span>${item.label}</span>` });
      tab.addEventListener("click", () => openWindow(item.id));
      tab.addEventListener("dblclick", (event) => { event.preventDefault(); closeWindow(item.id); });
      dock.appendChild(tab);
    });
    document.body.appendChild(dock);
  }

  function makeWindow(item) {
    const saved = state[item.id] || item.rect;
    const win = create("section", "legacy-dashboard-window is-hidden", { [CREATED]: "", "data-legacy-window": item.id, "aria-label": item.title });
    Object.assign(win.style, { left: `${saved.x}px`, top: `${saved.y}px`, width: `${saved.width}px`, height: `${saved.height}px` });
    const header = create("header", "legacy-dashboard-header");
    const title = create("div", "legacy-dashboard-title", { html: `<strong>${item.icon}</strong><span>${item.title}</span>` });
    const actions = create("div", "legacy-dashboard-actions");
    const reset = create("button", "legacy-dashboard-action", { type: "button", title: "Reset size", text: "↺" });
    const close = create("button", "legacy-dashboard-action", { type: "button", title: "Close", text: "×" });
    actions.append(reset, close);
    header.append(title, actions);
    const body = create("div", "legacy-dashboard-body");
    win.append(header, body, create("span", "legacy-dashboard-resize-cue", { "aria-hidden": "true" }));
    document.body.appendChild(win);
    close.addEventListener("click", () => closeWindow(item.id));
    reset.addEventListener("click", () => { Object.assign(win.style, { left: `${item.rect.x}px`, top: `${item.rect.y}px`, width: `${item.rect.width}px`, height: `${item.rect.height}px` }); persistWindow(item.id, win); });
    header.addEventListener("dblclick", () => closeWindow(item.id));
    makeDraggable(win, header, item.id);
    new ResizeObserver(() => persistWindow(item.id, win)).observe(win);
    const entry = { item, win, body, mounted: null };
    windows.set(item.id, entry);
  }

  function makeDraggable(win, handle, id) {
    let start = null;
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest("button")) return;
      start = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: win.offsetLeft, top: win.offsetTop };
      handle.setPointerCapture(event.pointerId);
      win.style.zIndex = String(nextZ());
    });
    handle.addEventListener("pointermove", (event) => {
      if (!start || start.pointerId !== event.pointerId) return;
      win.style.left = `${Math.max(8, Math.min(window.innerWidth - 120, start.left + event.clientX - start.x))}px`;
      win.style.top = `${Math.max(8, Math.min(window.innerHeight - 80, start.top + event.clientY - start.y))}px`;
    });
    const end = (event) => {
      if (!start || start.pointerId !== event.pointerId) return;
      start = null;
      persistWindow(id, win);
    };
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  function persistWindow(id, win) {
    if (!win || win.classList.contains("is-hidden")) return;
    state[id] = { x: Math.round(win.offsetLeft), y: Math.round(win.offsetTop), width: Math.round(win.offsetWidth), height: Math.round(win.offsetHeight) };
    saveState();
  }

  function mountItem(entry) {
    let target = findFirst(entry.item.selectors) || findPanel(entry.item.panel);
    entry.body.replaceChildren();
    if (!target) {
      entry.body.appendChild(create("p", "legacy-dashboard-empty", { text: `Không tìm thấy DOM cũ cho ${entry.item.label}. Kiểm tra selector hoặc data-panel="${entry.item.panel}".` }));
      return;
    }
    rememberOrigin(target);
    activateNode(target);
    entry.body.appendChild(target);
    entry.mounted = target;
  }

  function openWindow(id) {
    const entry = windows.get(id);
    if (!entry) return;
    mountItem(entry);
    entry.win.classList.remove("is-hidden");
    entry.win.style.zIndex = String(nextZ());
    setTabState(id, true);
    clampWindow(entry.win);
    persistWindow(id, entry.win);
  }

  function closeWindow(id) {
    const entry = windows.get(id);
    if (!entry) return;
    entry.win.classList.add("is-hidden");
    setTabState(id, false);
  }

  function setTabState(id, isOpen) {
    q(`[data-legacy-tab="${id}"]`)?.classList.toggle("is-open", isOpen);
  }

  function nextZ() {
    return [...document.querySelectorAll(".legacy-dashboard-window")].reduce((value, element) => Math.max(value, Number.parseInt(getComputedStyle(element).zIndex, 10) || 0), 2147482400) + 1;
  }

  function clampWindow(win) {
    win.style.left = `${Math.max(8, Math.min(win.offsetLeft, Math.max(8, window.innerWidth - 120)))}px`;
    win.style.top = `${Math.max(8, Math.min(win.offsetTop, Math.max(8, window.innerHeight - 80)))}px`;
  }

  function init() {
    if (q(".legacy-dashboard-dock")) return;
    injectStyles();
    createDock();
    ITEMS.forEach(makeWindow);
    window.addEventListener("resize", () => windows.forEach(({ win }) => clampWindow(win)));
    setTimeout(() => { openWindow("music"); openWindow("lyrics"); }, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(init), { once: true });
  } else {
    requestAnimationFrame(init);
  }
})();
