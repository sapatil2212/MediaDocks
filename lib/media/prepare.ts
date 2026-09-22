/**
 * Request-scoped media preparation shared by the transcription and subtitle
 * routes: staging an upload or a linked source, probing it, and splitting its
 * audio into model-sized windows.
 *
 * Everything lives under a per-request temporary directory that the caller
 * deletes in a `finally` block. Nothing here is persistent storage, and a stale
 * directory sweeper covers the case where a process dies before cleanup.
 */
import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";
import type { NextRequest } from "next/server";
import { config } from "@/lib/config";
import { assertSafeUrl } from "@/lib/download/security";
import type { Command } from "@/lib/engine/binaries";
import { MediaFlowError } from "@/lib/errors";
import { assertValidMediaUrl } from "@/lib/validation/url";

const TEMP_PREFIX = "mediadocks-media-";

export const ALLOWED_MEDIA_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".webm",
  ".m4v",
  ".mpeg",
  ".mpg",
  ".mp3",
  ".wav",
  ".ogg",
  ".m4a",
  ".aac",
  ".flac",
  ".opus",
  ".wma",
]);

export interface ProcessResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export interface PreparedMedia {
  inputPath: string;
  title: string;
  mediaType: "video" | "audio";
  /** Duration reported by the source, when it provided one. */
  duration: number;
}

// Keep the host temp path opaque to Next's standalone file tracer; a literal
// os.tmpdir() read gets folded into an absolute build-machine path on Windows.
const runtimeOs = os as unknown as Record<string, unknown>;
function runtimeTempRoot(): string {
  const getTempDir = runtimeOs["tmpdir"];
  return typeof getTempDir === "function" ? (getTempDir as () => string)() : ".";
}

/**
 * Runs a media subprocess with a hard timeout.
 *
 * On timeout the whole process tree is killed (FFmpeg and yt-dlp both spawn
 * children that would otherwise keep holding the temp files open), and the
 * promise still waits briefly for `close` so cleanup does not race a live
 * writer.
 */
export function runProcess(bin: string, args: string[], timeoutMs: number): Promise<ProcessResult> {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(bin, args, { windowsHide: true });
    } catch {
      resolve({ code: null, stdout: "", stderr: "Unable to start media tool.", timedOut: false });
      return;
    }

    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;
    let forceFinishTimer: NodeJS.Timeout | undefined;

    const finish = (code: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      if (forceFinishTimer) clearTimeout(forceFinishTimer);
      resolve({ code, stdout, stderr, timedOut });
    };

    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      if (process.platform === "win32" && child.pid) {
        const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
          windowsHide: true,
          stdio: "ignore",
        });
        killer.on("error", () => child.kill("SIGKILL"));
      } else {
        child.kill("SIGKILL");
      }
      forceFinishTimer = setTimeout(() => finish(null), 5_000);
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout = (stdout + chunk.toString("utf8")).slice(-32_000);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = (stderr + chunk.toString("utf8")).slice(-32_000);
    });
    child.on("error", () => finish(null));
    child.on("close", finish);
  });
}

export async function createRequestTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(runtimeTempRoot(), TEMP_PREFIX));
}

export async function removeTempDir(tempDir: string): Promise<void> {
  await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 4, retryDelay: 150 });
}

/** Deletes leftover directories from processes that died before cleanup. */
export async function sweepStaleTempDirs(): Promise<void> {
  const tempRoot = runtimeTempRoot();
  const entries = await fs.readdir(tempRoot, { withFileTypes: true }).catch(() => []);
  const staleBefore = Date.now() - 60 * 60 * 1000;

  await Promise.all(
    entries
      .filter(
        (entry) =>
          entry.isDirectory() &&
          (entry.name.startsWith(TEMP_PREFIX) || entry.name.startsWith("mediadocks-transcribe-")),
      )
      .map(async (entry) => {
        const directory = path.join(tempRoot, entry.name);
        const stat = await fs.stat(directory).catch(() => null);
        if (stat && stat.mtimeMs < staleBefore) {
          await removeTempDir(directory).catch(() => undefined);
        }
      }),
  );
}

function titleFromFilename(filename: string): string {
  return path.basename(filename, path.extname(filename)).trim() || "Uploaded media";
}

function isAllowedUpload(file: File): boolean {
  const extension = path.extname(file.name).toLowerCase();
  return (
    ALLOWED_MEDIA_EXTENSIONS.has(extension) ||
    file.type.startsWith("audio/") ||
    file.type.startsWith("video/")
  );
}

