const DASHBOARD_STYLE_ID = "dashboardFloatingWindowsStyle";
const WINDOW_STORAGE_PREFIX = "profile.dashboard.window.";
const Z_INDEX_STORAGE_KEY = "profile.dashboard.zIndex";

const SIDEBAR_ITEMS = [
    { id: "spaces", label: "Spaces", icon: "◌" },
    { id: "sounds", label: "Sounds", icon: "♪" },
    { id: "cal", label: "Cal", icon: "◷" },
    { id: "timer", label: "Timer", icon: "⏱" },
    { id: "tasks", label: "Tasks", icon: "✎" },
    { id: "notes", label: "Notes", icon: "☰" },
    { id: "media", label: "Media", icon: "▣" },
    { id: "profile", label: "Profile", icon: "◎" }
];

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function createElement(tagName, className = "", attributes = {}) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }

    Object.entries(attributes).forEach(([key, value]) => {
        if (key === "text") {
            element.textContent = value;
        } else if (key === "html") {
            element.innerHTML = value;
        } else if (value !== null && value !== undefined) {
            element.setAttribute(key, value);
        }
    });

    return element;
}

function injectDashboardStyles() {
    if (document.getElementById(DASHBOARD_STYLE_ID)) {
        return;
    }

    const style = document.createElement("style");
    style.id = DASHBOARD_STYLE_ID;
    style.textContent = `
        #openCustomizerButton,
        .customizer-panel {
            display: none !important;
        }

        .dashboard-sidebar {
            position: fixed;
            left: 1rem;
            top: 1rem;
            z-index: 12000;
            display: grid;
            gap: 0.45rem;
            padding: 0.45rem;
            border: 1px solid rgba(136, 190, 255, 0.22);
            border-radius: 1.35rem;
            background:
                linear-gradient(180deg, rgba(9, 17, 38, 0.76), rgba(5, 10, 24, 0.82)),
                radial-gradient(circle at 50% 0%, rgba(117, 204, 255, 0.18), transparent 64%);
            box-shadow:
                0 20px 54px rgba(0, 0, 0, 0.38),
                inset 0 1px 0 rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(18px) saturate(138%);
            -webkit-backdrop-filter: blur(18px) saturate(138%);
        }

        .dashboard-sidebar-button {
            position: relative;
            display: grid;
            place-items: center;
            width: 2.8rem;
            height: 2.8rem;
            border-radius: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.055);
            color: rgba(239, 248, 255, 0.86);
            cursor: pointer;
            transition: transform 160ms ease, background 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .dashboard-sidebar-button:hover,
        .dashboard-sidebar-button.is-active {
            transform: translateY(-1px);
            background: rgba(104, 185, 255, 0.16);
            border-color: rgba(134, 210, 255, 0.34);
            box-shadow: 0 0 1.2rem rgba(104, 185, 255, 0.18);
        }

        .dashboard-sidebar-icon {
            font-size: 1rem;
            font-weight: 800;
            line-height: 1;
        }

        .dashboard-sidebar-label {
            position: absolute;
            left: calc(100% + 0.55rem);
            top: 50%;
            transform: translateY(-50%) translateX(-0.25rem);
            opacity: 0;
            pointer-events: none;
            padding: 0.3rem 0.55rem;
            border-radius: 999px;
            background: rgba(6, 12, 26, 0.86);
            color: rgba(245, 250, 255, 0.9);
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.02em;
            white-space: nowrap;
            transition: opacity 160ms ease, transform 160ms ease;
        }

        .dashboard-sidebar-button:hover .dashboard-sidebar-label {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
        }

        .dashboard-window {
            --dashboard-window-width: 400px;
            --dashboard-window-height: 520px;
            position: fixed;
            left: 0;
            top: 0;
            width: var(--dashboard-window-width);
            height: var(--dashboard-window-height);
            min-width: 18rem;
            min-height: 14rem;
            max-width: calc(100vw - 1rem);
            max-height: calc(100vh - 1rem);
            display: none;
            grid-template-rows: auto minmax(0, 1fr);
            color: var(--text-primary, #f7f9ff);
            border: 1px solid rgba(131, 188, 255, 0.24);
            border-radius: 1.45rem;
            overflow: hidden;
            background:
                linear-gradient(180deg, rgba(11, 19, 43, 0.82), rgba(5, 10, 25, 0.88)),
                radial-gradient(circle at 16% 0%, rgba(103, 184, 255, 0.15), transparent 34%),
                radial-gradient(circle at 88% 100%, rgba(152, 117, 255, 0.12), transparent 34%);
            box-shadow:
                0 28px 86px rgba(0, 0, 0, 0.44),
                inset 0 1px 0 rgba(255, 255, 255, 0.075),
                0 0 2rem rgba(74, 168, 255, 0.08);
            backdrop-filter: blur(22px) saturate(145%);
            -webkit-backdrop-filter: blur(22px) saturate(145%);
            touch-action: none;
        }

        .dashboard-window.is-open {
            display: grid;
        }

        .dashboard-window-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.85rem;
            min-height: 3rem;
            padding: 0.68rem 0.78rem 0.62rem 0.95rem;
            cursor: grab;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.018));
            user-select: none;
        }

        .dashboard-window.is-dragging .dashboard-window-header {
            cursor: grabbing;
        }

        .dashboard-window-title {
            display: flex;
            align-items: center;
            gap: 0.58rem;
            margin: 0;
            color: rgba(242, 248, 255, 0.96);
            font-size: 0.86rem;
            font-weight: 800;
            letter-spacing: 0.02em;
        }

        .dashboard-window-title span:first-child {
            display: grid;
            place-items: center;
            width: 1.75rem;
            height: 1.75rem;
            border-radius: 0.68rem;
            background: rgba(104, 185, 255, 0.14);
            color: #dff4ff;
        }

        .dashboard-window-actions {
            display: flex;
            align-items: center;
            gap: 0.36rem;
        }

        .dashboard-window-action {
            display: grid;
            place-items: center;
            width: 1.75rem;
            height: 1.75rem;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.055);
            color: rgba(245, 250, 255, 0.8);
            cursor: pointer;
        }

        .dashboard-window-body {
            min-height: 0;
            overflow: auto;
            padding: 0.95rem;
            overscroll-behavior: contain;
        }

        .dashboard-window-body .customizer-section,
        .dashboard-window-body .customizer-background-option,
        .dashboard-window-body .lyrics-settings {
            display: grid !important;
            opacity: 1 !important;
            transform: none !important;
            pointer-events: auto !important;
        }

        .dashboard-window-body .customizer-section {
            gap: 0.9rem;
        }

        .dashboard-window-body .lyrics-settings,
        .dashboard-window-body .lyrics-settings--sidebar {
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            grid-template-columns: 1fr !important;
            border: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
        }

        .dashboard-resize-handle {
            position: absolute;
            width: 1rem;
            height: 1rem;
            border: 0;
            background: transparent;
            z-index: 2;
        }

        .dashboard-resize-handle[data-edge="se"] { right: 0; bottom: 0; cursor: nwse-resize; }
        .dashboard-resize-handle[data-edge="sw"] { left: 0; bottom: 0; cursor: nesw-resize; }
        .dashboard-resize-handle[data-edge="ne"] { right: 0; top: 0; cursor: nesw-resize; }
        .dashboard-resize-handle[data-edge="nw"] { left: 0; top: 0; cursor: nwse-resize; }

        .dashboard-control-grid {
            display: grid;
            gap: 0.75rem;
        }

        .dashboard-control-card {
            display: grid;
            gap: 0.6rem;
            padding: 0.8rem;
            border-radius: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.045);
        }

        .dashboard-control-title {
            margin: 0;
            color: rgba(242, 248, 255, 0.94);
            font-weight: 800;
            font-size: 0.8rem;
            letter-spacing: 0.03em;
            text-transform: uppercase;
        }

        .dashboard-field {
            display: grid;
            gap: 0.35rem;
            color: rgba(226, 239, 255, 0.72);
            font-size: 0.76rem;
            font-weight: 700;
        }

        .dashboard-input,
        .dashboard-select,
        .dashboard-textarea {
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0.8rem;
            background: rgba(255, 255, 255, 0.06);
            color: rgba(245, 250, 255, 0.94);
            padding: 0.58rem 0.7rem;
            outline: none;
        }

        .dashboard-textarea {
            min-height: 6rem;
            resize: vertical;
        }

        .dashboard-button-row {
            display: flex;
            flex-wrap: wrap;
            gap: 0.55rem;
        }

        .dashboard-button {
            min-height: 2.18rem;
            padding: 0.42rem 0.78rem;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.065);
            color: rgba(245, 250, 255, 0.9);
            cursor: pointer;
            font-weight: 750;
        }

        .dashboard-button--primary {
            background: rgba(104, 185, 255, 0.18);
            border-color: rgba(104, 185, 255, 0.32);
        }

        .dashboard-mini-clock {
            font-size: 2.4rem;
            font-weight: 800;
            letter-spacing: -0.06em;
        }

        .dashboard-muted {
            color: rgba(220, 235, 255, 0.58);
            font-size: 0.78rem;
            line-height: 1.5;
        }

        .lyrics-overlay {
            z-index: 6;
        }

        .lyrics-overlay .lyrics-settings {
            display: none !important;
        }

        .lyrics-overlay:not(.is-dragging):not(.is-resizing):not(.is-pure) {
            left: 50%;
            bottom: 5rem;
            transform: translate(calc(-50% + var(--lyrics-offset-x)), var(--lyrics-offset-y));
        }

        .app-shell.is-dashboard-mode .lyrics-header-meta {
            pointer-events: auto;
        }

        .app-shell.is-dashboard-mode .lyrics-control-btn#lyricsTuneBtn {
            display: none;
        }

        @media (max-width: 760px) {
            .dashboard-sidebar {
                left: 0.6rem;
                top: 0.6rem;
                grid-auto-flow: column;
                max-width: calc(100vw - 1.2rem);
                overflow-x: auto;
            }

            .dashboard-sidebar-button {
                width: 2.45rem;
                height: 2.45rem;
            }

            .dashboard-window {
                max-width: calc(100vw - 0.8rem);
                max-height: calc(100vh - 0.8rem);
            }
        }
    `;

    document.head.appendChild(style);
}

