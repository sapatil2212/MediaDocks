/**
 * Subtitle cue model, formatting, parsing and repair helpers.
 *
 * Pure and dependency-free so the same logic runs in the API route (building
 * cues from timed transcription windows), in the browser (editing, shifting and
 * exporting) and in unit tests.
 *
 * Conventions follow what players and platforms actually accept: at most two
 * lines per cue, ~42 characters per line, and a readable minimum duration. Cues
 * that break those rules technically still play but are unpleasant to read, so
 * the builder enforces them and the validator reports them for imported files.
 */

export interface SubtitleCue {
  id: string;
  /** Seconds from the start of the media. */
  start: number;
  end: number;
  /** Cue text; may contain a single newline separating two lines. */
  text: string;
}

export const MAX_CHARS_PER_LINE = 42;
export const MAX_LINES_PER_CUE = 2;
export const MIN_CUE_SECONDS = 1;
export const MAX_CUE_SECONDS = 6;
/** Gap inserted between consecutive generated cues so they do not touch. */
const CUE_GAP_SECONDS = 0.04;

function round(value: number, places = 3): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function clampNonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/* ─────────────────────────────── time formats ─────────────────────────────── */

function timeParts(totalSeconds: number) {
  const ms = Math.max(0, Math.round(clampNonNegative(totalSeconds) * 1000));
  return {
    hours: Math.floor(ms / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1000),
    millis: ms % 1000,
  };
}

const pad = (value: number, width = 2) => String(value).padStart(width, "0");

/** `HH:MM:SS,mmm` — SRT uses a comma for the decimal separator. */
export function formatSrtTimecode(seconds: number): string {
  const { hours, minutes, seconds: s, millis } = timeParts(seconds);
  return `${pad(hours)}:${pad(minutes)}:${pad(s)},${pad(millis, 3)}`;
}

/** `HH:MM:SS.mmm` — WebVTT uses a period. */
export function formatVttTimecode(seconds: number): string {
  const { hours, minutes, seconds: s, millis } = timeParts(seconds);
  return `${pad(hours)}:${pad(minutes)}:${pad(s)}.${pad(millis, 3)}`;
}

/** Short `M:SS` label for the editor. */
export function formatClock(seconds: number): string {
  const { hours, minutes, seconds: s } = timeParts(seconds);
  const base = `${hours > 0 ? `${hours}:${pad(minutes)}` : minutes}:${pad(s)}`;
  return base;
}

/**
 * Parses an SRT or VTT timecode.
 *
 * Accepts both separators, an optional hours field, and 2- or 3-digit
 * milliseconds, because real-world files contain all of these.
 */
export function parseTimecode(value: string): number | null {
  const match = String(value)
    .trim()
    .match(/^(?:(\d{1,3}):)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/);
  if (!match) return null;

  const [, hours, minutes, seconds, fraction] = match;
  const millis = fraction ? Number(fraction.padEnd(3, "0")) : 0;
  const total = Number(hours ?? 0) * 3600 + Number(minutes) * 60 + Number(seconds) + millis / 1000;
  return Number.isFinite(total) ? round(total) : null;
}

/* ──────────────────────────────── line layout ─────────────────────────────── */

/**
 * Wraps cue text onto at most `maxLines` lines of `maxChars`.
 *
 * Greedy word wrapping keeps lines balanced enough to read while never breaking
 * a word, which matters more for subtitles than perfect balance. Text that will
 * not fit is left on the final line rather than being silently truncated —
 * losing spoken words is worse than an over-long line.
 */
export function wrapCueText(
  text: string,
  maxChars = MAX_CHARS_PER_LINE,
  maxLines = MAX_LINES_PER_CUE,
): string {
  const words = String(text ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || !current) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }

  // Everything still unplaced goes on the last line.
  const placed = lines.join(" ").split(/\s+/).filter(Boolean).length;
  const remainder = words.slice(placed).join(" ");
  if (remainder) lines.push(remainder);
  else if (current) lines.push(current);

  return lines.slice(0, maxLines).join("\n");
}

/**
 * Splits a block of text into subtitle-sized chunks.
 *
 * Sentence ends are preferred as break points so a cue does not end mid-clause;
 * otherwise it breaks on the last word that fits.
 */
