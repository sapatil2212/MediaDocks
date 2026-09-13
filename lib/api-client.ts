import type { PublicResolveResult } from "@/lib/platforms/types";

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, unknown> };
}

export class ApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

/**
 * Runs in the browser, so it reads the public env var directly instead of
 * pulling the server config into the client bundle.
 */
function endpoint(path: string): string {
  return `${process.env.NEXT_PUBLIC_API_URL || ""}${path}`;
}

export async function resolveMedia(url: string): Promise<PublicResolveResult> {
  const res = await fetch(endpoint("/api/resolve"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ url }),
  });

  const body = (await res.json().catch(() => null)) as ApiEnvelope<PublicResolveResult> | null;

  if (!res.ok || !body?.success || !body.data) {
    throw new ApiError(
      body?.error?.code ?? "INTERNAL_ERROR",
      body?.error?.message ?? "Something went wrong. Please try again.",
    );
  }

  return body.data;
}

export interface DownloadReference {
  mediaId: string;
  /** Id of the specific media item to download. */
  itemId: string;
}

export interface DownloadedMedia {
  blob: Blob;
  filename: string;
}

/**
 * Streams the media through POST /api/download, reporting progress as bytes
 * arrive. The browser only ever sends the reference, never a media URL.
 */
export async function downloadMedia(
  reference: DownloadReference,
  onProgress?: (fraction: number, receivedBytes: number, totalBytes?: number) => void,
): Promise<DownloadedMedia> {
  const res = await fetch(endpoint("/api/download"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reference),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiEnvelope<never> | null;
    throw new ApiError(
      body?.error?.code ?? "DOWNLOAD_FAILED",
      body?.error?.message ?? "This media isn't available for download.",
    );
  }

  const filename = filenameFromHeaders(res.headers);
  const mimeType = res.headers.get("content-type") ?? "application/octet-stream";
  const declared = Number.parseInt(res.headers.get("content-length") ?? "", 10);
  const total = Number.isFinite(declared) && declared > 0 ? declared : undefined;

  if (!res.body) {
    const blob = await res.blob();
    onProgress?.(1, blob.size, total);
    return { blob, filename };
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    received += value.length;
    onProgress?.(total ? Math.min(0.99, received / total) : 0, received, total);
  }

  onProgress?.(1, received, total ?? received);

  return {
    blob: new Blob(chunks as BlobPart[], { type: mimeType }),
    filename,
  };
}

function filenameFromHeaders(headers: Headers): string {
  const disposition = headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ? decodeURIComponent(match[1]) : "mediaflow-download";
}
