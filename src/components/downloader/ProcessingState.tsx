import { Check, Loader2, Shield, Zap } from "lucide-react";
import { PROCESSING_STEPS } from "@/lib/resolve-media";
import { cn } from "@/lib/utils";

export function ProcessingState({ step }: { step: number }) {
  return (
    <div
      className="animate-pop rounded-2xl border border-border bg-surface p-5 shadow-soft"
      role="status"
      aria-live="polite"
    >
      {/* Animated progress bar */}
      <div className="relative h-1.5 overflow-hidden rounded-full bg-surface-strong">
        <span className="animate-sweep absolute inset-y-0 w-2/5 rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
      </div>

      <ul className="mt-4 space-y-2.5">
        {PROCESSING_STEPS.map((label, index) => {
          const done = index < step;
          const active = index === step;
          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-3 text-sm transition-all duration-300",
                done
                  ? "text-muted-foreground"
                  : active
                    ? "text-foreground"
                    : "text-muted-foreground/40",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-all duration-300",
                  done
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : active
                      ? "border-primary text-primary shadow-glow"
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
              <span className={cn("transition-all duration-200", active && "font-semibold")}>{label}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-surface-strong p-3">
        <Shield className="h-4 w-4 shrink-0 text-primary opacity-70" />
        <p className="text-xs text-muted-foreground">
          Processing happens server-side. Nothing is stored after your session.
        </p>
      </div>
    </div>
  );
}
