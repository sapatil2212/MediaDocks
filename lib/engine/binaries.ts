import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { config } from "@/lib/config";

/**
 * Locates and invokes the external tools the extraction engine needs.
 *
 * Discovery deliberately does not trust PATH. Package managers (winget, scoop,
 * choco, pip --user, homebrew) routinely install a tool and then require a shell
 * restart before it shows up, which silently strips every FFmpeg-dependent
 * format from the results. So we try, in order: an explicit configured path,
 * the bare name on PATH, then the well-known install directories for each
 * platform. yt-dlp additionally falls back to `python -m yt_dlp`, which is how
 * pip installs it when no console script lands on PATH.
 *
 * Results are cached per process, so a missing tool degrades gracefully to the
 * HTTP resolvers instead of crashing a request.
 */

export interface Command {
  bin: string;
  prefixArgs: string[];
}

export interface EngineTools {
  ytdlp: Command | null;
  ffmpeg: string | null;
  ffprobe: string | null;
}

let cached: EngineTools | null = null;
let pending: Promise<EngineTools> | null = null;

const isWindows = process.platform === "win32";

/**
 * Environment access behind a computed key, on purpose.
 *
 * `@vercel/nft` (the tracer `next build` runs) statically evaluates literal
 * `process.env.FOO` reads combined with `path.join`. When the folded result
 * looks like a real directory it tries to bundle that entire directory as a
 * build asset — so a literal `process.env.LOCALAPPDATA` made the build glob all
 * of `AppData\Local`, which aborts on Windows' legacy "Application Data"
 * junction with EPERM. A computed key is opaque to that analysis, and these are
 * runtime lookups anyway: the host doing the build is not the host that runs.
 */
const runtimeEnv: Record<string, string | undefined> = process.env;

function envPath(name: string): string {
  return runtimeEnv[name] ?? "";
}

/** Same reasoning as envPath: kept out of reach of static folding. */
function homeDir(): string {
  return envPath("USERPROFILE") || envPath("HOME") || os.homedir();
}

/** Adds the platform's executable suffix. */
function exeName(name: string): string {
  return isWindows ? `${name}.exe` : name;
}

function isFile(candidate: string): boolean {
  try {
    return fs.statSync(candidate).isFile();
  } catch {
    return false;
  }
}

function readDirNames(dir: string): string[] {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

function run(bin: string, args: string[], timeoutMs = 8000): Promise<{ ok: boolean; stdout: string }> {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(bin, args, { windowsHide: true });
    } catch {
      resolve({ ok: false, stdout: "" });
      return;
    }

    let stdout = "";
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ok, stdout: stdout.trim() });
    };
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(false);
    }, timeoutMs);

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.on("error", () => finish(false));
    child.on("close", (code) => finish(code === 0));
  });
}

/**
 * Bounded search for an executable underneath a root. Package managers nest
 * binaries under version folders (…/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe), so
 * a couple of levels of depth is needed, but an unbounded walk of a whole
 * package cache would be far too slow to run on a request.
 */
function searchUnder(root: string, wanted: string, maxDepth: number): string | null {
  if (maxDepth < 0) return null;
  const direct = path.join(root, wanted);
  if (isFile(direct)) return direct;

  const nestedBin = path.join(root, "bin", wanted);
  if (isFile(nestedBin)) return nestedBin;

  if (maxDepth === 0) return null;
  for (const name of readDirNames(root)) {
    const found = searchUnder(path.join(root, name), wanted, maxDepth - 1);
    if (found) return found;
  }
  return null;
}

/** Winget package folders whose name mentions the tool (e.g. Gyan.FFmpeg_…). */
function wingetPackageRoots(keyword: string): string[] {
  const localAppData = envPath("LOCALAPPDATA") || path.join(homeDir(), "AppData", "Local");
  const packages = path.join(localAppData, "Microsoft", "WinGet", "Packages");
  const needle = keyword.toLowerCase();
  return readDirNames(packages)
    .filter((name) => name.toLowerCase().includes(needle))
    .map((name) => path.join(packages, name));
}

/**
 * Roots to search for a tool, most specific first. `keyword` narrows the
 * package-manager caches so we do not walk unrelated installs.
 */
function searchRoots(keyword: string): string[] {
  const home = homeDir();
  const roots: string[] = [];

  if (isWindows) {
    const localAppData = envPath("LOCALAPPDATA") || path.join(home, "AppData", "Local");
    const appData = envPath("APPDATA") || path.join(home, "AppData", "Roaming");
    const programFiles = envPath("ProgramFiles") || "C:\\Program Files";
    const programData = envPath("ProgramData") || "C:\\ProgramData";

    roots.push(path.join(localAppData, "Microsoft", "WinGet", "Links"));
    roots.push(...wingetPackageRoots(keyword));
    roots.push(path.join(home, "scoop", "shims"));
    roots.push(path.join(home, "scoop", "apps", keyword, "current"));
    roots.push(path.join(programData, "chocolatey", "bin"));
    roots.push(path.join(programFiles, keyword));
    roots.push(path.join("C:\\", keyword));
    // pip --user drops console scripts here (…/Python312/Scripts).
    for (const name of readDirNames(path.join(appData, "Python"))) {
      roots.push(path.join(appData, "Python", name, "Scripts"));
    }
  } else {
    roots.push("/usr/local/bin", "/usr/bin", "/bin", "/opt/homebrew/bin", "/snap/bin");
    roots.push(path.join(home, ".local", "bin"));
    roots.push(`/opt/${keyword}`, `/usr/local/${keyword}`);
  }

  return roots;
}

