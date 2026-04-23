import fs from "fs";
import path from "path";
import process from "process";
import { execFile as execFileCallback } from "child_process";
import { promisify } from "util";
import { pathToFileURL } from "url";
import os from "os";

const execFile = promisify(execFileCallback);

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

function printUsage() {
    console.log([
        "Usage:",
        "  npm run align:karaoke:all",
        "",
        "Options:",
        "  --mode gemini|openai|interpolate   Optional override",
        "  --model <name>                     Optional model override",
        "  --force                            Regenerate even if karaoke file already exists"
    ].join("\n"));
}

function deriveKaraokePath(track) {
    if (typeof track?.karaoke === "string" && track.karaoke.trim()) {
        return track.karaoke;
    }

    if (typeof track?.lyrics === "string" && /\.lrc$/i.test(track.lyrics.trim())) {
        return track.lyrics.trim().replace(/\.lrc$/i, ".karaoke.json");
    }

    if (typeof track?.file === "string" && /\.[a-z0-9]+$/i.test(track.file.trim())) {
        return track.file.trim().replace(/\.[a-z0-9]+$/i, ".karaoke.json");
    }

    return null;
}

function hasPythonRuntime() {
    if (process.env.KARAOKE_PYTHON || process.env.PYTHON) {
        return true;
    }

    const bundledPython = path.join(
        os.homedir(),
        ".cache",
        "codex-runtimes",
        "codex-primary-runtime",
        "dependencies",
        "python",
        "python.exe"
    );

    return fs.existsSync(bundledPython);
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        printUsage();
        return;
    }

    const rootDir = process.cwd();
    loadEnvFile(rootDir);

    const configModule = await import(pathToFileURL(path.resolve(rootDir, "js/config.js")).href);
    const playlist = Array.isArray(configModule?.APP_CONFIG?.music?.playlist)
        ? configModule.APP_CONFIG.music.playlist
        : [];

    if (playlist.length === 0) {
        throw new Error("No tracks found in APP_CONFIG.music.playlist.");
    }

    const mode = args.mode
        || (process.env.OPENAI_API_KEY ? "openai" : ((process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) ? "gemini" : (hasPythonRuntime() ? "python" : "interpolate")));
    const model = args.model || (mode === "gemini" ? "gemini-2.5-flash-lite" : (mode === "python" ? "small" : "whisper-1"));
    const force = Boolean(args.force);
    const scriptPath = path.resolve(rootDir, "scripts/align-karaoke.mjs");

    let processed = 0;
    let skipped = 0;

    for (const track of playlist) {
        if (!track?.lyrics || !track?.file) {
            skipped += 1;
            console.log(`Skipping ${track?.id || track?.title || "unknown-track"} (missing file or lyrics).`);
            continue;
        }

        const audioPath = path.resolve(rootDir, track.file);
        const lyricsPath = path.resolve(rootDir, track.lyrics);
        const outRelative = deriveKaraokePath(track);
        if (!outRelative) {
            skipped += 1;
            console.log(`Skipping ${track?.id || track?.title || "unknown-track"} (could not derive karaoke output path).`);
            continue;
        }

        const outPath = path.resolve(rootDir, outRelative);
        if (!force && fs.existsSync(outPath)) {
            skipped += 1;
            console.log(`Skipping ${track?.id || track?.title || "unknown-track"} (existing ${path.basename(outPath)}).`);
            continue;
        }

        console.log(`Aligning ${track?.title || track?.id || path.basename(audioPath)} -> ${path.basename(outPath)}`);
        await execFile(
            process.execPath,
            [
                scriptPath,
                "--audio", audioPath,
                "--lyrics", lyricsPath,
                "--out", outPath,
                "--mode", mode,
                "--model", model
            ],
            {
                cwd: rootDir,
                env: process.env,
                windowsHide: true
            }
        );
        processed += 1;
    }

    console.log(`Done. Generated: ${processed}. Skipped: ${skipped}.`);
}

main().catch((error) => {
    console.error("Could not batch-generate karaoke timings.");
    console.error(error?.stderr || error?.stack || error?.message || String(error));
    process.exit(1);
});
