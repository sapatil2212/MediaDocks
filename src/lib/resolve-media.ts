import { resolveMedia as resolveMediaFromApi } from "@/lib/api-client";
import { ResolveError, type MediaResult, type ResolveErrorCode } from "./media";
import { detectPlatform } from "./platforms";

export const PROCESSING_STEPS = [
  "Analyzing your link...",
  "Detecting platform...",
  "Finding available media...",
] as const;

/**
 * Maps a server error code onto the code the error UI understands.
 * Anything unknown falls back to a generic, non-technical message.
 */
const ERROR_CODE_MAP: Record<string, ResolveErrorCode> = {
  INVALID_URL: "invalid_url",
  INVALID_PLATFORM_URL: "invalid_url",
  UNSUPPORTED_PLATFORM: "unsupported",
  UNSAFE_URL: "invalid_url",
  PLATFORM_ACCESS_UNAVAILABLE: "platform_unavailable",
  MEDIA_NOT_FOUND: "not_found",
  MEDIA_NOT_AVAILABLE: "not_found",
  MEDIA_REFERENCE_EXPIRED: "not_found",
  REQUEST_TIMEOUT: "timeout",
  RATE_LIMITED: "rate_limited",
};

/**
 * Single path to media data: the browser always calls POST /api/resolve.
 * Demo data, when enabled, is produced by the server (MOCK_RESOLVER=true) so
 * that the request/response pipeline is identical in both modes.
 */
export async function resolveMedia(
  url: string,
  onStep?: (index: number) => void,
): Promise<MediaResult> {
  const trimmed = url.trim();
  onStep?.(0);

  // Client-side pre-checks only guard obvious mistakes; the server validates.
  const detection = detectPlatform(trimmed);
  if (!detection.isUrl) throw new ResolveError("invalid_url");

  onStep?.(1);
  if (!detection.platform) throw new ResolveError("unsupported");

  onStep?.(2);

  try {
    const api = await resolveMediaFromApi(trimmed);
    return {
      platform: api.platform,
      postKind: api.postKind,
      title: api.title,
      creator: api.creator,
      thumbnail: api.thumbnail,
      duration: api.duration,
      width: api.width,
      height: api.height,
      kind: api.kind,
      sourceUrl: api.sourceUrl,
      mediaId: api.mediaId,
      isMock: api.isMock,
      unavailable: api.unavailable,
      media: api.media.map((item) => ({
        id: item.id,
        kind: item.kind,
        mediaUrl: item.mediaUrl,
        mimeType: item.mimeType,
        extension: item.extension,
        label: item.label,
        quality: item.quality,
        posterUrl: item.posterUrl,
        width: item.width,
        height: item.height,
        duration: item.duration,
        size: item.fileSize,
        engineKind: item.engineKind,
        audioBitrate: item.audioBitrate,
        downloadable: item.downloadable,
      })),
    };
  } catch (error) {
    const code = (error as { code?: string })?.code;
    const message = error instanceof Error ? error.message : undefined;
    throw new ResolveError(ERROR_CODE_MAP[code ?? ""] ?? "restricted", message);
  }
}
