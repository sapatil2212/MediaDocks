import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 6.5h-2a4 4 0 0 0 0 8h2" />
        <path d="M14.5 6.5h2a4 4 0 0 1 3.2 6.4" />
        <path d="M9 10.5h6" />
        <path d="M12 14v6" />
        <path d="m9 17.5 3 3 3-3" />
      </svg>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-[1.05rem] font-semibold tracking-tight">MediaDocks</span>
    </span>
  );
}
