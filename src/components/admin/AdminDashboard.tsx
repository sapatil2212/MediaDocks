"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  ChevronsUpDown,
  CircleGauge,
  Database,
  Download,
  FileWarning,
  Gauge,
  Globe2,
  HardDrive,
  Info,
  LayoutDashboard,
  Radio,
  Server,
  ShieldAlert,
  Terminal,
  Users,
  Zap,
} from "lucide-react";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { Logo, LogoMark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { isInputError } from "@/lib/admin/error-classification";
import {
  ariaSortFor,
  nextSortState,
  sortBreakdown,
  sortFailures,
  type BreakdownSortKey,
  type FailureSortKey,
  type SortDirection,
} from "@/lib/admin/sorting";
import type { AnalyticsReport, Breakdown, SystemReport, Totals } from "@/lib/admin/metrics";
import { cn } from "@/lib/utils";

type SectionId = "overview" | "analytics" | "platforms" | "system";
type Tone = "healthy" | "warning" | "danger" | "neutral";

interface ActiveSession {
  email: string;
  issuedAt: number;
  expiresAt: number;
}

const NAV_ITEMS: Array<{ id: SectionId; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "platforms", label: "Platforms", icon: Globe2 },
  { id: "system", label: "System", icon: Server },
];

/* ─────────────────────────────── formatting ──────────────────────────────── */

/** Every figure passes through here so a bad value renders as a dash, not NaN. */
function safe(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number.isFinite(value) ? value : null;
}

function num(value: number | null | undefined): string {
  const safeValue = safe(value);
  return safeValue === null ? "—" : safeValue.toLocaleString("en-US");
}

function bytes(value: number | null | undefined): string {
  const safeValue = safe(value);
  if (safeValue === null) return "—";
  if (safeValue <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(safeValue) / Math.log(1024)), units.length - 1);
  return `${(safeValue / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function ms(value: number | null | undefined): string {
  const safeValue = safe(value);
  if (safeValue === null) return "—";
  return safeValue >= 1000 ? `${(safeValue / 1000).toFixed(1)}s` : `${Math.round(safeValue)} ms`;
}

function formatUtc(input: Date | string): string {
  const time = new Date(input).getTime();
  if (!Number.isFinite(time)) return "—";
  return new Date(time).toISOString().replace("T", " ").slice(0, 19);
}

/** Session time remaining, so the operator knows when they will be signed out. */
function remainingSession(expiresAt: number): string {
  const minutes = Math.max(0, Math.round((expiresAt - Date.now()) / 60000));
  if (minutes < 60) return `${minutes}m left`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m left`;
}

function deliveryRateValue(totals: Totals): number | null {
  const serviceable = safe(totals.resolves + totals.downloads - totals.inputErrors);
  if (serviceable === null || serviceable <= 0) return null;
  const delivered = serviceable - totals.deliveryFailures;
  return Math.min(100, Math.max(0, Math.round((delivered / serviceable) * 100)));
}

function deliveryRate(totals: Totals): string {
  const rate = deliveryRateValue(totals);
  return rate === null ? "—" : `${rate}%`;
}

function toneClasses(tone: Tone): string {
  if (tone === "healthy")
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (tone === "warning")
    return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  if (tone === "danger") return "border-destructive/25 bg-destructive/10 text-destructive";
  return "border-border bg-surface-strong text-muted-foreground";
}

/* ──────────────────────────────── primitives ─────────────────────────────── */

