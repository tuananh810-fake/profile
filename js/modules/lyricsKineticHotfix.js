const EXACT_TIMING_MODES = new Set(["lyrics-pro", "enhanced-lrc", "karaoke"]);

function toNumber(value, fallback = NaN) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
}

function hasExactWordTimingInLine(line) {
    const words = Array.isArray(line?.words) ? line.words : [];
    return words.some((word) => {
        const start = toNumber(word?.startTime ?? word?.timeMs ?? word?.startMs ?? word?.start ?? word?.s);
        const end = toNumber(word?.endTime ?? word?.endMs ?? word?.end ?? word?.e);
        const sourceMode = String(word?.sourceMode || line?.sourceMode || "").toLowerCase();

        return Number.isFinite(start)
            && (
                Number.isFinite(end)
                || EXACT_TIMING_MODES.has(sourceMode)
            );
    });
}

function hasExactWordTiming(value) {
    if (!value) {
        return false;
    }

    if (hasExactWordTimingInLine(value)) {
        return true;
    }

    if (Array.isArray(value)) {
        return value.some((entry) => hasExactWordTiming(entry));
    }

    if (typeof value === "object") {
        if (value.hasWordTimings === true && Array.isArray(value.wordScheduleMs)) {
            return true;
        }

        return ["karaokeLine", "line", "currentLine", "payload"].some((key) => hasExactWordTiming(value[key]));
    }

    return false;
}

function getWordText(word) {
    return String(word?.text || word?.word || word?.w || "");
}

function shouldBatchWordPair(previousWord, nextWord, previousSchedule, nextSchedule) {
    if (!previousWord || !nextWord) {
        return false;
    }

    const previousStart = toNumber(
        previousWord.startTime ?? previousWord.timeMs ?? previousWord.startMs ?? previousWord.start,
        previousSchedule
    );
    const previousEnd = toNumber(
        previousWord.endTime ?? previousWord.endMs ?? previousWord.end,
        NaN
    );
    const nextStart = toNumber(
        nextWord.startTime ?? nextWord.timeMs ?? nextWord.startMs ?? nextWord.start,
        nextSchedule
    );

    if (!Number.isFinite(previousStart) || !Number.isFinite(nextStart)) {
        return false;
    }

    const previousDuration = Number.isFinite(previousEnd)
        ? previousEnd - previousStart
        : nextStart - previousStart;
    const gapToNext = Number.isFinite(previousEnd)
        ? nextStart - previousEnd
        : nextStart - previousStart;

    const previousText = getWordText(previousWord);
    const nextText = getWordText(nextWord);
    const previousEmphasis = toNumber(previousWord.emphasis, 0);
    const nextEmphasis = toNumber(nextWord.emphasis, 0);

    const previousIsHeld = previousDuration >= 360
        || previousEmphasis >= 0.65
        || /[,.!?;:…]$/.test(previousText);
    const nextIsHeavy = nextEmphasis >= 0.65
        || /[,.!?;:…]$/.test(nextText);

    return gapToNext >= 0
        && gapToNext <= 70
        && previousDuration <= 260
        && !previousIsHeld
        && !nextIsHeavy;
}

function sanitizeTimedState(state) {
    if (!state || typeof state !== "object" || !state.hasWordTimings) {
        return state;
    }

    state.entryLeadMs = 0;
    state.entryLeadSeconds = 0;

    if (Array.isArray(state.wordPayload) && Array.isArray(state.wordScheduleMs)) {
        state.wordScheduleMs = state.wordScheduleMs.map((schedule, index) => {
            const word = state.wordPayload[index] || null;
            const wordTime = toNumber(word?.timeMs ?? word?.startTime ?? word?.startMs ?? word?.start, NaN);
            return Number.isFinite(wordTime) ? wordTime : schedule;
        });
    }

    return state;
}

function sanitizeScheduleTree(value, seen = new WeakSet()) {
    if (!value || typeof value !== "object") {
        return value;
    }

    if (seen.has(value)) {
        return value;
    }
    seen.add(value);

    if (Array.isArray(value)) {
        value.forEach((entry) => sanitizeScheduleTree(entry, seen));
        return value;
    }

    const exactTime = toNumber(value.timeMs ?? value.startTime ?? value.startMs ?? value.start, NaN);
    if (Number.isFinite(exactTime) && Object.prototype.hasOwnProperty.call(value, "scheduleMs")) {
        value.scheduleMs = exactTime;
    }

    if (Object.prototype.hasOwnProperty.call(value, "leadMs")) {
        value.leadMs = Math.min(Math.max(toNumber(value.leadMs, 0), 0), 35);
    }

    Object.keys(value).forEach((key) => sanitizeScheduleTree(value[key], seen));
    return value;
}

function buildEnhancedLrcLines(fallbackLines = []) {
    if (!Array.isArray(fallbackLines)) {
        return [];
    }

    return fallbackLines
        .filter((line) => line
            && Number.isFinite(toNumber(line.timeMs))
            && Array.isArray(line.words)
            && line.words.length > 0)
        .map((line) => ({
            lineStartMs: toNumber(line.timeMs, 0),
            lineEndMs: null,
            text: line.text || "",
            sourceMode: "enhanced-lrc",
            words: line.words
                .filter((word) => word && getWordText(word).trim())
                .map((word, index) => ({
                    ...word,
                    text: getWordText(word).trim(),
                    startTime: toNumber(word.startTime ?? word.timeMs, toNumber(line.timeMs, 0)),
                    endTime: toNumber(word.endTime, null),
                    timeMs: toNumber(word.timeMs ?? word.startTime, toNumber(line.timeMs, 0)),
                    sourceMode: "enhanced-lrc",
                    index
                }))
        }));
}