/** Stages a multipart upload onto disk after validating type and size. */
export async function prepareUploadedMedia(
  req: NextRequest,
  tempDir: string,
): Promise<PreparedMedia> {
  const maxBytes = config.transcribeMaxFileSizeMb * 1024 * 1024;
  const declaredLength = Number(req.headers.get("content-length") || 0);
  if (declaredLength > maxBytes + 1024 * 1024) {
    throw new MediaFlowError(
      "FILE_TOO_LARGE",
      `Uploads are limited to ${config.transcribeMaxFileSizeMb} MB.`,
    );
  }

  const formData = await req.formData();
  const entry = formData.get("file");
  if (!entry || typeof entry === "string") {
    throw new MediaFlowError("MEDIA_TYPE_UNKNOWN", "Select a video or audio file.");
  }

  const file = entry as File;
  if (!file.name || !isAllowedUpload(file)) {
    throw new MediaFlowError(
      "MEDIA_TYPE_UNKNOWN",
      "That file is not a supported video or audio format.",
    );
  }
  if (file.size === 0) {
    throw new MediaFlowError("MEDIA_TYPE_UNKNOWN", "The selected file is empty.");
  }
  if (file.size > maxBytes) {
    throw new MediaFlowError(
      "FILE_TOO_LARGE",
      `Uploads are limited to ${config.transcribeMaxFileSizeMb} MB.`,
    );
  }

  const extension = ALLOWED_MEDIA_EXTENSIONS.has(path.extname(file.name).toLowerCase())
    ? path.extname(file.name).toLowerCase()
    : ".media";
  const inputPath = path.join(tempDir, `source${extension}`);
  await fs.writeFile(inputPath, new Uint8Array(await file.arrayBuffer()));

  return {
    inputPath,
    title: titleFromFilename(file.name),
    mediaType: file.type.startsWith("audio/") ? "audio" : "video",
    duration: 0,
  };
}

/**
 * Downloads the audio of a supported public link.
 *
 * The URL passes platform validation and an SSRF check before yt-dlp sees it,
 * and is placed after `--` so it can never be read as an option.
 */
export async function prepareLinkedMedia(
  url: unknown,
  tempDir: string,
  ytdlp: Command | null,
  unavailableMessage: string,
): Promise<PreparedMedia> {
  const validated = assertValidMediaUrl(url);
  const safeUrl = await assertSafeUrl(validated.url);

  if (!ytdlp) {
    throw new MediaFlowError("TRANSCRIPTION_UNAVAILABLE", unavailableMessage);
  }

  const result = await runProcess(
    ytdlp.bin,
    [
      ...ytdlp.prefixArgs,
      "--no-playlist",
      "--no-warnings",
      "--no-simulate",
      "--format",
      "bestaudio/best",
      "--max-filesize",
      `${config.transcribeMaxFileSizeMb}M`,
      "--match-filter",
      `duration <= ${config.transcribeMaxDurationSeconds}`,
      "--print",
      "%(title)s",
      "--print",
      "%(duration)s",
      "--output",
      path.join(tempDir, "source.%(ext)s"),
      "--",
      safeUrl.toString(),
    ],
    config.engineDownloadTimeoutMs,
  );

  if (result.timedOut) {
    throw new MediaFlowError("REQUEST_TIMEOUT", "The linked media took too long to download.");
  }
  if (result.code !== 0) {
    throw new MediaFlowError(
      "DOWNLOAD_FAILED",
      "The linked media could not be accessed. Confirm it is public and try again.",
    );
  }

  const files = await fs.readdir(tempDir);
  const sourceName = files.find(
    (name) => name.startsWith("source.") && !name.endsWith(".part") && !name.endsWith(".ytdl"),
  );
  if (!sourceName) {
    throw new MediaFlowError("DOWNLOAD_FAILED", "No playable audio was found at that link.");
  }

  const inputPath = path.join(tempDir, sourceName);
  const stat = await fs.stat(inputPath);
  if (stat.size > config.transcribeMaxFileSizeMb * 1024 * 1024) {
    throw new MediaFlowError(
      "FILE_TOO_LARGE",
      `Linked media is limited to ${config.transcribeMaxFileSizeMb} MB.`,
    );
  }

  const lines = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const printedDuration = Number(lines.at(-1));

  return {
    inputPath,
    title: (lines.length > 1 ? lines.slice(0, -1).join(" ") : "Online media") || "Online media",
    mediaType: "video",
    duration: Number.isFinite(printedDuration) ? printedDuration : 0,
  };
}

