const LIFEAT_STYLE_ID = "lifeatWorkspaceStyle";
const LIFEAT_STORAGE_KEY = "profile.lifeat.workspace";
const TASK_STORAGE_KEY = "profile.lifeat.tasks";
const NOTES_STORAGE_KEY = "profile.lifeat.notes";
const TIMER_STORAGE_KEY = "profile.lifeat.timerMinutes";

const NAV_ITEMS = [
    { id: "spaces", label: "Spaces", shortLabel: "Spaces", icon: "🌐", panel: "background" },
    { id: "sounds", label: "Sounds", shortLabel: "Sounds", icon: "🔊", panel: "music" },
    { id: "cal", label: "Cal", shortLabel: "Cal", icon: "📅", panel: "calendar" },
    { id: "timer", label: "Timer", shortLabel: "Timer", icon: "⏱", panel: "timer" },
    { id: "tasks", label: "Tasks", shortLabel: "Tasks", icon: "✎", panel: "tasks" },
    { id: "notes", label: "Notes", shortLabel: "Notes", icon: "☰", panel: "notes" },
    { id: "media", label: "Media", shortLabel: "Media", icon: "▶", panel: "lyrics" },
    { id: "profile", label: "Profile", shortLabel: "Me", icon: "◎", panel: "layout" }
];

const SPACE_CATEGORIES = [
    { id: "all", label: "All", icon: "All" },
    { id: "nature", label: "Nature", icon: "🏔️" },
    { id: "cafe", label: "Cafe", icon: "☕" },
    { id: "minimal", label: "Minimal", icon: "▣" },
    { id: "flower", label: "Flower", icon: "🌸" },
    { id: "movie", label: "Movie", icon: "🎥" }
];

function createElement(tagName, className = "", attributes = {}) {
    const element = document.createElement(tagName);
    if (className) element.className = className;

    Object.entries(attributes).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (key === "text") element.textContent = value;
        else if (key === "html") element.innerHTML = value;
        else if (key === "dataset") Object.assign(element.dataset, value);
        else element.setAttribute(key, value);
    });

    return element;
}

function safeJsonParse(value, fallback) {
    try { return value ? JSON.parse(value) : fallback; }
    catch { return fallback; }
}

