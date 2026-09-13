import { debugLog } from "@/lib/debug";
import { MediaFlowError } from "@/lib/errors";
import { fetchPublicJson, fetchPublicPage, isDownloadableMediaUrl, type PlatformResolver } from "./base";
import { resolveMediaCandidates, type MediaCandidate } from "./candidates";
import { parsePublicMetadata } from "./metadata";
import type { PostKind, Platform, ResolvedMedia, ResolvedResult } from "./types";
import { extractVideo, videoResolvers } from "./video";
import type { XPayload } from "./video/x";

const X_HOSTS = new Set(["x.com", "twitter.com", "mobile.twitter.com"]);
const STATUS_RE = /^\/([A-Za-z0-9_]{1,20})\/status(?:es)?\/(\d{5,25})/;

interface SyndicationResponse extends XPayload {
  __typename?: string;
  tombstone?: { text?: { text?: string } };
  text?: string;
  user?: { name?: string; screen_name?: string };
  photos?: Array<{ url?: string; width?: number; height?: number }>;
}

interface OEmbedResponse {
  author_name?: string;
}

/**
 * X resolver.
 *
 * Video posts resolve to real MP4 renditions from video.twimg.com via
 * TwitterVideoResolver, best quality first, with the poster kept separate.
 * Photo posts resolve to their pbs.twimg.com images. Every URL is classified by
 * the central candidate validator.
 */
export class XResolver implements PlatformResolver {
  readonly platform: Platform = "x";

  canHandle(url: URL): boolean {
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!X_HOSTS.has(host)) return false;
    return STATUS_RE.test(url.pathname);
  }

  async resolve(url: URL): Promise<ResolvedResult> {
    const match = url.pathname.match(STATUS_RE);
    if (!match) {
      throw new MediaFlowError("INVALID_PLATFORM_URL", "This doesn't look like a valid X post link.");
    }

    const postId = match[2] as string;

    const { status, data } = await fetchPublicJson<SyndicationResponse>(
      `https://cdn.syndication.twimg.com/tweet-result?id=${encodeURIComponent(postId)}&token=x`,
      { label: "x:syndication" },
    );

    if (status === 404 || status === 410) {
      throw new MediaFlowError("MEDIA_NOT_FOUND", "We couldn't find the requested media.");
    }
    if (data?.tombstone) {
      throw new MediaFlowError(
        "MEDIA_NOT_AVAILABLE",
        "This post is no longer available, or it isn't public.",
      );
    }
    if (!data) {
      throw new MediaFlowError("PLATFORM_ACCESS_UNAVAILABLE", "This content could not be accessed.");
    }

    // ── Video first ─────────────────────────────────────────────────────────
    const video = await extractVideo(videoResolvers.x, { url, payload: data });

    let postKind: PostKind = "image";
    let media: ResolvedMedia[] = [];
    let thumbnail: string | undefined;
    let width: number | undefined;
    let height: number | undefined;
    let duration: number | undefined;
    let report = video.report;

    if (video.items.length > 0) {
      postKind = "video";
      media = video.items;
      const best = video.items[0];
      thumbnail = best?.posterUrl;
      width = best?.width;
      height = best?.height;
      duration = best?.duration;
    } else {
      // ── Photos ────────────────────────────────────────────────────────────
      const photoDetails = (data.mediaDetails ?? []).filter((detail) => detail.type === "photo");
      const candidates: MediaCandidate[] = photoDetails.flatMap((detail, index) =>
        detail.media_url_https
          ? [
              {
                id: `x-image-${index + 1}`,
                url: detail.media_url_https,
                kindHint: "image" as const,
                source: "syndication:mediaDetails",
                quality: photoDetails.length > 1 ? `Image ${index + 1}` : "Original",
                ...(detail.original_info?.width ? { width: detail.original_info.width } : {}),
                ...(detail.original_info?.height ? { height: detail.original_info.height } : {}),
              },
            ]
          : [],
      );

      // Legacy `photos` shape.
      if (candidates.length === 0 && data.photos) {
        data.photos.forEach((photo, index) => {
          if (!photo.url) return;
          candidates.push({
            id: `x-image-${index + 1}`,
            url: photo.url,
            kindHint: "image",
            source: "syndication:photos",
            quality: (data.photos?.length ?? 0) > 1 ? `Image ${index + 1}` : "Original",
            ...(photo.width ? { width: photo.width } : {}),
            ...(photo.height ? { height: photo.height } : {}),
          });
        });
      }

      const validated = await resolveMediaCandidates(candidates);
      media = validated.items.filter((item) => item.kind === "image");
      report = [...report, ...validated.report];
      postKind = media.length > 1 ? "carousel" : "image";

      const first = media[0];
      thumbnail = first?.mediaUrl;
      width = first?.width;
      height = first?.height;
    }

    let creator = data.user?.screen_name ? `@${data.user.screen_name}` : undefined;
    let title = buildTitle(data.text);

    // Public status page metadata as a last resort for title/poster.
    if (media.length === 0 && (!title || !thumbnail)) {
      const page = await fetchPublicPage(url, { label: "x:status-page" });
      if (page.status === 404) {
        throw new MediaFlowError("MEDIA_NOT_FOUND", "We couldn't find the requested media.");
      }
      if (page.html) {
        const metadata = parsePublicMetadata(page.html);
        title ??= metadata.title;
        creator ??= metadata.creator;
        if (!thumbnail && isDownloadableMediaUrl(metadata.image)) {
          thumbnail = metadata.image;
          width ??= metadata.imageWidth;
          height ??= metadata.imageHeight;
        }
      }
    }

    if (!creator) {
      const oembed = await fetchPublicJson<OEmbedResponse>(
        `https://publish.twitter.com/oembed?url=${encodeURIComponent(url.toString())}`,
        { label: "x:oembed" },
      );
      if (oembed.data?.author_name) creator = oembed.data.author_name;
    }

    if (media.length === 0 && !title && !thumbnail) {
      throw new MediaFlowError(
        "MEDIA_NOT_AVAILABLE",
        "This post is no longer available, or it isn't public.",
      );
    }

    const hasVideoIntent =
      postKind === "video" ||
      (data.mediaDetails ?? []).some((d) => d.type === "video" || d.type === "animated_gif");

    const unavailable =
      media.length === 0
        ? hasVideoIntent
          ? {
              code: "VIDEO_MEDIA_UNAVAILABLE" as const,
              message: "No downloadable video rendition is published for this post.",
            }
          : {
              code: "IMAGE_MEDIA_UNAVAILABLE" as const,
              message: "This post does not publish a downloadable media file.",
            }
        : undefined;

    debugLog("RESULT", { platform: "x", postKind, items: media.length });

    return {
      platform: "x",
      postKind,
      ...(title ? { title } : {}),
      ...(creator ? { creator } : {}),
      ...(thumbnail ? { thumbnail } : {}),
      ...(duration ? { duration } : {}),
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
      kind: postKind === "video" ? "Post video" : "Post image",
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
}

function buildTitle(text: string | undefined): string | undefined {
  const cleaned = text?.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned) return undefined;
  return cleaned.length > 120 ? `${cleaned.slice(0, 117)}...` : cleaned;
}
