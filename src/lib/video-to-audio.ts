/**
 * Core configuration, types, and FFmpeg command generation for the Video to Audio tool.
 *
 * MediaDocks extracts audio tracks directly from video containers of any length
 * using native FFmpeg with the `-vn` flag (bypassing video decode for maximum speed).
 */

export const SUPPORTED_VIDEO_EXTENSIONS = [
  "mp4",
  "mov",
  "avi",
  "mkv",
  "webm",
  "m4v",
  "flv",
  "wmv",
  "ts",
  "3gp",
  "ogv",
  "mpeg",
  "mpg",
] as const;

export type SupportedVideoExtension = (typeof SUPPORTED_VIDEO_EXTENSIONS)[number];

export const AUDIO_OUTPUT_FORMATS = [
  {
    format: "mp3",
    label: "MP3",
    mimeType: "audio/mpeg",
    extension: "mp3",
    description: "Universal compatibility. Studio 320 kbps or efficient compression.",
    supportsBitrate: true,
    defaultBitrate: "320k",
  },
  {
    format: "m4a",
    label: "M4A / AAC",
    mimeType: "audio/mp4",
    extension: "m4a",
    description: "High-efficiency Apple & mobile format with pristine clarity.",
    supportsBitrate: true,
    defaultBitrate: "256k",
  },
  {
    format: "wav",
    label: "WAV",
    mimeType: "audio/wav",
    extension: "wav",
    description: "Uncompressed lossless studio PCM audio. Maximum fidelity.",
    supportsBitrate: false,
    defaultBitrate: "lossless",
  },
  {
    format: "flac",
    label: "FLAC",
    mimeType: "audio/flac",
    extension: "flac",
    description: "Lossless compressed audio for audiophiles and archival.",
    supportsBitrate: false,
    defaultBitrate: "lossless",
  },
  {
    format: "ogg",
    label: "OGG (Vorbis)",
    mimeType: "audio/ogg",
    extension: "ogg",
    description: "Open audio container optimized for web and game engines.",
    supportsBitrate: true,
    defaultBitrate: "192k",
  },
  {
    format: "opus",
    label: "OPUS",
    mimeType: "audio/opus",
    extension: "opus",
    description: "Ultra-low latency modern audio codec with best-in-class speech clarity.",
    supportsBitrate: true,
    defaultBitrate: "192k",
  },
] as const;

export type AudioOutputFormat = (typeof AUDIO_OUTPUT_FORMATS)[number]["format"];

export const AUDIO_BITRATES = [
  { value: "320k", label: "320 kbps — Studio Quality (Best)", recommended: true },
  { value: "256k", label: "256 kbps — Very High Quality", recommended: false },
  { value: "192k", label: "192 kbps — High Quality (Standard)", recommended: false },
  { value: "128k", label: "128 kbps — Compact / Speech", recommended: false },
] as const;

export type AudioBitrate = (typeof AUDIO_BITRATES)[number]["value"];

export const AUDIO_CHANNELS = [
  { value: "2", label: "Stereo (2 Channels)", description: "Full spatial width, standard for music and films." },
  { value: "1", label: "Mono (1 Channel)", description: "Single track, smaller file size, ideal for voice & podcasts." },
] as const;

export type AudioChannels = "1" | "2";

export const VOLUME_BOOST_OPTIONS = [
  { value: "1.0", label: "Original (100%)", filter: null },
  { value: "1.25", label: "+25% Boost (125%)", filter: "volume=1.25" },
  { value: "1.5", label: "+50% Boost (150%)", filter: "volume=1.5" },
  { value: "2.0", label: "2x Boost (200%)", filter: "volume=2.0" },
  { value: "normalize", label: "Auto-Normalize (EBU R128)", filter: "loudnorm" },
] as const;

export type VolumeBoostValue = (typeof VOLUME_BOOST_OPTIONS)[number]["value"];

export interface ExtractAudioOptions {
  format: AudioOutputFormat;
  bitrate?: AudioBitrate;
  channels?: AudioChannels;
  volume?: VolumeBoostValue;
  trimStart?: string | null;
  trimEnd?: string | null;
}

export interface ExtractedAudioResult {
  token: string;
  filename: string;
  format: AudioOutputFormat;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
  durationFormatted: string;
}

