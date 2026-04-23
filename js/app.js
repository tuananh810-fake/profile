import APP_CONFIG from "./config.js";
import BackgroundEngine from "./modules/backgroundEngine.js";
import CoreShell from "./modules/coreShell.js";
import CenterCard from "./modules/centerCard.js";
import ClockWidget from "./modules/clockWidget.js";
import CreativeTextWidget from "./modules/creativeTextWidget.js";
import CustomizerPanel from "./modules/customizerPanel.js";
import LyricsEngine from "./modules/lyricsEngine.js";
import MusicPlayer from "./modules/musicPlayer.js";

class Application {
    constructor(config = APP_CONFIG) {
        this.config = config;
        this.backgroundEngine = null;
        this.shell = null;
        this.centerCard = null;
        this.lyricsEngine = null;
        this.musicPlayer = null;
        this.clockWidget = null;
        this.creativeWidget = null;
        this.customizerPanel = null;
        this.appShell = null;
        this.audioReactiveStorageKey = "profile.audioReactive.settings";
        this.audioReactiveState = this.readAudioReactiveState();
        this.lastAudioReactiveSignal = this.createNeutralAudioReactiveSignal();
    }

    init() {
        this.appShell = document.getElementById("appShell");
        this.shell = new CoreShell({
            root: this.appShell,
            config: this.config
        });
        this.shell.init();

        this.backgroundEngine = new BackgroundEngine({
            root: this.appShell,
            video: document.getElementById("backgroundVideo"),
            image: document.getElementById("backgroundImage"),
            fluidCanvas: document.getElementById("effectsFluidCanvas"),
            canvas: document.getElementById("effectsCanvas"),
            strokeLayer: document.getElementById("effectsStrokeLayer"),
            modeMount: document.getElementById("backgroundModeSwitch"),
            videoMount: document.getElementById("backgroundVideoSwitch"),
            imageMount: document.getElementById("backgroundImageSwitch"),
            effectMount: document.getElementById("backgroundEffectSwitch"),
            config: this.config,
            onStatusChange: (message) => this.shell.setStatus(message)
        });
        this.backgroundEngine.init();

        this.centerCard = new CenterCard({
            stage: document.getElementById("shellStage"),
            root: document.getElementById("cardRoot"),
            surface: document.getElementById("profileCard"),
            config: this.config,
            onStatusChange: (message) => this.shell.setStatus(message)
        });
        this.centerCard.init();

        this.lyricsEngine = new LyricsEngine({
            root: document.getElementById("lyricsOverlay"),
            audio: document.getElementById("musicAudio"),
            config: this.config,
            onStatusChange: (message) => this.shell.setStatus(message)
        });
        this.lyricsEngine.init();

        this.creativeWidget = new CreativeTextWidget({
            root: document.getElementById("creativeWidget"),
            config: this.config,
            onStatusChange: (message) => this.shell.setStatus(message)
        });
        this.creativeWidget.init();

        this.musicPlayer = new MusicPlayer({
            root: document.getElementById("musicDock"),
            audio: document.getElementById("musicAudio"),
            config: this.config,
            onStatusChange: (message) => this.shell.setStatus(message),
            onAudioReactive: (payload) => this.applyAudioReactiveSignal(payload),
            onTrackChange: (track) => this.lyricsEngine.loadTrack(track)
        });
        this.musicPlayer.init();

        this.clockWidget = new ClockWidget({
            root: document.getElementById("clockWidget"),
            config: this.config,
            onStatusChange: (message) => this.shell.setStatus(message)
        });
        this.clockWidget.init();

        this.customizerPanel = new CustomizerPanel({
            root: document.getElementById("customizerPanel"),
            appShell: this.appShell,
            shell: this.shell,
            creativeWidget: this.creativeWidget,
            backgroundEngine: this.backgroundEngine,
            musicPlayer: this.musicPlayer,
            audioReactiveController: {
                getState: () => this.getAudioReactiveState(),
                setEnabled: (enabled, announce = true) => this.setAudioReactiveSettings({ enabled }, announce),
                setIntensity: (intensity, announce = true) => this.setAudioReactiveSettings({ intensity }, announce)
            }
        });
        this.customizerPanel.init();

        this.shell.bindReset(() => this.centerCard.resetCard(true));
        this.shell.setStatus(this.config.shell.status);
        this.emitAudioReactiveChange();
        this.applyAudioReactiveSignal(this.lastAudioReactiveSignal);

        window.profileApp = this;
    }

