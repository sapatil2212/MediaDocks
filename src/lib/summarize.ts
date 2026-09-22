/**
 * Types and pure helpers for the audio summarizer.
 *
 * Kept free of server imports so the same validation and export logic runs in
 * the browser and in the API route, and can be unit tested without a network
 * call or a database.
 */

export type SummaryFormat = "brief" | "keyPoints" | "actionItems" | "qa";
export type SummaryLength = "short" | "medium" | "detailed";

export interface QaPair {
  question: string;
  answer: string;
}

export interface SummaryResult {
  /** Always produced: a prose recap, sized by the requested length. */
  summary: string;
  /** Present for the key-points format. */
  keyPoints: string[];
  /** Present for the action-items format; empty when nothing was committed to. */
  actionItems: string[];
  /** Present for the Q&A format. */
  qa: QaPair[];
  /** A short title derived from the content. */
  title: string;
  format: SummaryFormat;
  length: SummaryLength;
  /** Detected language of the source transcript, when the model reported one. */
  language: string | null;
  /** Word count of the transcript that was summarized. */
  sourceWords: number;
}

export const SUMMARY_FORMATS: Array<{
  id: SummaryFormat;
  label: string;
  description: string;
}> = [
  { id: "brief", label: "Brief recap", description: "A short prose summary of the whole recording" },
  { id: "keyPoints", label: "Key points", description: "The main ideas as a scannable list" },
  { id: "actionItems", label: "Action items", description: "Decisions and follow-ups that were committed to" },
  { id: "qa", label: "Q&A", description: "The questions raised and how they were answered" },
];

export const SUMMARY_LENGTHS: Array<{ id: SummaryLength; label: string; hint: string }> = [
  { id: "short", label: "Short", hint: "A few sentences" },
  { id: "medium", label: "Medium", hint: "A couple of paragraphs" },
  { id: "detailed", label: "Detailed", hint: "A thorough walkthrough" },
];

/** Shortest transcript worth summarizing; below this a summary adds nothing. */
export const MIN_TRANSCRIPT_WORDS = 20;
/**
 * Upper bound on characters sent to the model in one request. Long recordings
 * are condensed section by section before the final pass, so this caps a single
 * prompt rather than the recording length.
 */
export const MAX_TRANSCRIPT_CHARS = 120_000;

export function isSummaryFormat(value: unknown): value is SummaryFormat {
  return SUMMARY_FORMATS.some((format) => format.id === value);
}

export function isSummaryLength(value: unknown): value is SummaryLength {
  return SUMMARY_LENGTHS.some((length) => length.id === value);
}

/** Counts words without tripping over punctuation or non-Latin scripts. */
export function countWords(text: string): number {
  if (typeof text !== "string") return 0;
  try {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "word" }).segment(text)).filter(
      (part) => part.isWordLike,
    ).length;
  } catch {
    return text.split(/\s+/u).filter(Boolean).length;
  }
}

/** True when there is enough speech to be worth summarizing. */
export function isSummarizable(text: string): boolean {
  return countWords(text) >= MIN_TRANSCRIPT_WORDS;
}

/**
 * Splits a long transcript into model-sized sections on sentence boundaries.
 *
 * Cutting mid-sentence loses meaning at every seam, so the split prefers the
 * last sentence end inside the window and only hard-cuts when a single
 * "sentence" is longer than the window.
 */
export function splitForModel(text: string, maxChars = MAX_TRANSCRIPT_CHARS): string[] {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const sections: string[] = [];
  let remaining = trimmed;

  while (remaining.length > maxChars) {
    const window = remaining.slice(0, maxChars);
    const boundary = Math.max(
      window.lastIndexOf(". "),
      window.lastIndexOf("? "),
      window.lastIndexOf("! "),
      window.lastIndexOf("\n"),
    );
    const cut = boundary > maxChars * 0.5 ? boundary + 1 : maxChars;
    sections.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }

  if (remaining) sections.push(remaining);
  return sections.filter(Boolean);
}

/** Normalizes a model list: trims, drops empties, removes duplicates. */
export function cleanList(value: unknown, limit = 20): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string") continue;
    // Models often re-add bullet glyphs even when asked for plain strings.
    const cleaned = entry.replace(/^[\s*\-•\d.)]+/, "").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
    if (out.length >= limit) break;
  }

  return out;
}

/** Normalizes Q&A pairs, dropping any entry missing either half. */
export function cleanQaPairs(value: unknown, limit = 20): QaPair[] {
  if (!Array.isArray(value)) return [];
  const out: QaPair[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const question = String((entry as Record<string, unknown>).question ?? "").trim();
    const answer = String((entry as Record<string, unknown>).answer ?? "").trim();
    if (!question || !answer) continue;
    out.push({ question, answer });
    if (out.length >= limit) break;
  }

  return out;
}

/** Plain-text rendering of a summary, for copying or downloading. */
export function summaryToText(result: SummaryResult): string {
  const lines: string[] = [];

  if (result.title) lines.push(result.title, "");
  if (result.summary) lines.push(result.summary, "");

  if (result.keyPoints.length > 0) {
    lines.push("Key points", ...result.keyPoints.map((point) => `- ${point}`), "");
  }
  if (result.actionItems.length > 0) {
    lines.push("Action items", ...result.actionItems.map((item) => `- ${item}`), "");
  }
  if (result.qa.length > 0) {
    lines.push("Questions & answers", "");
    for (const pair of result.qa) {
      lines.push(`Q: ${pair.question}`, `A: ${pair.answer}`, "");
    }
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** A filesystem-safe download name derived from the summary title. */
export function summaryFileName(title: string): string {
  const base = (title || "summary")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return `${base || "summary"}.txt`;
}
