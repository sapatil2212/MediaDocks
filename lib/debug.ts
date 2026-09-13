/**
 * Development-only resolver tracing.
 *
 * Enabled with DEBUG_RESOLVER=true and never active in production. Only
 * structural facts are logged (status codes, sizes, which metadata keys were
 * found). Never page contents, request headers, cookies or credentials.
 */
const enabled = process.env.DEBUG_RESOLVER === "true" && process.env.NODE_ENV !== "production";

export const debugResolverEnabled = enabled;

export type DebugStep =
  | "RESOLVE"
  | "VALIDATION"
  | "PLATFORM"
  | "TYPE"
  | "REDIRECT"
  | "RESOLVER"
  | "FETCH"
  | "RESPONSE"
  | "PARSE"
  | "MEDIA"
  | "PERSIST"
  | "RESULT"
  | "ERROR";

export function debugLog(step: DebugStep, detail: Record<string, unknown> | string): void {
  if (!enabled) return;
  const body =
    typeof detail === "string" ? detail : Object.entries(detail).map(([k, v]) => `${k}=${format(v)}`).join(" ");
  console.log(`[${step}] ${body}`);
}

function format(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map((v) => String(v)).join(",")}]`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Collects the same trace for the dev resolver-test page. */
export class DebugTrace {
  private readonly entries: Array<{ step: DebugStep; detail: string; at: number }> = [];
  private readonly startedAt = Date.now();

  add(step: DebugStep, detail: Record<string, unknown> | string): void {
    debugLog(step, detail);
    this.entries.push({
      step,
      detail: typeof detail === "string" ? detail : JSON.stringify(detail),
      at: Date.now() - this.startedAt,
    });
  }

  toJSON() {
    return this.entries;
  }
}
