import { describe, it, expect } from "vitest";
import {
  isSupportedVideoFile,
  formatFileSize,
  formatAudioDuration,
  sanitizeAudioFilename,
  parseTimeString,
  buildFfmpegAudioArgs,
  AUDIO_OUTPUT_FORMATS,
  AUDIO_BITRATES,
} from "@/src/lib/video-to-audio";
import {
  isValidUploadId,
  registerExtractedAudio,
  getExtractedAudio,
} from "@/lib/media/video-to-audio-store";
import { POST as uploadPost } from "@/app/api/video-to-audio/upload/route";
import { POST as extractPost } from "@/app/api/video-to-audio/extract/route";
import { GET as downloadGet } from "@/app/api/video-to-audio/download/route";
import { NextRequest } from "next/server";

describe("Video to Audio — Utilities & Configuration", () => {
  it("validates supported video file formats", () => {
    expect(isSupportedVideoFile("lecture.mp4")).toBe(true);
    expect(isSupportedVideoFile("movie.mkv")).toBe(true);
    expect(isSupportedVideoFile("camera.MOV")).toBe(true);
    expect(isSupportedVideoFile("stream.webm")).toBe(true);
    expect(isSupportedVideoFile("video.avi")).toBe(true);
    expect(isSupportedVideoFile("clip.flv")).toBe(true);
    expect(isSupportedVideoFile("broadcast.ts")).toBe(true);
    expect(isSupportedVideoFile("recording.m4v")).toBe(true);

    expect(isSupportedVideoFile("document.pdf")).toBe(false);
    expect(isSupportedVideoFile("script.sh")).toBe(false);
    expect(isSupportedVideoFile("audio.mp3")).toBe(false);
    expect(isSupportedVideoFile("image.png")).toBe(false);
  });

  it("formats file sizes accurately across boundaries", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(15 * 1024 * 1024)).toBe("15.0 MB");
    expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe("2.50 GB");
  });

  it("formats audio durations correctly for short and long recordings", () => {
    expect(formatAudioDuration(0)).toBe("00:00");
    expect(formatAudioDuration(45)).toBe("00:45");
    expect(formatAudioDuration(125)).toBe("02:05");
    // Long recordings (1 hour, 2 hours, 3 hours+)
    expect(formatAudioDuration(3665)).toBe("01:01:05");
    expect(formatAudioDuration(7325)).toBe("02:02:05");
  });

  it("sanitizes audio output filenames safely", () => {
    expect(sanitizeAudioFilename("My Long Podcast Episode #1.mp4", "mp3")).toBe(
      "My Long Podcast Episode _1.mp3",
    );
    expect(sanitizeAudioFilename("../../../etc/passwd.mov", "wav")).toBe(
      "passwd.wav",
    );
    expect(sanitizeAudioFilename("", "m4a")).toBe("extracted-audio.m4a");
  });

  it("parses time strings in HH:MM:SS, MM:SS, and seconds format", () => {
    expect(parseTimeString("01:00:00")).toBe(3600);
    expect(parseTimeString("00:05:30")).toBe(330);
    expect(parseTimeString("02:15")).toBe(135);
    expect(parseTimeString("90")).toBe(90);
    expect(parseTimeString("")).toBeNull();
    expect(parseTimeString("invalid")).toBeNull();
  });

  it("includes all primary audio output formats", () => {
    const formats = AUDIO_OUTPUT_FORMATS.map((f) => f.format);
    expect(formats).toContain("mp3");
    expect(formats).toContain("m4a");
    expect(formats).toContain("wav");
    expect(formats).toContain("flac");
    expect(formats).toContain("ogg");
    expect(formats).toContain("opus");
  });
});