export default function applyLyricsKineticHotfix(LyricsEngine) {
    const proto = LyricsEngine?.prototype;
    if (!proto || proto.__lyricsKineticHotfixApplied) {
        return;
    }

    Object.defineProperty(proto, "__lyricsKineticHotfixApplied", {
        value: true,
        configurable: false
    });

    const originalSetKaraokeLines = proto.setKaraokeLines;
    proto.setKaraokeLines = function setKaraokeLinesHotfix(lines = [], fallbackLines = [], meta = {}) {
        const explicitLines = Array.isArray(lines) ? lines : [];
        const enhancedLrcLines = buildEnhancedLrcLines(fallbackLines);
        const nextLines = explicitLines.length > 0 ? explicitLines : enhancedLrcLines;
        const nextMeta = explicitLines.length > 0
            ? meta
            : {
                ...(meta && typeof meta === "object" ? meta : {}),
                mode: enhancedLrcLines.length > 0 ? "enhanced-lrc" : meta?.mode
            };

        if (typeof originalSetKaraokeLines === "function") {
            originalSetKaraokeLines.call(this, nextLines, fallbackLines, nextMeta);
        } else {
            this.karaokeLines = nextLines;
            this.karaokeLineMap = new Map();
            this.karaokeMeta = nextMeta && typeof nextMeta === "object" ? nextMeta : {};
        }
    };

    const originalResolveKineticTiming = proto.resolveKineticTiming;
    if (typeof originalResolveKineticTiming === "function") {
        proto.resolveKineticTiming = function resolveKineticTimingHotfix(...args) {
            const timing = originalResolveKineticTiming.apply(this, args);

            if (timing && hasExactWordTiming(args)) {
                timing.entryLeadSeconds = 0;
                timing.entryLeadMs = 0;
                timing.leadSeconds = 0;
                timing.leadMs = 0;

                if (Number.isFinite(timing.availableSeconds)) {
                    timing.usableSeconds = Math.max(0.28, timing.availableSeconds);
                }
            }

            return timing;
        };
    }

    const originalEnrichKineticWordProfiles = proto.enrichKineticWordProfiles;
    if (typeof originalEnrichKineticWordProfiles === "function") {
        proto.enrichKineticWordProfiles = function enrichKineticWordProfilesHotfix(words = [], ...rest) {
            const enriched = originalEnrichKineticWordProfiles.call(this, words, ...rest);

            if (!Array.isArray(enriched)) {
                return enriched;
            }

            return enriched.map((word, index) => {
                const source = Array.isArray(words) ? words[index] || {} : {};
                const startTime = toNumber(word.startTime ?? source.startTime ?? source.timeMs, NaN);
                const endTime = toNumber(word.endTime ?? source.endTime, NaN);
                const sourceMode = String(word.sourceMode || source.sourceMode || "").toLowerCase();
                const hasExact = Number.isFinite(startTime)
                    && (Number.isFinite(endTime) || EXACT_TIMING_MODES.has(sourceMode));

                if (!hasExact) {
                    return word;
                }

                return {
                    ...source,
                    ...word,
                    startTime,
                    endTime: Number.isFinite(endTime) ? endTime : word.endTime ?? source.endTime ?? null,
                    timeMs: toNumber(word.timeMs ?? source.timeMs ?? startTime, startTime),
                    leadMs: 0
                };
            });
        };
    }

    const originalCreateKineticRows = proto.createKineticRows;
    if (typeof originalCreateKineticRows === "function") {
        proto.createKineticRows = function createKineticRowsHotfix(...args) {
            const rows = originalCreateKineticRows.apply(this, args);
            return sanitizeScheduleTree(rows);
        };
    }

    const originalSyncKineticProgress = proto.syncKineticProgress;
    if (typeof originalSyncKineticProgress === "function") {
        proto.syncKineticProgress = function syncKineticProgressHotfix(...args) {
            args.forEach((arg) => sanitizeTimedState(arg));
            return originalSyncKineticProgress.apply(this, args);
        };
    }

    proto.resolveTimedKineticWordCount = function resolveTimedKineticWordCount(state, timeMs) {
        const schedules = Array.isArray(state?.wordScheduleMs) ? state.wordScheduleMs : [];
        const payload = Array.isArray(state?.wordPayload) ? state.wordPayload : [];

        let count = 0;
        for (let index = 0; index < schedules.length; index += 1) {
            const wordTimeMs = toNumber(schedules[index], NaN);
            if (Number.isFinite(wordTimeMs) && wordTimeMs <= timeMs) {
                count = index + 1;
                continue;
            }
            break;
        }

        while (count > 0 && count < schedules.length) {
            const previousWord = payload[count - 1] || null;
            const nextWord = payload[count] || null;
            if (!shouldBatchWordPair(previousWord, nextWord, schedules[count - 1], schedules[count])) {
                break;
            }
            count += 1;
        }

        return Math.min(Number(state?.totalWordCount) || schedules.length, count);
    };
}
