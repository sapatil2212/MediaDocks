import { config } from "@/lib/config";
import { maybeRunCleanup } from "@/lib/cleanup";
import { DebugTrace } from "@/lib/debug";
import { engineAvailable } from "@/lib/engine/binaries";
import { resolveWithEngine } from "@/lib/engine/engine-resolver";
import { putReference } from "@/lib/download/reference";
import { assertSafeUrl, hashUrl } from "@/lib/download/security";
import { MediaFlowError } from "@/lib/errors";
import { safeFetch } from "@/lib/platforms/base";
import { detectPlatformFromUrl } from "@/lib/platforms/detector";
import type {
  Platform,
  PublicMedia,
  PublicResolveResult,
  ResolveDiagnostics,
  ResolvedResult,
} from "@/lib/platforms/types";
import { assertValidMediaUrl } from "@/lib/validation/url";
import { buildMockResult } from "./mock";
import { getResolver } from "./registry";

/** Hosts that only ever redirect to the real content URL. */
const SHORTLINK_HOSTS = new Set(["pin.it", "fb.watch"]);

export interface ResolveOutcome {
  result: PublicResolveResult;
  platform: Platform;
  durationMs: number;
  trace?: ReturnType<DebugTrace["toJSON"]>;
  /** Candidate-level diagnostics. Development surfaces only. */
  extraction?: ResolveDiagnostics;
}

export interface ResolveOptions {
  collectTrace?: boolean;
}

/**
 * The whole resolve pipeline:
 *
 *   validate → normalize → detect platform → SSRF check → expand shortlinks and
 *   re-detect → resolver → real media items with real types → persist a
 *   short-lived reference
 */
export async function resolveMedia(
  rawUrl: string,
  options: ResolveOptions = {},
): Promise<ResolveOutcome> {
  const startedAt = Date.now();
  const trace = new DebugTrace();

  const finish = (
    result: PublicResolveResult,
    platform: Platform,
    extraction?: ResolveDiagnostics,
  ): ResolveOutcome => ({
    result,
    platform,
    durationMs: Date.now() - startedAt,
    ...(options.collectTrace ? { trace: trace.toJSON() } : {}),
    ...(options.collectTrace && extraction ? { extraction } : {}),
  });

  trace.add("RESOLVE", { received: true, length: typeof rawUrl === "string" ? rawUrl.length : 0 });

  const validated = assertValidMediaUrl(rawUrl);
  trace.add("VALIDATION", { valid: true, normalizedHost: validated.url.hostname });
  trace.add("PLATFORM", { detected: validated.platform });
  trace.add("TYPE", { typeHint: validated.typeHint ?? "unknown" });

  let platform = validated.platform;
  let typeHint = validated.typeHint;

  if (config.mockResolver) {
    trace.add("RESOLVER", { mock: true });
    const result = buildMockResult(platform, validated.normalizedUrl, typeHint);
    trace.add("RESULT", { items: result.media.length, mock: true });
    return finish(result, platform);
  }

  let target = await assertSafeUrl(validated.normalizedUrl);

  // Shortlinks: follow validated redirects, then detect the platform again.
  if (SHORTLINK_HOSTS.has(target.hostname.toLowerCase().replace(/^www\./, ""))) {
    const expanded = await expandShortLink(target);
    if (expanded && expanded.toString() !== target.toString()) {
      const redetected = detectPlatformFromUrl(expanded);
      trace.add("REDIRECT", {
        from: target.hostname,
        to: expanded.hostname,
        platform: redetected.platform ?? "unsupported",
      });

      if (!redetected.platform) {
        throw new MediaFlowError("UNSUPPORTED_PLATFORM", "We don't support this platform yet.");
      }

      target = expanded;
      platform = redetected.platform;
      typeHint = redetected.typeHint;
    }
  }

  // Primary path: the yt-dlp engine, which handles every platform uniformly and
  // exposes selectable resolutions and audio formats. It returns null when it
  // cannot handle the URL, in which case we fall back to the HTTP resolvers.
  let resolved: ResolvedResult | null = null;

  if (config.engineEnabled && (await engineAvailable())) {
    trace.add("RESOLVER", { engine: "ytdlp", attempt: true });
    resolved = await resolveWithEngine(target.toString(), platform);
    if (resolved) {
      trace.add("RESOLVER", { engine: "ytdlp", options: resolved.media.length });
    } else {
      trace.add("RESOLVER", { engine: "ytdlp", result: "fell back to HTTP resolver" });
    }
  }

  if (!resolved) {
    const resolver = getResolver(platform);
    trace.add("RESOLVER", { selected: resolver.constructor.name });

    if (!resolver.canHandle(target)) {
      trace.add("ERROR", { code: "INVALID_PLATFORM_URL" });
      throw new MediaFlowError(
        "INVALID_PLATFORM_URL",
        "This doesn't look like a valid URL for this platform.",
      );
    }

    resolved = await resolver.resolve(target);
  }

  trace.add("MEDIA", {
    postKind: resolved.postKind,
    items: resolved.media.length,
    kinds: resolved.media.map((item) => `${item.kind}:${item.extension}`),
    thumbnail: Boolean(resolved.thumbnail),
    unavailable: resolved.unavailable?.code ?? "none",
  });

  if (resolved.diagnostics) {
    trace.add("RESOLVER", {
      videoResolver: resolved.diagnostics.videoResolver ?? "none",
      candidates: resolved.diagnostics.candidateCount,
      accepted: resolved.diagnostics.candidates.filter((entry) => entry.accepted).length,
    });
  }

  const stored = await putReference(resolved, hashUrl(target.toString()));
  trace.add("PERSIST", { stored: Boolean(stored), store: stored?.store ?? "none" });

  maybeRunCleanup();

  const result = toPublicResult(resolved, stored?.mediaId ?? null);
  trace.add("RESULT", {
    items: result.media.length,
    mediaId: Boolean(result.mediaId),
    unavailable: result.unavailable?.code ?? "none",
  });

  return finish(result, platform, resolved.diagnostics);
}

