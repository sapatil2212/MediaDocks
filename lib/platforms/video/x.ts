import type { MediaCandidate } from "@/lib/media/candidates";
import { debugLog } from "@/lib/debug";
import { isDownloadableMediaUrl } from "../base";
import type { VideoResolver, VideoResolverInput } from "./types";
import { selectVideoVariants, type RawVariant } from "./video-selection";

interface XVariant {
  content_type?: string;
  bitrate?: number;
  url?: string;
  /** Older syndication shape. */
  type?: string;
  src?: string;
}

interface XMediaDetail {
  type?: string;
  media_url_https?: string;
  original_info?: { width?: number; height?: number };
  video_info?: { duration_millis?: number; variants?: XVariant[] };
}

export interface XPayload {
  mediaDetails?: XMediaDetail[];
  video?: { poster?: string; durationMs?: number; variants?: XVariant[] };
}

/**
 * X video extraction.
 *
 * Reads `mediaDetails[].video_info.variants` from the public syndication
 * response (with the legacy `video.variants` shape as a fallback), keeps only
 * direct renditions — HLS manifests are dropped — and orders them best-first.
 * The poster stays a poster: it is attached to each candidate, never emitted as
 * its own media item.
 */
export class TwitterVideoResolver implements VideoResolver {
  readonly name = "TwitterVideoResolver";

  canResolve(input: VideoResolverInput): boolean {
    const host = input.url.hostname.toLowerCase().replace(/^www\./, "");
    return host === "x.com" || host === "twitter.com" || host === "mobile.twitter.com";
  }

  async resolve(input: VideoResolverInput): Promise<MediaCandidate[]> {
    const payload = (input.payload ?? {}) as XPayload;
    const candidates: MediaCandidate[] = [];

    const details = (payload.mediaDetails ?? []).filter(
      (detail) => detail.type === "video" || detail.type === "animated_gif",
    );

    for (const [detailIndex, detail] of details.entries()) {
      const poster = isDownloadableMediaUrl(detail.media_url_https)
        ? detail.media_url_https
        : undefined;
      const duration = detail.video_info?.duration_millis
        ? Math.round(detail.video_info.duration_millis / 1000)
        : undefined;

      const raw: RawVariant[] = (detail.video_info?.variants ?? []).map((variant) => ({
        url: variant.url ?? variant.src ?? null,
        contentType: variant.content_type ?? variant.type ?? null,
        bitrate: variant.bitrate ?? null,
      }));

      for (const [index, variant] of selectVideoVariants(raw).entries()) {
        candidates.push({
          id: `x-video-${detailIndex + 1}-${index + 1}`,
          url: variant.url,
          kindHint: "video",
          source: "syndication:mediaDetails",
          ...(variant.contentType ? { declaredMimeType: variant.contentType } : {}),
          ...(variant.bitrate ? { bitrate: variant.bitrate } : {}),
          // The rendition's own size, not the original media's.
          ...(variant.width ? { width: variant.width } : {}),
          ...(variant.height ? { height: variant.height } : {}),
          ...(variant.quality ? { quality: variant.quality } : {}),
          ...(duration ? { duration } : {}),
          ...(poster ? { posterUrl: poster } : {}),
        });
      }
    }

    // Legacy shape, only when mediaDetails produced nothing.
    if (candidates.length === 0 && payload.video?.variants) {
      const poster = isDownloadableMediaUrl(payload.video.poster) ? payload.video.poster : undefined;
      const duration = payload.video.durationMs
        ? Math.round(payload.video.durationMs / 1000)
        : undefined;

      const raw: RawVariant[] = payload.video.variants.map((variant) => ({
        url: variant.src ?? variant.url ?? null,
        contentType: variant.type ?? variant.content_type ?? null,
        bitrate: variant.bitrate ?? null,
      }));

      for (const [index, variant] of selectVideoVariants(raw).entries()) {
        candidates.push({
          id: `x-video-${index + 1}`,
          url: variant.url,
          kindHint: "video",
          source: "syndication:video.variants",
          ...(variant.contentType ? { declaredMimeType: variant.contentType } : {}),
          ...(variant.bitrate ? { bitrate: variant.bitrate } : {}),
          ...(variant.width ? { width: variant.width } : {}),
          ...(variant.height ? { height: variant.height } : {}),
          ...(variant.quality ? { quality: variant.quality } : {}),
          ...(duration ? { duration } : {}),
          ...(poster ? { posterUrl: poster } : {}),
        });
      }
    }

    debugLog("MEDIA", {
      resolver: this.name,
      candidates: candidates.length,
      qualities: candidates.map((candidate) => candidate.quality ?? "?"),
    });

    return candidates;
  }
}
