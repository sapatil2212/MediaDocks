"use client";

import { toast } from "sonner";
import { History, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/PlatformIcon";
import { getPlatform } from "@/lib/platforms";
import { timeAgo, type RecentItem } from "@/hooks/use-recent";

export function RecentDownloads({
  items,
  onOpen,
  onRemove,
  onClear,
}: {
  items: RecentItem[];
  onOpen: (item: RecentItem) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="recent-heading" className="rounded-2xl border border-border bg-surface/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 id="recent-heading" className="flex items-center gap-2 text-sm font-semibold">
          <History className="h-4 w-4 text-muted-foreground" />
          Recent
        </h3>
        <Button
          variant="ghost"
          onClick={() => {
            onClear();
            toast.success("Recent list cleared");
          }}
          className="h-8 rounded-lg px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      </div>

      <ul className="mt-3 divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5">
            <PlatformIcon
              platform={item.platform}
              className={getPlatform(item.platform).colorClass}
            />
            <button
              onClick={() => onOpen(item)}
              className="min-w-0 flex-1 text-left transition-opacity hover:opacity-80"
            >
              <span className="block truncate text-sm font-medium">
                {getPlatform(item.platform).name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{item.label}</span>
            </button>
            <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(item.at)}</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${item.label} from recent`}
              onClick={() => {
                onRemove(item.id);
                toast.success("Removed from recent");
              }}
              className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">Stored only in this browser.</p>
    </section>
  );
}
