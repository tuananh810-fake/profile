import LifeAtWorkspaceStable from "./lifeatWorkspaceStable.js";

const SAFE_STYLE_ID = "lifeatWorkspaceSafePatchStyle";
const SAFE_STATE_KEY = "profile.lifeat.safe.state";
const LEGACY_STATE_KEYS = [
    "profile.lifeat.workspace",
    "profile.lifeat.workspace.v2",
    "profile.lifeat.stable.state"
];

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

function injectSafePatchStyles() {
    if (document.getElementById(SAFE_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = SAFE_STYLE_ID;
    style.textContent = `
        .lifeat-workspace,
        .lifeat-workspace-stable,
        .legacy-dashboard-dock,
        .legacy-dashboard-window,
        .dashboard-sidebar,
        .dashboard-window {
            display: none !important;
            pointer-events: none !important;
        }

        .safe-lifeat,
        .lifeat-workspace-stable {
            z-index: 2147482300 !important;
        }

        #effectsCanvas,
        .effects-canvas,
        .effects-orb {
            opacity: 0 !important;
            display: none !important;
        }

        .lyrics-overlay,
        .lyrics-body {
            display: block !important;
            visibility: visible !important;
        }

        .lyrics-overlay .lyrics-settings {
            display: none !important;
        }
    `;
    document.head.append(style);
}

export default class LifeAtWorkspaceSafe extends LifeAtWorkspaceStable {
    readState() {
        const defaults = {
            collapsed: false,
            activePanel: null,
            activeTabs: {
                spaces: "Videos",
                sounds: "Upload",
                calendar: "Today",
                timer: "Focus",
                tasks: "Widget",
                notes: "Intro",
                lyrics: "Text",
                profile: "Card",
                layout: "Visibility"
            }
        };

        const safeState = readJson(SAFE_STATE_KEY, null);
        const migratedState = safeState || LEGACY_STATE_KEYS.map((key) => readJson(key, null)).find(Boolean) || {};
        const state = {
            ...defaults,
            ...migratedState,
            activeTabs: {
                ...defaults.activeTabs,
                ...(migratedState.activeTabs || {})
            }
        };

        if (state.activePanel === "background") state.activePanel = "spaces";
        if (state.activePanel === "music") state.activePanel = "sounds";
        if (state.activePanel === "media") state.activePanel = "lyrics";
        state.activeTabs.sounds = state.activeTabs.sounds === "Library" ? "Library" : state.activeTabs.sounds === "Player" ? "Player" : "Upload";
        return state;
    }

    writeState() {
        writeJson(SAFE_STATE_KEY, this.state);
    }

    init() {
        injectSafePatchStyles();
        super.init();
        this.root?.classList.add("safe-lifeat");
        this.ensureSafeDefaults();
    }

    removeLegacyDashboards() {
        document
            .querySelectorAll(".lifeat-workspace, .lifeat-workspace-stable, .safe-lifeat, .legacy-dashboard-dock, .legacy-dashboard-window, .dashboard-sidebar, .dashboard-window")
            .forEach((node) => node.remove());
        document.body.classList.remove("lifeat-panel-open");
    }

    repairHiddenLayout() {
        super.repairHiddenLayout?.();
        this.setElementVisible("lyricsOverlay", true);
        this.setElementVisible("lyricsBody", true);
        this.setElementVisible("cardRoot", true);
    }

    attachGlobalEvents() {
        super.attachGlobalEvents?.();
        document.addEventListener("change", (event) => {
            const target = event.target;
            if (!target?.matches?.("#customAudioFile, #customLyricsFile, #customLyricsProFile")) return;
            this.openPanel("sounds");
            this.setActiveTab?.("sounds", "Upload");
        }, true);
    }

    ensureSafeDefaults() {
        LEGACY_STATE_KEYS.forEach((key) => localStorage.removeItem(key));
        const toggleLyrics = document.getElementById("toggleLyrics");
        if (toggleLyrics?.checked) {
            toggleLyrics.checked = false;
            toggleLyrics.dispatchEvent(new Event("change", { bubbles: true }));
        }
        this.setElementVisible("lyricsOverlay", true);
        this.setElementVisible("cardRoot", true);
    }

    renderSounds() {
        const tab = this.getActiveTab("sounds");
        if (tab === "Library") return this.renderSoundLibrary();
        if (tab === "Player") return this.renderSoundPlayer();
        return this.renderSoundUpload();
    }
}
