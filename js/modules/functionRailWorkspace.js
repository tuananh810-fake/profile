import LifeAtWorkspaceSafe from "./lifeatWorkspaceSafe.js";

const FUNCTION_RAIL_STYLE_ID = "functionRailWorkspacePatchStyle";
const FUNCTION_RAIL_STATE_KEY = "profile.functionRail.state";
const LEGACY_STATE_KEYS = [
    "profile.lifeat.workspace",
    "profile.lifeat.workspace.v2",
    "profile.lifeat.stable.state",
    "profile.lifeat.safe.state",
    "profile.dashboard.legacyBridge.v1"
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

function injectFunctionRailStyles() {
    if (document.getElementById(FUNCTION_RAIL_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = FUNCTION_RAIL_STYLE_ID;
    style.textContent = `
        .legacy-dashboard-dock,
        .legacy-dashboard-window,
        .dashboard-sidebar,
        .dashboard-window,
        .lifeat-workspace,
        .lifeat-workspace-stable,
        .safe-workspace {
            display: none !important;
            pointer-events: none !important;
        }

        .safe-lifeat,
        .lifeat-workspace-stable {
            z-index: 2147482600 !important;
        }

        .safe-lifeat .safe-nav,
        .lifeat-workspace-stable .lifeat-nav-button {
            border-radius: .42rem !important;
        }

        .safe-lifeat .safe-panel,
        .lifeat-workspace-stable .lifeat-panel {
            width: min(24.5rem, calc(100vw - 6.8rem)) !important;
        }

        #effectsCanvas,
        .effects-canvas,
        .effects-orb,
        .shell-glow {
            opacity: 0 !important;
            display: none !important;
            pointer-events: none !important;
        }

        .lyrics-overlay {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 5000 !important;
        }

        .lyrics-overlay .lyrics-settings {
            display: none !important;
        }
    `;
    document.head.append(style);
}

export default class FunctionRailWorkspace extends LifeAtWorkspaceSafe {
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
        const state = {
            ...defaults,
            ...readJson(FUNCTION_RAIL_STATE_KEY, {}),
        };
        state.activeTabs = {
            ...defaults.activeTabs,
            ...(state.activeTabs || {})
        };
        if (state.activePanel === "background") state.activePanel = "spaces";
        if (state.activePanel === "music") state.activePanel = "sounds";
        if (state.activePanel === "media") state.activePanel = "lyrics";
        if (!["Upload", "Player", "Library"].includes(state.activeTabs.sounds)) state.activeTabs.sounds = "Upload";
        return state;
    }

    writeState() {
        writeJson(FUNCTION_RAIL_STATE_KEY, this.state);
    }

    init() {
        injectFunctionRailStyles();
        super.init();
        this.root?.classList.add("tool-workspace");
        LEGACY_STATE_KEYS.forEach((key) => localStorage.removeItem(key));
    }

    removeOldWorkspaces() {
        document
            .querySelectorAll(".legacy-dashboard-dock, .legacy-dashboard-window, .dashboard-sidebar, .dashboard-window, .lifeat-workspace, .lifeat-workspace-stable, .safe-workspace, .tool-workspace")
            .forEach((node) => node.remove());
        document.body.classList.remove("lifeat-panel-open");
    }

    renderSounds() {
        const tab = this.getActiveTab("sounds");
        if (tab === "Library") return this.renderSoundLibrary();
        if (tab === "Player") return this.renderSoundPlayer();
        return this.renderSoundUpload();
    }
}