/** Verifies a candidate really is the tool by asking it for its version. */
async function verify(candidate: Command): Promise<Command | null> {
  const { ok } = await run(candidate.bin, [...candidate.prefixArgs, "-version"]);
  if (ok) return candidate;
  // yt-dlp and most non-FFmpeg tools use the double-dashed spelling.
  const { ok: okLong } = await run(candidate.bin, [...candidate.prefixArgs, "--version"]);
  return okLong ? candidate : null;
}

async function locateBinary(name: string, configured: string, keyword = name): Promise<string | null> {
  if (configured) {
    const verified = await verify({ bin: configured, prefixArgs: [] });
    if (verified) return verified.bin;
  }

  // PATH first: cheapest, and respects whatever the operator intended.
  const onPath = await verify({ bin: name, prefixArgs: [] });
  if (onPath) return onPath.bin;

  const wanted = exeName(name);
  for (const root of searchRoots(keyword)) {
    const found = searchUnder(root, wanted, 3);
    if (!found) continue;
    const verified = await verify({ bin: found, prefixArgs: [] });
    if (verified) return verified.bin;
  }
  return null;
}

async function locateYtdlp(): Promise<Command | null> {
  const direct = await locateBinary("yt-dlp", config.ytdlpPath);
  if (direct) return { bin: direct, prefixArgs: [] };

  // pip installs the module even when no console script is exposed.
  const viaModule = await verify({ bin: config.pythonPath, prefixArgs: ["-m", "yt_dlp"] });
  if (viaModule) return viaModule;

  for (const python of ["python3", "py"]) {
    const alt = await verify({ bin: python, prefixArgs: ["-m", "yt_dlp"] });
    if (alt) return alt;
  }
  return null;
}

async function discover(): Promise<EngineTools> {
  const [ytdlp, ffmpeg] = await Promise.all([
    locateYtdlp(),
    locateBinary("ffmpeg", config.ffmpegPath, "ffmpeg"),
  ]);

  // ffprobe ships alongside ffmpeg, so prefer its sibling before searching again.
  let ffprobe: string | null = null;
  if (config.ffprobePath) {
    ffprobe = await locateBinary("ffprobe", config.ffprobePath, "ffmpeg");
  } else if (ffmpeg) {
    const sibling = path.join(path.dirname(ffmpeg), exeName("ffprobe"));
    ffprobe = isFile(sibling) ? sibling : await locateBinary("ffprobe", "", "ffmpeg");
  } else {
    ffprobe = await locateBinary("ffprobe", "", "ffmpeg");
  }

  return { ytdlp, ffmpeg, ffprobe };
}

/** Discovers the tools once per process. Safe to call on every request. */
export async function getEngineTools(): Promise<EngineTools> {
  if (cached) return cached;
  // Concurrent first-requests must not each spawn a full discovery sweep.
  pending ??= discover().then((tools) => {
    cached = tools;
    pending = null;
    return tools;
  });
  return pending;
}

export async function ytdlpCommand(): Promise<Command | null> {
  return (await getEngineTools()).ytdlp;
}

export async function ffmpegPath(): Promise<string | null> {
  return (await getEngineTools()).ffmpeg;
}

/** Human-readable tool status for /api/health and the resolver test page. */
export async function describeEngineTools(): Promise<{
  engineEnabled: boolean;
  ytdlp: string | null;
  ffmpeg: string | null;
  ffprobe: string | null;
  ready: boolean;
  muxCapable: boolean;
}> {
  const tools = await getEngineTools();
  return {
    engineEnabled: config.engineEnabled,
    ytdlp: tools.ytdlp ? [tools.ytdlp.bin, ...tools.ytdlp.prefixArgs].join(" ") : null,
    ffmpeg: tools.ffmpeg,
    ffprobe: tools.ffprobe,
    ready: config.engineEnabled && Boolean(tools.ytdlp),
    muxCapable: config.engineEnabled && Boolean(tools.ytdlp && tools.ffmpeg),
  };
}

/** True when yt-dlp is available at all. */
export async function engineAvailable(): Promise<boolean> {
  if (!config.engineEnabled) return false;
  return Boolean((await getEngineTools()).ytdlp);
}

/** Test helper: forget the cached discovery. */
export function resetEngineToolsCache(): void {
  cached = null;
  pending = null;
}
