import argparse
import json
import math
import os
import re
import unicodedata
from pathlib import Path


def parse_args():
    parser = argparse.ArgumentParser(description="Generate word-level karaoke timings from MP3 + LRC using faster-whisper.")
    parser.add_argument("--audio", required=True, help="Path to the source audio file")
    parser.add_argument("--lyrics", required=True, help="Path to the source .lrc file")
    parser.add_argument("--out", required=True, help="Path to the output karaoke json")
    parser.add_argument("--model", default="small", help="faster-whisper model name (tiny, base, small, medium, large-v3, ...)")
    parser.add_argument("--device", default="cpu", help="Inference device (cpu, cuda, auto)")
    parser.add_argument("--compute-type", default="int8", help="faster-whisper compute type")
    parser.add_argument("--beam-size", type=int, default=2, help="Beam size for transcription")
    parser.add_argument("--language", default="vi", help="Language hint for Whisper (for example: vi, en)")
    return parser.parse_args()


def read_text_with_fallback(file_path):
    encodings = ("utf-8", "utf-8-sig", "cp1258", "utf-16", "latin-1")
    last_error = None
    for encoding in encodings:
        try:
            return file_path.read_text(encoding=encoding)
        except UnicodeDecodeError as error:
            last_error = error
    if last_error:
        raise last_error
    return file_path.read_text(encoding="utf-8", errors="replace")


def parse_timestamp_to_ms(minutes_raw, seconds_raw, fractional_raw="0"):
    minutes = int(minutes_raw or 0)
    seconds = int(seconds_raw or 0)
    fractional = str(fractional_raw or "0")
    if len(fractional) == 3:
        fractional_ms = int(fractional)
    else:
        fractional_ms = int(fractional.ljust(2, "0")) * 10
    return minutes * 60000 + seconds * 1000 + fractional_ms


def parse_lrc(text):
    lines = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        stamps = list(re.finditer(r"\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]", line))
        if not stamps:
            continue

        lyric_text = re.sub(r"\[[^\]]+\]", "", line).strip()
        for stamp in stamps:
            lines.append({
                "timeMs": parse_timestamp_to_ms(stamp.group(1), stamp.group(2), stamp.group(3) or "0"),
                "text": lyric_text or "..."
            })

    lines.sort(key=lambda entry: entry["timeMs"])
    return lines


def resolve_line_end(lines, index):
    current = lines[index]
    next_line = lines[index + 1] if index + 1 < len(lines) else None
    previous = lines[index - 1] if index > 0 else None

    if next_line and next_line["timeMs"] > current["timeMs"]:
        return next_line["timeMs"]
    if previous and previous["timeMs"] < current["timeMs"]:
        return current["timeMs"] + min(max(current["timeMs"] - previous["timeMs"], 900), 5000)
    return current["timeMs"] + 2200


def normalize_token(value):
    text = str(value or "").strip().lower()
    if not text:
        return ""
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = re.sub(r"[^\w]+", "", text, flags=re.UNICODE)
    return text


def split_lyric_words(text):
    return [token for token in re.split(r"\s+", str(text or "").strip()) if token]


def tokens_equivalent(a, b):
    if not a or not b:
        return False
    return a == b or a in b or b in a


def fill_missing_word_times(words, start_ms, end_ms):
    safe_start = start_ms if isinstance(start_ms, (int, float)) else 0
    safe_end = end_ms if isinstance(end_ms, (int, float)) and end_ms > safe_start else safe_start + 2200
    fallback_step = max((safe_end - safe_start) / max(len(words), 1), 40)

    last_known_index = -1
    for index, word in enumerate(words):
        if not isinstance(word.get("startTime"), (int, float)):
            continue

        if last_known_index + 1 < index:
            left_boundary = words[last_known_index]["startTime"] if last_known_index >= 0 else safe_start
            gap = index - last_known_index
            right_boundary = word["startTime"]
            step = max((right_boundary - left_boundary) / gap, 30)
            for fill_index in range(last_known_index + 1, index):
                words[fill_index]["startTime"] = round(left_boundary + step * (fill_index - last_known_index))

        last_known_index = index

    if last_known_index < 0:
        for index, word in enumerate(words):
            word["startTime"] = round(safe_start + fallback_step * index)
        last_known_index = len(words) - 1

    for index in range(last_known_index + 1, len(words)):
        words[index]["startTime"] = round(words[index - 1]["startTime"] + fallback_step)

    for index, word in enumerate(words):
        next_word = words[index + 1] if index + 1 < len(words) else None
        fallback_end = next_word["startTime"] if next_word else safe_end
        word_end = word.get("endTime")
        if not isinstance(word_end, (int, float)) or word_end <= word["startTime"]:
            word["endTime"] = max(round(fallback_end), round(word["startTime"] + 80))
        else:
            word["endTime"] = round(max(word_end, word["startTime"] + 80))
        word["startTime"] = round(word["startTime"])
        word["timeMs"] = word["startTime"]

    return words


