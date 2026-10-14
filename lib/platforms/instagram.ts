import { debugLog } from "@/lib/debug";
import { MediaFlowError } from "@/lib/errors";
import {
  describeImageQuality,
  fetchPublicPage,
  isDownloadableMediaUrl,
  decodeEmbeddedUrl,
  type PlatformResolver,
} from "./base";
import { resolveMediaCandidates } from "./candidates";
import { parsePublicMetadata, type PublicMetadata } from "./metadata";
import type { PostKind, Platform, ResolvedMedia, ResolvedResult } from "./types";
import { extractVideo, videoResolvers } from "./video";

const INSTAGRAM_PATH_RE = /^\/(reel|reels|p|tv)\/([A-Za-z0-9_-]{5,})/;

const INSTAGRAM_BOT_UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
const INSTAGRAM_FALLBACK_UA = "Twitterbot/1.0";

export interface ExtractedSlideItem {
  kind: "image" | "video";
  url: string;
  width?: number;
  height?: number;
  label: string;
}

export interface ExtractedInstagramPayload {
  postKind: PostKind;
  items: ExtractedSlideItem[];
}

/**
 * Instagram resolver.
 *
 * Supports:
 *   1. Full multi-image & multi-video carousels: extracts each slide at its
 *      exact, uncropped, original resolution from Instagram's embedded
 *      `xig_polaris_media` / `ScheduledServerJS` state.
 *   2. Single photo posts: extracts uncropped full-resolution image instead of
 *      relying solely on square-cropped OpenGraph thumbnails.
 *   3. Video / Reels: checks og:video, twitter:player:stream, JSON-LD, and
 *      video_versions in embedded JSON.
 */
export class InstagramResolver implements PlatformResolver {
  readonly platform: Platform = "instagram";

