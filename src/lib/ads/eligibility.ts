/**
 * Ad eligibility: the single source of truth for whether an ad script, a
 * consent tool or an ad slot may exist on a page.
 *
 * Rules: default deny, fail closed. Unknown, malformed or error-state input is
 * ineligible, and no exception can turn into "eligible". Pure functions only
 * (no React, no window), so everything here is unit tested.
 *
 * This module must not import guide text or platform copy: it ships in the root
 * layout's client bundle.
 */
import { REDIRECT_ALIASES } from "../redirect-aliases";
import {
  getAllGuideSlugs,
  getAllowlistedGuideSlugs,
  getDownloaderPaths,
} from "./allowlist-data";
import { adsEnabled, getArticleSlotId, isValidSlotId } from "./config";
import type { ConsentState } from "./consent";

export type { ConsentState } from "./consent";

export type RouteCategory =
  | "home"
  | "downloader"
  | "converter-tool"
  | "ai-tool"
  | "shortener"
  | "guide-article"
  | "guide-index"
  | "editorial"
  | "legal"
  | "admin"
  | "dev"
  | "api"
  | "error"
  | "not-found"
  | "redirect"
  | "unknown";

export interface RouteInfo {
  category: RouteCategory;
  cmpAllowed: boolean;
}

const CONVERTER_TOOLS: readonly string[] = [
  "/image-converter",
  "/image-resizer",
  "/background-remover",
  "/pdf-to-image",
  "/image-to-pdf",
  "/qr-code-generator",
  "/svg-to-png",
  "/base64-image",
  "/video-to-audio",
];

const AI_TOOLS: readonly string[] = [
  "/video-to-text",
  "/audio-to-text",
  "/audio-summarizer",
  "/add-subtitles-to-video",
];

const EDITORIAL_PAGES: readonly string[] = [
  "/about",
  "/contact",
  "/editorial-standards",
  "/how-it-works",
  "/faq",
];

const LEGAL_PAGES: readonly string[] = ["/privacy", "/terms", "/copyright"];

const MAX_PATH_LENGTH = 200;

