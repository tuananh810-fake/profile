class MusicPlayer {
    constructor({ root, audio, config, onStatusChange, onAudioLevel, onAudioReactive, onTrackChange }) {
        this.root = root;
        this.audio = audio;
        this.config = config;
        this.onStatusChange = onStatusChange;
        this.onAudioLevel = onAudioLevel;
        this.onAudioReactive = onAudioReactive;
        this.onTrackChange = onTrackChange;

        this.stateLabel = document.getElementById("musicState");
        this.artwork = document.getElementById("musicArtwork");
        this.artworkFallback = document.getElementById("musicArtworkFallback");
        this.trackName = document.getElementById("musicTrackName");
        this.trackArtist = document.getElementById("musicTrackArtist");
        this.trackNote = document.getElementById("musicTrackNote");
        this.progress = document.getElementById("musicProgress");
        this.currentTime = document.getElementById("musicCurrentTime");
        this.duration = document.getElementById("musicDuration");
        this.prevButton = document.getElementById("musicPrevBtn");
        this.playButton = document.getElementById("musicPlayBtn");
        this.nextButton = document.getElementById("musicNextBtn");
        this.volume = document.getElementById("musicVolume");
        this.queue = document.getElementById("musicQueue");
        this.focusRoot = document.getElementById("focusPlayer");
        this.focusArtwork = document.getElementById("focusPlayerArtwork");
        this.focusArtworkFallback = document.getElementById("focusPlayerArtworkFallback");
        this.focusTrackName = document.getElementById("focusPlayerTitle");
        this.focusTrackArtist = document.getElementById("focusPlayerArtist");
        this.focusState = document.getElementById("focusPlayerState");
        this.focusProgressFill = document.getElementById("focusPlayerProgressFill");
        this.focusCurrentTime = document.getElementById("focusPlayerCurrentTime");
        this.focusDuration = document.getElementById("focusPlayerDuration");
        this.focusPrevButton = document.getElementById("focusPrevBtn");
        this.focusPlayButton = document.getElementById("focusPlayBtn");
        this.focusNextButton = document.getElementById("focusNextBtn");
        this.dragHandle = document.getElementById("musicDragHandle");
        this.resizeHandles = Array.from(this.root.querySelectorAll("[data-music-resize]"));
        this.stage = document.getElementById("shellStage");
        this.basePlaylist = this.config.music.playlist.map((track) => ({ ...track }));
        this.libraryTracks = [];

        this.state = {
            playlist: this.basePlaylist.map((track) => ({ ...track })),
            currentIndex: this.config.music.defaultTrack,
            isPlaying: false,
            duration: 0
        };

        this.panelState = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
        this.panelStorageKey = "profile.musicDock.geometry";
        this.pointerAction = null;

        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.sourceNode = null;
        this.analysisFrame = null;
        this.customTrackResource = null;
        this.libraryTrackResources = [];
        this.isSeeking = false;
        this.seekPointerId = null;
        this.reactiveState = {
            overall: 0,
            bass: 0,
            mid: 0,
            high: 0,
            pulse: 0,
            transient: 0,
            isPlaying: false
        };

        this.handleLoadedMetadata = this.handleLoadedMetadata.bind(this);
        this.handleDurationChange = this.handleDurationChange.bind(this);
        this.handlePlayableState = this.handlePlayableState.bind(this);
        this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
        this.handleEnded = this.handleEnded.bind(this);
        this.handlePlay = this.handlePlay.bind(this);
        this.handlePause = this.handlePause.bind(this);
        this.handlePanelPointerMove = this.handlePanelPointerMove.bind(this);
        this.handlePanelPointerUp = this.handlePanelPointerUp.bind(this);
        this.handleWindowResize = this.handleWindowResize.bind(this);
        this.handleProgressInput = this.handleProgressInput.bind(this);
        this.handleProgressChange = this.handleProgressChange.bind(this);
        this.handleProgressPointerDown = this.handleProgressPointerDown.bind(this);
        this.handleProgressPointerMove = this.handleProgressPointerMove.bind(this);
        this.handleProgressPointerUp = this.handleProgressPointerUp.bind(this);
    }

    init() {
        this.renderQueue();
        this.attachEvents();
        this.initFloatingPanel();
        this.applyVolume(this.readStoredVolume(), false);
        this.loadTrack(this.state.currentIndex, false);
        this.setStatus("Music dock ready. Press Play to start the local track.");
    }

    renderQueue() {
        const tracks = this.state.playlist;

        this.queue.replaceChildren(
            ...tracks.map((track, index) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "music-queue-item";
                button.dataset.index = String(index);

                const order = document.createElement("span");
                order.className = "music-queue-index";
                order.textContent = track.isCustom ? "UP" : String(index + 1).padStart(2, "0");

                const copy = document.createElement("span");
                copy.className = "music-queue-copy";

                const title = document.createElement("strong");
                title.className = "music-queue-title";
                title.textContent = track.title;

                const artist = document.createElement("span");
                artist.className = "music-queue-artist";
                artist.textContent = track.artist;

                copy.append(title, artist);
                button.append(order, copy);
                button.addEventListener("click", () => this.loadTrack(index, true));

                return button;
            })
        );
    }

    attachEvents() {
        this.audio.addEventListener("loadedmetadata", this.handleLoadedMetadata);
        this.audio.addEventListener("durationchange", this.handleDurationChange);
        this.audio.addEventListener("loadeddata", this.handlePlayableState);
        this.audio.addEventListener("canplay", this.handlePlayableState);
        this.audio.addEventListener("canplaythrough", this.handlePlayableState);
        this.audio.addEventListener("progress", this.handlePlayableState);
        this.audio.addEventListener("timeupdate", this.handleTimeUpdate);
        this.audio.addEventListener("ended", this.handleEnded);
        this.audio.addEventListener("play", this.handlePlay);
        this.audio.addEventListener("pause", this.handlePause);
        this.audio.addEventListener("error", () => {
            this.updateStateLabel("error");
            this.setStatus("Audio file could not be loaded. Check the selected file or track path.");
        });

        this.playButton.addEventListener("click", () => this.togglePlayback());
        this.prevButton.addEventListener("click", () => this.stepTrack(-1));
        this.nextButton.addEventListener("click", () => this.stepTrack(1));
        this.focusPlayButton.addEventListener("click", () => this.togglePlayback());
        this.focusPrevButton.addEventListener("click", () => this.stepTrack(-1));
        this.focusNextButton.addEventListener("click", () => this.stepTrack(1));
        this.volume.addEventListener("input", (event) => {
            this.applyVolume(Number(event.target.value), true);
        });
        this.progress.addEventListener("pointerdown", this.handleProgressPointerDown);
        this.progress.addEventListener("input", this.handleProgressInput);
        this.progress.addEventListener("change", this.handleProgressChange);
        window.addEventListener("pointermove", this.handleProgressPointerMove);
        window.addEventListener("pointerup", this.handleProgressPointerUp);

        this.dragHandle.addEventListener("pointerdown", (event) => this.startPanelDrag(event));
        this.resizeHandles.forEach((handle) => {
            handle.addEventListener("pointerdown", (event) => this.startPanelResize(event, handle.dataset.musicResize));
        });
        window.addEventListener("resize", this.handleWindowResize);
    }

    initFloatingPanel() {
        if (!this.stage) {
            return;
        }

        const stageRect = this.stage.getBoundingClientRect();
        const rootRect = this.root.getBoundingClientRect();
        const defaults = {
            x: Math.max(0, rootRect.left - stageRect.left),
            y: Math.max(0, rootRect.top - stageRect.top),
            width: rootRect.width,
            height: rootRect.height
        };

        this.panelState = { ...defaults };

        try {
            const stored = JSON.parse(localStorage.getItem(this.panelStorageKey) || "null");
            if (stored && typeof stored === "object") {
                this.panelState.x = Number.isFinite(stored.x) ? stored.x : defaults.x;
                this.panelState.y = Number.isFinite(stored.y) ? stored.y : defaults.y;
                this.panelState.width = Number.isFinite(stored.width) ? stored.width : defaults.width;
                this.panelState.height = Number.isFinite(stored.height) ? stored.height : defaults.height;
            }
        } catch (error) {
            // Ignore invalid stored geometry.
        }

        this.root.classList.add("is-floating");
        this.clampPanelSize();
        this.clampPanelPosition();
        this.applyPanelLayout();
    }

    startPanelDrag(event) {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        this.pointerAction = {
            type: "drag",
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: this.panelState.x,
            originY: this.panelState.y
        };

        this.root.classList.add("is-dragging");
        this.addPanelPointerListeners();
    }

    startPanelResize(event, direction) {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.pointerAction = {
            type: "resize",
            direction,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: this.panelState.x,
            originY: this.panelState.y,
            originWidth: this.panelState.width,
            originHeight: this.panelState.height
        };

        this.root.classList.add("is-resizing");
        this.addPanelPointerListeners();
    }

    addPanelPointerListeners() {
        window.addEventListener("pointermove", this.handlePanelPointerMove);
        window.addEventListener("pointerup", this.handlePanelPointerUp);
    }

    removePanelPointerListeners() {
        window.removeEventListener("pointermove", this.handlePanelPointerMove);
        window.removeEventListener("pointerup", this.handlePanelPointerUp);
    }

    handlePanelPointerMove(event) {
        if (!this.pointerAction || event.pointerId !== this.pointerAction.pointerId) {
            return;
        }

        const deltaX = event.clientX - this.pointerAction.startX;
        const deltaY = event.clientY - this.pointerAction.startY;

        if (this.pointerAction.type === "drag") {
            this.panelState.x = this.pointerAction.originX + deltaX;
            this.panelState.y = this.pointerAction.originY + deltaY;
            this.clampPanelPosition();
            this.applyPanelLayout();
            return;
        }

        if (this.pointerAction.direction.includes("e")) {
            this.panelState.width = this.pointerAction.originWidth + deltaX;
        }

        if (this.pointerAction.direction.includes("s")) {
            this.panelState.height = this.pointerAction.originHeight + deltaY;
        }

        this.clampPanelSize();
        this.clampPanelPosition();
        this.applyPanelLayout();
    }

    handlePanelPointerUp(event) {
        if (!this.pointerAction || event.pointerId !== this.pointerAction.pointerId) {
            return;
        }

        const wasDragging = this.pointerAction.type === "drag";
        const wasResizing = this.pointerAction.type === "resize";

        this.pointerAction = null;
        this.root.classList.remove("is-dragging", "is-resizing");
        this.removePanelPointerListeners();
        this.persistPanelState();

        if (wasDragging) {
            this.setStatus("Module 4 position updated.");
        }

        if (wasResizing) {
            this.setStatus("Module 4 size updated.");
        }
    }

    handleWindowResize() {
        if (!this.root.classList.contains("is-floating")) {
            return;
        }

        this.clampPanelSize();
        this.clampPanelPosition();
        this.applyPanelLayout();
        this.persistPanelState();
    }

    clampPanelSize() {
        const bounds = this.getPanelBounds();
        const panelConfig = this.config.musicDock || {};
        const maxWidth = Math.min(panelConfig.maxWidth ?? 520, Math.max(bounds.width - (panelConfig.safePadding ?? 12) * 2, panelConfig.minWidth ?? 320));
        const maxHeight = Math.min(panelConfig.maxHeight ?? 760, Math.max(bounds.height - (panelConfig.safePadding ?? 12) * 2, panelConfig.minHeight ?? 320));

        this.panelState.width = this.clamp(this.panelState.width || maxWidth, panelConfig.minWidth ?? 320, maxWidth);
        this.panelState.height = this.clamp(this.panelState.height || maxHeight, panelConfig.minHeight ?? 320, maxHeight);
    }

    clampPanelPosition() {
        const bounds = this.getPanelBounds();
        const safePadding = this.config.musicDock?.safePadding ?? 12;
        const maxX = Math.max(safePadding, bounds.width - this.panelState.width - safePadding);
        const maxY = Math.max(safePadding, bounds.height - this.panelState.height - safePadding);

        this.panelState.x = this.clamp(this.panelState.x, safePadding, maxX);
        this.panelState.y = this.clamp(this.panelState.y, safePadding, maxY);
    }

    applyPanelLayout() {
        this.root.style.left = `${this.panelState.x}px`;
        this.root.style.top = `${this.panelState.y}px`;
        this.root.style.setProperty("--music-dock-width", `${this.panelState.width}px`);
        this.root.style.setProperty("--music-dock-height", `${this.panelState.height}px`);
    }

    persistPanelState() {
        localStorage.setItem(this.panelStorageKey, JSON.stringify(this.panelState));
    }

    getPanelBounds() {
        return {
            width: this.stage?.clientWidth || window.innerWidth,
            height: this.stage?.clientHeight || window.innerHeight
        };
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    loadTrack(index, autoplay = false) {
        const tracks = this.state.playlist;
        if (tracks.length === 0) {
            return;
        }

        const nextIndex = ((index % tracks.length) + tracks.length) % tracks.length;
        const track = tracks[nextIndex];

        this.state.currentIndex = nextIndex;
        this.audio.src = track.file;
        this.audio.load();

        this.trackName.textContent = track.title;
        this.trackArtist.textContent = track.artist;
        this.trackNote.textContent = track.note || "";
        this.focusTrackName.textContent = track.title;
        this.focusTrackArtist.textContent = track.artist;
        this.applyArtwork(this.artwork, this.artworkFallback, track);
        this.applyArtwork(this.focusArtwork, this.focusArtworkFallback, track);

        this.currentTime.textContent = "0:00";
        this.duration.textContent = "0:00";
        this.focusCurrentTime.textContent = "0:00";
        this.focusDuration.textContent = "0:00";
        this.progress.value = "0";
        this.progress.max = "0";
        this.progress.step = "0.01";
        this.focusProgressFill.style.width = "0%";
        this.updateQueueState();
        this.updateStateLabel(autoplay ? "loading" : "ready");
        this.setStatus(`Track loaded: ${track.title}.`);

        if (typeof this.onTrackChange === "function") {
            this.onTrackChange(track, nextIndex);
        }

        if (autoplay) {
            this.play();
        }
    }

    updateQueueState() {
        const items = Array.from(this.queue.querySelectorAll(".music-queue-item"));
        items.forEach((item, index) => {
            item.classList.toggle("is-active", index === this.state.currentIndex);
        });
    }

    togglePlayback() {
        if (this.state.isPlaying) {
            this.audio.pause();
            return;
        }

        this.play();
    }

    async play() {
        try {
            await this.audio.play();
        } catch (error) {
            this.updateStateLabel("blocked");
            this.setStatus("Playback is blocked until a direct user interaction is accepted by the browser.");
        }
    }

    stepTrack(direction) {
        this.loadTrack(this.state.currentIndex + direction, true);
    }

    handleLoadedMetadata() {
        this.refreshDurationState();
    }

    handleDurationChange() {
        this.refreshDurationState();
    }

    handlePlayableState() {
        this.refreshDurationState();
    }

    handleTimeUpdate() {
        const duration = this.getResolvedDuration();
        const currentTime = this.audio.currentTime || 0;

        this.currentTime.textContent = this.formatTime(currentTime);
        this.focusCurrentTime.textContent = this.formatTime(currentTime);

        if (duration > 0 && duration !== this.state.duration) {
            this.refreshDurationState();
        }

        if (!this.isSeeking) {
            this.syncProgressUi(currentTime, duration);
        }
    }

    handleProgressPointerDown(event) {
        if (event.button !== 0) {
            return;
        }

        const duration = this.getResolvedDuration();
        if (!duration) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.isSeeking = true;
        this.seekPointerId = event.pointerId;
        this.progress.setPointerCapture?.(event.pointerId);
        this.seekFromPointerEvent(event, false);
    }

    handleProgressInput() {
        this.isSeeking = true;
        this.seekFromProgress(false);
    }

    handleProgressChange() {
        this.seekFromProgress(true);
    }

    handleProgressPointerMove(event) {
        if (!this.isSeeking || this.seekPointerId !== event.pointerId) {
            return;
        }

        this.seekFromPointerEvent(event, false);
    }

    handleProgressPointerUp(event) {
        if (!this.isSeeking) {
            return;
        }

        if (this.seekPointerId !== null && event.pointerId !== this.seekPointerId) {
            return;
        }

        this.seekFromPointerEvent(event, true);
        this.progress.releasePointerCapture?.(event.pointerId);
        this.seekPointerId = null;
    }

    seekFromProgress(commit = false) {
        const duration = this.getResolvedDuration();
        if (!duration) {
            this.isSeeking = false;
            this.seekPointerId = null;
            return;
        }

        const nextTime = this.clamp(Number(this.progress.value) || 0, 0, duration);
        this.audio.currentTime = nextTime;
        this.currentTime.textContent = this.formatTime(nextTime);
        this.focusCurrentTime.textContent = this.formatTime(nextTime);
        this.syncProgressUi(nextTime, duration);

        if (commit) {
            this.isSeeking = false;
            this.seekPointerId = null;
        }
    }

    seekFromPointerEvent(event, commit = false) {
        const duration = this.getResolvedDuration();
        if (!duration) {
            this.isSeeking = false;
            this.seekPointerId = null;
            return;
        }

        const rect = this.progress.getBoundingClientRect();
        if (!rect.width) {
            return;
        }

        const ratio = this.clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const nextTime = duration * ratio;

        this.progress.value = String(nextTime);
        this.audio.currentTime = nextTime;
        this.currentTime.textContent = this.formatTime(nextTime);
        this.focusCurrentTime.textContent = this.formatTime(nextTime);
        this.syncProgressUi(nextTime, duration);

        if (commit) {
            this.isSeeking = false;
            this.seekPointerId = null;
        }
    }

    syncProgressUi(currentTime, duration) {
        if (duration > 0) {
            const safeCurrentTime = this.clamp(currentTime, 0, duration);
            const progressPercent = Math.min(100, Math.max(0, (safeCurrentTime / duration) * 100));
            this.progress.max = String(duration);
            this.progress.step = String(Math.max(duration / 2000, 0.01));
            this.progress.value = String(safeCurrentTime);
            this.focusProgressFill.style.width = `${progressPercent}%`;
        } else {
            this.progress.max = "0";
            this.progress.step = "0.01";
            this.progress.value = "0";
            this.focusProgressFill.style.width = "0%";
        }
    }

    refreshDurationState() {
        const duration = this.getResolvedDuration();
        this.state.duration = duration;
        this.duration.textContent = this.formatTime(duration);
        this.focusDuration.textContent = this.formatTime(duration);
        this.syncProgressUi(this.audio.currentTime || 0, duration);
    }

    getResolvedDuration() {
        const mediaDuration = this.audio.duration;
        if (Number.isFinite(mediaDuration) && mediaDuration > 0) {
            return mediaDuration;
        }

        const seekable = this.audio.seekable;
        if (seekable && seekable.length > 0) {
            const seekableDuration = seekable.end(seekable.length - 1);
            if (Number.isFinite(seekableDuration) && seekableDuration > 0) {
                return seekableDuration;
            }
        }

        const buffered = this.audio.buffered;
        if (buffered && buffered.length > 0) {
            const bufferedDuration = buffered.end(buffered.length - 1);
            if (Number.isFinite(bufferedDuration) && bufferedDuration > 0) {
                return bufferedDuration;
            }
        }

        return Number.isFinite(this.state.duration) ? this.state.duration : 0;
    }

    handleEnded() {
        this.stepTrack(1);
    }

    async handlePlay() {
        this.state.isPlaying = true;
        this.root.classList.add("is-playing");
        this.playButton.textContent = "Pause";
        this.focusPlayButton.textContent = "Pause";
        this.updateStateLabel("playing");
        this.setStatus(`Playing ${this.state.playlist[this.state.currentIndex].title}.`);
        await this.ensureAudioAnalysis();
        this.startAnalysis();
    }

    handlePause() {
        this.state.isPlaying = false;
        this.root.classList.remove("is-playing");
        this.playButton.textContent = "Play";
        this.focusPlayButton.textContent = "Play";
        this.updateStateLabel("paused");
        this.stopAnalysis();
        this.pushAudioReactive(this.createNeutralReactivePayload());
    }

    applyVolume(volume, persist) {
        const clamped = Math.min(Math.max(volume, 0), 100);
        this.volume.value = String(clamped);
        this.audio.volume = clamped / 100;

        if (persist) {
            localStorage.setItem("profile.music.volume", String(clamped));
        }
    }

    readStoredVolume() {
        const stored = Number(localStorage.getItem("profile.music.volume"));
        return Number.isFinite(stored) ? stored : this.config.music.defaultVolume;
    }

    async ensureAudioAnalysis() {
        if (this.analyser) {
            if (this.audioContext?.state === "suspended") {
                await this.audioContext.resume();
            }
            return;
        }

        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextCtor) {
            return;
        }

        this.audioContext = new AudioContextCtor();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = this.config.music.fftSmoothing;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }
    }

    startAnalysis() {
        if (!this.analyser || this.analysisFrame) {
            return;
        }

        const update = () => {
            if (!this.state.isPlaying || !this.analyser) {
                this.analysisFrame = null;
                return;
            }

            this.analyser.getByteFrequencyData(this.dataArray);
            const payload = this.buildReactivePayload();
            this.pushAudioReactive(payload);

            this.analysisFrame = window.requestAnimationFrame(update);
        };

        this.analysisFrame = window.requestAnimationFrame(update);
    }

    stopAnalysis() {
        if (!this.analysisFrame) {
            return;
        }

        window.cancelAnimationFrame(this.analysisFrame);
        this.analysisFrame = null;
    }

    pushAudioLevel(level) {
        if (typeof this.onAudioLevel === "function") {
            this.onAudioLevel(level);
        }
    }

    pushAudioReactive(payload) {
        const nextPayload = {
            ...this.createNeutralReactivePayload(),
            ...payload
        };
        this.reactiveState = nextPayload;
        this.pushAudioLevel(nextPayload.overall);

        if (typeof this.onAudioReactive === "function") {
            this.onAudioReactive(nextPayload);
        }
    }

    createNeutralReactivePayload() {
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

    buildReactivePayload() {
        const config = this.config.audioReactive || {};
        const totalBins = Math.min(48, this.dataArray.length);
        const analysisBins = Math.min(this.config.music.analysisBins || totalBins, totalBins);
        const bassEnd = Math.max(2, Math.floor(totalBins * 0.18));
        const midEnd = Math.max(bassEnd + 1, Math.floor(totalBins * 0.52));

        const overall = this.sampleAverage(0, analysisBins);
        const bass = this.sampleAverage(0, bassEnd);
        const mid = this.sampleAverage(bassEnd, midEnd);
        const high = this.sampleAverage(midEnd, totalBins);

        const weighted = this.clamp(
            overall * (config.overallWeight ?? 0.42)
            + bass * (config.bassWeight ?? 0.34)
            + mid * (config.midWeight ?? 0.16)
            + high * (config.highWeight ?? 0.08),
            0,
            1
        );
        const pulseTarget = this.clamp(bass * 0.68 + overall * 0.32, 0, 1);
        const pulseDecay = this.clamp(config.pulseDecay ?? 0.88, 0.55, 0.98);
        const pulse = Math.max(pulseTarget, this.reactiveState.pulse * pulseDecay);
        const attackDelta = this.clamp(
            ((bass - this.reactiveState.bass) * (config.attackBassWeight ?? 0.62))
            + ((overall - this.reactiveState.overall) * (config.attackOverallWeight ?? 0.38)),
            0,
            1
        );
        const transientTarget = this.clamp((attackDelta * 1.35) + (pulseTarget * 0.12), 0, 1);
        const transientDecay = this.clamp(config.transientDecay ?? 0.68, 0.35, 0.95);
        const transient = Math.max(transientTarget, this.reactiveState.transient * transientDecay);

        return {
            overall: weighted,
            bass,
            mid,
            high,
            pulse,
            transient,
            isPlaying: true
        };
    }

    sampleAverage(start, end) {
        const safeStart = Math.max(0, Math.floor(start));
        const safeEnd = Math.max(safeStart, Math.floor(end));
        const count = Math.max(0, safeEnd - safeStart);
        if (!count) {
            return 0;
        }

        let sum = 0;
        for (let index = safeStart; index < safeEnd; index += 1) {
            sum += this.dataArray[index];
        }

        return sum / count / 255;
    }

    setAudioReactiveState(payload = {}) {
        const overall = this.clamp(Number(payload.overall) || 0, 0, 1);
        const bass = this.clamp(Number(payload.bass) || 0, 0, 1);
        const pulse = this.clamp(Number(payload.pulse) || 0, 0, 1);
        const intensity = this.clamp(Number(payload.intensity) || 0, 0, 1);
        const shellLevel = this.clamp((overall * 0.58 + bass * 0.42) * intensity, 0, 1);
        const focusLevel = this.clamp((overall * 0.46 + pulse * 0.54) * intensity, 0, 1);

        this.root.style.setProperty("--music-reactive-level", shellLevel.toFixed(3));
        this.root.style.setProperty("--music-reactive-pulse", (pulse * intensity).toFixed(3));
        this.focusRoot?.style.setProperty("--focus-player-reactive-level", focusLevel.toFixed(3));
        this.focusRoot?.style.setProperty("--focus-player-reactive-pulse", (pulse * intensity).toFixed(3));
    }

    updateStateLabel(state) {
        this.stateLabel.textContent = state;
        this.focusState.textContent = state;
    }

    setStatus(message) {
        if (typeof this.onStatusChange === "function") {
            this.onStatusChange(message);
        }
    }

    formatTime(value) {
        if (!Number.isFinite(value) || value < 0) {
            return "0:00";
        }

        const minutes = Math.floor(value / 60);
        const seconds = Math.floor(value % 60);
        return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }

    applyArtwork(image, fallback, track) {
        image.hidden = false;
        image.src = track.artwork || this.config.profile.avatar;
        image.alt = `${track.title} artwork`;
        fallback.textContent = track.title.slice(0, 2).toUpperCase();

        image.addEventListener("error", () => {
            image.hidden = true;
        }, { once: true });
        image.addEventListener("load", () => {
            image.hidden = false;
        }, { once: true });
    }

    getCurrentTrack() {
        return this.state.playlist[this.state.currentIndex] || null;
    }

    getPlaylist() {
        return this.state.playlist.map((track) => ({ ...track }));
    }

    getDefaultTrackIndex() {
        const index = this.state.playlist.findIndex((track) => !track.isPersistedCustom);
        return index >= 0 ? index : Math.max(0, this.state.currentIndex);
    }

    loadTrackById(trackId, autoplay = true) {
        const targetIndex = this.state.playlist.findIndex((track) => track.id === trackId);
        if (targetIndex < 0) {
            return;
        }

        this.loadTrack(targetIndex, autoplay);
    }

    loadDefaultTrack(autoplay = false) {
        this.loadTrack(this.getDefaultTrackIndex(), autoplay);
    }

    setLibraryTracks(tracks = [], options = {}) {
        const previousTrackId = options.preferredTrackId || this.getCurrentTrack()?.id || null;
        const autoplay = Boolean(options.autoplay);

        this.releaseLibraryResources();
        this.libraryTracks = tracks.map((track) => ({
            ...track,
            isCustom: true,
            isPersistedCustom: true
        }));
        this.libraryTrackResources = this.libraryTracks
            .filter((track) => track.managedFileUrl && typeof track.file === "string" && track.file.startsWith("blob:"))
            .map((track) => track.file);

        this.state.playlist = [
            ...this.libraryTracks,
            ...this.basePlaylist.map((track) => ({ ...track }))
        ];
        this.renderQueue();

        const targetIndex = this.state.playlist.findIndex((track) => track.id === previousTrackId);
        if (targetIndex >= 0) {
            this.loadTrack(targetIndex, autoplay);
            return;
        }

        this.loadTrack(this.getDefaultTrackIndex(), false);
    }

    setCustomTrack(track, autoplay = true) {
        const nextTrack = {
            ...track,
            artwork: track.artwork || this.config.profile.avatar,
            isCustom: true
        };

        this.state.playlist = [
            nextTrack,
            ...this.state.playlist.filter((item) => !item.isCustom)
        ];

        this.state.currentIndex = 0;
        this.renderQueue();
        this.loadTrack(0, autoplay);
    }

    clearCustomTrack() {
        this.releaseCustomResources();
        this.loadDefaultTrack(false);
        this.setStatus("Default playlist restored.");
    }

    storeCustomResources(resource) {
        this.releaseCustomResources();
        this.customTrackResource = resource;
    }

    releaseCustomResources() {
        if (!this.customTrackResource) {
            return;
        }

        if (this.customTrackResource.audioUrl) {
            URL.revokeObjectURL(this.customTrackResource.audioUrl);
        }

        this.customTrackResource = null;
    }

    releaseLibraryResources() {
        if (!Array.isArray(this.libraryTrackResources) || this.libraryTrackResources.length === 0) {
            this.libraryTrackResources = [];
            return;
        }

        this.libraryTrackResources.forEach((resourceUrl) => {
            if (typeof resourceUrl === "string" && resourceUrl.startsWith("blob:")) {
                URL.revokeObjectURL(resourceUrl);
            }
        });

        this.libraryTrackResources = [];
    }
}

export default MusicPlayer;
