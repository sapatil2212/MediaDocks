import { Check, Download } from "lucide-react";
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
        "relative h-11 overflow-hidden rounded-xl px-5 text-sm font-semibold transition-all duration-200",
        variant === "default" &&
          "shadow-glow hover:-translate-y-0.5 hover:shadow-lift disabled:translate-y-0",
        className,
      )}
    >
      {phase === "downloading" ? (
        <Progress
          value={progress}
          aria-hidden
          className="absolute inset-0 h-full rounded-none bg-primary-foreground/15"
        />
      ) : null}
      <span className="relative inline-flex items-center gap-2">
        {phase === "idle" ? (
          <>
            <Download className="h-4 w-4" />
            {label}
          </>
        ) : phase === "downloading" ? (
          <>Downloading… {Math.floor(progress)}%</>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Downloaded
          </>
        )}
      </span>
    </Button>
  );
}
