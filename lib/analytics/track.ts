import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { config } from "@/lib/config";

/**
 * Privacy-preserving usage measurement.
 *
 * MediaFlow advertises that it does not track people, and this module is built so
 * that stays true:
 *
 *   * IP addresses are never stored. They are mixed with a server-side secret and
 *     the calendar date, hashed, and truncated. The result identifies "a distinct
 *     visitor today" and nothing else — it cannot be reversed to an IP, and the
 *     same person produces a different hash tomorrow, so no cross-day profile can
 *     be built.
 *   * The URL a user pastes is never recorded. Only which platform it belonged to.
 *   * No cookie is set for measurement.
 *
 * Recording is strictly fail-soft: analytics must never break, slow or fail a
 * user's download.
 */

export type EventType = "page_view" | "resolve" | "download";
export type Device = "mobile" | "tablet" | "desktop" | "bot";

let warnedAboutSalt = false;

/**
 * Secret used to make visitor hashes unguessable.
 *
 * Without it, anyone could confirm whether a given IP visited by hashing it
 * themselves. A random per-process fallback keeps that property, at the cost of
 * unique-visitor counts restarting when the server does.
 */
function analyticsSalt(): string {
  const configured = process.env.ANALYTICS_SALT;
  if (configured) return configured;

  if (!warnedAboutSalt) {
    warnedAboutSalt = true;
    console.warn(
      "[analytics] ANALYTICS_SALT is not set. Using a random per-process salt, so " +
        "unique-visitor counts reset on restart. Set ANALYTICS_SALT to a long random " +
        "string to make them stable.",
    );
  }
  return (fallbackSalt ??= crypto.randomBytes(32).toString("hex"));
}
let fallbackSalt: string | undefined;

/** UTC day bucket, so a hash cannot follow someone across days. */
function dayBucket(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Anonymous per-day visitor digest. The user agent is included so two people
 * behind one NAT address are not collapsed into a single visitor.
 */
export function visitorHashFrom(ip: string, userAgent: string, now = new Date()): string {
  return crypto
    .createHash("sha256")
    .update(`${analyticsSalt()}|${dayBucket(now)}|${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

/** Coarse device bucket. Deliberately not a fingerprint. */
export function deviceFrom(userAgent: string): Device {
  const ua = userAgent.toLowerCase();
  if (!ua) return "desktop";
  if (/bot|crawl|spider|slurp|bingpreview|headless|lighthouse|curl|wget|python-requests/.test(ua)) {
    return "bot";
  }
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|windows phone/.test(ua)) return "mobile";
  return "desktop";
}

/** Referring host only — never the full referring URL, which can carry queries. */
export function referrerHostFrom(referer: string | null, selfHost: string): string | null {
  if (!referer) return null;
  try {
    const host = new URL(referer).hostname.replace(/^www\./, "");
    // Internal navigation is not a referral.
    return host && host !== selfHost.replace(/^www\./, "") ? host.slice(0, 191) : null;
  } catch {
    return null;
  }
}

export interface TrackInput {
  type: EventType;
  visitorHash: string;
  path?: string | undefined;
  platform?: string | undefined;
  mediaKind?: string | undefined;
  quality?: string | undefined;
  extension?: string | undefined;
  status?: "ok" | "error";
  errorCode?: string | undefined;
  durationMs?: number | undefined;
  bytes?: number | undefined;
  device?: Device | undefined;
  referrerHost?: string | null | undefined;
}

/** Clamps a value to the column width so a long input can never break an insert. */
function trim(value: string | undefined | null, max: number): string | null {
  if (!value) return null;
  return value.slice(0, max);
}

/**
 * Records one event. Never throws and never awaited on the hot path — a failed
 * insert (or a database that is simply down) must not surface to the user.
 */
export function trackEvent(input: TrackInput): void {
  if (!config.analyticsEnabled) return;
  // Crawlers would otherwise dominate the visitor numbers and make them useless.
  if (input.device === "bot") return;

  void prisma.analyticsEvent
    .create({
      data: {
        type: input.type,
        visitorHash: input.visitorHash,
        path: trim(input.path, 191),
        platform: trim(input.platform, 32),
        mediaKind: trim(input.mediaKind, 16),
        quality: trim(input.quality, 32),
        extension: trim(input.extension, 8),
        status: input.status ?? "ok",
        errorCode: trim(input.errorCode, 48),
        durationMs: input.durationMs ?? null,
        // Guard against overflowing a 32-bit signed column.
        bytes: input.bytes && input.bytes < 2_147_483_647 ? Math.round(input.bytes) : null,
        device: input.device ?? null,
        referrerHost: trim(input.referrerHost, 191),
      },
    })
    .catch(() => undefined);
}

/** Derives the anonymous request context shared by every event. */
export function requestContext(headers: Headers, ip: string, selfHost: string) {
  const userAgent = headers.get("user-agent") ?? "";
  return {
    visitorHash: visitorHashFrom(ip, userAgent),
    device: deviceFrom(userAgent),
    referrerHost: referrerHostFrom(headers.get("referer"), selfHost),
  };
}
