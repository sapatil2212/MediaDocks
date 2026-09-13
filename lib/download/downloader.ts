import { config } from "@/lib/config";
import { debugLog } from "@/lib/debug";
import { runEngineDownload } from "@/lib/engine/downloader";
import { MediaFlowError } from "@/lib/errors";
import {
  buildDownloadFilename,
  fromMimeType,
  fromUrlExtension,
  isNonMediaContentType,
  normalizeMimeType,
  type MediaTypeInfo,
} from "@/lib/media/detect-media-type";
import { safeFetch } from "@/lib/platforms/base";
import { getReferenceItem, type ReferencedItem } from "./reference";

export type { ReferencedItem };

/** Resolves a `{ mediaId, itemId }` reference into the media the server may fetch. */
export async function loadMediaReference(
  mediaId: string,
  itemId: string,
): Promise<ReferencedItem> {
  return getReferenceItem(mediaId, itemId);
}

export interface MediaDownload {
  /** Pass-through stream: the body is never buffered in memory. */
  body: ReadableStream<Uint8Array>;
  mimeType: string;
  extension: string;
  filename: string;
  /** Present only when the upstream declared a length. */
  sizeBytes?: number;
}

/**
 * Opens a streaming download for a referenced media item.
 *
 * Two paths:
 *   - engine spec (yt-dlp / FFmpeg produced the exact format/resolution/audio)
 *   - direct URL (stream a CDN file straight through)
 * Both end in a streamed response with the correct Content-Type and extension.
 */
export async function openMediaDownload(reference: ReferencedItem): Promise<MediaDownload> {
  const { item, platform, descriptor } = reference;

  if (item.downloadSpec && item.sourceUrl) {
    return openEngineDownload(reference);
  }

  return openDirectDownload(reference);
}

/** Engine path: yt-dlp/FFmpeg build the file, then it is streamed and deleted. */
async function openEngineDownload(reference: ReferencedItem): Promise<MediaDownload> {
  const { item, platform, descriptor } = reference;
  const spec = item.downloadSpec!;
  const sourceUrl = item.sourceUrl!;

  const produced = await runEngineDownload(spec, sourceUrl);

  const info: MediaTypeInfo =
    fromMimeType(produced.mimeType, "content-type") ??
    fromUrlExtension(`x.${produced.extension}`) ??
    fromMimeType(item.mimeType) ?? {
      kind: item.kind,
      mimeType: item.mimeType,
      extension: produced.extension,
      label: produced.extension.toUpperCase(),
      source: "content-type",
    };

  const filename = buildDownloadFilename(
    platform,
    describeItem(descriptor, info, reference.itemIndex, reference.itemCount, item.quality),
    info.extension,
  );

  debugLog("MEDIA", {
    download: platform,
    via: "engine",
    strategy: spec.strategy,
    mime: produced.mimeType,
    extension: produced.extension,
    bytes: produced.sizeBytes,
    filename,
  });

  return {
    body: produced.body,
    mimeType: produced.mimeType,
    extension: info.extension,
    filename,
    sizeBytes: produced.sizeBytes,
  };
}

/**
 * Direct path: stream a CDN URL through, deciding the type from the actual
 * Content-Type. HTML/JSON/text responses are rejected so an error page is never
 * saved as a media file.
 */
async function openDirectDownload(reference: ReferencedItem): Promise<MediaDownload> {
  const { item, platform, descriptor } = reference;
  const maxBytes = config.maxFileSizeMb * 1024 * 1024;

  const { response } = await safeFetch(item.mediaUrl, {
    requireMediaHost: true,
    headers: { Accept: "*/*" },
    label: `download:${platform}`,
  });

  if (!response.ok || !response.body) {
    await response.body?.cancel().catch(() => undefined);
    throw new MediaFlowError("DOWNLOAD_FAILED", "This media isn't available for download.");
  }

  const contentType = normalizeMimeType(response.headers.get("content-type"));

  if (isNonMediaContentType(contentType)) {
    await response.body.cancel().catch(() => undefined);
    debugLog("ERROR", { download: platform, rejected: `non-media response ${contentType}` });
    throw new MediaFlowError(
      "INVALID_MEDIA_RESPONSE",
      "The server did not return a media file for this item.",
    );
  }

  // The live Content-Type wins; the stored type and the URL extension are
  // fallbacks for CDNs that answer with application/octet-stream.
  const info: MediaTypeInfo | undefined =
    fromMimeType(contentType, "content-type") ??
    fromMimeType(item.mimeType) ??
    fromUrlExtension(item.mediaUrl);

  if (!info) {
    await response.body.cancel().catch(() => undefined);
    throw new MediaFlowError(
      "MEDIA_TYPE_UNKNOWN",
      "The media type of this file could not be determined.",
    );
  }

  const declaredLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);
  const sizeBytes = Number.isFinite(declaredLength) && declaredLength > 0 ? declaredLength : undefined;

  if (sizeBytes && sizeBytes > maxBytes) {
    await response.body.cancel().catch(() => undefined);
    throw new MediaFlowError(
      "FILE_TOO_LARGE",
      `This file is larger than the ${config.maxFileSizeMb} MB limit.`,
    );
  }

  const filename = buildDownloadFilename(
    platform,
    describeItem(descriptor, info, reference.itemIndex, reference.itemCount, item.quality),
    info.extension,
  );

  debugLog("MEDIA", {
    download: platform,
    kind: info.kind,
    mime: info.mimeType,
    extension: info.extension,
    typeSource: info.source,
    contentLength: sizeBytes ?? "unknown",
    filename,
  });

  return {
    body: response.body.pipeThrough(sizeGuard(maxBytes)),
    mimeType: info.mimeType,
    extension: info.extension,
    filename,
    ...(sizeBytes ? { sizeBytes } : {}),
  };
}

/**
 * Enforces the size limit while streaming, so an upstream that lies about (or
 * omits) Content-Length cannot push an unbounded amount of data through.
 */
function sizeGuard(maxBytes: number): TransformStream<Uint8Array, Uint8Array> {
  let received = 0;
  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      received += chunk.byteLength;
      if (received > maxBytes) {
        controller.error(
          new MediaFlowError(
            "FILE_TOO_LARGE",
            `This file is larger than the ${config.maxFileSizeMb} MB limit.`,
          ),
        );
        return;
      }
      controller.enqueue(chunk);
    },
  });
}

/**
 * Turns "Reel"/"Pin"/"Post video" into a filename-friendly descriptor that
 * states the kind exactly once, e.g. "reel-video", "pin-image". A position is
 * appended when the post has several items so each file gets its own name.
 */
function describeItem(
  descriptor: string,
  info: MediaTypeInfo,
  itemIndex: number,
  itemCount: number,
  quality?: string,
): string {
  const slugify = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const slug = slugify(descriptor);
  const base = !slug ? info.kind : slug.includes(info.kind) ? slug : `${slug}-${info.kind}`;
  if (itemCount <= 1) return base;

  // Prefer a meaningful discriminator such as "720p" over a bare position.
  const qualitySlug = quality ? slugify(quality) : "";
  if (qualitySlug && !qualitySlug.includes(info.kind)) return `${base}-${qualitySlug}`;
  return `${base}-${itemIndex}`;
}
