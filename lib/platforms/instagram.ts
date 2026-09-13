import { debugLog } from "@/lib/debug";
import { MediaFlowError } from "@/lib/errors";
import {
  describeImageQuality,
  fetchPublicPage,
  isDownloadableMediaUrl,
  type PlatformResolver,
} from "./base";
import { resolveMediaCandidates } from "./candidates";
import { parsePublicMetadata, type PublicMetadata } from "./metadata";
import type { PostKind, Platform, ResolvedMedia, ResolvedResult } from "./types";
import { extractVideo, videoResolvers } from "./video";

const INSTAGRAM_PATH_RE = /^\/(reel|reels|p|tv)\/([A-Za-z0-9_-]{5,})/;

/**
 * Instagram resolver.
 *
 * Video posts go through InstagramVideoResolver, which checks og:video,
 * twitter:player:stream, JSON-LD contentUrl and the embedded JSON state
 * (video_url, video_versions[].url / url_list, playback_url, clips_metadata,
 * carousel_media) plus a raw .mp4 scan before giving up.
 *
 * Measured reality (September 2026): logged-out responses expose none of those.
 * `?__a=1&__d=dis` returns 404 and `api/v1/media/<id>/info/` returns a login
 * wall, so those require credentials and are deliberately not used. A reel
 * therefore resolves with the cover image as a *poster* and
 * `unavailable: VIDEO_MEDIA_UNAVAILABLE` — the cover is never offered as the
 * download. If Instagram publishes a video URL again the extractor picks it up
 * with no code change.
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

    // ── Try every legitimate public video source ─────────────────────────────
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
    } else if (postKind === "image" && posterUrl) {
      // On an image post the published image *is* the requested media.
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
   * Reads the canonical post page, falling back to the public embed surface when
   * that page is unusable.
   */
  private async readPublicPage(
    url: URL,
    shortcode: string,
  ): Promise<{ html: string; metadata: PublicMetadata } | null> {
    const page = await fetchPublicPage(url, { label: "instagram:post" });

    if (page.status === 404 || page.status === 410) {
      throw new MediaFlowError(
        "MEDIA_NOT_FOUND",
        "We couldn't find the requested media. It may have been removed.",
      );
    }

    if (page.html) {
      const metadata = parsePublicMetadata(page.html);
      debugLog("PARSE", { label: "instagram:post", sources: metadata.sources });
      return { html: page.html, metadata };
    }

    const embed = await fetchPublicPage(
      `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/embed/captioned/`,
      { label: "instagram:embed" },
    );
    if (!embed.html) return null;

    const metadata = parsePublicMetadata(embed.html);
    debugLog("PARSE", { label: "instagram:embed", sources: metadata.sources });
    return { html: embed.html, metadata };
  }
}

/**
 * Instagram's own parsing strategy. The published tags carry the account and the
 * caption in a fixed shape:
 *   og:title       "<Display Name> on Instagram: \"<caption>\""
 *   og:description "<n> likes, <m> comments - <handle> on <date>: \"<caption>\""
 *   twitter:title  "<Display Name> (@<handle>) • Instagram reel"
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
