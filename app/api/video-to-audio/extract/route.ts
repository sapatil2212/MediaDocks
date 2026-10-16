import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import {
  getUploadSessionDir,
  getV2aOutputsDir,
  generateAudioToken,
  registerExtractedAudio,
  isValidUploadId,
} from "@/lib/media/video-to-audio-store";
import {
  AUDIO_OUTPUT_FORMATS,
  AudioOutputFormat,
  buildFfmpegAudioArgs,
  formatAudioDuration,
  sanitizeAudioFilename,
  ExtractAudioOptions,
} from "@/src/lib/video-to-audio";
import { getEngineTools, ytdlpCommand } from "@/lib/engine/binaries";
import { assertSafeUrl } from "@/lib/download/security";
import { newRequestId } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

interface ProcessResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

function runSubprocess(bin: string, args: string[], timeoutMs: number = 300000): Promise<ProcessResult> {
  return new Promise((resolve) => {
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(bin, args, { windowsHide: true });
    } catch {
      resolve({ code: null, stdout: "", stderr: "Failed to spawn media tool.", timedOut: false });
      return;
    }

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        child.kill();
      } catch {}
      resolve({ code: null, stdout, stderr, timedOut: true });
    }, timeoutMs);

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut: false });
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code: null, stdout, stderr, err: err.message, timedOut: false } as any);
    });
  });
}

/** Probes media duration with ffprobe. */
async function probeDuration(ffprobeBin: string, filePath: string): Promise<number> {
  const result = await runSubprocess(
    ffprobeBin,
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ],
    15000,
  );
  if (result.code === 0 && result.stdout) {
    const dur = parseFloat(result.stdout.trim());
    if (Number.isFinite(dur) && dur > 0) return dur;
  }
  return 0;
}

