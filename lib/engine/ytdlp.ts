import { spawn } from "child_process";
import { config } from "@/lib/config";
import { debugLog } from "@/lib/debug";
import { ytdlpCommand } from "./binaries";

/**
 * Thin, typed wrapper around `yt-dlp -J` (JSON metadata dump).
 *
 * This performs no download — it only asks yt-dlp what a URL contains and which
 * formats exist. Nothing here bypasses authentication or DRM: yt-dlp reads the
 * same public data a browser would, and if a site refuses, the call fails and
 * the caller falls back to the HTTP resolvers.
 */

export interface YtdlpFormat {
  format_id: string;
  ext?: string;
  vcodec?: string;
  acodec?: string;
  height?: number;
  width?: number;
  fps?: number;
  abr?: number;
  tbr?: number;
  vbr?: number;
  filesize?: number;
  filesize_approx?: number;
  protocol?: string;
  format_note?: string;
  language?: string | null;
}

export interface YtdlpInfo {
  id?: string;
  title?: string;
  description?: string;
  uploader?: string;
  channel?: string;
  duration?: number;
  thumbnail?: string;
  extractor_key?: string;
  webpage_url?: string;
  ext?: string;
  is_live?: boolean;
  formats?: YtdlpFormat[];
  /** Present for image posts / carousels. */
  entries?: YtdlpInfo[];
  _type?: string;
}

export interface ProbeResult {
  ok: boolean;
  info?: YtdlpInfo;
  errorKind?: "unavailable" | "unsupported" | "private" | "timeout" | "engine-missing";
}

const PRIVATE_MARKERS = [
  "private",
  "login required",
  "sign in",
  "not available",
  "members-only",
  "age",
  "requested format is not available",
];

/**
 * Runs a yt-dlp subprocess, capturing stdout, with a hard timeout. stdin is
 * closed and the process is killed if it overruns.
 */
function runYtdlp(
  args: string[],
  timeoutMs: number,
): Promise<{ code: number | null; stdout: string; stderr: string; timedOut: boolean }> {
  return new Promise((resolve) => {
    void (async () => {
      const command = await ytdlpCommand();
      if (!command) {
        resolve({ code: null, stdout: "", stderr: "engine-missing", timedOut: false });
        return;
      }

      const child = spawn(command.bin, [...command.prefixArgs, ...args], { windowsHide: true });
      const chunks: Buffer[] = [];
      let stderr = "";
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, timeoutMs);

      child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
      child.stderr.on("data", (chunk: Buffer) => {
        // Keep stderr bounded; we only need the tail for error classification.
        stderr = (stderr + chunk.toString()).slice(-4000);
      });
      child.on("error", () => {
        clearTimeout(timer);
        resolve({ code: null, stdout: "", stderr, timedOut });
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve({ code, stdout: Buffer.concat(chunks).toString("utf8"), stderr, timedOut });
      });
    })();
  });
}

function classifyError(stderr: string): ProbeResult["errorKind"] {
  const lower = stderr.toLowerCase();
  if (lower.includes("engine-missing")) return "engine-missing";
  if (PRIVATE_MARKERS.some((marker) => lower.includes(marker))) return "private";
  if (lower.includes("unsupported url") || lower.includes("no video formats")) return "unsupported";
  return "unavailable";
}

/**
 * Probes a URL for downloadable media and its available formats.
 *
 * Uses flags that keep the call fast and read-only: no playlist expansion
 * beyond a single item, no downloading, skip unavailable fragments.
 */
export async function probeUrl(url: string): Promise<ProbeResult> {
  const args = [
    "-J",
    "--no-warnings",
    "--no-playlist",
    "--no-check-certificate",
    "--socket-timeout",
    String(Math.ceil(config.requestTimeoutMs / 1000)),
    url,
  ];

  const { code, stdout, stderr, timedOut } = await runYtdlp(args, config.engineTimeoutMs);

  if (timedOut) return { ok: false, errorKind: "timeout" };
  if (stderr === "engine-missing" && !stdout) return { ok: false, errorKind: "engine-missing" };

  if (code !== 0 || !stdout) {
    debugLog("ERROR", { engine: "ytdlp", code, stderr: stderr.slice(-160) });
    return { ok: false, errorKind: classifyError(stderr) };
  }

  try {
    const info = JSON.parse(stdout) as YtdlpInfo;
    return { ok: true, info };
  } catch {
    return { ok: false, errorKind: "unavailable" };
  }
}

export function isVideoFormat(format: YtdlpFormat): boolean {
  return Boolean(format.vcodec && format.vcodec !== "none");
}

export function isAudioFormat(format: YtdlpFormat): boolean {
  return Boolean(format.acodec && format.acodec !== "none");
}

export function isMuxedFormat(format: YtdlpFormat): boolean {
  return isVideoFormat(format) && isAudioFormat(format);
}

export function isVideoOnly(format: YtdlpFormat): boolean {
  return isVideoFormat(format) && !isAudioFormat(format);
}

export function isAudioOnly(format: YtdlpFormat): boolean {
  return isAudioFormat(format) && !isVideoFormat(format);
}

/** Progressive/direct formats we can stream without any muxing. */
export function isProgressive(format: YtdlpFormat): boolean {
  const protocol = (format.protocol ?? "").toLowerCase();
  return protocol === "https" || protocol === "http" || protocol === "";
}

export function formatFileSize(format: YtdlpFormat): number | undefined {
  return format.filesize ?? format.filesize_approx ?? undefined;
}
