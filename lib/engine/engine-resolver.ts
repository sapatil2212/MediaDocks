import { debugLog } from "@/lib/debug";
import { MediaFlowError } from "@/lib/errors";
import type { Platform, PostKind, ResolvedMedia, ResolvedResult } from "@/lib/platforms/types";
import { ffmpegPath } from "./binaries";
import { groupFormats, type EngineOption } from "./format-groups";
import { isImageOnlyInfo, imageMediaFromInfo } from "./images";
import { probeUrl, type YtdlpInfo } from "./ytdlp";

/**
 * Resolves any URL through yt-dlp into the normalized ResolvedResult shape, with
 * every selectable format/resolution/audio option expressed as a ResolvedMedia
 * carrying a downloadSpec.
 *
 * Returns null (rather than throwing) when the engine simply cannot handle the
 * URL, so the caller can fall back to the HTTP resolvers. It throws only for
 * genuine, user-meaningful conditions (private/unavailable) so those surface as
 * proper errors instead of a silent fallback.
 */
export async function resolveWithEngine(
  url: string,
  platform: Platform,
): Promise<ResolvedResult | null> {
  const probe = await probeUrl(url);

  if (!probe.ok || !probe.info) {
    switch (probe.errorKind) {
      case "engine-missing":
      case "unsupported":
        return null; // fall back to HTTP resolvers
      case "timeout":
        throw new MediaFlowError("REQUEST_TIMEOUT", "The request took too long. Please try again.");
      case "private":
        throw new MediaFlowError(
          "MEDIA_NOT_AVAILABLE",
          "This content is private or unavailable, so it can't be downloaded.",
        );
      default:
        return null;
    }
  }

  const info = probe.info;
  const ffmpegAvailable = Boolean(await ffmpegPath());

  // Image posts / carousels: yt-dlp reports these as entries with a direct URL.
  if (isImageOnlyInfo(info)) {
    const media = imageMediaFromInfo(info, url);
    if (media.length === 0) return null;
    return buildResult(platform, info, url, "image", media);
  }

  const grouped = groupFormats(info, ffmpegAvailable);
  if (grouped.options.length === 0) {
    // Distinguish "nothing is published" from "we cannot assemble what is
    // published". Most sites now serve video and audio as separate streams, so a
    // missing FFmpeg silently empties the list — reporting that as "no
    // downloadable file" sends the operator looking in entirely the wrong place.
    if (!ffmpegAvailable && (info.formats?.length ?? 0) > 0) {
      throw new MediaFlowError(
        "DOWNLOAD_FAILED",
        "This video is published as separate video and audio streams, which need FFmpeg " +
          "to combine. FFmpeg was not found on the server — install it (or set FFMPEG_PATH) " +
          "and try again. See /api/health for tool status.",
      );
    }
    // No selectable options; let the HTTP resolver try (it may find an image).
    return null;
  }

  const media = grouped.options.map((option) => toResolvedMedia(option, info, url));
  const postKind: PostKind = grouped.postKind === "audio" ? "video" : grouped.postKind;

  debugLog("RESULT", {
    engine: "ytdlp",
    platform,
    options: media.length,
    ffmpeg: ffmpegAvailable,
  });

  return buildResult(platform, info, url, postKind, media);
}

function toResolvedMedia(option: EngineOption, info: YtdlpInfo, sourceUrl: string): ResolvedMedia {
  const posterUrl = info.thumbnail;
  return {
    id: option.id,
    kind: option.kind === "audio" ? "video" : option.kind === "image" ? "image" : "video",
    // Engine options are produced on demand; no single direct URL exists.
    mediaUrl: "",
    mimeType: option.mimeType,
    extension: option.container,
    label: option.kind === "audio" ? option.label : option.container.toUpperCase(),
    quality: option.label,
    engineKind: option.kind,
    ...(option.abr ? { audioBitrate: option.abr } : {}),
    ...(posterUrl ? { posterUrl } : {}),
    ...(option.width ? { width: option.width } : {}),
    ...(option.height ? { height: option.height } : {}),
    ...(info.duration ? { duration: Math.round(info.duration) } : {}),
    ...(option.fileSize ?? option.approxFileSize
      ? { fileSize: option.fileSize ?? option.approxFileSize }
      : {}),
    downloadSpec: option.spec,
    sourceUrl,
  };
}

function buildResult(
  platform: Platform,
  info: YtdlpInfo,
  sourceUrl: string,
  postKind: PostKind,
  media: ResolvedMedia[],
): ResolvedResult {
  const creator = info.uploader ?? info.channel;
  return {
    platform,
    postKind,
    ...(info.title ? { title: info.title } : {}),
    ...(creator ? { creator } : {}),
    ...(info.thumbnail ? { thumbnail: info.thumbnail } : {}),
    ...(info.duration ? { duration: Math.round(info.duration) } : {}),
    ...(media[0]?.width ? { width: media[0].width } : {}),
    ...(media[0]?.height ? { height: media[0].height } : {}),
    kind: labelFor(platform, postKind),
    sourceUrl,
    media,
    diagnostics: {
      videoResolver: "ytdlp-engine",
      candidateCount: media.length,
      candidates: media.map((item) => ({
        id: item.id,
        source: item.downloadSpec?.strategy ?? "direct",
        host: "engine",
        resolvedKind: item.kind,
        resolvedMimeType: item.mimeType,
        extension: item.extension,
        accepted: true,
      })),
    },
  };
}

function labelFor(platform: Platform, postKind: PostKind): string {
  return postKind === "image" ? "Image" : "Video";
}
