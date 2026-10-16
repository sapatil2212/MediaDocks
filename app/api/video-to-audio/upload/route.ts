import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import {
  getUploadSessionDir,
  isValidUploadId,
} from "@/lib/media/video-to-audio-store";
import { isSupportedVideoFile } from "@/src/lib/video-to-audio";
import { newRequestId } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

/**
 * Handles video file uploads.
 *
 * Supports two modes:
 * 1. Chunked streaming (for large / long videos like 500MB to 5GB+):
 *    Headers:
 *      x-upload-id: UUID
 *      x-chunk-index: number (0, 1, 2...)
 *      x-total-chunks: number
 *      x-file-name: string (encoded or plain)
 *    Body: binary stream of that chunk slice.
 * 2. Multipart form data (for fast single-request uploads).
 */
export async function POST(req: NextRequest) {
  const requestId = newRequestId();

  try {
    const contentType = req.headers.get("content-type") || "";

    // Mode 1: Chunked stream upload (high efficiency, handles any long video)
    const uploadId = req.headers.get("x-upload-id");
    if (uploadId) {
      if (!isValidUploadId(uploadId)) {
        return NextResponse.json(
          { error: "Invalid upload session ID." },
          { status: 400, headers: NO_STORE_HEADERS },
        );
      }

      const rawFileName = req.headers.get("x-file-name") || "video.mp4";
      let decodedFileName = rawFileName;
      try {
        decodedFileName = decodeURIComponent(rawFileName);
      } catch {}

      if (!isSupportedVideoFile(decodedFileName)) {
        return NextResponse.json(
          { error: "Unsupported video format. Please upload MP4, MKV, MOV, WebM, AVI, etc." },
          { status: 400, headers: NO_STORE_HEADERS },
        );
      }

      const chunkIndex = parseInt(req.headers.get("x-chunk-index") || "0", 10);
      const totalChunks = parseInt(req.headers.get("x-total-chunks") || "1", 10);

      const sessionDir = getUploadSessionDir(uploadId);
      const ext = path.extname(decodedFileName).toLowerCase() || ".mp4";
      const targetFilePath = path.join(sessionDir, `source${ext}`);
      const metaFilePath = path.join(sessionDir, "meta.json");

      // Write chunk to file (append if chunkIndex > 0, write fresh if chunkIndex === 0)
      if (!req.body) {
        return NextResponse.json(
          { error: "Empty chunk payload." },
          { status: 400, headers: NO_STORE_HEADERS },
        );
      }

      // Convert Web ReadableStream to Node.js Readable
      const nodeStream = Readable.fromWeb(req.body as any);
      const writeStream = fs.createWriteStream(targetFilePath, {
        flags: chunkIndex === 0 ? "w" : "a",
      });

      await pipeline(nodeStream, writeStream);

      const isCompleted = chunkIndex + 1 >= totalChunks;
      if (isCompleted) {
        // Save metadata for the extract step
        fs.writeFileSync(
          metaFilePath,
          JSON.stringify({
            originalName: decodedFileName,
            uploadId,
            filePath: targetFilePath,
            uploadedAt: Date.now(),
          }),
        );
      }

      return NextResponse.json(
        {
          success: true,
          uploadId,
          chunkIndex,
          totalChunks,
          isCompleted,
        },
        { status: 200, headers: NO_STORE_HEADERS },
      );
    }

    // Mode 2: Standard multipart form data
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const customUploadId = (formData.get("uploadId") as string) || `v2a_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      if (!file) {
        return NextResponse.json(
          { error: "No video file was uploaded." },
          { status: 400, headers: NO_STORE_HEADERS },
        );
      }

      if (!isSupportedVideoFile(file.name)) {
        return NextResponse.json(
          { error: "Unsupported video format. Please upload MP4, MKV, MOV, WebM, AVI, etc." },
          { status: 400, headers: NO_STORE_HEADERS },
        );
      }

      const sessionDir = getUploadSessionDir(customUploadId);
      const ext = path.extname(file.name).toLowerCase() || ".mp4";
      const targetFilePath = path.join(sessionDir, `source${ext}`);
      const metaFilePath = path.join(sessionDir, "meta.json");

      const arrayBuffer = await file.arrayBuffer();
      await fs.promises.writeFile(targetFilePath, Buffer.from(arrayBuffer));

      fs.writeFileSync(
        metaFilePath,
        JSON.stringify({
          originalName: file.name,
          uploadId: customUploadId,
          filePath: targetFilePath,
          uploadedAt: Date.now(),
        }),
      );

      return NextResponse.json(
        {
          success: true,
          uploadId: customUploadId,
          isCompleted: true,
        },
        { status: 200, headers: NO_STORE_HEADERS },
      );
    }

    return NextResponse.json(
      { error: "Invalid request format. Expected chunked stream or multipart/form-data." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error(`[${requestId}] Video upload error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process video upload." },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
