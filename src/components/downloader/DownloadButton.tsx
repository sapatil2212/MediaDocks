import { Check, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type DownloadPhase = "idle" | "downloading" | "done";

export function DownloadButton({
  label,
  phase,
  progress,
  onClick,
  variant = "default",
  className,
}: {
  label: string;
  phase: DownloadPhase;
  /** 0–100 while downloading */
  progress: number;
  onClick: () => void;
  variant?: "default" | "outline";
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      onClick={onClick}
      disabled={phase !== "idle"}
      aria-live="polite"
      className={cn(
        "relative h-[34px] overflow-hidden rounded-[4px] px-3 text-xs font-medium shadow-none transition-colors duration-150",
        phase === "done" && "bg-primary/90",
        className,
      )}
    >
      {/* Progress fill overlay */}
      {phase === "downloading" ? (
        <Progress
          value={progress}
          aria-hidden
          className="absolute inset-0 h-full rounded-none bg-primary-foreground/15"
        />
      ) : null}

      <span className="relative inline-flex items-center gap-1.5">
        {phase === "idle" ? (
          <>
            <Download className="h-3.5 w-3.5" />
            {label}
          </>
        ) : phase === "downloading" ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Downloading… {Math.floor(progress)}%
          </>
        ) : (
          <>
            <Check className="h-3.5 w-3.5" />
            Downloaded ✓
          </>
        )}
      </span>
    </Button>
  );
}