/**
 * Fetches subtitles the platform already publishes for a link.
 *
 * When they exist these carry real, human-or-platform-aligned timings, which
 * are far more accurate than anything derived from fixed windows — so the
 * subtitle tool prefers them and only falls back to generating its own.
 * Returns null when none are available; that is an expected outcome, not an
 * error.
 */
export async function fetchPlatformSubtitles(
  url: unknown,
  tempDir: string,
  ytdlp: Command | null,
): Promise<string | null> {
  if (!ytdlp) return null;

  const validated = assertValidMediaUrl(url);
  const safeUrl = await assertSafeUrl(validated.url);
  const subsDir = path.join(tempDir, "subs");
  await fs.mkdir(subsDir, { recursive: true });

  const result = await runProcess(
    ytdlp.bin,
    [
      ...ytdlp.prefixArgs,
      "--no-playlist",
      "--no-warnings",
      "--skip-download",
      "--write-subs",
      "--write-auto-subs",
      "--sub-format",
      "vtt/srt/best",
      "--convert-subs",
      "vtt",
      "--output",
      path.join(subsDir, "subs.%(ext)s"),
      "--",
      safeUrl.toString(),
    ],
    Math.min(config.engineTimeoutMs, 60_000),
  );

  if (result.timedOut || result.code !== 0) return null;

  const files = await fs.readdir(subsDir).catch(() => []);
  const subtitleFile = files.find((name) => name.endsWith(".vtt") || name.endsWith(".srt"));
  if (!subtitleFile) return null;

  const contents = await fs.readFile(path.join(subsDir, subtitleFile), "utf8").catch(() => "");
  return contents.trim() ? contents : null;
}

export interface MediaInfo {
  duration: number;
  hasAudio: boolean;
}

/** Reads duration and confirms an audio stream exists before any AI spend. */
export async function probeMedia(ffprobe: string, inputPath: string): Promise<MediaInfo> {
  const result = await runProcess(
    ffprobe,
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration:stream=codec_type",
      "-of",
      "json",
      inputPath,
    ],
    20_000,
  );

  if (result.code !== 0) {
    throw new MediaFlowError("MEDIA_TYPE_UNKNOWN", "The media file could not be read.");
  }

  try {
    const data = JSON.parse(result.stdout) as {
      format?: { duration?: string };
      streams?: Array<{ codec_type?: string }>;
    };
    const duration = Number(data.format?.duration);
    return {
      duration: Number.isFinite(duration) ? duration : 0,
      hasAudio: data.streams?.some((stream) => stream.codec_type === "audio") ?? false,
    };
  } catch {
    throw new MediaFlowError("MEDIA_TYPE_UNKNOWN", "The media metadata could not be read.");
  }
}

/**
 * Extracts speech audio and splits it into fixed windows.
 *
 * 16 kHz mono MP3 is ample for speech and keeps each window small enough to send
 * inline. The window length is a parameter because transcription wants long
 * windows for fluency while subtitles want short ones to bound timing drift.
 */
export async function createAudioWindows(
  ffmpeg: string,
  inputPath: string,
  tempDir: string,
  windowSeconds: number,
): Promise<string[]> {
  const result = await runProcess(
    ffmpeg,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-map",
      "0:a:0",
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "64k",
      "-f",
      "segment",
      "-segment_time",
      String(windowSeconds),
      "-reset_timestamps",
      "1",
      "-y",
      path.join(tempDir, "chunk-%04d.mp3"),
    ],
    config.engineDownloadTimeoutMs,
  );

  if (result.timedOut) {
    throw new MediaFlowError("REQUEST_TIMEOUT", "Audio extraction took too long.");
  }
  if (result.code !== 0) {
    throw new MediaFlowError(
      "MEDIA_TYPE_UNKNOWN",
      "The file does not contain a readable audio track.",
    );
  }

  const windows = (await fs.readdir(tempDir))
    .filter((name) => /^chunk-\d+\.mp3$/.test(name))
    .sort()
    .map((name) => path.join(tempDir, name));

  if (windows.length === 0) {
    throw new MediaFlowError("MEDIA_TYPE_UNKNOWN", "No speech audio could be extracted.");
  }
  return windows;
}
