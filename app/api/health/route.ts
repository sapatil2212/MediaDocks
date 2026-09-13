import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { describeEngineTools } from "@/lib/engine/binaries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Reports the health of everything a download actually depends on.
 *
 * The extraction engine is included because a missing yt-dlp or FFmpeg does not
 * break the app outright — it silently reduces what can be resolved (no mux
 * means no high-resolution video and no MP3). Surfacing it here makes that
 * degradation diagnosable instead of looking like a broken platform.
 */
export async function GET() {
  let database: "ok" | "unavailable" = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "unavailable";
  }

  const engine = await describeEngineTools();

  const degraded = database !== "ok" || !engine.ready;
  const status = degraded ? "degraded" : "ok";

  return NextResponse.json(
    {
      status,
      database,
      engine: {
        ...engine,
        notes: engineNotes(engine),
      },
    },
    { status: database === "ok" ? 200 : 503 },
  );
}

function engineNotes(engine: Awaited<ReturnType<typeof describeEngineTools>>): string[] {
  const notes: string[] = [];
  if (!engine.engineEnabled) {
    notes.push("ENGINE_ENABLED is false; only the HTTP resolvers will run.");
  }
  if (!engine.ytdlp) {
    notes.push("yt-dlp was not found. Install it (pip install -U yt-dlp) or set YTDLP_PATH.");
  }
  if (!engine.ffmpeg) {
    notes.push(
      "FFmpeg was not found. High-resolution video needs muxing and MP3 needs transcoding, " +
        "so both are unavailable. Install FFmpeg or set FFMPEG_PATH.",
    );
  }
  if (!engine.ffprobe) {
    notes.push("ffprobe was not found. Set FFPROBE_PATH if it lives outside the FFmpeg folder.");
  }
  return notes;
}