class FloatingWindow {
    constructor(manager, definition) {
        this.manager = manager;
        this.definition = definition;
        this.id = definition.id;
        this.storageKey = `${WINDOW_STORAGE_PREFIX}${this.id}`;
        this.hasRendered = false;
        this.pointerAction = null;
        this.state = this.getInitialState();
        this.root = this.createRoot();
        this.body = this.root.querySelector(".dashboard-window-body");
        this.header = this.root.querySelector(".dashboard-window-header");
        this.attachEvents();
        this.applyState();
    }

    getInitialState() {
        const defaults = this.definition.defaultState || {};
        const fallback = {
            x: defaults.x ?? 120,
            y: defaults.y ?? 80,
            width: defaults.width ?? 400,
            height: defaults.height ?? 520,
            isVisible: false
        };

        try {
            const stored = JSON.parse(localStorage.getItem(this.storageKey) || "null");
            return stored && typeof stored === "object" ? { ...fallback, ...stored } : fallback;
        } catch (error) {
            return fallback;
        }
    }

    createRoot() {
        const root = createElement("section", "dashboard-window", {
            role: "dialog",
            "aria-label": this.definition.label
        });
        root.dataset.windowId = this.id;
        root.innerHTML = `
            <header class="dashboard-window-header">
                <h2 class="dashboard-window-title"><span>${this.definition.icon}</span><strong>${this.definition.label}</strong></h2>
                <div class="dashboard-window-actions">
                    <button class="dashboard-window-action" type="button" data-window-action="close" aria-label="Close ${this.definition.label}">×</button>
                </div>
            </header>
            <div class="dashboard-window-body"></div>
            <button class="dashboard-resize-handle" type="button" data-edge="nw" aria-label="Resize ${this.definition.label} from top left"></button>
            <button class="dashboard-resize-handle" type="button" data-edge="ne" aria-label="Resize ${this.definition.label} from top right"></button>
            <button class="dashboard-resize-handle" type="button" data-edge="sw" aria-label="Resize ${this.definition.label} from bottom left"></button>
            <button class="dashboard-resize-handle" type="button" data-edge="se" aria-label="Resize ${this.definition.label} from bottom right"></button>
        `;
        this.manager.mount.append(root);
        return root;
    }

