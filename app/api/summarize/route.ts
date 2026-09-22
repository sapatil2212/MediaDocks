import { NextRequest, NextResponse } from "next/server";
import { classifyGeminiFailure, geminiApiKey, geminiModels, generateStructuredJson } from "@/lib/ai/gemini";
import { config } from "@/lib/config";
import { MediaFlowError, toMediaFlowError } from "@/lib/errors";
import { logRequest, newRequestId } from "@/lib/logger";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limiter";
import {
  cleanList,
  cleanQaPairs,
  countWords,
  isSummarizable,
  isSummaryFormat,
  isSummaryLength,
  MIN_TRANSCRIPT_WORDS,
  splitForModel,
  type SummaryFormat,
  type SummaryLength,
  type SummaryResult,
} from "@/src/lib/summarize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

/** Hard ceiling on a request body. Beyond this the transcript is not text. */
const MAX_BODY_CHARS = 600_000;
/** Above this many sections, condense first rather than summarizing each one. */
const MAX_SECTIONS = 12;

interface SummaryPayload {
  title?: unknown;
  summary?: unknown;
  keyPoints?: unknown;
  actionItems?: unknown;
  qa?: unknown;
  language?: unknown;
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

/** Maps a provider failure onto summarizer-specific messaging. */
function summaryError(error: unknown): MediaFlowError {
  const failure = classifyGeminiFailure(error);
  if (failure.kind === "timeout") {
    return new MediaFlowError("REQUEST_TIMEOUT", "The summarizer timed out. Try a shorter recording.");
  }
  if (failure.kind === "unavailable") {
    return new MediaFlowError(
      "SUMMARY_UNAVAILABLE",
      "The summarizer is temporarily unavailable. Please wait and try again.",
      failure.retryAfterSeconds ? { retryAfterSeconds: failure.retryAfterSeconds } : undefined,
    );
  }
  if (failure.kind === "misconfigured") {
    return new MediaFlowError(
      "SUMMARY_UNAVAILABLE",
      "The Gemini API key or summary model is not configured correctly.",
    );
  }
  return new MediaFlowError("SUMMARY_FAILED", "The summarizer could not produce a summary for this recording.");
}

const LENGTH_GUIDANCE: Record<SummaryLength, string> = {
  short: "Keep the prose summary to 2-3 sentences and at most 5 list entries.",
  medium: "Keep the prose summary to 1-2 short paragraphs and at most 8 list entries.",
  detailed: "Write a thorough summary of 3-5 paragraphs and up to 14 list entries.",
};

const FORMAT_GUIDANCE: Record<SummaryFormat, string> = {
  brief: "Focus on the prose summary. Leave keyPoints, actionItems and qa empty.",
  keyPoints: "Populate keyPoints with the main ideas, one idea per entry. Also write the prose summary.",
  actionItems:
    "Populate actionItems with concrete tasks, decisions or follow-ups that were actually committed to, naming the owner when stated. If none were committed to, return an empty list rather than inventing any. Also write the prose summary.",
  qa: "Populate qa with the substantive questions raised and how they were answered in the recording. Also write the prose summary.",
};

const SUMMARY_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING", description: "A short descriptive title, at most 8 words." },
    summary: { type: "STRING", description: "Prose summary of the recording." },
    keyPoints: { type: "ARRAY", items: { type: "STRING" } },
    actionItems: { type: "ARRAY", items: { type: "STRING" } },
    qa: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { question: { type: "STRING" }, answer: { type: "STRING" } },
        required: ["question", "answer"],
      },
    },
    language: { type: "STRING", description: "Language of the transcript, as an ISO 639-1 code." },
  },
  required: ["title", "summary", "keyPoints", "actionItems", "qa", "language"],
} as const;

/**
 * Condenses one section of a long transcript.
 *
 * Summarizing each section separately and then summarizing those notes keeps
 * long recordings within a single prompt without silently truncating the middle
 * of the conversation, which is what a naive slice would do.
 */
