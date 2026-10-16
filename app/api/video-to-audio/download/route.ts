import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getExtractedAudio } from "@/lib/media/video-to-audio-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Download token is required." }, { status: 400 });
    }

    const item = getExtractedAudio(token);
    if (!item || !fs.existsSync(item.filePath)) {
      return NextResponse.json(
        { error: "Audio download link has expired or is invalid. Please convert your video again." },
        { status: 404 },
      );
    }

    const stat = fs.statSync(item.filePath);
    const nodeStream = fs.createReadStream(item.filePath);

    // Convert to web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => controller.enqueue(chunk));
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    const headers = new Headers();
    headers.set("Content-Type", item.mimeType);
    headers.set("Content-Length", String(stat.size));
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(item.filename)}"; filename*=UTF-8''${encodeURIComponent(item.filename)}`,
    );
    headers.set("Cache-Control", "no-store, max-age=0");
    headers.set("X-Content-Type-Options", "nosniff");

    return new NextResponse(webStream, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Audio download error:", error);
    return NextResponse.json(
      { error: "Failed to download audio file." },
      { status: 500 },
    );
  }
}
