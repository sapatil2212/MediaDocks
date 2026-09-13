import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  HardDrive,
  Info,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { isInputError } from "@/lib/admin/metrics";
import type { AnalyticsReport, Breakdown, SystemReport, Totals } from "@/lib/admin/metrics";
import { cn } from "@/lib/utils";

/** Human-readable byte size. */
function bytes(value: number): string {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function num(value: number): string {
  return value.toLocaleString("en-US");
}

function ms(value: number | null): string {
  if (value === null) return "—";
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${value} ms`;
}

/**
 * Share of *serviceable* requests that succeeded.
 *
 * Requests that could never work — junk links, unsupported hosts, rate-limited
 * retries — are excluded from the denominator. Counting them made a healthy
 * server report 3%, because scanners and typos dominated the failure count.
 */
function deliveryRate(totals: Totals): string {
  const serviceable = totals.resolves + totals.downloads - totals.inputErrors;
  if (serviceable <= 0) return "—";
  return `${Math.round(((serviceable - totals.deliveryFailures) / serviceable) * 100)}%`;
}

function StatCard({
  label,
  value,
  sub,
  accent,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  /** Highlights the live figure so it reads as the "now" number. */
  accent?: boolean;
  tone?: "danger";
}) {
  return (
    <div className={cn("panel p-5", accent && "border-primary/40 bg-accent/30")}>
      <p className="eyebrow">{label}</p>
      <p
        className={cn(
          "figure-mono font-display mt-2 text-3xl font-semibold",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

/** Horizontal bar list. Shares are relative to the largest row. */
function BarList({
  title,
  rows,
  empty,
  note,
  markInputErrors = false,
}: {
  title: string;
  rows: Breakdown[];
  empty: string;
  note?: string;
  /** Dims rows caused by bad input so real failures stand out. */
  markInputErrors?: boolean;
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div className="panel p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {rows.map((row) => {
            const benign = markInputErrors && isInputError(row.label);
            return (
              <li key={row.label} className="flex items-center gap-3">
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-xs font-medium",
                    benign && "text-muted-foreground",
                  )}
                  title={benign ? `${row.label} — caused by the request, not a fault` : row.label}
                >
                  {row.label}
                  {benign ? <span className="ml-1.5 opacity-60">· input</span> : null}
                </span>
                <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-surface-strong sm:w-32">
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      markInputErrors && !benign ? "bg-destructive/70" : "bg-primary/80",
                    )}
                    style={{ width: `${(row.count / max) * 100}%` }}
                  />
                </span>
                <span className="figure-mono w-12 shrink-0 text-right text-xs font-semibold">
                  {num(row.count)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {note ? <p className="mt-3 text-[0.7rem] text-muted-foreground">{note}</p> : null}
    </div>
  );
}

export function AdminDashboard({
  analytics,
  system,
  generatedAt,
}: {
  analytics: AnalyticsReport;
  system: SystemReport;
  generatedAt: Date;
}) {
  const maxDaily = Math.max(1, ...analytics.daily.map((d) => Math.max(d.visitors, d.pageViews)));
  const blockedCount =
    analytics.errors.find((row) => row.label === "PLATFORM_ACCESS_UNAVAILABLE")?.count ?? 0;

  return (
    <div className="section-shell py-10">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Super admin</p>
          <h1 className="section-title mt-2">App report</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            {generatedAt.toISOString().replace("T", " ").slice(0, 19)} UTC · all figures UTC
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminAutoRefresh generatedAt={generatedAt.getTime()} />
          <AdminLogoutButton />
        </div>
      </div>

      {/* ── Operator warnings ────────────────────────────────────────────── */}
      {(system.usingPlaintextPassword ||
        system.appUrl.includes("localhost") ||
        !system.engine.ready ||
        system.database === "unavailable") && (
        <div className="mt-6 space-y-2">
          {system.usingPlaintextPassword ? (
            <Warning
              tone="danger"
              text="The admin password is stored in plaintext (SUPER_ADMIN_PASS). Run `npm run admin:hash`, set SUPER_ADMIN_PASS_HASH, and remove the plaintext value."
            />
          ) : null}
          {system.database === "unavailable" ? (
            <Warning
              tone="danger"
              text="MySQL is unreachable. Downloads still work via the in-memory reference fallback, but no usage is being recorded."
            />
          ) : null}
          {!system.engine.ready ? (
            <Warning
              tone="danger"
              text="The extraction engine is unavailable — yt-dlp was not found. Nothing can be downloaded until it is installed."
            />
          ) : !system.engine.muxCapable ? (
            <Warning
              tone="warn"
              text="FFmpeg was not found. High resolutions and MP3 are unavailable; only progressive formats will appear."
            />
          ) : null}
          {system.appUrl.includes("localhost") ? (
            <Warning
              tone="warn"
              text={`NEXT_PUBLIC_APP_URL is "${system.appUrl}". Canonical URLs and the sitemap will point at localhost until this is a public domain.`}
            />
          ) : null}
        </div>
      )}

      {/* Platform-side blocking is invisible in aggregate numbers but is the most
          likely reason a healthy server still fails to deliver, so it is called
          out explicitly whenever it appears. */}
      {blockedCount > 0 ? (
        <div className="mt-6">
          <Warning
            tone="danger"
            text={`A platform refused this server ${blockedCount} time(s) in the last 30 days (PLATFORM_ACCESS_UNAVAILABLE). This is a bot challenge or rate limit aimed at the server's IP, not a problem with the links. Datacenter IP ranges are challenged far more often than residential ones. Keeping yt-dlp updated usually helps most.`}
          />
        </div>
      ) : null}

      {/* ── Analytics unavailable notice ─────────────────────────────────── */}
      {!analytics.available ? (
        <div className="panel mt-6 flex gap-3 p-5 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="font-semibold">No usage data</p>
            <p className="mt-1 text-muted-foreground">
              {analytics.reason ??
                "Nothing has been recorded yet. Figures appear once the app receives traffic."}
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Headline numbers ─────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold">Visitors</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Active now"
            value={num(analytics.activeNow)}
            sub="last 5 minutes"
            accent
          />
          <StatCard
            label="Today"
            value={num(analytics.today.visitors)}
            sub={`${num(analytics.today.pageViews)} page views`}
          />
          <StatCard
            label="Last 7 days"
            value={num(analytics.last7.visitors)}
            sub={`${num(analytics.last7.pageViews)} page views`}
          />
          <StatCard
            label="Last 30 days"
            value={num(analytics.last30.visitors)}
            sub={`${num(analytics.last30.pageViews)} page views`}
          />
          <StatCard
            label="All time"
            value={num(analytics.allTime.visitors)}
            sub={`retained ${system.retentionDays} days`}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          A visitor is a distinct anonymous daily digest. No IP address is stored, and the digest
          changes every day, so the same person on two days counts twice across a multi-day window.
        </p>
      </section>

      {/* ── Activity ─────────────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold">Activity, last 30 days</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Links resolved"
            value={num(analytics.last30.resolves)}
            sub={`avg ${ms(analytics.avgResolveMs)}`}
          />
          <StatCard
            label="Downloads"
            value={num(analytics.last30.downloads)}
            sub={`avg ${ms(analytics.avgDownloadMs)}`}
          />
          <StatCard
            label="Delivery rate"
            value={deliveryRate(analytics.last30)}
            sub={`${num(analytics.last30.deliveryFailures)} real failure(s)`}
            {...(analytics.last30.deliveryFailures > 0 &&
            deliveryRate(analytics.last30) !== "—" &&
            Number.parseInt(deliveryRate(analytics.last30), 10) < 80
              ? { tone: "danger" as const }
              : {})}
          />
          <StatCard
            label="Data served"
            value={bytes(analytics.last30.bytes)}
            sub={`all time ${bytes(analytics.allTime.bytes)}`}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Delivery rate excludes requests that could never work —{" "}
          {num(analytics.last30.inputErrors)} of {num(analytics.last30.failures)} failures in this
          window were unsupported links, malformed URLs, expired references or rate-limited retries.
          Those are the system behaving correctly, so counting them would hide the failures that
          matter.
        </p>
      </section>

      {/* ── Daily trend ──────────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold">Last 14 days</h2>
        <div className="panel mt-3 overflow-x-auto p-5">
          <div className="flex min-w-[36rem] items-end gap-2" role="img" aria-label="Daily visitors and page views">
            {analytics.daily.map((point) => (
              <div key={point.day} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="figure-mono text-[0.65rem] text-muted-foreground">
                  {point.visitors}
                </span>
                <span className="flex h-32 w-full items-end justify-center gap-0.5">
                  <span
                    className="w-1/2 rounded-t bg-primary/80"
                    style={{ height: `${(point.visitors / maxDaily) * 100}%` }}
                    title={`${point.visitors} visitors`}
                  />
                  <span
                    className="w-1/2 rounded-t bg-primary/30"
                    style={{ height: `${(point.pageViews / maxDaily) * 100}%` }}
                    title={`${point.pageViews} page views`}
                  />
                </span>
                <span className="figure-mono text-[0.6rem] text-muted-foreground">
                  {point.day.slice(5)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-primary/80" /> visitors
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-primary/30" /> page views
            </span>
          </p>
        </div>
      </section>

      {/* ── Breakdowns ───────────────────────────────────────────────────── */}
      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <BarList
          title="Platforms used"
          rows={analytics.platforms}
          empty="No resolves recorded yet."
        />
        <BarList
          title="Formats chosen"
          rows={analytics.qualities}
          empty="No downloads recorded yet."
        />
        <BarList title="Most visited pages" rows={analytics.pages} empty="No page views yet." />
        <BarList title="Devices" rows={analytics.devices} empty="No page views yet." />
        <BarList
          title="Traffic sources"
          rows={analytics.referrers}
          empty="No external referrers yet. Direct visits are not listed."
        />
        <BarList
          title="Most common errors"
          rows={analytics.errors}
          empty="No errors recorded."
          markInputErrors
          note="Rows marked “input” are unsupported links, typos, expired references or rate limiting — expected, and excluded from the delivery rate. Red rows are worth investigating."
        />
      </section>

      {/* ── Recent failures ──────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold">Recent failures</h2>
        <div className="panel mt-3 overflow-hidden">
          {analytics.recentFailures.length === 0 ? (
            <p className="p-5 text-xs text-muted-foreground">Nothing has failed recently.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-surface-strong/60">
                    <th scope="col" className="px-5 py-3 text-xs font-semibold">
                      When (UTC)
                    </th>
                    <th scope="col" className="px-5 py-3 text-xs font-semibold">
                      Stage
                    </th>
                    <th scope="col" className="px-5 py-3 text-xs font-semibold">
                      Platform
                    </th>
                    <th scope="col" className="px-5 py-3 text-xs font-semibold">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentFailures.map((row, index) => (
                    <tr key={`${row.at.toISOString()}-${index}`} className="rule-row">
                      <td className="figure-mono px-5 py-3 text-xs whitespace-nowrap">
                        {row.at.toISOString().replace("T", " ").slice(0, 19)}
                      </td>
                      <td className="px-5 py-3 text-xs">{row.type}</td>
                      <td className="px-5 py-3 text-xs">{row.platform ?? "—"}</td>
                      <td className="figure-mono px-5 py-3 text-xs">{row.errorCode ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── System health ────────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold">System</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div className="panel p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Terminal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Extraction engine
            </h3>
            <dl className="mt-4 space-y-2.5 text-xs">
              <Row label="Status">
                <Health ok={system.engine.ready} okText="Ready" badText="Unavailable" />
              </Row>
              <Row label="High resolution + MP3">
                <Health ok={system.engine.muxCapable} okText="Available" badText="Needs FFmpeg" />
              </Row>
              <Row label="yt-dlp">
                <code className="figure-mono break-all">{system.engine.ytdlp ?? "not found"}</code>
              </Row>
              <Row label="FFmpeg">
                <code className="figure-mono break-all">{system.engine.ffmpeg ?? "not found"}</code>
              </Row>
              <Row label="ffprobe">
                <code className="figure-mono break-all">
                  {system.engine.ffprobe ?? "not found"}
                </code>
              </Row>
            </dl>
          </div>

          <div className="panel p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Database className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Database &amp; storage
            </h3>
            <dl className="mt-4 space-y-2.5 text-xs">
              <Row label="MySQL">
                <Health
                  ok={system.database === "ok"}
                  okText="Connected"
                  badText="Unavailable"
                />
              </Row>
              <Row label="Live media references">
                <span className="figure-mono">
                  {system.activeReferences === null ? "—" : num(system.activeReferences)}
                </span>
              </Row>
              <Row label="Temp working dirs">
                <span className="figure-mono">
                  {num(system.storage.tempDirs)} · {bytes(system.storage.bytes)}
                </span>
              </Row>
              <Row label="Storage writable">
                <Health ok={system.storage.writable} okText="Yes" badText="No" />
              </Row>
              <Row label="Storage path">
                <code className="figure-mono break-all">{system.storage.path}</code>
              </Row>
            </dl>
          </div>

          <div className="panel p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Limits in effect
            </h3>
            <dl className="mt-4 space-y-2.5 text-xs">
              <Row label="Resolve rate limit">
                <span className="figure-mono">{system.limits.resolve}</span>
              </Row>
              <Row label="Download rate limit">
                <span className="figure-mono">{system.limits.download}</span>
              </Row>
              <Row label="Max file size">
                <span className="figure-mono">{system.maxFileSizeMb} MB</span>
              </Row>
              <Row label="Media reference TTL">
                <span className="figure-mono">{system.mediaTtlMinutes} min</span>
              </Row>
              <Row label="Analytics retention">
                <span className="figure-mono">{system.retentionDays} days</span>
              </Row>
            </dl>
          </div>

          <div className="panel p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <HardDrive className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              What is recorded
            </h3>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Per event: type, platform, media kind, chosen quality, file extension, status, error
              code, duration, byte count, coarse device bucket and referring host.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Never recorded: IP addresses, the URLs visitors paste, page content, or any identifier
              that survives past the current day. The visitor digest mixes a server secret with the
              calendar date, so it cannot be reversed or linked across days.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium">{children}</dd>
    </div>
  );
}

function Health({ ok, okText, badText }: { ok: boolean; okText: string; badText: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold",
        ok ? "text-primary" : "text-destructive",
      )}
    >
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {ok ? okText : badText}
    </span>
  );
}

function Warning({ tone, text }: { tone: "danger" | "warn"; text: string }) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4 text-xs",
        tone === "danger"
          ? "border-destructive/40 bg-destructive/5"
          : "border-border bg-surface-strong",
      )}
    >
      <ShieldAlert
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          tone === "danger" ? "text-destructive" : "text-muted-foreground",
        )}
        aria-hidden="true"
      />
      <p className="min-w-0 leading-relaxed">{text}</p>
    </div>
  );
}
