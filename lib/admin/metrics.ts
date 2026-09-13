import fs from "fs";
import path from "path";
import { config } from "@/lib/config";
import { prisma } from "@/lib/db/prisma";
import { describeEngineTools } from "@/lib/engine/binaries";
import { getStorageDirectory } from "@/lib/download/storage";

/**
 * Read-only aggregation for the admin dashboard.
 *
 * Every section degrades independently: the database being unreachable must
 * still leave engine and storage health visible, because that combination is
 * exactly when someone opens this page.
 */

export interface Totals {
  visitors: number;
  pageViews: number;
  resolves: number;
  downloads: number;
  /** Every failed event, whatever the cause. */
  failures: number;
  /**
   * Failures caused by what was submitted — a junk link, an unsupported host, a
   * stale reference, or hitting the rate limit. These are the system working as
   * intended and must not be counted against it.
   */
  inputErrors: number;
  /**
   * Failures where a valid request did not produce a file: the platform blocked
   * us, the extraction broke, it timed out, the file was too big. This is the
   * number that actually indicates health.
   */
  deliveryFailures: number;
  bytes: number;
}

/**
 * Error codes that mean "the request was never going to work", as opposed to
 * "we failed to deliver".
 *
 * Without this split the dashboard read 3% success on a healthy server, because
 * 51 of 58 failures were scanners and typos hitting UNSUPPORTED_PLATFORM and
 * INVALID_URL. That buries the failures worth acting on.
 */
const INPUT_ERROR_CODES = new Set([
  "INVALID_URL",
  "INVALID_PLATFORM_URL",
  "UNSUPPORTED_PLATFORM",
  "RATE_LIMITED",
  "MEDIA_NOT_FOUND",
  "MEDIA_REFERENCE_EXPIRED",
  "FORMAT_NOT_AVAILABLE",
  "UNSAFE_URL",
]);

export function isInputError(code: string | null | undefined): boolean {
  return code ? INPUT_ERROR_CODES.has(code) : false;
}

export interface Breakdown {
  label: string;
  count: number;
}

export interface DayPoint {
  day: string;
  visitors: number;
  pageViews: number;
  downloads: number;
}

export interface AnalyticsReport {
  available: boolean;
  enabled: boolean;
  reason?: string;
  /** Distinct visitors in the last 5 minutes. */
  activeNow: number;
  today: Totals;
  last7: Totals;
  last30: Totals;
  allTime: Totals;
  daily: DayPoint[];
  platforms: Breakdown[];
  qualities: Breakdown[];
  pages: Breakdown[];
  devices: Breakdown[];
  referrers: Breakdown[];
  errors: Breakdown[];
  recentFailures: Array<{
    at: Date;
    type: string;
    platform: string | null;
    quality: string | null;
    errorCode: string | null;
  }>;
  avgResolveMs: number | null;
  avgDownloadMs: number | null;
}

export interface SystemReport {
  database: "ok" | "unavailable";
  activeReferences: number | null;
  engine: Awaited<ReturnType<typeof describeEngineTools>>;
  storage: { path: string; tempDirs: number; bytes: number; writable: boolean };
  retentionDays: number;
  mediaTtlMinutes: number;
  maxFileSizeMb: number;
  limits: { resolve: string; download: string };
  usingPlaintextPassword: boolean;
  appUrl: string;
}

function startOfUtcDay(offsetDays = 0): Date {
  const now = new Date();
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offsetDays),
  );
  return d;
}

const EMPTY: Totals = {
  visitors: 0,
  pageViews: 0,
  resolves: 0,
  downloads: 0,
  failures: 0,
  inputErrors: 0,
  deliveryFailures: 0,
  bytes: 0,
};

/** Aggregates one time window. `since` of null means all time. */
async function totalsSince(since: Date | null): Promise<Totals> {
  const where = since ? { createdAt: { gte: since } } : {};

  const [grouped, distinctVisitors, byteSum] = await Promise.all([
    // errorCode is grouped too, so failures can be attributed rather than lumped.
    prisma.analyticsEvent.groupBy({
      by: ["type", "status", "errorCode"],
      where,
      _count: { _all: true },
    }),
    // A "visitor" is a distinct daily hash inside the window.
    prisma.analyticsEvent.findMany({
      where,
      distinct: ["visitorHash"],
      select: { visitorHash: true },
    }),
    prisma.analyticsEvent.aggregate({ where, _sum: { bytes: true } }),
  ]);

  const totals: Totals = { ...EMPTY, visitors: distinctVisitors.length };
  totals.bytes = byteSum._sum.bytes ?? 0;

  for (const row of grouped) {
    const count = row._count._all;
    if (row.type === "page_view") totals.pageViews += count;
    if (row.type === "resolve") totals.resolves += count;
    if (row.type === "download") totals.downloads += count;
    if (row.status === "error") {
      totals.failures += count;
      if (isInputError(row.errorCode)) totals.inputErrors += count;
      else totals.deliveryFailures += count;
    }
  }

  return totals;
}

/** Distinct visitors seen in the last `minutes`, for a live "active now" figure. */
async function activeVisitors(minutes: number): Promise<number> {
  const rows = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: new Date(Date.now() - minutes * 60 * 1000) } },
    distinct: ["visitorHash"],
    select: { visitorHash: true },
  });
  return rows.length;
}

async function topBy(
  field: "platform" | "quality" | "path" | "device" | "referrerHost" | "errorCode",
  since: Date,
  take: number,
  extraWhere: Record<string, unknown> = {},
): Promise<Breakdown[]> {
  const rows = await prisma.analyticsEvent.groupBy({
    by: [field],
    where: { createdAt: { gte: since }, NOT: { [field]: null }, ...extraWhere },
    _count: { _all: true },
    orderBy: { _count: { [field]: "desc" } },
    take,
  });

  return rows
    .map((row) => ({
      label: String((row as Record<string, unknown>)[field] ?? "unknown"),
      count: row._count._all,
    }))
    .filter((entry) => entry.label !== "unknown" && entry.label !== "null");
}

