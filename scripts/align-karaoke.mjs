import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import process from "process";
import os from "os";
import { execFile as execFileCallback } from "child_process";
import { promisify } from "util";

const execFile = promisify(execFileCallback);

function loadEnvFile(rootDir) {
    const envPath = path.resolve(rootDir, ".env.local");
    if (!fs.existsSync(envPath)) {
        return;
    }

    const text = fs.readFileSync(envPath, "utf8");
    text.split(/\r?\n/).forEach((rawLine) => {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) {
            return;
        }

        const separatorIndex = line.indexOf("=");
        if (separatorIndex <= 0) {
            return;
        }

        const key = line.slice(0, separatorIndex).trim();
        let value = line.slice(separatorIndex + 1).trim();
        if (
            (value.startsWith("\"") && value.endsWith("\""))
            || (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        if (key && !process.env[key]) {
            process.env[key] = value;
        }
    });
}

function parseArgs(argv) {
    const args = {};
    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];
        if (!token.startsWith("--")) {
            continue;
        }

        const key = token.slice(2);
        const next = argv[index + 1];
        if (!next || next.startsWith("--")) {
            args[key] = true;
            continue;
        }

        args[key] = next;
        index += 1;
    }

    return args;
}

function printUsage() {
    console.log([
        "Usage:",
        "  npm run align:karaoke -- --audio ./du-co-cach-xa.mp3 --lyrics ./du-co-cach-xa.lrc --out ./du-co-cach-xa.karaoke.json",
        "",
        "Options:",
        "  --mode python|openai|gemini|interpolate   Default: openai if OPENAI_API_KEY exists, otherwise gemini if GEMINI_API_KEY exists, otherwise python if a runtime is available, otherwise interpolate",
        "  --model whisper-1 | gemini-2.5-flash | small   AI transcription/alignment model",
        "  --audio <path>             Required audio file path",
        "  --lyrics <path>            Required .lrc file path",
        "  --out <path>               Required output karaoke json path",
        "  --language <code>          Optional whisper language hint (default: vi for python mode)"
    ].join("\n"));
}

function getPythonCandidates(rootDir) {
    const homeDir = os.homedir();
    const bundledPython = path.join(
        homeDir,
        ".cache",
        "codex-runtimes",
        "codex-primary-runtime",
        "dependencies",
        "python",
        "python.exe"
    );

    const candidates = [];
    const pushCandidate = (command, prefix = []) => {
        if (!command) {
            return;
        }
        if (candidates.some((candidate) => candidate.command === command && candidate.prefix.join(" ") === prefix.join(" "))) {
            return;
        }
        candidates.push({ command, prefix });
    };

    pushCandidate(process.env.KARAOKE_PYTHON || null, []);
    pushCandidate(process.env.PYTHON || null, []);
    if (fs.existsSync(bundledPython)) {
        pushCandidate(bundledPython, []);
    }
    pushCandidate("python", []);
    pushCandidate("py", ["-3"]);

    return candidates;
}

async function resolvePythonRuntime(rootDir) {
    const candidates = getPythonCandidates(rootDir);
    for (const candidate of candidates) {
        try {
            await execFile(candidate.command, [...candidate.prefix, "--version"], {
                cwd: rootDir,
                windowsHide: true
            });
            return candidate;
        } catch {
            // try next candidate
        }
    }

    return null;
}

async function runPythonAlignment(rootDir, { audioPath, lyricsPath, outPath, model, language }) {
    const runtime = await resolvePythonRuntime(rootDir);
    if (!runtime) {
        throw new Error("Python runtime was not found. Install Python or set KARAOKE_PYTHON.");
    }

    const scriptPath = path.resolve(rootDir, "scripts/align-karaoke.py");
    await execFile(
        runtime.command,
        [
            ...runtime.prefix,
            scriptPath,
            "--audio", audioPath,
            "--lyrics", lyricsPath,
            "--out", outPath,
            "--model", model,
            "--language", language || "vi"
        ],
        {
            cwd: rootDir,
            env: process.env,
            windowsHide: true
        }
    );
}

function normalizeToken(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\p{L}\p{N}]+/gu, "")
        .toLowerCase();
}

