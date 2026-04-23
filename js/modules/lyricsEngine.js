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
        this.sidebarMount = document.getElementById("lyricsSidebarMount");
        this.scaleRange = document.getElementById("lyricsScaleRange");
        this.scaleValue = document.getElementById("lyricsScaleValue");
        this.boxHazeRange = document.getElementById("lyricsBoxHazeRange");
        this.boxHazeValue = document.getElementById("lyricsBoxHazeValue");
        this.fontSelect = document.getElementById("lyricsFontSelect");
        this.boldToggle = document.getElementById("lyricsBoldToggle");
        this.italicToggle = document.getElementById("lyricsItalicToggle");
        this.letterSpacingRange = document.getElementById("lyricsLetterSpacingRange");
        this.letterSpacingValue = document.getElementById("lyricsLetterSpacingValue");
        this.wordSpacingRange = document.getElementById("lyricsWordSpacingRange");
        this.wordSpacingValue = document.getElementById("lyricsWordSpacingValue");
        this.textStyleSelect = document.getElementById("textEffect") || document.getElementById("lyricsTextStyle");
        this.colorModeSelect = document.getElementById("colorMode") || document.getElementById("lyricsColorMode");
        this.colorPresetGallery = document.getElementById("lyricsColorPresetGallery");
        this.multiColorListInput = document.getElementById("multiColorList");
        this.multiColorPreview = document.getElementById("lyricsMultiColorPreview");
        this.primaryColorInput = document.getElementById("lyricsPrimaryColor");
        this.secondaryColorInput = document.getElementById("lyricsSecondaryColor");
        this.accentColorInput = document.getElementById("lyricsAccentColor");
        this.alignSelect = document.getElementById("lyricsAlignSelect");
        this.kineticWordsRange = document.getElementById("lyricsKineticWordsRange");
        this.kineticWordsValue = document.getElementById("lyricsKineticWordsValue");
        this.kineticCharsRange = document.getElementById("lyricsKineticCharsRange");
        this.kineticCharsValue = document.getElementById("lyricsKineticCharsValue");
        this.kineticSpeedRange = document.getElementById("lyricsKineticSpeedRange");
        this.kineticSpeedValue = document.getElementById("lyricsKineticSpeedValue");
        this.kineticStyleSelect = document.getElementById("lyricsKineticStyleSelect");
        this.tailBurstToggle = document.getElementById("lyricsTailBurstToggle");
        this.tailBurstStyleSelect = document.getElementById("lyricsTailBurstStyleSelect");
        this.tailBurstColorAInput = document.getElementById("lyricsTailBurstColorA");
        this.tailBurstColorBInput = document.getElementById("lyricsTailBurstColorB");
        this.tailBurstColorCoreInput = document.getElementById("lyricsTailBurstColorCore");
        this.tailBurstStrengthRange = document.getElementById("lyricsTailBurstStrengthRange");
        this.tailBurstStrengthValue = document.getElementById("lyricsTailBurstStrengthValue");
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
        this.karaokeLines = [];
        this.karaokeLineMap = new Map();
        this.cleanPhraseChunks = [];
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
        this.kineticStylePresets = ["center-build", "soft-drift", "clean-phrase"];
        this.tailBurstStylePresets = ["glow-burst", "firework", "shatter"];
        this.textStylePresets = ["normal", "outline", "3d-effect", "pixel-game"];
        this.colorModes = ["single", "gradient-text", "random-per-word", "random-per-char"];
        this.colorPresets = this.displayConfig.colorPresets || [];
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
        this.kineticRenderState = null;
        this.kineticPhase = "idle";
        this.cleanPhraseState = null;
        this.cleanPhraseBodyOffset = 0;
        this.tailBurstPreviewTimeout = null;
        this.audioReactiveState = this.createNeutralAudioReactiveState();
        this.lastRenderedSignature = "";
        this.isEditingMultiColorList = false;

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
        this.handleCustomizerStateChange = this.handleCustomizerStateChange.bind(this);
    }

    init() {
        this.renderFontOptions();
        this.renderColorPresetGallery();
        this.restoreDisplayState();
        this.mountSettingsInSidebar();
        this.attachDisplayControls();
        this.handleCustomizerStateChange({ detail: { open: false, tabId: null } });
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
        this.appShell?.addEventListener("profile:customizerchange", this.handleCustomizerStateChange);

        this.renderPlaceholder(
            this.config.lyrics.emptyTitle,
            this.config.lyrics.emptyMessage,
            this.config.lyrics.emptyMeta
        );
    }

    mountSettingsInSidebar() {
        if (!this.settingsPanel || !this.sidebarMount || this.settingsPanel.parentElement === this.sidebarMount) {
            return;
        }

        this.settingsPanel.hidden = false;
        this.settingsPanel.classList.add("lyrics-settings--sidebar");
        this.sidebarMount.replaceChildren(this.settingsPanel);
    }

    createNeutralAudioReactiveState() {
        return {
            overall: 0,
            bass: 0,
            mid: 0,
            high: 0,
            pulse: 0,
            transient: 0,
            intensity: 1,
            isPlaying: false
        };
    }

    async loadTrack(track) {
        this.track = track;
        this.stopLoop();
        this.lines = [];
        this.karaokeLines = [];
        this.karaokeLineMap = new Map();
        this.cleanPhraseChunks = [];
        this.cleanPhraseState = null;
        this.isLoaded = false;

        if (!track?.lyrics && !track?.lyricsData && !track?.karaoke && !track?.karaokeData) {
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
            if (typeof text !== "string" && track?.lyrics) {
                const response = await fetch(track.lyrics);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                text = await response.text();
            }

            const parsed = typeof text === "string"
                ? this.parseLrc(text)
                : { meta: {}, lines: [] };

            let karaokeParsed = { lines: [] };
            try {
                let karaokeSource = track.karaokeData;
                const derivedKaraokePath = (
                    !karaokeSource
                    && typeof track?.karaoke !== "string"
                    && typeof track?.lyrics === "string"
                    && /\.lrc$/i.test(track.lyrics)
                )
                    ? track.lyrics.replace(/\.lrc$/i, ".karaoke.json")
                    : null;
                if (
                    typeof karaokeSource !== "string"
                    && !Array.isArray(karaokeSource)
                    && (!karaokeSource || typeof karaokeSource !== "object")
                    && (track?.karaoke || derivedKaraokePath)
                ) {
                    const karaokeResponse = await fetch(track.karaoke || derivedKaraokePath);
                    if (karaokeResponse.ok) {
                        karaokeSource = await karaokeResponse.text();
                    } else {
                        throw new Error(`HTTP ${karaokeResponse.status}`);
                    }
                }

                if (
                    typeof karaokeSource === "string"
                    || Array.isArray(karaokeSource)
                    || (karaokeSource && typeof karaokeSource === "object")
                ) {
                    karaokeParsed = this.parseKaraoke(karaokeSource, parsed.lines);
                }
            } catch (karaokeError) {
                console.warn("Karaoke data could not be loaded. Falling back to line-level lyrics.", karaokeError);
            }

            if (parsed.lines.length === 0 && karaokeParsed.lines.length > 0) {
                parsed.lines = karaokeParsed.lines.map((line) => ({
                    timeMs: Number.isFinite(line.lineStartMs) ? line.lineStartMs : 0,
                    text: line.text || "..."
                }));
            }

            if (parsed.lines.length === 0) {
                this.renderPlaceholder(
                    "Lyrics file loaded, but no timed lines were found.",
                    "Use [mm:ss.xx] lyric format in your .lrc file.",
                    track.lyrics || track.karaoke
                );
                return;
            }

            this.lines = parsed.lines;
            this.setKaraokeLines(karaokeParsed.lines, this.lines);
            this.cleanPhraseChunks = this.buildRefinedCleanPhraseChunks();
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

    parseLyricTimestampToMs(minutesRaw, secondsRaw, fractionalRaw = "0") {
        const minutes = Number(minutesRaw) || 0;
        const seconds = Number(secondsRaw) || 0;
        const fractionalString = String(fractionalRaw ?? "0");
        const fractional = fractionalString.length === 3
            ? Number(fractionalString)
            : Number(fractionalString.padEnd(2, "0")) * 10;
        return minutes * 60000 + seconds * 1000 + fractional;
    }

    parseEnhancedLrcWords(content) {
        const markers = [...content.matchAll(/<(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?>/g)];
        if (markers.length === 0) {
            return [];
        }

        const words = [];
        markers.forEach((marker, index) => {
            const startIndex = (marker.index ?? 0) + marker[0].length;
            const endIndex = index + 1 < markers.length
                ? (markers[index + 1].index ?? content.length)
                : content.length;
            const text = content
                .slice(startIndex, endIndex)
                .replace(/<[^>]+>/g, " ")
                .trim();

            if (!text) {
                return;
            }

            const startTime = this.parseLyricTimestampToMs(marker[1], marker[2], marker[3] || "0");
            words.push({
                text,
                startTime,
                endTime: null,
                timeMs: startTime
            });
        });

        words.forEach((word, index) => {
            const nextWord = words[index + 1] || null;
            if (nextWord && Number.isFinite(nextWord.startTime)) {
                word.endTime = nextWord.startTime;
            }
        });

        return words;
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

            const lyricBody = line.replace(/\[[^\]]+\]/g, "").trim();
            const enhancedWords = this.parseEnhancedLrcWords(lyricBody);
            const lyricText = (
                enhancedWords.length > 0
                    ? enhancedWords.map((word) => word.text).join(" ")
                    : lyricBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
            );
            stamps.forEach((stamp) => {
                const lineTimeMs = this.parseLyricTimestampToMs(stamp[1], stamp[2], stamp[3] || "0") + offset;
                const words = enhancedWords.map((word) => ({
                    ...word,
                    startTime: Number.isFinite(word.startTime) ? word.startTime + offset : null,
                    endTime: Number.isFinite(word.endTime) ? word.endTime + offset : null,
                    timeMs: Number.isFinite(word.startTime) ? word.startTime + offset : null
                }));

                lines.push({
                    timeMs: lineTimeMs,
                    text: lyricText || "...",
                    words
                });
            });
        });

        lines.sort((a, b) => a.timeMs - b.timeMs);
        lines.forEach((lineEntry, index) => {
            if (!Array.isArray(lineEntry.words) || lineEntry.words.length === 0) {
                return;
            }

            const nextLine = lines[index + 1] || null;
            const fallbackEnd = Number.isFinite(nextLine?.timeMs)
                ? nextLine.timeMs
                : lineEntry.timeMs + 420;
            lineEntry.words.forEach((word, wordIndex) => {
                const nextWord = lineEntry.words[wordIndex + 1] || null;
                const resolvedEnd = Number.isFinite(word.endTime)
                    ? word.endTime
                    : Number.isFinite(nextWord?.startTime)
                        ? nextWord.startTime
                        : fallbackEnd;
                word.endTime = Math.max(resolvedEnd, (word.startTime ?? lineEntry.timeMs) + 80);
                word.timeMs = Number.isFinite(word.startTime) ? word.startTime : lineEntry.timeMs;
            });
        });
        return { meta: metadata, lines };
    }

    parseKaraoke(source, fallbackLines = []) {
        let parsedSource = source;
        if (typeof parsedSource === "string") {
            parsedSource = JSON.parse(parsedSource);
        }

        const rawLines = Array.isArray(parsedSource)
            ? parsedSource
            : Array.isArray(parsedSource?.lines)
                ? parsedSource.lines
                : [];

        const lines = rawLines.map((entry, index) => {
            const fallbackLine = fallbackLines[index] || null;
            const rawWords = Array.isArray(entry?.words) ? entry.words : [];
            const words = rawWords
                .map((word, wordIndex) => {
                    const text = String(word?.text || word?.word || "").trim();
                    const startTime = Number(word?.startTime ?? word?.timeMs ?? word?.startMs ?? word?.start ?? NaN);
                    const endTime = Number(word?.endTime ?? word?.endMs ?? word?.end ?? NaN);
                    if (!text) {
                        return null;
                    }

                    return {
                        text,
                        startTime: Number.isFinite(startTime) ? startTime : null,
                        endTime: Number.isFinite(endTime) ? endTime : null,
                        timeMs: Number.isFinite(startTime) ? startTime : null,
                        index: wordIndex
                    };
                })
                .filter(Boolean)
                .sort((a, b) => (a.timeMs ?? Number.MAX_SAFE_INTEGER) - (b.timeMs ?? Number.MAX_SAFE_INTEGER));
            const lineStartMs = Number(entry?.lineStartMs ?? entry?.timeMs ?? words[0]?.timeMs ?? fallbackLine?.timeMs ?? 0);
            const text = String(entry?.text || words.map((word) => word.text).join(" ") || fallbackLine?.text || "").trim();

            return {
                lineStartMs: Number.isFinite(lineStartMs) ? lineStartMs : 0,
                text: text || "...",
                words,
                index
            };
        }).filter((line) => line.words.length > 0 || line.text);

        lines.sort((a, b) => a.lineStartMs - b.lineStartMs);
        lines.forEach((lineEntry, index) => {
            if (!Array.isArray(lineEntry.words) || lineEntry.words.length === 0) {
                return;
            }

            const nextLine = lines[index + 1] || null;
            const fallbackEnd = Number.isFinite(nextLine?.lineStartMs)
                ? nextLine.lineStartMs
                : lineEntry.lineStartMs + 420;
            lineEntry.words.forEach((word, wordIndex) => {
                const nextWord = lineEntry.words[wordIndex + 1] || null;
                const resolvedEnd = Number.isFinite(word.endTime)
                    ? word.endTime
                    : Number.isFinite(nextWord?.startTime)
                        ? nextWord.startTime
                        : fallbackEnd;
                word.endTime = Math.max(resolvedEnd, (word.startTime ?? lineEntry.lineStartMs) + 80);
                word.timeMs = Number.isFinite(word.startTime) ? word.startTime : lineEntry.lineStartMs;
            });
        });
        return { lines };
    }

    setKaraokeLines(lines = [], fallbackLines = []) {
        this.karaokeLines = Array.isArray(lines) ? lines : [];
        this.karaokeLineMap = new Map();

        this.karaokeLines.forEach((line, index) => {
            if (!line || !Number.isFinite(line.lineStartMs)) {
                return;
            }

            const fallbackLine = fallbackLines[index] || null;
            const key = this.getKaraokeLookupKey(fallbackLine?.timeMs ?? line.lineStartMs);
            this.karaokeLineMap.set(key, line);
        });
    }

    getKaraokeLookupKey(timeMs) {
        return String(Math.round(Number(timeMs) || 0));
    }

    resolveKaraokeLine(currentLine, currentIndex = -1) {
        if (!currentLine || this.karaokeLines.length === 0) {
            return null;
        }

        if (currentIndex >= 0 && currentIndex < this.karaokeLines.length) {
            const candidate = this.karaokeLines[currentIndex];
            if (candidate) {
                const withinTimeWindow = Math.abs((candidate.lineStartMs ?? 0) - (currentLine.timeMs ?? 0)) <= 180;
                if (withinTimeWindow || candidate.text === currentLine.text) {
                    return candidate;
                }
            }
        }

        const directMatch = this.karaokeLineMap.get(this.getKaraokeLookupKey(currentLine.timeMs));
        if (directMatch) {
            return directMatch;
        }

        return this.karaokeLines.find((line) => (
            Math.abs((line.lineStartMs ?? 0) - (currentLine.timeMs ?? 0)) <= 180
        )) || null;
    }

    normalizeTimedWords(rawWords = [], fallbackStartTime = 0, fallbackEndTime = null) {
        const normalizedWords = [];
        rawWords.forEach((rawWord) => {
            const rawText = String(rawWord?.text || rawWord?.word || "").trim();
            if (!rawText) {
                return;
            }

            const tokens = rawText.split(/\s+/).filter(Boolean);
            const startTime = Number(rawWord?.startTime ?? rawWord?.timeMs ?? rawWord?.startMs ?? rawWord?.start ?? NaN);
            const endTime = Number(rawWord?.endTime ?? rawWord?.endMs ?? rawWord?.end ?? NaN);
            const safeStart = Number.isFinite(startTime) ? startTime : fallbackStartTime;
            const safeEnd = Number.isFinite(endTime) && endTime > safeStart
                ? endTime
                : (
                    Number.isFinite(fallbackEndTime) && fallbackEndTime > safeStart
                        ? fallbackEndTime
                        : safeStart + Math.max(tokens.length, 1) * 180
                );

            if (tokens.length <= 1) {
                normalizedWords.push({
                    text: rawText,
                    startTime: safeStart,
                    endTime: Math.max(safeEnd, safeStart + 80),
                    timeMs: safeStart
                });
                return;
            }

            const segmentDuration = Math.max((safeEnd - safeStart) / tokens.length, 80);
            tokens.forEach((token, tokenIndex) => {
                const tokenStart = Math.round(safeStart + (segmentDuration * tokenIndex));
                const tokenEnd = Math.round(
                    tokenIndex === tokens.length - 1
                        ? safeEnd
                        : safeStart + (segmentDuration * (tokenIndex + 1))
                );
                normalizedWords.push({
                    text: token,
                    startTime: tokenStart,
                    endTime: Math.max(tokenEnd, tokenStart + 80),
                    timeMs: tokenStart
                });
            });
        });

        return normalizedWords.map((word, index) => ({
            ...word,
            index
        })).filter((word) => word.text);
    }

    looksSyntheticWordTiming(words = []) {
        if (!Array.isArray(words) || words.length < 3) {
            return false;
        }

        const gaps = [];
        for (let index = 1; index < words.length; index += 1) {
            const prevStart = Number(words[index - 1]?.startTime ?? words[index - 1]?.timeMs ?? NaN);
            const currentStart = Number(words[index]?.startTime ?? words[index]?.timeMs ?? NaN);
            if (Number.isFinite(prevStart) && Number.isFinite(currentStart)) {
                gaps.push(Math.max(currentStart - prevStart, 0));
            }
        }

        if (gaps.length < 2) {
            return false;
        }

        const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
        if (averageGap <= 0) {
            return false;
        }

        const variance = gaps.reduce((sum, gap) => sum + ((gap - averageGap) ** 2), 0) / gaps.length;
        const deviation = Math.sqrt(variance);
        const nearRepeatedGaps = gaps.filter((gap) => Math.abs(gap - averageGap) <= Math.max(averageGap * 0.08, 14)).length;
        return deviation <= Math.max(averageGap * 0.12, 18) || nearRepeatedGaps >= Math.ceil(gaps.length * 0.68);
    }

    estimateCleanPhraseWordWeight(text = "", index = 0, totalWords = 1) {
        const safeText = String(text || "").trim();
        if (!safeText) {
            return 1;
        }

        const plain = safeText.replace(/[^\p{L}\p{N}]+/gu, "");
        const lower = plain.toLocaleLowerCase("vi-VN");
        const charCount = Math.max(plain.length, 1);
        const vowelCount = (lower.match(/[aeiouyăâêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/giu) || []).length;
        const punctuationBoost = /[,.!?;:…]$/.test(safeText) ? 0.35 : 0;
        const functionWordPenalty = /^(và|hay|để|là|mà|thì|lại|đã|có|em|anh|ơi|à|ừ|ờ|này|đó|đâu|cho|với|của|như)$/i.test(lower) ? -0.16 : 0;
        const terminalBoost = index === totalWords - 1 ? 0.26 : 0;
        const openingBoost = index === 0 ? 0.08 : 0;
        const longWordBoost = Math.max(charCount - 4, 0) * 0.06;
        const vowelBoost = vowelCount > 1 ? Math.min(vowelCount * 0.05, 0.22) : 0;
        return Math.min(
            3.6,
            Math.max(
                0.62,
                0.9
                + (Math.min(charCount, 8) * 0.13)
                + longWordBoost
                + vowelBoost
                + punctuationBoost
                + terminalBoost
                + openingBoost
                + functionWordPenalty
            )
        );
    }

    estimateCleanPhrasePauseWeight(previousWord = null, nextWord = null) {
        if (!previousWord || !nextWord) {
            return 0;
        }

        const previousText = String(previousWord.text || "");
        const nextText = String(nextWord.text || "");
        const previousPlain = previousText.replace(/[^\p{L}\p{N}]+/gu, "");
        const nextPlain = nextText.replace(/[^\p{L}\p{N}]+/gu, "");
        let weight = 0.18;

        if (/[.!?…]$/.test(previousText)) {
            weight += 1.55;
        } else if (/[,:;]$/.test(previousText)) {
            weight += 0.78;
        }

        if (previousPlain.length >= 6) {
            weight += 0.28;
        }

        if (nextPlain.length >= 6) {
            weight += 0.18;
        }

        if (/^(và|nhưng|rồi|nên|mà|để|hay)$/i.test(nextPlain)) {
            weight += 0.16;
        }

        return Math.max(weight, 0);
    }

    resolveCleanPhraseAudioTiming(entryOrDuration = 160, index = 0, totalWords = 1) {
        const entry = typeof entryOrDuration === "object" && entryOrDuration
            ? entryOrDuration
            : null;
        const safeDuration = Math.max(
            Number(entry?.endTime) - Number(entry?.startTime)
            || Number(entryOrDuration)
            || 0,
            80
        );
        const bass = this.clampAudioValue(this.audioReactiveState.bass);
        const pulse = this.clampAudioValue(this.audioReactiveState.pulse);
        const overall = this.clampAudioValue(this.audioReactiveState.overall);
        const transient = this.clampAudioValue(this.audioReactiveState.transient);
        const rawSpeedFactor = this.clampKineticSpeedFactor(this.displayState.kineticSpeedFactor);
        const energy = this.clampAudioValue((bass * 0.28) + (pulse * 0.2) + (transient * 0.34) + (overall * 0.18));
        const syntheticFactor = entry?.syntheticTiming ? 1 : 0;
        const confidence = Number.isFinite(Number(entry?.confidence))
            ? this.clampAudioValue(Number(entry.confidence))
            : (syntheticFactor ? 0.26 : 0.78);
        const stableTiming = !syntheticFactor && confidence >= 0.45;
        const speedFactor = stableTiming
            ? (1 + ((rawSpeedFactor - 1) * 0.18))
            : rawSpeedFactor;
        const edgeFactor = totalWords > 1 && (index === 0 || index === totalWords - 1) ? 1.06 : 1;
        const slowWordFactor = this.clampAudioValue((safeDuration - 220) / 760);
        const pauseBefore = Math.min(Math.max(Number(entry?.gapBeforeMs) || 0, 0), 240);
        const pauseAfter = Math.min(Math.max(Number(entry?.gapAfterMs) || 0, 0), 260);
        const pauseBias = stableTiming
            ? Math.min((pauseBefore * 0.032) + (pauseAfter * 0.016), 7)
            : Math.min((pauseBefore * 0.08) + (pauseAfter * 0.04), syntheticFactor ? 22 : 12);
        const anticipationBase = syntheticFactor
            ? Math.min(Math.max(safeDuration * (0.098 + (slowWordFactor * 0.052)), 36), 122)
            : (
                stableTiming
                    ? Math.min(Math.max(safeDuration * (0.036 + (slowWordFactor * 0.014)), 16), 46)
                    : Math.min(Math.max(safeDuration * (0.058 + (slowWordFactor * 0.032)), 18), 74)
            );
        const confidenceBias = (1 - confidence) * (syntheticFactor ? 24 : (stableTiming ? 3 : 10));
        const audioBias = syntheticFactor
            ? Math.min((transient * 18) + (pulse * 8) + (energy * 7), 26)
            : (
                stableTiming
                    ? Math.min((transient * 2.6) + (pulse * 1.2) + (energy * 1.1), 3.8)
                    : Math.min((transient * 5) + (pulse * 2) + (energy * 2), 7)
            );
        const speedLeadBoost = (speedFactor - 1) * Math.min(
            Math.max(safeDuration * (stableTiming ? 0.04 : 0.11), stableTiming ? 4 : 8),
            syntheticFactor ? 30 : (stableTiming ? 9 : 18)
        );
        const anticipationMs = Math.max(
            0,
            (anticipationBase + confidenceBias + pauseBias + audioBias + speedLeadBoost) * edgeFactor
        );
        const holdBase = syntheticFactor
            ? Math.min(Math.max(safeDuration * (0.014 - (slowWordFactor * 0.006)), 0), 8)
            : (
                stableTiming
                    ? Math.min(Math.max(safeDuration * (0.002 - (slowWordFactor * 0.0012)), 0), 2)
                    : Math.min(Math.max(safeDuration * (0.006 - (slowWordFactor * 0.003)), 0), 4)
            );
        const holdAfterMs = Math.max(
            0,
            ((holdBase + (pauseAfter * (syntheticFactor ? 0.02 : (stableTiming ? 0.002 : 0.008)))) * (1 - (energy * 0.5) - (transient * (stableTiming ? 0.06 : 0.12))))
            / Math.max(speedFactor, 0.72)
        );
        const progressFactor = syntheticFactor
            ? (0.76 + (speedFactor * 0.24))
            : (
                stableTiming
                    ? (0.98 + ((speedFactor - 1) * 0.08))
                    : (0.9 + ((speedFactor - 1) * 0.22))
            );

        return {
            anticipationMs,
            holdAfterMs,
            progressFactor
        };
    }

    rebalanceCleanPhraseWords(words = [], lineStart = 0, lineEnd = null) {
        if (!Array.isArray(words) || words.length === 0) {
            return [];
        }

        const safeLineStart = Number.isFinite(lineStart)
            ? lineStart
            : Number(words[0]?.startTime ?? words[0]?.timeMs ?? 0) || 0;
        const safeLineEnd = Number.isFinite(lineEnd) && lineEnd > safeLineStart
            ? lineEnd
            : safeLineStart + Math.max(words.length * 220, 1600);
        const usableDuration = Math.max(safeLineEnd - safeLineStart, words.length * 120);
        const holdBackMs = Math.min(Math.max(usableDuration * 0.09, 120), 320);
        const activeDuration = Math.max(usableDuration - holdBackMs, words.length * 110);
        const weights = words.map((word, index) => {
            const text = String(word?.text || "");
            const plain = text.replace(/[^\p{L}\p{N}]+/gu, "");
            const charCount = Math.max(plain.length, 1);
            const punctuationBoost = /[,.!?;:…]$/.test(text) ? 0.28 : 0;
            const vowelBoost = /[aeiouyăâêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(text)
                ? 0.08
                : 0;
            const endBoost = index === words.length - 1 ? 0.12 : 0;
            return Math.min(3.1, 0.82 + (Math.min(charCount, 8) * 0.18) + punctuationBoost + vowelBoost + endBoost);
        });
        const rhythmWeights = words.map((word, index) => this.estimateCleanPhraseWordWeight(word?.text, index, words.length));
        const pauseWeights = words.slice(0, -1).map((word, index) => this.estimateCleanPhrasePauseWeight(word, words[index + 1]));
        const totalPauseWeight = pauseWeights.reduce((sum, weight) => sum + weight, 0);
        const pauseBudget = words.length > 1
            ? Math.min(
                Math.max(usableDuration * 0.16, 90),
                Math.max(140, Math.min(usableDuration * 0.28, 460))
            )
            : 0;
        const wordDurationBudget = Math.max(activeDuration - pauseBudget, words.length * 95);
        const totalWeight = rhythmWeights.reduce((sum, weight) => sum + weight, 0) || 1;
        let cursor = safeLineStart;

        return words.map((word, index) => {
            const slice = Math.max(88, Math.round((wordDurationBudget * rhythmWeights[index]) / totalWeight));
            const startTime = index === 0 ? safeLineStart : cursor;
            const rawEndTime = index === words.length - 1
                ? safeLineStart + activeDuration
                : Math.max(startTime + 80, cursor + slice);
            const boundaryPause = index < pauseWeights.length && totalPauseWeight > 0
                ? Math.round((pauseBudget * pauseWeights[index]) / totalPauseWeight)
                : 0;
            const endTime = index === words.length - 1
                ? safeLineEnd
                : Math.max(rawEndTime, startTime + 80);
            const remainingWords = Math.max(words.length - index - 1, 0);
            const latestCursor = safeLineEnd - (remainingWords * 84);
            cursor = Math.min(endTime + boundaryPause, latestCursor);

            return {
                ...word,
                startTime,
                endTime,
                timeMs: startTime
            };
        });
    }

    mergeMicroCleanPhraseChunks(chunks = []) {
        if (!Array.isArray(chunks) || chunks.length <= 1) {
            return chunks;
        }

        const merged = [];
        chunks.forEach((chunk) => {
            const previousChunk = merged[merged.length - 1] || null;
            if (!previousChunk) {
                merged.push(chunk);
                return;
            }

            const chunkDuration = Math.max((chunk.endTime ?? 0) - (chunk.startTime ?? 0), 0);
            const previousDuration = Math.max((previousChunk.endTime ?? 0) - (previousChunk.startTime ?? 0), 0);
            const combinedWords = (previousChunk.words?.length || 0) + (chunk.words?.length || 0);
            const combinedDuration = Math.max((chunk.endTime ?? 0) - (previousChunk.startTime ?? 0), 0);
            const shouldMerge = (
                ((chunk.words?.length || 0) <= 4 || chunkDuration < 980 || previousDuration < 920)
                && combinedWords <= 15
                && combinedDuration <= 4200
                && previousChunk.lineIndex === chunk.lineIndex
            );

            if (!shouldMerge) {
                merged.push(chunk);
                return;
            }

            const mergedWords = [...(previousChunk.words || []), ...(chunk.words || [])];
            merged[merged.length - 1] = {
                ...previousChunk,
                text: mergedWords.map((word) => word.text).join(" "),
                words: mergedWords,
                startTime: previousChunk.startTime,
                endTime: chunk.endTime,
                syntheticTiming: Boolean(previousChunk.syntheticTiming || chunk.syntheticTiming),
                averageConfidence: (() => {
                    const confidenceValues = mergedWords
                        .map((word) => Number(word?.confidence))
                        .filter((value) => Number.isFinite(value));
                    if (confidenceValues.length === 0) {
                        return Number.isFinite(previousChunk.averageConfidence)
                            ? previousChunk.averageConfidence
                            : chunk.averageConfidence;
                    }
                    return confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length;
                })()
            };
        });

        return merged.map((chunk, index) => ({
            ...chunk,
            id: `${chunk.lineIndex}:${index}`
        }));
    }

    buildRefinedCleanPhraseChunks() {
        const sourceLines = this.karaokeLines.length > 0
            ? this.karaokeLines
            : this.lines.map((line) => ({
                lineStartMs: line.timeMs,
                text: line.text,
                words: Array.isArray(line.words) ? line.words : []
            }));
        const chunks = [];
        const maxWordsSetting = this.clampKineticMaxWordsPerLine(this.displayState.kineticMaxWordsPerLine);
        const maxCharsSetting = this.clampKineticMaxCharsPerLine(this.displayState.kineticMaxCharsPerLine);
        const maxWordsPerChunk = maxWordsSetting <= 0 ? 14 : Math.max(maxWordsSetting, 10);
        const maxCharsPerChunk = maxCharsSetting <= 0 ? 58 : Math.max(maxCharsSetting, 36);
        const gapThresholdMs = 620;
        const maxChunkDurationMs = 3600;
        const minChunkDurationMs = 1160;

        sourceLines.forEach((line, lineIndex) => {
            const nextLine = sourceLines[lineIndex + 1] || null;
            const fallbackStart = Number(line?.lineStartMs ?? line?.timeMs ?? 0);
            const fallbackEnd = Number(nextLine?.lineStartMs ?? sourceLines[lineIndex + 1]?.timeMs ?? (fallbackStart + 2200));
            let words = this.normalizeTimedWords(Array.isArray(line?.words) ? line.words : [], fallbackStart, fallbackEnd);

            if (words.length === 0) {
                words = String(line?.text || "")
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((text, index, list) => {
                        const sliceDuration = Math.max((fallbackEnd - fallbackStart) / Math.max(list.length, 1), 160);
                        const startTime = Math.round(fallbackStart + (sliceDuration * index));
                        const endTime = Math.round(
                            index === list.length - 1
                                ? fallbackEnd
                                : fallbackStart + (sliceDuration * (index + 1))
                        );
                        return {
                            text,
                            startTime,
                            endTime: Math.max(endTime, startTime + 80),
                            timeMs: startTime,
                            index
                        };
                    });
            }

            const syntheticTiming = this.looksSyntheticWordTiming(words);
            if (syntheticTiming) {
                words = this.rebalanceCleanPhraseWords(words, fallbackStart, fallbackEnd);
            }

            let currentChunkWords = [];
            let currentChars = 0;
            const finalizeChunk = () => {
                if (currentChunkWords.length === 0) {
                    return;
                }

                const chunkWords = currentChunkWords.map((word) => ({ ...word }));
                chunks.push({
                    id: `${lineIndex}:${chunks.length}`,
                    lineIndex,
                    text: chunkWords.map((word) => word.text).join(" "),
                    words: chunkWords,
                    startTime: chunkWords[0].startTime,
                    endTime: chunkWords[chunkWords.length - 1].endTime,
                    syntheticTiming,
                    averageConfidence: chunkWords.reduce((sum, chunkWord) => (
                        sum + (
                            Number.isFinite(Number(chunkWord?.confidence))
                                ? Number(chunkWord.confidence)
                                : 0
                        )
                    ), 0) / Math.max(
                        1,
                        chunkWords.filter((chunkWord) => Number.isFinite(Number(chunkWord?.confidence))).length
                    )
                });
                currentChunkWords = [];
                currentChars = 0;
            };

            words.forEach((word, index) => {
                currentChunkWords.push(word);
                currentChars += String(word.text || "").length;

                const nextWord = words[index + 1] || null;
                const chunkStartTime = currentChunkWords[0]?.startTime ?? currentChunkWords[0]?.timeMs ?? fallbackStart;
                const chunkEndTime = word.endTime ?? word.startTime ?? word.timeMs ?? chunkStartTime;
                const chunkDuration = Math.max(chunkEndTime - chunkStartTime, 0);
                const gapToNext = nextWord
                    ? Math.max((nextWord.startTime ?? nextWord.timeMs ?? 0) - (word.endTime ?? word.startTime ?? 0), 0)
                    : 0;
                const punctuationBreak = /[,.!?;:â€¦]$/.test(word.text || "");
                const punctuationBreakStrong = punctuationBreak
                    && (
                        currentChunkWords.length >= 5
                        || currentChars >= Math.min(maxCharsPerChunk, 28)
                        || gapToNext >= 180
                    );
                const hardWordLimit = currentChunkWords.length >= maxWordsPerChunk && chunkDuration >= minChunkDurationMs;
                const hardCharLimit = currentChars >= maxCharsPerChunk && currentChunkWords.length >= 5 && chunkDuration >= (minChunkDurationMs * 0.7);
                const pauseBreak = gapToNext >= gapThresholdMs && currentChunkWords.length >= 3;
                const longDurationBreak = chunkDuration >= maxChunkDurationMs && currentChunkWords.length >= 6;
                const isLastWord = index === words.length - 1;

                if (
                    punctuationBreakStrong
                    || hardWordLimit
                    || hardCharLimit
                    || pauseBreak
                    || longDurationBreak
                    || isLastWord
                ) {
                    finalizeChunk();
                }
            });
        });

        return this.mergeMicroCleanPhraseChunks(chunks);
    }

    buildCleanPhraseChunks() {
        const sourceLines = this.karaokeLines.length > 0
            ? this.karaokeLines
            : this.lines.map((line) => ({
                lineStartMs: line.timeMs,
                text: line.text,
                words: Array.isArray(line.words) ? line.words : []
            }));
        const chunks = [];
        const maxWordsSetting = this.clampKineticMaxWordsPerLine(this.displayState.kineticMaxWordsPerLine);
        const maxCharsSetting = this.clampKineticMaxCharsPerLine(this.displayState.kineticMaxCharsPerLine);
        const maxWordsPerChunk = maxWordsSetting <= 0 ? Number.POSITIVE_INFINITY : maxWordsSetting;
        const maxCharsPerChunk = maxCharsSetting <= 0 ? Number.POSITIVE_INFINITY : maxCharsSetting;
        const gapThresholdMs = 340;

        sourceLines.forEach((line, lineIndex) => {
            const nextLine = sourceLines[lineIndex + 1] || null;
            const fallbackStart = Number(line?.lineStartMs ?? line?.timeMs ?? 0);
            const fallbackEnd = Number(nextLine?.lineStartMs ?? sourceLines[lineIndex + 1]?.timeMs ?? (fallbackStart + 2200));
            let words = this.normalizeTimedWords(Array.isArray(line?.words) ? line.words : [], fallbackStart, fallbackEnd);

            if (words.length === 0) {
                const fallbackTextWords = String(line?.text || "")
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((text, index, list) => {
                        const sliceDuration = Math.max((fallbackEnd - fallbackStart) / Math.max(list.length, 1), 160);
                        const startTime = Math.round(fallbackStart + (sliceDuration * index));
                        const endTime = Math.round(
                            index === list.length - 1
                                ? fallbackEnd
                                : fallbackStart + (sliceDuration * (index + 1))
                        );
                        return {
                            text,
                            startTime,
                            endTime: Math.max(endTime, startTime + 80),
                            timeMs: startTime,
                            index
                        };
                    });
                words = fallbackTextWords;
            }

            let currentChunkWords = [];
            let currentChars = 0;
            const finalizeChunk = () => {
                if (currentChunkWords.length === 0) {
                    return;
                }

                const chunkWords = currentChunkWords.map((word) => ({ ...word }));
                const startTime = chunkWords[0].startTime;
                const endTime = chunkWords[chunkWords.length - 1].endTime;
                chunks.push({
                    id: `${lineIndex}:${chunks.length}`,
                    lineIndex,
                    text: chunkWords.map((word) => word.text).join(" "),
                    words: chunkWords,
                    startTime,
                    endTime
                });
                currentChunkWords = [];
                currentChars = 0;
            };

            words.forEach((word, index) => {
                currentChunkWords.push(word);
                currentChars += String(word.text || "").length;

                const nextWord = words[index + 1] || null;
                const gapToNext = nextWord
                    ? Math.max((nextWord.startTime ?? nextWord.timeMs ?? 0) - (word.endTime ?? word.startTime ?? 0), 0)
                    : 0;
                const punctuationBreak = /[,.!?;:…]$/.test(word.text || "");
                const hardWordLimit = currentChunkWords.length >= maxWordsPerChunk;
                const hardCharLimit = currentChars >= maxCharsPerChunk && currentChunkWords.length >= 2;
                const pauseBreak = gapToNext >= gapThresholdMs && currentChunkWords.length >= 2;
                const isLastWord = index === words.length - 1;

                if (punctuationBreak || hardWordLimit || hardCharLimit || pauseBreak || isLastWord) {
                    finalizeChunk();
                }
            });
        });

        return chunks;
    }

    resolveCleanPhraseContext(timeMs) {
        if (!Array.isArray(this.cleanPhraseChunks) || this.cleanPhraseChunks.length === 0) {
            return {
                previous: null,
                current: null,
                next: null,
                beforeFirst: false
            };
        }

        const firstChunk = this.cleanPhraseChunks[0];
        if (timeMs < firstChunk.startTime) {
            return {
                previous: null,
                current: null,
                next: firstChunk,
                beforeFirst: true
            };
        }

        let currentIndex = this.cleanPhraseChunks.length - 1;
        for (let index = 0; index < this.cleanPhraseChunks.length; index += 1) {
            const chunk = this.cleanPhraseChunks[index];
            const nextChunk = this.cleanPhraseChunks[index + 1] || null;
            const chunkEnd = Number.isFinite(chunk.endTime)
                ? chunk.endTime
                : Number.isFinite(nextChunk?.startTime)
                    ? nextChunk.startTime
                    : chunk.startTime + 400;
            if (timeMs >= chunk.startTime && timeMs < chunkEnd) {
                currentIndex = index;
                break;
            }
            if (nextChunk && timeMs < nextChunk.startTime) {
                currentIndex = index;
                break;
            }
        }

        return {
            previous: currentIndex > 0 ? this.cleanPhraseChunks[currentIndex - 1] : null,
            current: this.cleanPhraseChunks[currentIndex] || null,
            next: currentIndex + 1 < this.cleanPhraseChunks.length ? this.cleanPhraseChunks[currentIndex + 1] : null,
            beforeFirst: false
        };
    }

    rebuildCleanPhraseChunks(shouldRerender = false) {
        if (!this.isLoaded) {
            return;
        }

        this.cleanPhraseChunks = this.buildRefinedCleanPhraseChunks();
        if (shouldRerender && this.displayState.kineticMode && this.displayState.kineticStyle === "clean-phrase") {
            this.renderAtTime(this.audio.currentTime * 1000, true);
        }
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

        const cleanPhraseContext = this.displayState.kineticMode && this.displayState.kineticStyle === "clean-phrase"
            ? this.resolveCleanPhraseContext(timeMs)
            : null;
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
        const activeKaraokeLine = this.resolveKaraokeLine(activeLine, currentIndex >= 0 ? currentIndex : 0);
        const nextPreviousText = previous?.text || "";
        const nextCurrentText = current?.text || this.lines[0]?.text || "";
        const nextUpcomingText = next?.text || "";
        const nextMetaText = current ? `${this.formatMs(current.timeMs)} synced` : "";
        const renderSignature = this.displayState.kineticMode
            ? (
                this.displayState.kineticStyle === "clean-phrase"
                    ? (
                        cleanPhraseContext?.beforeFirst && !this.audio.paused
                            ? `clean-phrase:preroll:${cleanPhraseContext?.next?.id ?? -1}`
                            : `clean-phrase:line:${cleanPhraseContext?.previous?.id ?? -1}:${cleanPhraseContext?.current?.id ?? -1}:${cleanPhraseContext?.next?.id ?? -1}`
                    )
                    : (
                        beforeFirstLine && !this.audio.paused
                            ? `kinetic:preroll:${firstLine?.timeMs ?? -1}:${this.displayState.kineticMaxWordsPerLine}:${this.displayState.kineticMaxCharsPerLine}`
                            : `kinetic:line:${activeLine?.timeMs ?? -1}:${this.displayState.kineticMaxWordsPerLine}:${this.displayState.kineticMaxCharsPerLine}`
                    )
            )
            : `classic:${previous?.timeMs ?? -1}:${activeLine?.timeMs ?? -1}:${next?.timeMs ?? -1}`;
        const didChange = force
            || renderSignature !== this.lastRenderedSignature
            || this.shell.classList.contains("is-placeholder");

        if (didChange) {
            this.shell.classList.remove("is-placeholder");
            if (this.displayState.kineticMode) {
                if (this.displayState.kineticStyle === "clean-phrase") {
                    if (cleanPhraseContext?.beforeFirst && !this.audio.paused) {
                        this.renderCleanPhrasePreroll(cleanPhraseContext.next || null);
                    } else {
                        this.renderCleanPhraseLine({
                            previousChunk: cleanPhraseContext?.previous || null,
                            currentChunk: cleanPhraseContext?.current || null,
                            nextChunk: cleanPhraseContext?.next || null,
                            timeMs,
                            force: true
                        });
                    }
                    if (this.meta) {
                        this.meta.textContent = "";
                    }
                } else if (beforeFirstLine && !this.audio.paused) {
                    this.previousLine.textContent = "";
                    this.nextLine.textContent = "";
                    this.renderKineticPreroll();
                    if (this.meta) {
                        this.meta.textContent = "";
                    }
                } else {
                    this.previousLine.textContent = "";
                    this.nextLine.textContent = "";
                    const kineticTiming = this.resolveKineticTiming(
                        activeLine,
                        followingLine,
                        previous,
                        this.countKineticWords(nextCurrentText, activeKaraokeLine),
                        activeKaraokeLine
                    );
                    this.renderKineticCurrentLine(
                        nextCurrentText,
                        kineticTiming,
                        activeKaraokeLine
                    );
                    if (this.meta) {
                        this.meta.textContent = nextMetaText;
                    }
                    this.syncKineticProgress(timeMs, kineticTiming);
                }
            } else {
                this.clearKineticLine();
                this.previousLine.textContent = this.formatClassicTextRows(nextPreviousText);
                this.renderClassicCurrentLine(this.formatClassicTextRows(nextCurrentText));
                this.nextLine.textContent = this.formatClassicTextRows(nextUpcomingText);
                if (this.meta) {
                    this.meta.textContent = nextMetaText;
                }
            }
            this.lastRenderedSignature = renderSignature;
            this.scheduleOverflowLayout();
        } else if (
            this.displayState.kineticMode
            && this.displayState.kineticStyle === "clean-phrase"
            && !(cleanPhraseContext?.beforeFirst)
        ) {
            this.syncCleanPhraseProgress(timeMs);
        } else if (
            this.displayState.kineticMode
            && this.displayState.kineticStyle !== "clean-phrase"
            && !beforeFirstLine
        ) {
            const kineticTiming = this.resolveKineticTiming(
                activeLine,
                followingLine,
                previous,
                this.countKineticWords(nextCurrentText, activeKaraokeLine),
                activeKaraokeLine
            );
            this.syncKineticProgress(timeMs, kineticTiming);
        }
    }

    renderPlaceholder(title, body, meta) {
        this.isLoaded = false;
        this.shell.classList.add("is-placeholder");
        this.clearKineticLine();
        this.previousLine.textContent = "";
        this.renderClassicCurrentLine(title);
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

    renderClassicCurrentLine(text) {
        const normalizedText = String(text || "");
        const parts = normalizedText.split(/(\s+)/u).filter((part) => part.length > 0);

        if (parts.length === 0) {
            this.currentLine.replaceChildren();
            this.currentLine.textContent = "";
            this.currentLine.dataset.renderedText = "";
            this.applyCurrentTextPresentation();
            return;
        }

        const fragment = document.createDocumentFragment();
        parts.forEach((part) => {
            if (/^\s+$/u.test(part)) {
                fragment.appendChild(document.createTextNode(part));
                return;
            }

            const wordNode = document.createElement("span");
            wordNode.className = "lyric-word";
            wordNode.textContent = part;
            wordNode.dataset.token = part;
            fragment.appendChild(wordNode);
        });

        this.currentLine.replaceChildren(fragment);
        this.currentLine.dataset.renderedText = normalizedText;
        this.currentLine.setAttribute("aria-label", normalizedText);
        this.applyCurrentTextPresentation();
        this.animateCurrentLine();
    }

    formatClassicTextRows(text) {
        const normalized = String(text || "").replace(/\s+/gu, " ").trim();
        if (!normalized) {
            return "";
        }

        const words = normalized
            .split(/\s+/u)
            .filter(Boolean)
            .map((word) => ({ text: word }));
        const rowGroups = this.chunkKineticWords(
            words,
            this.clampKineticMaxWordsPerLine(this.displayState.kineticMaxWordsPerLine),
            this.clampKineticMaxCharsPerLine(this.displayState.kineticMaxCharsPerLine)
        );

        return rowGroups
            .map((row) => row.map((word) => word.text || "").join(" ").trim())
            .filter(Boolean)
            .join("\n");
    }

    animateCurrentLine() {
        const gsap = window.gsap;
        if (!gsap || this.displayState.kineticMode) {
            return;
        }

        const wordNodes = Array.from(this.currentLine?.querySelectorAll(".lyric-word") || []);
        if (wordNodes.length === 0) {
            return;
        }

        gsap.killTweensOf(wordNodes);
        gsap.killTweensOf(".kinetic-accent-particle");
        const snapConfig = this.isPixelGameStyle()
            ? { snap: { x: 1, y: 1 } }
            : {};

        wordNodes.forEach((wordNode, index) => {
            const startDelay = index * 0.06;
            const glowDuration = 0.3;

            gsap.fromTo(wordNode, {
                opacity: 0,
                y: 20,
                scale: 0.88,
                filter: "brightness(2) blur(5px)",
                force3D: true
            }, {
                opacity: 1,
                y: 0,
                scale: 1,
                filter: "brightness(1) blur(0px)",
                duration: glowDuration,
                delay: startDelay,
                ease: "elastic.out(1, 0.3)",
                force3D: true,
                overwrite: "auto",
                ...snapConfig,
                clearProps: "opacity,filter,transform",
                onStart: () => {
                    const rect = wordNode.getBoundingClientRect();
                    const lineRect = this.currentLine.getBoundingClientRect();
                    const x = rect.left - lineRect.left + (rect.width * 0.5);
                    const y = rect.top - lineRect.top + (rect.height * 0.5);
                    this.createParticles(x, y);
                    this.animateWordColorFlow(wordNode, glowDuration);
                }
            });
        });
    }

    countKineticWords(text, karaokeLine = null) {
        const words = this.resolveKineticWords(text, karaokeLine);
        return Math.max(1, words.length);
    }

    resolveKineticTiming(currentLine, nextLine, previousLine, wordCount, karaokeLine = null) {
        const availableMs = this.resolveKineticLineDuration(currentLine, nextLine, previousLine);
        const availableSeconds = availableMs / 1000;
        const usableSeconds = Math.max(
            0.2,
            Math.min(availableSeconds * 0.68, Math.max(availableSeconds - 0.14, 0.2))
        );
        const safeWordCount = Math.max(1, Number.isFinite(wordCount) ? wordCount : 1);
        const speedFactor = this.clampKineticSpeedFactor(this.displayState.kineticSpeedFactor);
        const staggerSeconds = Math.min(0.85, Math.max(0.02, (usableSeconds / safeWordCount) / speedFactor));
        const entryLeadSeconds = Math.min(
            Math.max(staggerSeconds * 0.72, 0.1),
            Math.max(staggerSeconds * 0.96, 0.12)
        );

        return {
            lineStartMs: Number.isFinite(karaokeLine?.lineStartMs)
                ? karaokeLine.lineStartMs
                : Number.isFinite(currentLine?.timeMs)
                    ? currentLine.timeMs
                    : 0,
            availableMs,
            availableSeconds,
            usableSeconds,
            wordCount: safeWordCount,
            staggerSeconds,
            speedFactor,
            entryLeadSeconds,
            wordTimeMsList: Array.isArray(karaokeLine?.words)
                ? karaokeLine.words
                    .map((word) => Number(word?.timeMs))
                    .filter((time) => Number.isFinite(time))
                : []
        };
    }

    resolveKineticWords(text, karaokeLine = null) {
        const karaokeWords = Array.isArray(karaokeLine?.words)
            ? karaokeLine.words
                .map((word, index) => ({
                    text: String(word?.text || "").trim(),
                    timeMs: Number.isFinite(Number(word?.timeMs)) ? Number(word.timeMs) : null,
                    leadMs: Number.isFinite(Number(word?.leadMs)) ? Number(word.leadMs) : null,
                    entryMs: Number.isFinite(Number(word?.entryMs)) ? Number(word.entryMs) : null,
                    slideMs: Number.isFinite(Number(word?.slideMs)) ? Number(word.slideMs) : null,
                    emphasis: Number.isFinite(Number(word?.emphasis)) ? Number(word.emphasis) : null,
                    styleHint: typeof word?.styleHint === "string" ? word.styleHint : null,
                    index
                }))
                .filter((word) => word.text)
            : [];
        const fallbackWords = String(text || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((word, index) => ({
                text: word,
                timeMs: null,
                leadMs: null,
                entryMs: null,
                slideMs: null,
                emphasis: null,
                styleHint: null,
                index
            }));
        const safeWords = karaokeWords.length > 0 ? karaokeWords : fallbackWords;

        if (safeWords.length > 0) {
            return safeWords;
        }

        return [{
            text: "...",
            timeMs: Number.isFinite(karaokeLine?.lineStartMs) ? karaokeLine.lineStartMs : null,
            leadMs: null,
            entryMs: null,
            slideMs: null,
            emphasis: null,
            styleHint: null,
            index: 0
        }];
    }

    enrichKineticWordProfiles(words = [], kineticTiming = null) {
        if (!Array.isArray(words) || words.length === 0) {
            return [];
        }

        const fallbackGapMs = Math.max(
            90,
            (
                Number.isFinite(kineticTiming?.staggerSeconds)
                    ? kineticTiming.staggerSeconds
                    : 0.16
            ) * 1000
        );
        const lineStartMs = Number.isFinite(kineticTiming?.lineStartMs)
            ? kineticTiming.lineStartMs
            : Number.isFinite(words[0]?.timeMs)
                ? words[0].timeMs
                : 0;
        const lineEndMs = Number.isFinite(kineticTiming?.availableMs)
            ? lineStartMs + kineticTiming.availableMs
            : (
                Number.isFinite(words[words.length - 1]?.timeMs)
                    ? words[words.length - 1].timeMs + fallbackGapMs
                    : lineStartMs + 2200
            );

        return words.map((word, index) => {
            const currentTimeMs = Number.isFinite(word?.timeMs)
                ? Number(word.timeMs)
                : Math.round(lineStartMs + (fallbackGapMs * index));
            const nextWord = words.slice(index + 1).find((candidate) => Number.isFinite(candidate?.timeMs)) || null;
            const previousWord = index > 0 ? words[index - 1] : null;
            const nextGapMs = Number.isFinite(nextWord?.timeMs)
                ? Math.max(nextWord.timeMs - currentTimeMs, 90)
                : Math.max(lineEndMs - currentTimeMs, fallbackGapMs);
            const previousGapMs = Number.isFinite(previousWord?.timeMs)
                ? Math.max(currentTimeMs - previousWord.timeMs, 90)
                : nextGapMs;
            const safeGapMs = Math.min(Math.max(nextGapMs, 90), 900);
            const punctuationBoost = /[,.!?;:…]$/.test(word?.text || "") ? 0.18 : 0;
            const inferredEmphasis = Math.min(
                1,
                Math.max(
                    0,
                    (
                        (safeGapMs >= 420 ? 0.26 : 0)
                        + (previousGapMs >= 420 ? 0.1 : 0)
                        + punctuationBoost
                    )
                )
            );
            const emphasis = Number.isFinite(word?.emphasis)
                ? Math.min(Math.max(Number(word.emphasis), 0), 1)
                : inferredEmphasis;
            const leadMs = Number.isFinite(word?.leadMs)
                ? Math.max(Number(word.leadMs), 0)
                : Math.round(Math.min(Math.max(safeGapMs * (0.2 + (emphasis * 0.08)), 28), 170));
            const entryMs = Number.isFinite(word?.entryMs)
                ? Math.max(Number(word.entryMs), 80)
                : Math.round(Math.min(Math.max(safeGapMs * (0.5 + (emphasis * 0.08)), 120), 580));
            const slideMs = Number.isFinite(word?.slideMs)
                ? Math.max(Number(word.slideMs), 90)
                : Math.round(Math.min(Math.max(safeGapMs * (0.42 + (emphasis * 0.1)), 120), 620));
            const styleHint = typeof word?.styleHint === "string" && word.styleHint
                ? word.styleHint
                : (
                    safeGapMs >= 420
                        ? "float"
                        : safeGapMs <= 170
                            ? "tight"
                            : "soft"
                );

            return {
                ...word,
                timeMs: currentTimeMs,
                leadMs,
                entryMs,
                slideMs,
                emphasis,
                styleHint
            };
        });
    }

    prepareKineticLine(text, karaokeLine = null, kineticTiming = null) {
        const safeWords = this.enrichKineticWordProfiles(
            this.resolveKineticWords(text, karaokeLine),
            kineticTiming
        );
        const maxWordsPerLine = this.clampKineticMaxWordsPerLine(this.displayState.kineticMaxWordsPerLine);
        const maxCharsPerLine = this.clampKineticMaxCharsPerLine(this.displayState.kineticMaxCharsPerLine);
        const rowGroups = this.chunkKineticWords(safeWords, maxWordsPerLine, maxCharsPerLine);
        return {
            frames: this.chunkKineticFrames(rowGroups, this.resolveKineticRowsPerFrame()),
            count: safeWords.length,
            words: safeWords
        };
    }

    renderKineticCurrentLine(text, kineticTiming = null, karaokeLine = null) {
        const { frames, words } = this.prepareKineticLine(text, karaokeLine, kineticTiming);
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
        this.applyCurrentTextPresentation();
        this.runKineticAnimation(stack, frames, kineticTiming, words);
    }

    renderCleanPhrasePreroll(nextChunk = null) {
        this.clearKineticLine();
        this.kineticPhase = "preroll";
        this.currentLine.classList.add("is-kinetic-line", "is-clean-phrase-line");
        this.previousLine.textContent = "";
        this.nextLine.textContent = "";

        const dots = document.createElement("div");
        dots.className = "phrase-preroll";
        const dotNodes = Array.from({ length: 3 }, (_, index) => {
            const node = document.createElement("span");
            node.className = "phrase-dot";
            node.style.setProperty("--phrase-dot-index", String(index));
            return node;
        });
        dots.replaceChildren(...dotNodes);

        this.currentLine.replaceChildren(dots);
        this.currentLine.dataset.renderedText = "";
        this.currentLine.setAttribute("aria-label", nextChunk?.text ? `Upcoming lyric ${nextChunk.text}` : "Waiting for next lyric");
        if (nextChunk?.text) {
            this.nextLine.textContent = nextChunk.text;
        }

        this.cleanPhraseState = {
            phraseKey: null,
            entries: [],
            activeWordIndex: -1
        };

        if (!window.gsap) {
            return;
        }

        this.kineticPrerollTimeline = window.gsap.timeline({ repeat: -1 });
        this.kineticPrerollTimeline.to(dotNodes, {
            y: -5,
            opacity: 1,
            duration: 0.3,
            ease: "sine.out",
            stagger: 0.1
        }).to(dotNodes, {
            y: 0,
            opacity: 0.34,
            duration: 0.36,
            ease: "sine.in",
            stagger: 0.1
        }, 0.16);
    }

    buildCleanPhraseEntries(words = [], nextLineTimeMs = null, options = {}) {
        const syntheticTiming = Boolean(options.syntheticTiming);
        const averageConfidence = Number.isFinite(Number(options.averageConfidence))
            ? Number(options.averageConfidence)
            : null;
        return words.map((word, index) => {
            const nextWord = words[index + 1] || null;
            const previousWord = index > 0 ? words[index - 1] : null;
            const startTime = Number.isFinite(word.startTime) ? word.startTime : 0;
            const resolvedEnd = Number.isFinite(word.endTime)
                ? word.endTime
                : Number.isFinite(nextWord?.startTime)
                    ? nextWord.startTime
                    : (
                        Number.isFinite(nextLineTimeMs)
                            ? nextLineTimeMs
                            : startTime + 280
                    );

            const node = document.createElement("span");
            node.className = "clean-phrase-word";
            node.textContent = word.text;
            node.dataset.token = word.text;
            node.style.setProperty("--clean-phrase-order", String(index));

            return {
                node,
                startTime,
                endTime: Math.max(resolvedEnd, startTime + 80),
                confidence: Number.isFinite(Number(word?.confidence))
                    ? Number(word.confidence)
                    : averageConfidence,
                syntheticTiming,
                gapBeforeMs: Number.isFinite(previousWord?.endTime)
                    ? Math.max(startTime - previousWord.endTime, 0)
                    : 0,
                gapAfterMs: Number.isFinite(nextWord?.startTime)
                    ? Math.max(nextWord.startTime - Math.max(resolvedEnd, startTime + 80), 0)
                    : 0,
                state: "future",
                progressValue: -1,
                displayProgress: 0
            };
        });
    }

    renderCleanPhraseLine({
        previousChunk = null,
        currentChunk = null,
        nextChunk = null,
        timeMs = 0,
        force = false
    } = {}) {
        if (!currentChunk) {
            this.renderCleanPhrasePreroll(nextChunk);
            return;
        }

        const gsap = window.gsap;
        const phraseKey = String(currentChunk?.id ?? "");
        const shouldRebuild = force || !this.cleanPhraseState || this.cleanPhraseState.phraseKey !== phraseKey;

        this.kineticPhase = "line-hold";
        this.currentLine.classList.add("is-kinetic-line", "is-clean-phrase-line");

        if (shouldRebuild) {
            this.clearKineticLine();
            this.currentLine.classList.add("is-kinetic-line", "is-clean-phrase-line");
            this.previousLine.textContent = previousChunk?.text || "";
            this.nextLine.textContent = nextChunk?.text || "";

            const entries = this.buildCleanPhraseEntries(
                currentChunk?.words || [],
                nextChunk?.startTime ?? currentChunk?.endTime ?? null,
                {
                    syntheticTiming: currentChunk?.syntheticTiming,
                    averageConfidence: currentChunk?.averageConfidence
                }
            );
            const stage = document.createElement("div");
            stage.className = "phrase-stage";
            const content = document.createElement("div");
            content.className = "phrase-content";
            content.replaceChildren(...entries.map((entry) => entry.node));
            stage.appendChild(content);
            this.currentLine.replaceChildren(stage);
            this.currentLine.dataset.renderedText = currentChunk?.text || "";
            this.currentLine.setAttribute(
                "aria-label",
                [previousChunk?.text, currentChunk?.text, nextChunk?.text].filter(Boolean).join(". ")
            );
            this.applyCurrentTextPresentation();

            this.cleanPhraseState = {
                phraseKey,
                entries,
                activeWordIndex: -1
            };

            if (gsap) {
                gsap.killTweensOf([this.previousLine, this.currentLine, this.nextLine, this.body]);
                gsap.fromTo(this.currentLine, {
                    opacity: 0,
                    y: 8,
                    filter: "blur(2.2px)"
                }, {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    duration: 0.22,
                    ease: "power2.out",
                    clearProps: "transform,filter"
                });
                if (this.previousLine.textContent) {
                    gsap.fromTo(this.previousLine, {
                        opacity: 0,
                        y: -10,
                        filter: "blur(5px)"
                    }, {
                        opacity: 1,
                        y: 0,
                        filter: "blur(3.6px)",
                        duration: 0.24,
                        ease: "power2.out",
                        clearProps: "transform,filter"
                    });
                }
                if (this.nextLine.textContent) {
                    gsap.fromTo(this.nextLine, {
                        opacity: 0,
                        y: 10,
                        filter: "blur(3.8px)"
                    }, {
                        opacity: 1,
                        y: 0,
                        filter: "blur(2.4px)",
                        duration: 0.24,
                        ease: "power2.out",
                        clearProps: "transform,filter"
                    });
                }
            }

            window.requestAnimationFrame(() => {
                this.scheduleOverflowLayout();
            });
        }

        this.syncCleanPhraseProgress(timeMs);
    }

    applyCleanPhraseWordVisual(entry, nextState, progress = 0) {
        const node = entry?.node;
        if (!node) {
            return;
        }

        node.classList.remove("is-active", "is-sung");

        if (nextState === "sung") {
            node.classList.add("is-sung");
            node.style.removeProperty("--clean-phrase-progress");
            node.style.backgroundPosition = "0% 50%";
            node.style.filter = "brightness(1)";
            node.style.transform = "translate3d(0, 0, 0) scale(1)";
            return;
        }

        if (nextState === "active") {
            node.classList.add("is-active");
            node.style.setProperty("--clean-phrase-progress", `${(progress * 100).toFixed(2)}%`);
            node.style.backgroundPosition = `${(100 - (progress * 100)).toFixed(2)}% 50%`;
            node.style.filter = `brightness(${(1.04 + (progress * 0.10)).toFixed(3)})`;
            node.style.transform = `translate3d(0, 0, 0) scale(${(1.006 + (progress * 0.022)).toFixed(3)})`;
            return;
        }

        node.style.removeProperty("--clean-phrase-progress");
        node.style.removeProperty("background-position");
        node.style.filter = "brightness(0.9)";
        node.style.transform = "translate3d(0, 0, 0) scale(1)";
    }

    syncCleanPhraseProgress(timeMs) {
        const state = this.cleanPhraseState;
        if (!state || !Array.isArray(state.entries) || state.entries.length === 0) {
            return;
        }

        let activeWordIndex = -1;
        state.entries.forEach((entry, index) => {
            const startTime = Number.isFinite(entry.startTime) ? entry.startTime : 0;
            const endTime = Number.isFinite(entry.endTime) ? entry.endTime : startTime + 220;
            const wordDuration = Math.max(endTime - startTime, 80);
            const { anticipationMs, holdAfterMs, progressFactor } = this.resolveCleanPhraseAudioTiming(
                entry,
                index,
                state.entries.length
            );
            const perceivedTimeMs = timeMs + anticipationMs;
            const heldEndTime = endTime + holdAfterMs;
            const rawProgress = ((perceivedTimeMs - startTime) / wordDuration) * progressFactor;
            let nextState = "future";
            let progress = 0;

            if (perceivedTimeMs >= heldEndTime) {
                nextState = "sung";
                progress = 1;
            } else if (perceivedTimeMs >= startTime) {
                nextState = "active";
                progress = perceivedTimeMs >= endTime
                    ? 1
                    : Math.min(Math.max(rawProgress, 0), 1);
                activeWordIndex = index;
            }

            const easedProgress = nextState === "active"
                ? 0.5 - (Math.cos(Math.min(Math.max(progress, 0), 1) * Math.PI) / 2)
                : progress;
            const progressValue = nextState === "active"
                ? Math.round(easedProgress * 1000) / 1000
                : (nextState === "sung" ? 1 : 0);

            if (
                entry.state !== nextState
                || Math.abs((entry.progressValue ?? -1) - progressValue) >= (nextState === "active" ? 0.002 : 0.5)
            ) {
                this.applyCleanPhraseWordVisual(entry, nextState, easedProgress);
                entry.state = nextState;
                entry.progressValue = progressValue;
                entry.displayProgress = easedProgress;
            }
        });

        state.activeWordIndex = activeWordIndex;
    }

    updateCleanPhraseBodyPosition() {
        this.body.style.transform = "";
        this.cleanPhraseBodyOffset = 0;
    }

    runKineticAnimation(stackNode, frames = [], kineticTiming = null, wordPayload = []) {
        if (!Array.isArray(frames) || frames.length === 0 || !stackNode) {
            return;
        }

        const pulse = this.clampAudioValue(this.audioReactiveState.pulse);
        const intensity = this.clampAudioValue(this.audioReactiveState.intensity || 1);
        const energy = this.clampAudioValue((pulse * 0.68 + this.audioReactiveState.overall * 0.32) * intensity);
        const totalWordCount = Math.max(
            1,
            frames.reduce((sum, frameRowGroups) => (
                sum + frameRowGroups.reduce((rowSum, group) => rowSum + group.length, 0)
            ), 0)
        );
        const baseStagger = Math.min(
            0.85,
            Math.max(
                0.04,
                Number.isFinite(kineticTiming?.staggerSeconds)
                    ? kineticTiming.staggerSeconds
                    : 0.16
            )
        );
        const entryDuration = Math.min(Math.max(baseStagger * 0.58, 0.1), 0.34);
        const slideDuration = Math.min(Math.max(baseStagger * 0.52, 0.14), 0.28);
        const frameStates = [];
        let cumulativeWords = 0;

        frames.forEach((frameRowGroups) => {
            const frameRows = this.createKineticRows(frameRowGroups);
            const flatEntries = frameRows.flatMap((rowEntry) => rowEntry.entries || []);
            cumulativeWords += flatEntries.length;
            frameStates.push({
                rows: frameRows,
                entries: flatEntries,
                endWordIndex: cumulativeWords
            });
        });

        this.kineticRenderState = {
            stackNode,
            frameStates,
            activeFrameIndex: -1,
            renderedWordCount: 0,
            totalWordCount,
            wordScheduleMs: frameStates.flatMap((frameState) => (
                frameState.entries.map((entry) => (
                    Number.isFinite(entry.scheduleMs) ? entry.scheduleMs : entry.timeMs
                ))
            )),
            hasWordTimings: frameStates.some((frameState) => (
                frameState.entries.some((entry) => Number.isFinite(entry.timeMs))
            )),
            wordPayload: Array.isArray(wordPayload) ? wordPayload : [],
            entryDuration,
            slideDuration,
            kineticStyle: this.displayState.kineticStyle,
            energy,
            pulse,
            timing: kineticTiming
        };
    }

    createKineticRows(rowGroups = []) {
        return rowGroups.map((group, rowIndex) => {
            const row = document.createElement("div");
            row.className = "kinetic-row";
            row.dataset.rowIndex = String(rowIndex);

            const entries = group.map((word, indexWithinRow) => {
                const span = document.createElement("span");
                span.className = "kinetic-word";
                span.textContent = word.text;
                span.dataset.token = word.text;
                span.style.setProperty("--kinetic-word-index", String(indexWithinRow));
                span.style.transformOrigin = "50% 50% -50px";
                return {
                    node: span,
                    row,
                    isRowTail: indexWithinRow === group.length - 1,
                    timeMs: Number.isFinite(word.timeMs) ? word.timeMs : null,
                    scheduleMs: Number.isFinite(word.timeMs)
                        ? word.timeMs - Math.max(Number(word.leadMs) || 0, 0)
                        : null,
                    leadMs: Number.isFinite(word.leadMs) ? word.leadMs : null,
                    entryMs: Number.isFinite(word.entryMs) ? word.entryMs : null,
                    slideMs: Number.isFinite(word.slideMs) ? word.slideMs : null,
                    emphasis: Number.isFinite(word.emphasis) ? word.emphasis : 0,
                    styleHint: typeof word.styleHint === "string" ? word.styleHint : null
                };
            });

            return {
                row,
                entries
            };
        });
    }

    syncKineticProgress(timeMs, kineticTiming = null) {
        const gsap = window.gsap;
        const state = this.kineticRenderState;
        if (!state || !gsap) {
            return;
        }

        const lineStartMs = Number.isFinite(kineticTiming?.lineStartMs)
            ? kineticTiming.lineStartMs
            : Number.isFinite(state.timing?.lineStartMs)
                ? state.timing.lineStartMs
                : 0;
        const staggerMs = Math.max(
            40,
            (
                Number.isFinite(kineticTiming?.staggerSeconds)
                    ? kineticTiming.staggerSeconds
                    : Number.isFinite(state.timing?.staggerSeconds)
                        ? state.timing.staggerSeconds
                        : 0.16
            ) * 1000
        );
        const entryLeadMs = Math.max(
            0,
            (
                Number.isFinite(kineticTiming?.entryLeadSeconds)
                    ? kineticTiming.entryLeadSeconds
                    : Number.isFinite(state.timing?.entryLeadSeconds)
                        ? state.timing.entryLeadSeconds
                        : 0
            ) * 1000
        );
        const speedFactor = Math.max(
            0.25,
            Number.isFinite(kineticTiming?.speedFactor)
                ? kineticTiming.speedFactor
                : Number.isFinite(state.timing?.speedFactor)
                    ? state.timing.speedFactor
                    : 1
        );
        const elapsedMs = Math.max(0, (timeMs - lineStartMs) * speedFactor + entryLeadMs);
        let targetWordCount;
        if (state.hasWordTimings) {
            const targetMomentMs = lineStartMs + elapsedMs;
            targetWordCount = Math.min(
                state.totalWordCount,
                state.wordScheduleMs.reduce((count, wordTimeMs) => (
                    Number.isFinite(wordTimeMs) && wordTimeMs <= targetMomentMs ? count + 1 : count
                ), 0)
            );
        } else {
            targetWordCount = Math.min(
                state.totalWordCount,
                Math.max(0, Math.floor(elapsedMs / staggerMs) + 1)
            );
        }

        if (targetWordCount < state.renderedWordCount) {
            this.renderKineticCurrentLine(
                this.currentLine.dataset.renderedText || "",
                kineticTiming || state.timing,
                state.wordPayload.length > 0
                    ? {
                        lineStartMs: state.timing?.lineStartMs,
                        words: state.wordPayload
                    }
                    : null
            );
            return;
        }

        while (state.renderedWordCount < targetWordCount) {
            const nextWordIndex = state.renderedWordCount + 1;
            const targetFrameIndex = state.frameStates.findIndex((frameState) => nextWordIndex <= frameState.endWordIndex);
            if (targetFrameIndex === -1) {
                break;
            }

            const frameState = state.frameStates[targetFrameIndex];
            if (state.activeFrameIndex !== targetFrameIndex) {
                state.activeFrameIndex = targetFrameIndex;
                this.mountKineticFrame(state.stackNode, frameState.rows);
            }

            const priorEndIndex = targetFrameIndex > 0
                ? state.frameStates[targetFrameIndex - 1].endWordIndex
                : 0;
            const entry = frameState.entries[nextWordIndex - priorEndIndex - 1];
            if (!entry) {
                break;
            }

            this.appendKineticWord(entry.node, entry.row, {
                entryDuration: Number.isFinite(entry.entryMs)
                    ? Math.max(entry.entryMs / 1000, 0.08)
                    : state.entryDuration,
                slideDuration: Number.isFinite(entry.slideMs)
                    ? Math.max(entry.slideMs / 1000, 0.1)
                    : state.slideDuration,
                kineticStyle: state.kineticStyle,
                energy: state.energy,
                pulse: state.pulse,
                emphasis: Number.isFinite(entry.emphasis) ? entry.emphasis : 0,
                styleHint: entry.styleHint,
                tailBurst: Boolean(this.displayState.kineticTailBurst && entry.isRowTail)
            });
            state.renderedWordCount = nextWordIndex;
        }

        if (state.renderedWordCount >= state.totalWordCount) {
            this.kineticPhase = "line-hold";
        }
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
            slideDuration = 0.24,
            kineticStyle = "center-build",
            energy = 0,
            pulse = 0,
            emphasis = 0,
            styleHint = "soft",
            tailBurst = false
        } = options;
        const randomBetween = (min, max, step = 0.01) => {
            if (gsap.utils?.random) {
                return gsap.utils.random(min, max, step);
            }
            const ratio = Math.random();
            const raw = min + ((max - min) * ratio);
            if (!Number.isFinite(step) || step <= 0) {
                return raw;
            }
            return Math.round(raw / step) * step;
        };
        const settleDuration = kineticStyle === "soft-drift"
            ? Math.max(slideDuration * 2.15, 0.44)
            : slideDuration;
        const pixelSnap = this.isPixelGameStyle()
            ? { snap: { x: 1, y: 1, z: 1 } }
            : {};
        const existingWords = Array.from(rowNode.querySelectorAll(".kinetic-word"));
        const shouldAnimateExistingWords = kineticStyle === "soft-drift" || existingWords.length <= 4;
        const shouldEmitAccent = kineticStyle === "soft-drift" || existingWords.length <= 5;
        const beforeRects = shouldAnimateExistingWords
            ? new Map(existingWords.map((node) => [node, node.getBoundingClientRect()]))
            : null;

        wordNode.style.opacity = "0";
        wordNode.style.filter = "blur(12px)";
        wordNode.style.transformOrigin = "50% 50% -50px";
        rowNode.appendChild(wordNode);
        this.applyCurrentTextPresentation();
        this.scheduleOverflowLayout();

        if (shouldAnimateExistingWords && beforeRects) {
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
                    duration: settleDuration,
                    ease: kineticStyle === "soft-drift" ? "power2.out" : "expo.out",
                    force3D: true,
                    ...pixelSnap,
                    overwrite: "auto"
                });
            });
        }

        const stageRect = this.currentLine.getBoundingClientRect();
        const finalRect = wordNode.getBoundingClientRect();
        const originX = (stageRect.left + stageRect.width / 2) - (finalRect.left + finalRect.width / 2);
        const originY = (stageRect.top + stageRect.height / 2) - (finalRect.top + finalRect.height / 2);

        const clampedEnergy = this.clampAudioValue(energy);
        const clampedPulse = this.clampAudioValue(pulse);
        const clampedEmphasis = Math.min(Math.max(Number(emphasis) || 0, 0), 1);
        const accentDuration = Math.min(Math.max(entryDuration * 0.72, 0.2), 0.3);

        if (kineticStyle === "soft-drift") {
            wordNode.classList.add("kinetic-word--soft");
            gsap.killTweensOf(wordNode);
            const isFloat = styleHint === "float";
            const isTight = styleHint === "tight";
            const spreadX = isFloat ? 132 : isTight ? 56 : 92;
            const spreadY = isFloat ? 68 : isTight ? 30 : 52;
            const depthMin = isFloat ? -240 : -180;
            const depthMax = isFloat ? -92 : -64;
            const scaleMin = isTight ? 0.66 : 0.48;
            const scaleMax = isFloat ? 0.96 : 0.84;
            const launchX = originX + randomBetween(-10, 10, 1);
            const launchY = originY + randomBetween(-8, 8, 1);
            const flyX = randomBetween(-spreadX, spreadX, 1) + (originX * 0.1);
            const flyY = randomBetween(-spreadY, spreadY, 1) + (originY * 0.08);
            const flyZ = randomBetween(depthMin, depthMax, 1) - (clampedPulse * 18);
            const flyScale = randomBetween(scaleMin, scaleMax, 0.01) + (clampedEnergy * 0.04) + (clampedEmphasis * 0.05);
            const flyRotationY = randomBetween(-24, 24, 1) * (isTight ? 0.58 : 0.82);
            const flyRotationX = randomBetween(-12, 12, 1) * (isTight ? 0.58 : 0.82);
            const flyRotationZ = randomBetween(-10, 10, 1) * (isFloat ? 1.08 : 0.84);
            const blurStart = randomBetween(isTight ? 5 : 7, isFloat ? 14 : 11, 1);
            const floatDuration = Math.max(entryDuration * (isFloat ? 0.52 : isTight ? 0.4 : 0.46), 0.14);
            const gatherDuration = Math.max(entryDuration * (isFloat ? 0.98 : 0.88), 0.28);
            const settleBackDuration = Math.max(entryDuration * 0.62, 0.26);
            const midX = flyX * (isFloat ? 0.78 : 0.72);
            const midY = flyY * (isFloat ? 0.74 : 0.66);
            const midZ = flyZ * 0.4;
            const midScale = Math.min(1.06, Math.max(flyScale * 0.92, 0.82));
            const nearX = flyX * 0.1;
            const nearY = flyY * 0.1;
            const settleX = flyX * -0.018;
            const settleY = flyY * -0.016;
            const settleRotY = flyRotationY * -0.018;
            const settleRotX = flyRotationX * -0.018;
            const settleRotZ = flyRotationZ * -0.02;

            gsap.set(wordNode, {
                opacity: 0,
                x: launchX,
                y: launchY,
                z: -280,
                scale: 0.28 + (clampedEmphasis * 0.03),
                rotationY: randomBetween(-16, 16, 1),
                rotationX: randomBetween(-10, 10, 1),
                rotationZ: randomBetween(-6, 6, 1),
                filter: `brightness(1.84) blur(${Math.max(blurStart - 1, 4)}px)`,
                force3D: true
            });

            const driftTimeline = gsap.timeline({
                defaults: {
                    overwrite: "auto",
                    force3D: true
                }
            });
            driftTimeline
                .to(wordNode, {
                    opacity: 0.96,
                    x: midX,
                    y: midY,
                    z: midZ,
                    scale: midScale,
                    rotationY: flyRotationY * 0.52,
                    rotationX: flyRotationX * 0.52,
                    rotationZ: flyRotationZ * 0.52,
                    filter: `brightness(${(1.42 + randomBetween(0, 0.12, 0.01) + (clampedEmphasis * 0.05)).toFixed(2)}) blur(${Math.max(blurStart * 0.62, 2)}px)`,
                    duration: floatDuration,
                    ease: "sine.out"
                })
                .to(wordNode, {
                    x: nearX,
                    y: nearY,
                    z: -14,
                    scale: 1.018 + (clampedEmphasis * 0.018),
                    rotationY: flyRotationY * 0.08,
                    rotationX: flyRotationX * 0.08,
                    rotationZ: flyRotationZ * 0.08,
                    filter: "brightness(1.12) blur(1.4px)",
                    duration: gatherDuration,
                    ease: "power2.out"
                })
                .to(wordNode, {
                    x: settleX,
                    y: settleY,
                    z: 0,
                    scale: 0.996,
                    rotationY: settleRotY,
                    rotationX: settleRotX,
                    rotationZ: settleRotZ,
                    filter: "brightness(1.02) blur(0.35px)",
                    duration: settleBackDuration * 0.54,
                    ease: "sine.out"
                })
                .to(wordNode, {
                    x: 0,
                    y: 0,
                    z: 0,
                    scale: 1,
                    rotationY: 0,
                    rotationX: 0,
                    rotationZ: 0,
                    filter: "brightness(1) blur(0px)",
                    duration: settleBackDuration * 0.82,
                    ease: "sine.inOut",
                    ...pixelSnap,
                    clearProps: "opacity,filter,transform"
                });
            driftTimeline.call(() => {
                if (shouldEmitAccent) {
                    this.createParticles(wordNode, {
                        count: 3,
                        radius: 18 + (clampedEmphasis * 8) + (clampedPulse * 4)
                    });
                }
                this.animateWordColorFlow(wordNode, accentDuration);
            }, null, 0.02);
            if (tailBurst) {
                driftTimeline.call(() => {
                    this.triggerKineticTailBurst(wordNode, {
                        kineticStyle,
                        burstStyle: this.displayState.kineticTailBurstStyle,
                        emphasis: clampedEmphasis,
                        pulse: clampedPulse,
                        energy: clampedEnergy
                    });
                }, null, `-=${Math.max(settleBackDuration * 0.22, 0.08)}`);
            }
            return;
        }

        gsap.fromTo(wordNode, {
            opacity: 0,
            x: originX * 0.68,
            y: (originY * 0.68) + 16,
            z: -180,
            scale: 0.58 + (clampedEmphasis * 0.05),
            rotationY: 30 + (clampedEmphasis * 8),
            rotationX: -10,
            filter: `brightness(${(1.7 + (clampedEmphasis * 0.06)).toFixed(2)}) blur(${(5 + (clampedEmphasis * 2)).toFixed(0)}px)`
        }, {
            opacity: 1,
            x: 0,
            scale: 1,
            y: 0,
            z: 0,
            rotationY: 0,
            rotationX: 0,
            filter: "brightness(1) blur(0px)",
            duration: Math.max(entryDuration * 0.82, 0.18),
            ease: "expo.out",
            force3D: true,
            ...pixelSnap,
            overwrite: "auto",
            clearProps: "opacity,filter,transform"
        });
        gsap.delayedCall(0.02, () => {
            if (shouldEmitAccent) {
                this.createParticles(wordNode, {
                    count: 3,
                    radius: 20 + (clampedEmphasis * 8) + (clampedPulse * 5)
                });
            }
            this.animateWordColorFlow(wordNode, Math.min(accentDuration, 0.24));
        });
        if (tailBurst) {
            gsap.delayedCall(Math.max(entryDuration * 0.72, 0.12), () => {
                this.triggerKineticTailBurst(wordNode, {
                    kineticStyle,
                    burstStyle: this.displayState.kineticTailBurstStyle,
                    emphasis: clampedEmphasis,
                    pulse: clampedPulse,
                    energy: clampedEnergy
                });
            });
        }
    }

    animateWordColorFlow(wordNode, duration = 0.3) {
        const gsap = window.gsap;
        if (!wordNode || !gsap || !this.isGradientTextMode()) {
            return;
        }

        wordNode.style.backgroundImage = this.buildGradientCss(this.resolveReactivePalette());
        wordNode.style.backgroundSize = "200% 100%";
        wordNode.style.backgroundPosition = "100% 50%";
        wordNode.style.color = "transparent";
        wordNode.style.webkitTextFillColor = "transparent";
        wordNode.style.webkitBackgroundClip = "text";
        wordNode.style.backgroundClip = "text";

        gsap.fromTo(wordNode, {
            backgroundPosition: "100% 50%"
        }, {
            backgroundPosition: "0% 50%",
            duration: Math.max(duration, 0.2),
            ease: "power2.out",
            overwrite: "auto",
            onComplete: () => {
                wordNode.style.removeProperty("background-image");
                wordNode.style.removeProperty("background-size");
                wordNode.style.removeProperty("background-position");
                wordNode.style.removeProperty("color");
                wordNode.style.removeProperty("-webkit-text-fill-color");
                wordNode.style.removeProperty("-webkit-background-clip");
                wordNode.style.removeProperty("background-clip");
                this.applyCurrentTextPresentation();
            }
        });
    }

    resolveTailBurstPalette() {
        return [
            this.displayState.kineticTailBurstColorA || "#7ef8ff",
            this.displayState.kineticTailBurstColorB || "#4d8cff",
            this.displayState.kineticTailBurstColorCore || "#fff8ff"
        ];
    }

    resolveTailBurstSpec(styleName = this.displayState.kineticTailBurstStyle) {
        switch (styleName) {
            case "firework":
                return {
                    style: "firework",
                    particleCount: 18,
                    radiusBoost: 18,
                    durationBoost: 0.14,
                    flashScale: 1.14,
                    ringScale: 1.96,
                    particleSize: 0.58,
                    spread: 1.24
                };
            case "shatter":
                return {
                    style: "shatter",
                    particleCount: 16,
                    radiusBoost: 10,
                    durationBoost: 0.06,
                    flashScale: 0.98,
                    ringScale: 1.46,
                    particleSize: 0.48,
                    spread: 1.42
                };
            default:
                return {
                    style: "glow-burst",
                    particleCount: 13,
                    radiusBoost: 0,
                    durationBoost: 0,
                    flashScale: 1,
                    ringScale: 1.58,
                    particleSize: 0.52,
                    spread: 1
                };
        }
    }

    createParticles(targetOrX, yOrOptions = {}, maybeOptions = {}) {
        const gsap = window.gsap;
        if (!gsap || !this.currentLine?.isConnected) {
            return;
        }

        let burstLayer = this.currentLine.querySelector(".kinetic-burst-layer");
        if (!burstLayer) {
            burstLayer = document.createElement("div");
            burstLayer.className = "kinetic-burst-layer";
            this.currentLine.appendChild(burstLayer);
        }

        const lineRect = this.currentLine.getBoundingClientRect();
        if (!lineRect.width || !lineRect.height) {
            return;
        }

        const usingNode = typeof targetOrX !== "number";
        const wordNode = usingNode ? targetOrX : null;
        if (usingNode && (!wordNode || !wordNode.isConnected)) {
            return;
        }

        const options = usingNode ? yOrOptions : maybeOptions;
        const count = Math.max(3, Math.min(10, Math.round(options.count || 5)));
        const radius = Math.max(16, Number(options.radius) || 30);
        const palette = Array.isArray(options.palette) && options.palette.length > 0
            ? options.palette
            : [
                this.displayState.primaryColor,
                this.displayState.secondaryColor,
                this.displayState.accentColor
            ];
        const particleSize = Math.max(0.24, Number(options.size) || 0.34);
        let startX;
        let startY;

        if (usingNode) {
            const wordRect = wordNode.getBoundingClientRect();
            if (!wordRect.width || !wordRect.height) {
                return;
            }
            startX = wordRect.left - lineRect.left + (wordRect.width * 0.5);
            startY = wordRect.top - lineRect.top + (wordRect.height * 0.45);
        } else {
            startX = Number(targetOrX);
            startY = Number(yOrOptions);
            if (!Number.isFinite(startX) || !Number.isFinite(startY)) {
                return;
            }
        }

        Array.from({ length: count }, (_, index) => {
            const particle = document.createElement("span");
            particle.className = "kinetic-accent-particle";
            particle.style.left = `${startX}px`;
            particle.style.top = `${startY}px`;
            particle.style.width = `${particleSize}rem`;
            particle.style.height = `${particleSize}rem`;
            particle.style.marginLeft = `${(-particleSize * 0.5).toFixed(3)}rem`;
            particle.style.marginTop = `${(-particleSize * 0.5).toFixed(3)}rem`;
            particle.style.background = palette[index % palette.length];
            particle.style.boxShadow = `0 0 0.85rem ${palette[index % palette.length]}`;
            burstLayer.appendChild(particle);

            const angle = (Math.PI * 2 * (index / count)) + ((Math.random() - 0.5) * 0.5);
            const drift = radius * (0.55 + Math.random() * 0.45);
            const targetX = Math.cos(angle) * drift;
            const targetY = Math.sin(angle) * drift;

            gsap.fromTo(particle, {
                x: 0,
                y: 0,
                scale: 0.2,
                opacity: 0.95,
                force3D: true
            }, {
                x: targetX,
                y: targetY,
                scale: 0.85 + (Math.random() * 0.45),
                opacity: 0,
                duration: 0.48 + (Math.random() * 0.18),
                ease: "expo.out",
                force3D: true,
                onComplete: () => {
                    particle.remove();
                    if (burstLayer && !burstLayer.childElementCount) {
                        burstLayer.remove();
                    }
                }
            });

            return particle;
        });
    }

    triggerKineticTailBurst(wordNode, options = {}) {
        const gsap = window.gsap;
        if (!wordNode || !gsap || !this.currentLine?.isConnected || !wordNode.isConnected) {
            return;
        }

        let burstLayer = this.currentLine.querySelector(".kinetic-burst-layer");
        if (!burstLayer) {
            burstLayer = document.createElement("div");
            burstLayer.className = "kinetic-burst-layer";
            this.currentLine.appendChild(burstLayer);
        }

        const lineRect = this.currentLine.getBoundingClientRect();
        const wordRect = wordNode.getBoundingClientRect();
        if (!lineRect.width || !lineRect.height || !wordRect.width || !wordRect.height) {
            return;
        }

        const burst = document.createElement("div");
        burst.className = "kinetic-burst";
        burst.style.left = `${wordRect.left - lineRect.left + wordRect.width * 0.9}px`;
        burst.style.top = `${wordRect.top - lineRect.top + wordRect.height * 0.5}px`;

        const emphasis = Math.min(Math.max(Number(options.emphasis) || 0, 0), 1);
        const pulse = this.clampAudioValue(options.pulse);
        const energy = this.clampAudioValue(options.energy);
        const isSoftDrift = options.kineticStyle === "soft-drift";
        const burstSpec = this.resolveTailBurstSpec(options.burstStyle || this.displayState.kineticTailBurstStyle);
        const burstStrength = this.clampKineticTailBurstStrength(
            options.strength ?? this.displayState.kineticTailBurstStrength
        );
        const palette = this.resolveTailBurstPalette();
        const particleCount = Math.max(
            6,
            Math.round(
                (burstSpec.particleCount * (0.78 + burstStrength * 0.64))
                + (emphasis * 5)
                + (pulse * 3)
                + (isSoftDrift ? 2 : 0)
            )
        );
        burst.dataset.burstStyle = burstSpec.style;
        burst.style.setProperty("--kinetic-burst-core-color", palette[2]);
        burst.style.setProperty("--kinetic-burst-glow-color", this.mixCssColors(palette[0], palette[1], 0.45));
        burst.style.setProperty("--kinetic-burst-ring-color", this.mixCssColors(palette[1], palette[2], 0.32));
        burst.style.setProperty("--kinetic-burst-strength", burstStrength.toFixed(2));
        burst.style.setProperty("--kinetic-burst-core-size", `${(0.92 * burstSpec.flashScale * (0.82 + burstStrength * 0.42)).toFixed(3)}rem`);
        burst.style.setProperty("--kinetic-burst-ring-size", `${(1.42 * burstSpec.ringScale * (0.84 + burstStrength * 0.44)).toFixed(3)}rem`);

        burstLayer.appendChild(burst);
        const particles = Array.from({ length: particleCount }, (_, index) => {
            const particle = document.createElement("span");
            particle.className = "kinetic-burst-particle";
            particle.style.setProperty("--kinetic-burst-index", String(index));
            const particleColor = palette[index % palette.length];
            particle.style.background = particleColor;
            particle.style.boxShadow = `0 0 ${(0.78 + burstStrength * 0.56).toFixed(2)}rem ${particleColor}`;
            particle.style.width = `${(burstSpec.particleSize * (0.84 + burstStrength * 0.34)).toFixed(3)}rem`;
            particle.style.height = `${(burstSpec.particleSize * (0.84 + burstStrength * 0.34)).toFixed(3)}rem`;
            if (burstSpec.style === "shatter") {
                particle.style.borderRadius = `${0.12 + Math.random() * 0.1}rem`;
            }
            burst.appendChild(particle);
            return particle;
        });

        particles.forEach((particle, index) => {
            const ratio = particleCount <= 1 ? 0 : index / particleCount;
            const angle = ((Math.PI * 2) * ratio) + ((Math.random() - 0.5) * 0.45);
            const radius = (34 + burstSpec.radiusBoost + (energy * 24) + (emphasis * 18) + (Math.random() * 34))
                * (0.84 + burstStrength * 0.36);
            const lift = (Math.random() - 0.5) * (burstSpec.style === "firework" ? 26 : 18);
            const targetX = Math.cos(angle) * radius * burstSpec.spread;
            const targetY = ((Math.sin(angle) * radius * 0.78) + lift) * (burstSpec.style === "shatter" ? 0.72 : 1);
            const targetScale = (0.34 + (Math.random() * (burstSpec.style === "firework" ? 0.86 : 0.66))) * (0.88 + burstStrength * 0.2);
            const targetRotation = burstSpec.style === "shatter"
                ? -60 + (Math.random() * 120)
                : -24 + (Math.random() * 48);

            gsap.fromTo(particle, {
                x: 0,
                y: 0,
                scale: burstSpec.style === "firework" ? 0.26 : 0.18,
                opacity: 1,
                rotation: 0,
                filter: "blur(0px)",
                force3D: true
            }, {
                x: targetX,
                y: targetY,
                scale: targetScale,
                opacity: 0,
                rotation: targetRotation,
                filter: `blur(${((3.2 + Math.random() * (burstSpec.style === "firework" ? 6.2 : 4.4)) * (0.88 + burstStrength * 0.2)).toFixed(1)}px)`,
                duration: (0.58 + burstSpec.durationBoost + (Math.random() * 0.22) + (isSoftDrift ? 0.08 : 0)) * (0.9 + burstStrength * 0.14),
                ease: "expo.out",
                force3D: true,
                overwrite: "auto"
            });
        });

        gsap.fromTo(burst, {
            opacity: 1,
            scale: (0.9 + (emphasis * 0.08)) * (0.96 + burstStrength * 0.08)
        }, {
            opacity: 0,
            scale: (1.18 + (pulse * 0.14) + (burstSpec.style === "firework" ? 0.12 : 0)) * (0.92 + burstStrength * 0.16),
            duration: (0.82 + burstSpec.durationBoost) * (0.92 + burstStrength * 0.14),
            ease: "expo.out",
            overwrite: "auto",
            onComplete: () => {
                burst.remove();
                if (burstLayer && !burstLayer.childElementCount) {
                    burstLayer.remove();
                }
            }
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
        return Math.min(Math.max(Number(value) || 2200, 520), 6000);
    }

    clampKineticMaxWordsPerLine(value) {
        const min = this.displayConfig.minKineticMaxWordsPerLine ?? 0;
        const max = this.displayConfig.maxKineticMaxWordsPerLine ?? 8;
        const numericValue = Number(value);
        const fallback = this.displayConfig.defaultKineticMaxWordsPerLine ?? 5;
        const resolved = Number.isFinite(numericValue) ? numericValue : fallback;
        return Math.min(Math.max(Math.round(resolved), min), max);
    }

    clampKineticMaxCharsPerLine(value) {
        const min = this.displayConfig.minKineticMaxCharsPerLine ?? 0;
        const max = this.displayConfig.maxKineticMaxCharsPerLine ?? 36;
        const numericValue = Number(value);
        const fallback = this.displayConfig.defaultKineticMaxCharsPerLine ?? 20;
        const resolved = Number.isFinite(numericValue) ? numericValue : fallback;
        return Math.min(Math.max(Math.round(resolved), min), max);
    }

    resolveKineticRowsPerFrame() {
        const effectiveHeight = Math.max(120, this.displayState.height - 88);
        const scalePenalty = Math.max(1, this.displayState.textScale);
        const estimatedRows = Math.floor(effectiveHeight / (118 * scalePenalty));
        return Math.min(Math.max(estimatedRows, 1), 2);
    }

    chunkKineticWords(words, maxWordsPerLine, maxCharsPerLine) {
        const safeMaxWords = maxWordsPerLine <= 0 ? Number.POSITIVE_INFINITY : maxWordsPerLine;
        const safeMaxChars = maxCharsPerLine <= 0 ? Number.POSITIVE_INFINITY : maxCharsPerLine;
        const chunks = [];
        let currentChunk = [];
        let currentChars = 0;

        words.forEach((word) => {
            const wordChars = [...String(word?.text || word)].length;
            const nextChars = currentChunk.length === 0
                ? wordChars
                : currentChars + 1 + wordChars;
            const exceedsWords = currentChunk.length >= safeMaxWords;
            const exceedsChars = currentChunk.length > 0 && nextChars > safeMaxChars;

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
            window.gsap.killTweensOf(".clean-phrase-word");
            window.gsap.killTweensOf(".kinetic-dot");
            window.gsap.killTweensOf(this.body);
        }

        if (this.kineticTimeline) {
            this.kineticTimeline.kill();
            this.kineticTimeline = null;
        }

        if (this.kineticPrerollTimeline) {
            this.kineticPrerollTimeline.kill();
            this.kineticPrerollTimeline = null;
        }

        this.kineticRenderState = null;
        this.cleanPhraseState = null;
        this.kineticPhase = "idle";
        this.currentLine.classList.remove("is-kinetic-line", "is-clean-phrase-line");
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

    renderColorPresetGallery() {
        if (!this.colorPresetGallery) {
            return;
        }

        const presetButtons = this.colorPresets.map((preset) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "lyrics-preset-button";
            button.dataset.presetId = preset.id;
            button.title = preset.label;
            button.style.setProperty("--preset-swatch", this.buildGradientCss(preset.colors || []));
            button.innerHTML = `<span class="lyrics-preset-dot" aria-hidden="true"></span><span class="lyrics-preset-name">${preset.label}</span>`;
            button.addEventListener("click", () => {
                this.setColorPreset(preset.id, true, true);
            });
            return button;
        });

        const customButton = document.createElement("button");
        customButton.type = "button";
        customButton.className = "lyrics-preset-button";
        customButton.dataset.presetId = "custom";
        customButton.title = "Custom";
        customButton.style.setProperty(
            "--preset-swatch",
            this.buildGradientCss([
                this.displayConfig.defaultPrimaryColor ?? "#f9fcff",
                this.displayConfig.defaultSecondaryColor ?? "#9fd4ff",
                this.displayConfig.defaultAccentColor ?? "#8ef4ff"
            ])
        );
        customButton.innerHTML = `<span class="lyrics-preset-dot" aria-hidden="true"></span><span class="lyrics-preset-name">Custom</span>`;
        customButton.addEventListener("click", () => {
            this.setColorPreset("custom", true, true);
        });

        this.colorPresetGallery.replaceChildren(...presetButtons, customButton);
    }

    getDefaultDisplayState() {
        return {
            textScale: this.displayConfig.defaultTextScale ?? 1,
            x: this.displayConfig.defaultOffsetX ?? 0,
            y: this.displayConfig.defaultOffsetY ?? 0,
            width: this.displayConfig.defaultWidth ?? 740,
            height: this.displayConfig.defaultHeight ?? 260,
            boxHaze: this.clampBoxHaze(this.displayConfig.defaultBoxHaze ?? 58),
            letterSpacingAdjust: this.clampLetterSpacingAdjust(this.displayConfig.defaultLetterSpacingAdjust ?? 0),
            wordSpacingAdjust: this.clampWordSpacingAdjust(this.displayConfig.defaultWordSpacingAdjust ?? 0),
            fontPreset: this.displayConfig.defaultFontPreset || this.fontPresets[0]?.id || "neo",
            textBold: Boolean(this.displayConfig.defaultTextBold),
            textItalic: Boolean(this.displayConfig.defaultTextItalic),
            textStyle: this.clampTextStyle(this.displayConfig.defaultTextStyle ?? "normal"),
            colorMode: this.clampColorMode(this.displayConfig.defaultColorMode ?? "single"),
            colorPresetId: this.clampColorPresetId(this.displayConfig.defaultColorPresetId ?? "aurora"),
            multiColorList: this.sanitizeMultiColorList(this.displayConfig.defaultMultiColorList ?? ""),
            primaryColor: this.clampPrimaryColor(this.displayConfig.defaultPrimaryColor ?? "#f9fcff"),
            secondaryColor: this.clampPrimaryColor(this.displayConfig.defaultSecondaryColor ?? "#9fd4ff"),
            accentColor: this.clampPrimaryColor(this.displayConfig.defaultAccentColor ?? "#8ef4ff"),
            chromeMode: this.clampChromeMode(this.displayConfig.defaultChromeMode ?? "boxed"),
            textAlign: this.clampTextAlign(this.displayConfig.defaultTextAlign ?? "center"),
            pureMode: Boolean(this.displayConfig.defaultPureMode),
            kineticMode: Boolean(this.displayConfig.defaultKineticMode),
            kineticMaxWordsPerLine: this.clampKineticMaxWordsPerLine(this.displayConfig.defaultKineticMaxWordsPerLine ?? 5),
            kineticMaxCharsPerLine: this.clampKineticMaxCharsPerLine(this.displayConfig.defaultKineticMaxCharsPerLine ?? 20),
            kineticSpeedFactor: this.clampKineticSpeedFactor(this.displayConfig.defaultKineticSpeedFactor ?? 1),
            kineticStyle: this.clampKineticStyle(this.displayConfig.defaultKineticStyle ?? "center-build"),
            kineticTailBurst: Boolean(this.displayConfig.defaultKineticTailBurst),
            kineticTailBurstStyle: this.clampTailBurstStyle(this.displayConfig.defaultKineticTailBurstStyle ?? "glow-burst"),
            kineticTailBurstColorA: this.clampPrimaryColor(this.displayConfig.defaultKineticTailBurstColorA ?? "#7ef8ff"),
            kineticTailBurstColorB: this.clampPrimaryColor(this.displayConfig.defaultKineticTailBurstColorB ?? "#4d8cff"),
            kineticTailBurstColorCore: this.clampPrimaryColor(this.displayConfig.defaultKineticTailBurstColorCore ?? "#fff8ff"),
            kineticTailBurstStrength: this.clampKineticTailBurstStrength(this.displayConfig.defaultKineticTailBurstStrength ?? 1)
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
        this.boxHazeRange?.addEventListener("input", (event) => {
            this.setBoxHaze(Number(event.target.value), false, false);
        });
        this.boxHazeRange?.addEventListener("change", (event) => {
            this.setBoxHaze(Number(event.target.value), true, true);
        });
        this.fontSelect.addEventListener("change", (event) => {
            this.setFontPreset(event.target.value);
        });
        this.boldToggle?.addEventListener("change", (event) => {
            this.setTextBold(Boolean(event.target.checked), true, true);
        });
        this.italicToggle?.addEventListener("change", (event) => {
            this.setTextItalic(Boolean(event.target.checked), true, true);
        });
        this.letterSpacingRange?.addEventListener("input", (event) => {
            this.setLetterSpacingAdjust(Number(event.target.value) / 1000, false, false);
        });
        this.letterSpacingRange?.addEventListener("change", (event) => {
            this.setLetterSpacingAdjust(Number(event.target.value) / 1000, true, true);
        });
        this.wordSpacingRange?.addEventListener("input", (event) => {
            this.setWordSpacingAdjust(Number(event.target.value) / 100, false, false);
        });
        this.wordSpacingRange?.addEventListener("change", (event) => {
            this.setWordSpacingAdjust(Number(event.target.value) / 100, true, true);
        });
        this.textStyleSelect?.addEventListener("change", (event) => {
            this.setTextStyle(event.target.value, true, true);
        });
        this.colorModeSelect?.addEventListener("change", (event) => {
            this.setColorMode(event.target.value, true, true);
        });
        this.primaryColorInput?.addEventListener("input", (event) => {
            this.setPrimaryColor(event.target.value, false, false);
        });
        this.primaryColorInput?.addEventListener("change", (event) => {
            this.setPrimaryColor(event.target.value, true, true);
        });
        this.secondaryColorInput?.addEventListener("input", (event) => {
            this.setSecondaryColor(event.target.value, false, false);
        });
        this.secondaryColorInput?.addEventListener("change", (event) => {
            this.setSecondaryColor(event.target.value, true, true);
        });
        this.accentColorInput?.addEventListener("input", (event) => {
            this.setAccentColor(event.target.value, false, false);
        });
        this.accentColorInput?.addEventListener("change", (event) => {
            this.setAccentColor(event.target.value, true, true);
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
        this.kineticSpeedRange?.addEventListener("input", (event) => {
            this.setKineticSpeedFactor(Number(event.target.value) / 100, false, false);
        });
        this.kineticSpeedRange?.addEventListener("change", (event) => {
            this.setKineticSpeedFactor(Number(event.target.value) / 100, true, true);
        });
        this.kineticStyleSelect?.addEventListener("change", (event) => {
            this.setKineticStyle(event.target.value, true, true);
        });
        this.tailBurstToggle?.addEventListener("change", (event) => {
            this.setKineticTailBurst(Boolean(event.target.checked), true, true);
        });
        this.tailBurstStyleSelect?.addEventListener("change", (event) => {
            this.setKineticTailBurstStyle(event.target.value, true, true);
        });
        this.tailBurstColorAInput?.addEventListener("input", (event) => {
            this.setKineticTailBurstColor("A", event.target.value, false, false);
        });
        this.tailBurstColorAInput?.addEventListener("change", (event) => {
            this.setKineticTailBurstColor("A", event.target.value, true, true);
        });
        this.tailBurstColorBInput?.addEventListener("input", (event) => {
            this.setKineticTailBurstColor("B", event.target.value, false, false);
        });
        this.tailBurstColorBInput?.addEventListener("change", (event) => {
            this.setKineticTailBurstColor("B", event.target.value, true, true);
        });
        this.tailBurstColorCoreInput?.addEventListener("input", (event) => {
            this.setKineticTailBurstColor("Core", event.target.value, false, false);
        });
        this.tailBurstColorCoreInput?.addEventListener("change", (event) => {
            this.setKineticTailBurstColor("Core", event.target.value, true, true);
        });
        this.tailBurstStrengthRange?.addEventListener("input", (event) => {
            this.setKineticTailBurstStrength(Number(event.target.value) / 100, false, false);
        });
        this.tailBurstStrengthRange?.addEventListener("change", (event) => {
            this.setKineticTailBurstStrength(Number(event.target.value) / 100, true, true);
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
                this.displayState.letterSpacingAdjust = this.clampLetterSpacingAdjust(
                    stored.letterSpacingAdjust
                    ?? stored.letterSpacing
                    ?? stored.textSpacing
                    ?? defaults.letterSpacingAdjust
                );
                this.displayState.wordSpacingAdjust = this.clampWordSpacingAdjust(
                    stored.wordSpacingAdjust
                    ?? stored.wordSpacing
                    ?? defaults.wordSpacingAdjust
                );
                this.displayState.fontPreset = this.getFontPreset(stored.fontPreset)?.id || defaults.fontPreset;
                this.displayState.textBold = typeof stored.textBold === "boolean"
                    ? stored.textBold
                    : defaults.textBold;
                this.displayState.textItalic = typeof stored.textItalic === "boolean"
                    ? stored.textItalic
                    : defaults.textItalic;
                this.displayState.textStyle = this.clampTextStyle(
                    stored.textStyle
                    ?? defaults.textStyle
                );
                this.displayState.colorMode = this.clampColorMode(
                    stored.colorMode
                    ?? defaults.colorMode
                );
                this.displayState.colorPresetId = this.clampColorPresetId(
                    stored.colorPresetId
                    ?? stored.colorPreset
                    ?? defaults.colorPresetId
                );
                this.displayState.multiColorList = this.sanitizeMultiColorList(
                    stored.multiColorList
                    ?? stored.colorList
                    ?? defaults.multiColorList
                );
                this.displayState.primaryColor = this.clampPrimaryColor(
                    stored.primaryColor
                    ?? defaults.primaryColor
                );
                this.displayState.secondaryColor = this.clampPrimaryColor(
                    stored.secondaryColor
                    ?? defaults.secondaryColor
                );
                this.displayState.accentColor = this.clampPrimaryColor(
                    stored.accentColor
                    ?? defaults.accentColor
                );
                const legacyPalette = this.splitColorListInput(
                    stored.multiColorList
                    ?? stored.colorList
                    ?? ""
                ).map((part) => this.normalizeCssColor(part)).filter(Boolean);
                if (legacyPalette.length > 0 && !stored.colorPresetId && !stored.colorPreset) {
                    this.displayState.colorPresetId = "custom";
                    this.displayState.primaryColor = this.clampPrimaryColor(legacyPalette[0] ?? this.displayState.primaryColor);
                    this.displayState.secondaryColor = this.clampPrimaryColor(legacyPalette[1] ?? legacyPalette[0] ?? this.displayState.secondaryColor);
                    this.displayState.accentColor = this.clampPrimaryColor(legacyPalette[2] ?? legacyPalette[1] ?? legacyPalette[0] ?? this.displayState.accentColor);
                } else if (this.displayState.colorPresetId !== "custom") {
                    this.applyColorPresetColorsToState(this.displayState.colorPresetId);
                }
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
                this.displayState.kineticSpeedFactor = this.clampKineticSpeedFactor(
                    stored.kineticSpeedFactor
                    ?? stored.kineticSpeed
                    ?? defaults.kineticSpeedFactor
                );
                this.displayState.kineticStyle = this.clampKineticStyle(
                    stored.kineticStyle
                    ?? defaults.kineticStyle
                );
                this.displayState.kineticTailBurst = typeof stored.kineticTailBurst === "boolean"
                    ? stored.kineticTailBurst
                    : defaults.kineticTailBurst;
                this.displayState.kineticTailBurstStyle = this.clampTailBurstStyle(
                    stored.kineticTailBurstStyle
                    ?? defaults.kineticTailBurstStyle
                );
                this.displayState.kineticTailBurstColorA = this.clampPrimaryColor(
                    stored.kineticTailBurstColorA
                    ?? defaults.kineticTailBurstColorA
                );
                this.displayState.kineticTailBurstColorB = this.clampPrimaryColor(
                    stored.kineticTailBurstColorB
                    ?? defaults.kineticTailBurstColorB
                );
                this.displayState.kineticTailBurstColorCore = this.clampPrimaryColor(
                    stored.kineticTailBurstColorCore
                    ?? defaults.kineticTailBurstColorCore
                );
                this.displayState.kineticTailBurstStrength = this.clampKineticTailBurstStrength(
                    stored.kineticTailBurstStrength
                    ?? defaults.kineticTailBurstStrength
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

    setLetterSpacingAdjust(value, persist = true, announce = true) {
        const nextValue = this.clampLetterSpacingAdjust(value);
        if (nextValue === this.displayState.letterSpacingAdjust) {
            return;
        }

        this.displayState.letterSpacingAdjust = nextValue;
        this.applyDisplayState();
        this.scheduleOverflowLayout();

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Lyrics letter spacing ${this.formatLetterSpacingAdjust(nextValue)}.`);
        }
    }

    setWordSpacingAdjust(value, persist = true, announce = true) {
        const nextValue = this.clampWordSpacingAdjust(value);
        if (nextValue === this.displayState.wordSpacingAdjust) {
            return;
        }

        this.displayState.wordSpacingAdjust = nextValue;
        this.applyDisplayState();
        this.scheduleOverflowLayout();

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Lyrics word spacing ${this.formatWordSpacingAdjust(nextValue)}.`);
        }
    }

    setTextStyle(value, persist = true, announce = true) {
        const nextValue = this.clampTextStyle(value);
        if (nextValue === this.displayState.textStyle) {
            return;
        }

        this.displayState.textStyle = nextValue;
        this.applyDisplayState();
        this.refreshStyledLyricRender();

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Lyrics text style ${nextValue}.`);
        }
    }

    setColorMode(value, persist = true, announce = true) {
        const nextValue = this.clampColorMode(value);
        if (nextValue === this.displayState.colorMode) {
            return;
        }

        this.displayState.colorMode = nextValue;
        this.applyDisplayState();
        this.refreshStyledLyricRender();

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Lyrics color mode ${nextValue}.`);
        }
    }

    setColorPreset(value, persist = true, announce = true) {
        const nextValue = this.clampColorPresetId(value);
        if (nextValue === this.displayState.colorPresetId) {
            this.updateHologram(this.resolveReactivePalette(), nextValue);
            return;
        }

        this.displayState.colorPresetId = nextValue;
        if (nextValue !== "custom") {
            this.applyColorPresetColorsToState(nextValue);
            const preset = this.getColorPreset(nextValue);
            if (preset?.colorMode) {
                this.displayState.colorMode = this.clampColorMode(preset.colorMode);
            }
        }
        this.applyDisplayState();
        this.refreshStyledLyricRender();

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Lyrics color preset ${this.getColorPreset(nextValue)?.label || "Custom"}.`);
        }
    }

    setMultiColorList(value, persist = true, announce = true) {
        const nextValue = this.sanitizeMultiColorList(value);
        const colors = this.splitColorListInput(nextValue)
            .map((part) => this.normalizeCssColor(part))
            .filter(Boolean);
        if (colors.length === 0) {
            return;
        }

        if (nextValue === this.displayState.multiColorList && this.displayState.colorPresetId === "custom") {
            this.updateHologram(this.resolveReactivePalette(), "custom");
            return;
        }

        this.displayState.colorPresetId = "custom";
        this.displayState.multiColorList = nextValue;
        this.displayState.primaryColor = this.clampPrimaryColor(colors[0] ?? this.displayState.primaryColor);
        this.displayState.secondaryColor = this.clampPrimaryColor(colors[1] ?? colors[0] ?? this.displayState.secondaryColor);
        this.displayState.accentColor = this.clampPrimaryColor(colors[2] ?? colors[1] ?? colors[0] ?? this.displayState.accentColor);
        this.applyDisplayState();
        this.refreshStyledLyricRender();

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus("Lyrics custom palette updated.");
        }
    }

    setPrimaryColor(value, persist = true, announce = true) {
        const nextValue = this.clampPrimaryColor(value);
        if (nextValue === this.displayState.primaryColor) {
            return;
        }

        this.displayState.colorPresetId = "custom";
        this.displayState.primaryColor = nextValue;
        this.displayState.multiColorList = [
            nextValue,
            this.displayState.secondaryColor,
            this.displayState.accentColor
        ].join(", ");
        this.applyDisplayState();
        this.refreshStyledLyricRender();

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Lyrics primary color ${nextValue}.`);
        }
    }

    setSecondaryColor(value, persist = true, announce = true) {
        const nextValue = this.clampPrimaryColor(value);
        if (nextValue === this.displayState.secondaryColor) {
            return;
        }

        this.displayState.colorPresetId = "custom";
        this.displayState.secondaryColor = nextValue;
        this.displayState.multiColorList = [
            this.displayState.primaryColor,
            nextValue,
            this.displayState.accentColor
        ].join(", ");
        this.applyDisplayState();
        this.refreshStyledLyricRender();

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Lyrics secondary color ${nextValue}.`);
        }
    }

    setAccentColor(value, persist = true, announce = true) {
        const nextValue = this.clampPrimaryColor(value);
        if (nextValue === this.displayState.accentColor) {
            return;
        }

        this.displayState.colorPresetId = "custom";
        this.displayState.accentColor = nextValue;
        this.displayState.multiColorList = [
            this.displayState.primaryColor,
            this.displayState.secondaryColor,
            nextValue
        ].join(", ");
        this.applyDisplayState();
        this.refreshStyledLyricRender();

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Lyrics accent color ${nextValue}.`);
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

    setTextBold(enabled, persist = true, announce = true) {
        const nextValue = Boolean(enabled);
        if (nextValue === this.displayState.textBold) {
            return;
        }

        this.displayState.textBold = nextValue;
        this.applyDisplayState();
        this.refreshStyledLyricRender();

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(nextValue ? "Lyrics bold enabled." : "Lyrics bold disabled.");
        }
    }

    setTextItalic(enabled, persist = true, announce = true) {
        const nextValue = Boolean(enabled);
        if (nextValue === this.displayState.textItalic) {
            return;
        }

        this.displayState.textItalic = nextValue;
        this.applyDisplayState();
        this.refreshStyledLyricRender();

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(nextValue ? "Lyrics italic enabled." : "Lyrics italic disabled.");
        }
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
        this.rebuildCleanPhraseChunks(false);
        this.renderAtTime(this.audio.currentTime * 1000, true);

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(
                this.displayState.kineticMode
                    ? `Kinetic words per line ${nextValue}.`
                    : `Lyrics words per line ${nextValue}.`
            );
        }
    }

    setKineticMaxCharsPerLine(value, persist = true, announce = true) {
        const nextValue = this.clampKineticMaxCharsPerLine(value);
        if (nextValue === this.displayState.kineticMaxCharsPerLine) {
            return;
        }

        this.displayState.kineticMaxCharsPerLine = nextValue;
        this.applyDisplayState();
        this.rebuildCleanPhraseChunks(false);
        this.renderAtTime(this.audio.currentTime * 1000, true);

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(
                this.displayState.kineticMode
                    ? `Kinetic chars per line ${nextValue}.`
                    : `Lyrics chars per line ${nextValue}.`
            );
        }
    }

    setKineticSpeedFactor(value, persist = true, announce = true) {
        const nextValue = this.clampKineticSpeedFactor(value);
        if (nextValue === this.displayState.kineticSpeedFactor) {
            return;
        }

        this.displayState.kineticSpeedFactor = nextValue;
        this.applyDisplayState();
        if (this.displayState.kineticMode) {
            this.renderAtTime(this.audio.currentTime * 1000, true);
        }

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Kinetic speed ${nextValue.toFixed(2)}x.`);
        }
    }

    setKineticStyle(value, persist = true, announce = true) {
        const nextValue = this.clampKineticStyle(value);
        if (nextValue === this.displayState.kineticStyle) {
            return;
        }

        this.displayState.kineticStyle = nextValue;
        if (nextValue === "clean-phrase") {
            this.rebuildCleanPhraseChunks(false);
        }
        this.applyDisplayState();
        if (this.displayState.kineticMode) {
            this.renderAtTime(this.audio.currentTime * 1000, true);
        }

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Kinetic style ${nextValue}.`);
        }
    }

    setKineticTailBurst(enabled, persist = true, announce = true) {
        const nextValue = Boolean(enabled);
        if (nextValue === this.displayState.kineticTailBurst) {
            return;
        }

        this.displayState.kineticTailBurst = nextValue;
        this.applyDisplayState();
        if (this.displayState.kineticMode) {
            this.renderAtTime(this.audio.currentTime * 1000, true);
        }

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(
                nextValue
                    ? "Tail burst enabled for the last word on each kinetic row."
                    : "Tail burst disabled."
            );
        }
    }

    setKineticTailBurstStyle(value, persist = true, announce = true) {
        const nextValue = this.clampTailBurstStyle(value);
        if (nextValue === this.displayState.kineticTailBurstStyle) {
            return;
        }

        this.displayState.kineticTailBurstStyle = nextValue;
        this.applyDisplayState();
        if (this.displayState.kineticMode && this.displayState.kineticTailBurst) {
            this.renderAtTime(this.audio.currentTime * 1000, true);
        }

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Tail burst style ${nextValue}.`);
        }
    }

    setKineticTailBurstColor(channel, value, persist = true, announce = true) {
        const normalized = this.clampPrimaryColor(value);
        let key = "";
        let label = "";

        switch (channel) {
            case "A":
                key = "kineticTailBurstColorA";
                label = "primary";
                break;
            case "B":
                key = "kineticTailBurstColorB";
                label = "secondary";
                break;
            case "Core":
                key = "kineticTailBurstColorCore";
                label = "core";
                break;
            default:
                return;
        }

        if (normalized === this.displayState[key]) {
            return;
        }

        this.displayState[key] = normalized;
        this.applyDisplayState();
        if (this.displayState.kineticMode && this.displayState.kineticTailBurst) {
            this.renderAtTime(this.audio.currentTime * 1000, true);
        }

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Tail burst ${label} color ${normalized}.`);
        }
    }

    setKineticTailBurstStrength(value, persist = true, announce = true) {
        const nextValue = this.clampKineticTailBurstStrength(value);
        if (nextValue === this.displayState.kineticTailBurstStrength) {
            return;
        }

        this.displayState.kineticTailBurstStrength = nextValue;
        this.applyDisplayState();
        if (this.displayState.kineticMode && this.displayState.kineticTailBurst) {
            this.renderAtTime(this.audio.currentTime * 1000, true);
        }

        if (persist) {
            this.persistDisplayState();
        }

        if (announce) {
            this.setStatus(`Tail burst strength ${nextValue.toFixed(2)}x.`);
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
        this.rebuildCleanPhraseChunks(false);
        this.applyDisplayState();
        this.keepOverlayInViewport();
        this.applyDisplayState();
        this.renderAtTime(this.audio.currentTime * 1000, true);
        this.persistDisplayState();
        this.setStatus("Lyrics overlay reset to default box, font, size, and position.");
    }

    toggleSettings(force) {
        const shouldOpen = typeof force === "boolean" ? force : !this.settingsOpen;
        this.appShell?.dispatchEvent(
            new CustomEvent("profile:open-customizer-tab", {
                bubbles: true,
                detail: {
                    tabId: "lyrics",
                    open: shouldOpen
                }
            })
        );
    }

    handleCustomizerStateChange(event) {
        const detail = event?.detail || {};
        this.settingsOpen = Boolean(detail.open && detail.tabId === "lyrics");
        this.shell.classList.toggle("is-settings-open", this.settingsOpen);
        if (this.tuneButton) {
            this.tuneButton.setAttribute("aria-expanded", this.settingsOpen ? "true" : "false");
            this.tuneButton.classList.toggle("is-active", this.settingsOpen);
        }
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
        this.root.style.setProperty("--lyrics-letter-spacing-adjust", `${this.displayState.letterSpacingAdjust.toFixed(3)}em`);
        this.root.style.setProperty("--lyrics-word-spacing-adjust", `${this.displayState.wordSpacingAdjust.toFixed(2)}em`);
        this.root.style.setProperty("--lyrics-primary-color", this.displayState.primaryColor);
        this.root.style.setProperty("--lyrics-secondary-color", this.displayState.secondaryColor);
        this.root.style.setProperty("--lyrics-accent-color", this.displayState.accentColor);
        this.root.style.setProperty("--lyrics-accent", this.displayState.accentColor);
        this.root.style.setProperty("--lyrics-tail-burst-a", this.displayState.kineticTailBurstColorA);
        this.root.style.setProperty("--lyrics-tail-burst-b", this.displayState.kineticTailBurstColorB);
        this.root.style.setProperty("--lyrics-tail-burst-core", this.displayState.kineticTailBurstColorCore);
        this.root.style.setProperty("--lyrics-tail-burst-strength", this.displayState.kineticTailBurstStrength.toFixed(2));
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
        this.root.style.setProperty("--lyrics-font-style", this.displayState.textItalic ? "italic" : "normal");
        this.root.style.setProperty("--lyrics-font-weight-main", this.displayState.textBold ? "900" : "800");
        this.root.style.setProperty("--lyrics-font-weight-sub", this.displayState.textBold ? "800" : "700");
        this.root.style.setProperty("--lyrics-font-weight-meta", this.displayState.textBold ? "700" : "600");
        const reactivePalette = this.resolveReactivePalette();
        this.updateHologram(reactivePalette, this.displayState.colorPresetId);
        this.root.style.setProperty("--lyrics-gradient-fill", this.buildGradientCss(reactivePalette));
        this.root.dataset.chromeMode = this.displayState.chromeMode;
        this.root.dataset.textAlign = this.displayState.textAlign;
        this.root.dataset.kineticStyle = this.displayState.kineticStyle;
        this.root.dataset.tailBurstStyle = this.displayState.kineticTailBurstStyle;
        this.root.dataset.colorMode = this.displayState.colorMode;
        this.root.dataset.colorPreset = this.displayState.colorPresetId;
        if (!(this.displayState.kineticMode && this.displayState.kineticStyle === "clean-phrase")) {
            this.body.style.transform = "";
            this.cleanPhraseBodyOffset = 0;
        }
        this.capturePureLayoutSnapshot();
        this.root.dataset.pureMode = this.displayState.pureMode ? "true" : "false";
        this.root.dataset.kineticMode = this.displayState.kineticMode ? "true" : "false";
        this.root.classList.toggle("is-pure", this.displayState.pureMode);
        this.root.classList.toggle("is-kinetic", this.displayState.kineticMode);
        this.root.classList.remove("is-side-lines-hidden", "is-current-fit");

        this.scaleRange.value = String(Math.round(this.displayState.textScale * 100));
        this.scaleValue.textContent = `${Math.round(this.displayState.textScale * 100)}%`;
        if (this.boxHazeRange) {
            this.boxHazeRange.min = String(this.displayConfig.minBoxHaze ?? 0);
            this.boxHazeRange.max = String(this.displayConfig.maxBoxHaze ?? 100);
            this.boxHazeRange.value = String(Math.round(this.displayState.boxHaze));
        }
        if (this.boxHazeValue) {
            this.boxHazeValue.textContent = `${Math.round(this.displayState.boxHaze)}%`;
        }
        this.fontSelect.value = this.displayState.fontPreset;
        if (this.boldToggle) {
            this.boldToggle.checked = Boolean(this.displayState.textBold);
        }
        if (this.italicToggle) {
            this.italicToggle.checked = Boolean(this.displayState.textItalic);
        }
        if (this.letterSpacingRange) {
            this.letterSpacingRange.min = String(Math.round((this.displayConfig.minLetterSpacingAdjust ?? -0.08) * 1000));
            this.letterSpacingRange.max = String(Math.round((this.displayConfig.maxLetterSpacingAdjust ?? 0.18) * 1000));
            this.letterSpacingRange.step = String(Math.round((this.displayConfig.letterSpacingAdjustStep ?? 0.005) * 1000));
            this.letterSpacingRange.value = String(Math.round(this.displayState.letterSpacingAdjust * 1000));
        }
        if (this.letterSpacingValue) {
            this.letterSpacingValue.textContent = this.formatLetterSpacingAdjust(this.displayState.letterSpacingAdjust);
        }
        if (this.wordSpacingRange) {
            this.wordSpacingRange.min = String(Math.round((this.displayConfig.minWordSpacingAdjust ?? -0.3) * 100));
            this.wordSpacingRange.max = String(Math.round((this.displayConfig.maxWordSpacingAdjust ?? 1.2) * 100));
            this.wordSpacingRange.step = String(Math.round((this.displayConfig.wordSpacingAdjustStep ?? 0.02) * 100));
            this.wordSpacingRange.value = String(Math.round(this.displayState.wordSpacingAdjust * 100));
        }
        if (this.wordSpacingValue) {
            this.wordSpacingValue.textContent = this.formatWordSpacingAdjust(this.displayState.wordSpacingAdjust);
        }
        if (this.textStyleSelect) {
            this.textStyleSelect.value = this.displayState.textStyle;
        }
        if (this.colorModeSelect) {
            this.colorModeSelect.value = this.displayState.colorMode;
        }
        if (this.primaryColorInput) {
            this.primaryColorInput.value = this.displayState.primaryColor;
        }
        if (this.secondaryColorInput) {
            this.secondaryColorInput.value = this.displayState.secondaryColor;
        }
        if (this.accentColorInput) {
            this.accentColorInput.value = this.displayState.accentColor;
        }
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
        if (this.kineticSpeedRange) {
            this.kineticSpeedRange.min = String(Math.round((this.displayConfig.minKineticSpeedFactor ?? 0.25) * 100));
            this.kineticSpeedRange.max = String(Math.round((this.displayConfig.maxKineticSpeedFactor ?? 2) * 100));
            this.kineticSpeedRange.step = String(Math.round((this.displayConfig.kineticSpeedStep ?? 0.05) * 100));
            this.kineticSpeedRange.value = String(Math.round(this.displayState.kineticSpeedFactor * 100));
        }
        if (this.kineticSpeedValue) {
            this.kineticSpeedValue.textContent = `${this.displayState.kineticSpeedFactor.toFixed(2)}x`;
        }
        if (this.kineticStyleSelect) {
            this.kineticStyleSelect.value = this.displayState.kineticStyle;
        }
        if (this.tailBurstToggle) {
            this.tailBurstToggle.checked = Boolean(this.displayState.kineticTailBurst);
        }
        if (this.tailBurstStyleSelect) {
            this.tailBurstStyleSelect.value = this.displayState.kineticTailBurstStyle;
        }
        if (this.tailBurstColorAInput) {
            this.tailBurstColorAInput.value = this.displayState.kineticTailBurstColorA;
        }
        if (this.tailBurstColorBInput) {
            this.tailBurstColorBInput.value = this.displayState.kineticTailBurstColorB;
        }
        if (this.tailBurstColorCoreInput) {
            this.tailBurstColorCoreInput.value = this.displayState.kineticTailBurstColorCore;
        }
        if (this.tailBurstStrengthRange) {
            this.tailBurstStrengthRange.min = String(Math.round((this.displayConfig.minKineticTailBurstStrength ?? 0.25) * 100));
            this.tailBurstStrengthRange.max = String(Math.round((this.displayConfig.maxKineticTailBurstStrength ?? 2) * 100));
            this.tailBurstStrengthRange.step = String(Math.round((this.displayConfig.kineticTailBurstStrengthStep ?? 0.05) * 100));
            this.tailBurstStrengthRange.value = String(Math.round(this.displayState.kineticTailBurstStrength * 100));
        }
        if (this.tailBurstStrengthValue) {
            this.tailBurstStrengthValue.textContent = `${this.displayState.kineticTailBurstStrength.toFixed(2)}x`;
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

    clampTextStyle(value) {
        const alias = value === "3d"
            ? "3d-effect"
            : value === "pixel"
                ? "pixel-game"
                : value;
        return this.textStylePresets.includes(alias) ? alias : "normal";
    }

    clampColorMode(value) {
        const alias = value === "gradient"
            ? "gradient-text"
            : value === "random"
                ? "random-per-word"
                : value;
        return this.colorModes.includes(alias) ? alias : "single";
    }

    getColorPreset(presetId) {
        return this.colorPresets.find((preset) => preset.id === presetId) || null;
    }

    clampColorPresetId(value) {
        if (value === "custom") {
            return "custom";
        }

        const normalized = String(value || "").trim();
        return this.getColorPreset(normalized)?.id
            || this.displayConfig.defaultColorPresetId
            || this.colorPresets[0]?.id
            || "custom";
    }

    applyColorPresetColorsToState(presetId) {
        const preset = this.getColorPreset(presetId);
        if (!preset) {
            return;
        }

        const colors = Array.isArray(preset.colors) ? preset.colors : [];
        this.displayState.primaryColor = this.clampPrimaryColor(colors[0] ?? this.displayConfig.defaultPrimaryColor ?? "#f9fcff");
        this.displayState.secondaryColor = this.clampPrimaryColor(colors[1] ?? colors[0] ?? this.displayConfig.defaultSecondaryColor ?? "#9fd4ff");
        this.displayState.accentColor = this.clampPrimaryColor(colors[2] ?? colors[1] ?? colors[0] ?? this.displayConfig.defaultAccentColor ?? "#8ef4ff");
        this.displayState.multiColorList = [
            this.displayState.primaryColor,
            this.displayState.secondaryColor,
            this.displayState.accentColor
        ].join(", ");
    }

    clampPrimaryColor(value) {
        const color = String(value || "").trim();
        return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)
            ? (color.length === 4
                ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toLowerCase()
                : color.toLowerCase())
            : "#f9fcff";
    }

    normalizeCssColor(value) {
        const raw = String(value || "").trim();
        if (!raw) {
            return null;
        }

        if (!this.colorProbe && typeof document !== "undefined") {
            this.colorProbe = document.createElement("span");
        }

        if (!this.colorProbe?.style) {
            return null;
        }

        this.colorProbe.style.color = "";
        this.colorProbe.style.color = raw;
        return this.colorProbe.style.color || null;
    }

    splitColorListInput(value) {
        const input = String(value || "");
        const parts = [];
        let buffer = "";
        let depth = 0;

        for (const char of input) {
            if (char === "(") {
                depth += 1;
            } else if (char === ")" && depth > 0) {
                depth -= 1;
            }

            if ((char === "," || char === ";" || char === "\n" || char === "\r") && depth === 0) {
                parts.push(buffer);
                buffer = "";
                continue;
            }

            buffer += char;
        }

        if (buffer.trim()) {
            parts.push(buffer);
        }

        return parts;
    }

    sanitizeMultiColorList(value) {
        const colors = this.splitColorListInput(value)
            .map((part) => this.normalizeCssColor(part))
            .filter(Boolean);
        return colors.join(", ");
    }

    updateMultiColorPreview(value = this.displayState.multiColorList, label = null) {
        if (!this.multiColorPreview) {
            return;
        }

        const validColors = Array.isArray(value)
            ? value.map((part) => this.normalizeCssColor(part)).filter(Boolean)
            : this.splitColorListInput(value).map((part) => this.normalizeCssColor(part)).filter(Boolean);
        this.multiColorPreview.replaceChildren();

        if (validColors.length === 0) {
            const empty = document.createElement("span");
            empty.className = "lyrics-color-preview-empty";
            empty.textContent = "Choose a preset or tune Color 1, 2, and 3 for live hologram text.";
            this.multiColorPreview.appendChild(empty);
            this.multiColorPreview.dataset.state = "empty";
            return;
        }

        const swatches = document.createElement("span");
        swatches.className = "lyrics-color-swatches";
        validColors.forEach((color, index) => {
            const swatch = document.createElement("span");
            swatch.className = "lyrics-color-swatch";
            swatch.style.background = color;
            swatch.title = color;
            swatch.setAttribute("aria-label", `Palette color ${index + 1}: ${color}`);
            swatches.appendChild(swatch);
        });

        const summary = document.createElement("span");
        summary.className = "lyrics-color-preview-summary";
        const presetLabel = label
            || this.getColorPreset(this.displayState.colorPresetId)?.label
            || (this.displayState.colorPresetId === "custom" ? "Custom" : "Palette");
        summary.textContent = `${presetLabel} · ${validColors.length} color${validColors.length === 1 ? "" : "s"} active`;

        this.multiColorPreview.append(swatches, summary);
        this.multiColorPreview.dataset.state = "ready";
    }

    resolveConfiguredPalette() {
        return [
            this.displayState.primaryColor,
            this.displayState.secondaryColor,
            this.displayState.accentColor
        ].map((part) => this.normalizeCssColor(part)).filter(Boolean);
    }

    updateHologram(colors, presetId = this.displayState.colorPresetId) {
        const palette = Array.isArray(colors) && colors.length > 0
            ? colors
            : this.resolveConfiguredPalette();
        const colorA = palette[0] || this.displayState.primaryColor;
        const colorB = palette[1] || colorA;
        const colorC = palette[2] || colorB || colorA;

        this.root.style.setProperty("--holo-1", colorA);
        this.root.style.setProperty("--holo-2", colorB);
        this.root.style.setProperty("--holo-3", colorC);
        this.root.style.setProperty("--lyrics-hologram-fill", this.buildGradientCss([colorA, colorB, colorC]));

        if (this.colorPresetGallery) {
            this.colorPresetGallery.querySelectorAll(".lyrics-preset-button").forEach((button) => {
                const active = button.dataset.presetId === presetId;
                button.classList.toggle("is-active", active);
                button.setAttribute("aria-pressed", active ? "true" : "false");
                if (button.dataset.presetId === "custom") {
                    button.style.setProperty("--preset-swatch", this.buildGradientCss([colorA, colorB, colorC]));
                }
            });
        }

        this.updateMultiColorPreview(
            [colorA, colorB, colorC],
            this.getColorPreset(presetId)?.label || (presetId === "custom" ? "Custom" : "Palette")
        );
    }

    cssColorToRgb(value) {
        const normalized = this.normalizeCssColor(value);
        if (!normalized) {
            return null;
        }

        const match = normalized.match(/rgba?\(([^)]+)\)/i);
        if (!match) {
            return null;
        }

        const channels = match[1]
            .split(",")
            .map((part) => Number.parseFloat(part.trim()))
            .filter((channel) => Number.isFinite(channel));
        if (channels.length < 3) {
            return null;
        }

        return {
            r: Math.round(channels[0]),
            g: Math.round(channels[1]),
            b: Math.round(channels[2])
        };
    }

    mixCssColors(colorA, colorB, ratio) {
        const left = this.cssColorToRgb(colorA);
        const right = this.cssColorToRgb(colorB);
        if (!left || !right) {
            return this.normalizeCssColor(colorA) || this.clampPrimaryColor(colorA);
        }

        const safeRatio = Math.min(Math.max(Number(ratio) || 0, 0), 1);
        const mixChannel = (start, end) => Math.round(start + ((end - start) * safeRatio));
        return `rgb(${mixChannel(left.r, right.r)} ${mixChannel(left.g, right.g)} ${mixChannel(left.b, right.b)})`;
    }

    resolveReactivePalette() {
        const basePalette = this.resolveConfiguredPalette();
        const heat = Math.min(
            Math.max((this.clampAudioValue(this.audioReactiveState.bass) * 0.74) + (this.clampAudioValue(this.audioReactiveState.pulse) * 0.26), 0),
            1
        );
        const coolTargets = ["#72d6ff", "#7d9dff", "#b38aff"];
        const warmTargets = ["#ff6d48", "#ff9f43", "#ffd166"];

        return basePalette.map((color, index) => {
            const coolMixed = this.mixCssColors(color, coolTargets[index % coolTargets.length], 0.22);
            return this.mixCssColors(coolMixed, warmTargets[index % warmTargets.length], heat * 0.58);
        });
    }

    clampLetterSpacingAdjust(value) {
        const min = this.displayConfig.minLetterSpacingAdjust ?? -0.08;
        const max = this.displayConfig.maxLetterSpacingAdjust ?? 0.18;
        const step = this.displayConfig.letterSpacingAdjustStep ?? 0.005;
        const numericValue = Number(value);
        const fallback = this.displayConfig.defaultLetterSpacingAdjust ?? 0;
        const resolved = Number.isFinite(numericValue) ? numericValue : fallback;
        const clamped = Math.min(Math.max(resolved, min), max);
        return Math.round(clamped / step) * step;
    }

    formatLetterSpacingAdjust(value) {
        const numericValue = Number.isFinite(value) ? value : 0;
        const prefix = numericValue >= 0 ? "+" : "";
        return `${prefix}${numericValue.toFixed(2)}em`;
    }

    clampWordSpacingAdjust(value) {
        const min = this.displayConfig.minWordSpacingAdjust ?? -0.3;
        const max = this.displayConfig.maxWordSpacingAdjust ?? 1.2;
        const step = this.displayConfig.wordSpacingAdjustStep ?? 0.02;
        const numericValue = Number(value);
        const fallback = this.displayConfig.defaultWordSpacingAdjust ?? 0;
        const resolved = Number.isFinite(numericValue) ? numericValue : fallback;
        const clamped = Math.min(Math.max(resolved, min), max);
        return Math.round(clamped / step) * step;
    }

    formatWordSpacingAdjust(value) {
        const numericValue = Number.isFinite(value) ? value : 0;
        const prefix = numericValue >= 0 ? "+" : "";
        return `${prefix}${numericValue.toFixed(2)}em`;
    }

    hexToHsl(color) {
        const normalized = this.clampPrimaryColor(color).replace("#", "");
        const red = parseInt(normalized.slice(0, 2), 16) / 255;
        const green = parseInt(normalized.slice(2, 4), 16) / 255;
        const blue = parseInt(normalized.slice(4, 6), 16) / 255;
        const max = Math.max(red, green, blue);
        const min = Math.min(red, green, blue);
        const lightness = (max + min) / 2;
        const delta = max - min;
        let hue = 0;
        let saturation = 0;

        if (delta !== 0) {
            saturation = delta / (1 - Math.abs(2 * lightness - 1));
            switch (max) {
                case red:
                    hue = 60 * (((green - blue) / delta) % 6);
                    break;
                case green:
                    hue = 60 * (((blue - red) / delta) + 2);
                    break;
                default:
                    hue = 60 * (((red - green) / delta) + 4);
                    break;
            }
        }

        if (hue < 0) {
            hue += 360;
        }

        return {
            h: hue,
            s: saturation * 100,
            l: lightness * 100
        };
    }

    hslToCss(hue, saturation, lightness) {
        return `hsl(${Math.round((hue + 360) % 360)} ${Math.round(Math.min(Math.max(saturation, 0), 100))}% ${Math.round(Math.min(Math.max(lightness, 0), 100))}%)`;
    }

    hashTextSeed(value = "") {
        let hash = 0;
        const input = String(value);
        for (let index = 0; index < input.length; index += 1) {
            hash = ((hash << 5) - hash) + input.charCodeAt(index);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    isGradientTextMode() {
        return this.displayState.colorMode === "gradient-text";
    }

    isRandomPerCharMode() {
        return this.displayState.colorMode === "random-per-char";
    }

    isPixelGameStyle() {
        return this.displayState.textStyle === "pixel-game";
    }

    buildGradientCss(palette = this.resolveReactivePalette()) {
        const stops = palette.map((color, index) => {
            const ratio = palette.length <= 1 ? 0 : index / (palette.length - 1);
            return `${color} ${(ratio * 100).toFixed(1)}%`;
        });
        return `linear-gradient(90deg, ${stops.join(", ")})`;
    }

    resolveWordColor(index, totalWords, text = "", palette = this.resolveReactivePalette()) {
        if (this.displayState.colorMode === "random-per-word" || this.displayState.colorMode === "random-per-char") {
            const seed = this.hashTextSeed(`${text}:${index}:${totalWords}:${palette.join("|")}`);
            return palette[seed % palette.length];
        }

        if (this.displayState.colorMode === "gradient-text") {
            const ratio = totalWords <= 1 ? 0 : index / Math.max(totalWords - 1, 1);
            const fromColor = ratio < 0.5 ? (palette[0] || this.displayState.primaryColor) : (palette[1] || palette[0] || this.displayState.primaryColor);
            const toColor = ratio < 0.5 ? (palette[1] || palette[0] || this.displayState.primaryColor) : (palette[2] || palette[1] || palette[0] || this.displayState.primaryColor);
            const localRatio = ratio < 0.5 ? ratio / 0.5 : (ratio - 0.5) / 0.5;
            return this.mixCssColors(fromColor, toColor, localRatio);
        }

        return palette[0] || this.displayState.primaryColor;
    }

    mixHexColors(colorA, colorB, ratio) {
        const left = this.clampPrimaryColor(colorA).replace("#", "");
        const right = this.clampPrimaryColor(colorB).replace("#", "");
        const safeRatio = Math.min(Math.max(Number(ratio) || 0, 0), 1);
        const mixChannel = (start, end) => Math.round(start + ((end - start) * safeRatio));
        const red = mixChannel(parseInt(left.slice(0, 2), 16), parseInt(right.slice(0, 2), 16));
        const green = mixChannel(parseInt(left.slice(2, 4), 16), parseInt(right.slice(2, 4), 16));
        const blue = mixChannel(parseInt(left.slice(4, 6), 16), parseInt(right.slice(4, 6), 16));
        return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
    }

    applyTextStyle(styleName = this.displayState.textStyle) {
        if (!this.currentLine) {
            return;
        }

        const nextStyle = this.clampTextStyle(styleName);
        this.currentLine.classList.remove("style-normal", "style-outline", "style-3d-effect", "style-pixel-game", "style-3d", "style-pixel");
        this.currentLine.classList.add(`style-${nextStyle}`);
        this.currentLine.dataset.textStyle = nextStyle;
    }

    clearTokenVisuals(node) {
        node.style.removeProperty("--lyrics-word-color");
        node.style.removeProperty("--lyrics-word-accent");
        node.style.removeProperty("background-image");
        node.style.removeProperty("background-size");
        node.style.removeProperty("background-position");
        node.style.removeProperty("background-clip");
        node.style.removeProperty("-webkit-background-clip");
        node.style.removeProperty("color");
        node.style.removeProperty("-webkit-text-fill-color");
    }

    restoreTokenNode(node) {
        if (!node) {
            return;
        }

        const token = node.dataset.token ?? node.textContent ?? "";
        if (node.dataset.tokenMode === "char") {
            node.replaceChildren();
            node.textContent = token;
            node.dataset.tokenMode = "word";
        }
    }

    decorateTokenChars(node, tokenText, palette, wordIndex, totalWords) {
        node.dataset.token = tokenText;
        node.dataset.tokenMode = "char";
        const chars = Array.from(tokenText);
        const fragment = document.createDocumentFragment();

        chars.forEach((char, charIndex) => {
            const charNode = document.createElement("span");
            charNode.className = "lyric-char";
            charNode.textContent = char;
            const seed = this.hashTextSeed(`${tokenText}:${wordIndex}:${charIndex}:${palette.join("|")}`);
            const color = palette[seed % palette.length];
            charNode.style.setProperty("--lyrics-word-color", color);
            charNode.style.setProperty("--lyrics-word-accent", color);
            fragment.appendChild(charNode);
        });

        node.replaceChildren(fragment);
    }

    applyCurrentTextPresentation() {
        this.applyTextStyle(this.displayState.textStyle);
        const wordNodes = Array.from(this.currentLine?.querySelectorAll(".lyric-word, .kinetic-word, .clean-phrase-word") || []);
        if (wordNodes.length === 0) {
            return;
        }

        const palette = this.resolveReactivePalette();
        const isGradient = this.isGradientTextMode();
        const allowPerChar = this.isRandomPerCharMode() && !this.currentLine.classList.contains("is-clean-phrase-line");
        wordNodes.forEach((node, index) => {
            const tokenText = node.dataset.token ?? node.textContent ?? "";
            this.clearTokenVisuals(node);
            if (allowPerChar) {
                this.decorateTokenChars(node, tokenText, palette, index, wordNodes.length);
                return;
            }

            this.restoreTokenNode(node);
            const color = this.resolveWordColor(index, wordNodes.length, tokenText, palette);
            node.style.setProperty("--lyrics-word-color", color);
            node.style.setProperty("--lyrics-word-accent", color);

            if (isGradient && !(node.classList.contains("clean-phrase-word") && node.classList.contains("is-active"))) {
                const gradient = this.buildGradientCss(palette);
                const position = wordNodes.length <= 1
                    ? "50% 50%"
                    : `${(100 - ((index / Math.max(wordNodes.length - 1, 1)) * 100)).toFixed(1)}% 50%`;
                node.style.backgroundImage = gradient;
                node.style.backgroundSize = "200% 100%";
                node.style.backgroundPosition = position;
                node.style.webkitBackgroundClip = "text";
                node.style.backgroundClip = "text";
                node.style.color = "transparent";
                node.style.webkitTextFillColor = "transparent";
            }
        });
    }

    refreshStyledLyricRender() {
        if (window.gsap) {
            window.gsap.killTweensOf(".lyric-word");
            window.gsap.killTweensOf(".kinetic-word");
            window.gsap.killTweensOf(".clean-phrase-word");
            window.gsap.killTweensOf(this.currentLine);
        }

        if (this.isLoaded) {
            this.renderAtTime(this.audio.currentTime * 1000, true);
            return;
        }

        this.applyCurrentTextPresentation();
        this.scheduleOverflowLayout();
    }

    clampKineticSpeedFactor(value) {
        const min = this.displayConfig.minKineticSpeedFactor ?? 0.25;
        const max = this.displayConfig.maxKineticSpeedFactor ?? 2;
        const step = this.displayConfig.kineticSpeedStep ?? 0.05;
        const numericValue = Number(value);
        const fallback = this.displayConfig.defaultKineticSpeedFactor ?? 1;
        const resolved = Number.isFinite(numericValue) ? numericValue : fallback;
        const clamped = Math.min(Math.max(resolved, min), max);
        return Math.round(clamped / step) * step;
    }

    clampKineticStyle(value) {
        return this.kineticStylePresets.includes(value) ? value : "center-build";
    }

    clampTailBurstStyle(value) {
        return this.tailBurstStylePresets.includes(value) ? value : "glow-burst";
    }

    clampKineticTailBurstStrength(value) {
        const min = this.displayConfig.minKineticTailBurstStrength ?? 0.25;
        const max = this.displayConfig.maxKineticTailBurstStrength ?? 2;
        const step = this.displayConfig.kineticTailBurstStrengthStep ?? 0.05;
        const numericValue = Number(value);
        const fallback = this.displayConfig.defaultKineticTailBurstStrength ?? 1;
        const resolved = Number.isFinite(numericValue) ? numericValue : fallback;
        const clamped = Math.min(Math.max(resolved, min), max);
        return Math.round(clamped / step) * step;
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
            if (this.displayState.kineticStyle === "clean-phrase") {
                this.root.classList.remove("is-side-lines-hidden");
                this.root.style.setProperty("--lyrics-current-fit-scale", "1");

                const cleanWords = this.currentLine.querySelectorAll(".clean-phrase-word");
                if (cleanWords.length === 0) {
                    this.root.classList.remove("is-current-fit");
                    return;
                }

                const currentRect = this.currentLine.getBoundingClientRect();
                const availableWidth = Math.max(1, currentRect.width - 12);
                const availableHeight = Math.max(1, currentRect.height - 8);
                const contentWidth = Math.max(this.currentLine.scrollWidth, currentRect.width);
                const contentHeight = Math.max(this.currentLine.scrollHeight, currentRect.height);
                const widthRatio = contentWidth > 0 ? availableWidth / contentWidth : 1;
                const heightRatio = contentHeight > 0 ? availableHeight / contentHeight : 1;
                const fitScale = Math.max(0.74, Math.min(1, widthRatio, heightRatio));

                if (fitScale < 0.999) {
                    this.root.classList.add("is-current-fit");
                    this.root.style.setProperty("--lyrics-current-fit-scale", fitScale.toFixed(4));
                } else {
                    this.root.classList.remove("is-current-fit");
                }
                return;
            }

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
        if (this.letterSpacingRange) {
            this.letterSpacingRange.min = String(Math.round((this.displayConfig.minLetterSpacingAdjust ?? -0.08) * 1000));
            this.letterSpacingRange.max = String(Math.round((this.displayConfig.maxLetterSpacingAdjust ?? 0.18) * 1000));
            this.letterSpacingRange.step = String(Math.round((this.displayConfig.letterSpacingAdjustStep ?? 0.005) * 1000));
        }
        if (this.wordSpacingRange) {
            this.wordSpacingRange.min = String(Math.round((this.displayConfig.minWordSpacingAdjust ?? -0.3) * 100));
            this.wordSpacingRange.max = String(Math.round((this.displayConfig.maxWordSpacingAdjust ?? 1.2) * 100));
            this.wordSpacingRange.step = String(Math.round((this.displayConfig.wordSpacingAdjustStep ?? 0.02) * 100));
        }
    }

    setAudioReactiveState(payload = {}) {
        const overall = this.clampAudioValue(payload.overall);
        const bass = this.clampAudioValue(payload.bass);
        const mid = this.clampAudioValue(payload.mid);
        const high = this.clampAudioValue(payload.high);
        const pulse = this.clampAudioValue(payload.pulse);
        const transient = this.clampAudioValue(payload.transient);
        const intensity = this.clampAudioValue(payload.intensity);
        const shellLevel = this.clampAudioValue((overall * 0.34 + pulse * 0.28) * intensity);
        const textLevel = this.clampAudioValue((mid * 0.54 + high * 0.28 + pulse * 0.18) * intensity);

        this.audioReactiveState = {
            overall,
            bass,
            mid,
            high,
            pulse,
            transient,
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