function injectLifeAtStyles() {
    if (document.getElementById(LIFEAT_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = LIFEAT_STYLE_ID;
    style.textContent = `
        :root {
            --lifeat-rail-width: 4.2rem;
            --lifeat-panel-left: 5.55rem;
            --lifeat-panel-width: min(23.5rem, calc(100vw - 6.4rem));
            --lifeat-panel-bg: rgba(255, 255, 255, 0.92);
            --lifeat-panel-border: rgba(15, 23, 42, 0.1);
            --lifeat-peach: #ff8f7a;
        }

        #openCustomizerButton,
        .customizer-panel { display: none !important; }

        .lifeat-workspace {
            position: fixed;
            inset: 0;
            z-index: 15000;
            pointer-events: none;
            color: #263142;
            font-family: "Inter", "Plus Jakarta Sans", "Outfit", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .lifeat-rail {
            position: fixed;
            left: 0.55rem;
            top: 0.55rem;
            bottom: 0.55rem;
            width: var(--lifeat-rail-width);
            display: grid;
            grid-template-rows: auto minmax(0, 1fr) auto;
            gap: 0.55rem;
            pointer-events: auto;
        }

        .lifeat-rail-group {
            display: grid;
            gap: 0.45rem;
            padding: 0.45rem;
            border-radius: 0.52rem;
            background: rgba(255, 255, 255, 0.96);
            border: 1px solid rgba(15, 23, 42, 0.08);
            box-shadow: 0 18px 44px rgba(15, 23, 42, 0.16);
            backdrop-filter: blur(20px) saturate(150%);
            -webkit-backdrop-filter: blur(20px) saturate(150%);
        }

        .lifeat-rail-group--scroll { align-content: start; overflow: auto; scrollbar-width: none; }
        .lifeat-rail-group--scroll::-webkit-scrollbar { display: none; }

        .lifeat-nav-button,
        .lifeat-collapse-button {
            width: 3.15rem;
            min-height: 3.15rem;
            display: grid;
            place-items: center;
            gap: 0.2rem;
            border: 0;
            border-radius: 0.38rem;
            color: rgba(32, 41, 57, 0.78);
            background: transparent;
            cursor: pointer;
            transition: background 180ms ease, color 180ms ease, transform 180ms ease;
        }

        .lifeat-nav-button:hover,
        .lifeat-nav-button.is-active,
        .lifeat-collapse-button:hover {
            color: var(--lifeat-peach);
            background: rgba(255, 143, 122, 0.11);
            transform: translateY(-1px);
        }

        .lifeat-nav-icon { font-size: 1.2rem; line-height: 1; }
        .lifeat-nav-label { max-width: 3rem; overflow: hidden; font-size: 0.68rem; font-weight: 650; line-height: 1.05; text-overflow: ellipsis; white-space: nowrap; }

        .lifeat-workspace.is-rail-collapsed { --lifeat-rail-width: 3.3rem; --lifeat-panel-left: 4.65rem; }
        .lifeat-workspace.is-rail-collapsed .lifeat-nav-label { display: none; }
        .lifeat-workspace.is-rail-collapsed .lifeat-nav-button,
        .lifeat-workspace.is-rail-collapsed .lifeat-collapse-button { width: 2.55rem; min-height: 2.55rem; }

        .lifeat-panel {
            position: fixed;
            left: var(--lifeat-panel-left);
            top: 0;
            bottom: 0;
            width: var(--lifeat-panel-width);
            display: grid;
            grid-template-rows: auto minmax(0, 1fr);
            pointer-events: auto;
            background: var(--lifeat-panel-bg);
            border-right: 1px solid var(--lifeat-panel-border);
            box-shadow: 22px 0 56px rgba(15, 23, 42, 0.18);
            backdrop-filter: blur(24px) saturate(145%);
            -webkit-backdrop-filter: blur(24px) saturate(145%);
            transform: translateX(-1rem);
            opacity: 0;
            visibility: hidden;
            transition: transform 180ms ease, opacity 180ms ease, visibility 180ms ease;
        }

        .lifeat-panel.is-open { transform: translateX(0); opacity: 1; visibility: visible; }
        .lifeat-panel-header { min-height: 4.6rem; display: grid; gap: 0.7rem; padding: 0.55rem 0.6rem 0.6rem; border-bottom: 1px solid rgba(15, 23, 42, 0.08); background: rgba(255, 255, 255, 0.68); }
        .lifeat-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.25rem; align-items: center; }
        .lifeat-tab, .lifeat-chip, .lifeat-panel-action { min-height: 2.15rem; border: 0; border-radius: 0.72rem; background: transparent; color: rgba(38, 49, 66, 0.78); cursor: pointer; font: inherit; font-size: 0.76rem; font-weight: 700; }
        .lifeat-tab:hover, .lifeat-tab.is-active, .lifeat-chip:hover, .lifeat-chip.is-active, .lifeat-panel-action:hover { background: rgba(15, 23, 42, 0.055); color: #111827; }
        .lifeat-search-row { display: flex; align-items: center; gap: 0.48rem; }
        .lifeat-search { flex: 1 1 auto; display: flex; align-items: center; gap: 0.42rem; min-width: 0; height: 2.35rem; padding: 0 0.72rem; border: 1px solid rgba(15, 23, 42, 0.12); border-radius: 0.32rem; background: rgba(255, 255, 255, 0.78); }
        .lifeat-search input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: #263142; font: inherit; font-size: 0.8rem; }
        .lifeat-close-button, .lifeat-panel-minimize { width: 2.2rem; height: 2.2rem; display: grid; place-items: center; border: 0; border-radius: 0.42rem; background: rgba(15, 23, 42, 0.08); color: rgba(31, 42, 58, 0.72); cursor: pointer; font-weight: 800; }
        .lifeat-panel-minimize { position: absolute; right: -1.55rem; top: 2.75rem; width: 1.55rem; border-radius: 0 0.42rem 0.42rem 0; box-shadow: 10px 0 22px rgba(15, 23, 42, 0.16); }
        .lifeat-panel-body { min-height: 0; overflow: auto; padding: 0.95rem 0.75rem 1.25rem; color: #263142; overscroll-behavior: contain; }
        .lifeat-panel-title { margin: 0 0 0.2rem; color: #263142; font-size: 0.96rem; font-weight: 800; letter-spacing: -0.01em; }
        .lifeat-muted { margin: 0; color: rgba(31, 42, 58, 0.64); font-size: 0.78rem; font-weight: 560; line-height: 1.45; }
        .lifeat-space-chips { display: flex; gap: 0.45rem; overflow-x: auto; padding-bottom: 0.3rem; scrollbar-width: none; }
        .lifeat-space-chips::-webkit-scrollbar { display: none; }
        .lifeat-chip { flex: 0 0 auto; min-width: 2.35rem; padding: 0 0.82rem; border: 1px solid rgba(15, 23, 42, 0.08); background: rgba(255, 255, 255, 0.62); }
        .lifeat-space-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem 0.65rem; margin-top: 0.85rem; }
        .lifeat-space-card { display: grid; gap: 0.32rem; min-width: 0; border: 0; background: transparent; color: inherit; padding: 0; text-align: left; cursor: pointer; }
        .lifeat-space-thumb { position: relative; min-height: 5.25rem; overflow: hidden; border-radius: 0.45rem; border: 1px solid rgba(15, 23, 42, 0.1); background: linear-gradient(135deg, rgba(125,211,252,.4), rgba(196,181,253,.55)); box-shadow: inset 0 1px 0 rgba(255,255,255,.45); }
        .lifeat-space-thumb--video { background: linear-gradient(135deg, rgba(45, 56, 86, 0.95), rgba(135, 92, 78, 0.75)); }
        .lifeat-space-thumb--image { background: linear-gradient(135deg, rgba(74, 124, 89, 0.86), rgba(172, 202, 135, 0.82)); }
        .lifeat-space-thumb--effects { background: radial-gradient(circle at 18% 20%, rgba(103,232,249,.72), transparent 20%), radial-gradient(circle at 78% 22%, rgba(216,180,254,.72), transparent 22%), linear-gradient(135deg, rgba(17,24,39,.92), rgba(79,70,229,.72)); }
        .lifeat-favorite { position: absolute; right: 0.4rem; top: 0.38rem; z-index: 1; color: rgba(255,255,255,.92); font-size: 1.08rem; text-shadow: 0 1px 10px rgba(0,0,0,.28); }
        .lifeat-space-name { max-width: 100%; overflow: hidden; color: #374151; font-size: 0.72rem; font-weight: 680; text-overflow: ellipsis; white-space: nowrap; }
        .lifeat-card, .lifeat-panel .customizer-section, .lifeat-panel .customizer-background-option, .lifeat-panel .lyrics-settings { border-radius: 1rem; border: 1px solid rgba(15, 23, 42, 0.08); background: rgba(255, 255, 255, 0.62); box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06); }
        .lifeat-card { display: grid; gap: 0.75rem; padding: 0.9rem; }
        .lifeat-panel .customizer-section, .lifeat-panel .customizer-background-option { display: grid !important; gap: 0.86rem !important; margin: 0.8rem 0 0 !important; padding: 0.85rem !important; color: #263142 !important; opacity: 1 !important; transform: none !important; pointer-events: auto !important; }
        .lifeat-panel .customizer-section[hidden], .lifeat-panel .customizer-background-option[hidden] { display: grid !important; }
        .lifeat-panel .customizer-tabs, .lifeat-panel .customizer-header { display: none !important; }
        .lifeat-panel .customizer-label, .lifeat-panel .lyrics-setting-label { color: rgba(31, 42, 58, 0.72) !important; }
        .lifeat-panel .customizer-input, .lifeat-panel .customizer-range, .lifeat-panel .lyrics-font-select, .lifeat-panel .lyrics-setting-input { color: #263142 !important; }
        .lifeat-panel .customizer-input, .lifeat-panel .lyrics-font-select { border-color: rgba(15,23,42,.12) !important; background: rgba(255,255,255,.82) !important; }
        .lifeat-panel .customizer-button, .lifeat-panel .background-switch-btn, .lifeat-panel .scene-nav-btn, .lifeat-panel .lyrics-control-btn { border-color: rgba(15,23,42,.12) !important; background: rgba(255,255,255,.75) !important; color: #263142 !important; }
        .lifeat-panel .customizer-button--primary, .lifeat-panel .background-switch-btn.is-active, .lifeat-panel .lyrics-control-btn--accent, .lifeat-panel .lyrics-control-btn[aria-pressed="true"] { color: #f8fafc !important; background: linear-gradient(135deg, #ff8f7a, #f9739a) !important; border-color: rgba(249,115,154,.42) !important; }
        .lifeat-lyrics-board { display: grid; gap: 0.75rem; }
        .lifeat-lyrics-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.35rem; padding: 0.35rem; border-radius: 0.9rem; background: rgba(15,23,42,.055); }
        .lifeat-lyrics-tab { min-height: 2.25rem; border: 0; border-radius: 0.68rem; background: transparent; color: rgba(31,42,58,.68); cursor: pointer; font-size: 0.72rem; font-weight: 800; }
        .lifeat-lyrics-tab.is-active { color: #111827; background: rgba(255,255,255,.86); box-shadow: 0 8px 20px rgba(15,23,42,.08); }
        .lifeat-panel .lyrics-settings { display: grid !important; position: static !important; width: 100% !important; max-width: none !important; grid-template-columns: 1fr !important; gap: 0 !important; padding: 0 !important; border: 0 !important; background: transparent !important; box-shadow: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
        .lifeat-lyrics-mode { display: none; gap: 0.72rem; padding: 0.86rem; border-radius: 1rem; border: 1px solid rgba(15,23,42,.08); background: rgba(255,255,255,.62); }
        .lifeat-lyrics-mode.is-active { display: grid; }
        .lifeat-lyrics-mode-title { margin: 0; color: #1f2937; font-size: 0.82rem; font-weight: 850; }
        .lifeat-panel .lyrics-setting { display: grid !important; gap: 0.38rem !important; padding: 0.66rem !important; border-radius: 0.78rem !important; background: rgba(15,23,42,.045) !important; }
        .lifeat-panel .lyrics-setting--toggle, .lifeat-panel .lyrics-setting--color, .lifeat-panel .lyrics-setting--select { grid-template-columns: 1fr auto !important; align-items: center !important; }
        .lifeat-clock-large { font-size: clamp(2.4rem, 11vw, 4rem); font-weight: 850; letter-spacing: -0.08em; color: #111827; }
        .lifeat-input, .lifeat-textarea, .lifeat-select { width: 100%; border: 1px solid rgba(15,23,42,.12); border-radius: .78rem; background: rgba(255,255,255,.86); color: #263142; font: inherit; outline: 0; padding: .68rem .78rem; }
        .lifeat-textarea { min-height: 15rem; resize: vertical; }
        .lifeat-action-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .lifeat-action { min-height: 2.35rem; padding: 0 .9rem; border: 1px solid rgba(15,23,42,.11); border-radius: 999px; background: rgba(255,255,255,.78); color: #263142; cursor: pointer; font: inherit; font-size: .76rem; font-weight: 800; }
        .lifeat-action--primary { color: #fff; background: linear-gradient(135deg, #ff8f7a, #f9739a); border-color: rgba(249,115,154,.38); }
        .lifeat-task-list { display: grid; gap: .55rem; }
        .lifeat-task-item { display: grid; grid-template-columns: auto 1fr auto; gap: .55rem; align-items: center; padding: .55rem; border-radius: .76rem; background: rgba(15,23,42,.045); }
        .lifeat-task-item.is-done span { color: rgba(31,42,58,.42); text-decoration: line-through; }
        .lifeat-task-remove { border: 0; background: transparent; color: rgba(31,42,58,.52); cursor: pointer; font-weight: 900; }
        .lyrics-overlay .lyrics-settings { display: none !important; }
        .lyrics-overlay .lyrics-control-btn#lyricsTuneBtn { display: inline-grid !important; }

        @media (max-width: 820px) {
            :root { --lifeat-panel-left: 0; --lifeat-panel-width: 100vw; }
            .lifeat-rail { left: .55rem; right: .55rem; top: auto; bottom: .55rem; width: auto; grid-template-columns: minmax(0, 1fr) auto; grid-template-rows: auto; z-index: 3; }
            .lifeat-rail-group { grid-auto-flow: column; grid-auto-columns: max-content; overflow-x: auto; }
            .lifeat-panel { top: 0; bottom: 5.4rem; border-right: 0; border-bottom: 1px solid var(--lifeat-panel-border); }
            .lifeat-panel-minimize { display: none; }
        }
    `;
    document.head.append(style);
}

export default class LifeAtWorkspace {
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
        this.config = config || window.profileApp?.config || {};
        this.state = this.readState();
        this.sectionRefs = new Map();
        this.navButtons = new Map();
        this.activePanel = null;
        this.timer = { interval: null, remaining: 0, isRunning: false };
    }

    init() {
        injectLifeAtStyles();
        this.cacheSections();
        this.hideLegacyCustomizer();
        this.buildWorkspace();
        this.attachGlobalEvents();
        this.syncRailState();
        this.restoreLastPanel();
    }

    readState() {
        return { collapsed: false, activePanel: null, spaceTab: "videos", spaceCategory: "all", ...safeJsonParse(localStorage.getItem(LIFEAT_STORAGE_KEY), {}) };
    }

    writeState() {
        localStorage.setItem(LIFEAT_STORAGE_KEY, JSON.stringify(this.state));
    }

    cacheSections() {
        document.querySelectorAll(".customizer-section[data-panel]").forEach((section) => this.sectionRefs.set(section.dataset.panel, section));
        this.lyricsSettings = document.getElementById("lyricsSettings");
    }

    hideLegacyCustomizer() {
        document.getElementById("openCustomizerButton")?.setAttribute("hidden", "");
        if (this.customizerPanel?.root) this.customizerPanel.root.hidden = true;
    }

    buildWorkspace() {
        this.root = createElement("div", "lifeat-workspace", { "aria-label": "LifeAt style workspace" });
        this.rail = createElement("nav", "lifeat-rail", { "aria-label": "Workspace navigation" });
        this.topGroup = createElement("div", "lifeat-rail-group lifeat-rail-group--top");
        this.mainGroup = createElement("div", "lifeat-rail-group lifeat-rail-group--scroll");
        this.bottomGroup = createElement("div", "lifeat-rail-group lifeat-rail-group--bottom");

        NAV_ITEMS.forEach((item) => {
            const button = this.createNavButton(item);
            this.navButtons.set(item.id, button);
            (item.id === "spaces" ? this.topGroup : this.mainGroup).append(button);
        });

        this.collapseButton = createElement("button", "lifeat-collapse-button", { type: "button", title: "Thu gọn / mở rộng thanh chức năng", "aria-label": "Thu gọn thanh chức năng", html: `<span class="lifeat-nav-icon">•••</span><span class="lifeat-nav-label">More</span>` });
        this.collapseButton.addEventListener("click", () => this.toggleRail());
        this.bottomGroup.append(this.collapseButton);

        this.rail.append(this.topGroup, this.mainGroup, this.bottomGroup);
        this.panel = this.createPanel();
        this.root.append(this.rail, this.panel);
        document.body.append(this.root);
    }

    createNavButton(item) {
        const button = createElement("button", "lifeat-nav-button", { type: "button", title: item.label, "aria-label": item.label, html: `<span class="lifeat-nav-icon" aria-hidden="true">${item.icon}</span><span class="lifeat-nav-label">${item.shortLabel}</span>` });
        button.dataset.panel = item.panel;
        button.dataset.navId = item.id;
        button.addEventListener("click", () => this.openPanel(item.panel, item.id));
        return button;
    }

    createPanel() {
        const panel = createElement("aside", "lifeat-panel", { role: "dialog", "aria-label": "Workspace panel", "aria-modal": "false" });
        panel.innerHTML = `
            <button class="lifeat-panel-minimize" type="button" aria-label="Thu gọn panel">◀</button>
            <header class="lifeat-panel-header">
                <div class="lifeat-tabs" data-lifeat-tabs></div>
                <div class="lifeat-search-row">
                    <label class="lifeat-search"><span aria-hidden="true">🔍</span><input type="search" data-lifeat-search placeholder="Search space"></label>
                    <button class="lifeat-close-button" type="button" data-lifeat-close aria-label="Đóng panel">×</button>
                </div>
                <div class="lifeat-space-chips" data-lifeat-chips hidden></div>
            </header>
            <div class="lifeat-panel-body" data-lifeat-body></div>
        `;
        this.tabsMount = panel.querySelector("[data-lifeat-tabs]");
        this.searchInput = panel.querySelector("[data-lifeat-search]");
        this.chipsMount = panel.querySelector("[data-lifeat-chips]");
        this.panelBody = panel.querySelector("[data-lifeat-body]");
        panel.querySelector("[data-lifeat-close]")?.addEventListener("click", () => this.closePanel());
        panel.querySelector(".lifeat-panel-minimize")?.addEventListener("click", () => this.closePanel());
        this.searchInput?.addEventListener("input", () => this.handleSearch());
        return panel;
    }

    attachGlobalEvents() {
        document.getElementById("lyricsTuneBtn")?.addEventListener("click", (event) => { event.preventDefault(); this.openPanel("lyrics", "media"); });
        this.appShell?.addEventListener("profile:open-customizer-tab", (event) => {
            const tabId = event.detail?.tabId || "music";
            const panel = tabId === "background" ? "background" : tabId === "lyrics" ? "lyrics" : tabId;
            this.openPanel(panel, this.navIdForPanel(panel));
        });
    }

    restoreLastPanel() {
        if (this.state.activePanel) this.openPanel(this.state.activePanel, this.navIdForPanel(this.state.activePanel), { silent: true });
    }

    navIdForPanel(panel) {
        return NAV_ITEMS.find((item) => item.panel === panel)?.id || "spaces";
    }

    toggleRail() {
        this.state.collapsed = !this.state.collapsed;
        this.writeState();
        this.syncRailState();
    }

    syncRailState() {
        this.root?.classList.toggle("is-rail-collapsed", Boolean(this.state.collapsed));
        this.collapseButton?.setAttribute("aria-label", this.state.collapsed ? "Mở rộng thanh chức năng" : "Thu gọn thanh chức năng");
    }

    openPanel(panel, navId = this.navIdForPanel(panel), { silent = false } = {}) {
        if (this.activePanel === panel && this.panel.classList.contains("is-open") && !silent) {
            this.closePanel();
            return;
        }
        this.activePanel = panel;
        this.state.activePanel = panel;
        this.writeState();
        this.panel.classList.add("is-open");
        document.body.classList.add("lifeat-panel-open");
        this.renderHeader(panel);
        this.renderPanel(panel);
        this.syncActiveButton(navId);
        this.shell?.setStatus?.(this.statusForPanel(panel));
    }

    closePanel() {
        this.panel.classList.remove("is-open");
        document.body.classList.remove("lifeat-panel-open");
        this.activePanel = null;
        this.state.activePanel = null;
        this.writeState();
        this.syncActiveButton(null);
    }

    syncActiveButton(navId) {
        this.navButtons.forEach((button, id) => {
            button.classList.toggle("is-active", id === navId);
            button.setAttribute("aria-pressed", id === navId ? "true" : "false");
        });
    }

    statusForPanel(panel) {
        const statusMap = { background: "Spaces panel opened in one compact LifeAt-style drawer.", music: "Sounds panel opened next to the sidebar.", calendar: "Calendar panel opened.", timer: "Timer panel opened.", tasks: "Tasks panel opened.", notes: "Notes panel opened.", lyrics: "Lyrics settings are grouped by mode.", layout: "Profile and layout controls opened." };
        return statusMap[panel] || "Workspace panel opened.";
    }

    renderHeader(panel) {
        const tabsByPanel = { background: ["Videos", "Images", "Favorites"], music: ["Library", "Upload", "Player"], lyrics: ["Text", "Effect", "Timing"], layout: ["Profile", "Layout", "Copy"], calendar: ["Today", "Zones", "Plan"], timer: ["Focus", "Break", "Long"], tasks: ["Tasks", "Done", "Archive"], notes: ["Notes", "Draft", "Ideas"] };
        const tabs = tabsByPanel[panel] || ["Main", "Tools", "More"];
        this.tabsMount.replaceChildren(...tabs.map((label, index) => {
            const button = createElement("button", `lifeat-tab${index === 0 ? " is-active" : ""}`, { type: "button", text: label });
            button.addEventListener("click", () => {
                this.tabsMount.querySelectorAll(".lifeat-tab").forEach((tab) => tab.classList.remove("is-active"));
                button.classList.add("is-active");
                if (panel === "background") {
                    this.state.spaceTab = label.toLowerCase();
                    this.writeState();
                    this.renderPanel("background");
                }
            });
            return button;
        }));
        this.searchInput.placeholder = panel === "background" ? "Search space" : `Search ${panel}`;
        this.searchInput.value = "";
        this.chipsMount.hidden = panel !== "background";
        if (panel === "background") this.renderSpaceChips(); else this.chipsMount.replaceChildren();
    }

    renderSpaceChips() {
        this.chipsMount.replaceChildren(...SPACE_CATEGORIES.map((category) => {
            const chip = createElement("button", `lifeat-chip${this.state.spaceCategory === category.id ? " is-active" : ""}`, { type: "button", text: category.icon });
            chip.title = category.label;
            chip.addEventListener("click", () => { this.state.spaceCategory = category.id; this.writeState(); this.renderSpaceChips(); this.renderPanel("background"); });
            return chip;
        }));
    }

    renderPanel(panel) {
        this.panelBody.replaceChildren();
        if (panel === "background") return this.renderSpaces(this.panelBody);
        if (panel === "music") return this.renderSounds(this.panelBody);
        if (panel === "lyrics") return this.renderLyrics(this.panelBody);
        if (panel === "layout") return this.renderLayout(this.panelBody);
        if (panel === "calendar") return this.renderCalendar(this.panelBody);
        if (panel === "timer") return this.renderTimer(this.panelBody);
        if (panel === "tasks") return this.renderTasks(this.panelBody);
        if (panel === "notes") return this.renderNotes(this.panelBody);
    }

    renderSpaces(body) {
        body.append(this.createPanelIntro("Featured Spaces", "Chọn video, ảnh hoặc hiệu ứng trong một drawer duy nhất. Không còn bật nhiều cửa sổ nổi gây rối."));
        body.append(this.createSpacesGallery());
        this.appendMovedSection(body, "background");
    }

    createSpacesGallery() {
        const grid = createElement("div", "lifeat-space-grid", { "data-filterable": "spaces" });
        grid.replaceChildren(...this.getSpaceCards().map((card) => {
            const button = createElement("button", "lifeat-space-card", { type: "button", dataset: { search: `${card.label} ${card.type}`.toLowerCase() } });
            button.innerHTML = `<span class="lifeat-space-thumb lifeat-space-thumb--${card.type}"><span class="lifeat-favorite" aria-hidden="true">♡</span></span><span class="lifeat-space-name">${card.label}</span>`;
            button.addEventListener("click", () => this.applySpaceCard(card));
            return button;
        }));
        return grid;
    }

    getSpaceCards() {
        const background = this.config.background || {};
        const categories = ["nature", "cafe", "minimal", "flower", "movie"];
        const withCategory = (card, index) => ({ ...card, category: categories[index % categories.length] });
        const videoCards = (background.video?.scenes || []).map((scene, index) => withCategory({ type: "video", label: scene.label, index }, index));
        const imageCards = (background.image?.scenes || []).map((scene, index) => withCategory({ type: "image", label: scene.label, index }, index + videoCards.length));
        const effectCards = (background.effects?.presets || []).map((preset, index) => withCategory({ type: "effects", label: preset.label, preset: preset.id }, index + videoCards.length + imageCards.length));
        const tab = this.state.spaceTab;
        const byTab = tab === "videos" ? videoCards : tab === "images" ? imageCards : [...videoCards, ...imageCards, ...effectCards];
        const activeCategory = this.state.spaceCategory;
        return activeCategory && activeCategory !== "all" ? byTab.filter((card) => card.category === activeCategory || card.type === activeCategory) : byTab;
    }

    applySpaceCard(card) {
        if (card.type === "video") { this.backgroundEngine?.setMode?.("video", true); this.backgroundEngine?.setVideoScene?.(card.index, true); }
        else if (card.type === "image") { this.backgroundEngine?.setMode?.("image", true); this.backgroundEngine?.setImageScene?.(card.index, true); }
        else if (card.type === "effects") { this.backgroundEngine?.setMode?.("effects", true); this.backgroundEngine?.setEffectPreset?.(card.preset, true); }
    }

    renderSounds(body) {
        body.append(this.createPanelIntro("Sounds", "Nhạc, upload track, LRC và JSON timing được gom vào một tab gần sidebar."));
        const strip = createElement("div", "lifeat-card lifeat-player-strip");
        strip.innerHTML = `<p class="lifeat-panel-title">Quick player</p><p class="lifeat-muted">Dùng player chính ở màn hình, còn upload và thư viện nằm ngay bên dưới.</p><div class="lifeat-action-row"><button class="lifeat-action lifeat-action--primary" type="button" data-action="toggle-play">Play / Pause</button><button class="lifeat-action" type="button" data-action="prev">Prev</button><button class="lifeat-action" type="button" data-action="next">Next</button></div>`;
        strip.querySelector("[data-action='toggle-play']")?.addEventListener("click", () => this.toggleAudioPlayback());
        strip.querySelector("[data-action='prev']")?.addEventListener("click", () => document.getElementById("musicPrevBtn")?.click());
        strip.querySelector("[data-action='next']")?.addEventListener("click", () => document.getElementById("musicNextBtn")?.click());
        body.append(strip);
        this.appendMovedSection(body, "music");
    }

    toggleAudioPlayback() {
        const audio = document.getElementById("musicAudio");
        if (!audio) return;
        if (audio.paused) void audio.play(); else audio.pause();
    }

    renderLyrics(body) {
        body.append(this.createPanelIntro("Lyrics Studio", "Các chức năng lyric được tách thành nhiều mode: chữ, hiệu ứng, timing và burst để không còn một khối dài khó chỉnh."));
        body.append(this.getLyricsBoard());
    }

    getLyricsBoard() {
        if (this.lyricsBoard) return this.lyricsBoard;
        const board = createElement("section", "lifeat-lyrics-board");
        const tabs = createElement("div", "lifeat-lyrics-tabs", { role: "tablist" });
        const settings = this.lyricsSettings;
        if (!settings) {
            board.append(createElement("p", "lifeat-muted", { text: "Không tìm thấy lyricsSettings trong DOM." }));
            this.lyricsBoard = board;
            return board;
        }
        settings.hidden = false;
        settings.classList.add("lifeat-managed-lyrics-settings");
        const groups = [
            { id: "text", label: "Text", title: "Chữ và màu lyric", controls: ["lyricsScaleRange", "lyricsFontSelect", "lyricsBoldToggle", "lyricsItalicToggle", "textEffect", "colorMode", "lyricsColorPresetGallery", "lyricsPrimaryColor", "lyricsSecondaryColor", "lyricsAccentColor", "lyricsLetterSpacingRange", "lyricsWordSpacingRange", "lyricsAlignSelect"] },
            { id: "effect", label: "Effect", title: "Kinetic và render mode", controls: ["lyricsKineticWordsRange", "lyricsKineticCharsRange", "lyricsKineticSpeedRange", "lyricsSmoothModeToggle", "lyricsKineticStyleSelect"] },
            { id: "timing", label: "Timing", title: "Đồng bộ thời gian", controls: ["lyricsDelayRange", "lyricsBoxHazeRange"] },
            { id: "burst", label: "Burst", title: "Hiệu ứng cuối dòng", controls: ["lyricsTailBurstToggle", "lyricsTailBurstStyleSelect", "lyricsTailBurstColorA", "lyricsTailBurstColorB", "lyricsTailBurstColorCore", "lyricsTailBurstStrengthRange", "lyricsTailBurstParticlesRange", "lyricsTailBurstSpreadRange", "lyricsTailBurstGravityRange", "lyricsTailBurstDurationRange"] }
        ];
        const modeMounts = groups.map((group, index) => {
            const tab = createElement("button", `lifeat-lyrics-tab${index === 0 ? " is-active" : ""}`, { type: "button", role: "tab", text: group.label });
            const mode = createElement("div", `lifeat-lyrics-mode${index === 0 ? " is-active" : ""}`, { role: "tabpanel", dataset: { mode: group.id } });
            mode.append(createElement("p", "lifeat-lyrics-mode-title", { text: group.title }));
            group.controls.forEach((controlId) => {
                const control = document.getElementById(controlId);
                const setting = control?.closest?.(".lyrics-setting") || control;
                if (setting && !mode.contains(setting)) mode.append(setting);
            });
            tab.addEventListener("click", () => {
                tabs.querySelectorAll(".lifeat-lyrics-tab").forEach((item) => item.classList.remove("is-active"));
                settings.querySelectorAll(".lifeat-lyrics-mode").forEach((item) => item.classList.remove("is-active"));
                tab.classList.add("is-active");
                mode.classList.add("is-active");
            });
            tabs.append(tab);
            return mode;
        });
        settings.replaceChildren(...modeMounts);
        board.append(tabs, settings);
        this.lyricsBoard = board;
        return board;
    }

    renderLayout(body) {
        body.append(this.createPanelIntro("Profile & Layout", "Ẩn/hiện module, chỉnh intro, creative widget và audio reactive trong một khu vực gọn."));
        this.appendMovedSection(body, "layout");
    }

    renderCalendar(body) {
        const card = createElement("section", "lifeat-card");
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh";
        card.innerHTML = `<p class="lifeat-panel-title">Calendar</p><div class="lifeat-clock-large" data-lifeat-clock>--:--</div><p class="lifeat-muted" data-lifeat-date></p><select class="lifeat-select" data-lifeat-zone><option>${zone}</option><option>Asia/Ho_Chi_Minh</option><option>Asia/Tokyo</option><option>Europe/London</option><option>America/New_York</option></select>`;
        const select = card.querySelector("[data-lifeat-zone]");
        const update = () => {
            const timeZone = select.value;
            const now = new Date();
            card.querySelector("[data-lifeat-clock]").textContent = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone }).format(now);
            card.querySelector("[data-lifeat-date]").textContent = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone }).format(now);
        };
        select.addEventListener("change", update);
        update();
        window.clearInterval(this.calendarInterval);
        this.calendarInterval = window.setInterval(update, 1000);
        body.append(card);
    }

    renderTimer(body) {
        const storedMinutes = Number(localStorage.getItem(TIMER_STORAGE_KEY)) || 25;
        if (!this.timer.remaining) this.timer.remaining = storedMinutes * 60;
        const card = createElement("section", "lifeat-card");
        card.innerHTML = `<p class="lifeat-panel-title">Focus Timer</p><div class="lifeat-clock-large" data-timer-display>25:00</div><label class="lifeat-muted">Minutes</label><input class="lifeat-input" data-timer-minutes type="number" min="1" max="180" value="${storedMinutes}"><div class="lifeat-action-row"><button class="lifeat-action lifeat-action--primary" type="button" data-timer-start>Start</button><button class="lifeat-action" type="button" data-timer-reset>Reset</button></div>`;
        const minutesInput = card.querySelector("[data-timer-minutes]");
        const display = card.querySelector("[data-timer-display]");
        const startButton = card.querySelector("[data-timer-start]");
        const render = () => { display.textContent = `${Math.floor(this.timer.remaining / 60).toString().padStart(2, "0")}:${Math.floor(this.timer.remaining % 60).toString().padStart(2, "0")}`; startButton.textContent = this.timer.isRunning ? "Pause" : "Start"; };
        const reset = () => { const minutes = Math.min(Math.max(Number(minutesInput.value) || 25, 1), 180); localStorage.setItem(TIMER_STORAGE_KEY, String(minutes)); this.timer.remaining = minutes * 60; this.timer.isRunning = false; window.clearInterval(this.timer.interval); render(); };
        const tick = () => { if (this.timer.remaining <= 0) { this.timer.isRunning = false; window.clearInterval(this.timer.interval); render(); this.shell?.setStatus?.("Focus timer finished."); return; } this.timer.remaining -= 1; render(); };
        startButton.addEventListener("click", () => { this.timer.isRunning = !this.timer.isRunning; window.clearInterval(this.timer.interval); if (this.timer.isRunning) this.timer.interval = window.setInterval(tick, 1000); render(); });
        card.querySelector("[data-timer-reset]")?.addEventListener("click", reset);
        minutesInput.addEventListener("change", reset);
        render();
        body.append(card);
    }

    renderTasks(body) {
        const card = createElement("section", "lifeat-card");
        const tasks = safeJsonParse(localStorage.getItem(TASK_STORAGE_KEY), []);
        card.innerHTML = `<p class="lifeat-panel-title">Tasks</p><form class="lifeat-action-row" data-task-form><input class="lifeat-input" name="task" placeholder="Add a task" autocomplete="off"><button class="lifeat-action lifeat-action--primary" type="submit">Add</button></form><div class="lifeat-task-list" data-task-list></div>`;
        const list = card.querySelector("[data-task-list]");
        const save = () => localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
        const render = () => {
            list.replaceChildren(...tasks.map((task, index) => {
                const item = createElement("label", `lifeat-task-item${task.done ? " is-done" : ""}`);
                item.innerHTML = `<input type="checkbox" ${task.done ? "checked" : ""}><span></span><button class="lifeat-task-remove" type="button" aria-label="Remove task">×</button>`;
                item.querySelector("span").textContent = task.text;
                item.querySelector("input").addEventListener("change", (event) => { tasks[index].done = event.target.checked; save(); render(); });
                item.querySelector("button").addEventListener("click", () => { tasks.splice(index, 1); save(); render(); });
                return item;
            }));
        };
        card.querySelector("[data-task-form]")?.addEventListener("submit", (event) => {
            event.preventDefault();
            const input = event.currentTarget.elements.task;
            const text = input.value.trim();
            if (!text) return;
            tasks.unshift({ text, done: false, createdAt: Date.now() });
            input.value = "";
            save();
            render();
        });
        render();
        body.append(card);
    }

    renderNotes(body) {
        const card = createElement("section", "lifeat-card");
        card.innerHTML = `<p class="lifeat-panel-title">Notes</p><p class="lifeat-muted">Ghi chú được lưu trong trình duyệt này.</p><textarea class="lifeat-textarea" data-notes placeholder="Viết nhanh ý tưởng, lyric note, việc cần làm..."></textarea>`;
        const textarea = card.querySelector("[data-notes]");
        textarea.value = localStorage.getItem(NOTES_STORAGE_KEY) || "";
        textarea.addEventListener("input", () => localStorage.setItem(NOTES_STORAGE_KEY, textarea.value));
        body.append(card);
    }

    createPanelIntro(title, text) {
        const intro = createElement("section", "lifeat-card");
        intro.append(createElement("p", "lifeat-panel-title", { text: title }), createElement("p", "lifeat-muted", { text }));
        return intro;
    }

    appendMovedSection(body, panelName) {
        const section = this.sectionRefs.get(panelName);
        if (!section) {
            body.append(createElement("p", "lifeat-muted", { text: `Không tìm thấy panel ${panelName}.` }));
            return;
        }
        section.hidden = false;
        section.classList.add("is-active", "lifeat-managed-section");
        body.append(section);
    }

    handleSearch() {
        const term = (this.searchInput?.value || "").trim().toLowerCase();
        this.panelBody?.querySelectorAll("[data-filterable] [data-search]").forEach((item) => {
            item.hidden = Boolean(term) && !item.dataset.search.includes(term);
        });
    }
}
