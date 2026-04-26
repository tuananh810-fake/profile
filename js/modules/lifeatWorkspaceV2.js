import LifeAtWorkspace from "./lifeatWorkspace.js";

const V2_STYLE_ID = "lifeatWorkspaceV2PatchStyle";
const V2_STORAGE_KEY = "profile.lifeat.workspace.v2";
const PROFILE_STORAGE_KEY = "profile.lifeat.profileCard";
const INTRO_STYLE_KEY = "profile.lifeat.introStyle";
const TASK_STORAGE_KEY = "profile.lifeat.tasks";
const NOTES_STORAGE_KEY = "profile.lifeat.notes";
const TIMER_STORAGE_KEY = "profile.lifeat.timerMinutes";
const UI_FONT = '"Plus Jakarta Sans", "Outfit", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const V2_NAV_ITEMS = [
    { id: "spaces", label: "Spaces", shortLabel: "Spaces", icon: "◌", panel: "spaces" },
    { id: "sounds", label: "Sounds", shortLabel: "Sounds", icon: "♪", panel: "sounds" },
    { id: "cal", label: "Cal", shortLabel: "Cal", icon: "◷", panel: "calendar" },
    { id: "timer", label: "Timer", shortLabel: "Timer", icon: "⏱", panel: "timer" },
    { id: "tasks", label: "Tasks", shortLabel: "Tasks", icon: "✎", panel: "tasks" },
    { id: "notes", label: "Notes", shortLabel: "Notes", icon: "☰", panel: "notes" },
    { id: "lyric", label: "Lyric", shortLabel: "Lyric", icon: "♫", panel: "lyrics" },
    { id: "profile", label: "Profile", shortLabel: "Profile", icon: "◎", panel: "profile" },
    { id: "layout", label: "Layout", shortLabel: "Layout", icon: "▣", panel: "layout" }
];

const V2_TABS = {
    spaces: ["Videos", "Images", "Effects"],
    sounds: ["Player", "Library", "Upload"],
    lyrics: ["Text", "Effect", "Timing", "Burst"],
    profile: ["Card", "Links", "View"],
    tasks: ["Widget", "Tasks"],
    notes: ["Intro", "Style", "Notes"],
    layout: ["Visibility", "Copy", "Audio"],
    calendar: ["Today", "Zones"],
    timer: ["Focus", "Break", "Long"]
};

const LYRIC_GROUPS = {
    Text: ["lyricsScaleRange", "lyricsFontSelect", "lyricsBoldToggle", "lyricsItalicToggle", "textEffect", "colorMode", "lyricsColorPresetGallery", "lyricsPrimaryColor", "lyricsSecondaryColor", "lyricsAccentColor", "lyricsLetterSpacingRange", "lyricsWordSpacingRange", "lyricsAlignSelect"],
    Effect: ["lyricsKineticWordsRange", "lyricsKineticCharsRange", "lyricsKineticSpeedRange", "lyricsSmoothModeToggle", "lyricsKineticStyleSelect"],
    Timing: ["lyricsDelayRange", "lyricsBoxHazeRange"],
    Burst: ["lyricsTailBurstToggle", "lyricsTailBurstStyleSelect", "lyricsTailBurstColorA", "lyricsTailBurstColorB", "lyricsTailBurstColorCore", "lyricsTailBurstStrengthRange", "lyricsTailBurstParticlesRange", "lyricsTailBurstSpreadRange", "lyricsTailBurstGravityRange", "lyricsTailBurstDurationRange"]
};

