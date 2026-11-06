import type { MediaCandidate } from "@/lib/media/candidates";
import { debugLog } from "@/lib/debug";
import { isDownloadableMediaUrl } from "../base";
import {
  collectVideoRenditions,
  isHevcVideoUrl,
  type PinRecord,
  type VideoRendition,
} from "../pinterest-data";
import { isPinterestHost, isPinterestShortHost } from "../pinterest-url";
import { extractEmbeddedVideoUrls } from "./embedded-json";
import type { VideoResolver, VideoResolverInput } from "./types";
import { isRejectedVariant, qualityLabel, resolutionFromUrl } from "./video-selection";

/**
 * Pinterest video extraction.
 *
 * Pinterest expresses video Pins several different ways, so this normalizes
 * rather than depending on one field. In order of trust:
 *
 *   1. renditions in the structured Pin records the platform resolver parsed
 *      (relay, legacy page state or the PinResource API; passed as `payload`)
 *   2. og:video and JSON-LD VideoObject.contentUrl
 *   3. only when there are no records: the `video_list` window scan and a raw
 *      .mp4 scan of the HTML
 *
 * Only direct MP4 files become candidates here. HEVC/HDR encodes are dropped
 * when anything else exists, and one candidate is kept per quality rung. HLS
 * manifests are exposed separately through `selectPinterestHls`. The Pin image
 * is kept as the poster only.
 */

const MAX_CANDIDATES = 4;

interface RawPinVideo {
  url: string;
  key?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  contentType?: string;
  source: string;
}

interface LabelledVideo extends RawPinVideo {
  rung?: number;
  hevc: boolean;
}

export class PinterestVideoResolver implements VideoResolver {
  readonly name = "PinterestVideoResolver";

  canResolve(input: VideoResolverInput): boolean {
    return isPinterestShortHost(input.url.hostname) || isPinterestHost(input.url.hostname);
  }

  async resolve(input: VideoResolverInput): Promise<MediaCandidate[]> {
    const metadata = input.metadata;
    const records = recordsFrom(input.payload);
    const poster = isDownloadableMediaUrl(metadata?.image) ? metadata?.image : undefined;

    const raw: RawPinVideo[] = [];

    // 1. Structured renditions.
    for (const rendition of collectVideoRenditions(records)) {
      raw.push({ ...renditionFields(rendition), source: "pinterest:records" });
    }

    // 2. Published OpenGraph / JSON-LD video.
    if (metadata?.video) {
      raw.push({
        url: metadata.video,
        ...(metadata.videoType ? { contentType: metadata.videoType } : {}),
        ...(metadata.videoWidth ? { width: metadata.videoWidth } : {}),
        ...(metadata.videoHeight ? { height: metadata.videoHeight } : {}),
        source: metadata.tags["og:video"] || metadata.tags["og:video:secure_url"] ? "og:video" : "json-ld",
      });
    }

    // 3. Unstructured scans, only when the page gave no records to trust.
    if (records.length === 0) {
      for (const entry of readVideoList(input.html ?? "")) raw.push({ ...entry, source: "video_list" });
      for (const found of extractEmbeddedVideoUrls(input.html ?? "")) {
        raw.push({ url: found.url, source: found.source });
      }
    }

    const selected = selectRenditions(raw);
    const durationMs = raw.find((entry) => entry.durationMs)?.durationMs;
    const duration = durationMs ? Math.round(durationMs / 1000) : metadata?.duration;

    const candidates: MediaCandidate[] = selected.map((video, index) => ({
      id: `pin-video-${index + 1}`,
      url: video.url,
      kindHint: "video" as const,
      source: video.source,
      ...(video.contentType ? { declaredMimeType: video.contentType } : {}),
      ...(video.width ? { width: video.width } : {}),
      ...(video.height ? { height: video.height } : {}),
      ...(video.rung ? { quality: video.hevc ? `${video.rung}p HEVC` : `${video.rung}p` } : {}),
      ...(duration ? { duration } : {}),
      ...(poster ? { posterUrl: poster } : {}),
    }));

    debugLog("MEDIA", { resolver: this.name, records: records.length, candidates: candidates.length });
    return candidates;
  }
}

