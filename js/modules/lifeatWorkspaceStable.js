const STYLE_ID = "lifeatWorkspaceStableStyle";
const STATE_KEY = "profile.lifeat.stable.state";
const PROFILE_KEY = "profile.lifeat.stable.profile";
const INTRO_STYLE_KEY = "profile.lifeat.stable.introStyle";
const TASKS_KEY = "profile.lifeat.stable.tasks";
const NOTES_KEY = "profile.lifeat.stable.notes";
const TIMER_KEY = "profile.lifeat.stable.timer";
const CUSTOMIZER_LAYOUT_KEY = "profile.customizer.layout";

const NAV_ITEMS = [
  { id: "spaces", label: "Spaces", icon: "S" },
  { id: "sounds", label: "Sounds", icon: "♪" },
  { id: "calendar", label: "Cal", icon: "C" },
  { id: "timer", label: "Timer", icon: "T" },
  { id: "tasks", label: "Tasks", icon: "Ts" },
  { id: "notes", label: "Notes", icon: "N" },
  { id: "lyrics", label: "Lyric", icon: "Ly" },
  { id: "profile", label: "Profile", icon: "P" },
  { id: "layout", label: "Layout", icon: "L" }
];

const TABS = {
  spaces: ["Videos", "Images", "Effects"],
  sounds: ["Player", "Library", "Upload"],
  calendar: ["Today", "Zones"],
  timer: ["Focus", "Break", "Long"],
  tasks: ["Widget", "Tasks"],
  notes: ["Intro", "Style", "Notes"],
  lyrics: ["Text", "Effect", "Timing", "Burst"],
  profile: ["Card", "Links", "View"],
  layout: ["Visibility", "Copy", "Audio"]
};

const LYRIC_GROUPS = {
  Text: [
    "lyricsScaleRange",
    "lyricsFontSelect",
    "lyricsBoldToggle",
    "lyricsItalicToggle",
    "textEffect",
    "colorMode",
    "lyricsColorPresetGallery",
    "lyricsPrimaryColor",
    "lyricsSecondaryColor",
    "lyricsAccentColor",
    "lyricsLetterSpacingRange",
    "lyricsWordSpacingRange",
    "lyricsAlignSelect"
  ],
  Effect: [
    "lyricsKineticWordsRange",
    "lyricsKineticCharsRange",
    "lyricsKineticSpeedRange",
    "lyricsSmoothModeToggle",
    "lyricsKineticStyleSelect"
  ],
  Timing: ["lyricsDelayRange", "lyricsBoxHazeRange"],
  Burst: [
    "lyricsTailBurstToggle",
    "lyricsTailBurstStyleSelect",
    "lyricsTailBurstColorA",
    "lyricsTailBurstColorB",
    "lyricsTailBurstColorCore",
    "lyricsTailBurstStrengthRange",
    "lyricsTailBurstParticlesRange",
    "lyricsTailBurstSpreadRange",
    "lyricsTailBurstGravityRange",
    "lyricsTailBurstDurationRange"
  ]
};

