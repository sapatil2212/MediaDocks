import { fromUrlExtension } from "@/lib/media/detect-media-type";
import type { ResolvedMedia } from "@/lib/platforms/types";
import { isAudioFormat, isVideoFormat, type YtdlpInfo } from "./ytdlp";

/**
 * yt-dlp represents image posts and carousels as a playlist of entries (or a
 * single info object) with no video/audio formats. This turns those into direct
 * image media items — streamed straight from the CDN, no engine processing.
 */

function entryImageUrl(entry: YtdlpInfo): string | undefined {
  const direct = (entry as { url?: string }).url;
  if (typeof direct === "string" && /^https?:\/\//.test(direct)) return direct;
  if (entry.thumbnail) return entry.thumbnail;
  return undefined;
}

function hasNoAvFormats(info: YtdlpInfo): boolean {
  const formats = info.formats ?? [];
  if (formats.length === 0) return true;
  return !formats.some((f) => isVideoFormat(f) || isAudioFormat(f));
}

/** True when the info describes images only (no playable A/V streams). */
export function isImageOnlyInfo(info: YtdlpInfo): boolean {
  const entries = info.entries;
  if (Array.isArray(entries) && entries.length > 0) {
    return entries.every((entry) => hasNoAvFormats(entry));
  }
  return hasNoAvFormats(info);
}

export function imageMediaFromInfo(info: YtdlpInfo, sourceUrl: string): ResolvedMedia[] {
  const entries = Array.isArray(info.entries) && info.entries.length > 0 ? info.entries : [info];
  const media: ResolvedMedia[] = [];

  entries.forEach((entry, index) => {
    const url = entryImageUrl(entry);
    if (!url) return;
    const info = fromUrlExtension(url) ?? {
      kind: "image" as const,
      mimeType: "image/jpeg",
      extension: "jpg",
      label: "JPG",
      source: "extension" as const,
    };
    if (info.kind !== "image") return;

    media.push({
      id: `img-${index + 1}`,
      kind: "image",
      mediaUrl: url,
      mimeType: info.mimeType,
      extension: info.extension,
      label: info.label,
      quality: entries.length > 1 ? `Image ${index + 1}` : "Original",
      engineKind: "image",
      sourceUrl,
    });
  });

  return media;
}
