import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { describeEngineTools } from "@/lib/engine/binaries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Minimal public health signal. It reports only an overall status; detailed
 * diagnostics (tool paths, commands, install hints) are not exposed publicly.
 * A missing yt-dlp or FFmpeg degrades what can be resolved without breaking the
 * app outright, so the engine counts toward "degraded".
 */
export async function GET() {
  let databaseOk = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    databaseOk = false;
  }

  let engineReady = false;
  try {
    engineReady = (await describeEngineTools()).ready;
  } catch {
    engineReady = false;
  }

  const status = databaseOk && engineReady ? "ok" : "degraded";
  return NextResponse.json({ status }, { status: databaseOk ? 200 : 503 });
}