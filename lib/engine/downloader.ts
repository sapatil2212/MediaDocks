import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { config } from "@/lib/config";
import { debugLog } from "@/lib/debug";
import { MediaFlowError } from "@/lib/errors";
import { assertSafeUrl } from "@/lib/download/security";
import { getStorageDirectory } from "@/lib/download/storage";
import type { DownloadSpec } from "./format-groups";
import { ffmpegPath, ytdlpCommand } from "./binaries";

/**
 * Produces the actual bytes for an engine download spec.
 *
 * yt-dlp downloads the selected format(s) into a temporary directory, using
 * FFmpeg to mux video-only + audio-only into MP4 or to extract MP3 when asked.
 * The finished file is streamed to the browser and then deleted. Nothing is
 * kept, and yt-dlp only ever touches the single URL the resolver already
 * classified for this reference.
 */

export interface EngineDownload {
  body: ReadableStream<Uint8Array>;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  /** Called after the stream is consumed to remove the temp file. */
  cleanup: () => void;
}

const CONTAINER_MIME: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  opus: "audio/opus",
  jpg: "image/jpeg",
  png: "image/png",
};

function extForSpec(spec: DownloadSpec): string {
  switch (spec.strategy) {
    case "engine-mux":
      return "mp4";
    case "engine-audio":
      return spec.audioCodec === "mp3" ? "mp3" : "m4a";
    default:
      return "mp4";
  }
}

/**
 * Builds the yt-dlp argument list for a spec. All output is confined to
 * `workDir`, and `--max-filesize` guards the download size.
 */
function buildArgs(
  spec: DownloadSpec,
  sourceUrl: string,
  outputTemplate: string,
  ffmpeg: string | null,
): string[] {
  const base = [
    "--no-warnings",
    "--no-playlist",
    "--no-progress",
    "--no-check-certificate",
    "--max-filesize",
    `${config.maxFileSizeMb}m`,
    "--socket-timeout",
    String(Math.ceil(config.requestTimeoutMs / 1000)),
    "-o",
    outputTemplate,
  ];

  if (ffmpeg) base.push("--ffmpeg-location", ffmpeg);

  switch (spec.strategy) {
    case "engine-format":
      base.push("-f", spec.formatId);
      break;
    case "engine-mux":
      // Merge the chosen video with the chosen audio into an mp4.
      base.push("-f", `${spec.videoFormatId}+${spec.audioFormatId}`, "--merge-output-format", "mp4");
      break;
    case "engine-audio":
      base.push("-f", spec.formatId);
      if (spec.audioCodec === "mp3") {
        base.push("--extract-audio", "--audio-format", "mp3");
        // A bare "0" means "best VBR", which would make every bitrate choice
        // produce the same file. "<n>K" pins the CBR the user actually picked.
        base.push("--audio-quality", spec.bitrateKbps ? `${spec.bitrateKbps}K` : "0");
      }
      break;
    case "direct":
      break;
  }

  base.push(sourceUrl);
  return base;
}

function runToCompletion(bin: string, args: string[]): Promise<{ code: number | null; stderr: string; timedOut: boolean }> {
  return new Promise((resolve) => {
    const child = spawn(bin, args, { windowsHide: true });
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, config.engineDownloadTimeoutMs);

    child.stderr.on("data", (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-4000);
    });
    child.on("error", () => {
      clearTimeout(timer);
      resolve({ code: null, stderr, timedOut });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stderr, timedOut });
    });
  });
}

/** Downloads/produces the spec into a temp file and returns a stream over it. */
export async function runEngineDownload(
  spec: DownloadSpec,
  sourceUrl: string,
): Promise<EngineDownload> {
  const command = await ytdlpCommand();
  if (!command) {
    throw new MediaFlowError("DOWNLOAD_FAILED", "The download engine is not available.");
  }

  // yt-dlp only fetches this validated public URL.
  await assertSafeUrl(sourceUrl);

  const ffmpeg = await ffmpegPath();
  if ((spec.strategy === "engine-mux" || (spec.strategy === "engine-audio" && spec.audioCodec === "mp3")) && !ffmpeg) {
    throw new MediaFlowError("DOWNLOAD_FAILED", "This format needs FFmpeg, which isn't available.");
  }

  const storageDir = getStorageDirectory();
  const workDir = fs.mkdtempSync(path.join(storageDir, "dl-"));
  const outputTemplate = path.join(workDir, "media.%(ext)s");
  const expectedExt = extForSpec(spec);

  const cleanup = () => {
    fs.rm(workDir, { recursive: true, force: true }, () => undefined);
  };

  try {
    const args = buildArgs(spec, sourceUrl, outputTemplate, ffmpeg);
    debugLog("MEDIA", { engineDownload: spec.strategy, ext: expectedExt });

    const { code, stderr, timedOut } = await runToCompletion(command.bin, [
      ...command.prefixArgs,
      ...args,
    ]);

    if (timedOut) {
      cleanup();
      throw new MediaFlowError("REQUEST_TIMEOUT", "The download took too long. Please try again.");
    }
    if (code !== 0) {
      cleanup();
      if (/max.?filesize|larger than/i.test(stderr)) {
        throw new MediaFlowError(
          "FILE_TOO_LARGE",
          `This file is larger than the ${config.maxFileSizeMb} MB limit.`,
        );
      }
      debugLog("ERROR", { engineDownload: spec.strategy, code, stderr: stderr.slice(-160) });
      throw new MediaFlowError("DOWNLOAD_FAILED", "This media couldn't be downloaded. Please try again.");
    }

    const produced = fs
      .readdirSync(workDir)
      .filter((name) => name.startsWith("media."))
      .map((name) => path.join(workDir, name));

    if (produced.length === 0) {
      cleanup();
      throw new MediaFlowError("DOWNLOAD_FAILED", "The download produced no file.");
    }

    // Prefer the file with the extension we asked for; else the largest.
    const filePath =
      produced.find((p) => p.endsWith(`.${expectedExt}`)) ??
      produced.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0]!;

    const stat = fs.statSync(filePath);
    if (stat.size > config.maxFileSizeMb * 1024 * 1024) {
      cleanup();
      throw new MediaFlowError(
        "FILE_TOO_LARGE",
        `This file is larger than the ${config.maxFileSizeMb} MB limit.`,
      );
    }

    const actualExt = path.extname(filePath).replace(/^\./, "").toLowerCase() || expectedExt;
    const nodeStream = fs.createReadStream(filePath);
    nodeStream.once("close", cleanup);
    nodeStream.once("error", cleanup);

    return {
      body: Readable.toWeb(nodeStream) as unknown as ReadableStream<Uint8Array>,
      mimeType: CONTAINER_MIME[actualExt] ?? "application/octet-stream",
      extension: actualExt,
      sizeBytes: stat.size,
      cleanup,
    };
  } catch (err) {
    cleanup();
    throw err;
  }
}