    attachEvents() {
        this.root.addEventListener("pointerdown", () => this.manager.bringToFront(this));
        this.header.addEventListener("pointerdown", (event) => this.startDrag(event));
        this.root.querySelector("[data-window-action='close']")?.addEventListener("click", () => this.close());
        this.root.querySelectorAll(".dashboard-resize-handle").forEach((handle) => {
            handle.addEventListener("pointerdown", (event) => this.startResize(event, handle.dataset.edge));
        });
    }

    ensureRendered() {
        if (this.hasRendered) {
            return;
        }

        this.definition.render(this.body, this.manager);
        this.hasRendered = true;
    }

    open() {
        this.ensureRendered();
        this.state.isVisible = true;
        this.applyState();
        this.manager.bringToFront(this);
        this.persist();
    }

    close() {
        this.state.isVisible = false;
        this.applyState();
        this.persist();
        this.manager.syncSidebarState();
    }

    applyState() {
        this.keepInViewport();
        this.root.classList.toggle("is-open", Boolean(this.state.isVisible));
        this.root.style.transform = `translate3d(${this.state.x}px, ${this.state.y}px, 0)`;
        this.root.style.setProperty("--dashboard-window-width", `${this.state.width}px`);
        this.root.style.setProperty("--dashboard-window-height", `${this.state.height}px`);
    }

