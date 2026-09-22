"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Keeps the report live.
 *
 * The page is a server component, so refreshing means asking the server to
 * re-render it — `router.refresh()` re-runs the queries and swaps in the new
 * markup without losing scroll position, sort state or the sidebar.
 *
 * Polling is pausable, the interval is selectable, and it pauses itself while
 * the tab is hidden so a dashboard left open overnight does not keep querying
 * the database for nobody.
 */
const INTERVAL_OPTIONS = [5, 10, 30, 60] as const;
const DEFAULT_INTERVAL = 10;
/** Past this, the figures on screen are old enough to call out. */
const STALE_AFTER_SECONDS = 90;

export function AdminAutoRefresh({ generatedAt }: { generatedAt: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [live, setLive] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(DEFAULT_INTERVAL);
  const [now, setNow] = useState(() => Date.now());

  // Drives the "updated Ns ago" label.
  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!live) return;

    const refresh = () => {
      if (document.hidden) return;
      startTransition(() => router.refresh());
    };

    const timer = window.setInterval(refresh, intervalSeconds * 1000);
    // Catch up immediately when the operator comes back to the tab.
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [live, intervalSeconds, router]);

  const secondsAgo = Math.max(0, Math.round((now - generatedAt) / 1000));
  const isStale = secondsAgo > STALE_AFTER_SECONDS;

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "figure-mono hidden text-xs lg:inline",
          isStale && !isPending ? "font-semibold text-amber-600 dark:text-amber-400" : "text-muted-foreground",
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {isPending ? "updating…" : secondsAgo < 5 ? "live" : `${secondsAgo}s ago`}
      </span>

      <label className="sr-only" htmlFor="admin-refresh-interval">
        Auto-refresh interval
      </label>
      <select
        id="admin-refresh-interval"
        value={live ? intervalSeconds : 0}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (next === 0) {
            setLive(false);
            return;
          }
          setIntervalSeconds(next);
          setLive(true);
        }}
        className="focus-ring hidden h-9 rounded-xl border border-border bg-surface px-2 text-xs font-semibold text-muted-foreground md:block"
      >
        {INTERVAL_OPTIONS.map((option) => (
          <option key={option} value={option}>
            Every {option}s
          </option>
        ))}
        <option value={0}>Paused</option>
      </select>

      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        aria-label="Refresh now"
        className="focus-ring grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
      >
        <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
      </button>

      <button
        type="button"
        onClick={() => setLive((value) => !value)}
        aria-pressed={live}
        aria-label={live ? "Pause auto-refresh" : "Resume auto-refresh"}
        className={cn(
          "focus-ring grid h-9 w-9 place-items-center rounded-xl border transition-colors md:hidden",
          live
            ? "border-primary/40 bg-accent text-accent-foreground"
            : "border-border bg-surface text-muted-foreground",
        )}
      >
        {live ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