async function condenseSection(section: string, apiKey: string, timeoutMs: number): Promise<string> {
  const payload = await generateStructuredJson<{ summary?: unknown }>(
    {
      parts: [
        {
          text: [
            "You are condensing one part of a longer transcript so it can be summarized as a whole.",
            "Write a factual digest of this part in its original language. Preserve names, numbers, decisions and unresolved questions.",
            "Do not add information that is not present. Return only the requested JSON.",
            "",
            "Transcript part:",
            section,
          ].join("\n"),
        },
      ],
      schema: {
        type: "OBJECT",
        properties: { summary: { type: "STRING" } },
        required: ["summary"],
      },
      timeoutMs,
      models: geminiModels("GEMINI_SUMMARY_MODEL"),
      maxOutputTokens: 4_096,
    },
    apiKey,
  );

  return typeof payload.summary === "string" ? payload.summary.trim() : "";
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const requestId = newRequestId();

  try {
    // Summarizing shares the transcription budget on purpose: both are paid AI
    // calls of similar cost, so one limit governs how fast they can be spent.
    checkRateLimit(clientIpFrom(req.headers), "transcribe");

    const body = (await req.json().catch(() => null)) as {
      text?: unknown;
      format?: unknown;
      length?: unknown;
    } | null;

    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) {
      throw new MediaFlowError("INVALID_URL", "Provide the transcript text to summarize.");
    }
    if (text.length > MAX_BODY_CHARS) {
      throw new MediaFlowError(
        "FILE_TOO_LARGE",
        "That transcript is too long to summarize in one request.",
      );
    }
    if (!isSummarizable(text)) {
      throw new MediaFlowError(
        "SUMMARY_FAILED",
        `There is not enough speech to summarize. At least ${MIN_TRANSCRIPT_WORDS} words are needed.`,
      );
    }

    const format: SummaryFormat = isSummaryFormat(body?.format) ? body.format : "brief";
    const length: SummaryLength = isSummaryLength(body?.length) ? body.length : "medium";

    // Readiness is checked after request validation on purpose: a malformed
    // request should get its own 4xx answer whether or not the provider happens
    // to be configured, otherwise the contract changes with deployment state.
    const apiKey = geminiApiKey();
    if (!apiKey) {
      throw new MediaFlowError(
        "SUMMARY_UNAVAILABLE",
        "Summarizing is not configured on this server. Set the Gemini API key to enable it.",
      );
    }

    // Long recordings: condense section by section, then summarize the notes.
    const sections = splitForModel(text);
    let material = text;
    if (sections.length > 1) {
      const budget = Math.max(20_000, Math.floor(config.transcribeTimeoutMs / 2));
      const digests: string[] = [];
      let lastSectionError: unknown = null;

      for (const section of sections.slice(0, MAX_SECTIONS)) {
        try {
          const digest = await condenseSection(section, apiKey, budget);
          if (digest) digests.push(digest);
        } catch (error) {
          // One unusable section must not discard the rest of the recording, but
          // the cause is kept so a total failure can be reported accurately
          // instead of as a generic "could not summarize".
          lastSectionError = error;
        }
      }

      if (digests.length === 0) {
        throw lastSectionError
          ? summaryError(lastSectionError)
          : new MediaFlowError(
              "SUMMARY_FAILED",
              "The summarizer could not read this transcript. Please try again.",
            );
      }
      material = digests.join("\n\n");
    }

    let payload: SummaryPayload;
    try {
      payload = await generateStructuredJson<SummaryPayload>(
        {
          parts: [
            {
              text: [
                "Summarize this transcript of a recording for someone who has not listened to it.",
                "Write in the same language as the transcript. Be faithful: never invent facts, names, numbers or commitments that are not present.",
                FORMAT_GUIDANCE[format],
                LENGTH_GUIDANCE[length],
                "Return only the requested JSON object.",
                "",
                "Transcript:",
                material,
              ].join("\n"),
            },
          ],
          schema: SUMMARY_SCHEMA as unknown as Record<string, unknown>,
          timeoutMs: config.transcribeTimeoutMs,
          models: geminiModels("GEMINI_SUMMARY_MODEL"),
          temperature: 0.2,
        },
        apiKey,
      );
    } catch (error) {
      throw summaryError(error);
    }

    const summary = typeof payload.summary === "string" ? payload.summary.trim() : "";
    if (!summary) {
      throw new MediaFlowError(
        "SUMMARY_FAILED",
        "The summarizer returned an empty summary. Please try again.",
      );
    }

    const languageRaw = typeof payload.language === "string" ? payload.language.trim() : "";
    const result: SummaryResult = {
      title: (typeof payload.title === "string" ? payload.title.trim() : "").slice(0, 120) || "Audio summary",
      summary,
      keyPoints: format === "keyPoints" ? cleanList(payload.keyPoints) : [],
      actionItems: format === "actionItems" ? cleanList(payload.actionItems) : [],
      qa: format === "qa" ? cleanQaPairs(payload.qa) : [],
      format,
      length,
      language: languageRaw.slice(0, 12) || null,
      sourceWords: countWords(text),
    };

    logRequest({
      requestId,
      endpoint: "POST /api/summarize",
      durationMs: Date.now() - startedAt,
      success: true,
    });

    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const safeError = toMediaFlowError(error);
    logRequest({
      requestId,
      endpoint: "POST /api/summarize",
      durationMs: Date.now() - startedAt,
      success: false,
      errorCode: safeError.code,
    });
    return jsonError(safeError, requestId);
  }
}
