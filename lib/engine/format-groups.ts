import {
  formatFileSize,
  hasUnknownCodecs,
  isAudioOnly,
  isMuxedFormat,
  isVideoOnly,
  type YtdlpFormat,
  type YtdlpInfo,
} from "./ytdlp";

/**
 * Turns yt-dlp's raw format list into the options a user actually chooses from:
 * a video resolution ladder (1080/720/480/360/144, ...) and an audio menu
 * (original + MP3), each carrying a `downloadSpec` that tells the download
 * pipeline exactly how to produce that file.
 */

export type EngineMediaKind = "video" | "audio" | "image";

/** How the download pipeline should produce a chosen option. */
export type DownloadSpec =
  | { strategy: "direct"; url: string }
  | { strategy: "engine-format"; formatId: string }
  | { strategy: "engine-mux"; videoFormatId: string; audioFormatId: string }
  /**
   * Best video + best audio from an HLS master playlist (`sourceUrl` is the
   * .m3u8 on a media CDN), merged into MP4 by yt-dlp + FFmpeg.
   */
  | { strategy: "engine-hls" }
  | {
      strategy: "engine-audio";
      formatId: string;
      audioCodec: "mp3" | "m4a" | "source";
      /**
       * Target bitrate in kbps for a transcode. Required for MP3, otherwise
       * every MP3 rung would be produced at FFmpeg's "best" setting and the
       * 128/192/320 choices would all yield an identical file.
       */
      bitrateKbps?: number;
    };

export interface EngineOption {
  id: string;
  kind: EngineMediaKind;
  /** e.g. "1080p", "720p", "MP3 128kbps", "M4A". */
  label: string;
  container: string; // mp4 | webm | m4a | mp3 ...
  mimeType: string;
  height?: number;
  width?: number;
  fps?: number;
  /** audio bitrate in kbps */
  abr?: number;
  fileSize?: number;
  /** rough size when exact is unknown, for muxed estimates */
  approxFileSize?: number;
  spec: DownloadSpec;
}

const VIDEO_MIME: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
};

const AUDIO_MIME: Record<string, string> = {
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  opus: "audio/opus",
  webm: "audio/webm",
  ogg: "audio/ogg",
  wav: "audio/wav",
};

/** Standard rungs we always try to present when the source has them. */
const RESOLUTION_LADDER = [4320, 2160, 1440, 1080, 720, 480, 360, 240, 144];

function videoContainer(ext: string | undefined): string {
  if (ext === "mp4" || ext === "m4v") return "mp4";
  if (ext === "webm") return "webm";
  if (ext === "mov") return "mov";
  return "mp4";
}

function heightToLabel(height: number): string {
  return `${height}p`;
}

/** Picks the closest standard rung at or below a real height. */
function normalizeHeight(height: number): number {
  const rung = RESOLUTION_LADDER.find((r) => height >= r);
  return rung ?? height;
}