    persist() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }

    keepInViewport() {
        const padding = 8;
        const maxWidth = Math.max(280, window.innerWidth - padding * 2);
        const maxHeight = Math.max(220, window.innerHeight - padding * 2);
        this.state.width = clamp(this.state.width, 280, maxWidth);
        this.state.height = clamp(this.state.height, 220, maxHeight);
        this.state.x = clamp(this.state.x, padding, Math.max(padding, window.innerWidth - this.state.width - padding));
        this.state.y = clamp(this.state.y, padding, Math.max(padding, window.innerHeight - this.state.height - padding));
    }

    startDrag(event) {
        if (event.button !== 0 || event.target.closest("button, input, textarea, select, a")) {
            return;
        }

        event.preventDefault();
        this.manager.bringToFront(this);
        this.root.classList.add("is-dragging");
        this.header.setPointerCapture(event.pointerId);
        this.pointerAction = {
            type: "drag",
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: this.state.x,
            originY: this.state.y
        };

        window.addEventListener("pointermove", this.handlePointerMove);
        window.addEventListener("pointerup", this.handlePointerUp);
        window.addEventListener("pointercancel", this.handlePointerUp);
    }

    startResize(event, edge) {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.manager.bringToFront(this);
        this.root.classList.add("is-resizing");
        event.currentTarget.setPointerCapture(event.pointerId);
        this.pointerAction = {
            type: "resize",
            edge,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: this.state.x,
            originY: this.state.y,
            originWidth: this.state.width,
            originHeight: this.state.height
        };

        window.addEventListener("pointermove", this.handlePointerMove);
        window.addEventListener("pointerup", this.handlePointerUp);
        window.addEventListener("pointercancel", this.handlePointerUp);
    }

    handlePointerMove = (event) => {
        if (!this.pointerAction || event.pointerId !== this.pointerAction.pointerId) {
            return;
        }

        const deltaX = event.clientX - this.pointerAction.startX;
        const deltaY = event.clientY - this.pointerAction.startY;

        if (this.pointerAction.type === "drag") {
            this.state.x = this.pointerAction.originX + deltaX;
            this.state.y = this.pointerAction.originY + deltaY;
        } else if (this.pointerAction.type === "resize") {
            const edge = this.pointerAction.edge || "se";
            if (edge.includes("e")) {
                this.state.width = this.pointerAction.originWidth + deltaX;
            }
            if (edge.includes("s")) {
                this.state.height = this.pointerAction.originHeight + deltaY;
            }
            if (edge.includes("w")) {
                this.state.width = this.pointerAction.originWidth - deltaX;
                this.state.x = this.pointerAction.originX + deltaX;
            }
            if (edge.includes("n")) {
                this.state.height = this.pointerAction.originHeight - deltaY;
                this.state.y = this.pointerAction.originY + deltaY;
            }
        }

        this.applyState();
    };

    handlePointerUp = (event) => {
        if (!this.pointerAction || event.pointerId !== this.pointerAction.pointerId) {
            return;
        }

        this.pointerAction = null;
        this.root.classList.remove("is-dragging", "is-resizing");
        window.removeEventListener("pointermove", this.handlePointerMove);
        window.removeEventListener("pointerup", this.handlePointerUp);
        window.removeEventListener("pointercancel", this.handlePointerUp);
        this.keepInViewport();
        this.applyState();
        this.persist();
    };
}

