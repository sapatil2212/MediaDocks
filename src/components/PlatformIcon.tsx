import { Facebook, Instagram, Youtube } from "lucide-react";
import type { Platform } from "@/lib/media";
import { cn } from "@/lib/utils";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path d="M17.53 3h3.02l-6.6 7.54L21.75 21h-5.5l-4.3-5.63L6.9 21H3.87l7.05-8.05L2.75 3h5.63l4.02 5.31L17.53 3Zm-1.06 16.2h1.67L7.6 4.72H5.8l10.67 14.48Z" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path d="M12.02 2C6.9 2 4 5.28 4 8.9c0 1.68.93 3.77 2.42 4.43.23.1.35.05.4-.17.04-.16.24-.96.33-1.33a.35.35 0 0 0-.08-.34c-.44-.53-.79-1.5-.79-2.4 0-2.33 1.8-4.58 4.86-4.58 2.65 0 4.5 1.77 4.5 4.3 0 2.86-1.46 4.84-3.36 4.84-1.05 0-1.83-.85-1.58-1.9.3-1.26.88-2.61.88-3.52 0-.81-.44-1.49-1.36-1.49-1.08 0-1.95 1.1-1.95 2.58 0 .94.32 1.58.32 1.58l-1.29 5.4c-.34 1.43-.05 3.19-.03 3.36.02.11.15.14.22.05.09-.12 1.26-1.55 1.66-2.98.11-.4.64-2.47.64-2.47.32.6 1.25 1.13 2.24 1.13 2.95 0 4.96-2.66 4.96-6.22C20 6.4 17.46 2 12.02 2Z" />
    </svg>
  );
}

const map = {
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  x: XIcon,
  pinterest: PinterestIcon,
} as const;

export function PlatformIcon({
  platform,
  className,
}: {
  platform: Platform;
  className?: string;
}) {
  const Icon = map[platform];
  return <Icon className={cn("h-4 w-4", className)} />;
}