function parseLrc(text) {
    const lines = [];

    text.split(/\r?\n/).forEach((rawLine) => {
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

function splitLyricWords(text) {
    return String(text || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
}

function resolveLineEnd(lines, index) {
    const current = lines[index];
    const next = index + 1 < lines.length ? lines[index + 1] : null;
    const previous = index > 0 ? lines[index - 1] : null;

    if (next?.timeMs > current?.timeMs) {
        return next.timeMs;
    }

    if (previous?.timeMs < current?.timeMs) {
        return current.timeMs + Math.min(Math.max(current.timeMs - previous.timeMs, 900), 5000);
    }

    return current.timeMs + 2200;
}

function createInterpolatedWords(line, lineEndMs) {
    const words = splitLyricWords(line.text);
    const safeWords = words.length > 0 ? words : ["..."];
    const availableWindow = Math.max(lineEndMs - line.timeMs, 300);
    const usableWindow = availableWindow;
    const staggerMs = usableWindow / Math.max(safeWords.length, 1);

    return safeWords.map((word, index) => ({
        text: word,
        timeMs: Math.round(line.timeMs + staggerMs * index)
    }));
}

function buildInterpolatedKaraoke(lines) {
    return lines.map((line, index) => ({
        lineStartMs: line.timeMs,
        text: line.text,
        words: createInterpolatedWords(line, resolveLineEnd(lines, index))
    }));
}

async function transcribeWithOpenAI(audioPath, model) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set.");
    }

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });
    const response = await client.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model,
        response_format: "verbose_json",
        timestamp_granularities: ["word"]
    });

    const rawWords = Array.isArray(response?.words)
        ? response.words
        : Array.isArray(response?.segments)
            ? response.segments.flatMap((segment) => Array.isArray(segment?.words) ? segment.words : [])
            : [];

    if (rawWords.length === 0) {
        throw new Error("Transcription returned no word timestamps.");
    }

    return rawWords.map((word, index) => ({
        index,
        text: String(word?.word || word?.text || "").trim(),
        startMs: Math.round(Number(word?.start) * 1000),
        endMs: Math.round(Number(word?.end) * 1000),
        norm: normalizeToken(word?.word || word?.text || "")
    })).filter((word) => word.text && Number.isFinite(word.startMs));
}

function resolveAudioMimeType(audioPath) {
    const ext = path.extname(audioPath).toLowerCase();
    switch (ext) {
        case ".mp3":
            return "audio/mpeg";
        case ".wav":
            return "audio/wav";
        case ".ogg":
            return "audio/ogg";
        case ".m4a":
            return "audio/mp4";
        case ".aac":
            return "audio/aac";
        case ".flac":
            return "audio/flac";
        default:
            return "application/octet-stream";
    }
}

function extractJsonPayload(text) {
    const safeText = String(text || "").trim();
    if (!safeText) {
        throw new Error("Gemini returned an empty response.");
    }

    try {
        return JSON.parse(safeText);
    } catch {}

    const fencedMatch = safeText.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
        return JSON.parse(fencedMatch[1].trim());
    }

    const firstBrace = safeText.indexOf("{");
    const lastBrace = safeText.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
        return JSON.parse(safeText.slice(firstBrace, lastBrace + 1));
    }

    throw new Error("Gemini response was not valid JSON.");
}

function normalizeGeminiLine(line, sourceLine, index, lines) {
    const lineStartMs = sourceLine.timeMs;
    const lineEndMs = resolveLineEnd(lines, index);
    const safeWords = splitLyricWords(sourceLine.text);
    const candidateWords = Array.isArray(line?.words) ? line.words : [];
    const normalizedWords = safeWords.map((word, wordIndex) => ({
        text: word,
        norm: normalizeToken(word),
        timeMs: Number.isFinite(Number(candidateWords[wordIndex]?.timeMs))
            ? Math.round(Number(candidateWords[wordIndex].timeMs))
            : null,
        leadMs: Number.isFinite(Number(candidateWords[wordIndex]?.leadMs))
            ? Math.round(Number(candidateWords[wordIndex].leadMs))
            : null,
        entryMs: Number.isFinite(Number(candidateWords[wordIndex]?.entryMs))
            ? Math.round(Number(candidateWords[wordIndex].entryMs))
            : null,
        slideMs: Number.isFinite(Number(candidateWords[wordIndex]?.slideMs))
            ? Math.round(Number(candidateWords[wordIndex].slideMs))
            : null,
        emphasis: Number.isFinite(Number(candidateWords[wordIndex]?.emphasis))
            ? Number(candidateWords[wordIndex].emphasis)
            : null,
        styleHint: typeof candidateWords[wordIndex]?.styleHint === "string"
            ? candidateWords[wordIndex].styleHint
            : null
    }));

    fillMissingWordTimes(normalizedWords, lineStartMs, lineEndMs);

    return {
        lineStartMs,
        text: sourceLine.text,
        words: normalizedWords.map((word) => ({
            text: word.text,
            timeMs: word.timeMs,
            leadMs: word.leadMs,
            entryMs: word.entryMs,
            slideMs: word.slideMs,
            emphasis: word.emphasis,
            styleHint: word.styleHint
        }))
    };
}