export default class DashboardFloatingWindows {
    constructor({ appShell, shell, centerCard, lyricsEngine, musicPlayer, clockWidget, creativeWidget, customizerPanel } = {}) {
        this.appShell = appShell || document.getElementById("appShell");
        this.shell = shell;
        this.centerCard = centerCard;
        this.lyricsEngine = lyricsEngine;
        this.musicPlayer = musicPlayer;
        this.clockWidget = clockWidget;
        this.creativeWidget = creativeWidget;
        this.customizerPanel = customizerPanel;
        this.windows = new Map();
        this.sidebarButtons = new Map();
        this.mount = document.body;
        this.zIndex = Number(localStorage.getItem(Z_INDEX_STORAGE_KEY)) || 13000;
        this.timers = new Set();
    }

    init() {
        injectDashboardStyles();
        this.appShell?.classList.add("is-dashboard-mode");
        document.getElementById("openCustomizerButton")?.setAttribute("hidden", "");
        document.getElementById("customizerPanel")?.setAttribute("hidden", "");
        this.createSidebar();
        this.createWindows();
        window.addEventListener("resize", () => this.handleViewportResize());
    }

    createSidebar() {
        this.sidebar = createElement("nav", "dashboard-sidebar", { "aria-label": "Dashboard navigation" });
        SIDEBAR_ITEMS.forEach((item) => {
            const button = createElement("button", "dashboard-sidebar-button", {
                type: "button",
                "aria-label": item.label,
                title: item.label
            });
            button.innerHTML = `<span class="dashboard-sidebar-icon">${item.icon}</span><span class="dashboard-sidebar-label">${item.label}</span>`;
            button.addEventListener("click", () => this.openWindow(item.id));
            this.sidebarButtons.set(item.id, button);
            this.sidebar.append(button);
        });
        document.body.append(this.sidebar);
    }

