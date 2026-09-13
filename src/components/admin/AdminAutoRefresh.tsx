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
 * markup without losing scroll position or remounting the page.
 *
 * Polling is pausable, and pauses itself while the tab is hidden so a dashboard
 * left open overnight does not keep querying the database for nobody.
 */
const INTERVAL_SECONDS = 30;

export function AdminAutoRefresh({ generatedAt }: { generatedAt: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [live, setLive] = useState(true);
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

    const timer = window.setInterval(refresh, INTERVAL_SECONDS * 1000);
    // Catch up immediately when the operator comes back to the tab.
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [live, router]);

  const secondsAgo = Math.max(0, Math.round((now - generatedAt) / 1000));

  return (
    <div className="flex items-center gap-2">
      <span
        className="figure-mono text-xs text-muted-foreground"
        aria-live="polite"
        aria-atomic="true"
      >
        {isPending ? "updating…" : secondsAgo < 5 ? "just now" : `updated ${secondsAgo}s ago`}
      </span>

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
        onClick={() => setLive((v) => !v)}
        aria-pressed={live}
        className={cn(
          "focus-ring inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors",
          live
            ? "border-primary/40 bg-accent text-accent-foreground"
            : "border-border bg-surface text-muted-foreground hover:text-foreground",
        )}
      >
        {live ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        {live ? `Live · ${INTERVAL_SECONDS}s` : "Paused"}
      </button>
    </div>
  );
}
