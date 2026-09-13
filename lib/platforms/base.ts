import { config } from "@/lib/config";
import { debugLog } from "@/lib/debug";
import { assertSafeUrl, isAllowedMediaHost } from "@/lib/download/security";
import { MediaFlowError } from "@/lib/errors";
import {
  detectMediaType,
  extensionFromUrl,
  fromMimeType,
  fromUrlExtension,
  isNonMediaContentType,
  normalizeMimeType,
  type MediaKind,
  type MediaTypeInfo,
} from "@/lib/media/detect-media-type";
import type { Platform, ResolvedMedia, ResolvedResult } from "./types";

export interface PlatformResolver {
  readonly platform: Platform;
  /** Cheap structural check: does this URL look like a resolvable item? */
  canHandle(url: URL): boolean;
  resolve(url: URL): Promise<ResolvedResult>;
}

/**
 * A plain, honest server identity. We do not rotate identities or otherwise try
 * to look like a browser to get around platform restrictions.
 */
export const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (compatible; MediaFlow/1.0; +https://github.com/mediaflow) Node.js";

/**
 * Response size ceiling for HTML. Measured against live pages: Pinterest emits
 * og:image around 1.09 MB into the document and YouTube around 0.68 MB, so a
 * small cap would silently drop real metadata.
 */
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_JSON_BYTES = 1024 * 1024;

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const HTML_TYPES = ["text/html", "application/xhtml+xml", "text/plain"];
const JSON_TYPES = ["application/json", "text/javascript", "application/javascript"];

export interface SafeFetchOptions {
  method?: "GET" | "HEAD";
  headers?: Record<string, string>;
  /** Restrict every hop to the media CDN allow-list. */
  requireMediaHost?: boolean;
  maxRedirects?: number;
  /** Label used in debug output. */
  label?: string;
}

export interface SafeFetchResult {
  response: Response;
  /** URL of the final hop, after validated redirects. */
  url: URL;
  redirects: number;
}

/**
 * Fetch with an SSRF check on the initial URL *and* on every redirect hop.
 * The timeout guards header arrival, so streaming a large body stays safe.
 */
export async function safeFetch(
  input: string | URL,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const { requireMediaHost = false, maxRedirects = 4, label = "fetch" } = options;
  const safeOptions = { requireMediaHost };

  let current = await assertSafeUrl(input, safeOptions);
  let method = options.method ?? "GET";

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    const startedAt = Date.now();

    debugLog("FETCH", { label, host: current.hostname, method, hop });

    let response: Response;
    try {
      response = await fetch(current.toString(), {
        method,
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          ...options.headers,
        },
        redirect: "manual",
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        debugLog("ERROR", { label, reason: "timeout", afterMs: Date.now() - startedAt });
        throw new MediaFlowError("REQUEST_TIMEOUT", "The request took too long. Please try again.");
      }
      debugLog("ERROR", { label, reason: "network", name: (err as Error)?.name });
      throw new MediaFlowError("PLATFORM_ACCESS_UNAVAILABLE", "This content could not be accessed.");
    } finally {
      clearTimeout(timer);
    }

    if (!REDIRECT_STATUSES.has(response.status)) {
      debugLog("RESPONSE", {
        label,
        status: response.status,
        contentType: response.headers.get("content-type") ?? "none",
        contentLength: response.headers.get("content-length") ?? "unknown",
        ms: Date.now() - startedAt,
      });
      return { response, url: current, redirects: hop };
    }

    const location = response.headers.get("location");
    await response.body?.cancel().catch(() => undefined);
    if (!location) return { response, url: current, redirects: hop };

    let next: URL;
    try {
      next = new URL(location, current);
    } catch {
      throw new MediaFlowError("MEDIA_NOT_AVAILABLE", "The media is currently unavailable.");
    }

    // Every hop is re-validated before it is followed.
    current = await assertSafeUrl(next, safeOptions);
    debugLog("REDIRECT", { label, status: response.status, to: current.hostname });
    if (response.status === 303) method = "GET";
  }

  throw new MediaFlowError("MEDIA_NOT_AVAILABLE", "The media is currently unavailable.");
}

/** Reads at most `maxBytes` of a response body, then abandons the rest. */
async function readCapped(
  response: Response,
  maxBytes: number,
): Promise<{ text: string; bytes: number; truncated: boolean }> {
  if (!response.body) return { text: "", bytes: 0, truncated: false };

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let truncated = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    bytes += value.length;
    if (bytes >= maxBytes) {
      truncated = true;
      await reader.cancel().catch(() => undefined);
      break;
    }
  }

  const merged = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return { text: new TextDecoder("utf-8").decode(merged), bytes, truncated };
}

