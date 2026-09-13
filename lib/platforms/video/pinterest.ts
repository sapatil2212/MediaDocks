import type { MediaCandidate } from "@/lib/media/candidates";
import { debugLog } from "@/lib/debug";
import { isDownloadableMediaUrl } from "../base";
import { extractEmbeddedVideoUrls } from "./embedded-json";
import type { VideoResolver, VideoResolverInput } from "./types";
import { qualityLabel, resolutionFromUrl, selectVideoVariants, type RawVariant } from "./video-selection";

/**
 * Pinterest video extraction.
 *
 * Pinterest expresses video Pins several different ways, so this normalizes
 * rather than depending on one field:
 *
 *   - og:video / og:video:secure_url with og:video:type
 *   - `video_list` as an object map, e.g. { V_720P: { url, width, height } }
 *   - `videos` / `video` / `sources` arrays
 *   - JSON-LD contentUrl
 *   - a raw .mp4 scan as a last resort
 *
 * The Pin image is kept as the poster only.
 */
export class PinterestVideoResolver implements VideoResolver {
  readonly name = "PinterestVideoResolver";

  canResolve(input: VideoResolverInput): boolean {
    const host = input.url.hostname.toLowerCase().replace(/^www\./, "");
    return host === "pin.it" || /(^|\.)pinterest\.[a-z.]{2,}$/.test(host) || host === "pinterest.com";
  }

  async resolve(input: VideoResolverInput): Promise<MediaCandidate[]> {
    const metadata = input.metadata;
    const poster = isDownloadableMediaUrl(metadata?.image) ? metadata?.image : undefined;

    const raw: RawVariant[] = [];

    // 1. Published OpenGraph video.
    if (metadata?.video) {
      raw.push({
        url: metadata.video,
        contentType: metadata.videoType ?? null,
        width: metadata.videoWidth ?? null,
        height: metadata.videoHeight ?? null,
      });
    }

    // 2. Structured video collections in the embedded state.
    for (const entry of readVideoList(input.html ?? "")) {
      raw.push(entry);
    }

    // 3. Anything else that looks like a direct video file.
    for (const found of extractEmbeddedVideoUrls(input.html ?? "")) {
      raw.push({ url: found.url, contentType: null });
    }

    const selected = selectVideoVariants(raw);
    const candidates: MediaCandidate[] = selected
      .filter((variant) => isDownloadableMediaUrl(variant.url))
      .map((variant, index) => ({
        id: `pin-video-${index + 1}`,
        url: variant.url,
        kindHint: "video" as const,
        source: "pinterest:normalized",
        ...(variant.contentType ? { declaredMimeType: variant.contentType } : {}),
        ...(variant.bitrate ? { bitrate: variant.bitrate } : {}),
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

/**
 * Reads Pinterest's `video_list` object map, where each key is a quality label
 * and each value carries its own url and dimensions.
 */
function readVideoList(html: string): RawVariant[] {
  const variants: RawVariant[] = [];
  if (!html) return variants;

  // Scan a bounded window after each "video_list" marker and read the flat
  // per-quality objects inside it. A lazy whole-object regex would stop at the
  // first nested "}}" and miss every rendition but the first.
  let marker = html.indexOf('"video_list"');
  while (marker !== -1) {
    const window = html.slice(marker, marker + 6000);

    for (const entry of window.matchAll(/"([A-Za-z0-9_]{2,24})"\s*:\s*\{([^{}]*)\}/g)) {
      const body = entry[2] ?? "";
      const url = body.match(/"url"\s*:\s*"([^"]+)"/)?.[1];
      if (!url) continue;

      const width = Number(body.match(/"width"\s*:\s*(\d+)/)?.[1] ?? "");
      const height = Number(body.match(/"height"\s*:\s*(\d+)/)?.[1] ?? "");
      const normalized = url.replace(/\\\//g, "/");
      const resolved = resolutionFromUrl(normalized);

      variants.push({
        url: normalized,
        contentType: null,
        width: Number.isFinite(width) && width > 0 ? width : (resolved?.width ?? null),
        height: Number.isFinite(height) && height > 0 ? height : (resolved?.height ?? null),
      });
    }

    marker = html.indexOf('"video_list"', marker + 12);
  }

  return variants;
}

export { qualityLabel };