/** Validates whether a file extension belongs to supported video inputs. */
export function isSupportedVideoFile(filename: string): boolean {
  const ext = (filename.split(".").pop() ?? "").toLowerCase();
  return (SUPPORTED_VIDEO_EXTENSIONS as readonly string[]).includes(ext);
}

/** Formats byte size into friendly human-readable units. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Formats seconds into HH:MM:SS or MM:SS. */
export function formatAudioDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "00:00";
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);

  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/** Sanitizes an audio output filename based on the original video title. */
export function sanitizeAudioFilename(
  originalVideoName: string,
  targetFormat: AudioOutputFormat,
): string {
  // Strip any directory path components to prevent directory traversal
  const rawBase = (originalVideoName.split(/[/\\]/).pop() ?? "")
    .replace(/\.[^/.]+$/, "")
    .trim()
    .replace(/[^\w\s-]/g, "_")
    .replace(/\s+/g, " ")
    .slice(0, 100);

  return `${rawBase || "extracted-audio"}.${targetFormat}`;
}

/** Validates and parses time format string (HH:MM:SS, MM:SS, or seconds). */
export function parseTimeString(timeStr?: string | null): number | null {
  if (!timeStr || !timeStr.trim()) return null;
  const trimmed = timeStr.trim();

  // If already pure seconds
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const val = Number(trimmed);
    return Number.isFinite(val) && val >= 0 ? val : null;
  }

  // HH:MM:SS or MM:SS
  const parts = trimmed.split(":").map((p) => Number(p));
  if (parts.some((p) => !Number.isFinite(p) || p < 0)) return null;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return null;
}

/**
 * Builds the exact FFmpeg command line arguments to extract audio without video decoding.
 * -vn is always applied so video tracks are completely skipped for maximum speed.
 */
export function buildFfmpegAudioArgs(
  inputPath: string,
  outputPath: string,
  options: ExtractAudioOptions,
): string[] {
  const args: string[] = ["-hide_banner", "-loglevel", "error"];

  // Fast seek if trim start is provided
  const startSec = parseTimeString(options.trimStart);
  if (startSec !== null && startSec > 0) {
    args.push("-ss", String(startSec));
  }

  // Input file
  args.push("-i", inputPath);

  // Trim end if provided
  const endSec = parseTimeString(options.trimEnd);
  if (endSec !== null && endSec > 0) {
    if (startSec !== null && startSec > 0) {
      const duration = endSec - startSec;
      if (duration > 0) {
        args.push("-t", String(duration));
      }
    } else {
      args.push("-to", String(endSec));
    }
  }

  // Completely discard video stream (-vn)
  args.push("-vn");

  // Channels
  if (options.channels === "1") {
    args.push("-ac", "1");
  } else if (options.channels === "2") {
    args.push("-ac", "2");
  }

  // Audio Filters (volume or normalization)
  const volOption = VOLUME_BOOST_OPTIONS.find((v) => v.value === options.volume);
  if (volOption && volOption.filter) {
    args.push("-af", volOption.filter);
  }

  // Audio Codec and Bitrate configuration
  const format = options.format;
  const bitrate = options.bitrate || "320k";

  switch (format) {
    case "mp3":
      args.push("-c:a", "libmp3lame", "-b:a", bitrate);
      break;

    case "m4a":
      args.push("-c:a", "aac", "-b:a", bitrate === "320k" ? "256k" : bitrate);
      break;

    case "wav":
      args.push("-c:a", "pcm_s16le");
      break;

    case "flac":
      args.push("-c:a", "flac");
      break;

    case "ogg":
      args.push("-c:a", "libvorbis");
      if (bitrate === "320k") args.push("-q:a", "9");
      else if (bitrate === "256k") args.push("-q:a", "8");
      else if (bitrate === "192k") args.push("-q:a", "6");
      else args.push("-q:a", "4");
      break;

    case "opus":
      args.push("-c:a", "libopus", "-b:a", bitrate === "320k" ? "256k" : bitrate);
      break;

    default:
      args.push("-c:a", "libmp3lame", "-b:a", "320k");
  }

  // Overwrite output file
  args.push("-y", outputPath);

  return args;
}