function contentTypeOf(response: Response): string {
  return normalizeMimeType(response.headers.get("content-type")) ?? "";
}

export interface PageResult {
  status: number;
  html: string;
  url: URL;
  contentType: string;
  bytes: number;
  truncated: boolean;
}

/** Fetches a public page, validating the content type and capping the size. */
export async function fetchPublicPage(
  input: string | URL,
  options: SafeFetchOptions = {},
): Promise<PageResult> {
  const { response, url } = await safeFetch(input, options);
  const contentType = contentTypeOf(response);

  if (!response.ok || !HTML_TYPES.includes(contentType)) {
    await response.body?.cancel().catch(() => undefined);
    debugLog("RESPONSE", {
      label: options.label ?? "page",
      status: response.status,
      contentType: contentType || "none",
      usable: false,
    });
    return { status: response.status, html: "", url, contentType, bytes: 0, truncated: false };
  }

  const { text, bytes, truncated } = await readCapped(response, MAX_HTML_BYTES);
  return { status: response.status, html: text, url, contentType, bytes, truncated };
}

export interface JsonResult<T> {
  status: number;
  data: T | null;
  contentType: string;
}

/** Fetches a public JSON endpoint, validating the content type. */
export async function fetchPublicJson<T>(
  input: string | URL,
  options: SafeFetchOptions = {},
): Promise<JsonResult<T>> {
  const { response } = await safeFetch(input, {
    ...options,
    headers: { Accept: "application/json", ...options.headers },
  });

  const contentType = contentTypeOf(response);

  if (!response.ok || !JSON_TYPES.includes(contentType)) {
    await response.body?.cancel().catch(() => undefined);
    return { status: response.status, data: null, contentType };
  }

  const { text } = await readCapped(response, MAX_JSON_BYTES);

  try {
    return { status: response.status, data: JSON.parse(text) as T, contentType };
  } catch {
    return { status: response.status, data: null, contentType };
  }
}

/**
 * Asks the CDN what a media URL actually is, without downloading it.
 *
 * Uses a one-byte ranged GET (HEAD is unreliable on several media CDNs) and
 * abandons the body immediately.
 */
/**
 * True when the URL's extension cannot be trusted to describe the bytes: either
 * there is no extension, or the URL carries transform parameters that change the
 * output format (Instagram `stp=`, X `format=`, and similar).
 */
function shouldProbeContentType(mediaUrl: string): boolean {
  try {
    const parsed = new URL(mediaUrl);
    if (parsed.search) return true;
    return !extensionFromUrl(mediaUrl);
  } catch {
    return true;
  }
}

export async function probeMediaContentType(mediaUrl: string): Promise<string | undefined> {
  try {
    const { response } = await safeFetch(mediaUrl, {
      requireMediaHost: true,
      label: "probe:content-type",
      headers: { Accept: "*/*", Range: "bytes=0-0" },
    });
    await response.body?.cancel().catch(() => undefined);
    if (!response.ok && response.status !== 206) return undefined;
    return normalizeMimeType(response.headers.get("content-type"));
  } catch {
    return undefined;
  }
}

/** Unescapes URLs pulled out of embedded JSON/HTML payloads. */
export function decodeEmbeddedUrl(raw: string): string {
  return raw.replace(/\\u0026/gi, "&").replace(/\\\//g, "/").replace(/&amp;/gi, "&").trim();
}

/**
 * Platform CDNs serve resized derivatives from paths like `/736x/` or with
 * `stp=` transform parameters. We can tell that such a URL is not the original,
 * but we cannot prove that any other URL is â€” so the label stays conservative.
 */
export function describeImageQuality(mediaUrl: string): "Original" | "Preview" {
  try {
    const parsed = new URL(mediaUrl);
    if (/\/\d{2,4}x\d{0,4}\//.test(parsed.pathname)) return "Preview";
    if (parsed.searchParams.has("stp") || parsed.searchParams.has("name")) return "Preview";
    return "Original";
  } catch {
    return "Preview";
  }
}

/**
 * A media URL is only usable if it is an absolute HTTP(S) URL on an allow-listed
 * platform CDN. Player/embed pages are rejected: they are not media files.
 */
export function isDownloadableMediaUrl(raw: string | undefined): raw is string {
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    if (!isAllowedMediaHost(parsed.hostname)) return false;
    return !/\/(embed|player|watch|plugins)\b/i.test(parsed.pathname);
  } catch {
    return false;
  }
}