function recordsFrom(payload: unknown): PinRecord[] {
  if (!Array.isArray(payload)) return [];
  return payload.filter(
    (entry): entry is PinRecord => typeof entry === "object" && entry !== null && !Array.isArray(entry),
  );
}

function renditionFields(rendition: VideoRendition): Omit<RawPinVideo, "source"> {
  return {
    url: rendition.url,
    key: rendition.key,
    ...(rendition.width ? { width: rendition.width } : {}),
    ...(rendition.height ? { height: rendition.height } : {}),
    ...(rendition.durationMs ? { durationMs: rendition.durationMs } : {}),
  };
}

/**
 * Labels a rendition with its real quality.
 *
 * Pinterest copies the source upload's size onto every rendition (`v720P` is
 * reported as 1080x1920), so the key (`V_720P`/`v720P`) or path (`/720p/`) wins,
 * then a `_<n>w` width suffix, then the reported size. Dimensions are scaled to
 * the label so the UI shows the file's real size.
 */
function labelRendition(video: RawPinVideo): LabelledVideo {
  const hevc = isHevcVideoUrl(video.url);
  const named =
    numberFrom(video.key?.match(/(\d{3,4})p$/i)?.[1]) ??
    numberFrom(video.url.match(/\/(\d{3,4})p\//i)?.[1]);
  const widthSuffix = numberFrom(video.url.match(/_(\d{3,4})w\.mp4(?:\?|$)/i)?.[1]);

  const fromPath = resolutionFromUrl(video.url);
  const width = video.width ?? fromPath?.width;
  const height = video.height ?? fromPath?.height;

  if (named) {
    const scaled = scaleToShortSide(width, height, named);
    return { ...video, ...scaled, rung: named, hevc };
  }

  if (widthSuffix) {
    if (width && height) {
      const scale = widthSuffix / width;
      const scaledHeight = evenRound(height * scale);
      return {
        ...video,
        width: widthSuffix,
        height: scaledHeight,
        rung: Math.min(widthSuffix, scaledHeight),
        hevc,
      };
    }
    return { ...video, width: widthSuffix, rung: widthSuffix, hevc };
  }

  const label = qualityLabel(width, height);
  return {
    ...video,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(label ? { rung: Number.parseInt(label, 10) } : {}),
    hevc,
  };
}

function scaleToShortSide(
  width: number | undefined,
  height: number | undefined,
  short: number,
): { width?: number; height?: number } {
  if (!width || !height) return {};
  const current = Math.min(width, height);
  if (current === short) return { width, height };
  const scale = short / current;
  return { width: evenRound(width * scale), height: evenRound(height * scale) };
}

function evenRound(value: number): number {
  return Math.round(value / 2) * 2;
}

function numberFrom(raw: string | undefined): number | undefined {
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Direct MP4 renditions, best first, at most one per rung. HEVC/HDR files are
 * kept only when nothing else is published (no h264 MP4 and no HLS), because
 * browsers and default players often cannot open them.
 */
function selectRenditions(raw: RawPinVideo[]): LabelledVideo[] {
  const seen = new Set<string>();
  const direct: LabelledVideo[] = [];
  let hasHls = false;

  for (const entry of raw) {
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);
    if (/\.m3u8(?:\?|$)/i.test(entry.url)) {
      if (!isHevcVideoUrl(entry.url)) hasHls = true;
      continue;
    }
    if (isRejectedVariant({ url: entry.url, contentType: entry.contentType ?? null })) continue;
    if (!isDownloadableMediaUrl(entry.url)) continue;
    direct.push(labelRendition(entry));
  }

  const h264 = direct.filter((entry) => !entry.hevc);
  const pool = h264.length > 0 ? h264 : hasHls ? [] : direct;

  // Stable sort keeps source order (records before scans) within a rung.
  const ranked = pool
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => (b.entry.rung ?? 0) - (a.entry.rung ?? 0) || a.index - b.index)
    .map(({ entry }) => entry);

  const byRung = new Set<string>();
  const out: LabelledVideo[] = [];
  for (const entry of ranked) {
    const rungKey = entry.rung ? String(entry.rung) : `url:${entry.url}`;
    if (byRung.has(rungKey)) continue;
    byRung.add(rungKey);
    out.push(entry);
    if (out.length >= MAX_CANDIDATES) break;
  }
  return out;
}

/**
 * The HLS master playlist to hand to the engine when no MP4 is published.
 * Prefers the `V_HLSV4` list, then any `HLSV3` list, then any master. Variant
 * and audio-only playlists (`_720w.m3u8`, `_audio.m3u8`) and HEVC lists are
 * never chosen. With no records, the HTML is scanned as a last resort.
 */
export function selectPinterestHls(records: PinRecord[], html?: string): string | undefined {
  const masters = collectVideoRenditions(records).filter((rendition) => isHlsMaster(rendition.url));

  if (masters.length === 0 && html && records.length === 0) {
    for (const match of html.matchAll(/https:(?:\\?\/){2}v\d*\.pinimg\.com(?:\\?\/)videos[^"'\s]+?\.m3u8/g)) {
      const url = match[0].replace(/\\\//g, "/");
      if (isHlsMaster(url)) masters.push({ key: "", url });
    }
  }

  const pick =
    masters.find((entry) => /hlsv4/i.test(entry.key)) ??
    masters.find((entry) => /hlsv3/i.test(entry.key)) ??
    masters[0];
  return pick?.url;
}

function isHlsMaster(url: string): boolean {
  if (!/\.m3u8(?:\?|$)/i.test(url) || isHevcVideoUrl(url)) return false;
  return !/_(?:\d{2,4}w|audio)\.m3u8(?:\?|$)/i.test(url) && isDownloadableMediaUrl(url);
}

/**
 * Reads Pinterest's `video_list` object map, where each key is a quality label
 * and each value carries its own url and dimensions. Used only when no
 * structured record was available.
 */
function readVideoList(html: string): Array<Omit<RawPinVideo, "source">> {
  const variants: Array<Omit<RawPinVideo, "source">> = [];
  if (!html) return variants;

  // Scan a bounded window after each "video_list" marker and read the flat
  // per-quality objects inside it. A lazy whole-object regex would stop at the
  // first nested "}}" and miss every rendition but the first.
  let marker = html.indexOf('"video_list"');
  while (marker !== -1) {
    const window = html.slice(marker, marker + 6000);

    for (const entry of window.matchAll(/"([A-Za-z0-9_]{2,24})"\s*:\s*\{([^{}]*)\}/g)) {
      const body = entry[2] ?? "";
      const url = body.match(/"url"\s*:\s*"([^"]+)"/)?.[1];
      if (!url) continue;

      const width = Number(body.match(/"width"\s*:\s*(\d+)/)?.[1] ?? "");
      const height = Number(body.match(/"height"\s*:\s*(\d+)/)?.[1] ?? "");
      const durationMs = Number(body.match(/"duration"\s*:\s*(\d+)/)?.[1] ?? "");
      const normalized = url.replace(/\\\//g, "/");

      variants.push({
        url: normalized,
        ...(entry[1] ? { key: entry[1] } : {}),
        ...(Number.isFinite(width) && width > 0 ? { width } : {}),
        ...(Number.isFinite(height) && height > 0 ? { height } : {}),
        ...(Number.isFinite(durationMs) && durationMs > 0 ? { durationMs } : {}),
      });
    }

    marker = html.indexOf('"video_list"', marker + 12);
  }

  return variants;
}

export { qualityLabel };