export function splitTextIntoCueChunks(
  text: string,
  maxChars = MAX_CHARS_PER_LINE * MAX_LINES_PER_CUE,
): string[] {
  const normalized = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  if (normalized.length <= maxChars) return [normalized];

  const chunks: string[] = [];
  let rest = normalized;

  while (rest.length > maxChars) {
    const window = rest.slice(0, maxChars + 1);
    const sentenceEnd = Math.max(
      window.lastIndexOf(". "),
      window.lastIndexOf("? "),
      window.lastIndexOf("! "),
      window.lastIndexOf("، "),
      window.lastIndexOf("। "),
    );
    const wordEnd = window.lastIndexOf(" ");
    const cut = sentenceEnd > maxChars * 0.45 ? sentenceEnd + 1 : wordEnd > 0 ? wordEnd : maxChars;

    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }

  if (rest) chunks.push(rest);
  return chunks.filter(Boolean);
}

/* ─────────────────────────────── cue building ─────────────────────────────── */

/**
 * Turns one transcribed window into timed cues.
 *
 * Time is distributed across the window in proportion to each chunk's character
 * count, which is a deliberate approximation: the transcription step returns
 * text for a window rather than per-word timings. Keeping windows short bounds
 * the resulting drift, and the editor exposes a shift control for fine-tuning.
 */
export function buildCuesForWindow(
  text: string,
  windowStart: number,
  windowEnd: number,
  idPrefix = "cue",
): SubtitleCue[] {
  const start = clampNonNegative(windowStart);
  const end = clampNonNegative(windowEnd);
  const span = end - start;
  const chunks = splitTextIntoCueChunks(text);
  if (chunks.length === 0 || span <= 0) return [];

  const totalChars = chunks.reduce((sum, chunk) => sum + chunk.length, 0) || 1;
  const cues: SubtitleCue[] = [];
  let cursor = start;

  chunks.forEach((chunk, index) => {
    const isLast = index === chunks.length - 1;
    const share = (chunk.length / totalChars) * span;
    const rawEnd = isLast ? end : cursor + share;
    const cueEnd = Math.min(end, Math.max(cursor + 0.2, rawEnd));

    cues.push({
      id: `${idPrefix}-${index + 1}`,
      start: round(cursor),
      end: round(cueEnd),
      text: wrapCueText(chunk),
    });

    cursor = Math.min(end, cueEnd + (isLast ? 0 : CUE_GAP_SECONDS));
  });

  return cues;
}

/** Re-numbers cue ids sequentially, for use after edits or merges. */
export function renumberCues(cues: readonly SubtitleCue[], idPrefix = "cue"): SubtitleCue[] {
  return cues.map((cue, index) => ({ ...cue, id: `${idPrefix}-${index + 1}` }));
}

/**
 * Moves every cue by `offsetSeconds`, for fixing subtitles that run early or
 * late. Negative offsets never push a cue before zero, and a cue whose whole
 * span would be pushed below zero collapses to the start rather than inverting.
 */
export function shiftCues(cues: readonly SubtitleCue[], offsetSeconds: number): SubtitleCue[] {
  const offset = Number.isFinite(offsetSeconds) ? offsetSeconds : 0;
  return cues.map((cue) => {
    const start = Math.max(0, round(cue.start + offset));
    const end = Math.max(start + 0.1, round(cue.end + offset));
    return { ...cue, start, end };
  });
}

/** Sorts by start time and removes overlaps by trimming the earlier cue. */
export function normalizeCues(cues: readonly SubtitleCue[]): SubtitleCue[] {
  const sorted = [...cues]
    .filter((cue) => cue.text.trim().length > 0)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];
    if (current.end > next.start) {
      current.end = round(Math.max(current.start + 0.1, next.start - 0.01));
    }
  }

  return renumberCues(sorted);
}

/* ──────────────────────────────── exporting ──────────────────────────────── */

export function toSrt(cues: readonly SubtitleCue[]): string {
  return (
    cues
      .map(
        (cue, index) =>
          `${index + 1}\n${formatSrtTimecode(cue.start)} --> ${formatSrtTimecode(cue.end)}\n${cue.text.trim()}`,
      )
      .join("\n\n") + (cues.length ? "\n" : "")
  );
}

