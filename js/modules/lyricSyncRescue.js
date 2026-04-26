function parseTimeParts(minutes, seconds) {
    const minuteValue = Number(minutes);
    const secondValue = Number(seconds);
    if (!Number.isFinite(minuteValue) || !Number.isFinite(secondValue)) return null;
    return minuteValue * 60 + secondValue;
}

function normalizeSeconds(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return numeric > 300 ? numeric / 1000 : numeric;
}

function readTextFromWords(words = []) {
    return words
        .map((word) => word?.text || word?.word || word?.value || "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
}

function parseLrc(text = "") {
    const lines = [];
    text.split(/\r?\n/).forEach((rawLine) => {
        const matches = [...rawLine.matchAll(/\[(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)\]/g)];
        if (!matches.length) return;
        const lyricText = rawLine.replace(/\[[^\]]+\]/g, "").trim();
        if (!lyricText) return;
        matches.forEach((match) => {
            const start = parseTimeParts(match[1], match[2]);
            if (start !== null) lines.push({ start, text: lyricText });
        });
    });
    return lines.sort((a, b) => a.start - b.start);
}

function parseKaraokeData(karaokeData) {
    if (!Array.isArray(karaokeData?.lines)) return [];
    return karaokeData.lines
        .map((line) => {
            const words = Array.isArray(line?.words) ? line.words : [];
            const firstWord = words[0] || {};
            const start = normalizeSeconds(
                line?.startTime
                ?? line?.startMs
                ?? line?.timeMs
                ?? line?.time
                ?? line?.start
                ?? line?.s
                ?? firstWord?.startTime
                ?? firstWord?.startMs
                ?? firstWord?.timeMs
                ?? firstWord?.start
            );
            const text = (line?.text || line?.line || readTextFromWords(words) || "").trim();
            return start !== null && text ? { start, text } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.start - b.start);
}

export default function installLyricSyncRescue({ audio, musicPlayer, root } = {}) {
    const overlay = root || document.getElementById("lyricsOverlay");
    const previous = document.getElementById("lyricsPrevious");
    const current = document.getElementById("lyricsCurrent");
    const next = document.getElementById("lyricsNext");
    const body = document.getElementById("lyricsBody");

    if (!audio || !overlay || !previous || !current || !next) {
        return { refresh() {}, destroy() {} };
    }

    const styleId = "lyricSyncRescueStyle";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            .lyrics-overlay {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            .lyrics-body {
                visibility: visible !important;
            }
            .lyrics-line {
                font-family: "Plus Jakarta Sans", "Outfit", system-ui, sans-serif !important;
                text-shadow: 0 0 1.1rem rgba(115, 211, 255, .28) !important;
            }
            .lyrics-line--current {
                color: rgba(247, 251, 255, .94) !important;
                opacity: 1 !important;
                filter: none !important;
            }
            .lyrics-line--previous,
            .lyrics-line--next {
                color: rgba(247, 251, 255, .36) !important;
                opacity: .46 !important;
            }
            #effectsCanvas,
            .effects-canvas,
            .effects-orb {
                opacity: 0 !important;
                display: none !important;
            }
        `;
        document.head.append(style);
    }

    const toggleLyrics = document.getElementById("toggleLyrics");
    if (toggleLyrics?.checked) {
        toggleLyrics.checked = false;
        toggleLyrics.dispatchEvent(new Event("change", { bubbles: true }));
    }

    overlay.hidden = false;
    overlay.style.display = "";
    overlay.style.visibility = "visible";
    if (body) body.hidden = false;

    let activeTrackId = null;
    let activeSourceKey = "";
    let activeLines = [];
    let loadingToken = 0;

    async function loadTrackLines() {
        const track = musicPlayer?.getCurrentTrack?.() || null;
        const sourceKey = [
            track?.id || "no-id",
            track?.lyricsData ? "lyricsData" : "",
            track?.lyrics || "",
            track?.karaokeData ? "karaokeData" : ""
        ].join("|");

        if (sourceKey === activeSourceKey && activeLines.length) return activeLines;

        activeSourceKey = sourceKey;
        activeTrackId = track?.id || null;
        const token = loadingToken + 1;
        loadingToken = token;

        let lines = [];
        if (track?.karaokeData) lines = parseKaraokeData(track.karaokeData);
        if (!lines.length && typeof track?.lyricsData === "string") lines = parseLrc(track.lyricsData);
        if (!lines.length && typeof track?.lyrics === "string") {
            try {
                const response = await fetch(track.lyrics, { cache: "force-cache" });
                if (response.ok) lines = parseLrc(await response.text());
            } catch {
                // Keep overlay usable when lyric file fetch fails.
            }
        }

        if (token === loadingToken) activeLines = lines;
        return activeLines;
    }

    function renderLines(lines) {
        if (!lines.length) {
            const track = musicPlayer?.getCurrentTrack?.() || {};
            previous.textContent = "";
            current.textContent = track.title ? `No synced lyric for ${track.title}` : "No synced lyric";
            next.textContent = "";
            return;
        }

        const now = audio.currentTime || 0;
        let index = 0;
        for (let cursor = 0; cursor < lines.length; cursor += 1) {
            if (lines[cursor].start <= now + 0.08) index = cursor;
            else break;
        }

        previous.textContent = lines[index - 1]?.text || "";
        current.textContent = lines[index]?.text || "";
        next.textContent = lines[index + 1]?.text || "";
    }

    async function refresh() {
        overlay.hidden = false;
        overlay.style.display = "";
        const track = musicPlayer?.getCurrentTrack?.() || null;
        if ((track?.id || null) !== activeTrackId || !activeLines.length) await loadTrackLines();
        renderLines(activeLines);
    }

    const events = ["timeupdate", "play", "pause", "loadedmetadata", "durationchange", "seeked", "canplay"];
    events.forEach((eventName) => audio.addEventListener(eventName, refresh));
    const intervalId = window.setInterval(refresh, 400);
    void refresh();

    return {
        refresh,
        destroy() {
            events.forEach((eventName) => audio.removeEventListener(eventName, refresh));
            window.clearInterval(intervalId);
        }
    };
}
