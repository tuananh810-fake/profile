class LyricsEngine {
    constructor({ root, audio, config, onStatusChange }) {
        this.root = root;
        this.audio = audio;
        this.config = config;
        this.onStatusChange = onStatusChange;
        this.appShell = this.root.closest(".app-shell");

        this.shell = this.root.querySelector(".lyrics-shell");
        this.dragHandle = document.getElementById("lyricsDragHandle");
        this.stateLabel = document.getElementById("lyricsState");
        this.body = document.getElementById("lyricsBody");
        this.previousLine = document.getElementById("lyricsPrevious");
        this.currentLine = document.getElementById("lyricsCurrent");
        this.nextLine = document.getElementById("lyricsNext");
        this.meta = document.getElementById("lyricsMeta");
        this.tuneButton = document.getElementById("lyricsTuneBtn");
        this.settingsPanel = document.getElementById("lyricsSettings");
        this.scaleRange = document.getElementById("lyricsScaleRange");
        this.scaleValue = document.getElementById("lyricsScaleValue");
        this.widthRange = document.getElementById("lyricsWidthRange");
        this.widthValue = document.getElementById("lyricsWidthValue");
        this.heightRange = document.getElementById("lyricsHeightRange");
        this.heightValue = document.getElementById("lyricsHeightValue");
        this.boxHazeRange = document.getElementById("lyricsBoxHazeRange");
        this.boxHazeValue = document.getElementById("lyricsBoxHazeValue");
        this.fontSelect = document.getElementById("lyricsFontSelect");
        this.alignSelect = document.getElementById("lyricsAlignSelect");
        this.kineticWordsRange = document.getElementById("lyricsKineticWordsRange");
        this.kineticWordsValue = document.getElementById("lyricsKineticWordsValue");
        this.kineticCharsRange = document.getElementById("lyricsKineticCharsRange");
        this.kineticCharsValue = document.getElementById("lyricsKineticCharsValue");
        this.boxButton = document.getElementById("lyricsBoxBtn");
        this.pureButton = document.getElementById("lyricsPureBtn");
        this.kineticButton = document.getElementById("lyricsKineticBtn");
        this.zoomOutButton = document.getElementById("lyricsZoomOutBtn");
        this.zoomInButton = document.getElementById("lyricsZoomInBtn");
        this.resetButton = document.getElementById("lyricsResetBtn");
        this.hideButton = document.getElementById("lyricsHideBtn");
        this.focusButton = document.getElementById("lyricsFocusBtn");
        this.revealButton = document.getElementById("lyricsRevealBtn");
        this.pureRevealButton = document.getElementById("lyricsPureRevealBtn");
        this.textAlignButtons = Array.from(document.querySelectorAll("[data-lyrics-text-align]"));
        this.resizeHandles = Array.from(this.root.querySelectorAll(".lyrics-resize-handle"));

        this.lines = [];
        this.track = null;
        this.animationFrame = null;
        this.isLoaded = false;
        this.storageKey = "profile.lyrics.display";
        this.focusStorageKey = "profile.lyrics.focus";
        this.hiddenStorageKey = "profile.lyrics.hidden";
        this.displayConfig = this.config.lyrics.display || {};
        this.fontPresets = this.displayConfig.fontPresets || [];
        this.chromeModes = ["boxed", "free"];
        this.textAlignPresets = ["left", "center", "right"];
        this.displayState = this.getDefaultDisplayState();
        this.focusMode = false;
        this.isHidden = false;
        this.settingsOpen = false;
        this.dragState = null;
        this.resizeState = null;
        this.overflowRaf = null;
        this.pureLayoutSnapshot = null;
        this.kineticTimeline = null;
        this.kineticPrerollTimeline = null;
        this.kineticPhase = "idle";
        this.audioReactiveState = this.createNeutralAudioReactiveState();
        this.lastRenderedSignature = "";

        this.handlePlay = this.handlePlay.bind(this);
        this.handlePause = this.handlePause.bind(this);
        this.handleSeeking = this.handleSeeking.bind(this);
        this.handleEnded = this.handleEnded.bind(this);
        this.updateFromAudio = this.updateFromAudio.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragMove = this.handleDragMove.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.handleResizeStart = this.handleResizeStart.bind(this);
        this.handleResizeMove = this.handleResizeMove.bind(this);
        this.handleResizeEnd = this.handleResizeEnd.bind(this);
    }

    init() {
        this.renderFontOptions();
        this.restoreDisplayState();
        this.attachDisplayControls();
        this.syncControlBounds();
        this.applyDisplayState();
        this.toggleSettings(false);
        this.applyFocusMode(this.focusMode, false);
        this.isHidden = false;
        this.applyOverlayVisibility(false, false);
        this.keepOverlayInViewport();
        this.applyDisplayState();

        this.audio.addEventListener("play", this.handlePlay);
        this.audio.addEventListener("pause", this.handlePause);
        this.audio.addEventListener("seeking", this.handleSeeking);
        this.audio.addEventListener("seeked", this.handleSeeking);
        this.audio.addEventListener("timeupdate", this.handleSeeking);
        this.audio.addEventListener("ended", this.handleEnded);
        window.addEventListener("resize", this.handleResize);
        window.addEventListener("keydown", this.handleKeyDown);

        this.renderPlaceholder(
            this.config.lyrics.emptyTitle,
            this.config.lyrics.emptyMessage,
            this.config.lyrics.emptyMeta
        );
    }

    createNeutralAudioReactiveState() {
        return {
            overall: 0,
            bass: 0,
            mid: 0,
            high: 0,
            pulse: 0,
            intensity: 1,
            isPlaying: false
        };
    }

    async loadTrack(track) {
        this.track = track;
        this.stopLoop();
        this.lines = [];
        this.isLoaded = false;

        if (!track?.lyrics && !track?.lyricsData) {
            this.renderPlaceholder(
                this.config.lyrics.emptyTitle,
                this.config.lyrics.emptyMessage,
                this.config.lyrics.emptyMeta
            );
            return;
        }

        this.updateState("loading");
        this.clearKineticLine();
        this.currentLine.textContent = "Loading lyrics...";
        this.currentLine.dataset.renderedText = "Loading lyrics...";
        this.previousLine.textContent = "";
        this.nextLine.textContent = "";
        if (this.meta) {
            this.meta.textContent = track.title;
        }
        this.shell.classList.add("is-placeholder");

        try {
            let text = track.lyricsData;
            if (typeof text !== "string") {
                const response = await fetch(track.lyrics);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                text = await response.text();
            }

            const parsed = this.parseLrc(text);
            if (parsed.lines.length === 0) {
                this.renderPlaceholder(
                    "Lyrics file loaded, but no timed lines were found.",
                    "Use [mm:ss.xx] lyric format in your .lrc file.",
                    track.lyrics
                );
                return;
            }

            this.lines = parsed.lines;
            this.isLoaded = true;
            this.shell.classList.remove("is-placeholder");
            if (this.meta) {
                this.meta.textContent = parsed.meta.title || parsed.meta.artist || track.title;
            }
            this.updateState(this.audio.paused ? "ready" : "syncing");
            this.renderAtTime(this.audio.currentTime * 1000, true);
            this.setStatus(`Lyrics loaded for ${track.title}.`);

            if (!this.audio.paused) {
                this.startLoop();
            }
        } catch (error) {
            this.renderPlaceholder(
                "Could not load the linked lyrics file.",
                "Check the .lrc path in config.js and make sure the file is served next to the page.",
                track.lyrics
            );
            this.setStatus("Lyrics file could not be loaded. Check music.playlist[].lyrics in config.js.");
        }
    }

    parseLrc(text) {
        const metadata = {};
        const lines = [];
        let offset = this.config.lyrics.offsetMs || 0;

        text.split(/\r?\n/).forEach((rawLine) => {
            const line = rawLine.trim();
            if (!line) {
                return;
            }

            const metaMatch = line.match(/^\[(ti|ar|al|by|offset):([^\]]*)\]$/i);
            if (metaMatch) {
                const key = metaMatch[1].toLowerCase();
                const value = metaMatch[2].trim();

                if (key === "offset") {
                    offset = Number(value) || offset;
                } else if (key === "ti") {
                    metadata.title = value;
                } else if (key === "ar") {
                    metadata.artist = value;
                } else if (key === "al") {
                    metadata.album = value;
                } else if (key === "by") {
                    metadata.by = value;
                }
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
                    timeMs: minutes * 60000 + seconds * 1000 + fractional + offset,
                    text: lyricText || "..."
                });
            });
        });

        lines.sort((a, b) => a.timeMs - b.timeMs);
        return { meta: metadata, lines };
    }

    handlePlay() {
        if (!this.isLoaded) {
            this.updateState("waiting");
            return;
        }

        this.updateState("syncing");
        this.startLoop();
    }

    handlePause() {
        if (this.isLoaded) {
            this.updateState("paused");
        }
        this.stopLoop();
    }

    handleSeeking() {
        this.renderAtTime(this.audio.currentTime * 1000);
    }

    handleEnded() {
        this.stopLoop();
        this.handleSeeking();
        if (this.isLoaded) {
            this.updateState("ended");
        }
    }

    startLoop() {
        if (this.animationFrame) {
            return;
        }

        this.animationFrame = window.requestAnimationFrame(this.updateFromAudio);
    }

    stopLoop() {
        if (!this.animationFrame) {
            return;
        }

        window.cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
    }

    updateFromAudio() {
        if (this.audio.paused) {
            this.animationFrame = null;
            return;
        }

        this.renderAtTime(this.audio.currentTime * 1000);
        this.animationFrame = window.requestAnimationFrame(this.updateFromAudio);
    }

    renderAtTime(timeMs, force = false) {
        if (!this.isLoaded || this.lines.length === 0) {
            return;
        }

        let currentIndex = -1;
        for (let i = 0; i < this.lines.length; i += 1) {
            if (this.lines[i].timeMs <= timeMs) {
                currentIndex = i;
            } else {
                break;
            }
        }

        const firstLine = this.lines[0] || null;
        const current = currentIndex >= 0 ? this.lines[currentIndex] : null;
        const previous = currentIndex > 0 ? this.lines[currentIndex - 1] : null;
        const next = currentIndex >= 0
            ? (currentIndex + 1 < this.lines.length ? this.lines[currentIndex + 1] : null)
            : this.lines[1] || null;
        const beforeFirstLine = !current && Boolean(firstLine) && timeMs < firstLine.timeMs;
        const activeLine = current || this.lines[0] || null;
        const followingLine = current ? next : (this.lines[1] || null);
        const nextPreviousText = previous?.text || "";
        const nextCurrentText = current?.text || this.lines[0]?.text || "";
        const nextUpcomingText = next?.text || "";
        const nextMetaText = current ? `${this.formatMs(current.timeMs)} synced` : "";
        const renderSignature = this.displayState.kineticMode
            ? (
                beforeFirstLine && !this.audio.paused
                    ? `kinetic:preroll:${firstLine?.timeMs ?? -1}:${this.displayState.kineticMaxWordsPerLine}:${this.displayState.kineticMaxCharsPerLine}`
                    : `kinetic:line:${activeLine?.timeMs ?? -1}:${this.displayState.kineticMaxWordsPerLine}:${this.displayState.kineticMaxCharsPerLine}`
            )
            : `classic:${previous?.timeMs ?? -1}:${activeLine?.timeMs ?? -1}:${next?.timeMs ?? -1}`;
        const didChange = force
            || renderSignature !== this.lastRenderedSignature
            || this.shell.classList.contains("is-placeholder");

        if (didChange) {
            this.shell.classList.remove("is-placeholder");
            if (this.displayState.kineticMode) {
                this.previousLine.textContent = "";
                this.nextLine.textContent = "";
                if (beforeFirstLine && !this.audio.paused) {
                    this.renderKineticPreroll();
                    if (this.meta) {
                        this.meta.textContent = "";
                    }
                } else {
                    this.renderKineticCurrentLine(
                        nextCurrentText,
                        this.resolveKineticLineDuration(activeLine, followingLine, previous)
                    );
                    if (this.meta) {
                        this.meta.textContent = nextMetaText;
                    }
                }
            } else {
                this.clearKineticLine();
                this.previousLine.textContent = nextPreviousText;
                this.currentLine.textContent = nextCurrentText;
                this.currentLine.dataset.renderedText = nextCurrentText;
                this.nextLine.textContent = nextUpcomingText;
                if (this.meta) {
                    this.meta.textContent = nextMetaText;
                }
            }
            this.lastRenderedSignature = renderSignature;
            this.scheduleOverflowLayout();
        }
    }

    renderPlaceholder(title, body, meta) {
        this.isLoaded = false;
        this.shell.classList.add("is-placeholder");
        this.clearKineticLine();
        this.previousLine.textContent = "";
        this.currentLine.textContent = title;
        this.currentLine.dataset.renderedText = title;
        this.nextLine.textContent = body;
        if (this.meta) {
            this.meta.textContent = meta;
        }
        this.lastRenderedSignature = `placeholder:${title}:${body}:${meta}`;
        this.updateState("waiting");
        this.scheduleOverflowLayout();
    }

    updateState(label) {
        if (this.stateLabel) {
            this.stateLabel.textContent = label;
        }
    }

    setStatus(message) {
        if (typeof this.onStatusChange === "function") {
            this.onStatusChange(message);
        }
    }

    formatMs(value) {
        const totalSeconds = Math.max(0, Math.floor(value / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }

    prepareKineticLine(text) {
        const words = String(text || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        const safeWords = words.length > 0 ? words : ["..."];
        const maxWordsPerLine = this.clampKineticMaxWordsPerLine(this.displayState.kineticMaxWordsPerLine);
        const maxCharsPerLine = this.clampKineticMaxCharsPerLine(this.displayState.kineticMaxCharsPerLine);
        const rowGroups = this.chunkKineticWords(safeWords, maxWordsPerLine, maxCharsPerLine);
        return {
            frames: this.chunkKineticFrames(rowGroups, this.resolveKineticRowsPerFrame()),
            count: safeWords.length
        };
    }

    renderKineticCurrentLine(text, lineDurationMs = 2200) {
        const { frames } = this.prepareKineticLine(text);
        this.clearKineticLine();
        this.kineticPhase = "line-build";
        this.currentLine.classList.add("is-kinetic-line");

        const stage = document.createElement("div");
        stage.className = "kinetic-stage";
        const content = document.createElement("div");
        content.className = "kinetic-content";
        const stack = document.createElement("div");
        stack.className = "kinetic-stack";
        content.appendChild(stack);
        stage.appendChild(content);
        this.currentLine.replaceChildren(stage);
        this.currentLine.dataset.renderedText = text;
        this.currentLine.setAttribute("aria-label", text);
        this.runKineticAnimation(stack, frames, lineDurationMs);
    }

    runKineticAnimation(stackNode, frames = [], lineDurationMs = 2200) {
        const gsap = window.gsap;
        if (!Array.isArray(frames) || frames.length === 0 || !stackNode) {
            return;
        }

        const pulse = this.clampAudioValue(this.audioReactiveState.pulse);
        const intensity = this.clampAudioValue(this.audioReactiveState.intensity || 1);
        const energy = this.clampAudioValue((pulse * 0.68 + this.audioReactiveState.overall * 0.32) * intensity);
        const durationSeconds = this.clampKineticDurationMs(lineDurationMs) / 1000;
        const usableSeconds = Math.max(0.16, durationSeconds * 0.5);
        const totalWordCount = Math.max(
            1,
            frames.reduce((sum, frameRowGroups) => (
                sum + frameRowGroups.reduce((rowSum, group) => rowSum + group.length, 0)
            ), 0)
        );
        const rawStagger = usableSeconds / totalWordCount;
        const baseStagger = Math.min(0.85, Math.max(0.04, rawStagger));
        const entryDuration = Math.min(Math.max(baseStagger * 0.9, 0.12), 0.58);
        const slideDuration = Math.min(Math.max(baseStagger * 0.75, 0.18), 0.4);

        if (gsap) {
            gsap.killTweensOf(".kinetic-word");
        }

        if (!gsap) {
            return;
        }

        if (this.kineticTimeline) {
            this.kineticTimeline.kill();
        }

        const timeline = gsap.timeline({
            defaults: {
                overwrite: "auto"
            }
        });

        let frameCursor = 0;

        frames.forEach((frameRowGroups, frameIndex) => {
            const frameRows = this.createKineticRows(frameRowGroups);
            const flatEntries = frameRows.flatMap((rowEntry) => rowEntry.entries || []);
            const frameWordCount = Math.max(1, flatEntries.length);
            const frameStartAt = frameCursor;

            timeline.call(() => {
                this.mountKineticFrame(stackNode, frameRows);
            }, null, frameStartAt);

            flatEntries.forEach((entry, index) => {
                const startAt = frameStartAt + index * baseStagger;
                timeline.call(() => {
                    this.appendKineticWord(entry.node, entry.row, {
                        entryDuration,
                        slideDuration,
                        energy,
                        pulse
                    });
                }, null, startAt);
            });

            frameCursor += frameWordCount * baseStagger;
        });

        timeline.call(() => {
            this.kineticPhase = "line-hold";
        }, null, durationSeconds);
        this.kineticTimeline = timeline;
    }

    createKineticRows(rowGroups = []) {
        return rowGroups.map((group, rowIndex) => {
            const row = document.createElement("div");
            row.className = "kinetic-row";
            row.dataset.rowIndex = String(rowIndex);

            const entries = group.map((word, indexWithinRow) => {
                const span = document.createElement("span");
                span.className = "kinetic-word";
                span.textContent = word;
                span.style.setProperty("--kinetic-word-index", String(indexWithinRow));
                span.style.transformOrigin = "50% 50% -50px";
                return {
                    node: span,
                    row
                };
            });

            return {
                row,
                entries
            };
        });
    }

    mountKineticFrame(stackNode, rowEntries = []) {
        if (window.gsap) {
            window.gsap.killTweensOf(".kinetic-word");
        }

        stackNode.replaceChildren(...rowEntries.map((entry) => entry.row));
        this.scheduleOverflowLayout();
    }

    appendKineticWord(wordNode, rowNode, options = {}) {
        const gsap = window.gsap;
        if (!wordNode || !rowNode || !gsap) {
            return;
        }

        const {
            entryDuration = 0.5,
            slideDuration = 0.24
        } = options;
        const existingWords = Array.from(rowNode.querySelectorAll(".kinetic-word"));
        const beforeRects = new Map(
            existingWords.map((node) => [node, node.getBoundingClientRect()])
        );

        wordNode.style.opacity = "0";
        wordNode.style.filter = "blur(12px)";
        wordNode.style.transformOrigin = "50% 50% -50px";
        rowNode.appendChild(wordNode);
        this.scheduleOverflowLayout();

        const afterRects = new Map(
            existingWords.map((node) => [node, node.getBoundingClientRect()])
        );

        existingWords.forEach((node) => {
            const before = beforeRects.get(node);
            const after = afterRects.get(node);
            if (!before || !after) {
                return;
            }

            const deltaX = before.left - after.left;
            const deltaY = before.top - after.top;
            if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) {
                return;
            }

            gsap.fromTo(node, {
                x: deltaX,
                y: deltaY,
                z: 0,
                force3D: true
            }, {
                x: 0,
                y: 0,
                z: 0,
                duration: slideDuration,
                ease: "expo.out",
                force3D: true,
                overwrite: "auto"
            });
        });

        const stageRect = this.currentLine.getBoundingClientRect();
        const finalRect = wordNode.getBoundingClientRect();
        const originX = (stageRect.left + stageRect.width / 2) - (finalRect.left + finalRect.width / 2);
        const originY = (stageRect.top + stageRect.height / 2) - (finalRect.top + finalRect.height / 2);

        gsap.fromTo(wordNode, {
            opacity: 0,
            x: originX,
            y: originY + 20,
            z: -300,
            scale: 0.22,
            rotationY: 64,
            rotationX: -22,
            filter: "blur(10px) brightness(1.18)"
        }, {
            opacity: 1,
            x: 0,
            scale: 1,
            y: 0,
            z: 0,
            rotationY: 0,
            rotationX: 0,
            filter: "blur(0px)",
            duration: entryDuration,
            ease: "expo.out",
            force3D: true,
            overwrite: "auto",
            clearProps: "opacity,filter,transform"
        });
    }

    renderKineticPreroll() {
        const gsap = window.gsap;
        this.clearKineticLine();
        this.kineticPhase = "preroll";
        this.currentLine.classList.add("is-kinetic-line");

        const preroll = document.createElement("div");
        preroll.className = "kinetic-preroll";
        const dots = Array.from({ length: 3 }, (_, index) => {
            const dot = document.createElement("span");
            dot.className = "kinetic-dot";
            dot.style.setProperty("--kinetic-dot-index", String(index));
            return dot;
        });

        preroll.replaceChildren(...dots);
        const stage = document.createElement("div");
        stage.className = "kinetic-stage";
        const content = document.createElement("div");
        content.className = "kinetic-content";
        content.appendChild(preroll);
        stage.appendChild(content);
        this.currentLine.replaceChildren(stage);
        this.currentLine.dataset.renderedText = "";
        this.currentLine.setAttribute("aria-label", "Waiting for the next lyric line");

        if (!gsap) {
            return;
        }

        this.kineticPrerollTimeline = gsap.timeline({
            repeat: -1
        });

        this.kineticPrerollTimeline.to(dots, {
            y: -7,
            opacity: 1,
            duration: 0.34,
            ease: "sine.out",
            stagger: 0.12
        }).to(dots, {
            y: 0,
            opacity: 0.36,
            duration: 0.42,
            ease: "sine.in",
            stagger: 0.12
        }, 0.18);
    }

    resolveKineticLineDuration(currentLine, nextLine, previousLine) {
        const forwardGap = Number(nextLine?.timeMs) - Number(currentLine?.timeMs);
        if (Number.isFinite(forwardGap) && forwardGap > 0) {
            return this.clampKineticDurationMs(forwardGap);
        }

        const backwardGap = Number(currentLine?.timeMs) - Number(previousLine?.timeMs);
        if (Number.isFinite(backwardGap) && backwardGap > 0) {
            return this.clampKineticDurationMs(backwardGap);
        }

        return this.clampKineticDurationMs(2200);
    }

    clampKineticDurationMs(value) {
        return Math.min(Math.max(Number(value) || 2200, 520), 3000);
    }

    clampKineticMaxWordsPerLine(value) {
        const min = this.displayConfig.minKineticMaxWordsPerLine ?? 3;
        const max = this.displayConfig.maxKineticMaxWordsPerLine ?? 8;
        return Math.min(Math.max(Math.round(Number(value) || this.displayConfig.defaultKineticMaxWordsPerLine || 5), min), max);
    }

    clampKineticMaxCharsPerLine(value) {
        const min = this.displayConfig.minKineticMaxCharsPerLine ?? 10;
        const max = this.displayConfig.maxKineticMaxCharsPerLine ?? 36;
        return Math.min(Math.max(Math.round(Number(value) || this.displayConfig.defaultKineticMaxCharsPerLine || 20), min), max);
    }

    resolveKineticRowsPerFrame() {
        const effectiveHeight = Math.max(120, this.displayState.height - 88);
        const scalePenalty = Math.max(1, this.displayState.textScale);
        const estimatedRows = Math.floor(effectiveHeight / (118 * scalePenalty));
        return Math.min(Math.max(estimatedRows, 1), 2);
    }

    chunkKineticWords(words, maxWordsPerLine, maxCharsPerLine) {
        const chunks = [];
        let currentChunk = [];
        let currentChars = 0;

        words.forEach((word) => {
            const wordChars = [...word].length;
            const nextChars = currentChunk.length === 0
                ? wordChars
                : currentChars + 1 + wordChars;
            const exceedsWords = currentChunk.length >= maxWordsPerLine;
            const exceedsChars = currentChunk.length > 0 && nextChars > maxCharsPerLine;

            if (exceedsWords || exceedsChars) {
                chunks.push(currentChunk);
                currentChunk = [word];
                currentChars = wordChars;
                return;
            }

            currentChunk.push(word);
            currentChars = nextChars;
        });

        if (currentChunk.length > 0) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    chunkKineticFrames(rowGroups, maxRowsPerFrame = 2) {
        const safeMaxRows = Math.max(1, Math.floor(maxRowsPerFrame || 1));
        const frames = [];

        for (let index = 0; index < rowGroups.length; index += safeMaxRows) {
            frames.push(rowGroups.slice(index, index + safeMaxRows));
        }

        return frames.length > 0 ? frames : [[["..."]]];
    }

    clearKineticLine() {
        if (window.gsap) {
            window.gsap.killTweensOf(".kinetic-word");
            window.gsap.killTweensOf(".kinetic-dot");
        }

        if (this.kineticTimeline) {
            this.kineticTimeline.kill();
            this.kineticTimeline = null;
        }

        if (this.kineticPrerollTimeline) {
            this.kineticPrerollTimeline.kill();
            this.kineticPrerollTimeline = null;
        }

        this.kineticPhase = "idle";
        this.currentLine.classList.remove("is-kinetic-line");
        this.currentLine.replaceChildren();
        this.currentLine.removeAttribute("aria-label");
        delete this.currentLine.dataset.renderedText;
    }

    renderFontOptions() {
        if (!this.fontSelect || this.fontPresets.length === 0) {
            return;
        }

        this.fontSelect.replaceChildren(
            ...this.fontPresets.map((preset) => {
                const option = document.createElement("option");
                option.value = preset.id;
                option.textContent = preset.label;
                return option;
            })
        );
    }

    getDefaultDisplayState() {
        return {
            textScale: this.displayConfig.defaultTextScale ?? 1,
            x: this.displayConfig.defaultOffsetX ?? 0,
            y: this.displayConfig.defaultOffsetY ?? 0,
            width: this.displayConfig.defaultWidth ?? 740,
            height: this.displayConfig.defaultHeight ?? 260,
            boxHaze: this.clampBoxHaze(this.displayConfig.defaultBoxHaze ?? 58),
            fontPreset: this.displayConfig.defaultFontPreset || this.fontPresets[0]?.id || "neo",
            chromeMode: this.clampChromeMode(this.displayConfig.defaultChromeMode ?? "boxed"),
            textAlign: this.clampTextAlign(this.displayConfig.defaultTextAlign ?? "center"),
            pureMode: Boolean(this.displayConfig.defaultPureMode),
            kineticMode: Boolean(this.displayConfig.defaultKineticMode),
            kineticMaxWordsPerLine: this.clampKineticMaxWordsPerLine(this.displayConfig.defaultKineticMaxWordsPerLine ?? 5),
            kineticMaxCharsPerLine: this.clampKineticMaxCharsPerLine(this.displayConfig.defaultKineticMaxCharsPerLine ?? 20)
        };
    }

    attachDisplayControls() {
        this.tuneButton.addEventListener("click", () => {
            if (this.displayState.pureMode) {
                this.setPureMode(false, true, false);
            }
            this.toggleSettings();
        });
        this.boxButton?.addEventListener("click", () => this.toggleChromeMode());
        this.pureButton?.addEventListener("click", () => this.togglePureMode());
        this.kineticButton?.addEventListener("click", () => this.toggleKineticMode());
        this.zoomOutButton?.addEventListener("click", () => this.adjustTextScale(-1));
        this.zoomInButton?.addEventListener("click", () => this.adjustTextScale(1));
        this.resetButton.addEventListener("click", () => this.resetDisplay());
        this.hideButton?.addEventListener("click", () => this.applyOverlayVisibility(true));
        this.focusButton.addEventListener("click", () => this.toggleFocusMode());
        this.revealButton?.addEventListener("click", () => this.applyOverlayVisibility(false));
        this.pureRevealButton?.addEventListener("click", () => this.setPureMode(false, true, true));
        this.dragHandle.addEventListener("pointerdown", this.handleDragStart);

        this.scaleRange.addEventListener("input", (event) => {
            this.setTextScale(Number(event.target.value) / 100, false, false);
        });
        this.scaleRange.addEventListener("change", (event) => {
            this.setTextScale(Number(event.target.value) / 100, true, true);
        });
        this.widthRange.addEventListener("input", (event) => {
            this.setWidth(Number(event.target.value), false, false, false);
        });
        this.widthRange.addEventListener("change", (event) => {
            this.setWidth(Number(event.target.value), true, true, true);
        });
        this.heightRange.addEventListener("input", (event) => {
            this.setHeight(Number(event.target.value), false, false, false);
        });
        this.heightRange.addEventListener("change", (event) => {
            this.setHeight(Number(event.target.value), true, true, true);
        });
        this.boxHazeRange?.addEventListener("input", (event) => {
            this.setBoxHaze(Number(event.target.value), false, false);
        });
        this.boxHazeRange?.addEventListener("change", (event) => {
            this.setBoxHaze(Number(event.target.value), true, true);
        });
        this.fontSelect.addEventListener("change", (event) => {
            this.setFontPreset(event.target.value);
        });
        this.alignSelect?.addEventListener("change", (event) => {
            this.applyTextAlign(event.target.value, true, true);
        });
        this.kineticWordsRange?.addEventListener("input", (event) => {
            this.setKineticMaxWordsPerLine(Number(event.target.value), false, false);
        });
        this.kineticWordsRange?.addEventListener("change", (event) => {
            this.setKineticMaxWordsPerLine(Number(event.target.value), true, true);
        });
        this.kineticCharsRange?.addEventListener("input", (event) => {
            this.setKineticMaxCharsPerLine(Number(event.target.value), false, false);
        });
        this.kineticCharsRange?.addEventListener("change", (event) => {
            this.setKineticMaxCharsPerLine(Number(event.target.value), true, true);
        });
        this.resizeHandles.forEach((handle) => {
            handle.addEventListener("pointerdown", this.handleResizeStart);
        });
    }

    restoreDisplayState() {
        const defaults = this.getDefaultDisplayState();
        this.displayState = { ...defaults };

        try {
            const stored = JSON.parse(localStorage.getItem(this.storageKey) || "null");
            if (stored && typeof stored === "object") {
                this.displayState.textScale = this.clampTextScale(stored.textScale ?? stored.scale ?? defaults.textScale);
                this.displayState.x = Number.isFinite(stored.x) ? stored.x : defaults.x;
                this.displayState.y = Number.isFinite(stored.y) ? stored.y : defaults.y;
                this.displayState.width = this.clampWidth(stored.width ?? defaults.width);
                this.displayState.height = this.clampHeight(stored.height ?? defaults.height);
                this.displayState.boxHaze = this.clampBoxHaze(stored.boxHaze ?? defaults.boxHaze);
                this.displayState.fontPreset = this.getFontPreset(stored.fontPreset)?.id || defaults.fontPreset;
                this.displayState.chromeMode = this.clampChromeMode(stored.chromeMode ?? defaults.chromeMode);
                this.displayState.textAlign = this.clampTextAlign(
                    stored.textAlign
                    ?? stored.boxAlignPreset
                    ?? stored.boxAlign
                    ?? stored.alignPreset
                    ?? defaults.textAlign
                );
                this.displayState.pureMode = typeof stored.pureMode === "boolean"
                    ? stored.pureMode
                    : defaults.pureMode;
                this.displayState.kineticMode = typeof stored.kineticMode === "boolean"
                    ? stored.kineticMode
                    : defaults.kineticMode;
                this.displayState.kineticMaxWordsPerLine = this.clampKineticMaxWordsPerLine(
                    stored.kineticMaxWordsPerLine
                    ?? stored.kineticWordsPerLine
                    ?? defaults.kineticMaxWordsPerLine
                );
                this.displayState.kineticMaxCharsPerLine = this.clampKineticMaxCharsPerLine(
                    stored.kineticMaxCharsPerLine
                    ?? stored.kineticCharsPerLine
                    ?? defaults.kineticMaxCharsPerLine
                );
            }
        } catch (error) {
            // Ignore invalid localStorage payloads and fall back to defaults.
        }

        this.focusMode = localStorage.getItem(this.focusStorageKey) === "true";
        this.isHidden = localStorage.getItem(this.hiddenStorageKey) === "true";
    }

    adjustTextScale(direction) {
        const step = this.displayConfig.scaleStep ?? 0.04;
        this.setTextScale(this.displayState.textScale + step * direction, true, true);
    }

    setTextScale(value, persist = true, announce = true) {
        const nextScale = this.clampTextScale(value);
        if (nextScale === this.displayState.textScale) {
            return;
        }

        this.displayState.textScale = nextScale;
        this.applyDisplayState();
        this.keepOverlayInViewport();
        this.applyDisplayState();

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Lyrics size ${Math.round(nextScale * 100)}%.`);
        }
    }

    setWidth(value, persist = true, announce = true, constrain = true) {
        const nextWidth = this.clampWidth(value);
        if (nextWidth === this.displayState.width) {
            return;
        }

        this.displayState.width = nextWidth;
        this.applyDisplayState();

        if (constrain) {
            this.keepOverlayInViewport();
            this.applyDisplayState();
        }

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Lyrics width ${Math.round(nextWidth)}px.`);
        }
    }

    setHeight(value, persist = true, announce = true, constrain = true) {
        const nextHeight = this.clampHeight(value);
        if (nextHeight === this.displayState.height) {
            return;
        }

        const heightDelta = nextHeight - this.displayState.height;
        this.displayState.height = nextHeight;
        this.displayState.y += heightDelta / 2;
        this.applyDisplayState();

        if (constrain) {
            this.keepOverlayInViewport();
            this.applyDisplayState();
        }

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Lyrics height ${Math.round(nextHeight)}px.`);
        }
    }

    setBoxHaze(value, persist = true, announce = true) {
        const nextValue = this.clampBoxHaze(value);
        if (nextValue === this.displayState.boxHaze) {
            return;
        }

        this.displayState.boxHaze = nextValue;
        this.applyDisplayState();

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Lyrics box haze ${Math.round(nextValue)}%.`);
        }
    }

    setFontPreset(presetId, persist = true) {
        const preset = this.getFontPreset(presetId);
        if (!preset || preset.id === this.displayState.fontPreset) {
            return;
        }

        this.displayState.fontPreset = preset.id;
        this.applyDisplayState();

        if (persist) {
            this.persistDisplayState();
        }

        this.setStatus(`Lyrics font switched to ${preset.label}.`);
    }

    toggleChromeMode() {
        const nextMode = this.displayState.chromeMode === "boxed" ? "free" : "boxed";
        this.setChromeMode(nextMode, true, true);
    }

    setChromeMode(mode, persist = true, announce = true) {
        const nextMode = this.clampChromeMode(mode);
        if (nextMode === this.displayState.chromeMode) {
            return;
        }

        this.displayState.chromeMode = nextMode;
        this.applyDisplayState();
        this.keepOverlayInViewport();
        this.applyDisplayState();

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(
                nextMode === "boxed"
                    ? "Lyrics box enabled."
                    : "Lyrics box disabled. Overlay is now free-floating."
            );
        }
    }

    togglePureMode() {
        this.setPureMode(!this.displayState.pureMode, true, true);
    }

    toggleKineticMode() {
        this.setKineticMode(!this.displayState.kineticMode, true, true);
    }

    setPureMode(enabled, persist = true, announce = true) {
        const nextValue = Boolean(enabled);
        if (nextValue === this.displayState.pureMode) {
            return;
        }

        this.capturePureLayoutSnapshot();
        this.displayState.pureMode = nextValue;
        this.applyDisplayState();

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(nextValue ? "Pure lyrics mode enabled." : "Lyric UI restored.");
        }
    }

    setKineticMode(enabled, persist = true, announce = true) {
        const nextValue = Boolean(enabled);
        if (nextValue === this.displayState.kineticMode) {
            return;
        }

        this.displayState.kineticMode = nextValue;
        this.applyDisplayState();
        this.renderAtTime(this.audio.currentTime * 1000, true);

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(
                nextValue
                    ? "Kinetic lyric mode enabled."
                    : "Kinetic lyric mode disabled."
            );
        }
    }

    setKineticMaxWordsPerLine(value, persist = true, announce = true) {
        const nextValue = this.clampKineticMaxWordsPerLine(value);
        if (nextValue === this.displayState.kineticMaxWordsPerLine) {
            return;
        }

        this.displayState.kineticMaxWordsPerLine = nextValue;
        this.applyDisplayState();
        if (this.displayState.kineticMode) {
            this.renderAtTime(this.audio.currentTime * 1000, true);
        }

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Kinetic words per line ${nextValue}.`);
        }
    }

    setKineticMaxCharsPerLine(value, persist = true, announce = true) {
        const nextValue = this.clampKineticMaxCharsPerLine(value);
        if (nextValue === this.displayState.kineticMaxCharsPerLine) {
            return;
        }

        this.displayState.kineticMaxCharsPerLine = nextValue;
        this.applyDisplayState();
        if (this.displayState.kineticMode) {
            this.renderAtTime(this.audio.currentTime * 1000, true);
        }

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Kinetic chars per line ${nextValue}.`);
        }
    }

    applyTextAlign(presetId, persist = true, announce = true) {
        const nextPreset = this.clampTextAlign(presetId);
        if (nextPreset === this.displayState.textAlign) {
            return;
        }

        this.displayState.textAlign = nextPreset;
        this.applyDisplayState();

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Lyrics text aligned ${nextPreset}.`);
        }
    }

    resetDisplay() {
        this.displayState = this.getDefaultDisplayState();
        this.applyDisplayState();
        this.keepOverlayInViewport();
        this.applyDisplayState();
        this.renderAtTime(this.audio.currentTime * 1000, true);
        this.persistDisplayState();
        this.setStatus("Lyrics overlay reset to default box, font, size, and position.");
    }

    toggleSettings(force) {
        this.settingsOpen = typeof force === "boolean" ? force : !this.settingsOpen;
        this.shell.classList.toggle("is-settings-open", this.settingsOpen);
        this.settingsPanel.hidden = !this.settingsOpen;
        this.tuneButton.setAttribute("aria-expanded", this.settingsOpen ? "true" : "false");
        this.tuneButton.classList.toggle("is-active", this.settingsOpen);

        window.requestAnimationFrame(() => {
            this.capturePureLayoutSnapshot();
            this.keepOverlayInViewport();
            this.applyDisplayState();
        });
    }

    toggleFocusMode() {
        this.applyFocusMode(!this.focusMode);
    }

    applyOverlayVisibility(hidden, persist = true) {
        this.isHidden = hidden;
        this.root.classList.toggle("is-collapsed", hidden);
        if (this.revealButton) {
            this.revealButton.hidden = !hidden;
        }
        this.syncPureRevealChip();

        if (persist) {
            localStorage.setItem(this.hiddenStorageKey, String(hidden));
            this.setStatus(hidden ? "Lyrics overlay hidden." : "Lyrics overlay restored.");
        }
    }

    applyFocusMode(enabled, persist = true) {
        this.focusMode = enabled;
        this.appShell.classList.toggle("is-lyrics-focus", enabled);
        this.focusButton.textContent = enabled ? "Exit" : "Focus";
        this.focusButton.setAttribute("aria-pressed", enabled ? "true" : "false");
        window.requestAnimationFrame(() => {
            this.keepOverlayInViewport();
            this.applyDisplayState();
            this.persistDisplayState();
        });

        if (persist) {
            localStorage.setItem(this.focusStorageKey, String(enabled));
            this.setStatus(
                enabled
                    ? "Lyrics focus mode enabled. Only the lyrics overlay and now-playing frame stay on screen."
                    : "Lyrics focus mode disabled."
            );
        }
    }

    applyDisplayState() {
        this.syncControlBounds();
        this.root.style.setProperty("--lyrics-offset-x", `${this.displayState.x}px`);
        this.root.style.setProperty("--lyrics-offset-y", `${this.displayState.y}px`);
        this.root.style.setProperty("--lyrics-width", `${this.displayState.width}px`);
        this.root.style.setProperty("--lyrics-height", `${this.displayState.height}px`);
        this.root.style.setProperty("--lyrics-text-scale", `${this.displayState.textScale}`);
        this.root.style.setProperty("--lyrics-current-fit-scale", "1");
        const boxHaze = this.clampBoxHaze(this.displayState.boxHaze);
        const boxHazeRatio = boxHaze / 100;
        this.root.style.setProperty("--lyrics-box-haze", `${boxHazeRatio.toFixed(3)}`);
        this.root.style.setProperty("--lyrics-box-blur", `${(4 + boxHazeRatio * 30).toFixed(1)}px`);
        this.root.style.setProperty("--lyrics-box-saturate", `${(104 + boxHazeRatio * 42).toFixed(1)}%`);
        this.root.style.setProperty("--lyrics-box-border-alpha", (0.04 + boxHazeRatio * 0.15).toFixed(3));
        this.root.style.setProperty("--lyrics-box-bg-top-alpha", (0.02 + boxHazeRatio * 0.16).toFixed(3));
        this.root.style.setProperty("--lyrics-box-bg-bottom-alpha", (0.03 + boxHazeRatio * 0.24).toFixed(3));
        this.root.style.setProperty("--lyrics-box-radial-a-alpha", (0.01 + boxHazeRatio * 0.14).toFixed(3));
        this.root.style.setProperty("--lyrics-box-radial-b-alpha", (0.01 + boxHazeRatio * 0.12).toFixed(3));
        this.root.style.setProperty("--lyrics-box-shadow-alpha", (0.05 + boxHazeRatio * 0.12).toFixed(3));
        this.root.style.setProperty("--lyrics-box-inset-alpha", (0.02 + boxHazeRatio * 0.07).toFixed(3));
        this.root.style.setProperty("--lyrics-box-glow-alpha", (0.025 + boxHazeRatio * 0.05).toFixed(3));
        this.root.style.setProperty("--lyrics-box-sheen-alpha", (0.008 + boxHazeRatio * 0.04).toFixed(3));
        this.root.style.setProperty("--lyrics-box-highlight-alpha", (0.01 + boxHazeRatio * 0.1).toFixed(3));
        this.root.style.setProperty("--lyrics-box-overlay-alpha", (0.01 + boxHazeRatio * 0.12).toFixed(3));
        this.root.style.setProperty("--lyrics-box-overlay-opacity", (0.16 + boxHazeRatio * 0.78).toFixed(3));
        this.root.style.setProperty("--lyrics-box-video-border-alpha", (0.03 + boxHazeRatio * 0.12).toFixed(3));
        this.root.style.setProperty("--lyrics-box-video-top-alpha", (0.01 + boxHazeRatio * 0.12).toFixed(3));
        this.root.style.setProperty("--lyrics-box-video-bottom-alpha", (0.03 + boxHazeRatio * 0.2).toFixed(3));
        this.root.style.setProperty("--lyrics-box-video-radial-a-alpha", (0.008 + boxHazeRatio * 0.05).toFixed(3));
        this.root.style.setProperty("--lyrics-box-video-radial-b-alpha", (0.008 + boxHazeRatio * 0.05).toFixed(3));
        this.root.style.setProperty("--lyrics-box-video-shadow-alpha", (0.05 + boxHazeRatio * 0.11).toFixed(3));
        this.root.style.setProperty("--lyrics-box-video-inset-alpha", (0.01 + boxHazeRatio * 0.06).toFixed(3));
        this.root.style.setProperty("--lyrics-box-video-warm-alpha", (0.01 + boxHazeRatio * 0.05).toFixed(3));
        this.root.style.setProperty("--lyrics-font-family", this.getFontPreset(this.displayState.fontPreset)?.family || "\"Outfit\", sans-serif");
        this.root.dataset.chromeMode = this.displayState.chromeMode;
        this.root.dataset.textAlign = this.displayState.textAlign;
        this.capturePureLayoutSnapshot();
        this.root.dataset.pureMode = this.displayState.pureMode ? "true" : "false";
        this.root.dataset.kineticMode = this.displayState.kineticMode ? "true" : "false";
        this.root.classList.toggle("is-pure", this.displayState.pureMode);
        this.root.classList.toggle("is-kinetic", this.displayState.kineticMode);
        this.root.classList.remove("is-side-lines-hidden", "is-current-fit");

        this.scaleRange.value = String(Math.round(this.displayState.textScale * 100));
        this.scaleValue.textContent = `${Math.round(this.displayState.textScale * 100)}%`;
        this.widthRange.value = String(Math.round(this.displayState.width));
        this.widthValue.textContent = `${Math.round(this.displayState.width)}px`;
        this.heightRange.value = String(Math.round(this.displayState.height));
        this.heightValue.textContent = `${Math.round(this.displayState.height)}px`;
        if (this.boxHazeRange) {
            this.boxHazeRange.min = String(this.displayConfig.minBoxHaze ?? 0);
            this.boxHazeRange.max = String(this.displayConfig.maxBoxHaze ?? 100);
            this.boxHazeRange.value = String(Math.round(this.displayState.boxHaze));
        }
        if (this.boxHazeValue) {
            this.boxHazeValue.textContent = `${Math.round(this.displayState.boxHaze)}%`;
        }
        this.fontSelect.value = this.displayState.fontPreset;
        if (this.alignSelect) {
            this.alignSelect.value = this.displayState.textAlign;
        }
        if (this.kineticWordsRange) {
            this.kineticWordsRange.min = String(this.displayConfig.minKineticMaxWordsPerLine ?? 3);
            this.kineticWordsRange.max = String(this.displayConfig.maxKineticMaxWordsPerLine ?? 8);
            this.kineticWordsRange.value = String(this.displayState.kineticMaxWordsPerLine);
        }
        if (this.kineticWordsValue) {
            this.kineticWordsValue.textContent = String(this.displayState.kineticMaxWordsPerLine);
        }
        if (this.kineticCharsRange) {
            this.kineticCharsRange.min = String(this.displayConfig.minKineticMaxCharsPerLine ?? 10);
            this.kineticCharsRange.max = String(this.displayConfig.maxKineticMaxCharsPerLine ?? 36);
            this.kineticCharsRange.value = String(this.displayState.kineticMaxCharsPerLine);
        }
        if (this.kineticCharsValue) {
            this.kineticCharsValue.textContent = String(this.displayState.kineticMaxCharsPerLine);
        }

        if (this.boxButton) {
            const isBoxed = this.displayState.chromeMode === "boxed";
            this.boxButton.setAttribute("aria-pressed", isBoxed ? "true" : "false");
            this.boxButton.classList.toggle("is-active", isBoxed);
        }

        if (this.pureButton) {
            this.pureButton.setAttribute("aria-pressed", this.displayState.pureMode ? "true" : "false");
            this.pureButton.classList.toggle("is-active", this.displayState.pureMode);
        }

        if (this.kineticButton) {
            this.kineticButton.setAttribute("aria-pressed", this.displayState.kineticMode ? "true" : "false");
            this.kineticButton.classList.toggle("is-active", this.displayState.kineticMode);
        }

        this.syncPureRevealChip();
        this.scheduleOverflowLayout();
    }

    syncPureRevealChip() {
        if (!this.pureRevealButton) {
            return;
        }

        this.pureRevealButton.hidden = this.isHidden || !this.displayState.pureMode;
    }

    capturePureLayoutSnapshot() {
        if (!this.root || !this.shell || !this.body) {
            return;
        }

        const hadPureClass = this.root.classList.contains("is-pure");
        const previousPureDataset = this.root.dataset.pureMode;

        if (hadPureClass) {
            this.root.classList.remove("is-pure");
            this.root.dataset.pureMode = "false";
        }

        const shellRect = this.shell.getBoundingClientRect();
        const headerRect = this.dragHandle?.getBoundingClientRect();
        const metaRect = this.meta?.getBoundingClientRect();
        const bodyStyles = window.getComputedStyle(this.body);

        this.pureLayoutSnapshot = {
            shellHeight: Math.max(0, shellRect.height || 0),
            headerHeight: Math.max(0, headerRect?.height || 0),
            metaHeight: Math.max(0, metaRect?.height || 0),
            bodyPaddingTop: bodyStyles.paddingTop,
            bodyPaddingRight: bodyStyles.paddingRight,
            bodyPaddingBottom: bodyStyles.paddingBottom,
            bodyPaddingLeft: bodyStyles.paddingLeft
        };

        this.root.style.setProperty("--lyrics-pure-shell-height", `${this.pureLayoutSnapshot.shellHeight}px`);
        this.root.style.setProperty("--lyrics-pure-header-height", `${this.pureLayoutSnapshot.headerHeight}px`);
        this.root.style.setProperty("--lyrics-pure-meta-height", `${this.pureLayoutSnapshot.metaHeight}px`);
        this.root.style.setProperty("--lyrics-pure-body-pad-top", this.pureLayoutSnapshot.bodyPaddingTop);
        this.root.style.setProperty("--lyrics-pure-body-pad-right", this.pureLayoutSnapshot.bodyPaddingRight);
        this.root.style.setProperty("--lyrics-pure-body-pad-bottom", this.pureLayoutSnapshot.bodyPaddingBottom);
        this.root.style.setProperty("--lyrics-pure-body-pad-left", this.pureLayoutSnapshot.bodyPaddingLeft);

        if (hadPureClass) {
            this.root.classList.add("is-pure");
            this.root.dataset.pureMode = previousPureDataset ?? "true";
        }
    }

    persistDisplayState() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.displayState));
    }

    getFontPreset(presetId) {
        return this.fontPresets.find((preset) => preset.id === presetId) || this.fontPresets[0] || null;
    }

    clampChromeMode(value) {
        return this.chromeModes.includes(value) ? value : "boxed";
    }

    clampTextAlign(value) {
        return this.textAlignPresets.includes(value) ? value : "center";
    }

    clampTextScale(value) {
        const min = this.displayConfig.minTextScale ?? 0.6;
        const max = this.displayConfig.maxTextScale ?? 3.4;
        return Math.min(Math.max(value, min), max);
    }

    clampWidth(value) {
        const min = this.displayConfig.minWidth ?? 320;
        const max = Math.min(this.displayConfig.maxWidth ?? 2800, this.getViewportMaxWidth());
        return Math.min(Math.max(value, min), max);
    }

    clampHeight(value) {
        const min = this.displayConfig.minHeight ?? 220;
        const max = Math.min(this.displayConfig.maxHeight ?? 1800, this.getViewportMaxHeight());
        return Math.min(Math.max(value, min), max);
    }

    clampBoxHaze(value) {
        const min = this.displayConfig.minBoxHaze ?? 0;
        const max = this.displayConfig.maxBoxHaze ?? 100;
        const numericValue = Number(value);
        const fallback = this.displayConfig.defaultBoxHaze ?? 58;
        const resolved = Number.isFinite(numericValue) ? numericValue : fallback;
        return Math.min(Math.max(Math.round(resolved), min), max);
    }

    handleResize() {
        this.displayState.width = this.clampWidth(this.displayState.width);
        this.displayState.height = this.clampHeight(this.displayState.height);
        this.keepOverlayInViewport();
        this.applyDisplayState();
        this.persistDisplayState();
    }

    scheduleOverflowLayout() {
        if (!this.body) {
            return;
        }

        if (this.overflowRaf) {
            window.cancelAnimationFrame(this.overflowRaf);
        }

        this.overflowRaf = window.requestAnimationFrame(() => {
            this.overflowRaf = null;
            this.refreshOverflowLayout();
        });
    }

    refreshOverflowLayout() {
        if (!this.body || this.isHidden) {
            return;
        }

        if (this.displayState.kineticMode) {
            this.root.classList.remove("is-side-lines-hidden");
            this.root.style.setProperty("--lyrics-current-fit-scale", "1");

            const kineticContent = this.currentLine.querySelector(".kinetic-content");
            const kineticRows = Array.from(this.currentLine.querySelectorAll(".kinetic-row"));
            const kineticPreroll = this.currentLine.querySelector(".kinetic-preroll");
            if (!kineticContent) {
                this.root.classList.remove("is-current-fit");
                return;
            }

            const lineRect = this.currentLine.getBoundingClientRect();
            const safeInsetX = Math.min(40, Math.max(18, lineRect.width * 0.06));
            const safeInsetY = Math.min(28, Math.max(14, lineRect.height * 0.06));
            const availableWidth = Math.max(1, lineRect.width - safeInsetX * 2);
            const availableHeight = Math.max(1, lineRect.height - safeInsetY * 2);
            const rowWidths = kineticRows.map((row) => Math.max(row.scrollWidth, row.getBoundingClientRect().width));
            const contentWidth = kineticPreroll
                ? Math.max(kineticPreroll.scrollWidth, kineticPreroll.getBoundingClientRect().width)
                : Math.max(...rowWidths, kineticContent.getBoundingClientRect().width);
            const contentHeight = kineticPreroll
                ? Math.max(kineticPreroll.scrollHeight, kineticPreroll.getBoundingClientRect().height)
                : Math.max(kineticContent.scrollHeight, kineticContent.getBoundingClientRect().height);
            const widthRatio = contentWidth > 0 ? availableWidth / contentWidth : 1;
            const heightRatio = contentHeight > 0 ? availableHeight / contentHeight : 1;
            const fitScale = Math.max(0.58, Math.min(1, widthRatio, heightRatio));

            if (fitScale < 0.999) {
                this.root.classList.add("is-current-fit");
                this.root.style.setProperty("--lyrics-current-fit-scale", fitScale.toFixed(4));
            } else {
                this.root.classList.remove("is-current-fit");
            }
            return;
        }

        this.root.classList.remove("is-side-lines-hidden", "is-current-fit");
        this.root.style.setProperty("--lyrics-current-fit-scale", "1");

        const previousHasText = Boolean(this.previousLine.textContent.trim());
        const nextHasText = Boolean(this.nextLine.textContent.trim());
        const bodyRect = this.body.getBoundingClientRect();
        const currentRect = this.currentLine.getBoundingClientRect();
        const previousRect = previousHasText ? this.previousLine.getBoundingClientRect() : null;
        const nextRect = nextHasText ? this.nextLine.getBoundingClientRect() : null;
        const bodyStyles = window.getComputedStyle(this.body);
        const currentStyles = window.getComputedStyle(this.currentLine);
        const rowGap = parseFloat(bodyStyles.rowGap || bodyStyles.gap || "0") || 0;
        const currentLineHeight = parseFloat(currentStyles.lineHeight)
            || (parseFloat(currentStyles.fontSize || "0") * 1.05)
            || 0;
        const currentLineCount = currentLineHeight
            ? Math.max(1, Math.round(currentRect.height / currentLineHeight))
            : 1;
        const visibleLineCount = [previousHasText, true, nextHasText].filter(Boolean).length;
        const totalStackHeight = (previousRect?.height || 0)
            + currentRect.height
            + (nextRect?.height || 0)
            + Math.max(0, visibleLineCount - 1) * rowGap;
        const hasLineCollision = Boolean(
            (previousRect && previousRect.bottom > currentRect.top - 6)
            || (nextRect && nextRect.top < currentRect.bottom + 6)
        );
        const hasBodyOverflow = totalStackHeight > bodyRect.height + 4
            || this.body.scrollHeight > this.body.clientHeight + 6;
        const shouldSimplifyForLargeCurrent = currentLineCount >= 3
            || currentRect.height > bodyRect.height * 0.72
            || (this.displayState.textScale >= 2 && currentRect.height >= 180);

        if ((hasLineCollision || hasBodyOverflow || shouldSimplifyForLargeCurrent) && (previousHasText || nextHasText)) {
            this.root.classList.add("is-side-lines-hidden");
        }

        const bodyHeight = this.body.clientHeight || bodyRect.height || 0;
        const currentHeight = this.currentLine.scrollHeight || this.currentLine.getBoundingClientRect().height;
        if (!bodyHeight || !currentHeight) {
            return;
        }

        const availableHeight = Math.max(24, bodyHeight - 6);
        if (currentHeight > availableHeight) {
            const fitScale = Math.max(0.52, Math.min(1, availableHeight / currentHeight));
            this.root.classList.add("is-current-fit");
            this.root.style.setProperty("--lyrics-current-fit-scale", fitScale.toFixed(4));
        }
    }

    handleKeyDown(event) {
        if (event.key === "Escape" && this.displayState.pureMode) {
            this.setPureMode(false, true, true);
            return;
        }

        if (event.key === "Escape" && this.settingsOpen) {
            this.toggleSettings(false);
            return;
        }

        if (event.key === "Escape" && this.focusMode) {
            this.applyFocusMode(false);
        }
    }

    handleDragStart(event) {
        if (
            this.displayState.pureMode
            || event.button !== 0
            || event.target.closest(".lyrics-controls, .lyrics-settings, .lyrics-resize-handle")
        ) {
            return;
        }

        event.preventDefault();
        const rect = this.root.getBoundingClientRect();
        this.dragState = {
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: this.displayState.x,
            startY: this.displayState.y,
            rect
        };

        this.root.classList.add("is-dragging");
        this.shell.classList.add("is-dragging");
        window.addEventListener("pointermove", this.handleDragMove);
        window.addEventListener("pointerup", this.handleDragEnd);
    }

    handleDragMove(event) {
        if (!this.dragState) {
            return;
        }

        const margin = this.displayConfig.viewportPadding ?? 16;
        const dx = event.clientX - this.dragState.startClientX;
        const dy = event.clientY - this.dragState.startClientY;
        const minDx = margin - this.dragState.rect.left;
        const maxDx = window.innerWidth - margin - this.dragState.rect.right;
        const minDy = margin - this.dragState.rect.top;
        const maxDy = window.innerHeight - margin - this.dragState.rect.bottom;

        this.displayState.x = this.dragState.startX + Math.min(Math.max(dx, minDx), maxDx);
        this.displayState.y = this.dragState.startY + Math.min(Math.max(dy, minDy), maxDy);
        this.applyDisplayState();
    }

    handleDragEnd() {
        if (!this.dragState) {
            return;
        }

        this.dragState = null;
        this.root.classList.remove("is-dragging");
        this.shell.classList.remove("is-dragging");
        window.removeEventListener("pointermove", this.handleDragMove);
        window.removeEventListener("pointerup", this.handleDragEnd);
        this.persistDisplayState();
        this.setStatus("Lyrics area moved.");
    }

    handleResizeStart(event) {
        if (this.displayState.pureMode || event.button !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.resizeState = {
            direction: event.currentTarget.dataset.resize,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: this.displayState.x,
            startY: this.displayState.y,
            startWidth: this.displayState.width,
            startHeight: this.displayState.height
        };

        this.root.classList.add("is-resizing");
        this.shell.classList.add("is-resizing");
        window.addEventListener("pointermove", this.handleResizeMove);
        window.addEventListener("pointerup", this.handleResizeEnd);
    }

    handleResizeMove(event) {
        if (!this.resizeState) {
            return;
        }

        const dx = event.clientX - this.resizeState.startClientX;
        const dy = event.clientY - this.resizeState.startClientY;
        const horizontalDirection = this.resizeState.direction.includes("e") ? 1 : -1;
        const verticalDirection = this.resizeState.direction.includes("s") ? 1 : -1;
        const nextWidth = this.clampWidth(this.resizeState.startWidth + dx * horizontalDirection);
        const widthDelta = nextWidth - this.resizeState.startWidth;
        const nextHeight = this.clampHeight(this.resizeState.startHeight + dy * verticalDirection);
        const heightDelta = nextHeight - this.resizeState.startHeight;

        this.displayState.width = nextWidth;
        this.displayState.height = nextHeight;
        this.displayState.x = this.resizeState.startX + (widthDelta / 2) * horizontalDirection;
        this.displayState.y = this.resizeState.startY + (this.resizeState.direction.includes("s") ? heightDelta : 0);
        this.applyDisplayState();
        this.keepOverlayInViewport();
        this.applyDisplayState();
    }

    handleResizeEnd() {
        if (!this.resizeState) {
            return;
        }

        this.resizeState = null;
        this.root.classList.remove("is-resizing");
        this.shell.classList.remove("is-resizing");
        window.removeEventListener("pointermove", this.handleResizeMove);
        window.removeEventListener("pointerup", this.handleResizeEnd);
        this.persistDisplayState();
        this.setStatus(`Lyrics resized to ${Math.round(this.displayState.width)}px x ${Math.round(this.displayState.height)}px.`);
    }

    keepOverlayInViewport() {
        const margin = this.displayConfig.viewportPadding ?? 16;
        this.root.classList.add("is-adjusting");

        for (let iteration = 0; iteration < 4; iteration += 1) {
            const rect = this.shell.getBoundingClientRect();
            let changed = false;

            if (rect.left < margin) {
                this.displayState.x += margin - rect.left;
                changed = true;
            }

            if (rect.right > window.innerWidth - margin) {
                this.displayState.x -= rect.right - (window.innerWidth - margin);
                changed = true;
            }

            if (rect.top < margin) {
                this.displayState.y += margin - rect.top;
                changed = true;
            }

            if (rect.bottom > window.innerHeight - margin) {
                this.displayState.y -= rect.bottom - (window.innerHeight - margin);
                changed = true;
            }

            if (!changed) {
                break;
            }

            this.root.style.setProperty("--lyrics-offset-x", `${this.displayState.x}px`);
            this.root.style.setProperty("--lyrics-offset-y", `${this.displayState.y}px`);
        }

        this.root.classList.remove("is-adjusting");
    }

    getViewportMaxWidth() {
        const padding = this.displayConfig.viewportPadding ?? 16;
        return Math.max(this.displayConfig.minWidth ?? 320, window.innerWidth - padding * 2);
    }

    getViewportMaxHeight() {
        const padding = this.displayConfig.viewportPadding ?? 16;
        return Math.max(this.displayConfig.minHeight ?? 220, window.innerHeight - padding * 2);
    }

    syncControlBounds() {
        if (!this.widthRange || !this.heightRange) {
            return;
        }

        this.widthRange.min = String(this.displayConfig.minWidth ?? 320);
        this.widthRange.max = String(Math.round(this.getViewportMaxWidth()));
        this.heightRange.min = String(this.displayConfig.minHeight ?? 220);
        this.heightRange.max = String(Math.round(this.getViewportMaxHeight()));
    }

    setAudioReactiveState(payload = {}) {
        const overall = this.clampAudioValue(payload.overall);
        const bass = this.clampAudioValue(payload.bass);
        const mid = this.clampAudioValue(payload.mid);
        const high = this.clampAudioValue(payload.high);
        const pulse = this.clampAudioValue(payload.pulse);
        const intensity = this.clampAudioValue(payload.intensity);
        const shellLevel = this.clampAudioValue((overall * 0.34 + pulse * 0.28) * intensity);
        const textLevel = this.clampAudioValue((mid * 0.54 + high * 0.28 + pulse * 0.18) * intensity);

        this.audioReactiveState = {
            overall,
            bass,
            mid,
            high,
            pulse,
            intensity,
            isPlaying: Boolean(payload.isPlaying)
        };

        this.root.style.setProperty("--lyrics-audio-level", shellLevel.toFixed(3));
        this.root.style.setProperty("--lyrics-audio-pulse", (pulse * intensity).toFixed(3));
        this.root.style.setProperty("--lyrics-current-glow", textLevel.toFixed(3));
    }

    clampAudioValue(value) {
        return Math.min(Math.max(Number(value) || 0, 0), 1);
    }
}

export default LyricsEngine;
