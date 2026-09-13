import type { MediaCandidate } from "@/lib/media/candidates";
import { debugLog } from "@/lib/debug";
import { isDownloadableMediaUrl } from "../base";
import { extractEmbeddedVideoUrls } from "./embedded-json";
import type { VideoResolver, VideoResolverInput } from "./types";
import { selectVideoVariants, type RawVariant } from "./video-selection";

/**
 * Facebook video extraction.
 *
 * Checks the publicly returned response for a real video file:
 *
 *   - og:video / og:video:secure_url
 *   - twitter:player:stream
 *   - embedded state fields Facebook uses for playable media
 *     (playable_url, playable_url_quality_hd, browser_native_hd_url,
 *      browser_native_sd_url, hd_src, sd_src)
 *   - JSON-LD contentUrl and a final raw .mp4 scan
 *
 * Measured reality: a logged-out public video page publishes og:title and
 * og:description but no og:image and no og:video, and no playable field appears
 * in the returned shell. When that is the case the platform resolver reports
 * VIDEO_MEDIA_UNAVAILABLE rather than inventing a URL.
 */
export class FacebookVideoResolver implements VideoResolver {
  readonly name = "FacebookVideoResolver";

  canResolve(input: VideoResolverInput): boolean {
    const host = input.url.hostname.toLowerCase().replace(/^www\./, "");
    return (
      host === "facebook.com" ||
      host === "m.facebook.com" ||
      host === "web.facebook.com" ||
      host === "fb.watch"
    );
  }

  async resolve(input: VideoResolverInput): Promise<MediaCandidate[]> {
    const metadata = input.metadata;
    const poster = isDownloadableMediaUrl(metadata?.image) ? metadata?.image : undefined;

    const raw: RawVariant[] = [];

    if (metadata?.video) {
      raw.push({
        url: metadata.video,
        contentType: metadata.videoType ?? null,
        width: metadata.videoWidth ?? null,
        height: metadata.videoHeight ?? null,
      });
    }

    const playerStream = metadata?.tags["twitter:player:stream"];
    if (playerStream) {
      raw.push({
        url: playerStream,
        contentType: metadata?.tags["twitter:player:stream:content_type"] ?? null,
      });
    }

    for (const found of extractEmbeddedVideoUrls(input.html ?? "")) {
      raw.push({ url: found.url, contentType: null });
    }

    const candidates: MediaCandidate[] = selectVideoVariants(raw)
      .filter((variant) => isDownloadableMediaUrl(variant.url))
      .map((variant, index) => ({
        id: `fb-video-${index + 1}`,
        url: variant.url,
        kindHint: "video" as const,
        source: "facebook:public-response",
        ...(variant.contentType ? { declaredMimeType: variant.contentType } : {}),
        ...(variant.width ? { width: variant.width } : {}),
        ...(variant.height ? { height: variant.height } : {}),
        ...(variant.quality ? { quality: variant.quality } : {}),
        ...(metadata?.duration ? { duration: metadata.duration } : {}),
        ...(poster ? { posterUrl: poster } : {}),
      }));

    debugLog("MEDIA", { resolver: this.name, candidates: candidates.length });
    return candidates;
  }
}
