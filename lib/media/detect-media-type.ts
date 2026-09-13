/**
 * Media type detection.
 *
 * The single place that decides whether something is an image or a video and
 * which extension it should be saved with. Nothing in the pipeline is allowed to
 * assume image/jpeg: when the type cannot be established from real evidence this
 * returns `undefined` and the caller reports MEDIA_TYPE_UNKNOWN.
 *
 * Priority (see also `detectMediaType`):
 *   1. Explicit MIME type supplied by the resolver (platform metadata)
 *   2. HTTP Content-Type of the media URL
 *   3. File extension in the media URL path
 *   4. A conservative platform hint
 */

export type MediaKind = "image" | "video";

export interface MediaTypeInfo {
  kind: MediaKind;
  mimeType: string;
  /** Canonical extension without a dot, e.g. "jpg", "webp", "mp4". */
  extension: string;
  /** Short uppercase label for the UI, e.g. "JPG", "MP4". */
  label: string;
  /** Which rule produced this answer — used by debug output. */
  source: "explicit-mime" | "content-type" | "extension" | "platform-hint";
}

interface TypeEntry {
  kind: MediaKind;
  extension: string;
  label: string;
}

/** Every MIME type MediaFlow will serve. Anything else is refused. */
const MIME_TABLE: Record<string, TypeEntry> = {
  // images
  "image/jpeg": { kind: "image", extension: "jpg", label: "JPG" },
  "image/jpg": { kind: "image", extension: "jpg", label: "JPG" },
  "image/pjpeg": { kind: "image", extension: "jpg", label: "JPG" },
  "image/png": { kind: "image", extension: "png", label: "PNG" },
  "image/apng": { kind: "image", extension: "png", label: "PNG" },
  "image/webp": { kind: "image", extension: "webp", label: "WEBP" },
  "image/gif": { kind: "image", extension: "gif", label: "GIF" },
  "image/avif": { kind: "image", extension: "avif", label: "AVIF" },
  "image/heic": { kind: "image", extension: "heic", label: "HEIC" },
  // videos
  "video/mp4": { kind: "video", extension: "mp4", label: "MP4" },
  "video/x-m4v": { kind: "video", extension: "m4v", label: "M4V" },
  "video/webm": { kind: "video", extension: "webm", label: "WEBM" },
  "video/quicktime": { kind: "video", extension: "mov", label: "MOV" },
  "video/ogg": { kind: "video", extension: "ogv", label: "OGV" },
  "video/mpeg": { kind: "video", extension: "mpeg", label: "MPEG" },
};

/** Extension → MIME, used when only the URL path is available. */
const EXTENSION_TABLE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  heic: "image/heic",
  mp4: "video/mp4",
  m4v: "video/x-m4v",
  webm: "video/webm",
  mov: "video/quicktime",
  ogv: "video/ogg",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
};

/** Content types that prove the response is not media at all. */
const NON_MEDIA_TYPES = [
  "text/html",
  "application/json",
  "text/plain",
  "application/xml",
  "text/xml",
  "application/xhtml+xml",
  "text/javascript",
];

/** Strips charset/boundary parameters and lowercases. */
export function normalizeMimeType(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const value = raw.split(";")[0]?.trim().toLowerCase();
  return value || undefined;
}

export function isSupportedMimeType(raw: string | null | undefined): boolean {
  const mime = normalizeMimeType(raw);
  return Boolean(mime && MIME_TABLE[mime]);
}

/** True for HTML/JSON/text responses, which must never be saved as media. */
export function isNonMediaContentType(raw: string | null | undefined): boolean {
  const mime = normalizeMimeType(raw);
  if (!mime) return false;
  return NON_MEDIA_TYPES.includes(mime);
}

function build(mime: string, source: MediaTypeInfo["source"]): MediaTypeInfo | undefined {
  const entry = MIME_TABLE[mime];
  if (!entry) return undefined;
  return { kind: entry.kind, mimeType: mime, extension: entry.extension, label: entry.label, source };
}

export function fromMimeType(
  raw: string | null | undefined,
  source: MediaTypeInfo["source"] = "explicit-mime",
): MediaTypeInfo | undefined {
  const mime = normalizeMimeType(raw);
  return mime ? build(mime, source) : undefined;
}

/** Reads the extension from a URL path, ignoring the query string. */
export function extensionFromUrl(mediaUrl: string): string | undefined {
  let pathname = mediaUrl;
  try {
    pathname = new URL(mediaUrl).pathname;
  } catch {
    pathname = mediaUrl.split("?")[0] ?? mediaUrl;
  }

  const lastSegment = pathname.split("/").pop() ?? "";
  if (!lastSegment.includes(".")) return undefined;

  const ext = lastSegment.split(".").pop()?.toLowerCase();
  return ext && EXTENSION_TABLE[ext] ? ext : undefined;
}

export function fromUrlExtension(mediaUrl: string): MediaTypeInfo | undefined {
  const ext = extensionFromUrl(mediaUrl);
  if (!ext) return undefined;
  const mime = EXTENSION_TABLE[ext];
  return mime ? build(mime, "extension") : undefined;
}

export interface DetectionInput {
  /** MIME type the platform itself published, e.g. an X variant content_type. */
  explicitMimeType?: string | null;
  /** Content-Type observed on the media URL. */
  contentType?: string | null;
  /** The media URL, used for its extension only. */
  mediaUrl?: string;
  /**
   * Last resort, only when the platform genuinely tells us the kind (e.g. the
   * media sits on a video-only CDN path). Never derived from the page URL.
   */
  platformHint?: MediaKind;
}

/**
 * Resolves the media type from the strongest evidence available.
 * Returns undefined when nothing reliable is known.
 */
export function detectMediaType(input: DetectionInput): MediaTypeInfo | undefined {
  const explicit = fromMimeType(input.explicitMimeType, "explicit-mime");
  if (explicit) return explicit;

  const fromHeader = fromMimeType(input.contentType, "content-type");
  if (fromHeader) return fromHeader;

  if (input.mediaUrl) {
    const fromExt = fromUrlExtension(input.mediaUrl);
    if (fromExt) return fromExt;
  }

  if (input.platformHint === "video") return build("video/mp4", "platform-hint");
  if (input.platformHint === "image") return build("image/jpeg", "platform-hint");

  return undefined;
}

/**
 * Builds a human-readable, header-safe download filename.
 * e.g. ("instagram", "reel", "mp4") -> "mediaflow-instagram-reel.mp4"
 */
export function buildDownloadFilename(
  platform: string,
  descriptor: string,
  extension: string,
): string {
  const slug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);

  const safePlatform = slug(platform) || "media";
  const safeDescriptor = slug(descriptor);
  const safeExtension = extension.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 5) || "bin";

  return ["mediaflow", safePlatform, safeDescriptor].filter(Boolean).join("-") + `.${safeExtension}`;
}