def interpolate_line(line, index, lines):
    line_start = line["timeMs"]
    line_end = resolve_line_end(lines, index)
    tokens = split_lyric_words(line["text"]) or ["..."]
    slice_duration = max((line_end - line_start) / max(len(tokens), 1), 140)
    words = []
    for token_index, token in enumerate(tokens):
        start_time = round(line_start + slice_duration * token_index)
        end_time = round(line_end if token_index == len(tokens) - 1 else line_start + slice_duration * (token_index + 1))
        words.append({
            "text": token,
            "startTime": start_time,
            "endTime": max(end_time, start_time + 80),
            "timeMs": start_time,
            "confidence": None
        })
    return {
        "lineStartMs": line_start,
        "text": line["text"],
        "words": words
    }


def collect_transcript_words(audio_path, model_name, device, compute_type, beam_size, language):
    from faster_whisper import WhisperModel

    model = WhisperModel(model_name, device=device, compute_type=compute_type)
    segments, _info = model.transcribe(
        str(audio_path),
        beam_size=beam_size,
        vad_filter=False,
        word_timestamps=True,
        condition_on_previous_text=False,
        temperature=0,
        language=language or None
    )

    transcript_words = []
    for segment in segments:
        words = getattr(segment, "words", None) or []
        for word in words:
            text = str(getattr(word, "word", "") or "").strip()
            if not text:
                continue
            start = getattr(word, "start", None)
            end = getattr(word, "end", None)
            probability = getattr(word, "probability", None)
            if start is None:
                continue
            start_ms = int(round(float(start) * 1000))
            end_ms = int(round(float(end) * 1000)) if end is not None else start_ms + 120
            transcript_words.append({
                "text": text,
                "norm": normalize_token(text),
                "startMs": start_ms,
                "endMs": max(end_ms, start_ms + 60),
                "confidence": float(probability) if probability is not None else None
            })

    if not transcript_words:
        raise RuntimeError("Whisper returned no word timestamps.")

    return transcript_words


def align_line_words(line, index, lines, transcript_words):
    line_start = line["timeMs"]
    line_end = resolve_line_end(lines, index)
    lyric_words = [{
        "text": token,
        "norm": normalize_token(token),
        "startTime": None,
        "endTime": None,
        "confidence": None
    } for token in split_lyric_words(line["text"])]

    if not lyric_words:
        return {
            "lineStartMs": line_start,
            "text": line["text"],
            "words": [{
                "text": "...",
                "startTime": line_start,
                "endTime": line_end,
                "timeMs": line_start,
                "confidence": None
            }]
        }

    window_start = max(0, line_start - 240)
    window_end = line_end + 240
    candidates = [word for word in transcript_words if window_start <= word["startMs"] <= window_end]

    cursor = 0
    for lyric_word in lyric_words:
        for candidate_index in range(cursor, len(candidates)):
            candidate = candidates[candidate_index]
            if not tokens_equivalent(lyric_word["norm"], candidate["norm"]):
                continue
            lyric_word["startTime"] = candidate["startMs"]
            lyric_word["endTime"] = candidate["endMs"]
            lyric_word["confidence"] = candidate["confidence"]
            cursor = candidate_index + 1
            break

    fill_missing_word_times(lyric_words, line_start, line_end)
    return {
        "lineStartMs": line_start,
        "text": line["text"],
        "words": [{
            "text": word["text"],
            "startTime": word["startTime"],
            "endTime": word["endTime"],
            "timeMs": word["startTime"],
            "confidence": word["confidence"]
        } for word in lyric_words]
    }


def build_aligned_karaoke(lines, transcript_words):
    return [align_line_words(line, index, lines, transcript_words) for index, line in enumerate(lines)]


def main():
    args = parse_args()
    audio_path = Path(args.audio).resolve()
    lyrics_path = Path(args.lyrics).resolve()
    out_path = Path(args.out).resolve()

    lrc_text = read_text_with_fallback(lyrics_path)
    lines = parse_lrc(lrc_text)
    if not lines:
        raise RuntimeError("No timed lines were found in the supplied .lrc file.")

    transcript_words = collect_transcript_words(
        audio_path=audio_path,
        model_name=args.model,
        device=args.device,
        compute_type=args.compute_type,
        beam_size=args.beam_size,
        language=args.language
    )
    karaoke_lines = build_aligned_karaoke(lines, transcript_words)

    output = {
        "generatedAt": __import__("datetime").datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "source": {
            "audio": audio_path.name,
            "lyrics": lyrics_path.name,
            "mode": "python",
            "engine": "faster-whisper",
            "model": args.model,
            "transcriptWordCount": len(transcript_words)
        },
        "lines": karaoke_lines
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Karaoke timings written to {out_path}")


if __name__ == "__main__":
    main()
