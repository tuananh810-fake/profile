(() => {
  const FLAG = '__phase5SmoothLyricsFixInstalled';
  if (window[FLAG]) return;
  window[FLAG] = true;

  const STORAGE_KEY = 'profile.lyrics.phase5SmoothFix';
  const DEFAULTS = {
    enabled: true,
    fps: 30,
    lineDelayMs: 180,
    minHoldMs: 520,
    batchGapMs: 72,
    heldWordMs: 360,
    maxWordsPerLine: 7
  };

  let settings = readSettings();
  let lastPaintAt = 0;
  let lastSignature = '';
  let renderer = null;
  let observer = null;

  function readSettings() {
    try {
      return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toNumber(value, fallback = NaN) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function cleanText(value) {
    return String(value || '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeTimeMs(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return NaN;
    return numeric > 10000 ? numeric : numeric * 1000;
  }

  function getAudio() {
    return Array.from(document.querySelectorAll('audio, video'))
      .find((media) => Number.isFinite(media.currentTime) && !Number.isNaN(media.currentTime)) || null;
  }

  function getLyricsEngine() {
    return window.profileApp?.lyricsEngine || window.lyricsEngine || window.LyricsEngineInstance || null;
  }

  function getCurrentTrack() {
    return window.profileApp?.musicPlayer?.currentTrack || window.currentTrack || window.activeTrack || null;
  }

  function parseLrc(raw) {
    if (typeof raw !== 'string') return [];
    const lines = [];
    raw.replace(/\r/g, '').split('\n').forEach((row) => {
      const tags = [...row.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
      if (!tags.length) return;
      const text = cleanText(row.replace(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g, ''));
      if (!text) return;
      tags.forEach((tag) => {
        const fraction = tag[3] ? Number(`0.${String(tag[3]).padEnd(3, '0').slice(0, 3)}`) : 0;
        lines.push({ startMs: ((Number(tag[1]) * 60) + Number(tag[2]) + fraction) * 1000, text });
      });
    });
    return finalizeLines(lines);
  }

  function normalizeWords(words, fallbackStartMs, fallbackEndMs) {
    if (!Array.isArray(words)) return [];
    return words
      .map((word, index) => {
        if (typeof word === 'string') {
          return { text: cleanText(word), startMs: fallbackStartMs, endMs: NaN, index };
        }
        const text = cleanText(word?.text || word?.word || word?.w || word?.value || '');
        const startMs = normalizeTimeMs(word?.startTime ?? word?.startMs ?? word?.timeMs ?? word?.time ?? word?.start ?? fallbackStartMs);
        const endMs = normalizeTimeMs(word?.endTime ?? word?.endMs ?? word?.end ?? word?.e ?? NaN);
        return {
          ...word,
          text,
          startMs: Number.isFinite(startMs) ? startMs : fallbackStartMs,
          endMs,
          emphasis: toNumber(word?.emphasis, 0),
          index
        };
      })
      .filter((word) => word.text);
  }

  function normalizeLineObject(line) {
    if (!line || typeof line !== 'object') return null;
    const text = cleanText(line.text || line.line || line.lyric || line.content || '');
    const startMs = normalizeTimeMs(line.startMs ?? line.startTime ?? line.timeMs ?? line.time ?? line.start ?? line.timestamp);
    const endMs = normalizeTimeMs(line.endMs ?? line.endTime ?? line.end ?? NaN);
    const words = normalizeWords(line.words || line.wordTimings || line.tokens, startMs, endMs);
    const resolvedText = text || cleanText(words.map((word) => word.text).join(' '));
    if (!resolvedText || !Number.isFinite(startMs)) return null;
    return { ...line, text: resolvedText, startMs, endMs, words };
  }

  function normalizeArray(value) {
    if (!Array.isArray(value)) return [];
    const lines = value.map(normalizeLineObject).filter(Boolean);
    return finalizeLines(lines);
  }

  function finalizeLines(lines) {
    const sorted = lines
      .filter((line) => line && line.text && Number.isFinite(line.startMs))
      .sort((a, b) => a.startMs - b.startMs);

    sorted.forEach((line, index) => {
      const next = sorted[index + 1];
      const fallbackEndMs = next?.startMs ?? line.startMs + Math.max(1400, line.text.split(/\s+/).length * 460);
      line.endMs = Number.isFinite(line.endMs) && line.endMs > line.startMs ? line.endMs : fallbackEndMs;
      line.endMs = Math.max(line.endMs, line.startMs + settings.minHoldMs);

      if (!Array.isArray(line.words) || !line.words.length) {
        const tokens = line.text.split(/\s+/).filter(Boolean);
        const duration = Math.max(line.endMs - line.startMs, settings.minHoldMs);
        line.words = tokens.map((token, wordIndex) => ({
          text: token,
          startMs: line.startMs + (duration * wordIndex / Math.max(tokens.length, 1)),
          endMs: line.startMs + (duration * (wordIndex + 1) / Math.max(tokens.length, 1)),
          emphasis: 0,
          index: wordIndex
        }));
      } else {
        line.words = line.words.map((word, wordIndex) => {
          const nextWord = line.words[wordIndex + 1];
          const endMs = Number.isFinite(word.endMs) && word.endMs > word.startMs
            ? word.endMs
            : (Number.isFinite(nextWord?.startMs) ? nextWord.startMs : line.endMs);
          return { ...word, endMs: Math.max(endMs, word.startMs + 80), index: wordIndex };
        });
      }
    });

    return sorted;
  }

  function scanObject(value, depth = 0, seen = new WeakSet()) {
    if (!value || depth > 4) return [];
    if (typeof value === 'string') return parseLrc(value);
    if (Array.isArray(value)) {
      const direct = normalizeArray(value);
      if (direct.length) return direct;
      for (const item of value) {
        const found = scanObject(item, depth + 1, seen);
        if (found.length) return found;
      }
      return [];
    }
    if (typeof value !== 'object' || value instanceof Element || value === window || value === document) return [];
    if (seen.has(value)) return [];
    seen.add(value);

    const priorityKeys = ['lyricsPro', 'lyrics_pro', 'karaokeLines', 'lyricLines', 'lyricsLines', 'lines', 'lyrics', 'lyric', 'lrc', 'rawLyrics', 'syncedLyrics'];
    for (const key of priorityKeys) {
      if (key in value) {
        const found = scanObject(value[key], depth + 1, seen);
        if (found.length) return found;
      }
    }

    for (const [key, child] of Object.entries(value).slice(0, 100)) {
      if (/lyric|lrc|karaoke|track|song|music/i.test(key)) {
        const found = scanObject(child, depth + 1, seen);
        if (found.length) return found;
      }
    }
    return [];
  }

  function collectLyrics() {
    const sources = [
      getLyricsEngine(),
      getCurrentTrack(),
      window.profileApp,
      window.currentLyrics,
      window.lyricsData,
      window.lyricData
    ];

    for (const source of sources) {
      const found = scanObject(source);
      if (found.length) return found;
    }

    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!/lyric|lrc|track|music|playlist|profile/i.test(key || '')) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = raw.trim().startsWith('{') || raw.trim().startsWith('[')
          ? scanObject(JSON.parse(raw))
          : parseLrc(raw);
        if (parsed.length) return parsed;
      }
    } catch {}

    return [];
  }

  function createRenderer() {
    if (renderer && document.contains(renderer.root)) return renderer;

    const host = document.getElementById('lyricsBody') || document.getElementById('lyricsOverlay') || document.body;
    const root = document.createElement('div');
    root.className = 'phase5-smooth-lyrics-renderer';
    root.innerHTML = '<div class="phase5-smooth-lyrics-line"></div>';
    host.appendChild(root);
    renderer = { root, line: root.querySelector('.phase5-smooth-lyrics-line') };
    return renderer;
  }

  function activeLine(lines, timeMs) {
    if (!lines.length) return null;
    let current = lines[0];
    for (const line of lines) {
      if (line.startMs - settings.lineDelayMs <= timeMs) current = line;
      else break;
    }
    return current;
  }

  function shouldBatch(previousWord, nextWord) {
    if (!previousWord || !nextWord) return false;
    const gap = nextWord.startMs - previousWord.endMs;
    const duration = previousWord.endMs - previousWord.startMs;
    const previousText = previousWord.text || '';
    const previousHeld = duration >= settings.heldWordMs || toNumber(previousWord.emphasis, 0) >= 0.65 || /[,.!?;:…]$/.test(previousText);
    return gap >= 0 && gap <= settings.batchGapMs && duration <= 260 && !previousHeld;
  }

  function activeWordCount(line, timeMs) {
    const words = line.words || [];
    let count = 0;
    const adjustedTime = timeMs - settings.lineDelayMs;

    for (let index = 0; index < words.length; index += 1) {
      if (words[index].startMs <= adjustedTime) count = index + 1;
      else break;
    }

    while (count > 0 && count < words.length && shouldBatch(words[count - 1], words[count])) {
      count += 1;
    }

    return count;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }

  function renderLine(line, timeMs) {
    const view = createRenderer();
    const words = line?.words || [];
    if (!line || !words.length) {
      view.line.innerHTML = '';
      return;
    }

    const count = activeWordCount(line, timeMs);
    const signature = `${line.startMs}|${count}|${line.text}`;
    if (signature === lastSignature) return;
    lastSignature = signature;

    const rows = [];
    for (let index = 0; index < words.length; index += settings.maxWordsPerLine) {
      rows.push(words.slice(index, index + settings.maxWordsPerLine));
    }

    let absoluteIndex = 0;
    view.line.innerHTML = rows.map((row) => {
      const html = row.map((word) => {
        const className = absoluteIndex < count ? 'is-visible' : '';
        absoluteIndex += 1;
        return `<span class="phase5-word ${className}">${escapeHtml(word.text)}</span>`;
      }).join(' ');
      return `<span class="phase5-row">${html}</span>`;
    }).join('');
  }

  function installStyle() {
    if (document.getElementById('phase5-smooth-lyrics-style')) return;
    const style = document.createElement('style');
    style.id = 'phase5-smooth-lyrics-style';
    style.textContent = `
      .lyrics-body {
        position: relative !important;
      }

      .phase5-smooth-lyrics-renderer {
        position: absolute;
        inset: 0;
        z-index: 80;
        display: grid;
        place-items: center;
        pointer-events: none;
        contain: layout style paint;
        transform: translate3d(0,0,0);
      }

      .phase5-smooth-lyrics-line {
        width: min(100%, 980px);
        text-align: center;
        font-size: clamp(34px, 4vw, 70px);
        line-height: 1.12;
        font-weight: 850;
        letter-spacing: -0.045em;
        text-wrap: balance;
        -webkit-font-smoothing: antialiased;
        text-rendering: geometricPrecision;
      }

      .phase5-row {
        display: block;
        margin: 0.02em 0;
      }

      .phase5-word {
        display: inline-block;
        margin: 0 0.105em;
        color: rgba(255,255,255,.26);
        opacity: .66;
        transform: translate3d(0,.08em,0) scale(.985);
        transition: color 150ms ease, opacity 150ms ease, transform 150ms ease, text-shadow 150ms ease;
        filter: none !important;
        will-change: transform, opacity;
      }

      .phase5-word.is-visible {
        color: rgba(255,255,255,.98);
        opacity: 1;
        transform: translate3d(0,0,0) scale(1);
        text-shadow: 0 0 16px rgba(255,255,255,.18), 0 8px 34px rgba(110,180,255,.12);
      }

      .lyrics-body > .lyrics-line,
      .lyrics-body .kinetic-word,
      .lyrics-body .clean-phrase-word {
        opacity: .035 !important;
        filter: none !important;
      }

      .app-shell.is-lyrics-performance .phase5-word,
      .app-shell.is-lyrics-performance .phase5-word.is-visible {
        text-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function tick(now) {
    requestAnimationFrame(tick);
    if (!settings.enabled) return;
    const frameMs = 1000 / clamp(settings.fps, 12, 60);
    if (now - lastPaintAt < frameMs) return;
    lastPaintAt = now;

    const audio = getAudio();
    const lines = collectLyrics();
    if (!audio || !lines.length) return;

    const timeMs = audio.currentTime * 1000;
    renderLine(activeLine(lines, timeMs), timeMs);
  }

  function bindRefreshEvents() {
    const reset = () => {
      lastSignature = '';
    };
    ['change', 'input', 'storage', 'trackchange', 'music:trackchange', 'lyrics:updated', 'lyrics:loaded'].forEach((eventName) => {
      window.addEventListener(eventName, reset, true);
      document.addEventListener(eventName, reset, true);
    });

    observer = new MutationObserver(() => {
      if (!renderer || !document.contains(renderer.root)) {
        renderer = null;
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.Phase5SmoothLyricsFix = {
    update(nextSettings = {}) {
      settings = { ...settings, ...nextSettings };
      saveSettings();
      lastSignature = '';
      return { ...settings };
    },
    getSettings() {
      return { ...settings };
    },
    disable() {
      settings.enabled = false;
      saveSettings();
      renderer?.root?.remove();
      renderer = null;
    },
    enable() {
      settings.enabled = true;
      saveSettings();
      lastSignature = '';
    }
  };

  installStyle();
  bindRefreshEvents();
  requestAnimationFrame(tick);
})();
