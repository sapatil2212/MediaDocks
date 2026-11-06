import { debugLog } from "@/lib/debug";
import { engineAvailable, ffmpegPath } from "@/lib/engine/binaries";
import { MediaFlowError } from "@/lib/errors";
import {
  describeImageQuality,
  fetchPublicJson,
  fetchPublicPage,
  isDownloadableMediaUrl,
  probeMediaContentType,
  type PageResult,
  type PlatformResolver,
} from "./base";
import { resolveMediaCandidates, type CandidateReport, type MediaCandidate } from "./candidates";
import { parsePublicMetadata } from "./metadata";
import {
  isVideoPin,
  parsePinterestPage,
  pickCarouselSlots,
  pickImageCandidates,
  pickStoryImagePages,
  pinCreator,
  pinRecordFromResource,
  pinTitle,
  type ImageCandidate,
  type PinDataSource,
  type PinRecord,
} from "./pinterest-data";
import {
  canonicalPinUrl,
  extractPinId,
  isPinterestHost,
  isPinterestShortHost,
} from "./pinterest-url";
import type { PostKind, Platform, ResolvedMedia, ResolvedResult } from "./types";
import { extractVideo, videoResolvers } from "./video";
import { selectPinterestHls } from "./video/pinterest";

const PIN_PATH_RE = /^\/pin\/[A-Za-z0-9_-]+/;

const PIN_NOT_FOUND = "This Pin was removed, is private, or doesn't exist.";
const SHORT_LINK_NOT_FOUND = "This pin.it link is invalid or has expired.";
const NOT_A_PIN =
  "This Pinterest link isn't a single Pin. Open the Pin and copy its link (pinterest.com/pin/… or pin.it/…).";

/** Public, unauthenticated Pin endpoint (the one yt-dlp's extractor uses). */
const PIN_RESOURCE_URL = "https://www.pinterest.com/resource/PinResource/get/";

export interface PinterestResolverOptions {
  /**
   * Whether yt-dlp + FFmpeg can turn an HLS manifest into an MP4. Injected so
   * tests do not spawn the engine.
   */
  hlsCapable?: () => Promise<boolean>;
}

async function defaultHlsCapable(): Promise<boolean> {
  return (await engineAvailable()) && Boolean(await ffmpegPath());
}

/**
 * Pinterest resolver (HTTP fallback when the engine has no result).
 *
 * Reads the Pin from every source Pinterest publishes, so one layout change
 * does not break extraction:
 *
 *   1. structured Pin records in the page (relay payloads, legacy state)
 *   2. the public PinResource API, only when the page had no record
 *   3. JSON-LD, then og:/twitter: tags
 *
 * Video Pins resolve to direct MP4 renditions, or to an HLS manifest that the
 * engine converts to MP4 when no MP4 is published. A video Pin never falls back
 * to its poster image. Image Pins resolve to the original-size file when
 * Pinterest serves it, and carousels to one image per slot.
 */
export class PinterestResolver implements PlatformResolver {
  readonly platform: Platform = "pinterest";
  private readonly hlsCapable: () => Promise<boolean>;

  constructor(options: PinterestResolverOptions = {}) {
    this.hlsCapable = options.hlsCapable ?? defaultHlsCapable;
  }

  canHandle(url: URL): boolean {
    if (isPinterestShortHost(url.hostname)) return url.pathname.length > 1;
    return isPinterestHost(url.hostname) && PIN_PATH_RE.test(url.pathname);
  }

  /**
   * Every Pin link becomes `https://www.pinterest.com/pin/<id>/`, dropping
   * country domains, `/sent/` and share parameters (invite_code, sender).
   */
  canonicalize(url: URL, context: { fromShortLink: boolean }): URL {
    if (isPinterestShortHost(url.hostname)) {
      // The shortener did not redirect anywhere.
      throw new MediaFlowError("MEDIA_NOT_FOUND", SHORT_LINK_NOT_FOUND);
    }

    const canonical = canonicalPinUrl(url);
    if (canonical) return canonical;

    // An unknown pin.it code redirects to the Pinterest home page.
    if (context.fromShortLink && (url.pathname === "/" || url.pathname === "")) {
      throw new MediaFlowError("MEDIA_NOT_FOUND", SHORT_LINK_NOT_FOUND);
    }
    throw new MediaFlowError("INVALID_PLATFORM_URL", NOT_A_PIN);
  }

