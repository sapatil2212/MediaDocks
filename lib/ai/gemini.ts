/**
 * Minimal Gemini client for structured JSON generation.
 *
 * Extracted from the transcription route so the summarizer reuses the same
 * proven behaviour instead of duplicating it: a primary model with a lower-cost
 * fallback, one shared deadline across attempts (so two failures cannot consume
 * double the configured timeout), and failure classification that keeps the
 * most actionable error rather than simply the last one.
 *
 * The API key is read from the server environment only and sent in a header —
 * never placed in a URL, logged, or exposed to the browser.
 */

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiProviderError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfterSeconds?: number,
    readonly timedOut = false,
  ) {
    super("Gemini request failed.");
    this.name = "GeminiProviderError";
  }
}

export type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

export interface GeminiRequest {
  parts: GeminiPart[];
  /** Response schema, so the model returns parseable JSON rather than prose. */
  schema: Record<string, unknown>;
  /** Total budget shared across every model attempt. */
  timeoutMs: number;
  models?: string[];
  temperature?: number;
  maxOutputTokens?: number;
}

interface GeminiApiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

/** The configured key, or null when the feature should report itself unconfigured. */
export function geminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY?.trim() || null;
}

/**
 * Primary model then fallback, de-duplicated.
 *
 * `primaryEnvVar` lets each feature pin its own model while still sharing the
 * fallback, which is usually the cheaper/free-tier model.
 */
export function geminiModels(primaryEnvVar = "GEMINI_TRANSCRIPTION_MODEL"): string[] {
  const primary = process.env[primaryEnvVar]?.trim() || "gemini-3.8-flash";
  const fallback = process.env.GEMINI_FALLBACK_MODEL?.trim() || "gemini-3.1-flash-lite";
  return Array.from(new Set([primary, fallback]));
}

async function callModel<T>(model: string, request: GeminiRequest, apiKey: string, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: request.parts }],
        generationConfig: {
          temperature: request.temperature ?? 0,
          maxOutputTokens: request.maxOutputTokens ?? 16_384,
          responseMimeType: "application/json",
          responseSchema: request.schema,
        },
      }),
      signal: controller.signal,
    });
  } catch (error) {
    throw new GeminiProviderError(0, undefined, error instanceof Error && error.name === "AbortError");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const retryAfter = Number(response.headers.get("retry-after"));
    throw new GeminiProviderError(
      response.status,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    );
  }

  let data: GeminiApiResponse;
  try {
    data = (await response.json()) as GeminiApiResponse;
  } catch {
    throw new GeminiProviderError(502);
  }

  const rawText =
    data.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text?.trim() || "")
      .find(Boolean) || "";
  if (!rawText) throw new GeminiProviderError(422);

  // Some responses still arrive fenced despite responseMimeType.
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new GeminiProviderError(502);
  }
}

/**
 * Runs the request against each model in turn until one returns parseable JSON.
 *
 * Throws a `GeminiProviderError` carrying the most actionable failure. Callers
 * map that onto their own domain error codes via `classifyGeminiFailure`.
 */
export async function generateStructuredJson<T>(request: GeminiRequest, apiKey: string): Promise<T> {
  const models = request.models?.length ? request.models : geminiModels();
  const deadline = Date.now() + request.timeoutMs;
  const failures: GeminiProviderError[] = [];

  for (const model of models) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      failures.push(new GeminiProviderError(0, undefined, true));
      break;
    }
    try {
      return await callModel<T>(model, request, apiKey, remaining);
    } catch (error) {
      const failure = error instanceof GeminiProviderError ? error : new GeminiProviderError(502);
      failures.push(failure);
      // A different model cannot repair an invalid or unauthorized key.
      if (failure.status === 401 || failure.status === 403) break;
    }
  }

  throw (
    failures.find((failure) => failure.status === 401 || failure.status === 403) ||
    failures.find((failure) => failure.timedOut) ||
    failures.find((failure) => failure.status === 429) ||
    failures.at(-1) ||
    new GeminiProviderError(502)
  );
}

export type GeminiFailureKind = "timeout" | "unavailable" | "misconfigured" | "empty";

export interface GeminiFailure {
  kind: GeminiFailureKind;
  retryAfterSeconds?: number;
}

/**
 * Translates a provider failure into an intent the caller can act on.
 *
 * Keeping this separate from HTTP codes lets each feature phrase the message in
 * its own terms while classifying consistently.
 */
export function classifyGeminiFailure(error: unknown): GeminiFailure {
  if (!(error instanceof GeminiProviderError)) return { kind: "unavailable" };
  if (error.timedOut) return { kind: "timeout" };

  const { status } = error;
  if (status === 0 || status === 408 || status === 429 || status >= 500) {
    return { kind: "unavailable", retryAfterSeconds: error.retryAfterSeconds };
  }
  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return { kind: "misconfigured" };
  }
  return { kind: "empty" };
}
