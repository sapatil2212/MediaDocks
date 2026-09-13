import { AlertCircle, CloudOff, Link2Off, Lock, RefreshCw, SearchX, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResolveErrorCode } from "@/lib/media";

const COPY: Record<
  ResolveErrorCode,
  { title: string; body: string; icon: typeof AlertCircle }
> = {
  invalid_url: {
    title: "Invalid URL",
    body: "Paste a public Instagram, YouTube, Pinterest, Facebook or X link.",
    icon: Link2Off,
  },
  unsupported: {
    title: "Unsupported platform",
    body: "MediaDocks currently works with Instagram, YouTube, Pinterest, Facebook and X links.",
    icon: AlertCircle,
  },
  platform_unavailable: {
    title: "We couldn't access this platform right now",
    body: "The platform didn't publish any media information for this link. Only publicly available content can be processed.",
    icon: CloudOff,
  },
  not_found: {
    title: "We couldn't find this media",
    body: "The post may have been deleted, or it isn't public.",
    icon: SearchX,
  },
  timeout: {
    title: "The request took too long",
    body: "The platform didn't respond in time. Please try again.",
    icon: Timer,
  },
  rate_limited: {
    title: "Please wait a moment and try again",
    body: "Too many requests came from this device. Give it a few seconds.",
    icon: Timer,
  },
  restricted: {
    title: "We couldn't process this link",
    body: "Only content that is publicly accessible can be processed. Please try another link.",
    icon: Lock,
  },
};

export function ErrorState({ code, onRetry }: { code: ResolveErrorCode; onRetry: () => void }) {
  const { title, body, icon: Icon } = COPY[code];

  return (
    <div
      role="alert"
      className="animate-pop flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-soft sm:flex-row sm:items-center"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-strong text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      <Button
        variant="outline"
        onClick={onRetry}
        className="h-11 shrink-0 rounded-xl px-4 text-sm font-semibold"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
