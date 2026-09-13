/**
 * Direct video rendition selection.
 *
 * Shared by the platform video extractors. Streaming manifests (HLS/DASH) are
 * rejected because they are playlists, not a downloadable file, and anything
 * that is plainly an image or a page is rejected too.
 */

export interface RawVariant {
  url?: string | null;
  contentType?: string | null;
  bitrate?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface SelectedVariant {
  url: string;
  contentType?: string;
  bitrate?: number;
  width?: number;
  height?: number;
  /** Label such as "720p", derived from the rendition's own resolution. */
  quality?: string;
}

const MANIFEST_TYPES = [
  "application/x-mpegurl",
  "application/vnd.apple.mpegurl",
  "application/dash+xml",
  "video/mp2t",
];

const MANIFEST_EXTENSIONS = [".m3u8", ".mpd", ".ts"];

const REJECTED_PREFIXES = ["image/", "text/"];

/** True for playlists, images, pages and anything else that is not a video file. */
export function isRejectedVariant(variant: RawVariant): string | null {
  const url = variant.url?.trim();
  if (!url) return "missing url";

  const contentType = variant.contentType?.split(";")[0]?.trim().toLowerCase();
  if (contentType) {
    if (MANIFEST_TYPES.includes(contentType)) return `streaming manifest (${contentType})`;
    if (REJECTED_PREFIXES.some((prefix) => contentType.startsWith(prefix))) {
      return `not a video (${contentType})`;
    }
  }

  let pathname = url.toLowerCase();
  try {
    pathname = new URL(url).pathname.toLowerCase();
  } catch {
    return "malformed url";
  }

  if (MANIFEST_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return "streaming manifest url";
  }

  return null;
}

/**
 * Reads a rendition's resolution from the CDN path, e.g. `/vid/avc1/720x1280/`.
 * Platforms encode the real rendition size there even when the API reports only
 * the original media dimensions.
 */
export function resolutionFromUrl(url: string): { width: number; height: number } | undefined {
  const match = url.match(/\/(\d{2,4})x(\d{2,4})\//);
  if (!match) return undefined;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return undefined;
  return { width, height };
}

/**
 * Conventional quality label: the short side of the frame, so a 720x1280
 * portrait rendition is "720p" rather than "1280p".
 */
export function qualityLabel(width?: number, height?: number): string | undefined {
  if (!width || !height) return undefined;
  return `${Math.min(width, height)}p`;
}

/**
 * Filters to direct video renditions and orders them best-first.
 *
 * Ranking: bitrate when published, then pixel count, so the first entry is the
 * highest quality rendition the platform offers.
 */
export function selectVideoVariants(variants: RawVariant[]): SelectedVariant[] {
  const usable: SelectedVariant[] = [];

  for (const variant of variants) {
    if (isRejectedVariant(variant)) continue;

    const url = variant.url as string;
    const fromPath = resolutionFromUrl(url);
    const width = variant.width ?? fromPath?.width;
    const height = variant.height ?? fromPath?.height;

    usable.push({
      url,
      ...(variant.contentType ? { contentType: variant.contentType } : {}),
      ...(variant.bitrate ? { bitrate: variant.bitrate } : {}),
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
      ...(qualityLabel(width, height) ? { quality: qualityLabel(width, height) } : {}),
    });
  }

  const deduped = new Map<string, SelectedVariant>();
  for (const variant of usable) {
    if (!deduped.has(variant.url)) deduped.set(variant.url, variant);
  }

  return [...deduped.values()].sort((a, b) => {
    const byBitrate = (b.bitrate ?? 0) - (a.bitrate ?? 0);
    if (byBitrate !== 0) return byBitrate;
    return (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0);
  });
}
