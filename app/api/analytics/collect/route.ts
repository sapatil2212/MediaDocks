import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { PLATFORM_PAGES } from "@/lib/platform-pages";
import { requestContext, trackEvent } from "@/lib/analytics/track";
import { clientIpFrom } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Page-view beacon.
 *
 * The marketing pages are statically rendered, so there is no server request per
 * view to count — the browser reports it here instead.
 *
 * The reported path is checked against a fixed allow-list rather than stored as
 * given. Accepting arbitrary strings would let anyone fill the table with junk
 * (or with crafted values that end up rendered on the admin dashboard), so
 * anything unrecognised is simply dropped.
 */
const KNOWN_PATHS = new Set<string>([
  "/",
  "/how-it-works",
  "/faq",
  "/privacy",
  "/terms",
  "/youtube-to-mp3",
  ...PLATFORM_PAGES.map((page) => page.slug),
]);

const bodySchema = z.object({
  path: z.string().min(1).max(191),
});

/** Very small in-memory guard so the beacon cannot be used to flood the table. */
const seen = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

function tooMany(key: string): boolean {
  const now = Date.now();
  const recent = (seen.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    seen.set(key, recent);
    return true;
  }
  recent.push(now);
  seen.set(key, recent);
  if (seen.size > 5000) seen.clear(); // crude bound on memory
  return false;
}

export async function POST(req: NextRequest) {
  // Always answer 204: a measurement endpoint should never surface errors to a
  // visitor, and should never confirm whether a payload was accepted.
  const noContent = new NextResponse(null, { status: 204 });

  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return noContent;

    const path = parsed.data.path.split("?")[0]!.replace(/\/+$/, "") || "/";
    if (!KNOWN_PATHS.has(path)) return noContent;

    const ip = clientIpFrom(req.headers);
    const context = requestContext(req.headers, ip, req.nextUrl.hostname);

    if (tooMany(`${context.visitorHash}:${path}`)) return noContent;

    trackEvent({ type: "page_view", path, ...context });
  } catch {
    // Never propagate measurement failures.
  }

  return noContent;
}
