import type { DownloadSpec, EngineMediaKind } from "@/lib/engine/format-groups";
import type { ErrorCode } from "@/lib/errors";
import type { MediaKind } from "@/lib/media/detect-media-type";

export type Platform = "instagram" | "youtube" | "pinterest" | "facebook" | "x";

export type { MediaKind };
export type { DownloadSpec, EngineMediaKind } from "@/lib/engine/format-groups";

/** Broad shape of the post, used only for UI labelling. */
export type PostKind = "image" | "video" | "carousel";

/**
 * One concrete media item.
 *
 * `mediaUrl` is the actual file — never a thumbnail. A video item carries its
 * poster separately in `posterUrl`, so the two can never be confused.
 */
export interface ResolvedMedia {
  id: string;
  kind: MediaKind;
  /**
   * The real media file URL, when one can be streamed directly (a CDN image or
   * a progressive video). For engine-produced options this is the source page
   * URL and the actual bytes are produced from `downloadSpec` at download time.
   */
  mediaUrl: string;
  mimeType: string;
  /** Canonical extension without a dot: "jpg", "webp", "mp4", "mp3". */
  extension: string;
  /** Short uppercase label for the UI: "JPG", "MP4". */
  label: string;
  /** Optional qualifier such as "720p" or "Image 2". */
  quality?: string;
  /** Preview poster for a video item. Never used as the download. */
  posterUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  fileSize?: number;

  // ── Engine options (yt-dlp / FFmpeg) ──────────────────────────────────────
  /**
   * How the download pipeline produces this item. Absent for a plain direct
   * download (the URL in `mediaUrl` is streamed as-is).
   */
  downloadSpec?: DownloadSpec;
  /** The page URL an engine spec extracts from. */
  sourceUrl?: string;
  /** video | audio | image — drives the UI grouping. */
  engineKind?: EngineMediaKind;
  /** Audio bitrate in kbps, for audio options. */
  audioBitrate?: number;
}

/** Why a post has no downloadable media, when that is the case. */
export interface MediaUnavailable {
  code: ErrorCode;
  message: string;
}

/** What a resolver returns. Contains real media URLs; server-side only. */
export interface ResolvedResult {
  platform: Platform;
  /** Overall shape of the post, for labelling only. */
  postKind: PostKind;
  title?: string;
  creator?: string;
  /** Preview image for the post as a whole. */
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
  /** Human label such as "Reel", "Pin", "Post video". */
  kind?: string;
  sourceUrl: string;
  media: ResolvedMedia[];
  /** Set when the requested media exists but cannot be downloaded. */
  unavailable?: MediaUnavailable;
  /** Extraction diagnostics for /dev/resolver-test. Never sent to the browser. */
  diagnostics?: ResolveDiagnostics;
}

export interface ResolveDiagnostics {
  videoResolver?: string;
  candidateCount: number;
  candidates: Array<{
    id: string;
    source: string;
    host: string;
    kindHint?: string;
    declaredMimeType?: string;
    probedContentType?: string;
    resolvedKind?: string;
    resolvedMimeType?: string;
    extension?: string;
    bitrate?: number;
    accepted: boolean;
    rejectedReason?: string;
  }>;
}

/**
 * A media item as sent to the browser.
 *
 * `mediaUrl` is included because the UI needs it for inline `<video>` preview;
 * it is a public CDN URL. Downloads still go through POST /api/download with a
 * server-issued reference, so the download route is never an open proxy.
 */
export interface PublicMedia {
  id: string;
  kind: MediaKind;
  /**
   * Direct CDN URL when one exists, used for inline preview. Empty string when
   * the item is engine-produced (no single URL); the poster is used instead.
   */
  mediaUrl: string;
  mimeType: string;
  extension: string;
  label: string;
  quality?: string;
  posterUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  fileSize?: number;
  /** video | audio | image, so the UI can group the selector. */
  engineKind?: EngineMediaKind;
  audioBitrate?: number;
  downloadable: boolean;
}

export interface PublicResolveResult {
  platform: Platform;
  postKind: PostKind;
  title?: string;
  creator?: string;
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
  kind?: string;
  sourceUrl: string;
  /** Reference used by POST /api/download. Absent when nothing is downloadable. */
  mediaId?: string;
  /** True only for MOCK_RESOLVER results. */
  isMock?: boolean;
  media: PublicMedia[];
  unavailable?: MediaUnavailable;
}

export interface PlatformDetection {
  platform: Platform | null;
  typeHint: string | null;
}
