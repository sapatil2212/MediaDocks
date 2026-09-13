import { NextResponse } from "next/server";
import { destroySession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Ends the admin session.
 *
 * POST-only, and the session cookie is sameSite=strict, so a third-party page
 * cannot force a logout via a cross-site request.
 */
export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true });
}
