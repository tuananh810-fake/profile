(() => {
  const FLAG = '__lyricsTikTokRuntimeFix_v1';
  if (window[FLAG]) return;
  window[FLAG] = true;

  const CONFIG = {
    scanIntervalMs: 900,
    renderFpsMs: 32,
    minLineDuration: 1.25,
    maxFallbackDuration: 5.5,
    highlightLead: 0.03,
    defaultWordsPerLine: 7
  };

  const state = {
    lines: [],
    sourceHash: '',
    host: null,
    overlay: null,
    lastRenderAt: 0,
    fallbackText: '',
    lastIndex: -1
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function cleanText(value) {
    return String(value || '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function looksLikeLyricText(value) {
    if (typeof value !== 'string') return false;
    const text = value.trim();
    if (text.length < 8) return false;
    return /\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\]/.test(text) || text.split(/\r?\n/).length >= 4;
  }

  function timeFromTag(min, sec, frac) {
    const fraction = frac ? Number(`0.${String(frac).padEnd(3, '0').slice(0, 3)}`) : 0;
    return Number(min) * 60 + Number(sec) + fraction;
  }

  function parseTimeValue(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const tag = trimmed.match(/^(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?$/);
      if (tag) return timeFromTag(tag[1], tag[2], tag[3]);
      const n = Number(trimmed);
      if (Number.isFinite(n)) return n;
    }
    return null;
  }

  function parseLrc(raw) {
    if (typeof raw !== 'string') return [];
    const output = [];
    const rows = raw.replace(/\r/g, '').split('\n');
    for (const row of rows) {
      const tags = [...row.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
      if (!tags.length) continue;
      const text = cleanText(row.replace(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g, ''));
      if (!text) continue;
      for (const tag of tags) {
        output.push({ time: timeFromTag(tag[1], tag[2], tag[3]), text });
      }
    }
    return finalizeLines(output);
  }

  function normalizeArray(value) {
    if (!Array.isArray(value)) return [];
    const lines = [];
    for (const item of value) {
      if (typeof item === 'string') {
        const parsed = parseLrc(item);
        if (parsed.length) lines.push(...parsed);
        continue;
      }
      if (!item || typeof item !== 'object') continue;
      const rawText = item.text ?? item.line ?? item.lyric ?? item.content ?? item.value ?? item.wordsText;
      let text = cleanText(rawText);
      if (!text && Array.isArray(item.words)) {
        text = cleanText(item.words.map(word => typeof word === 'string' ? word : (word?.text || word?.word || '')).join(' '));
      }
      const rawTime = item.time ?? item.start ?? item.startTime ?? item.startSec ?? item.timestamp ?? item.at;
      const rawEnd = item.end ?? item.endTime ?? item.endSec;
      const time = parseTimeValue(rawTime);
      const end = parseTimeValue(rawEnd);
      if (text && time !== null) lines.push({ time, end, text });
    }
    return finalizeLines(lines);
  }

  function finalizeLines(lines) {
    const cleaned = lines
      .map(line => ({ time: Number(line.time), end: line.end == null ? null : Number(line.end), text: cleanText(line.text) }))
      .filter(line => Number.isFinite(line.time) && line.text)
      .sort((a, b) => a.time - b.time);
    const unique = [];
    for (const line of cleaned) {
      const prev = unique[unique.length - 1];
      if (prev && Math.abs(prev.time - line.time) < 0.03 && prev.text === line.text) continue;
      unique.push(line);
    }
    for (let i = 0; i < unique.length; i += 1) {
      const current = unique[i];
      const next = unique[i + 1];
      const naturalEnd = next ? next.time : current.time + Math.min(CONFIG.maxFallbackDuration, Math.max(CONFIG.minLineDuration, current.text.split(/\s+/).length * 0.45));
      const selectedEnd = Number.isFinite(current.end) && current.end > current.time ? current.end : naturalEnd;
      current.end = Math.max(current.time + CONFIG.minLineDuration, selectedEnd);
      current.duration = current.end - current.time;
    }
    return unique;
  }

  function hashLines(lines) {
    if (!lines.length) return '';
    const first = lines[0];
    const last = lines[lines.length - 1];
    return `${lines.length}|${first.time}:${first.text}|${last.time}:${last.text}`;
  }

  function scanValue(value, depth = 0, seen = new Set()) {
    if (value == null || depth > 4) return [];
    if (typeof value === 'string') return parseLrc(value);
    if (Array.isArray(value)) {
      const normalized = normalizeArray(value);
      if (normalized.length >= 2) return normalized;
      for (const item of value) {
        const found = scanValue(item, depth + 1, seen);
        if (found.length >= 2) return found;
      }
      return [];
    }
    if (typeof value !== 'object') return [];
    if (value instanceof Element || value === window || value === document) return [];
    if (seen.has(value)) return [];
    seen.add(value);

    const directKeys = ['lyrics', 'lyric', 'lrc', 'rawLyrics', 'syncedLyrics', 'lineLyrics', 'lyricsText', 'lyricText', 'lrcText', 'lines', 'lyricLines', 'lyricsLines', 'currentLyrics', 'activeLyrics', 'trackLyrics'];
    for (const key of directKeys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const found = scanValue(value[key], depth + 1, seen);
        if (found.length >= 2) return found;
      }
    }

    const entries = Object.entries(value).slice(0, 80);
    for (const [key, child] of entries) {
      if (/lyric|lrc|track|song|music|playlist/i.test(key)) {
        const found = scanValue(child, depth + 1, seen);
        if (found.length >= 2) return found;
      }
    }
    return [];
  }

  function readFromLocalStorage() {
    try {
      const candidates = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!/lyric|lrc|track|song|music|playlist|profile|custom/i.test(key || '')) continue;
        const raw = localStorage.getItem(key);
        if (!raw || raw.length < 10) continue;
        if (looksLikeLyricText(raw)) candidates.push(parseLrc(raw));
        try { candidates.push(scanValue(JSON.parse(raw))); } catch {}
      }
      return candidates.find(lines => lines && lines.length >= 2) || [];
    } catch { return []; }
  }

  function readFromDomInputs() {
    const fields = Array.from(document.querySelectorAll('textarea, input[type="hidden"], input[data-lyrics], [data-lyrics], script[type="application/json"]'));
    for (const field of fields) {
      const raw = field.value || field.dataset?.lyrics || field.textContent || '';
      if (!looksLikeLyricText(raw)) continue;
      const parsed = parseLrc(raw);
      if (parsed.length >= 2) return parsed;
      try {
        const fromJson = scanValue(JSON.parse(raw));
        if (fromJson.length >= 2) return fromJson;
      } catch {}
    }
    return [];
  }

  function readFromKnownGlobals() {
    const names = ['lyricsEngine', 'lyricEngine', 'currentLyrics', 'lyricsData', 'lyricData', 'currentTrack', 'activeTrack', 'tracks', 'playlist', 'musicPlayer', 'customizerState', 'profileState', 'appState', 'profileApp', 'dashboardState'];
    for (const name of names) {
      if (!(name in window)) continue;
      const found = scanValue(window[name]);
      if (found.length >= 2) return found;
    }
    return [];
  }

  function bestLyricsSource() {
    const sources = [readFromKnownGlobals, readFromDomInputs, readFromLocalStorage];
    for (const reader of sources) {
      const lines = reader();
      if (lines && lines.length >= 2) return lines;
    }
    return [];
  }

  function visibleEnough(el) {
    if (!el || !(el instanceof Element)) return false;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return rect.width > 160 && rect.height > 100 && style.display !== 'none' && style.visibility !== 'hidden';
  }

  function textOf(el) { return cleanText(el?.innerText || el?.textContent || '').toLowerCase(); }
  function area(el) { const rect = el.getBoundingClientRect(); return rect.width * rect.height; }

  function chooseHost() {
    const preferredSelectors = ['#lyricsOverlay', '#lyricsDisplay', '#lyricsCanvas', '#lyricsPanel', '.lyrics-overlay', '.lyrics-display', '.lyrics-canvas', '.lyrics-stage', '.lyrics-panel', '.lyric-panel', '.lyric-box', '[data-panel="lyrics"]', '[data-window-id="lyrics"]', '[data-module="lyrics"]'];
    for (const selector of preferredSelectors) {
      const nodes = Array.from(document.querySelectorAll(selector)).filter(visibleEnough);
      if (nodes.length) return nodes.sort((a, b) => area(b) - area(a))[0];
    }

    const windows = Array.from(document.querySelectorAll('.dashboard-window, .floating-window, .window-card, .card, section, article')).filter(visibleEnough).filter(el => /\blyrics?\b|\blyric\b/.test(textOf(el)));
    if (windows.length) return windows.sort((a, b) => area(b) - area(a))[0];

    let created = document.getElementById('tiktokLyricsFallbackHost');
    if (!created) {
      created = document.createElement('div');
      created.id = 'tiktokLyricsFallbackHost';
      created.setAttribute('aria-live', 'off');
      document.body.appendChild(created);
    }
    return created;
  }

  function injectStyle() {
    if (document.getElementById('lyrics-tiktok-runtime-fix-style')) return;
    const style = document.createElement('style');
    style.id = 'lyrics-tiktok-runtime-fix-style';
    style.textContent = `
      #tiktokLyricsFallbackHost { position: fixed; left: 50%; top: 50%; width: min(980px, 72vw); height: min(420px, 42vh); transform: translate(-50%, -50%); z-index: 99999; pointer-events: none; }
      .tiktok-lyrics-host { position: relative !important; overflow: hidden !important; }
      .tiktok-lyrics-renderer { position: absolute; inset: 52px 28px 32px; z-index: 70; display: flex; align-items: center; justify-content: center; flex-direction: column; pointer-events: none; user-select: none; contain: layout style; isolation: isolate; transform: translate3d(0,0,0); filter: none !important; opacity: 1 !important; }
      .tiktok-lyrics-renderer::before { content: ''; position: absolute; inset: -24px -18px; z-index: -1; border-radius: 28px; background: radial-gradient(circle at 50% 50%, rgba(5, 8, 18, 0.10), rgba(5, 8, 18, 0.03) 58%, transparent 72%); }
      .tiktok-lyrics-main { width: min(100%, 960px); text-align: center; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: clamp(34px, 3.15vw, 68px); font-weight: 850; line-height: 1.18; letter-spacing: -0.045em; text-wrap: balance; text-rendering: geometricPrecision; -webkit-font-smoothing: antialiased; filter: none !important; }
      .tiktok-lyrics-row { display: block; margin: 0.04em 0; white-space: normal; }
      .tiktok-lyrics-word { display: inline-block; margin: 0 0.105em; color: rgba(255, 255, 255, 0.32); text-shadow: none; transform: translate3d(0, 0.06em, 0) scale(0.985); transition: color 160ms ease, opacity 160ms ease, transform 160ms ease, text-shadow 160ms ease; opacity: 0.84; }
      .tiktok-lyrics-word.is-past { color: rgba(255, 255, 255, 0.98); opacity: 1; transform: translate3d(0, 0, 0) scale(1); text-shadow: 0 0 16px rgba(255, 255, 255, 0.20), 0 5px 30px rgba(90, 170, 255, 0.15); }
      .tiktok-lyrics-word.is-current { color: #ffd1c8; opacity: 1; transform: translate3d(0, -0.015em, 0) scale(1.035); text-shadow: 0 0 18px rgba(255, 190, 185, 0.38), 0 8px 36px rgba(255, 130, 155, 0.16); }
      .tiktok-lyrics-empty { color: rgba(255, 255, 255, 0.42); font-size: clamp(16px, 1.3vw, 22px); font-weight: 700; letter-spacing: 0; }
      .tiktok-lyrics-host .lyrics-line:not(.tiktok-lyrics-row), .tiktok-lyrics-host .lyric-line:not(.tiktok-lyrics-row), .tiktok-lyrics-host .lyrics-current, .tiktok-lyrics-host .lyrics-next, .tiktok-lyrics-host .lyrics-prev, .tiktok-lyrics-host .kinetic-line, .tiktok-lyrics-host .kinetic-word, .tiktok-lyrics-host .lyric-word:not(.tiktok-lyrics-word), .tiktok-lyrics-host .lyrics-word:not(.tiktok-lyrics-word) { opacity: 0.04 !important; filter: none !important; }
      @media (max-width: 900px) { .tiktok-lyrics-renderer { inset: 44px 16px 24px; } .tiktok-lyrics-main { font-size: clamp(28px, 8vw, 48px); line-height: 1.16; } .tiktok-lyrics-word { margin-inline: 0.08em; } }
    `;
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    injectStyle();
    const host = chooseHost();
    if (!host) return null;
    if (state.host !== host) {
      if (state.host) state.host.classList.remove('tiktok-lyrics-host');
      state.host = host;
      state.host.classList.add('tiktok-lyrics-host');
      if (getComputedStyle(state.host).position === 'static') state.host.style.position = 'relative';
      state.overlay = null;
    }
    let overlay = state.host.querySelector(':scope > .tiktok-lyrics-renderer');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'tiktok-lyrics-renderer';
      overlay.innerHTML = '<div class="tiktok-lyrics-main" aria-live="off"></div>';
      state.host.appendChild(overlay);
    }
    state.overlay = overlay;
    return overlay.querySelector('.tiktok-lyrics-main');
  }

  function getAudioTime() {
    const media = Array.from(document.querySelectorAll('audio, video')).find(el => Number.isFinite(el.currentTime) && el.duration && !Number.isNaN(el.duration));
    if (media) return media.currentTime;
    return null;
  }

  function currentLineIndex(time) {
    if (!state.lines.length) return -1;
    let low = 0, high = state.lines.length - 1, answer = -1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (state.lines[mid].time <= time + 0.02) { answer = mid; low = mid + 1; }
      else high = mid - 1;
    }
    return answer < 0 ? 0 : answer;
  }

  function readWordsPerLine() {
    const candidate = Array.from(document.querySelectorAll('input, select')).find(el => /word|line|words/i.test(el.name || el.id || el.getAttribute('aria-label') || ''));
    const n = Number(candidate?.value);
    return Number.isFinite(n) ? clamp(Math.round(n), 3, 10) : CONFIG.defaultWordsPerLine;
  }

  function splitRows(words) {
    const maxPerLine = readWordsPerLine();
    if (words.length <= maxPerLine) return [words];
    const rows = [];
    for (let i = 0; i < words.length; i += maxPerLine) rows.push(words.slice(i, i + maxPerLine));
    return rows;
  }

  function escapeHtml(value) { return String(value).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); }

  function renderWords(container, line, progress) {
    const words = cleanText(line.text).split(/\s+/).filter(Boolean);
    if (!words.length) { container.innerHTML = '<span class="tiktok-lyrics-empty">No lyrics</span>'; return; }
    const activeFloat = clamp(progress, 0, 1) * words.length;
    const activeIndex = clamp(Math.floor(activeFloat), 0, Math.max(0, words.length - 1));
    const rows = splitRows(words);
    let absoluteIndex = 0;
    container.innerHTML = rows.map(row => {
      const html = row.map(word => {
        const className = absoluteIndex < activeIndex ? 'is-past' : (absoluteIndex === activeIndex ? 'is-current' : '');
        absoluteIndex += 1;
        return `<span class="tiktok-lyrics-word ${className}">${escapeHtml(word)}</span>`;
      }).join(' ');
      return `<span class="tiktok-lyrics-row">${html}</span>`;
    }).join('');
  }

  function readFallbackCurrentText() {
    const host = state.host || chooseHost();
    if (!host) return '';
    const candidates = Array.from(host.querySelectorAll('*'))
      .filter(el => !el.classList.contains('tiktok-lyrics-renderer'))
      .filter(el => visibleEnough(el))
      .map(el => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize) || 0;
        return { el, text: cleanText(el.innerText || el.textContent || ''), score: fontSize * 30 + rect.width + rect.height };
      })
      .filter(item => item.text && item.text.length > 3 && item.text.length < 160)
      .filter(item => !/lyrics|box|pure|kinetic|reset|focus|module|player|start|pause|prev|next|volume/i.test(item.text));
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.text || '';
  }

  function refreshLyricsSource(force = false) {
    const lines = bestLyricsSource();
    const hash = hashLines(lines);
    if (force || (hash && hash !== state.sourceHash)) {
      state.lines = lines;
      state.sourceHash = hash;
      state.lastIndex = -1;
    }
  }

  function renderLoop(now = performance.now()) {
    requestAnimationFrame(renderLoop);
    if (now - state.lastRenderAt < CONFIG.renderFpsMs) return;
    state.lastRenderAt = now;
    const container = ensureOverlay();
    if (!container) return;
    const time = getAudioTime();
    if (state.lines.length && time !== null) {
      const index = currentLineIndex(time);
      const line = state.lines[index];
      if (!line) return;
      const progress = clamp((time - line.time + CONFIG.highlightLead) / Math.max(CONFIG.minLineDuration, line.duration || CONFIG.minLineDuration), 0, 1);
      const signature = `${index}|${Math.floor(progress * 100)}`;
      if (container.dataset.signature !== signature) {
        container.dataset.signature = signature;
        renderWords(container, line, progress);
      }
      return;
    }
    const fallback = readFallbackCurrentText();
    if (fallback && fallback !== state.fallbackText) {
      state.fallbackText = fallback;
      renderWords(container, { text: fallback }, 1);
    } else if (!fallback && !container.innerHTML.trim()) {
      container.innerHTML = '<span class="tiktok-lyrics-empty">Waiting for synced lyrics...</span>';
    }
  }

  function bindEvents() {
    const rescan = () => setTimeout(() => refreshLyricsSource(true), 80);
    ['input', 'change', 'lyrics:updated', 'lyrics:update', 'lyrics:loaded', 'track:change', 'trackchange', 'music:trackchange', 'storage'].forEach(eventName => {
      window.addEventListener(eventName, rescan, true);
      document.addEventListener(eventName, rescan, true);
    });
    const observer = new MutationObserver(() => {
      clearTimeout(window.__lyricsTikTokRuntimeFixMutationTimer);
      window.__lyricsTikTokRuntimeFixMutationTimer = setTimeout(() => { ensureOverlay(); refreshLyricsSource(false); }, 120);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    setInterval(() => refreshLyricsSource(false), CONFIG.scanIntervalMs);
  }

  window.TikTokLyricsFix = {
    refresh(lines) {
      if (Array.isArray(lines)) {
        state.lines = finalizeLines(normalizeArray(lines));
        state.sourceHash = hashLines(state.lines);
      } else if (typeof lines === 'string') {
        state.lines = parseLrc(lines);
        state.sourceHash = hashLines(state.lines);
      } else refreshLyricsSource(true);
      return state.lines;
    },
    getLines() { return state.lines.slice(); }
  };

  refreshLyricsSource(true);
  bindEvents();
  requestAnimationFrame(renderLoop);
})();