  canHandle(url: URL): boolean {
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host !== "instagram.com" && host !== "m.instagram.com") return false;
    return INSTAGRAM_PATH_RE.test(url.pathname);
  }

  async resolve(url: URL): Promise<ResolvedResult> {
    const match = url.pathname.match(INSTAGRAM_PATH_RE);
    if (!match) {
      throw new MediaFlowError(
        "INVALID_PLATFORM_URL",
        "This doesn't look like a valid Instagram post or reel link.",
      );
    }

    const [, rawType, shortcode] = match as unknown as [string, string, string];
    const isReelUrl = rawType === "reel" || rawType === "reels" || rawType === "tv";
    const kind = rawType === "tv" ? "IGTV" : isReelUrl ? "Reel" : "Post";

    const page = await this.readPublicPage(url, shortcode);
    if (!page) {
      throw new MediaFlowError(
        "PLATFORM_ACCESS_UNAVAILABLE",
        "Instagram did not provide accessible media information for this link.",
      );
    }

    const metadata = page.metadata;
    if (metadata.isEmptyShell) {
      throw new MediaFlowError(
        "PLATFORM_ACCESS_UNAVAILABLE",
        "Instagram did not provide accessible media information for this link.",
      );
    }

    const { title, creator } = readAuthorship(metadata);
    const posterUrl = isDownloadableMediaUrl(metadata.image) ? metadata.image : undefined;

    // ── Try standard video extraction ────────────────────────────────────────
    const video = await extractVideo(videoResolvers.instagram, {
      url,
      html: page.html,
      metadata,
    });

    let postKind: PostKind = isReelUrl ? "video" : "image";
    let media: ResolvedMedia[] = [];
    let report = video.report;

    if (video.items.length > 0) {
      postKind = "video";
      media = video.items;
    } else {
      // ── Extract embedded carousel / uncropped media from HTML payload ─────
      const extracted = extractInstagramMediaFromHtml(page.html);

      if (extracted && extracted.items.length > 1) {
        // Multi-item carousel: all slides preserved individually in exact format
        postKind = "carousel";
        const candidates = extracted.items.map((item, idx) => ({
          id: `ig-carousel-${idx + 1}`,
          url: item.url,
          kindHint: item.kind,
          source: "carousel_media",
          quality: item.label,
          ...(item.width ? { width: item.width } : {}),
          ...(item.height ? { height: item.height } : {}),
        }));

        const validated = await resolveMediaCandidates(candidates);
        media = validated.items;
        report = [...report, ...validated.report];
        debugLog("MEDIA", { carousel: true, platform: "instagram", slides: media.length });
      } else if (extracted && extracted.items.length === 1 && !isReelUrl) {
        // Single image / video post with uncropped original asset
        const single = extracted.items[0];
        const validated = await resolveMediaCandidates([
          {
            id: "ig-single",
            url: single.url,
            kindHint: single.kind,
            source: "embedded_state",
            quality: single.kind === "image" ? describeImageQuality(single.url) : "Original",
            ...(single.width ? { width: single.width } : {}),
            ...(single.height ? { height: single.height } : {}),
          },
        ]);
        if (validated.items.length > 0) {
          media = validated.items;
          report = [...report, ...validated.report];
          postKind = single.kind === "video" ? "video" : "image";
        }
      }

      // Fall back to single og:image if embedded extraction yielded nothing
      if (media.length === 0 && posterUrl && postKind === "image") {
        const validated = await resolveMediaCandidates([
          {
            id: "ig-image",
            url: posterUrl,
            kindHint: "image",
            source: "og:image",
            quality: describeImageQuality(posterUrl),
            ...(metadata.imageWidth ? { width: metadata.imageWidth } : {}),
            ...(metadata.imageHeight ? { height: metadata.imageHeight } : {}),
          },
        ]);
        media = validated.items.filter((item) => item.kind === "image");
        report = [...report, ...validated.report];
      }
    }

    if (media.length === 0 && !posterUrl) {
      throw new MediaFlowError(
        "PLATFORM_ACCESS_UNAVAILABLE",
        "Instagram did not provide accessible media information for this link.",
      );
    }

    const unavailable =
      media.length === 0
        ? postKind === "video"
          ? {
              code: "VIDEO_MEDIA_UNAVAILABLE" as const,
              message:
                "Instagram does not publish a video file for this reel to anyone who is not signed in, so it cannot be downloaded.",
            }
          : {
              code: "IMAGE_MEDIA_UNAVAILABLE" as const,
              message: "Instagram did not publish a downloadable image for this post.",
            }
        : undefined;

    const best = media[0];

    debugLog("RESULT", {
      platform: "instagram",
      postKind,
      items: media.length,
      unavailable: unavailable?.code ?? "none",
    });

    return {
      platform: "instagram",
      postKind,
      ...(title ? { title } : {}),
      ...(creator ? { creator } : {}),
      ...(posterUrl ? { thumbnail: posterUrl } : {}),
      ...(metadata.duration ?? best?.duration ? { duration: metadata.duration ?? best?.duration } : {}),
      ...(best?.width ?? metadata.videoWidth ?? metadata.imageWidth
        ? { width: best?.width ?? metadata.videoWidth ?? metadata.imageWidth }
        : {}),
      ...(best?.height ?? metadata.videoHeight ?? metadata.imageHeight
        ? { height: best?.height ?? metadata.videoHeight ?? metadata.imageHeight }
        : {}),
      kind,
      sourceUrl: url.toString(),
      media,
      ...(unavailable ? { unavailable } : {}),
      diagnostics: {
        videoResolver: video.resolverName,
        candidateCount: report.length,
        candidates: report,
      },
    };
  }

  /**
   * Reads the canonical post page with social bot headers so Instagram returns
   * the full SSR payload rather than the blank login wall shell.
   */
  private async readPublicPage(
    url: URL,
    shortcode: string,
  ): Promise<{ html: string; metadata: PublicMetadata } | null> {
    // 1. Fetch with Facebook bot user agent (official Meta preview crawler)
    let page = await fetchPublicPage(url, {
      label: "instagram:post",
      headers: {
        "User-Agent": INSTAGRAM_BOT_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (page.status === 404 || page.status === 410) {
      throw new MediaFlowError(
        "MEDIA_NOT_FOUND",
        "We couldn't find the requested media. It may have been removed.",
      );
    }

    // 2. If blocked or empty, try with Twitterbot
    if (!page.html || page.status === 429 || page.status === 403) {
      page = await fetchPublicPage(url, {
        label: "instagram:post:fallback",
        headers: {
          "User-Agent": INSTAGRAM_FALLBACK_UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
    }

    if (page.html) {
      const metadata = parsePublicMetadata(page.html);
      debugLog("PARSE", { label: "instagram:post", sources: metadata.sources });
      // If we found usable metadata or scripts, return it
      if (!metadata.isEmptyShell || page.html.includes("xig_polaris_media")) {
        return { html: page.html, metadata };
      }
    }

    // 3. Fallback to public embed endpoint
    const embed = await fetchPublicPage(
      `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/embed/captioned/`,
      {
        label: "instagram:embed",
        headers: {
          "User-Agent": INSTAGRAM_BOT_UA,
        },
      },
    );
    if (!embed.html) return null;

    const metadata = parsePublicMetadata(embed.html);
    debugLog("PARSE", { label: "instagram:embed", sources: metadata.sources });
    return { html: embed.html, metadata };
  }
}

/**
 * Extracts all media items (images and videos) from Instagram's embedded state.
 *
 * Prioritizes:
 *   1. Modern `xig_polaris_media` inside `ScheduledServerJS` scripts
 *   2. Legacy `edge_sidecar_to_children` GraphQL shapes
 *   3. Legacy `carousel_media` JSON arrays
 *   4. Clean uncropped candidate URLs over square cropped (`stp=c...`) versions
 */
export function extractInstagramMediaFromHtml(html: string): ExtractedInstagramPayload | null {
  if (!html) return null;

  const items: ExtractedSlideItem[] = [];

  // Helper to recursively find xig_polaris_media in complex script payloads
  function findPolarisMedia(obj: unknown): Record<string, any> | null {
    if (!obj || typeof obj !== "object") return null;
    const record = obj as Record<string, any>;
    if (record.xig_polaris_media) return record.xig_polaris_media;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = findPolarisMedia(item);
        if (found) return found;
      }
    } else {
      for (const val of Object.values(record)) {
        const found = findPolarisMedia(val);
        if (found) return found;
      }
    }
    return null;
  }

  // 1. Scan ScheduledServerJS script blocks for xig_polaris_media
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;

  while ((m = scriptRegex.exec(html)) !== null) {
    const scriptContent = m[1];
    if (
      !scriptContent.includes("xig_polaris_media") &&
      !scriptContent.includes("PolarisLoggedOutDesktopWWWCarouselMedia") &&
      !scriptContent.includes("carousel_media")
    ) {
      continue;
    }

    try {
      const parsed = JSON.parse(scriptContent);
      const polaris = findPolarisMedia(parsed);
      const media = polaris?.if_not_gated_logged_out;
      if (!media) continue;

      if (Array.isArray(media.carousel_media) && media.carousel_media.length > 0) {
        media.carousel_media.forEach((slide: any, idx: number) => {
          if (slide.is_video && Array.isArray(slide.video_versions) && slide.video_versions.length > 0) {
            const bestVideo = slide.video_versions[0];
            if (bestVideo?.url) {
              items.push({
                kind: "video",
                url: decodeEmbeddedUrl(bestVideo.url),
                width: bestVideo.width,
                height: bestVideo.height,
                label: `Video ${idx + 1}`,
              });
            }
          } else {
            const bestUrl = pickBestImageCandidate(slide.image_versions2?.candidates);
            if (bestUrl) {
              const bestCand = slide.image_versions2?.candidates?.[0];
              items.push({
                kind: "image",
                url: decodeEmbeddedUrl(bestUrl),
                width: bestCand?.width,
                height: bestCand?.height,
                label: `Image ${idx + 1}`,
              });
            }
          }
        });

        if (items.length > 0) {
          return { postKind: "carousel", items };
        }
      } else if (media.image_versions2?.candidates) {
        // Single post with uncropped asset
        const bestUrl = pickBestImageCandidate(media.image_versions2.candidates);
        if (bestUrl) {
          const bestCand = media.image_versions2.candidates[0];
          items.push({
            kind: "image",
            url: decodeEmbeddedUrl(bestUrl),
            width: bestCand?.width,
            height: bestCand?.height,
            label: "Image",
          });
          return { postKind: "image", items };
        }
      }
    } catch {
      // not JSON, continue
    }
  }

  // 2. Legacy GraphQL edge_sidecar_to_children fallback
  const sidecarMatch = html.match(/"edge_sidecar_to_children"\s*:\s*\{.*?"edges"\s*:\s*(\[.*?\])\s*\}/s);
  if (sidecarMatch?.[1]) {
    let slideIdx = 1;
    for (const match of sidecarMatch[1].matchAll(/"display_url"\s*:\s*"([^"]+)"/g)) {
      if (match[1]) {
        items.push({
          kind: "image",
          url: decodeEmbeddedUrl(match[1]),
          label: `Image ${slideIdx++}`,
        });
      }
    }
    if (items.length > 0) {
      return { postKind: "carousel", items };
    }
  }

  // 3. Legacy carousel_media regex fallback
  const carouselMatch = html.match(/"carousel_media"\s*:\s*(\[.*?\])\s*(?:,|\})/s);
  if (carouselMatch?.[1]) {
    let slideIdx = 1;
    for (const match of carouselMatch[1].matchAll(/"url"\s*:\s*"([^"]+)"/g)) {
      const url = decodeEmbeddedUrl(match[1]);
      if (isDownloadableMediaUrl(url) && !items.some((it) => it.url === url)) {
        items.push({
          kind: "image",
          url,
          label: `Image ${slideIdx++}`,
        });
      }
    }
    if (items.length > 1) {
      return { postKind: "carousel", items };
    }
  }

  return items.length > 0 ? { postKind: items.length > 1 ? "carousel" : "image", items } : null;
}