async function alignWithGemini(audioPath, lines, model) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set.");
    }

    const audioBuffer = await fsp.readFile(audioPath);
    const mimeType = resolveAudioMimeType(audioPath);
    const promptLines = lines.map((line, index) => ({
        index,
        lineStartMs: line.timeMs,
        lineEndMs: resolveLineEnd(lines, index),
        text: line.text,
        words: splitLyricWords(line.text)
    }));

    const prompt = [
        "You align karaoke word timings.",
        "Listen to the supplied song audio and align the provided lyric lines to the singing.",
        "Also estimate how each word should animate so the render feels natural instead of rigid.",
        "Return STRICT JSON only with this shape:",
        '{"lines":[{"lineStartMs":1234,"text":"example","words":[{"text":"example","timeMs":1234,"leadMs":80,"entryMs":220,"slideMs":180,"emphasis":0.35,"styleHint":"soft"}]}]}',
        "Rules:",
        "1. Preserve the exact lyric lines and exact word order from the provided input.",
        "2. Return exactly one line object for each input line, in the same order.",
        "3. Each word array must contain the same words as the input line, in the same order.",
        "4. timeMs must be integers in milliseconds.",
        "5. The first word of a line should start at or after lineStartMs and before lineEndMs.",
        "6. Keep word timings ascending within each line.",
        "7. Use the audio to estimate the natural rhythm so fast phrases get tighter spacing and slower phrases get wider spacing.",
        "8. leadMs, entryMs, slideMs are integer milliseconds that describe how early the word should start animating, how long the word should enter, and how long nearby words should slide.",
        "9. emphasis is a number from 0 to 1. styleHint must be one of: tight, soft, float, accent.",
        "10. Use short leadMs and tighter entry/slide for fast dense phrases. Use larger leadMs and softer motion for held or floating words.",
        "11. Do not include markdown fences or explanations.",
        "",
        "Lyric lines JSON:",
        JSON.stringify(promptLines)
    ].join("\n");

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.15,
                    topP: 0.9
                },
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType,
                                data: audioBuffer.toString("base64")
                            }
                        }
                    ]
                }]
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Gemini API ${response.status}: ${await response.text()}`);
    }

    const payload = await response.json();
    const responseText = Array.isArray(payload?.candidates?.[0]?.content?.parts)
        ? payload.candidates[0].content.parts.map((part) => part?.text || "").join("\n").trim()
        : "";
    const parsed = extractJsonPayload(responseText);
    const responseLines = Array.isArray(parsed?.lines) ? parsed.lines : [];
    if (responseLines.length === 0) {
        throw new Error("Gemini returned no aligned lines.");
    }

    return lines.map((sourceLine, index) => normalizeGeminiLine(responseLines[index], sourceLine, index, lines));
}

function tokensEquivalent(a, b) {
    if (!a || !b) {
        return false;
    }

    return a === b || a.includes(b) || b.includes(a);
}

function fillMissingWordTimes(words, startMs, endMs) {
    const safeStart = Number.isFinite(startMs) ? startMs : 0;
    const safeEnd = Number.isFinite(endMs) && endMs > safeStart ? endMs : safeStart + 2200;
    const fallbackStep = Math.max((safeEnd - safeStart) / Math.max(words.length, 1), 40);

    let lastKnownIndex = -1;
    for (let index = 0; index < words.length; index += 1) {
        if (!Number.isFinite(words[index].timeMs)) {
            continue;
        }

        if (lastKnownIndex + 1 < index) {
            const leftBoundary = lastKnownIndex >= 0
                ? words[lastKnownIndex].timeMs
                : safeStart;
            const gap = index - lastKnownIndex;
            const rightBoundary = words[index].timeMs;
            const step = Math.max((rightBoundary - leftBoundary) / gap, 30);
            for (let fillIndex = lastKnownIndex + 1; fillIndex < index; fillIndex += 1) {
                words[fillIndex].timeMs = Math.round(leftBoundary + step * (fillIndex - lastKnownIndex));
            }
        }

        lastKnownIndex = index;
    }

    if (lastKnownIndex < 0) {
        words.forEach((word, index) => {
            word.timeMs = Math.round(safeStart + fallbackStep * index);
        });
        return words;
    }

    for (let index = lastKnownIndex + 1; index < words.length; index += 1) {
        words[index].timeMs = Math.round(words[index - 1].timeMs + fallbackStep);
    }

    return words;
}

function alignLineWords(line, index, lines, transcriptWords) {
    const lineStartMs = line.timeMs;
    const lineEndMs = resolveLineEnd(lines, index);
    const lyricWords = splitLyricWords(line.text).map((word) => ({
        text: word,
        norm: normalizeToken(word),
        timeMs: null
    }));

    if (lyricWords.length === 0) {
        return {
            lineStartMs,
            text: line.text,
            words: [{
                text: "...",
                timeMs: lineStartMs
            }]
        };
    }

    const windowStartMs = Math.max(0, lineStartMs - 180);
    const windowEndMs = lineEndMs + 180;
    const candidates = transcriptWords.filter((word) => (
        Number.isFinite(word.startMs)
        && word.startMs >= windowStartMs
        && word.startMs <= windowEndMs
    ));

    let cursor = 0;
    lyricWords.forEach((lyricWord) => {
        for (let candidateIndex = cursor; candidateIndex < candidates.length; candidateIndex += 1) {
            const candidate = candidates[candidateIndex];
            if (!tokensEquivalent(lyricWord.norm, candidate.norm)) {
                continue;
            }

            lyricWord.timeMs = candidate.startMs;
            cursor = candidateIndex + 1;
            break;
        }
    });

    fillMissingWordTimes(lyricWords, lineStartMs, lineEndMs);

    return {
        lineStartMs,
        text: line.text,
        words: lyricWords.map((word) => ({
            text: word.text,
            timeMs: word.timeMs
        }))
    };
}

function buildAlignedKaraoke(lines, transcriptWords) {
    return lines.map((line, index) => alignLineWords(line, index, lines, transcriptWords));
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help || !args.audio || !args.lyrics || !args.out) {
        printUsage();
        process.exit(args.help ? 0 : 1);
    }

    const rootDir = process.cwd();
    loadEnvFile(rootDir);
    const audioPath = path.resolve(rootDir, args.audio);
    const lyricsPath = path.resolve(rootDir, args.lyrics);
    const outPath = path.resolve(rootDir, args.out);
    const pythonRuntime = await resolvePythonRuntime(rootDir);
    const mode = args.mode || (
        process.env.OPENAI_API_KEY
            ? "openai"
            : ((process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
                ? "gemini"
                : (pythonRuntime ? "python" : "interpolate"))
    );
    const model = args.model || (
        mode === "gemini"
            ? "gemini-2.5-flash"
            : mode === "python"
                ? "small"
                : "whisper-1"
    );

    const lyricsText = await fsp.readFile(lyricsPath, "utf8");
    const lines = parseLrc(lyricsText);
    if (lines.length === 0) {
        throw new Error("No timed lines were found in the supplied .lrc file.");
    }

    let karaokeLines;
    let sourceMeta;
    if (mode === "python") {
        await runPythonAlignment(rootDir, { audioPath, lyricsPath, outPath, model, language: args.language });
        console.log(`Karaoke timings written to ${outPath}`);
        return;
    } else if (mode === "openai") {
        const transcriptWords = await transcribeWithOpenAI(audioPath, model);
        karaokeLines = buildAlignedKaraoke(lines, transcriptWords);
        sourceMeta = {
            mode: "openai",
            model,
            transcriptWordCount: transcriptWords.length
        };
    } else if (mode === "gemini") {
        karaokeLines = await alignWithGemini(audioPath, lines, model);
        sourceMeta = {
            mode: "gemini",
            model,
            transcriptWordCount: null
        };
    } else {
        karaokeLines = buildInterpolatedKaraoke(lines);
        sourceMeta = {
            mode: "interpolate",
            model: null,
            transcriptWordCount: null
        };
    }

    const output = {
        generatedAt: new Date().toISOString(),
        source: {
            audio: path.basename(audioPath),
            lyrics: path.basename(lyricsPath),
            ...sourceMeta
        },
        lines: karaokeLines
    };

    await fsp.mkdir(path.dirname(outPath), { recursive: true });
    await fsp.writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
    console.log(`Karaoke timings written to ${outPath}`);
}

main().catch((error) => {
    console.error("Could not generate karaoke timings.");
    console.error(error?.stack || error?.message || String(error));
    process.exit(1);
});