/** Returns the pathname without query, hash or one trailing slash, or null if invalid. */
function normalizePath(input: unknown): string | null {
  if (typeof input !== "string") return null;
  if (input.length === 0 || input.length > MAX_PATH_LENGTH) return null;
  if (!input.startsWith("/") || input.startsWith("//")) return null;
  if (input.includes("..") || input.includes("\\") || input.includes("%")) return null;
  if (/[\u0000-\u001f\u007f]/.test(input)) return null;

  let path = input;
  const cut = path.search(/[?#]/);
  if (cut !== -1) path = path.slice(0, cut);
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path.length === 0 ? null : path;
}

function guideSlugOf(path: string): string | null {
  const prefix = "/guides/";
  if (!path.startsWith(prefix)) return null;
  const slug = path.slice(prefix.length);
  if (slug.length === 0 || slug.includes("/")) return null;
  return slug;
}

export function classifyPath(input: unknown): RouteInfo {
  try {
    const path = normalizePath(input);
    if (path === null) return { category: "unknown", cmpAllowed: false };

    const category = categorize(path);
    return { category, cmpAllowed: category === "guide-article" };
  } catch {
    return { category: "unknown", cmpAllowed: false };
  }
}

function categorize(path: string): RouteCategory {
  if (path === "/") return "home";
  if (path === "/api" || path.startsWith("/api/")) return "api";
  if (path.startsWith("/superadmin")) return "admin";
  if (path === "/dev" || path.startsWith("/dev/")) return "dev";
  if (path.startsWith("/s/")) return "shortener";
  if (path === "/url-shortener") return "shortener";
  if (path === "/guides") return "guide-index";

  const slug = guideSlugOf(path);
  if (slug !== null) {
    return getAllGuideSlugs().includes(slug) ? "guide-article" : "unknown";
  }

  if (getDownloaderPaths().includes(path)) return "downloader";
  if (CONVERTER_TOOLS.includes(path)) return "converter-tool";
  if (AI_TOOLS.includes(path)) return "ai-tool";
  if (EDITORIAL_PAGES.includes(path)) return "editorial";
  if (LEGAL_PAGES.includes(path)) return "legal";
  if (REDIRECT_ALIASES.some(([source]) => source === path)) return "redirect";
  return "unknown";
}

/** True only for a guide article whose slug is on the ad allowlist. Never throws. */
export function isAllowlistedGuide(pathname: unknown): boolean {
  try {
    const path = normalizePath(pathname);
    if (path === null) return false;
    if (categorize(path) !== "guide-article") return false;
    const slug = guideSlugOf(path);
    return slug !== null && getAllowlistedGuideSlugs().includes(slug);
  } catch {
    return false;
  }
}

/* ───────────────────────────────── decisions ──────────────────────────────── */

export interface AdInput {
  pathname: unknown;
  consent: ConsentState;
  denyMarkerPresent: boolean;
}

export interface AdDecision {
  eligible: boolean;
  category: RouteCategory;
  reason: string;
}

const DENIED_ERROR: AdDecision = { eligible: false, category: "unknown", reason: "error" };

/** The only function that can permit an ad script or an ad slot. */
export function decideAds(input: AdInput): AdDecision {
  try {
    const { category } = classifyPath(input?.pathname);
    let eligible = false;
    let reason = "denied";

    if (!adsEnabled()) {
      reason = "ads-disabled";
    } else if (input.denyMarkerPresent !== false) {
      reason = "deny-marker";
    } else if (input.consent !== "granted" && input.consent !== "not-required") {
      reason = "consent";
    } else if (!isAllowlistedGuide(input.pathname)) {
      reason = "not-allowlisted";
    } else if (!isValidSlotId(getArticleSlotId())) {
      reason = "no-slot";
    } else {
      eligible = true;
      reason = "allowlisted-guide";
    }
    return { eligible, category, reason };
  } catch {
    return DENIED_ERROR;
  }
}

export interface CmpInput {
  pathname: unknown;
  denyMarkerPresent: boolean;
}

/**
 * Decides only whether the consent tool may be installed. It never permits an
 * ad script and never reads consent (consent is what the tool reports).
 */
export function decideCmp(input: CmpInput): { load: boolean; category: RouteCategory } {
  try {
    const { category } = classifyPath(input?.pathname);
    const load =
      adsEnabled() &&
      isValidSlotId(getArticleSlotId()) &&
      input.denyMarkerPresent === false &&
      isAllowlistedGuide(input.pathname);
    return { load, category };
  } catch {
    return { load: false, category: "unknown" };
  }
}

/* ───────────────────────────────── runtime ────────────────────────────────── */

export interface RuntimeState {
  pathname: unknown;
  consent: ConsentState;
  /** Strict: only `false` can allow. */
  denyMarkerPresent: boolean;
  /** A consent adapter was installed in this document. */
  cmpInstalled: boolean;
  /** The AdSense script element was appended in this document. */
  adScriptLoaded: boolean;
}

export type RuntimeAction =
  | "none"
  | "install-cmp"
  | "load-ad-script"
  | "teardown"
  | "teardown-guarded";

function teardownFor(state: RuntimeState): RuntimeAction {
  // Only a deny marker on an allowlisted guide can loop (an error page that
  // renders on every load), so only that cause is rate limited. Navigation and
  // consent changes always reload because nothing third-party loads afterwards.
  if (isAllowlistedGuide(state.pathname) && state.denyMarkerPresent !== false) {
    return "teardown-guarded";
  }
  return "teardown";
}

/**
 * Sequencing for the ad runtime. Consent tool first, ad script only after
 * consent is reported, teardown only for what is actually loaded. Calls
 * decideCmp and decideAds internally; AdRuntime only executes the result.
 */
export function nextAction(state: RuntimeState): RuntimeAction {
  try {
    if (decideAds(state).eligible) {
      return state.adScriptLoaded ? "none" : "load-ad-script";
    }
    if (state.adScriptLoaded) return teardownFor(state);
    if (decideCmp(state).load) {
      return state.cmpInstalled ? "none" : "install-cmp";
    }
    if (state.cmpInstalled) return teardownFor(state);
    return "none";
  } catch {
    return state?.adScriptLoaded || state?.cmpInstalled ? "teardown" : "none";
  }
}

/**
 * True when something third-party is loaded and the page is no longer an
 * allowlisted guide. AdRuntime uses it to start teardown in the same commit as
 * a client navigation, without waiting a frame.
 */
export function needsSyncTeardown(state: RuntimeState): boolean {
  try {
    return (state.adScriptLoaded || state.cmpInstalled) && !isAllowlistedGuide(state.pathname);
  } catch {
    return Boolean(state?.adScriptLoaded || state?.cmpInstalled);
  }
}
