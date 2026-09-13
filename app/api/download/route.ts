import { NextResponse, type NextRequest } from "next/server";
import { requestContext, trackEvent } from "@/lib/analytics/track";
import { loadMediaReference, openMediaDownload } from "@/lib/download/downloader";
import { MediaFlowError, toMediaFlowError } from "@/lib/errors";
import { logRequest, newRequestId } from "@/lib/logger";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limiter";
import { downloadRequestSchema } from "@/lib/validation/url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Streams a referenced media item to the browser.
 *
 * Accepts only a `{ mediaId, itemId }` reference that MediaFlow itself issued at
 * resolve time, re-validates the stored URL against the CDN allow-list, then
 * streams the bytes straight through with the real Content-Type and a matching
 * file extension. Never an open URL proxy, and never a hardcoded image type.
 */
export async function POST(req: NextRequest) {
  const requestId = newRequestId();
  const startedAt = Date.now();
  const ip = clientIpFrom(req.headers);
  // Anonymous measurement context. Carries no IP and no pasted URL.
  const context = requestContext(req.headers, ip, req.nextUrl.hostname);

  try {
    checkRateLimit(ip, "download");

    const body = await req.json().catch(() => null);
    const parsed = downloadRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new MediaFlowError(
        "INVALID_URL",
        parsed.error.errors[0]?.message ?? "A media reference is required.",
      );
    }

    const reference = await loadMediaReference(parsed.data.mediaId, parsed.data.itemId);
    const download = await openMediaDownload(reference);

    logRequest({
      requestId,
      endpoint: "POST /api/download",
      platform: reference.platform,
      durationMs: Date.now() - startedAt,
      success: true,
    });

    trackEvent({
      type: "download",
      platform: reference.platform,
      mediaKind: reference.item.engineKind ?? reference.item.kind,
      // Which quality people actually choose is the single most useful signal
      // here: it says whether the resolution ladder is worth its complexity.
      quality: reference.item.quality ?? reference.item.label,
      extension: download.extension,
      bytes: download.sizeBytes,
      durationMs: Date.now() - startedAt,
      ...context,
    });

    return new NextResponse(download.body, {
      status: 200,
      headers: {
        "Content-Type": download.mimeType,
        ...(download.sizeBytes ? { "Content-Length": String(download.sizeBytes) } : {}),
        "Content-Disposition": `attachment; filename="${download.filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    const error = toMediaFlowError(err);
    if (!(err instanceof MediaFlowError)) {
      console.error("Unhandled download error:", err);
    }

    logRequest({
      requestId,
      endpoint: "POST /api/download",
      durationMs: Date.now() - startedAt,
      success: false,
      errorCode: error.code,
    });

    trackEvent({
      type: "download",
      status: "error",
      errorCode: error.code,
      durationMs: Date.now() - startedAt,
      ...context,
    });

    return NextResponse.json(
      { success: false, error: error.toJSON() },
      { status: error.statusCode },
    );
  }
}