export function toVtt(cues: readonly SubtitleCue[]): string {
  const body = cues
    .map(
      (cue, index) =>
        `${index + 1}\n${formatVttTimecode(cue.start)} --> ${formatVttTimecode(cue.end)}\n${cue.text.trim()}`,
    )
    .join("\n\n");
  return `WEBVTT\n\n${body}${cues.length ? "\n" : ""}`;
}

/** Plain transcript text, one cue per line, with newlines inside cues flattened. */
export function toPlainText(cues: readonly SubtitleCue[]): string {
  return cues
    .map((cue) => cue.text.replace(/\n/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/* ──────────────────────────────── importing ──────────────────────────────── */

/**
 * Parses an SRT or WebVTT file into cues.
 *
 * Tolerant on purpose: cue numbers, WEBVTT headers, NOTE/STYLE blocks, BOMs,
 * CRLF endings and inline tags all appear in files people actually upload, and
 * none of them should cause the import to fail.
 */
export function parseSubtitleFile(raw: string): SubtitleCue[] {
  const text = String(raw ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");
  if (!text.trim()) return [];

  const cues: SubtitleCue[] = [];
  const blocks = text.split(/\n{2,}/);

  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.trim().length > 0);
    if (lines.length === 0) continue;

    const header = lines[0].trim().toUpperCase();
    if (header.startsWith("WEBVTT") || header.startsWith("NOTE") || header.startsWith("STYLE")) {
      continue;
    }

    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex === -1) continue;

    const [rawStart, rawEnd] = lines[timingIndex].split("-->");
    const start = parseTimecode(rawStart ?? "");
    // Trailing VTT cue settings (align, line, position) follow the end time.
    const end = parseTimecode((rawEnd ?? "").trim().split(/\s+/)[0] ?? "");
    if (start === null || end === null || end <= start) continue;

    const body = lines
      .slice(timingIndex + 1)
      .join("\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\{\\[^}]*\}/g, "")
      .trim();
    if (!body) continue;

    cues.push({ id: `cue-${cues.length + 1}`, start, end, text: body });
  }

  return renumberCues(cues);
}

/* ──────────────────────────────── validation ─────────────────────────────── */

export interface CueIssue {
  cueId: string;
  kind: "overlap" | "tooShort" | "tooLong" | "longLine" | "tooManyLines";
  detail: string;
}

/**
 * Reports readability and timing problems without changing anything.
 *
 * Used to warn on imported files and after manual edits, so the operator can
 * decide what to fix rather than having their file quietly rewritten.
 */
export function validateCues(cues: readonly SubtitleCue[]): CueIssue[] {
  const issues: CueIssue[] = [];

  cues.forEach((cue, index) => {
    const duration = cue.end - cue.start;
    if (duration < MIN_CUE_SECONDS) {
      issues.push({
        cueId: cue.id,
        kind: "tooShort",
        detail: `${duration.toFixed(2)}s is below the ${MIN_CUE_SECONDS}s readable minimum`,
      });
    }
    if (duration > MAX_CUE_SECONDS) {
      issues.push({
        cueId: cue.id,
        kind: "tooLong",
        detail: `${duration.toFixed(1)}s exceeds the ${MAX_CUE_SECONDS}s guideline`,
      });
    }

    const lines = cue.text.split("\n");
    if (lines.length > MAX_LINES_PER_CUE) {
      issues.push({
        cueId: cue.id,
        kind: "tooManyLines",
        detail: `${lines.length} lines; ${MAX_LINES_PER_CUE} is the usual maximum`,
      });
    }
    for (const line of lines) {
      if (line.length > MAX_CHARS_PER_LINE) {
        issues.push({
          cueId: cue.id,
          kind: "longLine",
          detail: `${line.length} characters on one line`,
        });
        break;
      }
    }

    const next = cues[index + 1];
    if (next && cue.end > next.start) {
      issues.push({ cueId: cue.id, kind: "overlap", detail: `overlaps ${next.id}` });
    }
  });

  return issues;
}

/** End time of the last cue, i.e. how much of the media the subtitles cover. */
export function subtitleCoverage(cues: readonly SubtitleCue[]): number {
  return cues.reduce((latest, cue) => Math.max(latest, cue.end), 0);
}

/** A filesystem-safe download name with the requested extension. */
export function subtitleFileName(title: string, extension: "srt" | "vtt" | "txt"): string {
  const base = (title || "subtitles")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return `${base || "subtitles"}.${extension}`;
}
