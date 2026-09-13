import { debugLog } from "@/lib/debug";
import type { MediaKind, ResolvedMedia } from "@/lib/platforms/types";
import {
  extensionFromUrl,
  fromMimeType,
  fromUrlExtension,
  isNonMediaContentType,
  type MediaTypeInfo,
} from "./detect-media-type";

/**
 * A media URL a resolver *thinks* is usable.
 *
 * Resolvers only produce candidates; they never decide what a URL contains.
 * `validateCandidates` is the single place that turns candidates into typed
 * media items, so a resolver mistake cannot mislabel a file.
 */
export interface MediaCandidate {
  id: string;
  url: string;
  /** What the resolver expects. Never allowed to override the live response. */
  kindHint?: MediaKind;
  /** MIME type the platform published for this candidate, if any. */
  declaredMimeType?: string | null;
  quality?: string;
  width?: number;
  height?: number;
  bitrate?: number;
  duration?: number;
  fileSize?: number;
  /** Poster for a video candidate. Never becomes a media item itself. */
  posterUrl?: string;
  /** Which extractor produced this candidate, for diagnostics. */
  source: string;
}

/** Per-candidate outcome, surfaced by /dev/resolver-test. */
export interface CandidateReport {
  id: string;
  source: string;
  host: string;
  kindHint?: MediaKind;
  declaredMimeType?: string;
  probedContentType?: string;
  resolvedKind?: MediaKind;
  resolvedMimeType?: string;
  extension?: string;
  bitrate?: number;
  accepted: boolean;
  rejectedReason?: string;
}

export interface ValidationResult {
  items: ResolvedMedia[];
  report: CandidateReport[];
}

export interface ValidateOptions {
  /** Injected so this module stays free of transport concerns. */
  probeContentType?: (url: string) => Promise<string | undefined>;
  isAllowedMediaUrl: (url: string) => boolean;
  /** Set false in unit tests to skip the network probe. */
  probe?: boolean;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "invalid";
  }
}

/**
 * Turns candidates into validated media items.
 *
 * Type resolution order — the live response comes first on purpose:
 *   1. the media URL's actual Content-Type (authoritative when it is a
 *      supported media type)
 *   2. the MIME type the platform declared
 *   3. the URL path extension
 *   4. the resolver's hint, last, and only when nothing else answered
 *
 * A hint can therefore never turn an image/jpeg response into a video, and a
 * declared video/mp4 cannot survive a response that is really an image.
 */
export async function validateCandidates(
  candidates: MediaCandidate[],
  options: ValidateOptions,
): Promise<ValidationResult> {
  const { probeContentType, isAllowedMediaUrl, probe = true } = options;

  const settled = await Promise.all(
    candidates.map(async (candidate): Promise<{ item?: ResolvedMedia; report: CandidateReport }> => {
      const base: CandidateReport = {
        id: candidate.id,
        source: candidate.source,
        host: hostOf(candidate.url),
        ...(candidate.kindHint ? { kindHint: candidate.kindHint } : {}),
        ...(candidate.declaredMimeType ? { declaredMimeType: candidate.declaredMimeType } : {}),
        ...(candidate.bitrate ? { bitrate: candidate.bitrate } : {}),
        accepted: false,
      };

      if (!isAllowedMediaUrl(candidate.url)) {
        return { report: { ...base, rejectedReason: "not an allow-listed media URL" } };
      }

      // Probe only when the URL cannot be trusted to describe its own bytes:
      // no usable extension, or transform params (Instagram `stp`, X `format`)
      // that change the output format. A clean `.mp4` / `.jpg` path is trusted,
      // which also keeps the probe off the hot path for most media.
      let probedContentType: string | undefined;
      if (probe && probeContentType && shouldProbe(candidate.url)) {
        probedContentType = await probeContentType(candidate.url);
        if (isNonMediaContentType(probedContentType)) {
          return {
            report: {
              ...base,
              probedContentType,
              rejectedReason: `response is not media (${probedContentType})`,
            },
          };
        }
      }

      const info: MediaTypeInfo | undefined =
        fromMimeType(probedContentType, "content-type") ??
        fromMimeType(candidate.declaredMimeType) ??
        fromUrlExtension(candidate.url) ??
        hintInfo(candidate.kindHint);

      if (!info) {
        return {
          report: {
            ...base,
            ...(probedContentType ? { probedContentType } : {}),
            rejectedReason: "media type could not be determined",
          },
        };
      }

      const item: ResolvedMedia = {
        id: candidate.id,
        kind: info.kind,
        mediaUrl: candidate.url,
        mimeType: info.mimeType,
        extension: info.extension,
        label: info.label,
        ...(candidate.quality ? { quality: candidate.quality } : {}),
        ...(candidate.posterUrl ? { posterUrl: candidate.posterUrl } : {}),
        ...(candidate.width ? { width: candidate.width } : {}),
        ...(candidate.height ? { height: candidate.height } : {}),
        ...(candidate.duration ? { duration: candidate.duration } : {}),
        ...(candidate.fileSize ? { fileSize: candidate.fileSize } : {}),
      };

      return {
        item,
        report: {
          ...base,
          ...(probedContentType ? { probedContentType } : {}),
          resolvedKind: info.kind,
          resolvedMimeType: info.mimeType,
          extension: info.extension,
          accepted: true,
        },
      };
    }),
  );

  const items = settled.flatMap((entry) => (entry.item ? [entry.item] : []));
  const report = settled.map((entry) => entry.report);

  debugLog("MEDIA", {
    candidates: candidates.length,
    accepted: items.length,
    rejected: report.filter((entry) => !entry.accepted).map((entry) => `${entry.id}:${entry.rejectedReason}`),
  });

  return { items, report };
}

/**
 * True when the URL's own extension cannot be trusted: either it has none, or it
 * carries a query string that may transform the output format.
 */
function shouldProbe(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.search) return true;
    return !extensionFromUrl(url);
  } catch {
    return true;
  }
}

/** The weakest signal: only used when nothing else identified the media. */
function hintInfo(hint: MediaKind | undefined): MediaTypeInfo | undefined {
  if (hint === "video") return fromMimeType("video/mp4", "platform-hint");
  if (hint === "image") return fromMimeType("image/jpeg", "platform-hint");
  return undefined;
}
