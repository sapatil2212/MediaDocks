import { Check, Loader2 } from "lucide-react";
import { PROCESSING_STEPS } from "@/lib/resolve-media";
import { cn } from "@/lib/utils";

export function ProcessingState({ step }: { step: number }) {
  return (
    <div
      className="animate-pop rounded-2xl border border-border bg-surface p-5 shadow-soft"
      role="status"
      aria-live="polite"
    >
      <div className="relative h-1 overflow-hidden rounded-full bg-surface-strong">
        <span className="animate-sweep absolute inset-y-0 w-1/3 rounded-full bg-primary" />
      </div>
      <ul className="mt-4 space-y-3">
        {PROCESSING_STEPS.map((label, index) => {
          const done = index < step;
          const active = index === step;
          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-3 text-sm transition-colors duration-300",
                done ? "text-muted-foreground" : active ? "text-foreground" : "text-muted-foreground/50",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                  done
                    ? "border-primary/40 bg-accent text-accent-foreground"
                    : active
                      ? "border-primary text-primary"
                      : "border-border",
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />
                )}
              </span>
              <span className={cn(active && "font-semibold")}>{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