function el(tagName, className = "", attrs = {}) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else node.setAttribute(key, value);
  });
  return node;
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function isHex(value) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function hexToRgba(hex, alpha) {
  if (!isHex(hex)) return `rgba(15, 23, 42, ${alpha})`;
  const raw = hex.slice(1);
  const red = Number.parseInt(raw.slice(0, 2), 16);
  const green = Number.parseInt(raw.slice(2, 4), 16);
  const blue = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    :root {
      --lifeat-font: "Plus Jakarta Sans", "Outfit", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --lifeat-accent: #ff8f7a;
      --lifeat-accent-2: #f9739a;
      --lifeat-rail-width: 4.2rem;
      --lifeat-panel-left: 5.55rem;
      --lifeat-panel-width: min(24.5rem, calc(100vw - 6.5rem));
    }
    .legacy-dashboard-dock,
    .legacy-dashboard-window,
    .dashboard-sidebar,
    .dashboard-window { display: none !important; pointer-events: none !important; }
    #openCustomizerButton,
    .customizer-panel { display: none !important; }
    .lifeat-workspace-stable,
    .lifeat-workspace-stable *,
    .lifeat-workspace-stable .customizer-section,
    .lifeat-workspace-stable .customizer-section *,
    .lifeat-workspace-stable .lyrics-setting,
    .lifeat-workspace-stable .lyrics-setting * { box-sizing: border-box; font-family: var(--lifeat-font) !important; }
    .music-dock, .music-dock *, .focus-player, .focus-player *, .profile-card, .profile-card *, .lyrics-header, .lyrics-header * { font-family: var(--lifeat-font) !important; }
    .lifeat-workspace-stable { position: fixed; inset: 0; z-index: 2147482200; pointer-events: none; color: #243044; }
    .lifeat-workspace-stable.is-collapsed { --lifeat-rail-width: 3.2rem; --lifeat-panel-left: 4.55rem; }
    .lifeat-workspace-stable.is-collapsed .lifeat-nav-label { display: none; }
    .lifeat-rail { position: fixed; left: .55rem; top: .55rem; bottom: .55rem; width: var(--lifeat-rail-width); display: grid; grid-template-rows: auto minmax(0, 1fr) auto; gap: .55rem; pointer-events: auto; }
    .lifeat-rail-group { display: grid; align-content: start; gap: .42rem; padding: .42rem; overflow: auto; border: 1px solid rgba(15,23,42,.08); border-radius: .52rem; background: rgba(255,255,255,.96); box-shadow: 0 18px 44px rgba(15,23,42,.16); backdrop-filter: blur(20px) saturate(150%); -webkit-backdrop-filter: blur(20px) saturate(150%); scrollbar-width: none; }
    .lifeat-rail-group::-webkit-scrollbar { display: none; }
    .lifeat-nav-button, .lifeat-collapse-button { width: 3.15rem; min-height: 3.15rem; display: grid; place-items: center; gap: .18rem; border: 0; border-radius: .4rem; background: transparent; color: rgba(32,41,57,.8); cursor: pointer; transition: background .16s ease, color .16s ease, transform .16s ease; }
    .lifeat-workspace-stable.is-collapsed .lifeat-nav-button, .lifeat-workspace-stable.is-collapsed .lifeat-collapse-button { width: 2.45rem; min-height: 2.45rem; }
    .lifeat-nav-button:hover, .lifeat-nav-button.is-active, .lifeat-collapse-button:hover { color: var(--lifeat-accent); background: rgba(255,143,122,.11); transform: translateY(-1px); }
    .lifeat-nav-icon { display: grid; place-items: center; width: 1.45rem; height: 1.45rem; font-size: .92rem; font-weight: 900; line-height: 1; }
    .lifeat-nav-label { max-width: 3.1rem; overflow: hidden; font-size: .66rem; font-weight: 760; line-height: 1.05; text-overflow: ellipsis; white-space: nowrap; }
    .lifeat-panel { position: fixed; left: var(--lifeat-panel-left); top: 0; bottom: 0; width: var(--lifeat-panel-width); display: grid; grid-template-rows: auto minmax(0, 1fr); pointer-events: auto; border-right: 1px solid rgba(15,23,42,.1); background: rgba(255,255,255,.93); box-shadow: 22px 0 56px rgba(15,23,42,.18); backdrop-filter: blur(24px) saturate(145%); -webkit-backdrop-filter: blur(24px) saturate(145%); transform: translateX(-1rem); opacity: 0; visibility: hidden; transition: transform .18s ease, opacity .18s ease, visibility .18s ease; }
    .lifeat-panel.is-open { transform: translateX(0); opacity: 1; visibility: visible; }
    .lifeat-panel-header { display: grid; gap: .7rem; padding: .55rem .6rem .6rem; border-bottom: 1px solid rgba(15,23,42,.08); background: rgba(255,255,255,.68); }
    .lifeat-panel-tabbar { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(5rem, 1fr); gap: .25rem; overflow-x: auto; scrollbar-width: none; }
    .lifeat-panel-tabbar::-webkit-scrollbar { display: none; }
    .lifeat-tab, .lifeat-action, .lifeat-chip { min-height: 2.18rem; border: 1px solid rgba(15,23,42,.08); border-radius: .72rem; background: rgba(255,255,255,.58); color: rgba(38,49,66,.78); cursor: pointer; font: inherit; font-size: .76rem; font-weight: 780; white-space: nowrap; }
    .lifeat-tab:hover, .lifeat-tab.is-active, .lifeat-action:hover, .lifeat-chip:hover, .lifeat-chip.is-active { color: #111827; background: rgba(15,23,42,.055); }
    .lifeat-header-row, .lifeat-row, .lifeat-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; }
    .lifeat-search { flex: 1 1 auto; display: flex; align-items: center; gap: .42rem; min-width: 0; height: 2.35rem; padding: 0 .72rem; border: 1px solid rgba(15,23,42,.12); border-radius: .32rem; background: rgba(255,255,255,.78); }
    .lifeat-search input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: #263142; font: inherit; font-size: .8rem; }
    .lifeat-close, .lifeat-minimize { width: 2.2rem; height: 2.2rem; display: grid; place-items: center; border: 0; border-radius: .42rem; background: rgba(15,23,42,.08); color: rgba(31,42,58,.72); cursor: pointer; font-weight: 900; }
    .lifeat-minimize { position: absolute; right: -1.55rem; top: 2.75rem; width: 1.55rem; border-radius: 0 .42rem .42rem 0; box-shadow: 10px 0 22px rgba(15,23,42,.16); }
    .lifeat-panel-body { min-height: 0; overflow: auto; padding: .9rem .75rem 1.2rem; color: #243044; overscroll-behavior: contain; }
    .lifeat-card { display: grid; gap: .75rem; margin-bottom: .78rem; padding: .88rem; border: 1px solid rgba(15,23,42,.08); border-radius: 1rem; background: rgba(255,255,255,.68); box-shadow: 0 12px 28px rgba(15,23,42,.06); color: #243044; }
    .lifeat-card-flat { background: rgba(255,255,255,.46); box-shadow: none; }
    .lifeat-title { margin: 0; color: #243044; font-size: .96rem; font-weight: 860; letter-spacing: -.01em; }
    .lifeat-muted { margin: 0; color: rgba(31,42,58,.64); font-size: .78rem; font-weight: 560; line-height: 1.45; }
    .lifeat-field { display: grid; gap: .38rem; }
    .lifeat-label { color: rgba(31,42,58,.64); font-size: .68rem; font-weight: 860; letter-spacing: .06em; text-transform: uppercase; }
    .lifeat-input, .lifeat-select, .lifeat-textarea { width: 100%; border: 1px solid rgba(15,23,42,.12); border-radius: .78rem; background: rgba(255,255,255,.86); color: #243044; font: inherit; outline: 0; padding: .68rem .78rem; }
    .lifeat-textarea { min-height: 8rem; resize: vertical; }
    .lifeat-action-primary { color: #fff; background: linear-gradient(135deg, var(--lifeat-accent), var(--lifeat-accent-2)); border-color: rgba(249,115,154,.38); }
    .lifeat-spaces-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem .65rem; }
    .lifeat-space-card { display: grid; gap: .32rem; min-width: 0; border: 0; background: transparent; color: inherit; padding: 0; text-align: left; cursor: pointer; }
    .lifeat-space-thumb { position: relative; min-height: 5.25rem; overflow: hidden; border: 1px solid rgba(15,23,42,.1); border-radius: .45rem; background: linear-gradient(135deg, rgba(45,56,86,.95), rgba(135,92,78,.75)); box-shadow: inset 0 1px 0 rgba(255,255,255,.45); }
    .lifeat-space-thumb-image { background: linear-gradient(135deg, rgba(74,124,89,.86), rgba(172,202,135,.82)); }
    .lifeat-space-thumb-effects { background: radial-gradient(circle at 18% 20%, rgba(103,232,249,.72), transparent 20%), radial-gradient(circle at 78% 22%, rgba(216,180,254,.72), transparent 22%), linear-gradient(135deg, rgba(17,24,39,.92), rgba(79,70,229,.72)); }
    .lifeat-space-name, .lifeat-track-title { overflow: hidden; color: #374151; font-size: .74rem; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
    .lifeat-mini-player, .lifeat-task-list { display: grid; gap: .7rem; }
    .lifeat-now-row, .lifeat-track-row { display: grid; grid-template-columns: 3.35rem minmax(0, 1fr) auto; gap: .72rem; align-items: center; }
    .lifeat-artwork, .lifeat-track-index { display: grid; place-items: center; width: 3.35rem; height: 3.35rem; border-radius: .9rem; color: #fff; background: linear-gradient(135deg, #4357ff, #152044); font-weight: 900; }
    .lifeat-track-index { width: 2.1rem; height: 2.1rem; color: rgba(31,42,58,.72); background: rgba(15,23,42,.08); font-size: .72rem; }
    .lifeat-track-row { grid-template-columns: auto minmax(0, 1fr) auto; padding: .58rem; border: 1px solid rgba(15,23,42,.08); border-radius: .86rem; background: rgba(255,255,255,.64); color: #243044; text-align: left; cursor: pointer; }
    .lifeat-track-copy { min-width: 0; display: grid; gap: .12rem; }
    .lifeat-track-artist, .lifeat-time-row { overflow: hidden; color: rgba(31,42,58,.58); font-size: .7rem; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
    .lifeat-progress { height: .42rem; overflow: hidden; border-radius: 999px; background: rgba(15,23,42,.16); }
    .lifeat-progress-fill { display: block; width: 0%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #74d7ff, #ff8f7a); }
    .lifeat-time-row { display: flex; justify-content: space-between; }
    .lifeat-clock-large { color: #111827; font-size: clamp(2.4rem, 11vw, 4rem); font-weight: 880; letter-spacing: -.08em; }
    .lifeat-task-item { display: grid; grid-template-columns: auto 1fr auto; gap: .55rem; align-items: center; padding: .55rem; border-radius: .76rem; background: rgba(15,23,42,.045); }
    .lifeat-task-item.is-done span { color: rgba(31,42,58,.42); text-decoration: line-through; }
    .lifeat-task-remove { border: 0; background: transparent; color: rgba(31,42,58,.52); cursor: pointer; font-weight: 900; }
    .lifeat-workspace-stable .customizer-section, .lifeat-workspace-stable .customizer-background-option { display: grid !important; gap: .86rem !important; margin: 0 !important; padding: 0 !important; border: 0 !important; color: #243044 !important; background: transparent !important; box-shadow: none !important; opacity: 1 !important; transform: none !important; pointer-events: auto !important; }
    .lifeat-workspace-stable .customizer-tabs, .lifeat-workspace-stable .customizer-header, .lifeat-workspace-stable .customizer-note { display: none !important; }
    .lifeat-workspace-stable .customizer-field, .lifeat-workspace-stable .customizer-block, .lifeat-workspace-stable .customizer-actions, .lifeat-workspace-stable .customizer-upload-status, .lifeat-workspace-stable .customizer-library, .lifeat-workspace-stable .lyrics-setting { display: grid !important; gap: .42rem !important; padding: .66rem !important; border: 1px solid rgba(15,23,42,.06) !important; border-radius: .78rem !important; background: rgba(15,23,42,.045) !important; box-shadow: none !important; }
    .lifeat-workspace-stable .customizer-label, .lifeat-workspace-stable .lyrics-setting-label, .lifeat-workspace-stable .customizer-value, .lifeat-workspace-stable .lyrics-setting-value { color: rgba(31,42,58,.68) !important; }
    .lifeat-workspace-stable .customizer-input, .lifeat-workspace-stable .lyrics-font-select { border-color: rgba(15,23,42,.12) !important; background: rgba(255,255,255,.86) !important; color: #243044 !important; }
    .lifeat-workspace-stable .customizer-button, .lifeat-workspace-stable .background-switch-btn, .lifeat-workspace-stable .scene-nav-btn, .lifeat-workspace-stable .lyrics-control-btn { border-color: rgba(15,23,42,.12) !important; background: rgba(255,255,255,.78) !important; color: #243044 !important; font-weight: 820 !important; }
    .lifeat-workspace-stable .customizer-button--primary, .lifeat-workspace-stable .background-switch-btn.is-active, .lifeat-workspace-stable .lyrics-control-btn--accent, .lifeat-workspace-stable .lyrics-control-btn[aria-pressed="true"] { color: #fff !important; background: linear-gradient(135deg, var(--lifeat-accent), var(--lifeat-accent-2)) !important; border-color: rgba(249,115,154,.42) !important; }
    .lyrics-overlay .lyrics-settings { display: none !important; }
    @media (max-width: 820px) { :root { --lifeat-panel-left: 0; --lifeat-panel-width: 100vw; } .lifeat-rail { left: .55rem; right: .55rem; top: auto; bottom: .55rem; width: auto; grid-template-columns: minmax(0, 1fr) auto; grid-template-rows: auto; z-index: 3; } .lifeat-rail-group { grid-auto-flow: column; grid-auto-columns: max-content; } .lifeat-panel { top: 0; bottom: 5.4rem; border-right: 0; border-bottom: 1px solid rgba(15,23,42,.1); } .lifeat-minimize { display: none; } }
  `;
  document.head.append(style);
}

export default class LifeAtWorkspaceStable {
  constructor({ appShell, shell, centerCard, lyricsEngine, musicPlayer, clockWidget, creativeWidget, customizerPanel, backgroundEngine, config } = {}) {
    this.appShell = appShell || document.getElementById("appShell");
    this.shell = shell;
    this.centerCard = centerCard;
    this.lyricsEngine = lyricsEngine;
    this.musicPlayer = musicPlayer;
    this.clockWidget = clockWidget;
    this.creativeWidget = creativeWidget;
    this.customizerPanel = customizerPanel;
    this.backgroundEngine = backgroundEngine;
    this.config = config || {};
    this.state = this.readState();
    this.navButtons = new Map();
    this.sectionRefs = new Map();
    this.cleanups = [];
    this.timer = { interval: null, remaining: 0, mode: "Focus", isRunning: false };
  }

  init() {
    try {
      injectStyles();
      this.cacheSections();
      this.removeLegacyDashboards();
      this.hideLegacyCustomizer();
      this.repairHiddenLayout();
      this.buildWorkspace();
      this.attachGlobalEvents();
      this.applyProfileState(this.getProfileState());
      this.applyIntroStyle(this.getIntroStyle());
      this.syncRailState();
      this.restoreLastPanel();
    } catch (error) {
      console.error("LifeAt workspace failed to initialize.", error);
      this.renderEmergencyLauncher(error);
    }
  }

  readState() {
    const defaults = {
      collapsed: false,
      activePanel: null,
      activeTabs: { spaces: "Videos", sounds: "Player", calendar: "Today", timer: "Focus", tasks: "Widget", notes: "Intro", lyrics: "Text", profile: "Card", layout: "Visibility" }
    };
    const state = { ...defaults, ...readJson(STATE_KEY, {}) };
    state.activeTabs = { ...defaults.activeTabs, ...(state.activeTabs || {}) };
    if (state.activePanel === "background") state.activePanel = "spaces";
    if (state.activePanel === "music") state.activePanel = "sounds";
    if (state.activePanel === "media") state.activePanel = "lyrics";
    return state;
  }

  writeState() { writeJson(STATE_KEY, this.state); }

  cacheSections() {
    document.querySelectorAll(".customizer-section[data-panel]").forEach((section) => this.sectionRefs.set(section.dataset.panel, section));
    this.lyricsSettings = document.getElementById("lyricsSettings");
  }

  removeLegacyDashboards() {
    document.querySelectorAll(".legacy-dashboard-dock, .legacy-dashboard-window, .dashboard-sidebar, .dashboard-window, .lifeat-workspace").forEach((node) => node.remove());
    document.body.classList.remove("lifeat-panel-open");
  }

  hideLegacyCustomizer() {
    document.getElementById("openCustomizerButton")?.setAttribute("hidden", "");
    const panel = document.getElementById("customizerPanel");
    if (panel) panel.hidden = true;
    if (this.customizerPanel?.root) this.customizerPanel.root.hidden = true;
  }

  repairHiddenLayout() {
    const layout = readJson(CUSTOMIZER_LAYOUT_KEY, null);
    if (layout && typeof layout === "object") {
      layout.hideProfileCard = false;
      layout.hideShellCopy = false;
      writeJson(CUSTOMIZER_LAYOUT_KEY, layout);
    }
    this.setElementVisible("cardRoot", true);
    this.setElementVisible("shellCopy", true);
  }

  setElementVisible(id, visible) {
    const node = document.getElementById(id);
    if (!node) return;
    node.hidden = !visible;
    node.style.display = visible ? "" : "none";
    node.removeAttribute("aria-hidden");
  }

  buildWorkspace() {
    document.querySelectorAll(".lifeat-workspace-stable").forEach((node) => node.remove());
    this.root = el("div", "lifeat-workspace-stable", { "aria-label": "LifeAt workspace" });
    this.rail = el("nav", "lifeat-rail", { "aria-label": "Workspace navigation" });
    this.topGroup = el("div", "lifeat-rail-group");
    this.mainGroup = el("div", "lifeat-rail-group");
    this.bottomGroup = el("div", "lifeat-rail-group");
    NAV_ITEMS.forEach((item) => {
      const button = this.createNavButton(item);
      this.navButtons.set(item.id, button);
      (item.id === "spaces" ? this.topGroup : this.mainGroup).append(button);
    });
    this.collapseButton = el("button", "lifeat-collapse-button", { type: "button", title: "Collapse navigation", "aria-label": "Collapse navigation", html: `<span class="lifeat-nav-icon">...</span><span class="lifeat-nav-label">More</span>` });
    this.collapseButton.addEventListener("click", () => this.toggleRail());
    this.bottomGroup.append(this.collapseButton);
    this.panel = this.createPanel();
    this.rail.append(this.topGroup, this.mainGroup, this.bottomGroup);
    this.root.append(this.rail, this.panel);
    document.body.append(this.root);
  }

  createNavButton(item) {
    const button = el("button", "lifeat-nav-button", { type: "button", title: item.label, "aria-label": item.label, html: `<span class="lifeat-nav-icon" aria-hidden="true">${item.icon}</span><span class="lifeat-nav-label">${item.label}</span>` });
    button.addEventListener("click", () => this.openPanel(item.id));
    return button;
  }

  createPanel() {
    const panel = el("aside", "lifeat-panel", { role: "dialog", "aria-label": "Workspace panel", "aria-modal": "false" });
    panel.innerHTML = `
      <button class="lifeat-minimize" type="button" aria-label="Collapse panel">◀</button>
      <header class="lifeat-panel-header">
        <div class="lifeat-panel-tabbar" data-tabs></div>
        <div class="lifeat-header-row">
          <label class="lifeat-search"><span aria-hidden="true">⌕</span><input type="search" data-search placeholder="Search"></label>
          <button class="lifeat-close" type="button" data-close aria-label="Close panel">×</button>
        </div>
        <div class="lifeat-row" data-chips hidden></div>
      </header>
      <div class="lifeat-panel-body" data-body></div>
    `;
    this.tabsMount = panel.querySelector("[data-tabs]");
    this.searchInput = panel.querySelector("[data-search]");
    this.chipsMount = panel.querySelector("[data-chips]");
    this.panelBody = panel.querySelector("[data-body]");
    panel.querySelector("[data-close]")?.addEventListener("click", () => this.closePanel());
    panel.querySelector(".lifeat-minimize")?.addEventListener("click", () => this.closePanel());
    this.searchInput?.addEventListener("input", () => this.handleSearch());
    return panel;
  }

  attachGlobalEvents() {
    document.getElementById("lyricsTuneBtn")?.addEventListener("click", (event) => { event.preventDefault(); this.openPanel("lyrics"); });
    this.appShell?.addEventListener("profile:open-customizer-tab", (event) => {
      const tabId = event.detail?.tabId || "sounds";
      const map = { background: "spaces", music: "sounds", lyrics: "lyrics", layout: "layout" };
      this.openPanel(map[tabId] || tabId);
    });
  }

  restoreLastPanel() {
    if (this.state.activePanel && TABS[this.state.activePanel]) this.openPanel(this.state.activePanel, { silent: true });
  }

  toggleRail() { this.state.collapsed = !this.state.collapsed; this.writeState(); this.syncRailState(); }
  syncRailState() { this.root?.classList.toggle("is-collapsed", Boolean(this.state.collapsed)); }

  openPanel(panelId, { silent = false } = {}) {
    if (!TABS[panelId]) return;
    if (this.state.activePanel === panelId && this.panel?.classList.contains("is-open") && !silent) { this.closePanel(); return; }
    this.cleanupPanel();
    this.state.activePanel = panelId;
    this.writeState();
    this.panel.classList.add("is-open");
    this.renderHeader(panelId);
    this.renderPanel(panelId);
    this.syncActiveNav(panelId);
    this.shell?.setStatus?.(`${NAV_ITEMS.find((item) => item.id === panelId)?.label || panelId} opened.`);
  }

  closePanel() { this.cleanupPanel(); this.panel?.classList.remove("is-open"); this.state.activePanel = null; this.writeState(); this.syncActiveNav(null); }
  cleanupPanel() { this.cleanups.forEach((cleanup) => cleanup()); this.cleanups = []; }
  addCleanup(cleanup) { this.cleanups.push(cleanup); }
  syncActiveNav(panelId) { this.navButtons.forEach((button, id) => { button.classList.toggle("is-active", id === panelId); button.setAttribute("aria-pressed", id === panelId ? "true" : "false"); }); }

  getActiveTab(panelId) { const tabs = TABS[panelId] || ["Main"]; const active = this.state.activeTabs?.[panelId]; return tabs.includes(active) ? active : tabs[0]; }
  setActiveTab(panelId, tab) { this.state.activeTabs = { ...(this.state.activeTabs || {}), [panelId]: tab }; this.writeState(); this.renderHeader(panelId); this.renderPanel(panelId); }

  renderHeader(panelId) {
    const tabs = TABS[panelId] || ["Main"];
    const activeTab = this.getActiveTab(panelId);
    this.tabsMount.replaceChildren(...tabs.map((tab) => {
      const button = el("button", `lifeat-tab${tab === activeTab ? " is-active" : ""}`, { type: "button", text: tab });
      button.addEventListener("click", () => this.setActiveTab(panelId, tab));
      return button;
    }));
    this.searchInput.value = "";
    this.searchInput.placeholder = panelId === "spaces" ? "Search space" : `Search ${panelId}`;
    this.chipsMount.hidden = true;
    this.chipsMount.replaceChildren();
  }

  renderPanel(panelId) {
    this.panelBody.replaceChildren();
    try {
      ({ spaces: () => this.renderSpaces(), sounds: () => this.renderSounds(), calendar: () => this.renderCalendar(), timer: () => this.renderTimer(), tasks: () => this.renderTasks(), notes: () => this.renderNotes(), lyrics: () => this.renderLyrics(), profile: () => this.renderProfile(), layout: () => this.renderLayout() }[panelId])?.();
    } catch (error) {
      console.error(`Could not render ${panelId} panel.`, error);
      this.panelBody.append(this.createCard("Panel error", error?.message || "Unknown error"));
    }
  }

  createCard(title, text = "", flat = false) { const card = el("section", `lifeat-card${flat ? " lifeat-card-flat" : ""}`); if (title) card.append(el("p", "lifeat-title", { text: title })); if (text) card.append(el("p", "lifeat-muted", { text })); return card; }
  createField(label, input) { const field = el("label", "lifeat-field"); field.append(el("span", "lifeat-label", { text: label }), input); return field; }
  createInput(value, onInput, type = "text") { const input = el("input", "lifeat-input", { type }); input.value = value || ""; input.addEventListener("input", () => onInput(input.value)); return input; }
  createTextarea(value, onInput) { const input = el("textarea", "lifeat-textarea"); input.value = value || ""; input.addEventListener("input", () => onInput(input.value)); return input; }
  createAction(label, onClick, primary = false) { const button = el("button", `lifeat-action${primary ? " lifeat-action-primary" : ""}`, { type: "button", text: label }); button.addEventListener("click", onClick); return button; }

  renderSpaces() {
    const tab = this.getActiveTab("spaces");
    this.panelBody.append(this.createCard("Spaces", "Background is merged into Spaces. There is no separate Background module anymore."));
    const typeByTab = { Videos: "video", Images: "image", Effects: "effects" };
    this.panelBody.append(this.createSpaceGrid(typeByTab[tab] || "video"));
    const advanced = this.createCard("Space fine tuning", "Original background controls are available here.", true);
    this.appendCustomizerSection(advanced, "background");
    this.panelBody.append(advanced);
  }

  createSpaceGrid(type) {
    const grid = el("div", "lifeat-spaces-grid", { "data-filterable": "spaces" });
    const cards = this.getSpaceCards().filter((card) => card.type === type);
    if (!cards.length) { grid.append(el("p", "lifeat-muted", { text: "No spaces found." })); return grid; }
    cards.forEach((card) => {
      const button = el("button", "lifeat-space-card", { type: "button", dataset: { search: `${card.label} ${card.type}`.toLowerCase() } });
      const thumbClass = card.type === "image" ? "lifeat-space-thumb lifeat-space-thumb-image" : card.type === "effects" ? "lifeat-space-thumb lifeat-space-thumb-effects" : "lifeat-space-thumb";
      button.append(el("span", thumbClass), el("span", "lifeat-space-name", { text: card.label }));
      button.addEventListener("click", () => this.applySpaceCard(card));
      grid.append(button);
    });
    return grid;
  }

  getSpaceCards() {
    const background = this.config.background || {};
    return [
      ...(background.video?.scenes || []).map((scene, index) => ({ type: "video", label: scene.label, index })),
      ...(background.image?.scenes || []).map((scene, index) => ({ type: "image", label: scene.label, index })),
      ...(background.effects?.presets || []).map((preset) => ({ type: "effects", label: preset.label, preset: preset.id }))
    ];
  }

  applySpaceCard(card) {
    if (card.type === "video") { this.backgroundEngine?.setMode?.("video", true); this.backgroundEngine?.setVideoScene?.(card.index, true); }
    else if (card.type === "image") { this.backgroundEngine?.setMode?.("image", true); this.backgroundEngine?.setImageScene?.(card.index, true); }
    else if (card.type === "effects") { this.backgroundEngine?.setMode?.("effects", true); this.backgroundEngine?.setEffectPreset?.(card.preset, true); }
  }

  renderSounds() { const tab = this.getActiveTab("sounds"); if (tab === "Library") return this.renderSoundLibrary(); if (tab === "Upload") return this.renderSoundUpload(); return this.renderSoundPlayer(); }

  renderSoundPlayer() {
    const card = this.createCard("Player", "Only the currently playing Module 04 track is shown here.");
    const player = el("div", "lifeat-mini-player");
    player.innerHTML = `<div class="lifeat-now-row"><div class="lifeat-artwork" data-artwork>--</div><div class="lifeat-track-copy"><strong class="lifeat-track-title" data-title>--</strong><span class="lifeat-track-artist" data-artist>--</span></div><span class="lifeat-track-artist" data-state>idle</span></div><div class="lifeat-progress"><span class="lifeat-progress-fill" data-progress></span></div><div class="lifeat-time-row"><span data-current>0:00</span><span data-duration>0:00</span></div>`;
    const actions = el("div", "lifeat-actions");
    actions.append(this.createProxyAction("Prev", "musicPrevBtn"), this.createProxyAction("Play / Pause", "musicPlayBtn", true), this.createProxyAction("Next", "musicNextBtn"), this.createAction("Show Module 4", () => this.setElementVisible("musicDock", true)));
    player.append(actions);
    card.append(player);
    this.panelBody.append(card);
    this.bindMiniPlayer(player);
  }

  createProxyAction(label, id, primary = false) { return this.createAction(label, () => document.getElementById(id)?.click(), primary); }

  bindMiniPlayer(player) {
    const audio = document.getElementById("musicAudio");
    const update = () => {
      const track = this.musicPlayer?.getCurrentTrack?.() || {};
      const title = track.title || document.getElementById("musicTrackName")?.textContent || "No track";
      const artist = track.artist || document.getElementById("musicTrackArtist")?.textContent || "Unknown artist";
      const duration = Number.isFinite(audio?.duration) ? audio.duration : 0;
      const current = Number.isFinite(audio?.currentTime) ? audio.currentTime : 0;
      const ratio = duration > 0 ? clamp(current / duration, 0, 1) : 0;
      player.querySelector("[data-title]").textContent = title;
      player.querySelector("[data-artist]").textContent = artist;
      player.querySelector("[data-state]").textContent = audio?.paused ? "paused" : "playing";
      player.querySelector("[data-artwork]").textContent = title.slice(0, 2).toUpperCase();
      player.querySelector("[data-current]").textContent = formatTime(current);
      player.querySelector("[data-duration]").textContent = formatTime(duration);
      player.querySelector("[data-progress]").style.width = `${Math.round(ratio * 100)}%`;
    };
    update();
    if (!audio) return;
    const events = ["timeupdate", "play", "pause", "loadedmetadata", "durationchange"];
    events.forEach((name) => audio.addEventListener(name, update));
    this.addCleanup(() => events.forEach((name) => audio.removeEventListener(name, update)));
  }

  renderSoundLibrary() {
    const card = this.createCard("Library", "Saved and built-in tracks. Upload controls are not mixed into this tab.");
    const list = el("div", "lifeat-task-list", { "data-filterable": "tracks" });
    const tracks = this.musicPlayer?.getPlaylist?.() || [];
    tracks.forEach((track, index) => list.append(this.createTrackRow(track, index)));
    if (!tracks.length) list.append(el("p", "lifeat-muted", { text: "No tracks loaded." }));
    card.append(list);
    const savedLibrary = document.getElementById("customTrackLibrary");
    if (savedLibrary) { savedLibrary.hidden = false; card.append(savedLibrary); }
    this.panelBody.append(card);
  }

  createTrackRow(track, index) {
    const button = el("button", "lifeat-track-row", { type: "button", dataset: { search: `${track.title || ""} ${track.artist || ""}`.toLowerCase() } });
    button.append(el("span", "lifeat-track-index", { text: track.isPersistedCustom ? "UP" : String(index + 1).padStart(2, "0") }), el("span", "lifeat-track-copy", { html: `<strong class="lifeat-track-title"></strong><span class="lifeat-track-artist"></span>` }), el("span", "lifeat-track-artist", { text: track.isPersistedCustom ? "Saved" : "Built-in" }));
    button.querySelector("strong").textContent = track.title || "Untitled";
    button.querySelector(".lifeat-track-copy span").textContent = track.artist || "Unknown artist";
    button.addEventListener("click", () => this.musicPlayer?.loadTrackById?.(track.id, true));
    return button;
  }

  renderSoundUpload() {
    const card = this.createCard("Upload", "Add MP3, LRC and lyrics_pro JSON here. Saved tracks appear in Library.");
    this.appendExistingControls(card, ["customTrackTitle", "customTrackArtist", "customAudioFile", "customLyricsFile", "customLyricsProFile", "applyCustomTrackBtn", "customTrackStatus"]);
    this.panelBody.append(card);
  }

  renderLyrics() {
    const tab = this.getActiveTab("lyrics");
    this.panelBody.append(this.createCard("Lyric", "Dedicated Lyric controls split into Text, Effect, Timing and Burst."));
    const quick = this.createCard("Quick mode", "These buttons mirror the lyric overlay controls.", true);
    const actions = el("div", "lifeat-actions");
    [["Box", "lyricsBoxBtn"], ["Pure", "lyricsPureBtn"], ["Kinetic", "lyricsKineticBtn"], ["Reset", "lyricsResetBtn"], ["Focus", "lyricsFocusBtn"]].forEach(([label, id], index) => actions.append(this.createProxyAction(label, id, index === 0)));
    quick.append(actions);
    this.panelBody.append(quick);
    const controls = this.createCard(`${tab} controls`, "", true);
    if (this.lyricsSettings) this.lyricsSettings.hidden = false;
    this.appendExistingControls(controls, LYRIC_GROUPS[tab] || LYRIC_GROUPS.Text);
    this.panelBody.append(controls);
  }

  renderProfile() { const tab = this.getActiveTab("profile"); if (tab === "Links") return this.renderProfileLinks(); if (tab === "View") return this.renderProfileView(); return this.renderProfileEditor(); }

  getProfileDefaults() {
    const profile = this.config.profile || {};
    const links = Object.fromEntries((profile.socialLinks || []).map((link) => [link.id, link.href || ""]));
    return { label: profile.label || "visual profile card", name: profile.name || "Tuan Anh", tagline: profile.tagline || "Mood-first interface designer", bio: profile.bio || "Profile bio", initials: profile.initials || "TA", avatar: profile.avatar || "./avatar.jpg", verified: profile.verified !== false, links };
  }
  getProfileState() { const defaults = this.getProfileDefaults(); const stored = readJson(PROFILE_KEY, {}); return { ...defaults, ...stored, links: { ...defaults.links, ...(stored.links || {}) } }; }
  saveProfileState(partial) { const state = { ...this.getProfileState(), ...partial }; writeJson(PROFILE_KEY, state); this.applyProfileState(state); }

  applyProfileState(state) {
    const setText = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value || ""; };
    setText("profileLabel", state.label); setText("profileName", state.name); setText("profileTagline", state.tagline); setText("profileBio", state.bio); setText("avatarFallback", state.initials);
    const avatar = document.getElementById("profileAvatar"); if (avatar && state.avatar) avatar.src = state.avatar;
    const badge = document.getElementById("profileBadge"); if (badge) badge.hidden = !state.verified;
    document.querySelectorAll("#profileSocialLinks a").forEach((anchor) => {
      const label = (anchor.getAttribute("aria-label") || "").toLowerCase();
      const key = label.includes("facebook") ? "facebook" : label.includes("tiktok") ? "tiktok" : label.includes("github") ? "github" : null;
      if (key && state.links?.[key]) anchor.href = state.links[key];
    });
  }

  renderProfileEditor() {
    const state = this.getProfileState();
    const card = this.createCard("Profile card", "Edit the visible profile card content. Use View if the card is hidden.");
    card.append(this.createField("Label", this.createInput(state.label, (value) => this.saveProfileState({ label: value }))), this.createField("Name", this.createInput(state.name, (value) => this.saveProfileState({ name: value }))), this.createField("Tagline", this.createTextarea(state.tagline, (value) => this.saveProfileState({ tagline: value }))), this.createField("Bio", this.createTextarea(state.bio, (value) => this.saveProfileState({ bio: value }))), this.createField("Initials", this.createInput(state.initials, (value) => this.saveProfileState({ initials: value.slice(0, 4).toUpperCase() }))), this.createField("Avatar URL", this.createInput(state.avatar, (value) => this.saveProfileState({ avatar: value }))));
    const row = el("div", "lifeat-actions"); row.append(this.createAction("Show card", () => this.showProfileCard(), true), this.createAction("Center card", () => this.centerCard?.resetCard?.(true))); card.append(row);
    this.panelBody.append(card);
  }

  renderProfileLinks() {
    const state = this.getProfileState();
    const card = this.createCard("Profile links", "Update social links inside the profile card.");
    ["facebook", "tiktok", "github"].forEach((key) => card.append(this.createField(key, this.createInput(state.links?.[key] || "", (value) => { const next = this.getProfileState(); this.saveProfileState({ links: { ...next.links, [key]: value } }); }, "url"))));
    this.panelBody.append(card);
  }

  renderProfileView() {
    const card = this.createCard("Profile view", "Restore the card if it was hidden by Layout.");
    const row = el("div", "lifeat-actions"); row.append(this.createAction("Show card", () => this.showProfileCard(), true), this.createAction("Hide card", () => this.setProfileHidden(true)), this.createAction("Center card", () => this.centerCard?.resetCard?.(true))); card.append(row); this.panelBody.append(card);
  }
  showProfileCard() { this.setProfileHidden(false); this.centerCard?.resetCard?.(true); }
  setProfileHidden(hidden) { const toggle = document.getElementById("toggleProfileCard"); if (toggle && toggle.checked !== hidden) { toggle.checked = hidden; toggle.dispatchEvent(new Event("change", { bubbles: true })); } this.setElementVisible("cardRoot", !hidden); }

  renderTasks() { const tab = this.getActiveTab("tasks"); if (tab === "Tasks") return this.renderTaskList(); return this.renderCreativeWidgetEditor(); }
  renderCreativeWidgetEditor() {
    const state = this.creativeWidget?.getState?.() || {};
    const card = this.createCard("Creative Widget", "Tasks are connected to the Creative Widget. Edit the widget or send task list to it.");
    card.append(this.createField("Widget title", this.createInput(state.title || "", (value) => this.creativeWidget?.setContent?.({ title: value }, true))), this.createField("Widget text", this.createTextarea(state.body || "", (value) => this.creativeWidget?.setContent?.({ body: value }, true))));
    const row = el("div", "lifeat-actions"); row.append(this.createAction("Send active tasks to widget", () => this.sendTasksToCreativeWidget(), true), this.createAction("Show widget", () => this.setElementVisible("creativeWidget", true))); card.append(row); this.panelBody.append(card);
  }

  renderTaskList() {
    const tasks = readJson(TASKS_KEY, []);
    const card = this.createCard("Tasks", "Local tasks. Send them to Creative Widget when needed.");
    const form = el("form", "lifeat-actions");
    const input = el("input", "lifeat-input", { name: "task", placeholder: "Add a task", autocomplete: "off" });
    const submit = this.createAction("Add", () => {}, true);
    form.append(input, submit);
    form.addEventListener("submit", (event) => { event.preventDefault(); const text = input.value.trim(); if (!text) return; tasks.unshift({ text, done: false, createdAt: Date.now() }); writeJson(TASKS_KEY, tasks); input.value = ""; this.renderPanel("tasks"); });
    card.append(form, this.createTaskList(tasks));
    const row = el("div", "lifeat-actions"); row.append(this.createAction("Send to Creative Widget", () => this.sendTasksToCreativeWidget(), true)); card.append(row); this.panelBody.append(card);
  }

  createTaskList(tasks) {
    const list = el("div", "lifeat-task-list");
    if (!tasks.length) { list.append(el("p", "lifeat-muted", { text: "No tasks yet." })); return list; }
    tasks.forEach((task, index) => {
      const item = el("label", `lifeat-task-item${task.done ? " is-done" : ""}`);
      item.innerHTML = `<input type="checkbox" ${task.done ? "checked" : ""}><span></span><button class="lifeat-task-remove" type="button" aria-label="Remove task">x</button>`;
      item.querySelector("span").textContent = task.text;
      item.querySelector("input").addEventListener("change", (event) => { tasks[index].done = event.target.checked; writeJson(TASKS_KEY, tasks); this.renderPanel("tasks"); });
      item.querySelector("button").addEventListener("click", () => { tasks.splice(index, 1); writeJson(TASKS_KEY, tasks); this.renderPanel("tasks"); });
      list.append(item);
    });
    return list;
  }

  sendTasksToCreativeWidget() { const tasks = readJson(TASKS_KEY, []); const active = tasks.filter((task) => !task.done).map((task) => `- ${task.text}`); this.creativeWidget?.setContent?.({ title: "Tasks", body: active.length ? active.join("\n") : "No active tasks." }, true); this.setElementVisible("creativeWidget", true); this.shell?.setStatus?.("Creative Widget updated from Tasks."); }

  renderNotes() { const tab = this.getActiveTab("notes"); if (tab === "Style") return this.renderIntroStyleEditor(); if (tab === "Notes") return this.renderPlainNotes(); return this.renderIntroEditor(); }
  renderIntroEditor() {
    const state = this.shell?.getCopyState?.() || {};
    const card = this.createCard("Intro panel", "Notes controls the intro panel: show, hide and edit content.");
    card.append(this.createField("Intro title", this.createInput(state.title || "", (value) => this.shell?.setCopyContent?.({ title: value }, true))), this.createField("Intro lead", this.createTextarea(state.lead || "", (value) => this.shell?.setCopyContent?.({ lead: value }, true))));
    const row = el("div", "lifeat-actions"); row.append(this.createAction("Show intro panel", () => this.setIntroHidden(false), true), this.createAction("Hide intro panel", () => this.setIntroHidden(true))); card.append(row); this.panelBody.append(card);
  }
  setIntroHidden(hidden) { const toggle = document.getElementById("toggleShellCopy"); if (toggle && toggle.checked !== hidden) { toggle.checked = hidden; toggle.dispatchEvent(new Event("change", { bubbles: true })); } this.setElementVisible("shellCopy", !hidden); }

  getIntroStyle() { return { textColor: "#f7fbff", backgroundColor: "#0f172a", accentColor: "#9feeff", opacity: 0.72, fontFamily: "Plus Jakarta Sans, Outfit, system-ui, sans-serif", ...readJson(INTRO_STYLE_KEY, {}) }; }
  saveIntroStyle(partial) { const style = { ...this.getIntroStyle(), ...partial }; style.opacity = clamp(Number(style.opacity) || 0.72, 0.2, 1); writeJson(INTRO_STYLE_KEY, style); this.applyIntroStyle(style); }
  applyIntroStyle(style = this.getIntroStyle()) { const panel = this.shell?.copyPanel || document.getElementById("shellCopyPanel"); const title = document.getElementById("shellTitle"); const lead = document.getElementById("shellLead"); if (!panel) return; panel.style.background = hexToRgba(style.backgroundColor, style.opacity); panel.style.borderColor = hexToRgba(style.accentColor, 0.38); panel.style.color = style.textColor; panel.style.fontFamily = style.fontFamily; [title, lead].forEach((node) => { if (!node) return; node.style.color = style.textColor; node.style.fontFamily = style.fontFamily; }); }

  renderIntroStyleEditor() {
    const style = this.getIntroStyle();
    const card = this.createCard("Intro style", "Change intro panel color, font and opacity.");
    const textColor = this.createInput(style.textColor, (value) => this.saveIntroStyle({ textColor: value }), "color");
    const backgroundColor = this.createInput(style.backgroundColor, (value) => this.saveIntroStyle({ backgroundColor: value }), "color");
    const accentColor = this.createInput(style.accentColor, (value) => this.saveIntroStyle({ accentColor: value }), "color");
    const opacity = el("input", "lifeat-input", { type: "range", min: "20", max: "100", step: "1" }); opacity.value = String(Math.round(style.opacity * 100)); opacity.addEventListener("input", () => this.saveIntroStyle({ opacity: Number(opacity.value) / 100 }));
    const font = el("select", "lifeat-select");
    [["Plus Jakarta Sans, Outfit, system-ui, sans-serif", "Jakarta / Outfit"], ["Space Grotesk, Outfit, sans-serif", "Space Grotesk"], ["Sora, Outfit, sans-serif", "Sora"], ["Spectral, Georgia, serif", "Spectral"], ["Times New Roman, Times, serif", "Times New Roman"]].forEach(([value, label]) => font.append(el("option", "", { value, text: label })));
    font.value = style.fontFamily; font.addEventListener("change", () => this.saveIntroStyle({ fontFamily: font.value }));
    card.append(this.createField("Text color", textColor), this.createField("Background", backgroundColor), this.createField("Accent", accentColor), this.createField("Opacity", opacity), this.createField("Font", font));
    this.panelBody.append(card);
  }

  renderPlainNotes() { const card = this.createCard("Notes", "Local notes saved in this browser."); const textarea = el("textarea", "lifeat-textarea", { placeholder: "Write notes..." }); textarea.value = localStorage.getItem(NOTES_KEY) || ""; textarea.addEventListener("input", () => localStorage.setItem(NOTES_KEY, textarea.value)); card.append(textarea); this.panelBody.append(card); }

  renderCalendar() {
    const card = this.createCard("Calendar");
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh";
    const select = el("select", "lifeat-select");
    [...new Set([zone, "Asia/Ho_Chi_Minh", "Asia/Tokyo", "Europe/London", "America/New_York"])].forEach((item) => select.append(el("option", "", { value: item, text: item })));
    const clock = el("div", "lifeat-clock-large", { text: "--:--" }); const date = el("p", "lifeat-muted");
    const update = () => { const timeZone = select.value; const now = new Date(); clock.textContent = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone }).format(now); date.textContent = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone }).format(now); };
    select.addEventListener("change", update); update(); const interval = setInterval(update, 1000); this.addCleanup(() => clearInterval(interval));
    card.append(clock, date, this.createField("Timezone", select)); this.panelBody.append(card);
  }

  renderTimer() {
    const mode = this.getActiveTab("timer"); const defaults = { Focus: 25, Break: 5, Long: 15 }; const stored = readJson(TIMER_KEY, {}); const minutes = Number(stored[mode]) || defaults[mode] || 25;
    if (this.timer.mode !== mode || !this.timer.remaining) { clearInterval(this.timer.interval); this.timer = { interval: null, remaining: minutes * 60, mode, isRunning: false }; }
    const card = this.createCard(`${mode} timer`); const display = el("div", "lifeat-clock-large"); const input = el("input", "lifeat-input", { type: "number", min: "1", max: "180" }); input.value = String(minutes);
    const render = () => { display.textContent = `${String(Math.floor(this.timer.remaining / 60)).padStart(2, "0")}:${String(Math.floor(this.timer.remaining % 60)).padStart(2, "0")}`; startButton.textContent = this.timer.isRunning ? "Pause" : "Start"; };
    const reset = () => { const nextMinutes = clamp(Number(input.value) || defaults[mode] || 25, 1, 180); writeJson(TIMER_KEY, { ...readJson(TIMER_KEY, {}), [mode]: nextMinutes }); clearInterval(this.timer.interval); this.timer = { interval: null, remaining: nextMinutes * 60, mode, isRunning: false }; render(); };
    const tick = () => { if (this.timer.remaining <= 0) { clearInterval(this.timer.interval); this.timer.isRunning = false; this.shell?.setStatus?.(`${mode} timer finished.`); render(); return; } this.timer.remaining -= 1; render(); };
    const startButton = this.createAction("Start", () => { this.timer.isRunning = !this.timer.isRunning; clearInterval(this.timer.interval); if (this.timer.isRunning) this.timer.interval = setInterval(tick, 1000); render(); }, true);
    const resetButton = this.createAction("Reset", () => reset()); input.addEventListener("change", reset); render();
    const row = el("div", "lifeat-actions"); row.append(startButton, resetButton); card.append(display, this.createField("Minutes", input), row); this.panelBody.append(card);
  }

  renderLayout() { this.panelBody.append(this.createCard("Layout", "Visibility controls only. Profile, Lyric and Spaces have dedicated toolbar items.")); const section = this.sectionRefs.get("layout"); if (!section) { this.panelBody.append(this.createCard("Missing layout", "Could not find data-panel=layout.")); return; } section.hidden = false; section.classList.add("is-active"); this.panelBody.append(section); }

  appendCustomizerSection(target, panelName) { const section = this.sectionRefs.get(panelName); if (!section) { target.append(el("p", "lifeat-muted", { text: `Missing customizer section: ${panelName}` })); return; } section.hidden = false; section.classList.add("is-active"); target.append(section); }
  appendExistingControls(target, ids) { ids.forEach((id) => { const node = document.getElementById(id); const container = node?.closest(".customizer-field, .customizer-actions, .customizer-upload-status, .customizer-library, .lyrics-setting") || node; if (!container) return; if (container.hidden) container.hidden = false; target.append(container); }); }
  handleSearch() { const term = (this.searchInput?.value || "").trim().toLowerCase(); this.panelBody?.querySelectorAll("[data-filterable] [data-search]").forEach((item) => { item.hidden = Boolean(term) && !item.dataset.search.includes(term); }); }

  renderEmergencyLauncher(error) { const launcher = el("button", "", { type: "button", text: "Open Tools" }); launcher.style.cssText = "position:fixed;left:12px;top:12px;z-index:2147482500;padding:12px 14px;border-radius:999px;border:0;background:#fff;color:#111;font:700 13px system-ui;box-shadow:0 18px 44px rgba(0,0,0,.22);"; launcher.addEventListener("click", () => alert(error?.message || "Workspace failed to initialize.")); document.body.append(launcher); }
}