  async resolve(url: URL): Promise<ResolvedResult> {
    const pinId = isPinterestHost(url.hostname) ? extractPinId(url.pathname) : undefined;
    if (!pinId) throw new MediaFlowError("INVALID_PLATFORM_URL", NOT_A_PIN);
    const sourceUrl = canonicalPinUrl(url) ?? url;

    const page = await this.fetchPinPage(sourceUrl);
    if (page.status === 404 || page.status === 410) {
      throw new MediaFlowError("MEDIA_NOT_FOUND", PIN_NOT_FOUND);
    }

    const metadata = parsePublicMetadata(page.html);
    const parsed = parsePinterestPage(page.html, pinId);
    debugLog("PARSE", {
      label: "pinterest:pin",
      sources: [...parsed.sources, ...metadata.sources],
      records: parsed.records.length,
      notFound: parsed.notFound,
    });

    // Checked before the empty-shell test: a removed Pin is a 200 empty shell.
    if (parsed.notFound) throw new MediaFlowError("MEDIA_NOT_FOUND", PIN_NOT_FOUND);

    let records: PinRecord[] = parsed.records;
    const sources: string[] = [...parsed.sources];

    if (records.length === 0) {
      const api = await this.fetchPinResource(pinId);
      if (api?.notFound) throw new MediaFlowError("MEDIA_NOT_FOUND", PIN_NOT_FOUND);
      if (api?.record) {
        records = [api.record];
        sources.push("api" satisfies PinDataSource);
      }
    }

    if (records.length === 0 && (!page.html || metadata.isEmptyShell)) {
      throw new MediaFlowError("PLATFORM_ACCESS_UNAVAILABLE", "This content could not be accessed.");
    }
    sources.push(...metadata.sources);

    const video = await extractVideo(videoResolvers.pinterest, {
      url: sourceUrl,
      html: page.html,
      metadata,
      payload: records,
    });

    const posterUrl = isDownloadableMediaUrl(metadata.image) ? metadata.image : undefined;
    let report: CandidateReport[] = video.report;
    let media: ResolvedMedia[] = video.items;
    let postKind: PostKind = media.length > 0 ? "video" : "image";

    // HLS only: hand the manifest to the engine, which merges it into an MP4.
    const hlsUrl =
      media.length === 0 ? selectPinterestHls(records, records.length ? undefined : page.html) : undefined;
    if (media.length === 0 && hlsUrl && (await this.hlsCapable())) {
      postKind = "video";
      media = [hlsItem(hlsUrl, posterUrl)];
      report = [
        ...report,
        {
          id: "pin-video-hls",
          source: "pinterest:hls",
          host: new URL(hlsUrl).hostname,
          kindHint: "video",
          resolvedKind: "video",
          resolvedMimeType: "video/mp4",
          extension: "mp4",
          accepted: true,
        },
      ];
    }

    const videoPin =
      postKind === "video" || Boolean(hlsUrl) || video.candidates.length > 0 || isVideoPin(records, metadata);

    let thumbnail = posterUrl;

    if (media.length === 0 && !videoPin) {
      const images = await this.resolveImages(records, metadata);
      media = images.media;
      postKind = images.postKind;
      report = [...report, ...images.report];
      thumbnail = media[0]?.mediaUrl ?? images.fallbackThumbnail ?? posterUrl;
    } else if (videoPin) {
      postKind = "video";
    }

    const title = pinTitle(records, metadata);
    if (media.length === 0 && !thumbnail && !title) {
      throw new MediaFlowError("MEDIA_NOT_FOUND", PIN_NOT_FOUND);
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
    const creator = pinCreator(records, metadata);
    const duration = best?.duration ?? metadata.duration;

    return {
      platform: "pinterest",
      postKind,
      ...(title ? { title } : {}),
      ...(creator ? { creator } : {}),
      ...(thumbnail ? { thumbnail } : {}),
      ...(duration ? { duration } : {}),
      ...(best?.width ? { width: best.width } : {}),
      ...(best?.height ? { height: best.height } : {}),
      kind: postKind === "video" ? "Video Pin" : "Pin",
      sourceUrl: sourceUrl.toString(),
      media,
      ...(unavailable ? { unavailable } : {}),
      diagnostics: {
        videoResolver: `${video.resolverName} [${[...new Set(sources)].join(",") || "none"}]`,
        candidateCount: report.length,
        candidates: report,
      },
    };
  }

  /** A blocked or failed page still lets the API fallback run. */
  private async fetchPinPage(url: URL): Promise<PageResult> {
    try {
      return await fetchPublicPage(url, { label: "pinterest:pin" });
    } catch (err) {
      if (err instanceof MediaFlowError && err.code === "PLATFORM_ACCESS_UNAVAILABLE") {
        return { status: 0, html: "", url, contentType: "", bytes: 0, truncated: false };
      }
      throw err;
    }
  }

  /**
   * PinResource fallback. Returns null when the API is unusable (blocked, rate
   * limited, network), so the caller can continue with what the page gave.
   */
  private async fetchPinResource(
    pinId: string,
  ): Promise<{ notFound: boolean; record?: PinRecord } | null> {
    const endpoint = new URL(PIN_RESOURCE_URL);
    endpoint.searchParams.set(
      "data",
      JSON.stringify({ options: { field_set_key: "unauth_react_main_pin", id: pinId } }),
    );

    try {
      const { status, data } = await fetchPublicJson<unknown>(endpoint, {
        label: "pinterest:api",
        headers: { "X-Pinterest-PWS-Handler": "www/[username].js" },
        readErrorBody: true,
      });
      debugLog("RESPONSE", { label: "pinterest:api", status, json: Boolean(data) });
      if (!data) return null;
      const parsed = pinRecordFromResource(data);
      if (parsed.notFound || parsed.record) return parsed;
      return status === 404 ? { notFound: true } : null;
    } catch (err) {
      if (err instanceof MediaFlowError && err.code !== "REQUEST_TIMEOUT") return null;
      throw err;
    }
  }

  private async resolveImages(
    records: PinRecord[],
    metadata: ReturnType<typeof parsePublicMetadata>,
  ): Promise<{
    media: ResolvedMedia[];
    postKind: PostKind;
    report: CandidateReport[];
    fallbackThumbnail?: string;
  }> {
    // Carousel and multi-page image Pins: one image per slot.
    const slots = pickCarouselSlots(records);
    const pages = slots.length >= 2 ? slots : pickStoryImagePages(records);
    if (pages.length >= 2) {
      const validated = await resolveMediaCandidates(
        pages.map((slot, index) => imageCandidate(slot, `pin-image-${index + 1}`, `Image ${index + 1}`)),
      );
      const media = validated.items.filter((item) => item.kind === "image");
      if (media.length >= 2) return { media, postKind: "carousel", report: validated.report };
    }

    const candidates = pickImageCandidates(records, metadata).filter((entry) =>
      isDownloadableMediaUrl(entry.url),
    );
    const chosen = await chooseImage(candidates);
    if (!chosen) return { media: [], postKind: "image", report: [] };

    const validated = await resolveMediaCandidates([
      imageCandidate(chosen, "pin-image", describeImageQuality(chosen.url)),
    ]);
    return {
      media: validated.items.filter((item) => item.kind === "image"),
      postKind: "image",
      report: validated.report,
      fallbackThumbnail: chosen.url,
    };
  }
}

/**
 * Takes the first candidate the CDN actually serves. Only original-size URLs
 * are probed: Pinterest's sized derivatives (736x, 1200x) always exist, but an
 * `/originals/` file is occasionally missing.
 */
async function chooseImage(candidates: ImageCandidate[]): Promise<ImageCandidate | undefined> {
  for (const candidate of candidates) {
    if (!candidate.url.includes("/originals/")) return candidate;
    const type = await probeMediaContentType(candidate.url);
    if (type && type.startsWith("image/")) return candidate;
    debugLog("MEDIA", { pinterest: "original not served", fallback: true });
  }
  return undefined;
}

function imageCandidate(image: ImageCandidate, id: string, quality: string): MediaCandidate {
  return {
    id,
    url: image.url,
    kindHint: "image",
    source: image.source,
    quality,
    ...(image.width ? { width: image.width } : {}),
    ...(image.height ? { height: image.height } : {}),
  };
}

function hlsItem(manifestUrl: string, posterUrl: string | undefined): ResolvedMedia {
  return {
    id: "pin-video-hls",
    kind: "video",
    mediaUrl: "",
    mimeType: "video/mp4",
    extension: "mp4",
    label: "MP4",
    quality: "Best quality",
    engineKind: "video",
    ...(posterUrl ? { posterUrl } : {}),
    downloadSpec: { strategy: "engine-hls" },
    sourceUrl: manifestUrl,
  };
}