/** Per-day series for the last `days` days, oldest first. */
async function dailySeries(days: number): Promise<DayPoint[]> {
  const since = startOfUtcDay(days - 1);
  const rows = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, type: true, visitorHash: true },
  });

  const buckets = new Map<string, { visitors: Set<string>; pageViews: number; downloads: number }>();
  for (let i = days - 1; i >= 0; i -= 1) {
    buckets.set(startOfUtcDay(i).toISOString().slice(0, 10), {
      visitors: new Set(),
      pageViews: 0,
      downloads: 0,
    });
  }

  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.visitors.add(row.visitorHash);
    if (row.type === "page_view") bucket.pageViews += 1;
    if (row.type === "download") bucket.downloads += 1;
  }

  return [...buckets.entries()].map(([day, value]) => ({
    day,
    visitors: value.visitors.size,
    pageViews: value.pageViews,
    downloads: value.downloads,
  }));
}

async function averageDuration(type: "resolve" | "download"): Promise<number | null> {
  const result = await prisma.analyticsEvent.aggregate({
    where: { type, status: "ok", durationMs: { not: null }, createdAt: { gte: startOfUtcDay(30) } },
    _avg: { durationMs: true },
  });
  const avg = result._avg.durationMs;
  return avg === null ? null : Math.round(avg);
}

export async function getAnalyticsReport(): Promise<AnalyticsReport> {
  const base: AnalyticsReport = {
    available: false,
    enabled: config.analyticsEnabled,
    activeNow: 0,
    today: EMPTY,
    last7: EMPTY,
    last30: EMPTY,
    allTime: EMPTY,
    daily: [],
    platforms: [],
    qualities: [],
    pages: [],
    devices: [],
    referrers: [],
    errors: [],
    recentFailures: [],
    avgResolveMs: null,
    avgDownloadMs: null,
  };

  if (!config.analyticsEnabled) {
    return { ...base, reason: "ANALYTICS_ENABLED is false, so nothing is being recorded." };
  }

  try {
    const since30 = startOfUtcDay(30);
    const [
      activeNow,
      today,
      last7,
      last30,
      allTime,
      daily,
      platforms,
      qualities,
      pages,
      devices,
      referrers,
      errors,
      recentFailures,
      avgResolveMs,
      avgDownloadMs,
    ] = await Promise.all([
      activeVisitors(5),
      totalsSince(startOfUtcDay(0)),
      totalsSince(startOfUtcDay(6)),
      totalsSince(since30),
      totalsSince(null),
      dailySeries(14),
      topBy("platform", since30, 8),
      topBy("quality", since30, 10, { type: "download" }),
      topBy("path", since30, 10, { type: "page_view" }),
      topBy("device", since30, 4),
      topBy("referrerHost", since30, 8),
      topBy("errorCode", since30, 8),
      prisma.analyticsEvent.findMany({
        where: { status: "error" },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          createdAt: true,
          type: true,
          platform: true,
          quality: true,
          errorCode: true,
        },
      }),
      averageDuration("resolve"),
      averageDuration("download"),
    ]);

    return {
      ...base,
      available: true,
      activeNow,
      today,
      last7,
      last30,
      allTime,
      daily,
      platforms,
      qualities,
      pages,
      devices,
      referrers,
      errors,
      recentFailures: recentFailures.map((row) => ({
        at: row.createdAt,
        type: row.type,
        platform: row.platform,
        quality: row.quality,
        errorCode: row.errorCode,
      })),
      avgResolveMs,
      avgDownloadMs,
    };
  } catch (err) {
    return {
      ...base,
      reason:
        err instanceof Error
          ? `Analytics could not be read: ${err.message.split("\n")[0]}`
          : "Analytics could not be read.",
    };
  }
}

/** Size and count of the temporary download working directories. */
function inspectStorage(): SystemReport["storage"] {
  const dir = getStorageDirectory();
  let tempDirs = 0;
  let bytes = 0;
  let writable = false;

  try {
    fs.accessSync(dir, fs.constants.W_OK);
    writable = true;
  } catch {
    writable = false;
  }

  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      tempDirs += 1;
      const sub = path.join(dir, entry.name);
      try {
        for (const file of fs.readdirSync(sub)) {
          bytes += fs.statSync(path.join(sub, file)).size;
        }
      } catch {
        // A directory being cleaned up mid-scan is expected.
      }
    }
  } catch {
    // Directory may not exist yet.
  }

  return { path: dir, tempDirs, bytes, writable };
}

export async function getSystemReport(usingPlaintextPassword: boolean): Promise<SystemReport> {
  let database: "ok" | "unavailable" = "ok";
  let activeReferences: number | null = null;

  try {
    activeReferences = await prisma.mediaRequest.count({
      where: { expiresAt: { gt: new Date() } },
    });
  } catch {
    database = "unavailable";
  }

  return {
    database,
    activeReferences,
    engine: await describeEngineTools(),
    storage: inspectStorage(),
    retentionDays: config.analyticsRetentionDays,
    mediaTtlMinutes: config.mediaTtlMinutes,
    maxFileSizeMb: config.maxFileSizeMb,
    limits: {
      resolve: `${config.resolveLimit} / ${config.resolveWindowSeconds}s`,
      download: `${config.downloadLimit} / ${config.downloadWindowSeconds}s`,
    },
    usingPlaintextPassword,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "(not set)",
  };
}
