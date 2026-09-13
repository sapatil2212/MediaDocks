import { NextResponse, type NextRequest } from "next/server";
import { requestContext, trackEvent } from "@/lib/analytics/track";
import { MediaFlowError, toMediaFlowError } from "@/lib/errors";
import { logRequest, newRequestId } from "@/lib/logger";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limiter";
import { resolveMedia } from "@/lib/resolver/resolver-service";
import { resolveRequestSchema } from "@/lib/validation/url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const requestId = newRequestId();
  const startedAt = Date.now();
  const ip = clientIpFrom(req.headers);
  // Anonymous measurement context. Carries no IP and no pasted URL.
  const context = requestContext(req.headers, ip, req.nextUrl.hostname);

  try {
    checkRateLimit(ip, "resolve");

    const body = await req.json().catch(() => null);
    const parsed = resolveRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new MediaFlowError("INVALID_URL", "Please enter a valid media URL.");
    }

    const { result, platform, durationMs } = await resolveMedia(parsed.data.url);

    logRequest({
      requestId,
      endpoint: "POST /api/resolve",
      platform,
      durationMs,
      success: true,
    });

    trackEvent({
      type: "resolve",
      platform,
      mediaKind: result.postKind,
      // A resolve that returns no downloadable option is a real outcome worth
      // separating from a hard failure, so it is recorded as an error with the
      // reason the resolver gave.
      status: result.media.length > 0 ? "ok" : "error",
      errorCode: result.media.length > 0 ? undefined : (result.unavailable?.code ?? "NO_MEDIA"),
      durationMs,
      ...context,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const error = toMediaFlowError(err);
    if (!(err instanceof MediaFlowError)) {
      console.error("Unhandled resolve error:", err);
    }

    logRequest({
      requestId,
      endpoint: "POST /api/resolve",
      durationMs: Date.now() - startedAt,
      success: false,
      errorCode: error.code,
    });

    trackEvent({
      type: "resolve",
      status: "error",
      errorCode: error.code,
      durationMs: Date.now() - startedAt,
      ...context,
    });

    return NextResponse.json(
      { success: false, error: error.toJSON() },
      {
        status: error.statusCode,
        ...(error.code === "RATE_LIMITED"
          ? {
              headers: {
                "Retry-After": String(error.details?.retryAfterSeconds ?? 60),
              },
            }
          : {}),
      },
    );
  }
}