export async function POST(req: NextRequest) {
  const requestId = newRequestId();

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const {
      uploadId,
      url,
      format = "mp3",
      bitrate = "320k",
      channels = "2",
      volume = "1.0",
      trimStart = null,
      trimEnd = null,
    } = body as {
      uploadId?: string;
      url?: string;
      format?: AudioOutputFormat;
      bitrate?: any;
      channels?: any;
      volume?: any;
      trimStart?: string | null;
      trimEnd?: string | null;
    };

    if (!uploadId && !url) {
      return NextResponse.json(
        { error: "Either a video upload or a video URL is required." },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    if (uploadId && !isValidUploadId(uploadId)) {
      return NextResponse.json(
        { error: "Valid upload session ID is required." },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    // Locate FFmpeg
    const tools = await getEngineTools();
    if (!tools.ffmpeg) {
      return NextResponse.json(
        { error: "FFmpeg media engine is currently unavailable on the server." },
        { status: 503, headers: NO_STORE_HEADERS },
      );
    }

    let sourceFilePath = "";
    let sourceOriginalName = "video_audio";
    let cleanupDir: string | null = null;

    if (url) {
      const trimmedUrl = url.trim();
      if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
        return NextResponse.json(
          { error: "Please enter a valid HTTP or HTTPS video URL." },
          { status: 400, headers: NO_STORE_HEADERS },
        );
      }

      const targetUrl = await assertSafeUrl(trimmedUrl);
      const cmd = await ytdlpCommand();
      if (!cmd) {
        return NextResponse.json(
          { error: "Video downloader engine is currently unavailable on the server." },
          { status: 503, headers: NO_STORE_HEADERS },
        );
      }

      cleanupDir = fs.mkdtempSync(path.join(getV2aOutputsDir(), "v2a-dl-"));
      const dlTemplate = path.join(cleanupDir, "%(title).80s.%(ext)s");

      const ytdlpArgs = [
        ...cmd.prefixArgs,
        "--no-warnings",
        "--no-playlist",
        "--no-progress",
        "--max-filesize",
        "500m",
        "-f",
        "ba/b",
        "-o",
        dlTemplate,
        targetUrl.toString(),
      ];

      const dlResult = await runSubprocess(cmd.bin, ytdlpArgs, 180000);
      if (dlResult.code !== 0) {
        try {
          fs.rmSync(cleanupDir, { recursive: true, force: true });
        } catch {}
        return NextResponse.json(
          { error: "Could not fetch media from this link. Make sure the video is public and accessible." },
          { status: 422, headers: NO_STORE_HEADERS },
        );
      }

      const files = fs.readdirSync(cleanupDir);
      if (files.length === 0) {
        try {
          fs.rmSync(cleanupDir, { recursive: true, force: true });
        } catch {}
        return NextResponse.json(
          { error: "No media stream could be extracted from this link." },
          { status: 422, headers: NO_STORE_HEADERS },
        );
      }

      sourceFilePath = path.join(cleanupDir, files[0]);
      sourceOriginalName = path.parse(files[0]).name;
    } else {
      if (!uploadId || !isValidUploadId(uploadId)) {
        return NextResponse.json(
          { error: "Valid upload session ID is required." },
          { status: 400, headers: NO_STORE_HEADERS },
        );
      }

      const sessionDir = getUploadSessionDir(uploadId);
      const metaFilePath = path.join(sessionDir, "meta.json");

      if (!fs.existsSync(metaFilePath)) {
        return NextResponse.json(
          { error: "Upload session not found or expired. Please upload the video again." },
          { status: 404, headers: NO_STORE_HEADERS },
        );
      }

      const meta = JSON.parse(fs.readFileSync(metaFilePath, "utf-8")) as {
        originalName: string;
        filePath: string;
      };

      if (!fs.existsSync(meta.filePath)) {
        return NextResponse.json(
          { error: "Video source file is missing. Please upload again." },
          { status: 404, headers: NO_STORE_HEADERS },
        );
      }

      sourceFilePath = meta.filePath;
      sourceOriginalName = meta.originalName;
      cleanupDir = sessionDir;
    }

    const targetFormatInfo = AUDIO_OUTPUT_FORMATS.find((f) => f.format === format) || AUDIO_OUTPUT_FORMATS[0];
    const targetFormat = targetFormatInfo.format;
    const audioToken = generateAudioToken();
    const outputFileName = `${audioToken}.${targetFormat}`;
    const outputFilePath = path.join(getV2aOutputsDir(), outputFileName);

    const extractOptions: ExtractAudioOptions = {
      format: targetFormat,
      bitrate,
      channels,
      volume,
      trimStart,
      trimEnd,
    };

    const ffmpegArgs = buildFfmpegAudioArgs(sourceFilePath, outputFilePath, extractOptions);

    // Run extraction with 5 minute timeout for long videos
    const ffmpegResult = await runSubprocess(tools.ffmpeg, ffmpegArgs, 300000);

    if (ffmpegResult.timedOut) {
      if (cleanupDir) {
        try {
          fs.rmSync(cleanupDir, { recursive: true, force: true });
        } catch {}
      }
      try {
        if (fs.existsSync(outputFilePath)) fs.unlinkSync(outputFilePath);
      } catch {}
      return NextResponse.json(
        { error: "Audio extraction timed out. Try trimming a shorter range or lowering the bitrate." },
        { status: 504, headers: NO_STORE_HEADERS },
      );
    }

    if (ffmpegResult.code !== 0 || !fs.existsSync(outputFilePath)) {
      if (cleanupDir) {
        try {
          fs.rmSync(cleanupDir, { recursive: true, force: true });
        } catch {}
      }
      console.error(`[${requestId}] FFmpeg failed:`, ffmpegResult.stderr);
      return NextResponse.json(
        { error: "Could not extract audio from this video. The file may have no audio track or an unsupported codec." },
        { status: 422, headers: NO_STORE_HEADERS },
      );
    }

    // Probe duration of extracted audio
    let audioDuration = 0;
    if (tools.ffprobe) {
      audioDuration = await probeDuration(tools.ffprobe, outputFilePath);
    }

    const stat = fs.statSync(outputFilePath);
    const friendlyFilename = sanitizeAudioFilename(sourceOriginalName, targetFormat);

    // Ephemeral guarantee: remove source video directory immediately!
    if (cleanupDir) {
      try {
        fs.rmSync(cleanupDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.warn("Failed to delete source directory:", cleanupErr);
      }
    }

    // Register audio for streaming download
    registerExtractedAudio({
      token: audioToken,
      filePath: outputFilePath,
      filename: friendlyFilename,
      format: targetFormat,
      mimeType: targetFormatInfo.mimeType,
      sizeBytes: stat.size,
      durationSeconds: audioDuration,
    });

    return NextResponse.json(
      {
        success: true,
        token: audioToken,
        filename: friendlyFilename,
        format: targetFormat,
        mimeType: targetFormatInfo.mimeType,
        sizeBytes: stat.size,
        durationSeconds: audioDuration,
        durationFormatted: formatAudioDuration(audioDuration),
      },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error(`[${requestId}] Audio extraction error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred during audio extraction." },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
