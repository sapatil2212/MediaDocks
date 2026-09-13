import {
  formatFileSize,
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
  const byHeight = new Map<number, EngineOption>();

  const consider = (option: EngineOption, height: number) => {
    const existing = byHeight.get(height);
    // Prefer mp4, then progressive (no mux needed), then larger known size.
    const score = (o: EngineOption) =>
      (o.container === "mp4" ? 2 : 0) + (o.spec.strategy === "engine-format" ? 1 : 0);
    if (!existing || score(option) > score(existing)) byHeight.set(height, option);
  };

  for (const format of formats) {
    if (!format.height) continue;
    const height = normalizeHeight(format.height);
    const container = videoContainer(format.ext);

    if (isMuxedFormat(format)) {
      consider(
        {
          id: `v-${height}`,
          kind: "video",
          label: heightToLabel(height),
          container,
          mimeType: VIDEO_MIME[container] ?? "video/mp4",
          height,
          ...(format.width ? { width: format.width } : {}),
          ...(format.fps ? { fps: format.fps } : {}),
          ...(formatFileSize(format) ? { fileSize: formatFileSize(format) } : {}),
          spec: { strategy: "engine-format", formatId: format.format_id },
        },
        height,
      );
    } else if (isVideoOnly(format) && bestAudio) {
      // mp4 video muxed with the best audio yields a clean mp4.
      const muxContainer = container === "webm" ? "webm" : "mp4";
      const videoSize = formatFileSize(format);
      const audioSize = formatFileSize(bestAudio.format);
      consider(
        {
          id: `v-${height}`,
          kind: "video",
          label: heightToLabel(height),
          container: muxContainer,
          mimeType: VIDEO_MIME[muxContainer] ?? "video/mp4",
          height,
          ...(format.width ? { width: format.width } : {}),
          ...(format.fps ? { fps: format.fps } : {}),
          ...(videoSize && audioSize ? { approxFileSize: videoSize + audioSize } : {}),
          spec: {
            strategy: "engine-mux",
            videoFormatId: format.format_id,
            audioFormatId: bestAudio.format.format_id,
          },
        },
        height,
      );
    }
  }

  return [...byHeight.values()].sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
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
