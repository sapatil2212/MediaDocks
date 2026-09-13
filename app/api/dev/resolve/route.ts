import { NextResponse, type NextRequest } from "next/server";
import { MediaFlowError, toMediaFlowError } from "@/lib/errors";
import { resolveMedia } from "@/lib/resolver/resolver-service";
import { resolveRequestSchema } from "@/lib/validation/url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * Development-only resolver probe used by /dev/resolver-test.
 *
 * Returns the normalized result plus the structural trace (steps, timings,
 * which metadata sources produced data). Never returns raw page contents.
 * Responds 404 in production.
 */
export async function POST(req: NextRequest) {
  if (!isDevelopment) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  const startedAt = Date.now();

  try {
    const body = await req.json().catch(() => null);
    const parsed = resolveRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new MediaFlowError("INVALID_URL", "Please enter a valid media URL.");
    }

    const { result, platform, durationMs, trace, extraction } = await resolveMedia(
      parsed.data.url,
      { collectTrace: true },
    );

    return NextResponse.json({
      success: true,
      data: result,
      diagnostics: {
        platform,
        durationMs,
        resolverStatus: result.media.length > 0 ? "downloadable_media" : "metadata_only",
        mediaTypes: result.media.map((item) => `${item.kind}/${item.extension}`),
        unavailable: result.unavailable?.code ?? null,
        videoResolver: extraction?.videoResolver ?? null,
        candidateCount: extraction?.candidateCount ?? 0,
        candidates: extraction?.candidates ?? [],
        trace,
      },
    });
  } catch (err) {
    const error = toMediaFlowError(err);
    return NextResponse.json(
      {
        success: false,
        error: error.toJSON(),
        diagnostics: { durationMs: Date.now() - startedAt, resolverStatus: "failed" },
      },
      { status: error.statusCode },
    );
  }
}
