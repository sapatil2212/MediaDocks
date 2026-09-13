import { config } from "./config";
import { prisma } from "./db/prisma";
import { cleanupExpiredFiles } from "./download/storage";

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastRun = 0;

/**
 * Deletes expired MediaRequest rows, stale temporary files, and analytics events
 * past their retention window. Retention is enforced here rather than left to
 * grow forever, so the measurement table stays bounded without a cron job.
 */
export async function cleanupExpired(): Promise<{
  records: number;
  files: number;
  events: number;
}> {
  let records = 0;
  let events = 0;

  try {
    const deleted = await prisma.mediaRequest.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    records = deleted.count;
  } catch {
    // Database unavailable — file cleanup still runs.
  }

  try {
    const cutoff = new Date(Date.now() - config.analyticsRetentionDays * 24 * 60 * 60 * 1000);
    const deleted = await prisma.analyticsEvent.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    events = deleted.count;
  } catch {
    // Same as above: never let cleanup failures surface.
  }

  return { records, files: cleanupExpiredFiles(), events };
}

/**
 * Opportunistic cleanup: piggy-backs on normal traffic so the MVP needs no cron
 * job or worker process. Runs at most once every five minutes and never blocks
 * the request it was triggered from.
 */
export function maybeRunCleanup(): void {
  const now = Date.now();
  if (now - lastRun < CLEANUP_INTERVAL_MS) return;
  lastRun = now;
  void cleanupExpired().catch(() => undefined);
}