/**
 * Selects the best uncropped image candidate from Instagram's image_versions2 list.
 * Instagram supplies multiple resolutions. Candidates without `stp=c...` or with
 * the highest native resolution are prioritized over square-cropped thumbnails.
 */
function pickBestImageCandidate(candidates: Array<{ url?: string; width?: number; height?: number }> | undefined): string | null {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  // 1. Look for uncropped candidate (does not have ?stp=c... crop transform)
  const uncropped = candidates.find((c) => {
    if (!c?.url) return false;
    return !/[?&]stp=c\d+/i.test(c.url) && !c.url.includes(".1080a_");
  });
  if (uncropped?.url) return uncropped.url;

  // 2. Candidate 0 is usually highest resolution
  return candidates[0]?.url || null;
}

/**
 * Extracts Instagram author and title from OpenGraph & Twitter tags.
 */
function readAuthorship(metadata: PublicMetadata): { title?: string; creator?: string } {
  const ogTitle = metadata.title;
  const description = metadata.description;

  const handle =
    metadata.tags["twitter:title"]?.match(/\(@([A-Za-z0-9._]{1,30})\)/)?.[1] ??
    description?.match(/-\s*([A-Za-z0-9._]{1,30})\s+on\s/)?.[1];

  const displayName = ogTitle?.match(/^(.+?)\s+on Instagram:/)?.[1]?.trim();

  const caption =
    ogTitle?.match(/on Instagram:\s*"?([\s\S]*?)"?\s*$/)?.[1] ??
    description?.match(/:\s*"?([\s\S]*?)"?\s*$/)?.[1];

  const title = clip(caption) ?? clip(displayName) ?? clip(ogTitle);
  const creator = handle ? `@${handle}` : displayName;

  return {
    ...(title ? { title } : {}),
    ...(creator ? { creator } : {}),
  };
}

function clip(value: string | undefined): string | undefined {
  const text = value
    ?.replace(/\s+/g, " ")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .trim();
  if (!text) return undefined;
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}