function StatusPill({ tone, children, pulse = false }: { tone: Tone; children: ReactNode; pulse?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold",
        toneClasses(tone),
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full bg-current", pulse && "animate-pulse")} aria-hidden="true" />
      {children}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <article className="rounded-2xl border border-border/80 bg-surface p-4 shadow-soft transition duration-200 hover:border-primary/25 hover:shadow-lift sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("grid h-9 w-9 place-items-center rounded-xl border", toneClasses(tone))}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
      </div>
      <p
        className={cn(
          "figure-mono mt-5 font-display text-2xl font-semibold tracking-tight sm:text-3xl",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}

function HealthTile({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: Tone;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-border/70 bg-background/60 p-3.5">
      <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg border", toneClasses(tone))}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-xs font-semibold text-foreground">{value}</p>
        <p className="mt-0.5 truncate text-[0.65rem] text-muted-foreground" title={detail}>
          {detail}
        </p>
      </div>
    </div>
  );
}

function WarningBanner({ tone, children }: { tone: "danger" | "warning"; children: ReactNode }) {
  const Icon = tone === "danger" ? ShieldAlert : AlertTriangle;
  return (
    <div className={cn("flex gap-3 rounded-xl border p-3.5 text-xs leading-relaxed", toneClasses(tone))}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 text-foreground">{children}</p>
    </div>
  );
}

function DefinitionRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border/60 py-3 first:border-0 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-xs font-medium">{children}</dd>
    </div>
  );
}

function SystemCard({
  icon: Icon,
  title,
  status,
  children,
}: {
  icon: LucideIcon;
  title: string;
  status: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-border/80 bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-strong text-muted-foreground">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          {title}
        </h3>
        {status}
      </div>
      <dl className="mt-4">{children}</dl>
    </article>
  );
}

/* ───────────────────────────── sortable breakdown ────────────────────────── */

const BREAKDOWN_SORTS: Array<{ key: BreakdownSortKey; direction: SortDirection; label: string }> = [
  { key: "count", direction: "desc", label: "Most first" },
  { key: "count", direction: "asc", label: "Fewest first" },
  { key: "label", direction: "asc", label: "A–Z" },
  { key: "label", direction: "desc", label: "Z–A" },
];

function BarList({
  title,
  description,
  rows,
  empty,
  markInputErrors = false,
}: {
  title: string;
  description: string;
  rows: Breakdown[];
  empty: string;
  markInputErrors?: boolean;
}) {
  const [sortIndex, setSortIndex] = useState(0);
  const sort = BREAKDOWN_SORTS[sortIndex];
  const sorted = useMemo(() => sortBreakdown(rows, sort.key, sort.direction), [rows, sort]);

  const shownTotal = sorted.reduce((sum, row) => sum + (safe(row.count) ?? 0), 0);
  const max = Math.max(1, ...sorted.map((row) => safe(row.count) ?? 0));
  const selectId = `sort-${title.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <article className="flex flex-col rounded-2xl border border-border/80 bg-surface p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-[0.7rem] text-muted-foreground">{description}</p>
        </div>
        {shownTotal > 0 ? (
          <span className="figure-mono shrink-0 rounded-md bg-surface-strong px-2 py-1 text-[0.65rem] font-semibold text-muted-foreground">
            {num(shownTotal)}
          </span>
        ) : null}
      </div>

      {sorted.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          {empty}
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2">
            <label htmlFor={selectId} className="sr-only">
              Sort {title}
            </label>
            <ArrowUpDown className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
            <select
              id={selectId}
              value={sortIndex}
              onChange={(event) => setSortIndex(Number(event.target.value))}
              className="focus-ring w-full rounded-lg border border-border/80 bg-background px-2 py-1.5 text-[0.7rem] font-medium text-foreground"
            >
              {BREAKDOWN_SORTS.map((option, index) => (
                <option key={option.label} value={index}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <ul className="mt-4 space-y-3.5">
            {sorted.map((row) => {
              const count = safe(row.count) ?? 0;
              const benign = markInputErrors && isInputError(row.label);
              const share = shownTotal > 0 ? Math.round((count / shownTotal) * 100) : 0;
              return (
                <li key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span
                      className={cn("min-w-0 truncate font-medium", benign && "text-muted-foreground")}
                      title={row.label}
                    >
                      {row.label}
                      {benign ? (
                        <span className="ml-1.5 text-[0.6rem] font-normal uppercase tracking-wide opacity-60">
                          input
                        </span>
                      ) : null}
                    </span>
                    <span className="figure-mono shrink-0 text-[0.7rem] font-semibold">
                      {num(count)} <span className="font-normal text-muted-foreground">· {share}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-strong">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-500",
                        markInputErrors && !benign ? "bg-destructive/75" : "bg-primary/75",
                      )}
                      style={{ width: `${Math.max(2, (count / max) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </article>
  );
}

/* ──────────────────────────── sortable failure table ─────────────────────── */

const FAILURE_COLUMNS: Array<{ key: FailureSortKey; label: string }> = [
  { key: "at", label: "When (UTC)" },
  { key: "type", label: "Stage" },
  { key: "platform", label: "Platform" },
  { key: "quality", label: "Quality" },
  { key: "errorCode", label: "Reason" },
];

function FailureTable({ rows }: { rows: AnalyticsReport["recentFailures"] }) {
  const [sort, setSort] = useState<{ key: FailureSortKey; direction: SortDirection }>({
    key: "at",
    direction: "desc",
  });
  const [onlyServiceFaults, setOnlyServiceFaults] = useState(false);

  const visible = useMemo(() => {
    const filtered = onlyServiceFaults ? rows.filter((row) => !isInputError(row.errorCode)) : rows;
    return sortFailures(filtered, sort.key, sort.direction);
  }, [rows, sort, onlyServiceFaults]);

  return (
    <article className="mt-4 overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Recent failures</h3>
          <p className="mt-1 text-[0.7rem] text-muted-foreground">
            Showing {num(visible.length)} of {num(rows.length)} recorded · sortable columns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-[0.7rem] font-medium text-muted-foreground">
            <input
              type="checkbox"
              checked={onlyServiceFaults}
              onChange={(event) => setOnlyServiceFaults(event.target.checked)}
              className="focus-ring h-3.5 w-3.5 rounded border-border accent-primary"
            />
            Service faults only
          </label>
          <StatusPill tone={visible.length ? "warning" : "healthy"}>
            {visible.length ? `${num(visible.length)} shown` : "Clear"}
          </StatusPill>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="grid h-32 place-items-center px-5 text-center text-xs text-muted-foreground">
          {rows.length === 0 ? "Nothing has failed recently." : "No failures match this filter."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead>
              <tr className="bg-surface-strong/60 text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
                {FAILURE_COLUMNS.map((column) => {
                  const isActive = sort.key === column.key;
                  const SortIcon = !isActive ? ChevronsUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown;
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={ariaSortFor(isActive, sort.direction)}
                      className="px-5 py-0 font-semibold"
                    >
                      <button
                        type="button"
                        onClick={() => setSort((current) => nextSortState(current, column.key))}
                        className="focus-ring -mx-1 flex w-full items-center gap-1.5 rounded px-1 py-3 text-left uppercase tracking-[0.1em] transition-colors hover:text-foreground"
                      >
                        {column.label}
                        <SortIcon
                          className={cn("h-3 w-3 shrink-0", isActive ? "text-primary" : "opacity-40")}
                          aria-hidden="true"
                        />
                      </button>
                    </th>
                  );
                })}
                <th scope="col" className="px-5 py-3 font-semibold">
                  Class
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row, index) => {
                const benign = isInputError(row.errorCode);
                return (
                  <tr key={`${formatUtc(row.at)}-${row.errorCode ?? "none"}-${index}`} className="border-t border-border/60 text-xs">
                    <td className="figure-mono whitespace-nowrap px-5 py-3.5 text-muted-foreground">
                      {formatUtc(row.at)}
                    </td>
                    <td className="px-5 py-3.5 font-medium">{row.type}</td>
                    <td className="px-5 py-3.5">{row.platform ?? "—"}</td>
                    <td className="px-5 py-3.5">{row.quality ?? "—"}</td>
                    <td className="figure-mono px-5 py-3.5">{row.errorCode ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <StatusPill tone={benign ? "neutral" : "danger"}>{benign ? "Input" : "Service"}</StatusPill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

/* ───────────────────────────────── chart ─────────────────────────────────── */

const CHART_SERIES = [
  { key: "visitors", label: "Visitors", color: "bg-chart-1" },
  { key: "pageViews", label: "Views", color: "bg-chart-2" },
  { key: "downloads", label: "Requests", color: "bg-chart-4" },
] as const;

function ActivityChart({ daily }: { daily: AnalyticsReport["daily"] }) {
  const max = Math.max(1, ...daily.flatMap((point) => CHART_SERIES.map((series) => safe(point[series.key]) ?? 0)));

  return (
    <article className="rounded-2xl border border-border/80 bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">14-day activity</h3>
          <p className="mt-1 text-xs text-muted-foreground">Visitors, page views, and download requests per UTC day.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[0.68rem] text-muted-foreground" aria-hidden="true">
          {CHART_SERIES.map((series) => (
            <span key={series.key} className="inline-flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-sm", series.color)} />
              {series.label}
            </span>
          ))}
        </div>
      </div>

      {daily.length === 0 ? (
        <div className="mt-6 grid h-56 place-items-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
          No activity recorded yet.
        </div>
      ) : (
        <>
          <div className="mt-7 overflow-x-auto pb-2">
            <div
              className="flex h-56 min-w-[42rem] items-end gap-2 border-b border-border/70 px-1"
              role="img"
              aria-label="Daily visitors, page views, and download requests for the last 14 days"
            >
              {daily.map((point) => (
                <div key={point.day} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                  <div className="flex h-[11rem] items-end justify-center gap-0.5">
                    {CHART_SERIES.map((series) => {
                      const value = safe(point[series.key]) ?? 0;
                      return (
                        <div
                          key={series.key}
                          className={cn("w-1/3 min-w-1 rounded-t-sm opacity-90 transition-opacity hover:opacity-100", series.color)}
                          style={{ height: value > 0 ? `${Math.max(4, (value / max) * 100)}%` : "2px" }}
                          title={`${point.day}: ${num(value)} ${series.label.toLowerCase()}`}
                        />
                      );
                    })}
                  </div>
                  <span className="figure-mono mt-2 text-center text-[0.58rem] text-muted-foreground">
                    {point.day.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <table className="sr-only">
            <caption>Daily activity for the last 14 days</caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Visitors</th>
                <th>Page views</th>
                <th>Download requests</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((point) => (
                <tr key={point.day}>
                  <td>{point.day}</td>
                  <td>{point.visitors}</td>
                  <td>{point.pageViews}</td>
                  <td>{point.downloads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </article>
  );
}

/* ──────────────────────────────── shell ──────────────────────────────────── */

function AdminNavigation({
  active,
  onNavigate,
  session,
  overallTone,
}: {
  active: SectionId;
  onNavigate: (id: SectionId) => void;
  session: ActiveSession;
  overallTone: Tone;
}) {
  const { setOpenMobile } = useSidebar();
  const initials = session.email.slice(0, 2).toUpperCase();

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border p-3 group-data-[collapsible=icon]:p-1.5">
        <a
          href="#overview"
          aria-label="MediaDocks admin overview"
          onClick={() => {
            onNavigate("overview");
            setOpenMobile(false);
          }}
          className="focus-ring flex h-12 items-center gap-3 overflow-hidden rounded-xl px-1.5 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <LogoMark size={28} className="hidden group-data-[collapsible=icon]:block" />
          <Logo height={27} className="group-data-[collapsible=icon]:hidden" priority />
        </a>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Admin dashboard sections">
          <SidebarGroup className="pt-4">
            <SidebarGroupLabel>Sections</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={active === item.id} tooltip={item.label}>
                      <a
                        href={`#${item.id}`}
                        onClick={() => {
                          onNavigate(item.id);
                          setOpenMobile(false);
                        }}
                        aria-current={active === item.id ? "location" : undefined}
                      >
                        <item.icon />
                        <span className="truncate font-medium">{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-2">
        <div className="mb-1 flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
          <span
            className={cn(
              "relative grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-xs font-bold",
              toneClasses(overallTone),
            )}
          >
            {initials}
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-xs font-semibold" title={session.email}>
              {session.email}
            </span>
            <span className="figure-mono block truncate text-[0.62rem] text-muted-foreground">
              {remainingSession(session.expiresAt)}
            </span>
          </span>
        </div>
        <AdminLogoutButton />
      </SidebarFooter>
      <SidebarRail />
    </>
  );
}

function DashboardContent({
  analytics,
  system,
  session,
  generatedAt,
}: {
  analytics: AnalyticsReport;
  system: SystemReport;
  session: ActiveSession;
  generatedAt: Date;
}) {
  const [active, setActive] = useState<SectionId>("overview");

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (element): element is HTMLElement => element !== null,
    );
    if (sections.length === 0 || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id as SectionId);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.15, 0.4] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const delivery = deliveryRateValue(analytics.last30);
  const blockedCount =
    analytics.errors.find((row) => row.label === "PLATFORM_ACCESS_UNAVAILABLE")?.count ?? 0;
  const criticalIssues = [system.database !== "ok", !system.engine.ready, !system.storage.writable].filter(
    Boolean,
  ).length;
  const warnings = [
    system.usingPlaintextPassword,
    system.engine.ready && !system.engine.muxCapable,
    system.appUrl.includes("localhost"),
    !analytics.available,
  ].filter(Boolean).length;
  const overallTone: Tone = criticalIssues > 0 ? "danger" : warnings > 0 ? "warning" : "healthy";
  const currentLabel = NAV_ITEMS.find((item) => item.id === active)?.label ?? "Overview";

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <AdminNavigation active={active} onNavigate={setActive} session={session} overallTone={overallTone} />
      </Sidebar>

      <SidebarInset id="admin-main" className="min-w-0 bg-surface-strong/35">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border/70 bg-background/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="h-9 w-9 rounded-xl border border-border/70" />
            <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
            <p className="truncate text-sm font-semibold sm:text-base">{currentLabel}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AdminAutoRefresh generatedAt={generatedAt.getTime()} />
            <span className="hidden sm:inline-flex">
              <StatusPill tone={overallTone} pulse={overallTone === "healthy"}>
                {overallTone === "healthy"
                  ? "All systems operational"
                  : criticalIssues
                    ? `${criticalIssues} critical`
                    : `${warnings} warning${warnings === 1 ? "" : "s"}`}
              </StatusPill>
            </span>
            <ThemeToggle />
          </div>
        </header>

        <div className="mx-auto w-full max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* ── Overview ──────────────────────────────────────────────────── */}
          <section id="overview" className="scroll-mt-24">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={overallTone} pulse={overallTone === "healthy"}>
                {overallTone === "healthy" ? "Operational" : "Review required"}
              </StatusPill>
              <span className="figure-mono text-[0.65rem] text-muted-foreground">
                Data as of {formatUtc(generatedAt)} UTC
              </span>
            </div>

            {(criticalIssues > 0 || warnings > 0 || blockedCount > 0) && (
              <div className="mt-5 grid gap-2">
                {system.usingPlaintextPassword ? (
                  <WarningBanner tone="danger">
                    The admin password is stored in plaintext. Generate a hash and remove SUPER_ADMIN_PASS.
                  </WarningBanner>
                ) : null}
                {system.database === "unavailable" ? (
                  <WarningBanner tone="danger">
                    MySQL is unreachable, so usage data and media references cannot be read.
                  </WarningBanner>
                ) : null}
                {!system.engine.ready ? (
                  <WarningBanner tone="danger">
                    The extraction engine is unavailable. Check ENGINE_ENABLED and the yt-dlp installation.
                  </WarningBanner>
                ) : !system.engine.muxCapable ? (
                  <WarningBanner tone="warning">
                    FFmpeg is unavailable, so high-resolution muxing and MP3 conversion are disabled.
                  </WarningBanner>
                ) : null}
                {!system.storage.writable ? (
                  <WarningBanner tone="danger">
                    Temporary storage is not writable, so downloads cannot be processed.
                  </WarningBanner>
                ) : null}
                {system.appUrl.includes("localhost") ? (
                  <WarningBanner tone="warning">
                    NEXT_PUBLIC_APP_URL is {system.appUrl}. Set the public domain before deploying.
                  </WarningBanner>
                ) : null}
                {blockedCount > 0 ? (
                  <WarningBanner tone="danger">
                    A platform refused this server {num(blockedCount)} time
                    {blockedCount === 1 ? "" : "s"} recently (PLATFORM_ACCESS_UNAVAILABLE).
                  </WarningBanner>
                ) : null}
              </div>
            )}

            {!analytics.available ? (
              <div className="mt-5 flex gap-3 rounded-2xl border border-border/80 bg-surface p-5 shadow-soft">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">Analytics unavailable</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {analytics.reason ?? "No usage has been recorded yet."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                <MetricCard
                  label="Active now"
                  value={num(analytics.activeNow)}
                  detail="Visitors in the last 5 minutes"
                  icon={Radio}
                  tone="healthy"
                />
                <MetricCard
                  label="Today"
                  value={num(analytics.today.visitors)}
                  detail={`${num(analytics.today.pageViews)} page views`}
                  icon={Users}
                />
                <MetricCard
                  label="Downloads"
                  value={num(analytics.last30.downloads)}
                  detail={`Avg ${ms(analytics.avgDownloadMs)} when successful`}
                  icon={Download}
                />
                <MetricCard
                  label="Delivery rate"
                  value={deliveryRate(analytics.last30)}
                  detail={`${num(analytics.last30.deliveryFailures)} service failures`}
                  icon={CircleGauge}
                  tone={delivery !== null && delivery < 80 ? "danger" : "healthy"}
                />
                <MetricCard
                  label="Data served"
                  value={bytes(analytics.last30.bytes)}
                  detail={`${bytes(analytics.allTime.bytes)} retained`}
                  icon={Zap}
                />
                <MetricCard
                  label="Resolves"
                  value={num(analytics.last30.resolves)}
                  detail={`Avg ${ms(analytics.avgResolveMs)} when successful`}
                  icon={FileWarning}
                  tone={analytics.last30.deliveryFailures > 0 ? "warning" : "healthy"}
                />
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-border/80 bg-surface p-4 shadow-soft">
              <h2 className="mb-3 text-sm font-semibold">Infrastructure</h2>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <HealthTile
                  icon={Database}
                  label="Database"
                  value={system.database === "ok" ? "Connected" : "Unavailable"}
                  detail={
                    system.activeReferences === null
                      ? "Reference count unavailable"
                      : `${num(system.activeReferences)} live references`
                  }
                  tone={system.database === "ok" ? "healthy" : "danger"}
                />
                <HealthTile
                  icon={Terminal}
                  label="Extraction engine"
                  value={system.engine.ready ? "Ready" : system.engine.engineEnabled ? "Unavailable" : "Disabled"}
                  detail={system.engine.muxCapable ? "yt-dlp + FFmpeg" : "yt-dlp only"}
                  tone={system.engine.ready ? "healthy" : system.engine.engineEnabled ? "danger" : "warning"}
                />
                <HealthTile
                  icon={HardDrive}
                  label="Temporary storage"
                  value={system.storage.writable ? "Writable" : "Read-only"}
                  detail={`${num(system.storage.tempDirs)} dirs · ${bytes(system.storage.bytes)}`}
                  tone={system.storage.writable ? "healthy" : "danger"}
                />
                <HealthTile
                  icon={Activity}
                  label="Analytics"
                  value={!analytics.enabled ? "Disabled" : analytics.available ? "Recording" : "Unavailable"}
                  detail={`${num(system.retentionDays)}-day retention`}
                  tone={!analytics.enabled ? "neutral" : analytics.available ? "healthy" : "warning"}
                />
              </div>
            </div>
          </section>

          {/* ── Analytics ─────────────────────────────────────────────────── */}
          <section id="analytics" className="scroll-mt-24 pt-12">
            <h2 className="mb-4 font-display text-xl font-semibold tracking-tight sm:text-2xl">Analytics</h2>
            {analytics.available ? (
              <>
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(17rem,0.75fr)]">
                  <ActivityChart daily={analytics.daily} />
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {(
                      [
                        ["Today", analytics.today],
                        ["Last 7 days", analytics.last7],
                        ["Last 30 days", analytics.last30],
                        ["Retained", analytics.allTime],
                      ] as Array<[string, Totals]>
                    ).map(([label, totals]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-surface p-4 shadow-soft"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold">{label}</p>
                          <p className="mt-1 text-[0.68rem] text-muted-foreground">
                            {num(totals.pageViews)} views · {num(totals.downloads)} downloads
                          </p>
                        </div>
                        <p className="figure-mono font-display text-xl font-semibold">{num(totals.visitors)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <BarList
                    title="Top pages"
                    description="Page views, last 30 days"
                    rows={analytics.pages}
                    empty="No page views recorded."
                  />
                  <BarList
                    title="Devices"
                    description="Coarse device buckets"
                    rows={analytics.devices}
                    empty="No device data recorded."
                  />
                  <BarList
                    title="Traffic sources"
                    description="External referrers only"
                    rows={analytics.referrers}
                    empty="No external referrers recorded."
                  />
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Analytics appear once recording is enabled and data is readable.
              </div>
            )}
          </section>

          {/* ── Platforms ─────────────────────────────────────────────────── */}
          <section id="platforms" className="scroll-mt-24 pt-12">
            <h2 className="mb-4 font-display text-xl font-semibold tracking-tight sm:text-2xl">
              Platforms &amp; delivery
            </h2>
            {analytics.available ? (
              <>
                <div className="grid gap-4 lg:grid-cols-3">
                  <BarList
                    title="Platform activity"
                    description="Events by platform, last 30 days"
                    rows={analytics.platforms}
                    empty="No platform activity recorded."
                  />
                  <BarList
                    title="Formats selected"
                    description="Download qualities chosen"
                    rows={analytics.qualities}
                    empty="No downloads recorded."
                  />
                  <BarList
                    title="Error reasons"
                    description="Red rows are service faults"
                    rows={analytics.errors}
                    empty="No failures recorded."
                    markInputErrors
                  />
                </div>
                <FailureTable rows={analytics.recentFailures} />
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Platform reporting requires readable analytics data.
              </div>
            )}
          </section>

          {/* ── System ────────────────────────────────────────────────────── */}
          <section id="system" className="scroll-mt-24 pb-10 pt-12">
            <h2 className="mb-4 font-display text-xl font-semibold tracking-tight sm:text-2xl">System</h2>
            <div className="grid gap-4 xl:grid-cols-3">
              <SystemCard
                icon={Terminal}
                title="Extraction engine"
                status={
                  <StatusPill tone={system.engine.ready ? "healthy" : system.engine.engineEnabled ? "danger" : "warning"}>
                    {system.engine.ready ? "Ready" : system.engine.engineEnabled ? "Unavailable" : "Disabled"}
                  </StatusPill>
                }
              >
                <DefinitionRow label="Engine enabled">{system.engine.engineEnabled ? "Yes" : "No"}</DefinitionRow>
                <DefinitionRow label="Muxing + MP3">{system.engine.muxCapable ? "Available" : "Needs FFmpeg"}</DefinitionRow>
                <DefinitionRow label="yt-dlp">
                  <code className="figure-mono break-all text-[0.65rem]">{system.engine.ytdlp ?? "not found"}</code>
                </DefinitionRow>
                <DefinitionRow label="FFmpeg">
                  <code className="figure-mono break-all text-[0.65rem]">{system.engine.ffmpeg ?? "not found"}</code>
                </DefinitionRow>
                <DefinitionRow label="ffprobe">
                  <code className="figure-mono break-all text-[0.65rem]">{system.engine.ffprobe ?? "not found"}</code>
                </DefinitionRow>
              </SystemCard>

              <SystemCard
                icon={Database}
                title="Database &amp; storage"
                status={
                  <StatusPill tone={system.database === "ok" && system.storage.writable ? "healthy" : "danger"}>
                    {system.database === "ok" && system.storage.writable ? "Healthy" : "Degraded"}
                  </StatusPill>
                }
              >
                <DefinitionRow label="MySQL">{system.database === "ok" ? "Connected" : "Unavailable"}</DefinitionRow>
                <DefinitionRow label="Live references">
                  <span className="figure-mono">{num(system.activeReferences)}</span>
                </DefinitionRow>
                <DefinitionRow label="Temp workspaces">
                  <span className="figure-mono">
                    {num(system.storage.tempDirs)} · {bytes(system.storage.bytes)}
                  </span>
                </DefinitionRow>
                <DefinitionRow label="Writable">{system.storage.writable ? "Yes" : "No"}</DefinitionRow>
                <DefinitionRow label="Path">
                  <code className="figure-mono break-all text-[0.65rem]">{system.storage.path}</code>
                </DefinitionRow>
              </SystemCard>

              <SystemCard icon={Gauge} title="Limits" status={<StatusPill tone="neutral">Configured</StatusPill>}>
                <DefinitionRow label="Resolve rate">
                  <span className="figure-mono">{system.limits.resolve}</span>
                </DefinitionRow>
                <DefinitionRow label="Download rate">
                  <span className="figure-mono">{system.limits.download}</span>
                </DefinitionRow>
                <DefinitionRow label="Max file">
                  <span className="figure-mono">{num(system.maxFileSizeMb)} MB</span>
                </DefinitionRow>
                <DefinitionRow label="Reference TTL">
                  <span className="figure-mono">{num(system.mediaTtlMinutes)} min</span>
                </DefinitionRow>
                <DefinitionRow label="Retention">
                  <span className="figure-mono">{num(system.retentionDays)} days</span>
                </DefinitionRow>
              </SystemCard>
            </div>
          </section>
        </div>
      </SidebarInset>
    </>
  );
}

export function AdminDashboard({
  analytics,
  system,
  session,
  generatedAt,
}: {
  analytics: AnalyticsReport;
  system: SystemReport;
  session: ActiveSession;
  generatedAt: Date;
}) {
  return (
    <SidebarProvider defaultOpen>
      <a
        href="#admin-main"
        className="focus-ring sr-only z-50 rounded-md bg-background px-3 py-2 text-sm font-semibold focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to dashboard content
      </a>
      <DashboardContent analytics={analytics} system={system} session={session} generatedAt={generatedAt} />
    </SidebarProvider>
  );
}
