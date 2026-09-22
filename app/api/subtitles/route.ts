import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { classifyGeminiFailure, geminiApiKey, geminiModels, generateStructuredJson } from "@/lib/ai/gemini";
import { config } from "@/lib/config";
import { getEngineTools } from "@/lib/engine/binaries";
import { MediaFlowError, toMediaFlowError } from "@/lib/errors";
import { logRequest, newRequestId } from "@/lib/logger";
import {
  createAudioWindows,
  createRequestTempDir,
  fetchPlatformSubtitles,
  prepareLinkedMedia,
  prepareUploadedMedia,
  probeMedia,
  removeTempDir,
  sweepStaleTempDirs,
} from "@/lib/media/prepare";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limiter";
import {
  buildCuesForWindow,
  normalizeCues,
  parseSubtitleFile,
  subtitleCoverage,
  type SubtitleCue,
} from "@/src/lib/subtitles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

/**
 * Window length for generated cues.
 *
 * The speech model returns text for a window, not per-word timings, so a cue's
 * position is interpolated inside its window. Short windows keep that
 * interpolation error small; 18 seconds trades a few more model calls for
 * noticeably tighter sync than the 10-minute windows used for plain transcripts.
 */
const WINDOW_SECONDS = 18;
/** Ceiling on model calls per request, so one long upload cannot run away. */
const MAX_WINDOWS = 120;

