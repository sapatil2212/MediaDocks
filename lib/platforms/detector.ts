import { MediaFlowError } from "@/lib/errors";
import type { Platform, PlatformDetection } from "./types";

/**
 * Params that only carry analytics/referral data. Anything that identifies the
 * content (`v`, `list`, `story_fbid`, ...) is deliberately left untouched.
 */
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "igsh",
  "igshid",
  "fbclid",
  "gclid",
  "mibextid",
  "ref",
  "ref_src",
  "ref_url",
  "source",
  "feature",
  "si",
  "s",
  "t",
]);

export interface DetectionResult extends PlatformDetection {
  normalizedUrl: string | null;
}

/**
 * Normalizes protocol, hostname casing, trailing slash and tracking params.
 * Throws MediaFlowError("INVALID_URL") for anything that is not parseable.
 */
export function normalizeUrl(rawUrl: string): string {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    throw new MediaFlowError("INVALID_URL", "URL cannot be empty.");
  }

  let candidate = rawUrl.trim();
  if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new MediaFlowError("INVALID_URL", "That URL is malformed.");
  }

  if (!parsed.hostname) {
    throw new MediaFlowError("INVALID_URL", "That URL has no hostname.");
  }

  // URL already lowercases protocol and hostname; keep the path as-is because
  // platform slugs and shortcodes are case sensitive.
  const kept = new URLSearchParams();
  parsed.searchParams.forEach((value, key) => {
    if (!TRACKING_PARAMS.has(key.toLowerCase())) kept.append(key, value);
  });

  const query = kept.toString();
  parsed.search = query ? `?${query}` : "";
  parsed.hash = "";

  if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }

  return parsed.toString();
}

/** Platform detection from an already parsed URL. */
export function detectPlatformFromUrl(url: URL): PlatformDetection {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.toLowerCase();

  // Instagram
  if (host === "instagram.com" || host === "m.instagram.com") {
    let typeHint = "post";
    if (path.startsWith("/reel/") || path.startsWith("/reels/")) typeHint = "reel";
    else if (path.startsWith("/tv/")) typeHint = "tv";
    else if (path.startsWith("/p/")) typeHint = "post";
    return { platform: "instagram", typeHint };
  }

  // YouTube
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtube-nocookie.com" ||
    host === "youtu.be"
  ) {
    let typeHint = "video";
    if (path.startsWith("/shorts/")) typeHint = "shorts";
    else if (path.startsWith("/embed/")) typeHint = "embed";
    else if (path.startsWith("/watch")) typeHint = "watch";
    return { platform: "youtube", typeHint };
  }

  // Pinterest (incl. country domains such as pinterest.co.uk)
  if (host === "pin.it" || host === "pinterest.com" || /(^|\.)pinterest\.[a-z.]{2,}$/.test(host)) {
    return { platform: "pinterest", typeHint: "pin" };
  }

  // Facebook
  if (
    host === "facebook.com" ||
    host === "m.facebook.com" ||
    host === "web.facebook.com" ||
    host === "fb.watch"
  ) {
    let typeHint = "video";
    if (path.startsWith("/reel/")) typeHint = "reel";
    else if (path.startsWith("/watch")) typeHint = "watch";
    else if (path.includes("/videos/")) typeHint = "video";
    else if (path.includes("/photo")) typeHint = "photo";
    return { platform: "facebook", typeHint };
  }

  // X / Twitter
  if (host === "x.com" || host === "twitter.com" || host === "mobile.twitter.com") {
    return { platform: "x", typeHint: "status" };
  }

  return { platform: null, typeHint: null };
}

/**
 * Normalizes and detects in one step. Never throws: an unusable URL simply
 * yields `platform: null`.
 */
export function detectPlatform(rawUrl: string): DetectionResult {
  let normalizedUrl: string;
  try {
    normalizedUrl = normalizeUrl(rawUrl);
  } catch {
    return { platform: null, typeHint: null, normalizedUrl: null };
  }

  const url = new URL(normalizedUrl);
  const protocol = url.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return { platform: null, typeHint: null, normalizedUrl };
  }

  return { ...detectPlatformFromUrl(url), normalizedUrl };
}

export const SUPPORTED_PLATFORMS: readonly Platform[] = [
  "instagram",
  "youtube",
  "pinterest",
  "facebook",
  "x",
];