/** Height named by the format id itself, e.g. Pinterest's `V_720P`. */
function namedHeight(formatId: string): number | undefined {
  const match = formatId.match(/(\d{3,4})p$/i);
  const value = match ? Number(match[1]) : NaN;
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

interface FrameSize {
  /** The rung source: short side of the frame, so portrait 720x1280 is 720p. */
  short: number;
  width?: number;
  height?: number;
}

/**
 * Real frame size and label height for a format.
 *
 * Labels use the short side of the frame (as `qualityLabel()` does for direct
 * renditions), so portrait video is not inflated onto the landscape ladder. A
 * height named in the format id wins over reported dimensions, which some
 * extractors copy from the source upload: Pinterest reports `V_720P` as
 * 1080x1920 while the file is 720x1280, so the dimensions are scaled to match.
 */
function frameSize(format: YtdlpFormat): FrameSize | undefined {
  const width = format.width && format.width > 0 ? format.width : undefined;
  const height = format.height && format.height > 0 ? format.height : undefined;
  const reportedShort = width && height ? Math.min(width, height) : height;
  const named = namedHeight(format.format_id);

  if (named) {
    if (width && height && reportedShort && reportedShort !== named) {
      const scale = named / reportedShort;
      return {
        short: named,
        width: Math.round((width * scale) / 2) * 2,
        height: Math.round((height * scale) / 2) * 2,
      };
    }
    return { short: named, ...(width ? { width } : {}), ...(height ? { height } : {}) };
  }

  if (!reportedShort) return undefined;
  return { short: reportedShort, ...(width ? { width } : {}), ...(height ? { height } : {}) };
}

function isDirectProtocol(format: YtdlpFormat): boolean {
  const protocol = (format.protocol ?? "").toLowerCase();
  return protocol === "https" || protocol === "http";
}

interface BestAudio {
  format: YtdlpFormat;
  abr: number;
}

/** The highest-bitrate audio-only stream, used as the track when muxing. */
function pickBestAudio(formats: YtdlpFormat[]): BestAudio | undefined {
  const audio = formats
    .filter(isAudioOnly)
    .map((format) => ({ format, abr: format.abr ?? format.tbr ?? 0 }))
    .sort((a, b) => b.abr - a.abr);
  return audio[0];
}

/**
 * Builds the video resolution options.
 *
 * Prefers a single progressive (muxed) format for a given height; otherwise
 * pairs the best video-only stream at that height with the best audio stream,
 * to be muxed by FFmpeg at download time.
 */
function buildVideoOptions(formats: YtdlpFormat[]): EngineOption[] {
  const bestAudio = pickBestAudio(formats);
  const byRung = new Map<number, { option: EngineOption; rank: number[] }>();

  /**
   * Per rung, higher wins: mp4 container (+8), no mux needed (+4), direct
   * http(s) file rather than HLS/DASH (+2), codecs known (+1). Ties go to the
   * larger frame, then the higher bitrate.
   */
  const consider = (option: EngineOption, rung: number, format: YtdlpFormat) => {
    const score =
      (option.container === "mp4" ? 8 : 0) +
      (option.spec.strategy === "engine-format" ? 4 : 0) +
      (isDirectProtocol(format) ? 2 : 0) +
      (hasUnknownCodecs(format) ? 0 : 1);
    const rank = [score, (option.width ?? 0) * (option.height ?? 0), format.tbr ?? 0];

    const existing = byRung.get(rung);
    if (!existing || isHigherRank(rank, existing.rank)) byRung.set(rung, { option, rank });
  };

  for (const format of formats) {
    const frame = frameSize(format);
    if (!frame) continue;
    const rung = normalizeHeight(frame.short);
    const container = videoContainer(format.ext);
    const dims = {
      ...(frame.width ? { width: frame.width } : {}),
      ...(frame.height ? { height: frame.height } : {}),
    };

    if (isMuxedFormat(format)) {
      consider(
        {
          id: `v-${rung}`,
          kind: "video",
          label: heightToLabel(rung),
          container,
          mimeType: VIDEO_MIME[container] ?? "video/mp4",
          ...dims,
          ...(format.fps ? { fps: format.fps } : {}),
          ...(formatFileSize(format) ? { fileSize: formatFileSize(format) } : {}),
          spec: { strategy: "engine-format", formatId: format.format_id },
        },
        rung,
        format,
      );
    } else if (isVideoOnly(format) && bestAudio) {
      // mp4 video muxed with the best audio yields a clean mp4.
      const muxContainer = container === "webm" ? "webm" : "mp4";
      const videoSize = formatFileSize(format);
      const audioSize = formatFileSize(bestAudio.format);
      consider(
        {
          id: `v-${rung}`,
          kind: "video",
          label: heightToLabel(rung),
          container: muxContainer,
          mimeType: VIDEO_MIME[muxContainer] ?? "video/mp4",
          ...dims,
          ...(format.fps ? { fps: format.fps } : {}),
          ...(videoSize && audioSize ? { approxFileSize: videoSize + audioSize } : {}),
          spec: {
            strategy: "engine-mux",
            videoFormatId: format.format_id,
            audioFormatId: bestAudio.format.format_id,
          },
        },
        rung,
        format,
      );
    }
  }

  return [...byRung.entries()].sort((a, b) => b[0] - a[0]).map(([, entry]) => entry.option);
}

function isHigherRank(next: number[], current: number[]): boolean {
  for (let i = 0; i < next.length; i++) {
    const a = next[i] ?? 0;
    const b = current[i] ?? 0;
    if (a !== b) return a > b;
  }
  return false;
}

/**
 * Builds the audio options: the original best audio (kept as-is), plus MP3
 * renditions transcoded by FFmpeg. MP3 is offered only when FFmpeg is present.
 */
function buildAudioOptions(formats: YtdlpFormat[], ffmpegAvailable: boolean): EngineOption[] {
  const best = pickBestAudio(formats);
  if (!best) return [];

  const options: EngineOption[] = [];
  const sourceExt = best.format.ext === "m4a" ? "m4a" : (best.format.ext ?? "m4a");
  const sourceContainer = AUDIO_MIME[sourceExt] ? sourceExt : "m4a";

  options.push({
    id: "a-source",
    kind: "audio",
    label: `Original audio (${sourceContainer.toUpperCase()})`,
    container: sourceContainer,
    mimeType: AUDIO_MIME[sourceContainer] ?? "audio/mp4",
    ...(best.abr ? { abr: Math.round(best.abr) } : {}),
    ...(formatFileSize(best.format) ? { fileSize: formatFileSize(best.format) } : {}),
    spec: { strategy: "engine-audio", formatId: best.format.format_id, audioCodec: "source" },
  });

  if (ffmpegAvailable) {
    // Common MP3 bitrates at or below the source (transcoding up is pointless).
    // Source bitrates cluster ~128-130kbps, so allow a small headroom so 192
    // still appears for those, while 320 shows only for genuinely richer audio.
    const ceiling = best.abr ? best.abr + 64 : 320;
    const bitrates = [320, 192, 128].filter((b) => b <= ceiling);
    for (const bitrate of bitrates.length ? bitrates : [128]) {
      options.push({
        id: `a-mp3-${bitrate}`,
        kind: "audio",
        label: `MP3 ${bitrate}kbps`,
        container: "mp3",
        mimeType: "audio/mpeg",
        abr: bitrate,
        spec: {
          strategy: "engine-audio",
          formatId: best.format.format_id,
          audioCodec: "mp3",
          bitrateKbps: bitrate,
        },
      });
    }
  }

  return options;
}

export interface GroupedFormats {
  /** Overall shape for labelling. */
  postKind: "video" | "audio" | "image";
  options: EngineOption[];
}

/**
 * Groups a yt-dlp info blob into user-facing options.
 *
 * `ffmpegAvailable` gates the mux/MP3 options: without FFmpeg we still offer
 * progressive video and the original audio, so the engine remains useful.
 */
export function groupFormats(info: YtdlpInfo, ffmpegAvailable: boolean): GroupedFormats {
  const formats = (info.formats ?? []).filter((f) => f.format_id);

  const videoOptions = buildVideoOptions(formats).filter((option) => {
    // Without FFmpeg, drop options that would need muxing.
    if (!ffmpegAvailable && option.spec.strategy === "engine-mux") return false;
    return true;
  });

  const audioOptions = buildAudioOptions(formats, ffmpegAvailable);

  const options = [...videoOptions, ...audioOptions];
  const postKind = videoOptions.length > 0 ? "video" : audioOptions.length > 0 ? "audio" : "image";

  return { postKind, options };
}
