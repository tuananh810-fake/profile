import LocalTrackLibrary from "./localTrackLibrary.js";

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
        this.lyricsProFile = document.getElementById("customLyricsProFile");
        this.applyTrackButton = document.getElementById("applyCustomTrackBtn");
        this.clearTrackButton = document.getElementById("clearCustomTrackBtn");
        this.cancelTrackEditButton = document.getElementById("cancelTrackEditBtn");
        this.trackStatus = document.getElementById("customTrackStatus");
        this.trackStatusStep = document.getElementById("customTrackStatusStep");
        this.trackStatusDetail = document.getElementById("customTrackStatusDetail");
        this.savedTrackLibrary = document.getElementById("customTrackLibrary");
        this.savedTrackLibraryList = document.getElementById("customTrackLibraryList");
        this.savedTrackLibraryNote = document.getElementById("customTrackLibraryNote");
        this.exportTrackLibraryCodeButton = document.getElementById("exportTrackLibraryCodeBtn");
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
        this.trackLibrary = new LocalTrackLibrary();
        this.trackLibraryRecords = [];
        this.trackLibraryUrls = [];
        this.editingTrackId = null;
        this.layoutState = {
            hideShellCopy: false,
            hideLyrics: false,
            hideMusicDock: false,
            hideClockWidget: false,
            hideProfileCard: false,
            hideCreativeWidget: false
        };
        this.activeTab = "music";
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
        this.syncTrackFormMode();
        void this.loadSavedTrackLibrary();
        void this.loadSavedBackgroundAssets();
        this.emitCustomizerState();
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
        this.appShell.addEventListener("profile:open-customizer-tab", (event) => {
            const detail = event.detail || {};
            if (detail.open === false) {
                this.togglePanel(false);
                return;
            }

            this.openToTab(detail.tabId || "music");
        });

        this.applyTrackButton.addEventListener("click", () => this.applyCustomTrack());
        this.clearTrackButton.addEventListener("click", () => {
            this.musicPlayer.clearCustomTrack();
            this.resetTrackForm();
            this.updateTrackProcessingState({
                step: "Default playlist restored.",
                detail: "Saved tracks stay in your local library. You can load or edit them any time.",
                tone: "success"
            });
            this.shell.setStatus("Default playlist restored.");
        });
        this.cancelTrackEditButton?.addEventListener("click", () => {
            this.resetTrackForm();
            this.updateTrackProcessingState({
                step: "Track editor reset.",
                detail: "Choose another saved track to edit, or add a new MP3, .lrc, and optional word-timing .json file.",
                tone: "idle"
            });
        });
        this.savedTrackLibraryList?.addEventListener("click", (event) => {
            const actionButton = event.target.closest("[data-track-action]");
            if (!actionButton) {
                return;
            }

            const action = actionButton.dataset.trackAction;
            const trackId = actionButton.dataset.trackId;
            if (!trackId) {
                return;
            }

            if (action === "load") {
                this.musicPlayer.loadTrackById(trackId, true);
                this.shell.setStatus("Saved track loaded.");
                return;
            }

            if (action === "edit") {
                void this.startEditingSavedTrack(trackId);
                return;
            }

            if (action === "delete") {
                void this.deleteSavedTrack(trackId);
            }
        });
        this.exportTrackLibraryCodeButton?.addEventListener("click", () => {
            void this.exportTrackLibraryCode();
        });

        this.applyBackgroundVideoButton.addEventListener("click", () => {
            const file = this.customBackgroundVideoFile.files?.[0] || null;
            if (!file) {
                this.shell.setStatus("Choose a video file first.");
                return;
            }
            void this.applyCustomBackgroundVideo(file);
        });

        this.clearBackgroundVideoButton.addEventListener("click", () => {
            void this.clearCustomBackgroundVideo();
        });

        this.applyBackgroundImageButton.addEventListener("click", () => {
            const file = this.customBackgroundImageFile.files?.[0] || null;
            if (!file) {
                this.shell.setStatus("Choose an image file first.");
                return;
            }
            void this.applyCustomBackgroundImage(file);
        });

        this.clearBackgroundImageButton.addEventListener("click", () => {
            void this.clearCustomBackgroundImage();
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
            const currentTab = this.activeTab
                || this.tabs.find((tab) => tab.classList.contains("is-active"))?.dataset.tab
                || "music";
            this.setActiveTab(currentTab);
            this.syncCopyEditors(this.shell.getCopyState());
            this.syncCreativeEditors(this.creativeWidget.getState());
            return;
        }

        this.emitCustomizerState();
    }

    setActiveTab(tabId) {
        const resolvedTab = this.tabs.some((tab) => tab.dataset.tab === tabId) ? tabId : "music";
        this.activeTab = resolvedTab;

        this.tabs.forEach((tab) => {
            tab.classList.toggle("is-active", tab.dataset.tab === resolvedTab);
        });

        this.sections.forEach((section) => {
            section.classList.toggle("is-active", section.dataset.panel === resolvedTab);
        });

        if (resolvedTab === "background") {
            this.syncBackgroundState(this.backgroundEngine.getState());
        }

        this.emitCustomizerState();
    }

    openToTab(tabId) {
        this.root.hidden = false;
        this.openButton.setAttribute("aria-expanded", "true");
        this.setActiveTab(tabId);
        this.syncCopyEditors(this.shell.getCopyState());
        this.syncCreativeEditors(this.creativeWidget.getState());
    }

    emitCustomizerState() {
        this.appShell?.dispatchEvent(
            new CustomEvent("profile:customizerchange", {
                bubbles: true,
                detail: {
                    open: !this.root.hidden,
                    tabId: this.activeTab
                }
            })
        );
    }

    async applyCustomTrack() {
        return this.applyCustomTrackPersistent();
        const audioFile = this.audioFile.files?.[0] || null;
        const lyricsFile = this.lyricsFile.files?.[0] || null;
        const currentTrack = this.musicPlayer.getCurrentTrack();
        const hasNewAudio = Boolean(audioFile);

        if (!audioFile && !lyricsFile) {
            this.updateTrackProcessingState({
                step: "No local media selected.",
                detail: "Choose an MP3 file or a .lrc file first.",
                tone: "error"
            });
            this.shell.setStatus("Choose an audio file or .lrc file first.");
            return;
        }

        if (!audioFile && !currentTrack) {
            this.updateTrackProcessingState({
                step: "No base track is loaded yet.",
                detail: "Add an audio file first so the custom track has a source.",
                tone: "error"
            });
            this.shell.setStatus("No base track is loaded yet.");
            return;
        }

        this.setTrackButtonsDisabled(true);

        try {
            this.updateTrackProcessingState({
                step: "Reading local media…",
                detail: audioFile
                    ? `Loading ${audioFile.name}${lyricsFile ? ` and ${lyricsFile.name}` : ""}.`
                    : `Updating lyrics from ${lyricsFile?.name || "local file"}.`,
                tone: "busy"
            });

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

            this.updateTrackProcessingState({
                step: "Preparing lyric sync…",
                detail: lyricsData
                    ? "Parsing .lrc as line-level lyrics. Word-level Clean Phrase now requires lyrics_pro.json."
                    : "No .lrc file supplied. The track will load without custom lyric timing.",
                tone: "busy"
            });

            const karaokeData = hasNewAudio
                ? null
                : (currentTrack?.karaokeData?.source?.mode === "lyrics-pro" ? currentTrack.karaokeData : null);

            this.updateTrackProcessingState({
                step: "Applying custom track…",
                detail: lyricsData
                    ? "Line-level lyrics loaded. Upload lyrics_pro.json for Clean Phrase word timing."
                    : "Applying the audio track with the current lyric settings.",
                tone: "busy"
            });

            this.musicPlayer.setCustomTrack({
                id: `custom-${Date.now()}`,
                title: derivedTitle,
                artist: derivedArtist,
                note: lyricsData
                    ? "Loaded from the customizer panel with line-level lyrics."
                    : "Loaded from the customizer panel.",
                file,
                artwork: currentTrack?.artwork || null,
                lyrics: lyricsData ? null : (hasNewAudio ? null : (currentTrack?.lyrics || null)),
                lyricsData,
                karaoke: null,
                karaokeData
            }, true);

            this.updateTrackProcessingState({
                step: `Ready: ${derivedTitle}`,
                detail: lyricsData
                    ? "MP3 and .lrc loaded. Clean Phrase stays locked until a lyrics_pro.json is attached."
                    : "MP3 loaded. Add .lrc for line lyrics or lyrics_pro.json for Clean Phrase.",
                tone: "success"
            });

            this.shell.setStatus(`Custom track applied: ${derivedTitle}.`);
        } catch (error) {
            this.updateTrackProcessingState({
                step: "Could not process the local media.",
                detail: error?.message || "Check the selected files and try again.",
                tone: "error"
            });
            this.shell.setStatus("Could not process the selected audio or lyric file.");
        } finally {
            this.setTrackButtonsDisabled(false);
        }
    }

    async applyCustomTrackPersistent() {
        const audioFile = this.audioFile.files?.[0] || null;
        const lyricsFile = this.lyricsFile.files?.[0] || null;
        const lyricsProFile = this.lyricsProFile.files?.[0] || null;
        const editingRecord = this.editingTrackId
            ? await this.trackLibrary.get(this.editingTrackId)
            : null;
        const isEditing = Boolean(editingRecord);

        if (!audioFile && !lyricsFile && !lyricsProFile && !isEditing) {
            this.updateTrackProcessingState({
                step: "No local media selected.",
                detail: "Choose an MP3 file first. Add a .lrc file and optional word-timing .json if you want better lyric sync.",
                tone: "error"
            });
            this.shell.setStatus("Choose an audio file or start editing an existing saved track.");
            return;
        }

        if (!audioFile && isEditing && !editingRecord?.audioBlob) {
            this.updateTrackProcessingState({
                step: "Missing base audio.",
                detail: "This saved track no longer has audio data. Pick the MP3 again before saving.",
                tone: "error"
            });
            this.shell.setStatus("Pick the MP3 again before saving.");
            return;
        }

        this.setTrackButtonsDisabled(true);

        try {
            this.updateTrackProcessingState({
                step: "Reading local media...",
                detail: audioFile
                    ? `Loading ${audioFile.name}${lyricsFile ? `, ${lyricsFile.name}` : ""}${lyricsProFile ? `, ${lyricsProFile.name}` : ""}.`
                    : `Updating the saved track${lyricsFile ? ` with ${lyricsFile.name}` : ""}${lyricsProFile ? `${lyricsFile ? " and" : " with"} ${lyricsProFile.name}` : ""}.`,
                tone: "busy"
            });

            const nextTitle = this.trackTitle.value.trim()
                || (audioFile ? this.deriveTitle(audioFile.name) : editingRecord?.title)
                || "Local upload";
            const nextArtist = this.trackArtist.value.trim()
                || editingRecord?.artist
                || "Local custom track";
            const audioBlob = audioFile || editingRecord?.audioBlob || null;
            const audioName = audioFile?.name || editingRecord?.audioName || `${nextTitle}.mp3`;
            const audioType = audioFile?.type || editingRecord?.audioType || "audio/mpeg";
            const lyricsTextRaw = lyricsFile
                ? await lyricsFile.text()
                : (typeof editingRecord?.lyricsText === "string" ? editingRecord.lyricsText : null);
            const lyricsText = lyricsTextRaw && lyricsTextRaw.trim() ? lyricsTextRaw : null;
            const lyricsProTextRaw = lyricsProFile
                ? await lyricsProFile.text()
                : (typeof editingRecord?.lyricsProText === "string" ? editingRecord.lyricsProText : null);
            const lyricsProText = lyricsProTextRaw && lyricsProTextRaw.trim() ? lyricsProTextRaw : null;

            this.updateTrackProcessingState({
                step: "Preparing lyric sync...",
                detail: lyricsProText
                    ? "Mapping the uploaded word-timing JSON into the current lyric engine."
                    : lyricsText
                        ? "Parsing .lrc as line-level lyrics. Clean Phrase uses lyrics_pro.json only."
                        : "No lyric file supplied. The saved track will keep playing without synced lyrics.",
                tone: "busy"
            });

            const karaokeData = lyricsProText
                ? this.parseLyricsProData(lyricsProText, {
                    title: nextTitle,
                    artist: nextArtist
                })
                : (editingRecord?.karaokeData?.source?.mode === "lyrics-pro" ? editingRecord.karaokeData : null);
            const fallbackLineCount = karaokeData?.lines?.length || 0;
            const fallbackWordCount = this.countKaraokeWords(karaokeData);
            const timestamp = Date.now();
            const record = {
                id: editingRecord?.id || `saved-${timestamp}`,
                title: nextTitle,
                artist: nextArtist,
                note: lyricsText
                    ? "Saved in this browser with line-level lyrics."
                    : "Saved in this browser without custom lyric timing.",
                artwork: editingRecord?.artwork || null,
                audioBlob,
                audioName,
                audioType,
                lyricsText,
                lyricsProText,
                karaokeData,
                createdAt: editingRecord?.createdAt || timestamp,
                updatedAt: timestamp
            };

            if (!record.audioBlob) {
                throw new Error("No audio file is available for this saved track.");
            }

            await this.trackLibrary.put(record);
            await this.loadSavedTrackLibrary({
                preferredTrackId: record.id,
                autoplay: true
            });
            this.resetTrackForm();

            this.updateTrackProcessingState({
                step: isEditing ? `Updated: ${nextTitle}` : `Saved: ${nextTitle}`,
                detail: lyricsProText
                    ? `Mapped ${fallbackLineCount} lyric lines and ${fallbackWordCount} word timestamps from lyrics_pro.json.`
                    : lyricsText
                        ? "Saved .lrc for line-level lyrics. Attach lyrics_pro.json to unlock Clean Phrase."
                        : "Track saved. Add a .lrc or word-timing .json later if you want lyric sync and Clean Phrase.",
                tone: "success"
            });
            this.shell.setStatus(
                isEditing
                    ? `Saved changes to ${nextTitle}.`
                    : `Saved ${nextTitle} to your local library.`
            );
        } catch (error) {
            this.updateTrackProcessingState({
                step: "Could not save the local media.",
                detail: error?.message || "Check the selected files and try again.",
                tone: "error"
            });
            this.shell.setStatus("Could not save the selected audio or lyric file.");
        } finally {
            this.setTrackButtonsDisabled(false);
        }
    }

    async loadSavedTrackLibrary({ preferredTrackId = null, autoplay = false } = {}) {
        try {
            const records = await this.trackLibrary.getAll();
            this.trackLibraryRecords = records;
            const tracks = records.map((record) => this.hydrateSavedTrack(record));
            this.musicPlayer.setLibraryTracks(tracks, {
                preferredTrackId,
                autoplay
            });
            this.renderSavedTrackLibrary();
        } catch (error) {
            this.trackLibraryRecords = [];
            this.savedTrackLibrary.hidden = true;
            this.savedTrackLibraryList?.replaceChildren();
            this.savedTrackLibraryNote.textContent = "Could not load saved tracks.";
            this.shell.setStatus("Could not restore the saved local track library.");
        }
    }

    hydrateSavedTrack(record) {
        const lyricsData = typeof record.lyricsText === "string" && record.lyricsText.trim()
            ? record.lyricsText
            : null;
        let karaokeData = this.isCleanPhraseReadyRecord(record)
            ? record.karaokeData
            : null;
        if (!karaokeData && typeof record.lyricsProText === "string" && record.lyricsProText.trim()) {
            try {
                karaokeData = this.parseLyricsProData(record.lyricsProText, {
                    title: record.title,
                    artist: record.artist
                });
            } catch (error) {
                console.warn("Saved lyrics_pro.json could not be parsed for Clean Phrase.", error);
            }
        }

        return {
            id: record.id,
            title: record.title,
            artist: record.artist,
            note: record.note || "Saved in this browser.",
            artwork: record.artwork || null,
            file: URL.createObjectURL(record.audioBlob),
            managedFileUrl: true,
            lyrics: null,
            lyricsData,
            karaoke: null,
            karaokeData,
            cleanPhraseReady: this.isCleanPhraseReadyRecord({ ...record, karaokeData })
        };
    }

    hasWordTimingJson(record) {
        return Boolean(
            (typeof record?.lyricsProText === "string" && record.lyricsProText.trim())
            || this.isCleanPhraseReadyRecord(record)
        );
    }

    isCleanPhraseReadyRecord(record) {
        const karaokeData = record?.karaokeData;
        if (!Array.isArray(karaokeData?.lines) || karaokeData.lines.length === 0) {
            return false;
        }

        if (karaokeData?.source?.mode === "lyrics-pro") {
            return true;
        }

        return karaokeData.lines.some((line) => (
            Array.isArray(line?.words)
            && line.words.some((word) => {
                const startTime = Number(word?.startTime ?? word?.timeMs ?? word?.startMs ?? word?.start ?? word?.s ?? NaN);
                const endTime = Number(word?.endTime ?? word?.endMs ?? word?.end ?? word?.e ?? NaN);
                return Number.isFinite(startTime) && Number.isFinite(endTime) && endTime >= startTime;
            })
        ));
    }

    renderSavedTrackLibrary() {
        if (!this.savedTrackLibrary || !this.savedTrackLibraryList || !this.savedTrackLibraryNote) {
            return;
        }

        if (!this.trackLibraryRecords.length) {
            this.savedTrackLibrary.hidden = true;
            this.savedTrackLibraryList.replaceChildren();
            this.savedTrackLibraryNote.textContent = "Tracks saved in this browser appear here.";
            if (this.exportTrackLibraryCodeButton) {
                this.exportTrackLibraryCodeButton.disabled = true;
            }
            return;
        }

        this.savedTrackLibrary.hidden = false;
        this.savedTrackLibraryNote.textContent = `${this.trackLibraryRecords.length} saved track${this.trackLibraryRecords.length > 1 ? "s" : ""} in this browser.`;
        if (this.exportTrackLibraryCodeButton) {
            this.exportTrackLibraryCodeButton.disabled = false;
        }

        this.savedTrackLibraryList.replaceChildren(
            ...this.trackLibraryRecords.map((record) => {
                const hasWordTimingJson = this.hasWordTimingJson(record);
                const cleanPhraseReady = this.isCleanPhraseReadyRecord(record);
                const item = document.createElement("article");
                item.className = "customizer-library-item";
                if (cleanPhraseReady) {
                    item.classList.add("is-clean-phrase-ready");
                }

                const main = document.createElement("div");
                main.className = "customizer-library-main";

                const title = document.createElement("strong");
                title.className = "customizer-library-title";
                title.textContent = record.title || "Untitled track";

                const meta = document.createElement("p");
                meta.className = "customizer-library-meta";
                meta.textContent = [
                    record.artist || "Unknown artist",
                    hasWordTimingJson ? "word-timing JSON attached" : (record.lyricsText ? "saved .lrc lyrics" : "no lyrics")
                ].join(" - ");

                main.append(title, meta);

                const badges = document.createElement("div");
                badges.className = "customizer-library-badges";

                if (hasWordTimingJson) {
                    const wordTimingBadge = document.createElement("span");
                    wordTimingBadge.className = "customizer-library-badge customizer-library-badge--json";
                    wordTimingBadge.textContent = "Word Timing JSON";
                    badges.append(wordTimingBadge);
                }

                if (cleanPhraseReady) {
                    const readyBadge = document.createElement("span");
                    readyBadge.className = "customizer-library-badge customizer-library-badge--ready";
                    readyBadge.textContent = "Clean Phrase Ready";
                    badges.append(readyBadge);
                }

                if (badges.children.length) {
                    main.append(badges);
                }

                const actions = document.createElement("div");
                actions.className = "customizer-library-actions";

                [
                    ["Load", "load", ""],
                    ["Edit", "edit", ""],
                    ["Delete", "delete", " customizer-library-btn--danger"]
                ].forEach(([label, action, extraClass]) => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = `customizer-library-btn${extraClass}`;
                    button.dataset.trackAction = action;
                    button.dataset.trackId = record.id;
                    button.textContent = label;
                    actions.append(button);
                });

                item.append(main, actions);
                return item;
            })
        );
    }

    syncTrackFormMode() {
        const isEditing = Boolean(this.editingTrackId);
        this.applyTrackButton.textContent = isEditing ? "Update saved track" : "Save and load track";
        if (this.cancelTrackEditButton) {
            this.cancelTrackEditButton.hidden = !isEditing;
        }
    }

    resetTrackForm() {
        this.editingTrackId = null;
        this.trackTitle.value = "";
        this.trackArtist.value = "";
        if (this.audioFile) {
            this.audioFile.value = "";
        }
        if (this.lyricsFile) {
            this.lyricsFile.value = "";
        }
        if (this.lyricsProFile) {
            this.lyricsProFile.value = "";
        }
        this.syncTrackFormMode();
    }

    async startEditingSavedTrack(trackId) {
        try {
            const record = await this.trackLibrary.get(trackId);
            if (!record) {
                throw new Error("That saved track is no longer available.");
            }

            this.editingTrackId = trackId;
            this.trackTitle.value = record.title || "";
            this.trackArtist.value = record.artist || "";
            if (this.audioFile) {
                this.audioFile.value = "";
            }
            if (this.lyricsFile) {
                this.lyricsFile.value = "";
            }
            if (this.lyricsProFile) {
                this.lyricsProFile.value = "";
            }
            this.syncTrackFormMode();
            this.updateTrackProcessingState({
                step: `Editing: ${record.title}`,
                detail: "Leave audio, .lrc, or word-timing .json empty to keep the saved files. Pick a new file only for the part you want to replace.",
                tone: "idle"
            });
            this.shell.setStatus(`Editing saved track: ${record.title}.`);
        } catch (error) {
            this.updateTrackProcessingState({
                step: "Could not open the saved track editor.",
                detail: error?.message || "Try again.",
                tone: "error"
            });
            this.shell.setStatus("Could not open that saved track for editing.");
        }
    }

    async deleteSavedTrack(trackId) {
        try {
            const wasEditing = this.editingTrackId === trackId;
            await this.trackLibrary.delete(trackId);
            if (wasEditing) {
                this.resetTrackForm();
            }

            const preferredTrackId = this.musicPlayer.getCurrentTrack()?.id === trackId
                ? null
                : this.musicPlayer.getCurrentTrack()?.id || null;
            await this.loadSavedTrackLibrary({
                preferredTrackId,
                autoplay: false
            });

            this.updateTrackProcessingState({
                step: "Saved track deleted.",
                detail: "The track was removed from this browser library.",
                tone: "success"
            });
            this.shell.setStatus("Saved local track deleted.");
        } catch (error) {
            this.updateTrackProcessingState({
                step: "Could not delete the saved track.",
                detail: error?.message || "Try again.",
                tone: "error"
            });
            this.shell.setStatus("Could not delete the saved local track.");
        }
    }

    createCodeSafeId(value = "") {
        return String(value || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            || `track-${Date.now()}`;
    }

    escapeTemplateLiteral(value = "") {
        return String(value || "")
            .replace(/\\/g, "\\\\")
            .replace(/`/g, "\\`")
            .replace(/\$\{/g, "\\${");
    }

    buildTrackLibraryExportCode(records = this.trackLibraryRecords) {
        const blocks = records.map((record, index) => {
            const safeId = this.createCodeSafeId(record.id || record.title || `saved-track-${index + 1}`);
            const audioName = record.audioName || `${safeId}.mp3`;
            const lyricsName = audioName.replace(/\.[^.]+$/i, ".lrc");
            const title = this.escapeTemplateLiteral(record.title || "Untitled track");
            const artist = this.escapeTemplateLiteral(record.artist || "Unknown artist");
            const note = this.escapeTemplateLiteral(record.note || "Imported from local saved tracks.");
            const lyricsText = typeof record.lyricsText === "string" ? this.escapeTemplateLiteral(record.lyricsText) : "";

            return `{
    id: "${safeId}",
    title: \`${title}\`,
    artist: \`${artist}\`,
    file: "./${audioName}",
    lyrics: ${lyricsText ? `"./${lyricsName}"` : "null"},
    lyricsData: ${lyricsText ? `\`${lyricsText}\`` : "null"},
    karaoke: null,
    karaokeData: null,
    note: \`${note}\`
}`;
        });

        return [
            "// Paste these objects into APP_CONFIG.music.playlist in D:/Profile/js/config.js",
            "// Replace file/lyrics paths if you move the exported audio or .lrc files elsewhere.",
            ...blocks
        ].join("\n\n");
    }

    async exportTrackLibraryCode() {
        if (!this.trackLibraryRecords.length) {
            this.shell.setStatus("No saved local tracks to export.");
            return;
        }

        const code = this.buildTrackLibraryExportCode();
        let copied = false;
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(code);
                copied = true;
            }
        } catch (error) {
            copied = false;
        }

        const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
        const downloadUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = downloadUrl;
        anchor.download = "saved-local-tracks.config.txt";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);

        this.updateTrackProcessingState({
            step: copied ? "Saved track code copied and downloaded." : "Saved track code downloaded.",
            detail: "Paste the generated blocks into APP_CONFIG.music.playlist and update file paths if needed.",
            tone: "success"
        });
        this.shell.setStatus(copied ? "Saved track code copied to clipboard." : "Saved track code downloaded.");
    }

    async loadSavedBackgroundAssets() {
        try {
            const currentMode = this.backgroundEngine.getState()?.mode || "video";
            const savedVideo = await this.trackLibrary.getBackgroundAsset("video");
            const savedImage = await this.trackLibrary.getBackgroundAsset("image");

            if (savedVideo?.blob) {
                this.backgroundEngine.applyStoredCustomVideo(savedVideo.blob, savedVideo.label, false);
            }

            if (savedImage?.blob) {
                this.backgroundEngine.applyStoredCustomImage(savedImage.blob, savedImage.label, false);
            }

            if (savedVideo?.blob || savedImage?.blob) {
                this.backgroundEngine.setMode(currentMode, false);
            }
        } catch (error) {
            this.shell.setStatus("Could not restore saved background media.");
        }
    }

    async applyCustomBackgroundVideo(file) {
        try {
            const label = this.deriveTitle(file.name) || "Custom video";
            await this.trackLibrary.putBackgroundAsset({
                kind: "video",
                label,
                blob: file,
                updatedAt: Date.now()
            });
            this.backgroundEngine.applyStoredCustomVideo(file, label, true);
            this.customBackgroundVideoFile.value = "";
            this.shell.setStatus("Custom background video saved in this browser.");
        } catch (error) {
            this.shell.setStatus("Could not save the custom background video.");
        }
    }

    async clearCustomBackgroundVideo() {
        try {
            await this.trackLibrary.deleteBackgroundAsset("video");
            this.backgroundEngine.clearCustomVideo(true);
            this.customBackgroundVideoFile.value = "";
        } catch (error) {
            this.shell.setStatus("Could not clear the custom background video.");
        }
    }

    async applyCustomBackgroundImage(file) {
        try {
            const label = this.deriveTitle(file.name) || "Custom image";
            await this.trackLibrary.putBackgroundAsset({
                kind: "image",
                label,
                blob: file,
                updatedAt: Date.now()
            });
            this.backgroundEngine.applyStoredCustomImage(file, label, true);
            this.customBackgroundImageFile.value = "";
            this.shell.setStatus("Custom background image saved in this browser.");
        } catch (error) {
            this.shell.setStatus("Could not save the custom background image.");
        }
    }

    async clearCustomBackgroundImage() {
        try {
            await this.trackLibrary.deleteBackgroundAsset("image");
            this.backgroundEngine.clearCustomImage(true);
            this.customBackgroundImageFile.value = "";
        } catch (error) {
            this.shell.setStatus("Could not clear the custom background image.");
        }
    }

    deriveTitle(fileName) {
        return fileName
            .replace(/\.[^.]+$/, "")
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    setTrackButtonsDisabled(disabled) {
        this.applyTrackButton.disabled = disabled;
        this.clearTrackButton.disabled = disabled;
        if (this.cancelTrackEditButton) {
            this.cancelTrackEditButton.disabled = disabled;
        }
    }

    updateTrackProcessingState({ step, detail, tone = "idle", hidden = false }) {
        if (!this.trackStatus || !this.trackStatusStep || !this.trackStatusDetail) {
            return;
        }

        this.trackStatus.hidden = hidden;
        this.trackStatus.classList.toggle("is-busy", tone === "busy");
        this.trackStatus.classList.toggle("is-success", tone === "success");
        this.trackStatus.classList.toggle("is-error", tone === "error");
        this.trackStatusStep.textContent = step || "Waiting for local media.";
        this.trackStatusDetail.textContent = detail || "Add an MP3, optional .lrc file, and optional word-timing .json. The player will prepare lyric timing automatically.";
    }

    repairMojibakeText(value) {
        const text = String(value ?? "");
        if (!/[ÃÄÆáºá»]/.test(text)) {
            return text;
        }

        try {
            const bytes = Uint8Array.from(Array.from(text, (char) => char.charCodeAt(0) & 0xff));
            const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
            return decoded || text;
        } catch (error) {
            return text;
        }
    }

    repairLyricText(value) {
        let text = String(value ?? "");
        const suspiciousPattern = /(?:Ã|Â|Ä|Æ|áº|á»|�)/;
        if (!suspiciousPattern.test(text)) {
            return text;
        }

        for (let pass = 0; pass < 3; pass += 1) {
            if (!suspiciousPattern.test(text)) {
                break;
            }

            try {
                const bytes = Uint8Array.from(Array.from(text, (char) => char.charCodeAt(0) & 0xff));
                const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
                if (!decoded || decoded === text) {
                    break;
                }
                text = decoded;
            } catch (error) {
                break;
            }
        }

        return text;
    }

    parseLyricsProData(source, meta = {}) {
        const parsedSource = typeof source === "string"
            ? JSON.parse(source)
            : source;
        const rawLines = Array.isArray(parsedSource?.data) ? parsedSource.data : [];
        const lines = rawLines.map((entry, lineIndex) => {
            const rawWords = Array.isArray(entry?.words) ? entry.words : [];
            const words = rawWords.map((word, wordIndex) => {
                const text = this.repairLyricText(word?.w || word?.text || word?.word || "").trim();
                const startTime = Number(word?.s ?? word?.startTime ?? word?.start ?? NaN);
                const endTime = Number(word?.e ?? word?.endTime ?? word?.end ?? NaN);
                if (!text) {
                    return null;
                }

                return {
                    text,
                    startTime: Number.isFinite(startTime) ? startTime : null,
                    endTime: Number.isFinite(endTime) ? endTime : null,
                    timeMs: Number.isFinite(startTime) ? startTime : null,
                    confidence: 0.96,
                    sourceMode: "lyrics-pro",
                    index: wordIndex
                };
            }).filter(Boolean);
            const lineStartMs = Number(entry?.startTimeMs ?? entry?.start ?? words[0]?.timeMs ?? 0);
            const text = this.repairLyricText(entry?.line || words.map((word) => word.text).join(" ")).trim();

            return {
                lineStartMs: Number.isFinite(lineStartMs) ? lineStartMs : 0,
                text: text || "...",
                words,
                sourceMode: "lyrics-pro",
                index: lineIndex
            };
        }).filter((line) => line.words.length > 0 || line.text);

        lines.sort((left, right) => left.lineStartMs - right.lineStartMs);
        lines.forEach((line, index) => {
            const nextLine = lines[index + 1] || null;
            const fallbackEnd = Number.isFinite(nextLine?.lineStartMs)
                ? nextLine.lineStartMs
                : line.lineStartMs + 420;
            line.words.forEach((word, wordIndex) => {
                const nextWord = line.words[wordIndex + 1] || null;
                const resolvedEnd = Number.isFinite(word.endTime)
                    ? word.endTime
                    : Number.isFinite(nextWord?.startTime)
                        ? nextWord.startTime
                        : fallbackEnd;
                const wordStart = Number.isFinite(word.startTime) ? word.startTime : line.lineStartMs;
                const nextStart = Number.isFinite(nextWord?.startTime) ? nextWord.startTime : null;
                const minimumEnd = Math.max(resolvedEnd, wordStart + 24);
                word.endTime = Number.isFinite(nextStart) && nextStart > wordStart
                    ? Math.min(minimumEnd, nextStart)
                    : minimumEnd;
                word.timeMs = Number.isFinite(word.startTime) ? word.startTime : line.lineStartMs;
            });
        });

        return {
            generatedAt: new Date().toISOString(),
            source: {
                mode: "lyrics-pro",
                title: meta.title || parsedSource?.song || null,
                artist: meta.artist || null
            },
            lines
        };
    }

    parseLrc(text) {
        const lines = [];

        String(text || "")
            .split(/\r?\n/)
            .forEach((rawLine) => {
                const line = rawLine.trim();
                if (!line) {
                    return;
                }

                const stamps = [...line.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
                if (stamps.length === 0) {
                    return;
                }

                const lyricText = line.replace(/\[[^\]]+\]/g, "").trim();
                stamps.forEach((stamp) => {
                    const minutes = Number(stamp[1]) || 0;
                    const seconds = Number(stamp[2]) || 0;
                    const fractionalRaw = stamp[3] || "0";
                    const fractional = fractionalRaw.length === 3
                        ? Number(fractionalRaw)
                        : Number(fractionalRaw.padEnd(2, "0")) * 10;

                    lines.push({
                        timeMs: minutes * 60000 + seconds * 1000 + fractional,
                        text: lyricText || "..."
                    });
                });
            });

        return lines.sort((a, b) => a.timeMs - b.timeMs);
    }

    countKaraokeWords(karaokeData) {
        const lines = Array.isArray(karaokeData?.lines) ? karaokeData.lines : [];
        return lines.reduce((sum, line) => (
            sum + (Array.isArray(line?.words) ? line.words.length : 0)
        ), 0);
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
