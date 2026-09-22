import crypto from "crypto";
import { config } from "@/lib/config";
import { MediaFlowError } from "@/lib/errors";

type Action = "resolve" | "download" | "transcribe";

/**
 * In-memory sliding window, scoped to a single instance.
 *
 * No IP address is ever stored: the key is a truncated hash. Nothing is written
 * to MySQL. If MediaFlow is ever run behind multiple instances this is where a
 * shared store (e.g. Redis) would be introduced — it is not needed yet.
 */
const hits = new Map<string, number[]>();
let lastSweep = Date.now();

function keyFor(ip: string, action: Action): string {
  const digest = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
  return `${action}:${digest}`;
}

function sweep(now: number, windowMs: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, timestamps] of hits) {
    const latest = timestamps[timestamps.length - 1] ?? 0;
    if (now - latest > windowMs) hits.delete(key);
  }
}

export function checkRateLimit(ip: string, action: Action): void {
  const limit =
    action === "resolve"
      ? config.resolveLimit
      : action === "download"
        ? config.downloadLimit
        : config.transcribeLimit;
  const windowSeconds =
    action === "resolve"
      ? config.resolveWindowSeconds
      : action === "download"
        ? config.downloadWindowSeconds
        : config.transcribeWindowSeconds;
  const windowMs = windowSeconds * 1000;
  const now = Date.now();

  sweep(now, windowMs);

  const key = keyFor(ip, action);
  const recent = (hits.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= limit) {
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    hits.set(key, recent);
    throw new MediaFlowError("RATE_LIMITED", "Please wait a moment and try again.", {
      retryAfterSeconds,
    });
  }

  recent.push(now);
  hits.set(key, recent);
}

/** Client IP for rate limiting only. Never logged, never persisted. */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "127.0.0.1";
}

/** Test helper. */
export function resetRateLimits(): void {
  hits.clear();
}
