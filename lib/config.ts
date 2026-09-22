function readInt(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw === "") return fallback;
  return raw === "true" || raw === "1";
}

/**
 * Reads a hand-edited secret from the environment.
 *
 * `.env` is edited by people, so values routinely arrive wrapped in quotes or
 * with a trailing space or CR. Those are invisible in an editor and produce a
 * credential that looks correct but never matches, so they are stripped here
 * rather than being debugged again later.
 *
 * Trade-off: a password whose first or last character is a space cannot be used.
 */
function readSecret(raw: string | undefined): string {
  return (raw ?? "")
    .trim()
    .replace(/^"(.*)"$/s, "$1")
    .replace(/^'(.*)'$/s, "$1")
    .trim();
}

/**
 * Server-side runtime configuration.
 *
 * DATABASE_URL is read by Prisma directly, and NEXT_PUBLIC_* variables are read
 * where they are used, so neither appears here.
 */
export const config = {
  /** When true, no external platform request is ever made. */
  mockResolver: process.env.MOCK_RESOLVER === "true",

  // Temporary data. Nothing here is permanent.
  storagePath: process.env.STORAGE_PATH || "./storage/tmp",
  mediaTtlMinutes: readInt(process.env.MEDIA_TTL_MINUTES, 30),
  maxFileSizeMb: readInt(process.env.MAX_FILE_SIZE_MB, 500),
  maxUrlLength: readInt(process.env.MAX_URL_LENGTH, 2048),

  /** Outbound request timeout. */
  requestTimeoutMs: readInt(process.env.REQUEST_TIMEOUT_MS, 15000),

  // Rate limiting (in-memory, per instance).
  resolveLimit: readInt(process.env.RESOLVE_LIMIT, 10),
  resolveWindowSeconds: readInt(process.env.RESOLVE_WINDOW_SECONDS, 60),
  downloadLimit: readInt(process.env.DOWNLOAD_LIMIT, 5),
  downloadWindowSeconds: readInt(process.env.DOWNLOAD_WINDOW_SECONDS, 60),
  transcribeLimit: readInt(process.env.TRANSCRIBE_LIMIT, 3),
  transcribeWindowSeconds: readInt(process.env.TRANSCRIBE_WINDOW_SECONDS, 60),

  // Transcription media is request-scoped and deleted immediately afterward.
  transcribeMaxFileSizeMb: readInt(process.env.TRANSCRIBE_MAX_FILE_SIZE_MB, 100),
  transcribeMaxDurationSeconds: readInt(process.env.TRANSCRIBE_MAX_DURATION_SECONDS, 7200),
  transcribeTimeoutMs: readInt(process.env.TRANSCRIBE_TIMEOUT_MS, 180000),

  // ── Extraction engine (yt-dlp + FFmpeg) ───────────────────────────────────
  /**
   * When true, yt-dlp is used as the primary extractor for every platform, with
   * the built-in HTTP resolvers as a fallback. This is what makes selectable
   * resolutions/audio and YouTube downloads work. Disable to run resolver-only.
   */
  engineEnabled: readBool(process.env.ENGINE_ENABLED, true),

  /**
   * How to invoke yt-dlp. If YTDLP_PATH points at a binary it is used directly;
   * otherwise we fall back to `python -m yt_dlp`, which is how it is installed
   * in many environments (including this one).
   */
  ytdlpPath: process.env.YTDLP_PATH || "",
  pythonPath: process.env.PYTHON_PATH || "python",

  /**
   * FFmpeg / ffprobe binaries. Empty means "discover automatically" — PATH
   * first, then the well-known install locations for the platform.
   */
  ffmpegPath: process.env.FFMPEG_PATH || "",
  ffprobePath: process.env.FFPROBE_PATH || "",

  /** Hard ceiling on a metadata probe. Probes are fast; a slow one is stuck. */
  engineTimeoutMs: readInt(process.env.ENGINE_TIMEOUT_MS, 90000),

  /**
   * Hard ceiling on a download + mux subprocess. Much larger than the probe
   * timeout: transferring a 1080p file and remuxing it legitimately takes
   * minutes on a normal connection, and reusing the probe timeout here was
   * killing large downloads mid-transfer.
   */
  engineDownloadTimeoutMs: readInt(process.env.ENGINE_DOWNLOAD_TIMEOUT_MS, 600000),

  /** Max seconds of media the engine will download (guards huge files). */
  maxMediaDurationSeconds: readInt(process.env.MAX_MEDIA_DURATION_SECONDS, 3600),

  // ── Usage measurement (anonymous, aggregate) ───────────────────────────────
  /**
   * Powers the /superadmin dashboard. No IP addresses and no pasted URLs are
   * stored; see lib/analytics/track.ts. Set false to record nothing at all, in
   * which case the dashboard shows system health only.
   */
  analyticsEnabled: readBool(process.env.ANALYTICS_ENABLED, true),

  /** Events older than this are deleted by the cleanup routine. */
  analyticsRetentionDays: readInt(process.env.ANALYTICS_RETENTION_DAYS, 90),

  // ── Super admin ───────────────────────────────────────────────────────────
  /**
   * Credentials here work alongside the database `SuperAdmin` table: either
   * source can grant access, so neither can lock the operator out. See
   * lib/admin/auth.ts. Diagnose a rejected sign-in with `npm run admin:check`.
   */
  superAdminEmail: readSecret(process.env.SUPER_ADMIN_EMAIL),
  /**
   * Plaintext fallback. Prefer SUPER_ADMIN_PASS_HASH — see lib/admin/auth.ts,
   * which warns when this is used instead.
   */
  superAdminPass: readSecret(process.env.SUPER_ADMIN_PASS),
  /** scrypt digest in the form `scrypt:<salt>:<hash>`. Generated by npm run admin:hash. */
  superAdminPassHash: readSecret(process.env.SUPER_ADMIN_PASS_HASH),
  /** Signs the admin session cookie. */
  adminSessionSecret: readSecret(process.env.ADMIN_SESSION_SECRET),
  /** How long an admin session stays valid. */
  adminSessionHours: readInt(process.env.ADMIN_SESSION_HOURS, 8),
} as const;