export interface SubtitleResponse {
  title: string;
  cues: SubtitleCue[];
  duration: number;
  language: string | null;
  /** Where the timings came from, so the UI can be honest about accuracy. */
  timingSource: "platform" | "generated";
  windowSeconds: number;
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

function subtitleError(error: unknown): MediaFlowError {
  const failure = classifyGeminiFailure(error);
  if (failure.kind === "timeout") {
    return new MediaFlowError("REQUEST_TIMEOUT", "Subtitle generation timed out. Try a shorter video.");
  }
  if (failure.kind === "unavailable") {
    return new MediaFlowError(
      "TRANSCRIPTION_UNAVAILABLE",
      "Subtitle generation is temporarily unavailable. Please wait and try again.",
      failure.retryAfterSeconds ? { retryAfterSeconds: failure.retryAfterSeconds } : undefined,
    );
  }
  if (failure.kind === "misconfigured") {
    return new MediaFlowError(
      "TRANSCRIPTION_UNAVAILABLE",
      "The Gemini API key or model is not configured correctly.",
    );
  }
  return new MediaFlowError("TRANSCRIPTION_FAILED", "No speech could be recognised in this media.");
}

/** Transcribes one short window; empty windows are silence and are skipped. */
async function transcribeWindow(
  windowPath: string,
  apiKey: string,
  previousText: string,
): Promise<{ text: string; language: string | null }> {
  const audio = (await fs.readFile(windowPath)).toString("base64");

  const payload = await generateStructuredJson<{ text?: unknown; languageCode?: unknown }>(
    {
      parts: [
        {
          text: [
            "Transcribe the speech in this short audio clip verbatim, in its original language.",
            "Return only the words that are spoken. Do not add timestamps, speaker labels, commentary, or descriptions of non-speech sound.",
            "If the clip contains no intelligible speech, return an empty string for text.",
            previousText ? `For context, the previous clip ended with: ${previousText.slice(-200)}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
        { inline_data: { mime_type: "audio/mpeg", data: audio } },
      ],
      schema: {
        type: "OBJECT",
        properties: {
          text: { type: "STRING", description: "Verbatim speech, or an empty string for silence." },
          languageCode: { type: "STRING", description: "Detected ISO 639-1 language code." },
        },
        required: ["text", "languageCode"],
      },
      timeoutMs: config.transcribeTimeoutMs,
      models: geminiModels("GEMINI_TRANSCRIPTION_MODEL"),
      maxOutputTokens: 2_048,
    },
    apiKey,
  );

  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  const language = typeof payload.languageCode === "string" ? payload.languageCode.trim() : "";
  return { text, language: language || null };
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const requestId = newRequestId();
  let tempDir: string | null = null;

  try {
    checkRateLimit(clientIpFrom(req.headers), "transcribe");

    const isMultipart = (req.headers.get("content-type") || "").includes("multipart/form-data");
    const linkBody = isMultipart
      ? null
      : ((await req.json().catch(() => null)) as { url?: unknown } | null);

    if (!isMultipart && !linkBody?.url) {
      throw new MediaFlowError("INVALID_URL", "Provide a video file or a public link.");
    }

    const tools = await getEngineTools();
    if (!tools.ffmpeg || !tools.ffprobe) {
      throw new MediaFlowError(
        "TRANSCRIPTION_UNAVAILABLE",
        "Subtitle generation is unavailable because FFmpeg and ffprobe are required.",
      );
    }

    const apiKey = geminiApiKey();

    await sweepStaleTempDirs();
    tempDir = await createRequestTempDir();

    // Prefer subtitles the platform already publishes: their timings are real
    // rather than interpolated, so they sync far better than anything generated.
    if (!isMultipart) {
      const existing = await fetchPlatformSubtitles(linkBody?.url, tempDir, tools.ytdlp).catch(
        () => null,
      );
      if (existing) {
        const cues = normalizeCues(parseSubtitleFile(existing));
        if (cues.length > 0) {
          const response: SubtitleResponse = {
            title: "Subtitles from source",
            cues,
            duration: subtitleCoverage(cues),
            language: null,
            timingSource: "platform",
            windowSeconds: 0,
          };
          logRequest({
            requestId,
            endpoint: "POST /api/subtitles",
            durationMs: Date.now() - startedAt,
            success: true,
          });
          return NextResponse.json(response, { headers: NO_STORE_HEADERS });
        }
      }
    }

    if (!apiKey) {
      throw new MediaFlowError(
        "TRANSCRIPTION_UNAVAILABLE",
        "Subtitle generation is not configured on this server. Set the Gemini API key to enable it.",
      );
    }

    const prepared = isMultipart
      ? await prepareUploadedMedia(req, tempDir)
      : await prepareLinkedMedia(
          linkBody?.url,
          tempDir,
          tools.ytdlp,
          "Link support is unavailable because the media extractor is not installed.",
        );

    const info = await probeMedia(tools.ffprobe, prepared.inputPath);
    if (!info.hasAudio) {
      throw new MediaFlowError("MEDIA_TYPE_UNKNOWN", "This media has no audio track to caption.");
    }
    const duration = info.duration || prepared.duration;
    if (duration > config.transcribeMaxDurationSeconds) {
      throw new MediaFlowError(
        "FILE_TOO_LARGE",
        `Media longer than ${Math.floor(config.transcribeMaxDurationSeconds / 60)} minutes is not supported.`,
      );
    }

    const windows = await createAudioWindows(
      tools.ffmpeg,
      prepared.inputPath,
      tempDir,
      WINDOW_SECONDS,
    );
    if (windows.length > MAX_WINDOWS) {
      throw new MediaFlowError(
        "FILE_TOO_LARGE",
        `This media is too long to caption in one request (about ${Math.round(
          (MAX_WINDOWS * WINDOW_SECONDS) / 60,
        )} minutes is the limit).`,
      );
    }

    const cues: SubtitleCue[] = [];
    let detectedLanguage: string | null = null;
    let previousText = "";
    let lastFailure: unknown = null;

    for (let index = 0; index < windows.length; index += 1) {
      const windowStart = index * WINDOW_SECONDS;
      const windowEnd = Math.min(duration || (index + 1) * WINDOW_SECONDS, (index + 1) * WINDOW_SECONDS);

      try {
        const { text, language } = await transcribeWindow(windows[index], apiKey, previousText);
        detectedLanguage ||= language;
        if (!text) continue; // silence, so no cue is emitted for this window

        previousText = text;
        cues.push(...buildCuesForWindow(text, windowStart, windowEnd, `w${index + 1}`));
      } catch (error) {
        // One bad window must not discard the rest of the video; the cause is
        // kept so a total failure can still be reported accurately.
        lastFailure = error;
      }
    }

    if (cues.length === 0) {
      throw lastFailure
        ? subtitleError(lastFailure)
        : new MediaFlowError("TRANSCRIPTION_FAILED", "No speech was detected in this media.");
    }

    const response: SubtitleResponse = {
      title: prepared.title,
      cues: normalizeCues(cues),
      duration: duration || subtitleCoverage(cues),
      language: detectedLanguage,
      timingSource: "generated",
      windowSeconds: WINDOW_SECONDS,
    };

    logRequest({
      requestId,
      endpoint: "POST /api/subtitles",
      durationMs: Date.now() - startedAt,
      success: true,
    });

    return NextResponse.json(response, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const safeError = toMediaFlowError(error);
    logRequest({
      requestId,
      endpoint: "POST /api/subtitles",
      durationMs: Date.now() - startedAt,
      success: false,
      errorCode: safeError.code,
    });
    return jsonError(safeError, requestId);
  } finally {
    if (tempDir) {
      await removeTempDir(tempDir).catch(() => {
        console.warn(`[subtitles:${requestId}] Temp cleanup deferred to the stale sweeper.`);
      });
    }
  }
}
