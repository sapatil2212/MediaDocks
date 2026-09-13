import { debugLog } from "@/lib/debug";
import { MediaFlowError } from "@/lib/errors";
import { fetchPublicJson, fetchPublicPage, type PlatformResolver } from "./base";
import { parsePublicMetadata } from "./metadata";
import type { Platform, ResolvedResult } from "./types";

const YOUTUBE_HOSTS = new Set(["youtube.com", "m.youtube.com", "youtube-nocookie.com", "youtu.be"]);

interface OEmbedResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

/**
 * YouTube resolver — metadata only, deliberately isolated from the others.
 *
 * The thumbnail on i.ytimg.com is an image, not the video, and it is therefore
 * exposed as `thumbnail` (preview) and never as a media item. The only video URL
 * YouTube publishes is its embed player; obtaining the real streams would mean
 * working around YouTube's access controls, so this resolver returns no media and
 * reports VIDEO_MEDIA_UNAVAILABLE.
 */
export class YouTubeResolver implements PlatformResolver {
  readonly platform: Platform = "youtube";

  canHandle(url: URL): boolean {
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!YOUTUBE_HOSTS.has(host)) return false;
    return this.extractVideoId(url) !== null;
  }

  private extractVideoId(url: URL): string | null {
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const idPattern = /^[A-Za-z0-9_-]{11}$/;

    if (host === "youtu.be") {
      const candidate = url.pathname.replace(/^\/+/, "").split("/")[0] ?? "";
      return idPattern.test(candidate) ? candidate : null;
    }

    const param = url.searchParams.get("v");
    if (param && idPattern.test(param)) return param;

    const fromPath = url.pathname.match(/\/(?:shorts|embed|v|live)\/([A-Za-z0-9_-]{11})/);
    return fromPath?.[1] ?? null;
  }

  async resolve(url: URL): Promise<ResolvedResult> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new MediaFlowError(
        "INVALID_PLATFORM_URL",
        "This doesn't look like a valid YouTube video link.",
      );
    }

    const isShorts = url.pathname.toLowerCase().startsWith("/shorts/");
    const kind = isShorts ? "Shorts" : "Video";

    const { status, data } = await fetchPublicJson<OEmbedResponse>(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`,
      )}&format=json`,
      { label: "youtube:oembed" },
    );

    if (status === 400 || status === 401 || status === 403 || status === 404) {
      throw new MediaFlowError(
        "MEDIA_NOT_AVAILABLE",
        "This video is private, age-restricted, or no longer available.",
      );
    }

    if (!data?.title) {
      throw new MediaFlowError("PLATFORM_ACCESS_UNAVAILABLE", "This content could not be accessed.");
    }

    const duration = await this.readPublishedDuration(videoId);

    debugLog("RESULT", { platform: "youtube", postKind: "video", items: 0, downloadable: false });

    return {
      platform: "youtube",
      postKind: "video",
      title: data.title,
      ...(data.author_name ? { creator: data.author_name } : {}),
      // Preview only. This is an image and is never treated as the video.
      ...(data.thumbnail_url ? { thumbnail: data.thumbnail_url } : {}),
      ...(duration ? { duration } : {}),
      kind,
      sourceUrl: url.toString(),
      media: [],
      unavailable: {
        code: "VIDEO_MEDIA_UNAVAILABLE",
        message: "The video media stream could not be obtained: YouTube publishes no downloadable file.",
      },
    };
  }

  /** Duration from the watch page's published microdata. Best effort. */
  private async readPublishedDuration(videoId: string): Promise<number | undefined> {
    try {
      const page = await fetchPublicPage(`https://www.youtube.com/watch?v=${videoId}`, {
        label: "youtube:watch",
      });
      if (!page.html) return undefined;
      return parsePublicMetadata(page.html).duration;
    } catch {
      return undefined;
    }
  }
}
