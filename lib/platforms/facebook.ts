import { debugLog } from "@/lib/debug";
import { MediaFlowError } from "@/lib/errors";
import {
  describeImageQuality,
  fetchPublicPage,
  isDownloadableMediaUrl,
  type PlatformResolver,
} from "./base";
import { resolveMediaCandidates } from "./candidates";
import { parsePublicMetadata } from "./metadata";
import type { PostKind, Platform, ResolvedMedia, ResolvedResult } from "./types";
import { extractVideo, videoResolvers } from "./video";

const FACEBOOK_HOSTS = new Set(["facebook.com", "m.facebook.com", "web.facebook.com"]);

/**
 * Facebook resolver.
 *
 * Video posts go through FacebookVideoResolver, which checks og:video,
 * twitter:player:stream and the playable-media fields Facebook uses in its
 * embedded state before giving up.
 *
 * Measured reality: a logged-out public video page publishes og:title and
 * og:description but no og:image and no og:video, and no playable field appears.
 * So a video link resolves to details with VIDEO_MEDIA_UNAVAILABLE. A photo page
 * that does publish og:image resolves to a real image item.
 */
export class FacebookResolver implements PlatformResolver {
  readonly platform: Platform = "facebook";

  canHandle(url: URL): boolean {
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "fb.watch") return url.pathname.length > 1;
    if (!FACEBOOK_HOSTS.has(host)) return false;

    const path = url.pathname.toLowerCase();
    return (
      path.startsWith("/watch") ||
      path.startsWith("/reel/") ||
      path.includes("/videos/") ||
      path.includes("/photo") ||
      path.startsWith("/share/") ||
      url.searchParams.has("v")
    );
  }

  async resolve(url: URL): Promise<ResolvedResult> {
    const page = await fetchPublicPage(url, { label: "facebook:page" });

    if (page.status === 404 || page.status === 410) {
      throw new MediaFlowError("MEDIA_NOT_FOUND", "We couldn't find the requested media.");
    }
    if (page.status === 400) {
      throw new MediaFlowError("MEDIA_NOT_AVAILABLE", "This Facebook link is no longer available.");
    }
    if (!page.html) {
      throw new MediaFlowError("PLATFORM_ACCESS_UNAVAILABLE", "This content could not be accessed.");
    }

    const metadata = parsePublicMetadata(page.html);
    debugLog("PARSE", { label: "facebook:page", sources: metadata.sources });

    if (metadata.isEmptyShell) {
      throw new MediaFlowError(
        "PLATFORM_ACCESS_UNAVAILABLE",
        "Facebook did not provide accessible media information for this link.",
      );
    }

    const imageUrl = isDownloadableMediaUrl(metadata.image) ? metadata.image : undefined;

    const path = page.url.pathname.toLowerCase();
    const isReel = path.startsWith("/reel/");
    const looksLikeVideo =
      isReel ||
      path.startsWith("/watch") ||
      path.includes("/videos/") ||
      /video/i.test(metadata.ogType ?? "") ||
      page.url.searchParams.has("v");

    const video = await extractVideo(videoResolvers.facebook, {
      url: page.url,
      html: page.html,
      metadata,
    });

    let postKind: PostKind = looksLikeVideo ? "video" : "image";
    let media: ResolvedMedia[] = [];
    let report = video.report;

    if (video.items.length > 0) {
      postKind = "video";
      media = video.items;
    } else if (postKind === "image" && imageUrl) {
      const validated = await resolveMediaCandidates([
        {
          id: "fb-image",
          url: imageUrl,
          kindHint: "image",
          source: "og:image",
          quality: describeImageQuality(imageUrl),
          ...(metadata.imageWidth ? { width: metadata.imageWidth } : {}),
          ...(metadata.imageHeight ? { height: metadata.imageHeight } : {}),
        },
      ]);
      media = validated.items.filter((item) => item.kind === "image");
      report = [...report, ...validated.report];
    }

    const unavailable =
      media.length === 0
        ? postKind === "video"
          ? {
              code: "VIDEO_MEDIA_UNAVAILABLE" as const,
              message:
                "Facebook does not publish a video file for this post to anyone who is not signed in, so it cannot be downloaded.",
            }
          : {
              code: "IMAGE_MEDIA_UNAVAILABLE" as const,
              message: "Facebook did not publish a downloadable image for this post.",
            }
        : undefined;

    const best = media[0];

    debugLog("RESULT", {
      platform: "facebook",
      postKind,
      items: media.length,
      unavailable: unavailable?.code ?? "none",
    });

    return {
      platform: "facebook",
      postKind,
      ...(metadata.title ? { title: metadata.title } : {}),
      ...(metadata.creator ? { creator: metadata.creator } : {}),
      ...(imageUrl ? { thumbnail: imageUrl } : {}),
      ...(metadata.duration ?? best?.duration
        ? { duration: metadata.duration ?? best?.duration }
        : {}),
      ...(best?.width ?? metadata.videoWidth ?? metadata.imageWidth
        ? { width: best?.width ?? metadata.videoWidth ?? metadata.imageWidth }
        : {}),
      ...(best?.height ?? metadata.videoHeight ?? metadata.imageHeight
        ? { height: best?.height ?? metadata.videoHeight ?? metadata.imageHeight }
        : {}),
      kind: isReel ? "Reel" : postKind === "video" ? "Video" : "Photo",
      sourceUrl: page.url.toString(),
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
