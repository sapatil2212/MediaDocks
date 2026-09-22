import { spawn } from "child_process";
import crypto from "crypto";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { classifyGeminiFailure, geminiApiKey, geminiModels, generateStructuredJson } from "@/lib/ai/gemini";
import { config } from "@/lib/config";
import { assertSafeUrl } from "@/lib/download/security";
import { getEngineTools, type Command } from "@/lib/engine/binaries";
import { MediaFlowError, toMediaFlowError } from "@/lib/errors";
import { logRequest, newRequestId } from "@/lib/logger";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limiter";
import { assertValidMediaUrl } from "@/lib/validation/url";
import {
  formatTime,
  SUPPORTED_LANGUAGES,
  type TranscriptSegment,
  type TranscriptionResult,
} from "@/src/lib/transcribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};
const ALLOWED_EXTENSIONS = new Set([
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
]);
const CHUNK_SECONDS = 10 * 60;

// Keep the host temp path opaque to Next's standalone file tracer. Otherwise a
// Windows build can incorrectly treat C:\\Users\\...\\Temp as a bundle asset.
const runtimeOs = os as unknown as Record<string, unknown>;
function runtimeTempRoot(): string {
  const getTempDir = runtimeOs["tmpdir"];
  return typeof getTempDir === "function" ? (getTempDir as () => string)() : ".";
}

interface ProcessResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

interface PreparedMedia {
  inputPath: string;
  title: string;
  mediaType: "video" | "audio";
  duration: number;
}

interface GeminiTranscriptPayload {
  text?: unknown;
  language?: unknown;
  languageCode?: unknown;
}

function jsonError(error: MediaFlowError, requestId: string) {
  const retryAfter = error.details?.retryAfterSeconds;
  return NextResponse.json(
    { error: error.message, code: error.code, requestId },
    {
      status: error.statusCode,
      headers: {
        ...NO_STORE_HEADERS,
        ...(typeof retryAfter === "number" ? { "Retry-After": String(retryAfter) } : {}),
      },
    },
  );
}

function runProcess(bin: string, args: string[], timeoutMs: number): Promise<ProcessResult> {
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
      // Normally `close` resolves this after all stdio and descendants exit.
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

async function removeTempDir(tempDir: string): Promise<void> {
  await fs.rm(tempDir, {
    recursive: true,
    force: true,
    maxRetries: 4,
    retryDelay: 150,
  });
}

async function sweepStaleTempDirs(): Promise<void> {
  const tempRoot = runtimeTempRoot();
  const entries = await fs.readdir(tempRoot, { withFileTypes: true }).catch(() => []);
  const staleBefore = Date.now() - 60 * 60 * 1000;

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("mediadocks-transcribe-"))
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
  const withoutExtension = path.basename(filename, path.extname(filename)).trim();
  return withoutExtension || "Uploaded media";
}

function isAllowedUpload(file: File): boolean {
  const extension = path.extname(file.name).toLowerCase();
  return (
    ALLOWED_EXTENSIONS.has(extension) ||
    file.type.startsWith("audio/") ||
    file.type.startsWith("video/")
  );
}

