/**
 * Pure rules for the Background Remover tool: limits, file validation, batch
 * planning, output naming and the pixel budget. No DOM access, so every
 * function here is unit-testable under vitest's node environment.
 */

/** Bulk mode holds at most this many images at once. */
export const MAX_FILES = 25;
/** Per-file upload ceiling (15 MB). */
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
/** Larger images are proportionally downscaled to fit this many pixels. */
export const MAX_OUTPUT_PIXELS = 16_000_000;

export const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
export const ACCEPT_ATTRIBUTE = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export type RejectionReason = "unsupported-type" | "too-large" | "empty";

export interface FileLike {
  name: string;
  type: string;
  size: number;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/**
 * Validate a candidate input. The MIME type decides when the browser reports
 * one; the extension is only consulted when `type` is empty.
 */
export function validateImageFile(
  file: FileLike
): { ok: true } | { ok: false; reason: RejectionReason } {
  const mime = file.type.trim().toLowerCase();
  const supported = mime
    ? (ACCEPTED_MIME_TYPES as readonly string[]).includes(mime)
    : (ACCEPTED_EXTENSIONS as readonly string[]).includes(extensionOf(file.name));
  if (!supported) return { ok: false, reason: "unsupported-type" };
  if (file.size === 0) return { ok: false, reason: "empty" };
  if (file.size > MAX_FILE_BYTES) return { ok: false, reason: "too-large" };
  return { ok: true };
}

/**
 * Split an incoming selection into what fits in the batch. Invalid files are
 * rejected first and never consume a slot; valid files past the cap overflow.
 * Input order is preserved in every output list.
 */
export function planBatchAddition<T extends FileLike>(
  existingCount: number,
  incoming: T[],
  maxFiles = MAX_FILES
): { accepted: T[]; rejected: Array<{ file: T; reason: RejectionReason }>; overflow: T[] } {
  const accepted: T[] = [];
  const rejected: Array<{ file: T; reason: RejectionReason }> = [];
  const overflow: T[] = [];
  let slots = Math.max(0, maxFiles - existingCount);

  for (const file of incoming) {
    const result = validateImageFile(file);
    if (!result.ok) {
      rejected.push({ file, reason: result.reason });
    } else if (slots > 0) {
      accepted.push(file);
      slots--;
    } else {
      overflow.push(file);
    }
  }
  return { accepted, rejected, overflow };
}

export function rejectionMessage(reason: RejectionReason): string {
  switch (reason) {
    case "unsupported-type":
      return "Only JPG, PNG and WebP images are supported.";
    case "too-large":
      return "Each image must be 15 MB or smaller.";
    case "empty":
      return "This file is empty.";
  }
}

export function overflowMessage(count: number, maxFiles = MAX_FILES): string {
  return `Bulk mode holds up to ${maxFiles} images — ${count} ${count === 1 ? "was" : "were"} not added.`;
}

const MAX_BASE_LENGTH = 100;
const RESERVED_CHARS = new Set(["<", ">", ":", '"', "/", "\\", "|", "?", "*"]);

function trimDotsAndSpaces(value: string): string {
  return value.replace(/^[.\s]+|[.\s]+$/g, "");
}

/**
 * `photo.jpg` → `photo-no-bg.png`. Strips any directory part and the final
 * extension, replaces characters that are illegal in file names (and control
 * characters) with `-`, collapses whitespace, trims leading/trailing dots and
 * spaces, caps the base at 100 characters and falls back to `image`.
 */
export function outputNameFor(originalName: string): string {
  const slash = Math.max(originalName.lastIndexOf("/"), originalName.lastIndexOf("\\"));
  let base = originalName.slice(slash + 1);
  const dot = base.lastIndexOf(".");
  if (dot >= 0) base = base.slice(0, dot);

  base = Array.from(base)
    .map((ch) => (RESERVED_CHARS.has(ch) || ch.charCodeAt(0) < 0x20 ? "-" : ch))
    .join("");
  base = trimDotsAndSpaces(base.replace(/\s+/g, " "));
  base = trimDotsAndSpaces(base.slice(0, MAX_BASE_LENGTH));
  if (!base) base = "image";
  return `${base}-no-bg.png`;
}

function splitName(name: string): { stem: string; ext: string } {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? { stem: name.slice(0, dot), ext: name.slice(dot) } : { stem: name, ext: "" };
}

/**
 * Make every name unique, case-insensitively, while keeping list order. The
 * first occurrence keeps its name; later ones become `stem-2.ext`, `stem-3.ext`…
 * A generated name never takes a literal name that appears anywhere in the list.
 */
export function dedupeFileNames(names: string[]): string[] {
  const literals = new Set(names.map((n) => n.toLowerCase()));
  const used = new Set<string>();

  return names.map((name) => {
    const key = name.toLowerCase();
    if (!used.has(key)) {
      used.add(key);
      return name;
    }
    const { stem, ext } = splitName(name);
    for (let n = 2; ; n++) {
      const candidate = `${stem}-${n}${ext}`;
      const candidateKey = candidate.toLowerCase();
      if (!used.has(candidateKey) && !literals.has(candidateKey)) {
        used.add(candidateKey);
        return candidate;
      }
    }
  });
}

/** Proportionally shrink `width × height` so it fits within `maxPixels`. */
export function fitWithinPixelBudget(
  width: number,
  height: number,
  maxPixels = MAX_OUTPUT_PIXELS
): { width: number; height: number; resized: boolean } {
  if (width * height <= maxPixels) return { width, height, resized: false };
  const scale = Math.sqrt(maxPixels / (width * height));
  let w = Math.max(1, Math.floor(width * scale));
  let h = Math.max(1, Math.floor(height * scale));
  // Extreme aspect ratios: clamping one side to 1 can push the area back over.
  if (w * h > maxPixels) {
    if (w === 1) h = Math.max(1, Math.floor(maxPixels / w));
    else w = Math.max(1, Math.floor(maxPixels / h));
  }
  return { width: w, height: h, resized: true };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
