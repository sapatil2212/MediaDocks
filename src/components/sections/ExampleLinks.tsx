"use client";

import { toast } from "sonner";
import { PlatformIcon } from "@/components/PlatformIcon";
import { PLATFORMS } from "@/lib/platforms";
import { requestUrl } from "@/lib/scroll";
import { cn } from "@/lib/utils";

export function ExampleLinks() {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium">
        Or test with a verified public link:
      </span>
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.id}
            type="button"
            onClick={() => {
              requestUrl(platform.exampleUrl);
              toast.info(`${platform.name} sample loaded`, {
                description: `${platform.exampleLabel}. Click Download to resolve.`,
              });
            }}
            title={platform.exampleLabel}
            className={cn(
              "focus-ring group inline-flex items-center gap-1.5 rounded-lg border border-border/70",
              "bg-surface/60 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-soft transition-all duration-200",
              "hover:border-border hover:bg-surface hover:text-foreground hover:-translate-y-0.5",
            )}
          >
            <PlatformIcon
              platform={platform.id}
              className={cn("h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110", platform.colorClass)}
            />
            <span>{platform.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