    createWindows() {
        const definitions = [
            { id: "spaces", label: "Spaces", icon: "◌", defaultState: { x: 84, y: 78, width: 430, height: 560 }, render: (body) => this.renderMovedSection(body, "background") },
            { id: "sounds", label: "Sounds", icon: "♪", defaultState: { x: 120, y: 92, width: 430, height: 620 }, render: (body) => this.renderSounds(body) },
            { id: "cal", label: "Cal", icon: "◷", defaultState: { x: 150, y: 108, width: 360, height: 360 }, render: (body) => this.renderCalendar(body) },
            { id: "timer", label: "Timer", icon: "⏱", defaultState: { x: 180, y: 124, width: 360, height: 380 }, render: (body) => this.renderTimer(body) },
            { id: "tasks", label: "Tasks", icon: "✎", defaultState: { x: 210, y: 140, width: 390, height: 460 }, render: (body) => this.renderTasks(body) },
            { id: "notes", label: "Notes", icon: "☰", defaultState: { x: 240, y: 156, width: 400, height: 440 }, render: (body) => this.renderNotes(body) },
            { id: "media", label: "Media", icon: "▣", defaultState: { x: 270, y: 172, width: 430, height: 640 }, render: (body) => this.renderMedia(body) },
            { id: "profile", label: "Profile", icon: "◎", defaultState: { x: 300, y: 188, width: 380, height: 380 }, render: (body) => this.renderProfile(body) }
        ];

        definitions.forEach((definition) => {
            const floatingWindow = new FloatingWindow(this, definition);
            this.windows.set(definition.id, floatingWindow);
        });
        this.syncSidebarState();
    }

    openWindow(id) {
        const floatingWindow = this.windows.get(id);
        if (!floatingWindow) {
            return;
        }

        floatingWindow.open();
        this.syncSidebarState();
    }

    bringToFront(floatingWindow) {
        this.zIndex += 1;
        floatingWindow.root.style.zIndex = String(this.zIndex);
        localStorage.setItem(Z_INDEX_STORAGE_KEY, String(this.zIndex));
    }

    syncSidebarState() {
        this.sidebarButtons.forEach((button, id) => {
            button.classList.toggle("is-active", Boolean(this.windows.get(id)?.state.isVisible));
        });
    }

    handleViewportResize() {
        this.windows.forEach((floatingWindow) => {
            floatingWindow.keepInViewport();
            floatingWindow.applyState();
            floatingWindow.persist();
        });
    }

    renderMovedSection(body, panelName) {
        const section = document.querySelector(`.customizer-section[data-panel="${panelName}"]`);
        if (!section) {
            body.append(createElement("p", "dashboard-muted", { text: `Không tìm thấy panel ${panelName}.` }));
            return;
        }

        section.hidden = false;
        section.classList.add("is-active");
        body.replaceChildren(section);
    }

    renderSounds(body) {
        const wrapper = createElement("div", "dashboard-control-grid");
        const controlCard = createElement("div", "dashboard-control-card");
        controlCard.innerHTML = `
            <p class="dashboard-control-title">Module 04</p>
            <label class="dashboard-field">
                <span>Neon Player visibility</span>
                <button class="dashboard-button dashboard-button--primary" type="button" data-action="toggle-player">Toggle Neon Player</button>
            </label>
            <p class="dashboard-muted">Thanh tua #musicProgress vẫn giữ nguyên trong MusicPlayer, chỉ chuyển panel upload/local track sang cửa sổ nổi.</p>
        `;
        controlCard.querySelector("[data-action='toggle-player']")?.addEventListener("click", () => {
            const dock = document.getElementById("musicDock");
            if (!dock) {
                return;
            }
            const nextHidden = !dock.hidden && getComputedStyle(dock).display !== "none";
            dock.hidden = nextHidden;
            localStorage.setItem("profile.dashboard.musicDockHidden", String(nextHidden));
        });
        wrapper.append(controlCard);
        body.append(wrapper);
        this.renderMovedSection(wrapper, "music");
    }

    renderMedia(body) {
        const section = document.querySelector(".customizer-section[data-panel='lyrics']");
        const settings = document.getElementById("lyricsSettings");
        const mount = document.getElementById("lyricsSidebarMount");

        if (settings) {
            settings.hidden = false;
            mount?.replaceChildren(settings);
        }

        if (section) {
            section.hidden = false;
            section.classList.add("is-active");
            body.replaceChildren(section);
        } else if (settings) {
            body.replaceChildren(settings);
        }

        const note = createElement("p", "dashboard-muted", {
            text: "Lyric settings đã được tách khỏi lyric overlay để không che màn hình hát. Tune button trong lyric box được ẩn ở Dashboard mode."
        });
        body.prepend(note);
    }