function h(tagName, className = "", attrs = {}) {
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
    if (!isHex(hex)) return hex;
    const raw = hex.slice(1);
    const red = Number.parseInt(raw.slice(0, 2), 16);
    const green = Number.parseInt(raw.slice(2, 4), 16);
    const blue = Number.parseInt(raw.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function injectV2Styles() {
    if (document.getElementById(V2_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = V2_STYLE_ID;
    style.textContent = `
        :root { --lifeat-ui-font: ${UI_FONT}; --lifeat-accent: #ff8f7a; --lifeat-accent-2: #f9739a; }
        .legacy-dashboard-dock, .legacy-dashboard-window { display: none !important; }
        .lifeat-workspace, .lifeat-workspace *, .lifeat-panel .customizer-section, .lifeat-panel .customizer-section *, .lifeat-panel .lyrics-setting, .lifeat-panel .lyrics-setting *, .music-dock, .music-dock *, .focus-player, .focus-player *, .profile-card, .profile-card *, .lyrics-header, .lyrics-header * { font-family: var(--lifeat-ui-font) !important; }
        .lifeat-panel { width: min(24.4rem, calc(100vw - 6.6rem)) !important; }
        .lifeat-panel-body { padding: .9rem .75rem 1.2rem !important; }
        .lifeat-tabs { display: grid !important; grid-auto-flow: column !important; grid-auto-columns: minmax(5rem, 1fr) !important; overflow-x: auto !important; scrollbar-width: none; }
        .lifeat-tabs::-webkit-scrollbar { display: none; }
        .lifeat-tab { white-space: nowrap; }
        .lifeat-card { display: grid; gap: .75rem; margin-bottom: .78rem; padding: .88rem; border: 1px solid rgba(15,23,42,.08); border-radius: 1rem; background: rgba(255,255,255,.68); box-shadow: 0 12px 28px rgba(15,23,42,.06); color: #243044; }
        .lifeat-card--flat { background: rgba(255,255,255,.46); box-shadow: none; }
        .lifeat-panel-title { margin: 0; color: #243044; font-size: .96rem; font-weight: 860; letter-spacing: -.01em; }
        .lifeat-muted { margin: 0; color: rgba(31,42,58,.64); font-size: .78rem; font-weight: 560; line-height: 1.45; }
        .lifeat-field { display: grid; gap: .38rem; }
        .lifeat-label { color: rgba(31,42,58,.64); font-size: .68rem; font-weight: 860; letter-spacing: .06em; text-transform: uppercase; }
        .lifeat-input, .lifeat-textarea, .lifeat-select { width: 100%; border: 1px solid rgba(15,23,42,.12); border-radius: .78rem; background: rgba(255,255,255,.86); color: #243044; font: inherit; outline: 0; padding: .68rem .78rem; }
        .lifeat-textarea { min-height: 8.4rem; resize: vertical; }
        .lifeat-row, .lifeat-action-row { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; }
        .lifeat-action { min-height: 2.35rem; padding: 0 .88rem; border: 1px solid rgba(15,23,42,.11); border-radius: 999px; background: rgba(255,255,255,.78); color: #243044; cursor: pointer; font: inherit; font-size: .76rem; font-weight: 820; }
        .lifeat-action--primary { color: #fff; background: linear-gradient(135deg, var(--lifeat-accent), var(--lifeat-accent-2)); border-color: rgba(249,115,154,.38); }
        .lifeat-mini-player { display: grid; gap: .7rem; }
        .lifeat-now-row { display: grid; grid-template-columns: 3.4rem minmax(0,1fr) auto; gap: .72rem; align-items: center; }
        .lifeat-artwork { display: grid; place-items: center; width: 3.4rem; height: 3.4rem; border-radius: .9rem; color: #fff; background: linear-gradient(135deg, #4357ff, #152044); font-weight: 900; }
        .lifeat-progress { height: .42rem; overflow: hidden; border-radius: 999px; background: rgba(15,23,42,.16); }
        .lifeat-progress-fill { display: block; width: 0%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #74d7ff, #ff8f7a); }
        .lifeat-time-row { display: flex; justify-content: space-between; color: rgba(31,42,58,.58); font-size: .72rem; font-weight: 750; }
        .lifeat-track-list { display: grid; gap: .55rem; }
        .lifeat-track-card { display: grid; grid-template-columns: auto minmax(0,1fr) auto; gap: .55rem; align-items: center; padding: .58rem; border: 1px solid rgba(15,23,42,.08); border-radius: .86rem; background: rgba(255,255,255,.64); color: #243044; text-align: left; cursor: pointer; }
        .lifeat-track-index { display: grid; place-items: center; width: 1.9rem; height: 1.9rem; border-radius: 999px; background: rgba(15,23,42,.08); color: rgba(31,42,58,.66); font-size: .72rem; font-weight: 850; }
        .lifeat-track-copy { min-width: 0; display: grid; gap: .12rem; }
        .lifeat-track-title { overflow: hidden; color: #374151; font-size: .74rem; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
        .lifeat-track-artist { overflow: hidden; color: rgba(31,42,58,.58); font-size: .7rem; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
        .lifeat-clock-large { font-size: clamp(2.4rem, 11vw, 4rem); font-weight: 880; letter-spacing: -.08em; color: #111827; }
        .lifeat-task-list { display: grid; gap: .55rem; }
        .lifeat-task-item { display: grid; grid-template-columns: auto 1fr auto; gap: .55rem; align-items: center; padding: .55rem; border-radius: .76rem; background: rgba(15,23,42,.045); }
        .lifeat-task-item.is-done span { color: rgba(31,42,58,.42); text-decoration: line-through; }
        .lifeat-task-remove { border: 0; background: transparent; color: rgba(31,42,58,.52); cursor: pointer; font-weight: 900; }
        .lifeat-panel .customizer-field, .lifeat-panel .customizer-block, .lifeat-panel .customizer-actions, .lifeat-panel .customizer-upload-status, .lifeat-panel .customizer-library, .lifeat-panel .lyrics-setting { display: grid !important; gap: .42rem !important; padding: .66rem !important; border: 1px solid rgba(15,23,42,.06) !important; border-radius: .78rem !important; background: rgba(15,23,42,.045) !important; box-shadow: none !important; }
        .lifeat-panel .customizer-section, .lifeat-panel .customizer-background-option { display: grid !important; gap: .86rem !important; margin: 0 !important; padding: 0 !important; border: 0 !important; color: #243044 !important; background: transparent !important; box-shadow: none !important; opacity: 1 !important; transform: none !important; pointer-events: auto !important; }
        .lifeat-panel .customizer-tabs, .lifeat-panel .customizer-header, .lifeat-panel .customizer-note { display: none !important; }
        .lifeat-panel .customizer-label, .lifeat-panel .lyrics-setting-label, .lifeat-panel .customizer-value, .lifeat-panel .lyrics-setting-value { color: rgba(31,42,58,.68) !important; }
        .lifeat-panel .customizer-input, .lifeat-panel .lyrics-font-select { border-color: rgba(15,23,42,.12) !important; background: rgba(255,255,255,.86) !important; color: #243044 !important; }
        .lifeat-panel .customizer-button, .lifeat-panel .background-switch-btn, .lifeat-panel .scene-nav-btn, .lifeat-panel .lyrics-control-btn { border-color: rgba(15,23,42,.12) !important; background: rgba(255,255,255,.78) !important; color: #243044 !important; font-weight: 820 !important; }
        .lifeat-panel .customizer-button--primary, .lifeat-panel .background-switch-btn.is-active, .lifeat-panel .lyrics-control-btn--accent, .lifeat-panel .lyrics-control-btn[aria-pressed="true"] { color: #fff !important; background: linear-gradient(135deg, var(--lifeat-accent), var(--lifeat-accent-2)) !important; border-color: rgba(249,115,154,.42) !important; }
        .lyrics-overlay .lyrics-settings { display: none !important; }
    `;
    document.head.append(style);
}

export default class LifeAtWorkspaceV2 extends LifeAtWorkspace {
    constructor(options = {}) {
        super(options);
        this.v2Cleanups = [];
        this.state = {
            collapsed: false,
            activePanel: null,
            activeTabs: { spaces: "Videos", sounds: "Player", lyrics: "Text", profile: "Card", tasks: "Widget", notes: "Intro", layout: "Visibility", calendar: "Today", timer: "Focus" },
            spaceCategory: "all",
            ...readJson(V2_STORAGE_KEY, {})
        };
    }

    init() {
        injectV2Styles();
        this.cacheSections();
        this.hideLegacyCustomizer();
        document.querySelectorAll(".legacy-dashboard-dock, .legacy-dashboard-window").forEach((node) => node.remove());
        this.applyStoredProfile();
        this.applyIntroStyle();
        this.buildWorkspace();
        this.attachGlobalEvents();
        this.syncRailState();
        this.restoreLastPanel();
    }

    writeState() { writeJson(V2_STORAGE_KEY, this.state); }

    buildWorkspace() {
        this.root = h("div", "lifeat-workspace", { "aria-label": "LifeAt workspace" });
        this.rail = h("nav", "lifeat-rail", { "aria-label": "Workspace navigation" });
        this.topGroup = h("div", "lifeat-rail-group lifeat-rail-group--top");
        this.mainGroup = h("div", "lifeat-rail-group lifeat-rail-group--scroll");
        this.bottomGroup = h("div", "lifeat-rail-group lifeat-rail-group--bottom");
        V2_NAV_ITEMS.forEach((item) => {
            const button = this.createNavButton(item);
            this.navButtons.set(item.id, button);
            (item.id === "spaces" ? this.topGroup : this.mainGroup).append(button);
        });
        this.collapseButton = h("button", "lifeat-collapse-button", { type: "button", title: "Collapse or expand navigation", "aria-label": "Collapse navigation", html: `<span class="lifeat-nav-icon" aria-hidden="true">...</span><span class="lifeat-nav-label">More</span>` });
        this.collapseButton.addEventListener("click", () => this.toggleRail());
        this.bottomGroup.append(this.collapseButton);
        this.rail.append(this.topGroup, this.mainGroup, this.bottomGroup);
        this.panel = this.createPanel();
        this.root.append(this.rail, this.panel);
        document.body.append(this.root);
    }

    createNavButton(item) {
        const button = h("button", "lifeat-nav-button", { type: "button", title: item.label, "aria-label": item.label, html: `<span class="lifeat-nav-icon" aria-hidden="true">${item.icon}</span><span class="lifeat-nav-label">${item.shortLabel}</span>` });
        button.dataset.panel = item.panel;
        button.dataset.navId = item.id;
        button.addEventListener("click", () => this.openPanel(item.panel, item.id));
        return button;
    }

    attachGlobalEvents() {
        document.getElementById("lyricsTuneBtn")?.addEventListener("click", (event) => { event.preventDefault(); this.openPanel("lyrics", "lyric"); });
        this.appShell?.addEventListener("profile:open-customizer-tab", (event) => {
            const tabId = event.detail?.tabId || "music";
            const map = { background: "spaces", music: "sounds", lyrics: "lyrics", layout: "layout" };
            const panel = map[tabId] || tabId;
            this.openPanel(panel, this.navIdForPanel(panel));
        });
    }

    navIdForPanel(panel) { return V2_NAV_ITEMS.find((item) => item.panel === panel)?.id || "spaces"; }
    getActiveTab(panel) { const tabs = V2_TABS[panel] || ["Main"]; const active = this.state.activeTabs?.[panel]; return tabs.includes(active) ? active : tabs[0]; }
    setActiveTab(panel, tab) { this.state.activeTabs = { ...(this.state.activeTabs || {}), [panel]: tab }; this.writeState(); }

    renderHeader(panel) {
        const tabs = V2_TABS[panel] || ["Main"];
        const active = this.getActiveTab(panel);
        this.tabsMount.replaceChildren(...tabs.map((label) => {
            const button = h("button", `lifeat-tab${label === active ? " is-active" : ""}`, { type: "button", text: label });
            button.addEventListener("click", () => { this.setActiveTab(panel, label); this.renderHeader(panel); this.renderPanel(panel); });
            return button;
        }));
        this.searchInput.placeholder = panel === "spaces" ? "Search space" : `Search ${panel}`;
        this.searchInput.value = "";
        this.chipsMount.hidden = panel !== "spaces";
        if (panel === "spaces") this.renderSpaceChips(); else this.chipsMount.replaceChildren();
    }

    renderPanel(panel) {
        this.clearV2Cleanups();
        this.panelBody.replaceChildren();
        if (panel === "spaces") return this.renderSpaces(this.panelBody);
        if (panel === "sounds") return this.renderSounds(this.panelBody);
        if (panel === "lyrics") return this.renderLyrics(this.panelBody);
        if (panel === "profile") return this.renderProfile(this.panelBody);
        if (panel === "tasks") return this.renderTasks(this.panelBody);
        if (panel === "notes") return this.renderNotes(this.panelBody);
        if (panel === "layout") return this.renderLayout(this.panelBody);
        if (panel === "calendar") return this.renderCalendar(this.panelBody);
        if (panel === "timer") return this.renderTimer(this.panelBody);
    }

    closePanel() { this.clearV2Cleanups(); return super.closePanel(); }
    clearV2Cleanups() { this.v2Cleanups.forEach((cleanup) => cleanup()); this.v2Cleanups = []; }
    addV2Cleanup(cleanup) { this.v2Cleanups.push(cleanup); }

    statusForPanel(panel) {
        const map = { spaces: "Spaces panel opened. Background is no longer duplicated.", sounds: "Sounds are split into Player, Library and Upload.", lyrics: "Lyric controls opened from the dedicated Lyric item.", profile: "Profile card editor opened.", tasks: "Tasks are connected to the creative widget.", notes: "Notes and intro panel editor opened.", layout: "Layout controls opened.", calendar: "Calendar panel opened.", timer: "Timer panel opened." };
        return map[panel] || "Workspace panel opened.";
    }

    card(title, text = "", flat = false) {
        const card = h("section", `lifeat-card${flat ? " lifeat-card--flat" : ""}`);
        if (title) card.append(h("p", "lifeat-panel-title", { text: title }));
        if (text) card.append(h("p", "lifeat-muted", { text }));
        return card;
    }

    renderSpaces(body) {
        body.append(this.card("Spaces", "Video, image and effect background controls live here. The duplicate Background entry has been removed."));
        return super.renderSpaces(body);
    }

    renderSounds(body) {
        const tab = this.getActiveTab("sounds");
        if (tab === "Library") return this.renderSoundLibrary(body);
        if (tab === "Upload") return this.renderSoundUpload(body);
        return this.renderSoundPlayer(body);
    }

    renderSoundPlayer(body) {
        const card = this.card("Player", "Current Module 04 track. Upload and library controls are separated.");
        const player = h("div", "lifeat-mini-player");
        player.innerHTML = `<div class="lifeat-now-row"><div class="lifeat-artwork" data-lifeat-artwork>--</div><div class="lifeat-track-copy"><strong class="lifeat-track-title" data-lifeat-title>--</strong><span class="lifeat-track-artist" data-lifeat-artist>--</span></div><span class="lifeat-track-artist" data-lifeat-state>idle</span></div><div class="lifeat-progress"><span class="lifeat-progress-fill" data-lifeat-progress></span></div><div class="lifeat-time-row"><span data-lifeat-current>0:00</span><span data-lifeat-duration>0:00</span></div>`;
        const actions = h("div", "lifeat-action-row");
        actions.append(this.proxyButton("Prev", "musicPrevBtn"), this.proxyButton("Play / Pause", "musicPlayBtn", true), this.proxyButton("Next", "musicNextBtn"));
        player.append(actions);
        card.append(player);
        body.append(card);
        const audio = document.getElementById("musicAudio");
        const update = () => {
            const track = this.musicPlayer?.getCurrentTrack?.() || {};
            const title = track.title || document.getElementById("musicTrackName")?.textContent || "No track";
            const artist = track.artist || document.getElementById("musicTrackArtist")?.textContent || "Unknown artist";
            const duration = audio?.duration || 0;
            const currentTime = audio?.currentTime || 0;
            const ratio = duration > 0 ? clamp(currentTime / duration, 0, 1) : 0;
            player.querySelector("[data-lifeat-title]").textContent = title;
            player.querySelector("[data-lifeat-artist]").textContent = artist;
            player.querySelector("[data-lifeat-state]").textContent = audio?.paused ? "paused" : "playing";
            player.querySelector("[data-lifeat-artwork]").textContent = title.slice(0, 2).toUpperCase();
            player.querySelector("[data-lifeat-progress]").style.width = `${Math.round(ratio * 100)}%`;
            player.querySelector("[data-lifeat-current]").textContent = formatTime(currentTime);
            player.querySelector("[data-lifeat-duration]").textContent = formatTime(duration);
        };
        update();
        if (audio) {
            const events = ["timeupdate", "play", "pause", "loadedmetadata", "durationchange"];
            events.forEach((name) => audio.addEventListener(name, update));
            this.addV2Cleanup(() => events.forEach((name) => audio.removeEventListener(name, update)));
        }
    }

    proxyButton(label, targetId, primary = false) {
        const button = h("button", `lifeat-action${primary ? " lifeat-action--primary" : ""}`, { type: "button", text: label });
        button.addEventListener("click", () => document.getElementById(targetId)?.click());
        return button;
    }

    renderSoundLibrary(body) {
        const card = this.card("Library", "Saved local tracks and built-in songs only. No upload controls here.");
        const list = h("div", "lifeat-track-list", { "data-filterable": "tracks" });
        const tracks = this.musicPlayer?.getPlaylist?.() || [];
        tracks.forEach((track, index) => list.append(this.trackButton(track, index)));
        if (!tracks.length) list.append(h("p", "lifeat-muted", { text: "No tracks loaded." }));
        card.append(list);
        const savedLibrary = document.getElementById("customTrackLibrary");
        if (savedLibrary) { savedLibrary.hidden = false; card.append(savedLibrary); }
        body.append(card);
    }

    trackButton(track, index) {
        const button = h("button", "lifeat-track-card", { type: "button", dataset: { search: `${track.title || ""} ${track.artist || ""}`.toLowerCase() } });
        button.append(h("span", "lifeat-track-index", { text: track.isPersistedCustom ? "UP" : String(index + 1).padStart(2, "0") }), h("span", "lifeat-track-copy", { html: `<strong class="lifeat-track-title"></strong><span class="lifeat-track-artist"></span>` }), h("span", "lifeat-track-artist", { text: track.isPersistedCustom ? "Saved" : "Built-in" }));
        button.querySelector("strong").textContent = track.title || "Untitled";
        button.querySelector(".lifeat-track-copy span").textContent = track.artist || "Unknown artist";
        button.addEventListener("click", () => this.musicPlayer?.loadTrackById?.(track.id, true));
        return button;
    }

    renderSoundUpload(body) {
        const card = this.card("Upload", "Add audio, LRC and word timing JSON. Saved tracks appear in Library.");
        this.appendExisting(card, ["customTrackTitle", "customTrackArtist", "customAudioFile", "customLyricsFile", "customLyricsProFile", "applyCustomTrackBtn", "customTrackStatus"]);
        body.append(card);
    }

    renderLyrics(body) {
        const tab = this.getActiveTab("lyrics");
        body.append(this.card("Lyric", "Dedicated Lyric toolbar item with controls split by Text, Effect, Timing and Burst."));
        const quick = this.card("Quick mode", "Mirrors the overlay controls without moving the lyric overlay.", true);
        const actions = h("div", "lifeat-action-row");
        [["Box", "lyricsBoxBtn"], ["Pure", "lyricsPureBtn"], ["Kinetic", "lyricsKineticBtn"], ["Reset", "lyricsResetBtn"], ["Focus", "lyricsFocusBtn"]].forEach(([label, id], index) => actions.append(this.proxyButton(label, id, index === 0)));
        quick.append(actions);
        body.append(quick);
        const controls = this.card(`${tab} controls`, "", true);
        if (this.lyricsSettings) this.lyricsSettings.hidden = false;
        this.appendExisting(controls, LYRIC_GROUPS[tab] || LYRIC_GROUPS.Text);
        body.append(controls);
    }

    renderProfile(body) {
        const tab = this.getActiveTab("profile");
        if (tab === "Links") return this.renderProfileLinks(body);
        if (tab === "View") return this.renderProfileView(body);
        return this.renderProfileEditor(body);
    }

    profileDefaults() {
        const p = this.config.profile || {};
        const links = Object.fromEntries((p.socialLinks || []).map((link) => [link.id, link.href || ""]));
        return { label: p.label || "visual profile card", name: p.name || "Tuan Anh", tagline: p.tagline || "Mood-first interface designer", bio: p.bio || "Profile bio", initials: p.initials || "TA", avatar: p.avatar || "./avatar.jpg", verified: p.verified !== false, links };
    }
    readProfile() { const stored = readJson(PROFILE_STORAGE_KEY, {}); const defaults = this.profileDefaults(); return { ...defaults, ...stored, links: { ...defaults.links, ...(stored.links || {}) } }; }
    saveProfile(profile) { writeJson(PROFILE_STORAGE_KEY, profile); this.applyProfile(profile); }
    applyStoredProfile() { this.applyProfile(this.readProfile()); }

    applyProfile(profile) {
        const byId = (id) => document.getElementById(id);
        if (byId("profileLabel")) byId("profileLabel").textContent = profile.label;
        if (byId("profileName")) byId("profileName").textContent = profile.name;
        if (byId("profileTagline")) byId("profileTagline").textContent = profile.tagline;
        if (byId("profileBio")) byId("profileBio").textContent = profile.bio;
        if (byId("avatarFallback")) byId("avatarFallback").textContent = profile.initials;
        if (byId("profileAvatar") && profile.avatar) byId("profileAvatar").src = profile.avatar;
        if (byId("profileBadge")) byId("profileBadge").hidden = !profile.verified;
        byId("profileSocialLinks")?.querySelectorAll("a").forEach((anchor) => {
            const label = (anchor.getAttribute("aria-label") || "").toLowerCase();
            const key = label.includes("facebook") ? "facebook" : label.includes("tiktok") ? "tiktok" : label.includes("github") ? "github" : null;
            if (key && profile.links?.[key]) anchor.href = profile.links[key];
        });
        this.config.profile = { ...(this.config.profile || {}), ...profile };
    }

    renderProfileEditor(body) {
        const p = this.readProfile();
        const card = this.card("Profile card", "Edit the visible center card content. Use View if the card is hidden.");
        card.append(this.textField("Label", p.label, (value) => this.updateProfile({ label: value })), this.textField("Name", p.name, (value) => this.updateProfile({ name: value })), this.textField("Tagline", p.tagline, (value) => this.updateProfile({ tagline: value })), this.textField("Bio", p.bio, (value) => this.updateProfile({ bio: value }), true), this.textField("Initials", p.initials, (value) => this.updateProfile({ initials: value.slice(0, 4).toUpperCase() })), this.textField("Avatar URL", p.avatar, (value) => this.updateProfile({ avatar: value })), this.checkboxField("Verified badge", p.verified, (checked) => this.updateProfile({ verified: checked })));
        const actions = h("div", "lifeat-action-row");
        const show = h("button", "lifeat-action lifeat-action--primary", { type: "button", text: "Show card" });
        show.addEventListener("click", () => this.showProfileCard());
        const center = h("button", "lifeat-action", { type: "button", text: "Center card" });
        center.addEventListener("click", () => this.centerCard?.resetCard?.(true));
        actions.append(show, center);
        card.append(actions);
        body.append(card);
    }

    renderProfileLinks(body) {
        const p = this.readProfile();
        const card = this.card("Profile links", "Update the social URLs in the profile card.");
        ["facebook", "tiktok", "github"].forEach((key) => card.append(this.textField(`${key[0].toUpperCase()}${key.slice(1)} URL`, p.links?.[key] || "", (value) => { const next = this.readProfile(); next.links = { ...(next.links || {}), [key]: value }; this.saveProfile(next); })));
        body.append(card);
    }

    renderProfileView(body) {
        const card = this.card("Profile view", "Restore the card when it is hidden or out of place.");
        const actions = h("div", "lifeat-action-row");
        const show = h("button", "lifeat-action lifeat-action--primary", { type: "button", text: "Show profile card" });
        show.addEventListener("click", () => this.showProfileCard());
        const reset = h("button", "lifeat-action", { type: "button", text: "Reset position" });
        reset.addEventListener("click", () => this.centerCard?.resetCard?.(true));
        actions.append(show, reset);
        card.append(actions);
        body.append(card);
    }

    updateProfile(partial) { this.saveProfile({ ...this.readProfile(), ...partial }); }

    showProfileCard() {
        const root = this.centerCard?.root || document.getElementById("cardRoot");
        if (root) { root.hidden = false; root.style.display = ""; }
        if (this.customizerPanel?.layoutState) { this.customizerPanel.layoutState.hideProfileCard = false; this.customizerPanel.persistLayoutState?.(); this.customizerPanel.applyLayoutState?.(); }
        const toggle = document.getElementById("toggleProfileCard");
        if (toggle) toggle.checked = false;
    }

    renderTasks(body) { return this.getActiveTab("tasks") === "Tasks" ? this.renderTaskList(body) : this.renderCreativeWidgetEditor(body); }

    renderCreativeWidgetEditor(body) {
        const state = this.creativeWidget?.getState?.() || {};
        const card = this.card("Creative widget", "Tasks is connected to the creative widget. Edit its content and visual style here.");
        card.append(this.textField("Widget title", state.title || "", (value) => this.creativeWidget?.setContent?.({ title: value }, true)), this.textField("Widget body", state.body || "", (value) => this.creativeWidget?.setContent?.({ body: value }, true), true), this.selectField("Font", this.creativeWidget?.getFontPresets?.() || [], state.fontPreset, (value) => this.creativeWidget?.setTypography?.({ fontPreset: value }, true)), this.selectField("Align", ["left", "center", "right"].map((id) => ({ id, label: id })), state.textAlign, (value) => this.creativeWidget?.setTypography?.({ textAlign: value }, true)), this.rangeField("Scale", Math.round((state.textScale || 1) * 100), 70, 260, 1, (value) => this.creativeWidget?.setTypography?.({ textScale: Number(value) / 100 }, true)), this.colorField("Text color", state.textColor || "#f7fbff", (value) => this.creativeWidget?.setTypography?.({ textColor: value }, true)), this.colorField("Accent color", state.accentColor || "#9feeff", (value) => this.creativeWidget?.setTypography?.({ accentColor: value }, true)));
        const show = h("button", "lifeat-action lifeat-action--primary", { type: "button", text: "Show widget" });
        show.addEventListener("click", () => { if (this.creativeWidget?.root) this.creativeWidget.root.hidden = false; });
        const row = h("div", "lifeat-action-row"); row.append(show); card.append(row);
        body.append(card);
    }

    renderTaskList(body) {
        const card = this.card("Task list", "Browser-local task list.");
        const tasks = readJson(TASK_STORAGE_KEY, []);
        const form = h("form", "lifeat-action-row");
        const input = h("input", "lifeat-input", { name: "task", placeholder: "Add a task", autocomplete: "off" });
        const add = h("button", "lifeat-action lifeat-action--primary", { type: "submit", text: "Add" });
        const list = h("div", "lifeat-task-list");
        form.append(input, add);
        const save = () => writeJson(TASK_STORAGE_KEY, tasks);
        const render = () => { list.replaceChildren(...tasks.map((task, index) => { const item = h("label", `lifeat-task-item${task.done ? " is-done" : ""}`); const check = h("input", "", { type: "checkbox" }); check.checked = Boolean(task.done); const text = h("span", "", { text: task.text }); const remove = h("button", "lifeat-task-remove", { type: "button", text: "x", "aria-label": "Remove task" }); check.addEventListener("change", () => { tasks[index].done = check.checked; save(); render(); }); remove.addEventListener("click", () => { tasks.splice(index, 1); save(); render(); }); item.append(check, text, remove); return item; })); };
        form.addEventListener("submit", (event) => { event.preventDefault(); const value = input.value.trim(); if (!value) return; tasks.unshift({ text: value, done: false, createdAt: Date.now() }); input.value = ""; save(); render(); });
        render();
        card.append(form, list);
        body.append(card);
    }

    renderNotes(body) {
        const tab = this.getActiveTab("notes");
        if (tab === "Style") return this.renderIntroStyle(body);
        if (tab === "Notes") return this.renderPlainNotes(body);
        return this.renderIntroEditor(body);
    }

    introDefaults() { return { visible: true, fontFamily: UI_FONT, titleColor: "#f8fbff", leadColor: "#d8e5ff", panelBackground: "rgba(8, 15, 34, 0.46)", borderColor: "rgba(255, 255, 255, 0.16)" }; }
    readIntroStyle() { return { ...this.introDefaults(), ...readJson(INTRO_STYLE_KEY, {}) }; }
    saveIntroStyle(style) { writeJson(INTRO_STYLE_KEY, style); this.applyIntroStyle(style); }

    applyIntroStyle(style = this.readIntroStyle()) {
        const root = this.shell?.copyRoot || document.getElementById("shellCopy");
        const panel = this.shell?.copyPanel || document.getElementById("shellCopyPanel");
        const title = document.getElementById("shellTitle");
        const lead = document.getElementById("shellLead");
        if (root) root.hidden = style.visible === false;
        if (panel) { panel.style.fontFamily = style.fontFamily; panel.style.background = style.panelBackground; panel.style.borderColor = style.borderColor; }
        if (title) { title.style.color = style.titleColor; title.style.fontFamily = style.fontFamily; }
        if (lead) { lead.style.color = style.leadColor; lead.style.fontFamily = style.fontFamily; }
    }

    renderIntroEditor(body) {
        const copy = this.shell?.getCopyState?.() || {};
        const card = this.card("Intro panel", "Notes controls the intro panel: show/hide and edit title/lead content.");
        card.append(this.textField("Intro title", copy.title || this.config.shell?.title || "", (value) => this.shell?.setCopyContent?.({ title: value }, true)), this.textField("Intro text", copy.lead || this.config.shell?.lead || "", (value) => this.shell?.setCopyContent?.({ lead: value }, true), true));
        const actions = h("div", "lifeat-action-row");
        const show = h("button", "lifeat-action lifeat-action--primary", { type: "button", text: "Show intro panel" });
        const hide = h("button", "lifeat-action", { type: "button", text: "Hide intro panel" });
        show.addEventListener("click", () => this.setIntroVisible(true));
        hide.addEventListener("click", () => this.setIntroVisible(false));
        actions.append(show, hide); card.append(actions); body.append(card);
    }

    setIntroVisible(visible) {
        this.saveIntroStyle({ ...this.readIntroStyle(), visible });
        if (this.customizerPanel?.layoutState) { this.customizerPanel.layoutState.hideShellCopy = !visible; this.customizerPanel.persistLayoutState?.(); this.customizerPanel.applyLayoutState?.(); }
        const toggle = document.getElementById("toggleShellCopy"); if (toggle) toggle.checked = !visible;
    }

    renderIntroStyle(body) {
        const style = this.readIntroStyle();
        const fonts = [{ id: UI_FONT, label: "Jakarta / Outfit" }, { id: '"Space Grotesk", "Outfit", sans-serif', label: "Space Grotesk" }, { id: '"Sora", "Outfit", sans-serif', label: "Sora" }, { id: 'Georgia, "Times New Roman", serif', label: "Serif" }];
        const card = this.card("Intro style", "Change font and colors for the intro panel.");
        card.append(this.selectField("Font", fonts, style.fontFamily, (value) => this.saveIntroStyle({ ...this.readIntroStyle(), fontFamily: value })), this.colorField("Title color", style.titleColor, (value) => this.saveIntroStyle({ ...this.readIntroStyle(), titleColor: value })), this.colorField("Text color", style.leadColor, (value) => this.saveIntroStyle({ ...this.readIntroStyle(), leadColor: value })), this.colorField("Panel background", "#10192e", (value) => this.saveIntroStyle({ ...this.readIntroStyle(), panelBackground: hexToRgba(value, 0.52) })), this.colorField("Border color", "#ffffff", (value) => this.saveIntroStyle({ ...this.readIntroStyle(), borderColor: hexToRgba(value, 0.18) })));
        body.append(card);
    }

    renderPlainNotes(body) {
        const card = this.card("Notes", "Browser-local freeform notes.");
        const textarea = h("textarea", "lifeat-textarea", { placeholder: "Write ideas, lyric notes, tasks or reminders..." });
        textarea.value = localStorage.getItem(NOTES_STORAGE_KEY) || "";
        textarea.addEventListener("input", () => localStorage.setItem(NOTES_STORAGE_KEY, textarea.value));
        card.append(textarea); body.append(card);
    }

    renderLayout(body) { body.append(this.card("Layout", "Layout keeps visibility controls. Profile content moved to Profile; creative widget moved to Tasks.")); return this.appendMovedSection(body, "layout"); }

    renderCalendar(body) {
        const card = this.card("Calendar", "Local time and common zones.");
        const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh";
        const zones = [...new Set([localZone, "Asia/Ho_Chi_Minh", "Asia/Tokyo", "Asia/Seoul", "Europe/London", "America/New_York", "America/Los_Angeles"])];
        const clock = h("div", "lifeat-clock-large", { text: "--:--" });
        const date = h("p", "lifeat-muted");
        const select = h("select", "lifeat-select");
        zones.forEach((zone) => select.append(h("option", "", { value: zone, text: zone })));
        const update = () => { const timeZone = select.value; const now = new Date(); clock.textContent = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone }).format(now); date.textContent = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone }).format(now); };
        select.addEventListener("change", update); update(); const timer = window.setInterval(update, 1000); this.addV2Cleanup(() => window.clearInterval(timer)); card.append(clock, date, select); body.append(card);
    }

    renderTimer(body) {
        const tab = this.getActiveTab("timer");
        const defaultMinutes = tab === "Break" ? 5 : tab === "Long" ? 15 : Number(localStorage.getItem(TIMER_STORAGE_KEY)) || 25;
        if (!this.timer.remaining || !this.timer.isRunning) this.timer.remaining = defaultMinutes * 60;
        const card = this.card("Focus timer", "Simple timer stored in this browser.");
        const display = h("div", "lifeat-clock-large", { text: "25:00" });
        const minutes = h("input", "lifeat-input", { type: "number", min: "1", max: "180", value: String(defaultMinutes) });
        const start = h("button", "lifeat-action lifeat-action--primary", { type: "button", text: "Start" });
        const reset = h("button", "lifeat-action", { type: "button", text: "Reset" });
        const actions = h("div", "lifeat-action-row"); actions.append(start, reset);
        const render = () => { display.textContent = `${Math.floor(this.timer.remaining / 60).toString().padStart(2, "0")}:${Math.floor(this.timer.remaining % 60).toString().padStart(2, "0")}`; start.textContent = this.timer.isRunning ? "Pause" : "Start"; };
        const stop = () => { window.clearInterval(this.timer.interval); this.timer.interval = null; };
        const doReset = () => { const next = clamp(Number(minutes.value) || defaultMinutes, 1, 180); localStorage.setItem(TIMER_STORAGE_KEY, String(next)); this.timer.remaining = next * 60; this.timer.isRunning = false; stop(); render(); };
        const tick = () => { if (this.timer.remaining <= 0) { this.timer.isRunning = false; stop(); render(); this.shell?.setStatus?.("Focus timer finished."); return; } this.timer.remaining -= 1; render(); };
        start.addEventListener("click", () => { this.timer.isRunning = !this.timer.isRunning; stop(); if (this.timer.isRunning) this.timer.interval = window.setInterval(tick, 1000); render(); });
        reset.addEventListener("click", doReset); minutes.addEventListener("change", doReset); render(); card.append(display, this.wrapField("Minutes", minutes), actions); body.append(card);
    }

    textField(label, value, onInput, textarea = false) { const input = textarea ? h("textarea", "lifeat-textarea") : h("input", "lifeat-input", { type: "text" }); input.value = value || ""; input.addEventListener("input", () => onInput(input.value)); return this.wrapField(label, input); }
    colorField(label, value, onInput) { const input = h("input", "lifeat-input", { type: "color", value: isHex(value) ? value : "#ffffff" }); input.addEventListener("input", () => onInput(input.value)); input.addEventListener("change", () => onInput(input.value)); return this.wrapField(label, input); }
    rangeField(label, value, min, max, step, onInput) { const input = h("input", "lifeat-input", { type: "range", value: String(value), min: String(min), max: String(max), step: String(step) }); const output = h("span", "lifeat-muted", { text: String(value) }); input.addEventListener("input", () => { output.textContent = input.value; onInput(input.value); }); const field = this.wrapField(label, input); field.append(output); return field; }
    selectField(label, options, value, onInput) { const select = h("select", "lifeat-select"); options.forEach((option) => { const id = typeof option === "string" ? option : option.id; const optionLabel = typeof option === "string" ? option : option.label; select.append(h("option", "", { value: id, text: optionLabel || id })); }); select.value = value || options[0]?.id || options[0] || ""; select.addEventListener("change", () => onInput(select.value)); return this.wrapField(label, select); }
    checkboxField(label, checked, onInput) { const input = h("input", "", { type: "checkbox" }); input.checked = Boolean(checked); input.addEventListener("change", () => onInput(input.checked)); const wrapper = h("label", "lifeat-row"); wrapper.append(input, h("span", "lifeat-muted", { text: label })); return wrapper; }
    wrapField(label, input) { const field = h("label", "lifeat-field"); field.append(h("span", "lifeat-label", { text: label }), input); return field; }

    appendExisting(parent, ids) {
        const seen = new Set();
        ids.forEach((id) => { const node = this.existingWrapper(id); if (!node || seen.has(node)) return; seen.add(node); node.hidden = false; node.removeAttribute("hidden"); parent.append(node); });
    }

    existingWrapper(id) {
        const node = document.getElementById(id);
        if (!node) return null;
        return node.closest(".customizer-field, .customizer-block, .customizer-actions, .customizer-upload-status, .customizer-library, .customizer-background-option, .customizer-classic-panel, .lyrics-setting") || node;
    }
}