/** Follows a shortlink's validated redirect chain and discards the body. */
async function expandShortLink(url: URL): Promise<URL | null> {
  try {
    const { response, url: finalUrl } = await safeFetch(url, { label: "shortlink" });
    await response.body?.cancel().catch(() => undefined);
    return finalUrl;
  } catch (err) {
    if (err instanceof MediaFlowError) throw err;
    return null;
  }
}

/**
 * Builds the browser-facing result.
 *
 * Media URLs are kept so the UI can preview a video inline, but downloads still
 * go through the server reference. When the reference could not be stored the
 * items are dropped, because without a reference no download can be served.
 */
function toPublicResult(result: ResolvedResult, mediaId: string | null): PublicResolveResult {
  const media: PublicMedia[] = mediaId
    ? result.media.map((item) => ({
        id: item.id,
        kind: item.kind,
        // Engine options have no single direct URL; the poster drives preview.
        mediaUrl: item.mediaUrl,
        mimeType: item.mimeType,
        extension: item.extension,
        label: item.label,
        ...(item.quality ? { quality: item.quality } : {}),
        ...(item.posterUrl ? { posterUrl: item.posterUrl } : {}),
        ...(item.engineKind ? { engineKind: item.engineKind } : {}),
        ...(item.audioBitrate ? { audioBitrate: item.audioBitrate } : {}),
        ...(item.width ? { width: item.width } : {}),
        ...(item.height ? { height: item.height } : {}),
        ...(item.duration ? { duration: item.duration } : {}),
        ...(item.fileSize ? { fileSize: item.fileSize } : {}),
        downloadable: true,
      }))
    : [];

  const unavailable =
    result.unavailable ??
    (media.length === 0 && result.media.length > 0
      ? {
          code: "DOWNLOAD_FAILED" as const,
          message: "This media could not be prepared for download. Please try again.",
        }
      : undefined);

  return {
    platform: result.platform,
    postKind: result.postKind,
    ...(result.title ? { title: result.title } : {}),
    ...(result.creator ? { creator: result.creator } : {}),
    ...(result.thumbnail ? { thumbnail: result.thumbnail } : {}),
    ...(result.duration ? { duration: result.duration } : {}),
    ...(result.width ? { width: result.width } : {}),
    ...(result.height ? { height: result.height } : {}),
    ...(result.kind ? { kind: result.kind } : {}),
    sourceUrl: result.sourceUrl,
    ...(mediaId ? { mediaId } : {}),
    media,
    ...(unavailable ? { unavailable } : {}),
  };
}