    readAudioReactiveState() {
        const config = this.config.audioReactive || {};
        const defaults = {
            enabled: config.enabled !== false,
            intensity: this.clamp(
                Number.isFinite(config.defaultIntensity) ? config.defaultIntensity : 0.62,
                config.minIntensity ?? 0,
                config.maxIntensity ?? 1
            )
        };

        try {
            const stored = JSON.parse(localStorage.getItem(this.audioReactiveStorageKey) || "null");
            if (!stored || typeof stored !== "object") {
                return defaults;
            }

            return {
                enabled: typeof stored.enabled === "boolean" ? stored.enabled : defaults.enabled,
                intensity: this.clamp(
                    Number.isFinite(stored.intensity) ? stored.intensity : defaults.intensity,
                    config.minIntensity ?? 0,
                    config.maxIntensity ?? 1
                )
            };
        } catch (error) {
            return defaults;
        }
    }

    persistAudioReactiveState() {
        localStorage.setItem(this.audioReactiveStorageKey, JSON.stringify(this.audioReactiveState));
    }

    createNeutralAudioReactiveSignal() {
        return {
            overall: 0,
            bass: 0,
            mid: 0,
            high: 0,
            pulse: 0,
            transient: 0,
            isPlaying: false
        };
    }

    normalizeAudioReactiveSignal(signal = {}) {
        return {
            overall: this.clamp(Number(signal.overall) || 0, 0, 1),
            bass: this.clamp(Number(signal.bass) || 0, 0, 1),
            mid: this.clamp(Number(signal.mid) || 0, 0, 1),
            high: this.clamp(Number(signal.high) || 0, 0, 1),
            pulse: this.clamp(Number(signal.pulse) || 0, 0, 1),
            transient: this.clamp(Number(signal.transient) || 0, 0, 1),
            isPlaying: Boolean(signal.isPlaying)
        };
    }

    getAudioReactiveState() {
        return {
            ...this.audioReactiveState
        };
    }

    setAudioReactiveSettings(nextState = {}, announce = true) {
        const config = this.config.audioReactive || {};
        const previousEnabled = this.audioReactiveState.enabled;
        const previousIntensity = this.audioReactiveState.intensity;

        if (typeof nextState.enabled === "boolean") {
            this.audioReactiveState.enabled = nextState.enabled;
        }

        if (Number.isFinite(nextState.intensity)) {
            this.audioReactiveState.intensity = this.clamp(
                nextState.intensity,
                config.minIntensity ?? 0,
                config.maxIntensity ?? 1
            );
        }

        if (
            previousEnabled === this.audioReactiveState.enabled
            && previousIntensity === this.audioReactiveState.intensity
        ) {
            return;
        }

        this.persistAudioReactiveState();
        this.emitAudioReactiveChange();
        this.applyAudioReactiveSignal(this.lastAudioReactiveSignal);

        if (announce) {
            this.shell?.setStatus(
                this.audioReactiveState.enabled
                    ? `Audio reactive enabled at ${Math.round(this.audioReactiveState.intensity * 100)}%.`
                    : "Audio reactive disabled."
            );
        }
    }

    emitAudioReactiveChange() {
        this.appShell?.dispatchEvent(
            new CustomEvent("profile:audioreactivechange", {
                bubbles: true,
                detail: this.getAudioReactiveState()
            })
        );
    }

    applyAudioReactiveSignal(signal = {}) {
        const normalized = this.normalizeAudioReactiveSignal(signal);
        this.lastAudioReactiveSignal = normalized;

        const effective = this.audioReactiveState.enabled && normalized.isPlaying
            ? {
                ...normalized,
                enabled: true,
                intensity: this.audioReactiveState.intensity
            }
            : {
                ...this.createNeutralAudioReactiveSignal(),
                enabled: this.audioReactiveState.enabled,
                intensity: this.audioReactiveState.intensity
            };

        this.shell?.setAudioReactiveState?.(effective);
        this.centerCard?.setAudioReactiveState?.(effective);
        this.lyricsEngine?.setAudioReactiveState?.(effective);
        this.musicPlayer?.setAudioReactiveState?.(effective);
        this.clockWidget?.setAudioReactiveState?.(effective);
        this.creativeWidget?.setAudioReactiveState?.(effective);
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        new Application().init();
    });
} else {
    new Application().init();
}
