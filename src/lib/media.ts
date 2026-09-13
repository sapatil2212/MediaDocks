/**
 * Shared media contract consumed by the UI.
 *
 * `src/lib/resolve-media.ts` maps the API response (see lib/platforms/types.ts)
 * onto these types, so components never deal with transport details.
 *
 * The important distinction: `MediaItem.mediaUrl` is the real file (used for
 * video preview and for the download reference), while `MediaResult.thumbnail`
 * and `MediaItem.posterUrl` are previews only.
 */

export type Platform = "instagram" | "youtube" | "pinterest" | "facebook" | "x";

/** What a single media item actually is. */
export type MediaKind = "image" | "video";

/** Overall shape of the post, used for labelling. */
export type PostKind = "image" | "video" | "carousel";

/** Groups the selector: a video resolution, an audio format, or an image. */
export type EngineKind = "video" | "audio" | "image";

export interface MediaItem {
  id: string;
  kind: MediaKind;
  /** The real media file when one exists; empty for engine-produced options. */
  mediaUrl: string;
  mimeType: string;
  /** Canonical extension without a dot: "jpg", "webp", "mp4", "mp3". */
  extension: string;
  /** Short uppercase label: "JPG", "MP4". */
  label: string;
  quality?: string;
  /** Poster frame for a video item. */
  posterUrl?: string;
  width?: number;
  height?: number;
  /** seconds */
  duration?: number;
  /** bytes */
  size?: number;
  /** video | audio | image — used to group the format selector. */
  engineKind?: EngineKind;
  /** audio bitrate in kbps */
  audioBitrate?: number;
  downloadable: boolean;
}

export interface MediaUnavailable {
  code: string;
  message: string;
}

export interface MediaResult {
  platform: Platform;
  postKind: PostKind;
  title?: string;
  creator?: string;
  /** Preview image for the post. Never the download target. */
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
  /** Human label, e.g. "Reel", "Video", "Pin". */
  kind?: string;
  sourceUrl?: string;
  /** Present when at least one item can be downloaded. */
  mediaId?: string;
  /** True for MOCK_RESOLVER demo results. */
  isMock?: boolean;
  media: MediaItem[];
  /** Set when the requested media exists but no file is downloadable. */
  unavailable?: MediaUnavailable;
}

export type ResolveErrorCode =
  | "invalid_url"
  | "unsupported"
  | "platform_unavailable"
  | "not_found"
  | "timeout"
  | "rate_limited"
  | "restricted";

export class ResolveError extends Error {
  code: ResolveErrorCode;
  constructor(code: ResolveErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "ResolveError";
  }
}

export function formatDuration(seconds?: number) {
  if (!seconds && seconds !== 0) return undefined;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatSize(bytes?: number) {
  if (!bytes) return undefined;
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
  return `${mb.toFixed(1)} MB`;
}
