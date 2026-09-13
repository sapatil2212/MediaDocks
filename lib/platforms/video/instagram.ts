import type { MediaCandidate } from "@/lib/media/candidates";
import { debugLog } from "@/lib/debug";
import { isDownloadableMediaUrl } from "../base";
import { extractEmbeddedVideoUrls, looksLikeVideoPayload } from "./embedded-json";
import type { VideoResolver, VideoResolverInput } from "./types";

/**
 * Instagram public video extraction.
 *
 * Tries every legitimately public source, in order, before concluding that no
 * video is available:
 *
 *   1. og:video / og:video:secure_url
 *   2. twitter:player:stream
 *   3. JSON-LD contentUrl
 *   4. embedded JSON state: video_url, video_versions[].url / url_list,
 *      playback_url, clips_metadata, carousel_media
 *   5. a raw .mp4 scan over the whole public response
 *
 * Measured reality (September 2026): logged-out responses contain none of these.
 * The post page, /embed/ and /embed/captioned/ return OpenGraph image tags only;
 * `?__a=1&__d=dis` answers 404; `api/v1/media/<id>/info/` answers with a login
 * wall. Those remaining paths require credentials, so they are deliberately not
 * used. This extractor therefore usually yields zero candidates — but it will
 * pick a video up automatically if Instagram publishes one again, with no code
 * change.
 */
export class InstagramVideoResolver implements VideoResolver {
  readonly name = "InstagramVideoResolver";

  canResolve(input: VideoResolverInput): boolean {
    const host = input.url.hostname.toLowerCase().replace(/^www\./, "");
    return host === "instagram.com" || host === "m.instagram.com";
  }

  async resolve(input: VideoResolverInput): Promise<MediaCandidate[]> {
    const candidates: MediaCandidate[] = [];
    const seen = new Set<string>();
    const metadata = input.metadata;

    const add = (url: string | undefined, source: string, declaredMimeType?: string) => {
      if (!url || seen.has(url)) return;
      if (!isDownloadableMediaUrl(url)) return;
      seen.add(url);
      candidates.push({
        id: `ig-video-${candidates.length + 1}`,
        url,
        kindHint: "video",
        source,
        ...(declaredMimeType ? { declaredMimeType } : {}),
        ...(metadata?.image && isDownloadableMediaUrl(metadata.image)
          ? { posterUrl: metadata.image }
          : {}),
        ...(metadata?.videoWidth ? { width: metadata.videoWidth } : {}),
        ...(metadata?.videoHeight ? { height: metadata.videoHeight } : {}),
        ...(metadata?.duration ? { duration: metadata.duration } : {}),
      });
    };

    // 1-3. Published metadata tags.
    add(metadata?.video, "og:video", metadata?.videoType ?? undefined);
    add(metadata?.tags["twitter:player:stream"], "twitter:player:stream");

    // 4-5. Embedded JSON state and a final raw scan.
    for (const found of extractEmbeddedVideoUrls(input.html ?? "")) {
      add(found.url, found.source);
    }

    debugLog("MEDIA", {
      resolver: this.name,
      candidates: candidates.length,
      payloadLooksVideo: looksLikeVideoPayload(input.html ?? ""),
      sources: candidates.map((candidate) => candidate.source),
    });

    return candidates;
  }
}