describe("Video to Audio — FFmpeg Command Generation", () => {
  it("generates correct FFmpeg arguments for MP3 320 kbps with video discard", () => {
    const args = buildFfmpegAudioArgs("/tmp/in.mp4", "/tmp/out.mp3", {
      format: "mp3",
      bitrate: "320k",
      channels: "2",
      volume: "1.0",
    });

    expect(args).toContain("-vn"); // Discards video for ultra-fast processing
    expect(args).toContain("-c:a");
    expect(args).toContain("libmp3lame");
    expect(args).toContain("-b:a");
    expect(args).toContain("320k");
    expect(args).toContain("-ac");
    expect(args).toContain("2");
    expect(args.at(-1)).toBe("/tmp/out.mp3");
  });

  it("generates correct FFmpeg arguments for Lossless WAV", () => {
    const args = buildFfmpegAudioArgs("/tmp/in.mov", "/tmp/out.wav", {
      format: "wav",
    });

    expect(args).toContain("-vn");
    expect(args).toContain("pcm_s16le");
  });

  it("generates correct FFmpeg arguments for Lossless FLAC", () => {
    const args = buildFfmpegAudioArgs("/tmp/in.mkv", "/tmp/out.flac", {
      format: "flac",
    });

    expect(args).toContain("-vn");
    expect(args).toContain("flac");
  });

  it("generates correct FFmpeg arguments for M4A / AAC", () => {
    const args = buildFfmpegAudioArgs("/tmp/in.mp4", "/tmp/out.m4a", {
      format: "m4a",
      bitrate: "256k",
    });

    expect(args).toContain("-vn");
    expect(args).toContain("aac");
    expect(args).toContain("256k");
  });

  it("applies audio volume gain and loudness normalization filters", () => {
    const argsBoost = buildFfmpegAudioArgs("/tmp/in.mp4", "/tmp/out.mp3", {
      format: "mp3",
      volume: "1.5",
    });
    expect(argsBoost).toContain("-af");
    expect(argsBoost).toContain("volume=1.5");

    const argsNorm = buildFfmpegAudioArgs("/tmp/in.mp4", "/tmp/out.mp3", {
      format: "mp3",
      volume: "normalize",
    });
    expect(argsNorm).toContain("-af");
    expect(argsNorm).toContain("loudnorm");
  });

  it("applies start and end trim options correctly", () => {
    const args = buildFfmpegAudioArgs("/tmp/in.mp4", "/tmp/out.mp3", {
      format: "mp3",
      trimStart: "00:01:00",
      trimEnd: "00:03:00",
    });

    expect(args).toContain("-ss");
    expect(args).toContain("60");
    expect(args).toContain("-t");
    expect(args).toContain("120"); // 180 - 60 = 120s duration
  });
});

describe("Video to Audio — Ephemeral Storage & Security", () => {
  it("strictly validates upload session IDs to prevent path traversal", () => {
    expect(isValidUploadId("v2a_1729000000_abc123")).toBe(true);
    expect(isValidUploadId("valid-session-id_123456789")).toBe(true);

    // Path traversal attacks
    expect(isValidUploadId("../../../etc/passwd")).toBe(false);
    expect(isValidUploadId("..\\..\\windows\\system32")).toBe(false);
    expect(isValidUploadId("short")).toBe(false); // Too short
    expect(isValidUploadId("invalid/slash/id_123456")).toBe(false);
  });

  it("registers and retrieves extracted audio items with TTL", () => {
    const token = "test_token_1234567890abcdef";
    const item = registerExtractedAudio({
      token,
      filePath: "/tmp/nonexistent.mp3",
      filename: "test.mp3",
      format: "mp3",
      mimeType: "audio/mpeg",
      sizeBytes: 1024,
      durationSeconds: 10,
    });

    expect(item.token).toBe(token);
    expect(item.expiresAt).toBeGreaterThan(Date.now());

    const retrieved = getExtractedAudio(token);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.filename).toBe("test.mp3");

    expect(getExtractedAudio("non_existent_token")).toBeNull();
  });
});

describe("Video to Audio — API Route Handlers", () => {
  it("rejects upload requests with invalid upload session IDs", async () => {
    const req = new NextRequest("http://localhost/api/video-to-audio/upload", {
      method: "POST",
      headers: {
        "x-upload-id": "../invalid/traversal",
        "x-chunk-index": "0",
        "x-total-chunks": "1",
      },
    });

    const res = await uploadPost(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid upload session ID");
  });

  it("rejects extraction requests with missing or invalid upload IDs", async () => {
    const req = new NextRequest("http://localhost/api/video-to-audio/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId: "bad_id" }),
    });

    const res = await extractPost(req);
    expect(res.status).toBe(400);
  });

  it("rejects download requests with missing tokens", async () => {
    const req = new NextRequest("http://localhost/api/video-to-audio/download", {
      method: "GET",
    });

    const res = await downloadGet(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("token is required");
  });

  it("rejects download requests with expired or unknown tokens", async () => {
    const req = new NextRequest(
      "http://localhost/api/video-to-audio/download?token=nonexistent_token_123",
      {
        method: "GET",
      },
    );

    const res = await downloadGet(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("expired or is invalid");
  });
});