async function prepareUpload(req: NextRequest, tempDir: string): Promise<PreparedMedia> {
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
    throw new MediaFlowError("MEDIA_TYPE_UNKNOWN", "Select a video or audio file to transcribe.");
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

  const extension = ALLOWED_EXTENSIONS.has(path.extname(file.name).toLowerCase())
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

async function prepareUrl(
  req: NextRequest,
  tempDir: string,
  ytdlp: Command | null,
): Promise<PreparedMedia> {
  const payload = (await req.json().catch(() => null)) as { url?: unknown } | null;
  const validated = assertValidMediaUrl(payload?.url);
  const safeUrl = await assertSafeUrl(validated.url);

  if (!ytdlp) {
    throw new MediaFlowError(
      "TRANSCRIPTION_UNAVAILABLE",
      "Link transcription is temporarily unavailable because the media extractor is not installed.",
    );
  }

  const outputTemplate = path.join(tempDir, "source.%(ext)s");
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
      outputTemplate,
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
  const title = lines.length > 1 ? lines.slice(0, -1).join(" ") : "Online media";

  return {
    inputPath,
    title: title || "Online media",
    mediaType: "video",
    duration: Number.isFinite(printedDuration) ? printedDuration : 0,
  };
}

async function probeMedia(
  ffprobe: string,
  inputPath: string,
): Promise<{ duration: number; hasAudio: boolean }> {
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

async function createAudioChunks(
  ffmpeg: string,
  inputPath: string,
  tempDir: string,
): Promise<string[]> {
  const chunkTemplate = path.join(tempDir, "chunk-%03d.mp3");
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
      String(CHUNK_SECONDS),
      "-reset_timestamps",
      "1",
      "-y",
      chunkTemplate,
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

  const chunks = (await fs.readdir(tempDir))
    .filter((name) => /^chunk-\d+\.mp3$/.test(name))
    .sort()
    .map((name) => path.join(tempDir, name));
  if (chunks.length === 0) {
    throw new MediaFlowError("MEDIA_TYPE_UNKNOWN", "No speech audio could be extracted.");
  }
  return chunks;
}

async function transcribeChunk(
  chunkPath: string,
  apiKey: string,
  previousContext: string,
): Promise<{ text: string; language: string | null }> {
  const audioBase64 = (await fs.readFile(chunkPath)).toString("base64");
  const prompt = [
    "Transcribe every spoken word in this audio verbatim and in its original language.",
    "Preserve punctuation, names, numbers, accents, and code-switching. Do not translate, summarize, add timestamps, label speakers, or describe non-speech audio.",
    "Return only the requested JSON object.",
    previousContext ? `Context from the end of the previous audio chunk: ${previousContext.slice(-500)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  let payload: GeminiTranscriptPayload;
  try {
    payload = await generateStructuredJson<GeminiTranscriptPayload>(
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "audio/mpeg", data: audioBase64 } },
        ],
        schema: {
          type: "OBJECT",
          properties: {
            text: { type: "STRING", description: "The complete verbatim transcript only." },
            language: { type: "STRING", description: "Detected spoken language name." },
            languageCode: { type: "STRING", description: "Detected ISO 639-1 language code." },
          },
          required: ["text", "language", "languageCode"],
        },
        timeoutMs: config.transcribeTimeoutMs,
        models: geminiModels("GEMINI_TRANSCRIPTION_MODEL"),
      },
      apiKey,
    );
  } catch (error) {
    const failure = classifyGeminiFailure(error);
    if (failure.kind === "timeout") {
      throw new MediaFlowError("REQUEST_TIMEOUT", "The Gemini transcription service timed out.");
    }
    if (failure.kind === "unavailable") {
      throw new MediaFlowError(
        "TRANSCRIPTION_UNAVAILABLE",
        "Gemini transcription is temporarily unavailable. Please wait and try again.",
        failure.retryAfterSeconds ? { retryAfterSeconds: failure.retryAfterSeconds } : undefined,
      );
    }
    if (failure.kind === "misconfigured") {
      throw new MediaFlowError(
        "TRANSCRIPTION_UNAVAILABLE",
        "The Gemini API key or transcription model is not configured correctly.",
      );
    }
    throw new MediaFlowError("TRANSCRIPTION_FAILED", "No spoken words were detected in the media.");
  }

  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  if (!text) {
    throw new MediaFlowError("TRANSCRIPTION_FAILED", "No spoken words were detected in the media.");
  }

  const languageCode = typeof payload.languageCode === "string" ? payload.languageCode.trim() : "";
  const language = typeof payload.language === "string" ? payload.language.trim() : "";
  return { text, language: languageCode || language || null };
}

function countWords(text: string): number {
  try {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "word" }).segment(text)).filter(
      (part) => part.isWordLike,
    ).length;
  } catch {
    return text.split(/\s+/u).filter(Boolean).length;
  }
}

function languageDisplayName(detected: string | null): { code: string; name: string } {
  if (!detected) return { code: "auto", name: "Automatically detected" };
  const normalized = detected.toLowerCase().trim();
  const isoCode = normalized.match(/^([a-z]{2})(?:[-_]|$)/)?.[1];
  const match = SUPPORTED_LANGUAGES.find(
    (item) => item.code === isoCode || item.name.toLowerCase().startsWith(normalized),
  );
  return match
    ? { code: match.code, name: `${match.name} (detected)` }
    : { code: "auto", name: "Automatically detected" };
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const requestId = newRequestId();
  let tempDir: string | null = null;

  try {
    checkRateLimit(clientIpFrom(req.headers), "transcribe");

    const apiKey = geminiApiKey();
    if (!apiKey) {
      throw new MediaFlowError(
        "TRANSCRIPTION_UNAVAILABLE",
        "Video transcription is not configured. Add GEMINI_API_KEY to the server .env file.",
      );
    }

    const tools = await getEngineTools();
    if (!tools.ffmpeg || !tools.ffprobe) {
      throw new MediaFlowError(
        "TRANSCRIPTION_UNAVAILABLE",
        "Video transcription is temporarily unavailable because FFmpeg and ffprobe are required.",
      );
    }

    await sweepStaleTempDirs();
    tempDir = await fs.mkdtemp(path.join(runtimeTempRoot(), "mediadocks-transcribe-"));
    const isMultipart = (req.headers.get("content-type") || "").includes("multipart/form-data");
    const prepared = isMultipart
      ? await prepareUpload(req, tempDir)
      : await prepareUrl(req, tempDir, tools.ytdlp);

    const mediaInfo = await probeMedia(tools.ffprobe, prepared.inputPath);
    if (!mediaInfo.hasAudio) {
      throw new MediaFlowError("MEDIA_TYPE_UNKNOWN", "The media does not contain an audio track.");
    }
    const duration = mediaInfo.duration || prepared.duration;
    if (duration <= 0) {
      throw new MediaFlowError("MEDIA_TYPE_UNKNOWN", "The media duration could not be determined.");
    }
    if (duration > config.transcribeMaxDurationSeconds) {
      throw new MediaFlowError(
        "FILE_TOO_LARGE",
        `Media longer than ${Math.floor(config.transcribeMaxDurationSeconds / 60)} minutes is not supported.`,
      );
    }

    const chunkPaths = await createAudioChunks(tools.ffmpeg, prepared.inputPath, tempDir);
    const transcriptParts: string[] = [];
    const segments: TranscriptSegment[] = [];
    let detectedLanguage: string | null = null;

    for (let index = 0; index < chunkPaths.length; index += 1) {
      const transcript = await transcribeChunk(
        chunkPaths[index],
        apiKey,
        transcriptParts.at(-1) || "",
      );
      transcriptParts.push(transcript.text);
      detectedLanguage ||= transcript.language;

      const start = index * CHUNK_SECONDS;
      const end = duration > 0 ? Math.min(duration, (index + 1) * CHUNK_SECONDS) : (index + 1) * CHUNK_SECONDS;
      segments.push({
        id: `part-${index + 1}`,
        start,
        end,
        startFormatted: formatTime(start),
        endFormatted: formatTime(end),
        speaker: "",
        text: transcript.text,
      });
    }

    const text = transcriptParts.join("\n\n").trim();
    const language = languageDisplayName(detectedLanguage);
    const result: TranscriptionResult = {
      id: `tr-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`,
      title: prepared.title,
      duration,
      durationFormatted: duration > 0 ? formatTime(duration) : "—",
      language: language.code,
      languageName: language.name,
      mode: "ai",
      wordCount: countWords(text),
      confidence: 0,
      mediaType: prepared.mediaType,
      text,
      segments,
    };

    logRequest({
      requestId,
      endpoint: "POST /api/transcribe",
      durationMs: Date.now() - startedAt,
      success: true,
    });

    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const safeError = toMediaFlowError(error);
    logRequest({
      requestId,
      endpoint: "POST /api/transcribe",
      durationMs: Date.now() - startedAt,
      success: false,
      errorCode: safeError.code,
    });
    return jsonError(safeError, requestId);
  } finally {
    if (tempDir) {
      await removeTempDir(tempDir).catch(() => {
        console.warn(`[transcribe:${requestId}] Temporary media cleanup will be retried by the stale-directory sweeper.`);
      });
    }
  }
}