    renderCalendar(body) {
        const card = createElement("div", "dashboard-control-card");
        const zones = [
            Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh",
            "Asia/Ho_Chi_Minh",
            "Asia/Tokyo",
            "Asia/Seoul",
            "Europe/London",
            "America/New_York",
            "America/Los_Angeles"
        ];
        const uniqueZones = [...new Set(zones)];
        card.innerHTML = `
            <p class="dashboard-control-title">Calendar</p>
            <div class="dashboard-mini-clock" data-clock-time>--:--</div>
            <p class="dashboard-muted" data-clock-date></p>
            <label class="dashboard-field">
                <span>Timezone</span>
                <select class="dashboard-select" data-timezone></select>
            </label>
        `;
        const select = card.querySelector("[data-timezone]");
        uniqueZones.forEach((zone) => {
            const option = createElement("option", "", { value: zone, text: zone });
            select.append(option);
        });
        select.value = localStorage.getItem("profile.dashboard.calendarTimezone") || uniqueZones[0];
        select.addEventListener("change", () => {
            localStorage.setItem("profile.dashboard.calendarTimezone", select.value);
            updateClock();
        });

        const updateClock = () => {
            const zone = select.value;
            const now = new Date();
            card.querySelector("[data-clock-time]").textContent = new Intl.DateTimeFormat("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZone: zone
            }).format(now);
            card.querySelector("[data-clock-date]").textContent = new Intl.DateTimeFormat("vi-VN", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
                timeZone: zone
            }).format(now);
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        this.timers.add(interval);
        body.append(card);
    }

    renderTimer(body) {
        const state = {
            duration: Number(localStorage.getItem("profile.dashboard.timerDuration")) || 25 * 60,
            remaining: Number(localStorage.getItem("profile.dashboard.timerDuration")) || 25 * 60,
            running: false,
            interval: null
        };
        const card = createElement("div", "dashboard-control-card");
        card.innerHTML = `
            <p class="dashboard-control-title">Pomodoro Timer</p>
            <div class="dashboard-mini-clock" data-timer-display>25:00</div>
            <label class="dashboard-field">
                <span>Minutes</span>
                <input class="dashboard-input" data-timer-minutes type="number" min="1" max="240" value="25">
            </label>
            <div class="dashboard-button-row">
                <button class="dashboard-button dashboard-button--primary" type="button" data-timer-start>Start</button>
                <button class="dashboard-button" type="button" data-timer-reset>Reset</button>
            </div>
        `;
        const display = card.querySelector("[data-timer-display]");
        const minutesInput = card.querySelector("[data-timer-minutes]");
        const startButton = card.querySelector("[data-timer-start]");
        const resetButton = card.querySelector("[data-timer-reset]");
        minutesInput.value = String(Math.round(state.duration / 60));

        const render = () => {
            const minutes = Math.floor(state.remaining / 60);
            const seconds = state.remaining % 60;
            display.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
            startButton.textContent = state.running ? "Pause" : "Start";
        };
        const stop = () => {
            state.running = false;
            if (state.interval) {
                clearInterval(state.interval);
                state.interval = null;
            }
            render();
        };
        const start = () => {
            state.running = true;
            state.interval = setInterval(() => {
                state.remaining = Math.max(0, state.remaining - 1);
                render();
                if (state.remaining <= 0) {
                    stop();
                }
            }, 1000);
        };
        startButton.addEventListener("click", () => state.running ? stop() : start());
        resetButton.addEventListener("click", () => {
            stop();
            state.duration = clamp(Number(minutesInput.value) || 25, 1, 240) * 60;
            state.remaining = state.duration;
            localStorage.setItem("profile.dashboard.timerDuration", String(state.duration));
            render();
        });
        render();
        body.append(card);
    }

    renderTasks(body) {
        const card = createElement("div", "dashboard-control-card");
        const title = document.getElementById("creativeWidgetTitle");
        const text = document.getElementById("creativeWidgetText");
        card.innerHTML = `
            <p class="dashboard-control-title">Creative Widget</p>
            <label class="dashboard-field"><span>Title</span><input class="dashboard-input" data-creative-title></label>
            <label class="dashboard-field"><span>Text</span><textarea class="dashboard-textarea" data-creative-text></textarea></label>
            <div class="dashboard-button-row">
                <button class="dashboard-button dashboard-button--primary" type="button" data-action="show-creative">Show widget</button>
                <button class="dashboard-button" type="button" data-action="hide-creative">Hide widget</button>
            </div>
        `;
        const titleInput = card.querySelector("[data-creative-title]");
        const textInput = card.querySelector("[data-creative-text]");
        titleInput.value = title?.textContent || "";
        textInput.value = text?.textContent || "";
        titleInput.addEventListener("input", () => { if (title) title.textContent = titleInput.value; });
        textInput.addEventListener("input", () => { if (text) text.textContent = textInput.value; });
        card.querySelector("[data-action='show-creative']")?.addEventListener("click", () => document.getElementById("creativeWidget")?.removeAttribute("hidden"));
        card.querySelector("[data-action='hide-creative']")?.addEventListener("click", () => document.getElementById("creativeWidget")?.setAttribute("hidden", ""));
        body.append(card);
    }

    renderNotes(body) {
        const card = createElement("div", "dashboard-control-card");
        const title = document.getElementById("shellTitle");
        const lead = document.getElementById("shellLead");
        card.innerHTML = `
            <p class="dashboard-control-title">Intro Copy</p>
            <label class="dashboard-field"><span>Title</span><input class="dashboard-input" data-shell-title></label>
            <label class="dashboard-field"><span>Content</span><textarea class="dashboard-textarea" data-shell-lead></textarea></label>
            <div class="dashboard-button-row">
                <button class="dashboard-button dashboard-button--primary" type="button" data-action="show-notes">Show intro</button>
                <button class="dashboard-button" type="button" data-action="hide-notes">Hide intro</button>
            </div>
        `;
        const titleInput = card.querySelector("[data-shell-title]");
        const leadInput = card.querySelector("[data-shell-lead]");
        titleInput.value = title?.textContent || "";
        leadInput.value = lead?.textContent || "";
        titleInput.addEventListener("input", () => { if (title) title.textContent = titleInput.value; });
        leadInput.addEventListener("input", () => { if (lead) lead.textContent = leadInput.value; });
        card.querySelector("[data-action='show-notes']")?.addEventListener("click", () => document.getElementById("shellCopy")?.removeAttribute("hidden"));
        card.querySelector("[data-action='hide-notes']")?.addEventListener("click", () => document.getElementById("shellCopy")?.setAttribute("hidden", ""));
        body.append(card);
    }

    renderProfile(body) {
        const card = createElement("div", "dashboard-control-card");
        card.innerHTML = `
            <p class="dashboard-control-title">Profile Card</p>
            <p class="dashboard-muted">Reset và bật/tắt profile card. Các thao tác drag/resize gốc của profile vẫn giữ nguyên.</p>
            <div class="dashboard-button-row">
                <button class="dashboard-button dashboard-button--primary" type="button" data-action="reset-profile">Reset profile card</button>
                <button class="dashboard-button" type="button" data-action="show-profile">Show</button>
                <button class="dashboard-button" type="button" data-action="hide-profile">Hide</button>
            </div>
        `;
        card.querySelector("[data-action='reset-profile']")?.addEventListener("click", () => this.centerCard?.resetCard?.(true));
        card.querySelector("[data-action='show-profile']")?.addEventListener("click", () => document.getElementById("cardRoot")?.removeAttribute("hidden"));
        card.querySelector("[data-action='hide-profile']")?.addEventListener("click", () => document.getElementById("cardRoot")?.setAttribute("hidden", ""));
        body.append(card);
    }
}
