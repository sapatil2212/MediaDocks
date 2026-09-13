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

const PIN_PATH_RE = /^\/pin\/[A-Za-z0-9_-]+/;

/**
 * Pinterest resolver.
 *
 * Video Pins go through PinterestVideoResolver, which normalizes og:video, the
 * `video_list` object map, `videos`/`video`/`sources` arrays and JSON-LD into a
 * single candidate list. Image Pins resolve to their i.pinimg.com image. The Pin
 * image is only ever a poster for a video Pin.
 */
export class PinterestResolver implements PlatformResolver {
  readonly platform: Platform = "pinterest";

  canHandle(url: URL): boolean {
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "pin.it") return url.pathname.length > 1;
    return PIN_PATH_RE.test(url.pathname);
  }

  async resolve(url: URL): Promise<ResolvedResult> {
    const page = await fetchPublicPage(url, { label: "pinterest:pin" });

    if (page.status === 404 || page.status === 410) {
      throw new MediaFlowError("MEDIA_NOT_FOUND", "We couldn't find the requested media.");
    }
    if (!page.html) {
      throw new MediaFlowError("PLATFORM_ACCESS_UNAVAILABLE", "This content could not be accessed.");
    }

    const metadata = parsePublicMetadata(page.html);
    debugLog("PARSE", { label: "pinterest:pin", sources: metadata.sources });

    if (metadata.isEmptyShell) {
      throw new MediaFlowError("PLATFORM_ACCESS_UNAVAILABLE", "This content could not be accessed.");
    }

    const imageUrl = isDownloadableMediaUrl(metadata.image) ? metadata.image : undefined;

    const video = await extractVideo(videoResolvers.pinterest, {
      url: page.url,
      html: page.html,
      metadata,
    });

    let postKind: PostKind = "image";
    let media: ResolvedMedia[] = [];
    let report = video.report;

    if (video.items.length > 0) {
      postKind = "video";
      media = video.items;
    } else if (imageUrl) {
      const validated = await resolveMediaCandidates([
        {
          id: "pin-image",
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

    if (media.length === 0 && !imageUrl && !metadata.title) {
      throw new MediaFlowError("MEDIA_NOT_FOUND", "We couldn't find the requested media.");
    }

    const unavailable =
      media.length === 0
        ? {
            code:
              postKind === "video"
                ? ("VIDEO_MEDIA_UNAVAILABLE" as const)
                : ("IMAGE_MEDIA_UNAVAILABLE" as const),
            message: "Pinterest did not publish a downloadable file for this Pin.",
          }
        : undefined;

    const best = media[0];

    return {
      platform: "pinterest",
      postKind,
      ...(metadata.title ? { title: metadata.title } : {}),
      ...(metadata.creator ? { creator: metadata.creator } : {}),
      ...(imageUrl ? { thumbnail: imageUrl } : {}),
      ...(metadata.duration ?? best?.duration
        ? { duration: metadata.duration ?? best?.duration }
        : {}),
      ...(best?.width ?? metadata.imageWidth ? { width: best?.width ?? metadata.imageWidth } : {}),
      ...(best?.height ?? metadata.imageHeight
        ? { height: best?.height ?? metadata.imageHeight }
        : {}),
      kind: postKind === "video" ? "Video Pin" : "Pin",
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
