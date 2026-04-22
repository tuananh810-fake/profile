class CustomizerPanel {
    constructor({ root, appShell, shell, creativeWidget, backgroundEngine, musicPlayer, audioReactiveController }) {
        this.root = root;
        this.appShell = appShell;
        this.shell = shell;
        this.creativeWidget = creativeWidget;
        this.backgroundEngine = backgroundEngine;
        this.musicPlayer = musicPlayer;
        this.audioReactiveController = audioReactiveController;

        this.openButton = document.getElementById("openCustomizerButton");
        this.closeButton = document.getElementById("customizerCloseBtn");
        this.tabs = Array.from(document.querySelectorAll(".customizer-tab"));
        this.sections = Array.from(document.querySelectorAll(".customizer-section"));
        this.trackTitle = document.getElementById("customTrackTitle");
        this.trackArtist = document.getElementById("customTrackArtist");
        this.audioFile = document.getElementById("customAudioFile");
        this.lyricsFile = document.getElementById("customLyricsFile");
        this.applyTrackButton = document.getElementById("applyCustomTrackBtn");
        this.clearTrackButton = document.getElementById("clearCustomTrackBtn");
        this.backgroundOptions = Array.from(document.querySelectorAll("[data-background-option]"));
        this.videoCoverRange = document.getElementById("videoCoverRange");
        this.videoCoverValue = document.getElementById("videoCoverValue");
        this.customBackgroundVideoFile = document.getElementById("customBackgroundVideoFile");
        this.applyBackgroundVideoButton = document.getElementById("applyBackgroundVideoBtn");
        this.clearBackgroundVideoButton = document.getElementById("clearBackgroundVideoBtn");
        this.customBackgroundImageFile = document.getElementById("customBackgroundImageFile");
        this.applyBackgroundImageButton = document.getElementById("applyBackgroundImageBtn");
        this.clearBackgroundImageButton = document.getElementById("clearBackgroundImageBtn");
        this.classicEffectPanel = document.getElementById("classicEffectPanel");
        this.effectClassicThemeSelect = document.getElementById("effectClassicThemeSelect");
        this.classicGlowAInput = document.getElementById("classicGlowAInput");
        this.classicGlowBInput = document.getElementById("classicGlowBInput");
        this.classicGlowCInput = document.getElementById("classicGlowCInput");
        this.classicBaseTopInput = document.getElementById("classicBaseTopInput");
        this.classicBaseBottomInput = document.getElementById("classicBaseBottomInput");
        this.liquidEffectPanel = document.getElementById("liquidEffectPanel");
        this.liquidAccentAInput = document.getElementById("liquidAccentAInput");
        this.liquidAccentBInput = document.getElementById("liquidAccentBInput");
        this.liquidAccentCInput = document.getElementById("liquidAccentCInput");
        this.liquidGlareInput = document.getElementById("liquidGlareInput");
        this.liquidBaseTopInput = document.getElementById("liquidBaseTopInput");
        this.liquidBaseBottomInput = document.getElementById("liquidBaseBottomInput");
        this.northernLightsEffectPanel = document.getElementById("northernLightsEffectPanel");
        this.northernVeilAInput = document.getElementById("northernVeilAInput");
        this.northernVeilBInput = document.getElementById("northernVeilBInput");
        this.northernVeilCInput = document.getElementById("northernVeilCInput");
        this.northernSkyTopInput = document.getElementById("northernSkyTopInput");
        this.northernSkyBottomInput = document.getElementById("northernSkyBottomInput");
        this.northernStarsInput = document.getElementById("northernStarsInput");
        this.toggleShellCopy = document.getElementById("toggleShellCopy");
        this.toggleLyrics = document.getElementById("toggleLyrics");
        this.toggleMusicDock = document.getElementById("toggleMusicDock");
        this.toggleClockWidget = document.getElementById("toggleClockWidget");
        this.toggleProfileCard = document.getElementById("toggleProfileCard");
        this.toggleCreativeWidget = document.getElementById("toggleCreativeWidget");
        this.toggleAudioReactive = document.getElementById("toggleAudioReactive");
        this.audioReactiveIntensityRange = document.getElementById("audioReactiveIntensityRange");
        this.audioReactiveIntensityValue = document.getElementById("audioReactiveIntensityValue");
        this.layoutIntroTitleInput = document.getElementById("layoutIntroTitleInput");
        this.layoutIntroLeadInput = document.getElementById("layoutIntroLeadInput");
        this.creativeWidgetTitleInput = document.getElementById("creativeWidgetTitleInput");
        this.creativeWidgetBodyInput = document.getElementById("creativeWidgetBodyInput");
        this.creativeWidgetFontSelect = document.getElementById("creativeWidgetFontSelect");
        this.creativeWidgetAlignSelect = document.getElementById("creativeWidgetAlignSelect");
        this.creativeWidgetScaleRange = document.getElementById("creativeWidgetScaleRange");
        this.creativeWidgetScaleValue = document.getElementById("creativeWidgetScaleValue");
        this.creativeWidgetChromeSelect = document.getElementById("creativeWidgetChromeSelect");
        this.creativeWidgetTextColorInput = document.getElementById("creativeWidgetTextColorInput");
        this.creativeWidgetAccentColorInput = document.getElementById("creativeWidgetAccentColorInput");

        this.storageKey = "profile.customizer.layout";
        this.layoutState = {
            hideShellCopy: false,
            hideLyrics: false,
            hideMusicDock: false,
            hideClockWidget: false,
            hideProfileCard: false,
            hideCreativeWidget: false
        };
    }

    init() {
        this.restoreLayoutState();
        this.renderClassicThemeOptions();
        this.renderCreativeFontOptions();
        this.attachEvents();
        this.applyLayoutState();
        this.syncBackgroundState(this.backgroundEngine.getState());
        this.syncCopyEditors(this.shell.getCopyState());
        this.syncCreativeEditors(this.creativeWidget.getState());
        this.syncAudioReactiveControls();
    }

    attachEvents() {
        this.openButton.addEventListener("click", () => this.togglePanel(true));
        this.closeButton.addEventListener("click", () => this.togglePanel(false));

        this.tabs.forEach((tab) => {
            tab.addEventListener("click", () => this.setActiveTab(tab.dataset.tab));
        });

        this.appShell.addEventListener("profile:backgroundchange", (event) => {
            this.syncBackgroundState(event.detail);
        });
        this.appShell.addEventListener("profile:copychange", (event) => {
            this.syncCopyEditors(event.detail);
        });
        this.appShell.addEventListener("profile:creativechange", (event) => {
            this.syncCreativeEditors(event.detail);
        });
        this.appShell.addEventListener("profile:audioreactivechange", (event) => {
            this.syncAudioReactiveControls(event.detail);
        });

        this.applyTrackButton.addEventListener("click", () => this.applyCustomTrack());
        this.clearTrackButton.addEventListener("click", () => {
            this.musicPlayer.clearCustomTrack();
            this.trackTitle.value = "";
            this.trackArtist.value = "";
            this.audioFile.value = "";
            this.lyricsFile.value = "";
            this.shell.setStatus("Default playlist restored.");
        });

        this.applyBackgroundVideoButton.addEventListener("click", () => {
            const file = this.customBackgroundVideoFile.files?.[0] || null;
            if (!file) {
                this.shell.setStatus("Choose a video file first.");
                return;
            }

            this.backgroundEngine.setCustomVideoFile(file, true);
            this.customBackgroundVideoFile.value = "";
        });

        this.clearBackgroundVideoButton.addEventListener("click", () => {
            this.backgroundEngine.clearCustomVideo(true);
            this.customBackgroundVideoFile.value = "";
        });

        this.applyBackgroundImageButton.addEventListener("click", () => {
            const file = this.customBackgroundImageFile.files?.[0] || null;
            if (!file) {
                this.shell.setStatus("Choose an image file first.");
                return;
            }

            this.backgroundEngine.setCustomImageFile(file, true);
            this.customBackgroundImageFile.value = "";
        });

        this.clearBackgroundImageButton.addEventListener("click", () => {
            this.backgroundEngine.clearCustomImage(true);
            this.customBackgroundImageFile.value = "";
        });

        this.effectClassicThemeSelect.addEventListener("change", (event) => {
            this.backgroundEngine.setClassicTheme(event.target.value, true);
        });

        [
            ["glowA", this.classicGlowAInput],
            ["glowB", this.classicGlowBInput],
            ["glowC", this.classicGlowCInput],
            ["baseTop", this.classicBaseTopInput],
            ["baseBottom", this.classicBaseBottomInput]
        ].forEach(([key, input]) => {
            input.addEventListener("input", (event) => {
                this.backgroundEngine.setClassicColor(key, event.target.value, false);
            });
            input.addEventListener("change", (event) => {
                this.backgroundEngine.setClassicColor(key, event.target.value, true);
            });
        });

        [
            ["accentA", this.liquidAccentAInput],
            ["accentB", this.liquidAccentBInput],
            ["accentC", this.liquidAccentCInput],
            ["glare", this.liquidGlareInput],
            ["baseTop", this.liquidBaseTopInput],
            ["baseBottom", this.liquidBaseBottomInput]
        ].forEach(([key, input]) => {
            input.addEventListener("input", (event) => {
                this.backgroundEngine.setLiquidColor(key, event.target.value, false);
            });
            input.addEventListener("change", (event) => {
                this.backgroundEngine.setLiquidColor(key, event.target.value, true);
            });
        });

        [
            ["veilA", this.northernVeilAInput],
            ["veilB", this.northernVeilBInput],
            ["veilC", this.northernVeilCInput],
            ["skyTop", this.northernSkyTopInput],
            ["skyBottom", this.northernSkyBottomInput],
            ["stars", this.northernStarsInput]
        ].forEach(([key, input]) => {
            input.addEventListener("input", (event) => {
                this.backgroundEngine.setNorthernLightsColor(key, event.target.value, false);
            });
            input.addEventListener("change", (event) => {
                this.backgroundEngine.setNorthernLightsColor(key, event.target.value, true);
            });
        });

        this.videoCoverRange.addEventListener("input", (event) => {
            const nextValue = Number(event.target.value);
            this.backgroundEngine.setVideoOverlayStrength(nextValue, false);
            this.syncVideoCoverValue(nextValue);
        });
        this.videoCoverRange.addEventListener("change", (event) => {
            const nextValue = Number(event.target.value);
            this.backgroundEngine.setVideoOverlayStrength(nextValue, true);
            this.syncVideoCoverValue(nextValue);
        });

        [
            ["hideShellCopy", this.toggleShellCopy],
            ["hideLyrics", this.toggleLyrics],
            ["hideMusicDock", this.toggleMusicDock],
            ["hideClockWidget", this.toggleClockWidget],
            ["hideProfileCard", this.toggleProfileCard],
            ["hideCreativeWidget", this.toggleCreativeWidget]
        ].forEach(([key, input]) => {
            input.addEventListener("change", () => {
                this.layoutState[key] = input.checked;
                this.persistLayoutState();
                this.applyLayoutState();
            });
        });

        this.layoutIntroTitleInput.addEventListener("input", (event) => {
            this.shell.setCopyContent({ title: event.target.value }, true);
        });
        this.layoutIntroLeadInput.addEventListener("input", (event) => {
            this.shell.setCopyContent({ lead: event.target.value }, true);
        });

        this.toggleAudioReactive?.addEventListener("change", () => {
            this.audioReactiveController?.setEnabled(this.toggleAudioReactive.checked, true);
        });
        this.audioReactiveIntensityRange?.addEventListener("input", (event) => {
            const intensity = Number(event.target.value) / 100;
            this.audioReactiveController?.setIntensity(intensity, false);
            this.syncAudioReactiveControls({
                ...(this.audioReactiveController?.getState() || {}),
                intensity
            });
        });
        this.audioReactiveIntensityRange?.addEventListener("change", (event) => {
            const intensity = Number(event.target.value) / 100;
            this.audioReactiveController?.setIntensity(intensity, true);
            this.syncAudioReactiveControls({
                ...(this.audioReactiveController?.getState() || {}),
                intensity
            });
        });

        this.creativeWidgetTitleInput.addEventListener("input", (event) => {
            this.creativeWidget.setContent({ title: event.target.value }, true);
        });
        this.creativeWidgetBodyInput.addEventListener("input", (event) => {
            this.creativeWidget.setContent({ body: event.target.value }, true);
        });
        this.creativeWidgetFontSelect.addEventListener("change", (event) => {
            this.creativeWidget.setTypography({ fontPreset: event.target.value }, true);
        });
        this.creativeWidgetAlignSelect.addEventListener("change", (event) => {
            this.creativeWidget.setTypography({ textAlign: event.target.value }, true);
        });
        this.creativeWidgetScaleRange.addEventListener("input", (event) => {
            const nextScale = Number(event.target.value) / 100;
            this.creativeWidget.setTypography({ textScale: nextScale }, false);
            this.syncCreativeScaleValue(nextScale);
        });
        this.creativeWidgetScaleRange.addEventListener("change", (event) => {
            const nextScale = Number(event.target.value) / 100;
            this.creativeWidget.setTypography({ textScale: nextScale }, true);
            this.syncCreativeScaleValue(nextScale);
        });
        this.creativeWidgetChromeSelect.addEventListener("change", (event) => {
            this.creativeWidget.setTypography({ chromeMode: event.target.value }, true);
        });
        this.creativeWidgetTextColorInput.addEventListener("input", (event) => {
            this.creativeWidget.setTypography({ textColor: event.target.value }, false);
        });
        this.creativeWidgetTextColorInput.addEventListener("change", (event) => {
            this.creativeWidget.setTypography({ textColor: event.target.value }, true);
        });
        this.creativeWidgetAccentColorInput.addEventListener("input", (event) => {
            this.creativeWidget.setTypography({ accentColor: event.target.value }, false);
        });
        this.creativeWidgetAccentColorInput.addEventListener("change", (event) => {
            this.creativeWidget.setTypography({ accentColor: event.target.value }, true);
        });
    }

    togglePanel(isOpen) {
        this.root.hidden = !isOpen;
        this.openButton.setAttribute("aria-expanded", isOpen ? "true" : "false");

        if (isOpen) {
            const currentTab = this.tabs.find((tab) => tab.classList.contains("is-active"))?.dataset.tab || "music";
            this.setActiveTab(currentTab);
            this.syncCopyEditors(this.shell.getCopyState());
            this.syncCreativeEditors(this.creativeWidget.getState());
        }
    }

    setActiveTab(tabId) {
        this.tabs.forEach((tab) => {
            tab.classList.toggle("is-active", tab.dataset.tab === tabId);
        });

        this.sections.forEach((section) => {
            section.classList.toggle("is-active", section.dataset.panel === tabId);
        });

        if (tabId === "background") {
            this.syncBackgroundState(this.backgroundEngine.getState());
        }
    }

    async applyCustomTrack() {
        const audioFile = this.audioFile.files?.[0] || null;
        const lyricsFile = this.lyricsFile.files?.[0] || null;
        const currentTrack = this.musicPlayer.getCurrentTrack();
        const hasNewAudio = Boolean(audioFile);

        if (!audioFile && !lyricsFile) {
            this.shell.setStatus("Choose an audio file or .lrc file first.");
            return;
        }

        if (!audioFile && !currentTrack) {
            this.shell.setStatus("No base track is loaded yet.");
            return;
        }

        const derivedTitle = this.trackTitle.value.trim()
            || (audioFile ? this.deriveTitle(audioFile.name) : currentTrack?.title)
            || "Local upload";
        const derivedArtist = this.trackArtist.value.trim()
            || currentTrack?.artist
            || "Local custom track";

        const lyricsData = lyricsFile
            ? await lyricsFile.text()
            : (hasNewAudio ? null : (currentTrack?.lyricsData || null));
        const file = audioFile ? URL.createObjectURL(audioFile) : currentTrack.file;

        if (audioFile) {
            this.musicPlayer.storeCustomResources({ audioUrl: file });
        }

        this.musicPlayer.setCustomTrack({
            id: `custom-${Date.now()}`,
            title: derivedTitle,
            artist: derivedArtist,
            note: "Loaded from the customizer panel.",
            file,
            artwork: currentTrack?.artwork || null,
            lyrics: lyricsData ? null : (hasNewAudio ? null : (currentTrack?.lyrics || null)),
            lyricsData
        }, true);

        this.shell.setStatus(`Custom track applied: ${derivedTitle}.`);
    }

    deriveTitle(fileName) {
        return fileName
            .replace(/\.[^.]+$/, "")
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    restoreLayoutState() {
        try {
            const stored = JSON.parse(localStorage.getItem(this.storageKey) || "null");
            if (stored && typeof stored === "object") {
                this.layoutState.hideShellCopy = Boolean(stored.hideShellCopy);
                this.layoutState.hideLyrics = Boolean(stored.hideLyrics);
                this.layoutState.hideMusicDock = Boolean(stored.hideMusicDock);
                this.layoutState.hideClockWidget = Boolean(stored.hideClockWidget);
                this.layoutState.hideProfileCard = Boolean(stored.hideProfileCard);
                this.layoutState.hideCreativeWidget = Boolean(stored.hideCreativeWidget);
            }
        } catch (error) {
            // Ignore bad localStorage payloads and keep defaults.
        }

        this.toggleShellCopy.checked = this.layoutState.hideShellCopy;
        this.toggleLyrics.checked = this.layoutState.hideLyrics;
        this.toggleMusicDock.checked = this.layoutState.hideMusicDock;
        this.toggleClockWidget.checked = this.layoutState.hideClockWidget;
        this.toggleProfileCard.checked = this.layoutState.hideProfileCard;
        this.toggleCreativeWidget.checked = this.layoutState.hideCreativeWidget;
    }

    persistLayoutState() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.layoutState));
    }

    applyLayoutState() {
        this.appShell.classList.toggle("is-copy-hidden", this.layoutState.hideShellCopy);
        this.appShell.classList.toggle("is-lyrics-hidden", this.layoutState.hideLyrics);
        this.appShell.classList.toggle("is-music-hidden", this.layoutState.hideMusicDock);
        this.appShell.classList.toggle("is-clock-hidden", this.layoutState.hideClockWidget);
        this.appShell.classList.toggle("is-profile-hidden", this.layoutState.hideProfileCard);
        this.appShell.classList.toggle("is-creative-hidden", this.layoutState.hideCreativeWidget);
    }

    renderClassicThemeOptions(themes = this.backgroundEngine.getState().effectThemes || []) {
        this.effectClassicThemeSelect.replaceChildren(
            ...themes.map((theme) => {
                const option = document.createElement("option");
                option.value = theme.id;
                option.textContent = theme.label;
                return option;
            })
        );
    }

    renderCreativeFontOptions() {
        const presets = this.creativeWidget.getFontPresets();
        this.creativeWidgetFontSelect.replaceChildren(
            ...presets.map((preset) => {
                const option = document.createElement("option");
                option.value = preset.id;
                option.textContent = preset.label;
                return option;
            })
        );
    }

    syncBackgroundState(backgroundState) {
        const nextState = backgroundState || this.backgroundEngine.getState();
        this.syncBackgroundOptions(nextState.mode);
        this.syncClassicEffectControls(nextState);
        this.syncLiquidEffectControls(nextState);
        this.syncNorthernLightsEffectControls(nextState);
        this.syncVideoCoverValue(nextState.videoOverlayStrength);
    }

    syncBackgroundOptions(activeMode) {
        const nextMode = activeMode || this.backgroundEngine.getState().mode;
        this.backgroundOptions.forEach((option) => {
            option.classList.toggle("is-active", option.dataset.backgroundOption === nextMode);
        });
    }

    syncClassicEffectControls(backgroundState) {
        const nextState = backgroundState || this.backgroundEngine.getState();
        this.renderClassicThemeOptions(nextState.effectThemes || []);

        const isClassic = nextState.effectPreset === "classic";
        this.classicEffectPanel.hidden = !isClassic;
        if (!isClassic) {
            return;
        }

        this.effectClassicThemeSelect.value = nextState.effectTheme || "ember";
        this.classicGlowAInput.value = nextState.classicPalette?.glowA || "#ffbc96";
        this.classicGlowBInput.value = nextState.classicPalette?.glowB || "#ff6fad";
        this.classicGlowCInput.value = nextState.classicPalette?.glowC || "#ff7a60";
        this.classicBaseTopInput.value = nextState.classicPalette?.baseTop || "#110810";
        this.classicBaseBottomInput.value = nextState.classicPalette?.baseBottom || "#170a10";
    }

    syncLiquidEffectControls(backgroundState) {
        const nextState = backgroundState || this.backgroundEngine.getState();
        const isLiquid = nextState.effectPreset === "liquid";
        this.liquidEffectPanel.hidden = !isLiquid;
        if (!isLiquid) {
            return;
        }

        this.liquidAccentAInput.value = nextState.liquidPalette?.accentA || "#6fe8d8";
        this.liquidAccentBInput.value = nextState.liquidPalette?.accentB || "#8eb6ff";
        this.liquidAccentCInput.value = nextState.liquidPalette?.accentC || "#c8b0ff";
        this.liquidGlareInput.value = nextState.liquidPalette?.glare || "#f3f7ff";
        this.liquidBaseTopInput.value = nextState.liquidPalette?.baseTop || "#182236";
        this.liquidBaseBottomInput.value = nextState.liquidPalette?.baseBottom || "#1d1b31";
    }

    syncNorthernLightsEffectControls(backgroundState) {
        const nextState = backgroundState || this.backgroundEngine.getState();
        const isNorthernLights = nextState.effectPreset === "northern-lights";
        this.northernLightsEffectPanel.hidden = !isNorthernLights;
        if (!isNorthernLights) {
            return;
        }

        this.northernVeilAInput.value = nextState.northernLightsPalette?.veilA || "#64ffd6";
        this.northernVeilBInput.value = nextState.northernLightsPalette?.veilB || "#74c9ff";
        this.northernVeilCInput.value = nextState.northernLightsPalette?.veilC || "#ca87ff";
        this.northernSkyTopInput.value = nextState.northernLightsPalette?.skyTop || "#081220";
        this.northernSkyBottomInput.value = nextState.northernLightsPalette?.skyBottom || "#140f2f";
        this.northernStarsInput.value = nextState.northernLightsPalette?.stars || "#eef6ff";
    }

    syncVideoCoverValue(value = this.backgroundEngine.getVideoOverlayStrength()) {
        const strength = Math.round(value);
        this.videoCoverRange.value = String(strength);
        this.videoCoverValue.textContent = `${strength}%`;
    }

    syncCopyEditors(copyState = this.shell.getCopyState()) {
        const nextTitle = copyState.title || "";
        const nextLead = copyState.lead || "";

        if (this.layoutIntroTitleInput.value !== nextTitle) {
            this.layoutIntroTitleInput.value = nextTitle;
        }

        if (this.layoutIntroLeadInput.value !== nextLead) {
            this.layoutIntroLeadInput.value = nextLead;
        }
    }

    syncCreativeEditors(creativeState = this.creativeWidget.getState()) {
        const nextTitle = creativeState.title || "";
        const nextBody = creativeState.body || "";
        const nextFont = creativeState.fontPreset || "";
        const nextAlign = creativeState.textAlign || "center";
        const nextChrome = creativeState.chromeMode || "boxed";
        const nextTextColor = creativeState.textColor || "#f7fbff";
        const nextAccentColor = creativeState.accentColor || "#9feeff";

        if (this.creativeWidgetTitleInput.value !== nextTitle) {
            this.creativeWidgetTitleInput.value = nextTitle;
        }

        if (this.creativeWidgetBodyInput.value !== nextBody) {
            this.creativeWidgetBodyInput.value = nextBody;
        }

        if (this.creativeWidgetFontSelect.value !== nextFont) {
            this.creativeWidgetFontSelect.value = nextFont;
        }

        if (this.creativeWidgetAlignSelect.value !== nextAlign) {
            this.creativeWidgetAlignSelect.value = nextAlign;
        }

        if (this.creativeWidgetChromeSelect.value !== nextChrome) {
            this.creativeWidgetChromeSelect.value = nextChrome;
        }

        if (this.creativeWidgetTextColorInput.value !== nextTextColor) {
            this.creativeWidgetTextColorInput.value = nextTextColor;
        }

        if (this.creativeWidgetAccentColorInput.value !== nextAccentColor) {
            this.creativeWidgetAccentColorInput.value = nextAccentColor;
        }

        this.syncCreativeScaleValue(creativeState.textScale || 1);
    }

    syncCreativeScaleValue(scaleValue = 1) {
        const percent = Math.round(scaleValue * 100);
        this.creativeWidgetScaleRange.value = String(percent);
        this.creativeWidgetScaleValue.textContent = `${percent}%`;
    }

    syncAudioReactiveControls(audioReactiveState = this.audioReactiveController?.getState?.()) {
        if (!this.toggleAudioReactive || !this.audioReactiveIntensityRange || !this.audioReactiveIntensityValue) {
            return;
        }

        const nextState = audioReactiveState || { enabled: true, intensity: 0.62 };
        const enabled = nextState.enabled !== false;
        const intensity = Number.isFinite(nextState.intensity) ? nextState.intensity : 0.62;
        const percent = Math.round(intensity * 100);

        this.toggleAudioReactive.checked = enabled;
        this.audioReactiveIntensityRange.value = String(percent);
        this.audioReactiveIntensityValue.textContent = `${percent}%`;
        this.audioReactiveIntensityRange.disabled = !enabled;
    }
}

export default CustomizerPanel;
