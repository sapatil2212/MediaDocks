import fs from "fs";
import path from "path";
import { config } from "@/lib/config";

/** Temporary working directory. Files here are transient by design. */
export function getStorageDirectory(): string {
  const dir = path.resolve(config.storagePath);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Deletes temporary files older than the TTL. Returns how many were removed.
 *
 * Downloads stream straight through and never touch disk, so this normally has
 * nothing to do. It stays because the temporary directory is part of the
 * contract: anything that ever needs to spool a file gets cleaned up here.
 */
export function cleanupExpiredFiles(ttlMinutes: number = config.mediaTtlMinutes): number {
  const baseDir = getStorageDirectory();
  const maxAgeMs = ttlMinutes * 60 * 1000;
  const now = Date.now();
  let deleted = 0;

  let entries: string[] = [];
  try {
    entries = fs.readdirSync(baseDir);
  } catch {
    return 0;
  }

  for (const entry of entries) {
    const fullPath = path.join(baseDir, entry);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && now - stat.mtimeMs > maxAgeMs) {
        fs.unlinkSync(fullPath);
        deleted++;
      }
    } catch {
      // Busy or already gone — skip.
    }
  }

  return deleted;
}
