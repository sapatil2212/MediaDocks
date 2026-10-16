import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getStorageDirectory } from "@/lib/download/storage";
import { AudioOutputFormat } from "@/src/lib/video-to-audio";

export interface StoredAudioItem {
  token: string;
  filePath: string;
  filename: string;
  format: AudioOutputFormat;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
  createdAt: number;
  expiresAt: number;
}

// GlobalThis map of tokens to stored items across separate Next.js route bundles
const globalStore = globalThis as typeof globalThis & {
  v2aAudioMap?: Map<string, StoredAudioItem>;
};
const ephemeralAudioMap: Map<string, StoredAudioItem> = (globalStore.v2aAudioMap ??= new Map());

const TTL_MS = 30 * 60 * 1000; // 30 minutes

/** Returns the dedicated directory for temporary uploads. */
export function getV2aUploadsDir(): string {
  const dir = path.join(getStorageDirectory(), "v2a-uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Returns the dedicated directory for extracted audio outputs. */
export function getV2aOutputsDir(): string {
  const dir = path.join(getStorageDirectory(), "v2a-outputs");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Validates that an upload session ID is a safe alphanumeric string. */
export function isValidUploadId(uploadId: string): boolean {
  return /^[a-zA-Z0-9_-]{10,80}$/.test(uploadId);
}

/** Gets the isolated directory path for an upload session. */
export function getUploadSessionDir(uploadId: string): string {
  if (!isValidUploadId(uploadId)) {
    throw new Error("Invalid upload session ID.");
  }
  const dir = path.join(getV2aUploadsDir(), uploadId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getMetaFilePath(token: string): string {
  return path.join(getV2aOutputsDir(), `${token}.meta.json`);
}

/** Registers an extracted audio file for client download. */
export function registerExtractedAudio(item: Omit<StoredAudioItem, "createdAt" | "expiresAt">): StoredAudioItem {
  const now = Date.now();
  const entry: StoredAudioItem = {
    ...item,
    createdAt: now,
    expiresAt: now + TTL_MS,
  };
  ephemeralAudioMap.set(entry.token, entry);

  // File-backed fallback so other Node processes/route bundles can resolve the token
  try {
    fs.writeFileSync(getMetaFilePath(entry.token), JSON.stringify(entry), "utf-8");
  } catch (err) {
    console.warn("Could not write audio meta file:", err);
  }

  cleanupStaleAudioFiles();
  return entry;
}

/** Retrieves a registered audio file by token if still valid. */
export function getExtractedAudio(token: string): StoredAudioItem | null {
  cleanupStaleAudioFiles();
  let entry = ephemeralAudioMap.get(token);

  if (!entry) {
    // Check file-backed fallback
    try {
      const metaPath = getMetaFilePath(token);
      if (fs.existsSync(metaPath)) {
        const loaded = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as StoredAudioItem;
        if (loaded && typeof loaded === "object" && loaded.token === token) {
          entry = loaded;
          ephemeralAudioMap.set(token, entry);
        }
      }
    } catch {}
  }

  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    ephemeralAudioMap.delete(token);
    try {
      if (fs.existsSync(entry.filePath)) fs.unlinkSync(entry.filePath);
      const metaPath = getMetaFilePath(token);
      if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
    } catch {}
    return null;
  }
  return entry;
}

/** Generates a cryptographically random token. */
export function generateAudioToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

/** Cleans up expired audio files and stale upload directories. */
export function cleanupStaleAudioFiles(): void {
  const now = Date.now();
  for (const [token, entry] of ephemeralAudioMap.entries()) {
    if (now > entry.expiresAt) {
      ephemeralAudioMap.delete(token);
      try {
        if (fs.existsSync(entry.filePath)) {
          fs.unlinkSync(entry.filePath);
        }
      } catch {}
    }
  }

  // Also sweep upload folders older than 1 hour if abandoned
  try {
    const uploadsDir = getV2aUploadsDir();
    const sessions = fs.readdirSync(uploadsDir);
    const oneHourAgo = now - 60 * 60 * 1000;
    for (const session of sessions) {
      const sessionPath = path.join(uploadsDir, session);
      try {
        const stat = fs.statSync(sessionPath);
        if (stat.isDirectory() && stat.mtimeMs < oneHourAgo) {
          fs.rmSync(sessionPath, { recursive: true, force: true });
        }
      } catch {}
    }
  } catch {}
}
