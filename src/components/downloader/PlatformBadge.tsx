import { PlatformIcon } from "@/components/PlatformIcon";
import { getPlatform } from "@/lib/platforms";
import type { Platform } from "@/lib/media";
import { cn } from "@/lib/utils";

export function PlatformBadge({
  platform,
  label,
  className,
}: {
  platform: Platform;
  label?: string;
  className?: string;
}) {
  const meta = getPlatform(platform);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold",
        className,
      )}
    >
      <PlatformIcon platform={platform} className={cn("h-3.5 w-3.5", meta.colorClass)} />
      {label ?? meta.name}
    </span>
  );
}
