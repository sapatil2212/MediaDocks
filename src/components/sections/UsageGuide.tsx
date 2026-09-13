"use client";

import { useRef, useState } from "react";
import { Monitor, Smartphone, Copy, Check, Sparkles, ExternalLink, ArrowRight } from "lucide-react";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Reveal } from "@/components/Reveal";
import { PLATFORMS, detectPlatform } from "@/lib/platforms";
import type { Platform } from "@/lib/media";
import { requestUrl } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Guide {
  mobile: string[];
  desktop: string[];
  shape: string;
  sampleUrl: string;
  warning?: string;
}

const GUIDES: Record<Platform, Guide> = {
  youtube: {
    mobile: [
      "Open the video or short in the YouTube app.",
      "Tap 'Share' right below the player.",
      "Choose 'Copy link'.",
    ],
    desktop: [
      "Open the video on youtube.com.",
      "Copy the address from the browser address bar, or click 'Share' → 'Copy link'.",
      "Timestamps such as &t=42s are automatically handled and ignored.",
    ],
    shape: "youtube.com/watch?v=… · youtu.be/… · youtube.com/shorts/…",
    sampleUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  instagram: {
    mobile: [
      "Open the reel or post in Instagram.",
      "Tap the paper-plane share icon or the ••• menu.",
      "Tap 'Copy link'.",
    ],
    desktop: [
      "Open the reel or post on instagram.com.",
      "Copy the URL from your browser address bar.",
    ],
    shape: "instagram.com/reel/… · instagram.com/p/…",
    sampleUrl: "https://www.instagram.com/p/Cu123456789/",
    warning:
      "Posts must be public. Stories or private account links require authentication and are not downloadable.",
  },
  x: {
    mobile: ["Open the post on X.", "Tap the share button below the tweet.", "Select 'Copy link'."],
    desktop: [
      "Open the post on x.com or twitter.com.",
      "Click the share icon and select 'Copy link', or copy the address bar URL.",
    ],
    shape: "x.com/user/status/… · twitter.com/user/status/…",
    sampleUrl: "https://x.com/nasa/status/1234567890",
    warning: "Copy the link of the actual post containing the video/media, not a quote-retweet.",
  },
  pinterest: {
    mobile: ["Open the Pin.", "Tap the share arrow icon.", "Choose 'Copy link'."],
    desktop: [
      "Open the Pin on pinterest.com.",
      "Copy the browser address bar, or click the share button.",
    ],
    shape: "pinterest.com/pin/… · pin.it/…",
    sampleUrl: "https://www.pinterest.com/pin/123456789/",
  },
  facebook: {
    mobile: [
      "Open the public video or reel in Facebook.",
      "Tap the ••• menu or 'Share'.",
      "Choose 'Copy link'.",
    ],
    desktop: [
      "Open the video on facebook.com.",
      "Copy the URL from the address bar, or right-click the video and pick 'Copy video URL'.",
    ],
    shape: "facebook.com/watch?v=… · facebook.com/reel/… · fb.watch/…",
    sampleUrl: "https://www.facebook.com/watch/?v=123456789",
    warning: "Only genuinely public videos work. Private groups and friends-only posts cannot be fetched.",
  },
};

type Device = "mobile" | "desktop";

export function UsageGuide() {
  const [active, setActive] = useState<Platform>("youtube");
  const [device, setDevice] = useState<Device>("mobile");
  const [copiedSample, setCopiedSample] = useState(false);
  const [testInput, setTestInput] = useState("");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const guide = GUIDES[active];
  const platform = PLATFORMS.find((p) => p.id === active)!;
  const steps = guide[device];

  const detected = testInput.trim() ? detectPlatform(testInput.trim()) : null;

  const handleCopySample = () => {
    navigator.clipboard.writeText(guide.sampleUrl);
    setCopiedSample(true);
    toast.success("Sample link copied to clipboard!");
    setTimeout(() => setCopiedSample(false), 2000);
  };

  const handleSendToDownloader = () => {
    requestUrl(platform.exampleUrl);
    toast.info(`Loaded ${platform.name} into downloader above.`);
  };

  return (
    <section id="how-to-copy-links" className="scroll-mt-24 border-t border-border py-20 lg:py-24">
      <div className="section-shell">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Interactive Link Guide</p>
          <h2 className="section-title mt-2">Where to find the link on each app</h2>
          <p className="mt-3 text-muted-foreground">
            Switch between mobile and desktop instructions, or test a link format with our live link tester.
          </p>
        </Reveal>

        {/* Interactive Platform Tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const isCurrent = active === p.id;
            return (
              <button
                key={p.id}
                ref={(el) => {
                  tabRefs.current[p.id] = el;
                }}
                type="button"
                onClick={() => setActive(p.id)}
                className={`focus-ring inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold sm:text-sm transition-all duration-200 ${
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground shadow-glow"
                    : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <PlatformIcon
                  platform={p.id}
                  className={cn("h-4 w-4", isCurrent ? "text-primary-foreground" : p.colorClass)}
                />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* Main Guide Panel */}
        <Reveal delay={70} className="mt-6">
          <div className="panel overflow-hidden border-border/80 bg-surface/90 p-6 shadow-lift sm:p-8">
            {/* Top Toolbar */}
            <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-strong">
                  <PlatformIcon platform={active} className={cn("h-5 w-5", platform.colorClass)} />
                </span>
                <div>
                  <h3 className="text-base font-bold sm:text-lg">{platform.name} Link Guide</h3>
                  <p className="font-mono text-xs text-muted-foreground">{guide.shape}</p>
                </div>
              </div>

              {/* Device Toggle */}
              <div className="flex rounded-xl border border-border bg-surface-strong p-1">
                <button
                  type="button"
                  onClick={() => setDevice("mobile")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    device === "mobile"
                      ? "bg-surface text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Mobile App</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDevice("desktop")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    device === "desktop"
                      ? "bg-surface text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  <span>Desktop Browser</span>
                </button>
              </div>
            </div>

            {/* Step list for selected platform & device */}
            <div className="mt-6 grid gap-6 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-7">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Steps for {device === "mobile" ? "Phone & Tablet" : "Computer / Mac"}
                </h4>
                <ol className="space-y-3">
                  {steps.map((text, idx) => (
                    <li
                      key={text}
                      className="flex items-start gap-3 rounded-xl border border-border/60 bg-surface p-3.5 text-sm transition-colors hover:border-primary/30"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                        {idx + 1}
                      </span>
                      <span className="text-foreground text-xs sm:text-sm">{text}</span>
                    </li>
                  ))}
                </ol>

                {guide.warning && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-400">
                    <span className="font-semibold">Notice:</span> {guide.warning}
                  </div>
                )}
              </div>

              {/* Interactive Quick Actions Box */}
              <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-surface-strong/40 p-5 lg:col-span-5">
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>Quick Test Sandbox</span>
                  </h4>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Want to test without opening the app? Use our verified sample link:
                  </p>

                  <div className="mt-3 rounded-xl border border-border bg-surface p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs text-foreground">
                        {platform.exampleUrl}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopySample}
                        className="rounded-lg border border-border bg-surface-strong p-1.5 text-xs text-muted-foreground hover:text-foreground"
                        title="Copy sample URL"
                      >
                        {copiedSample ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={handleSendToDownloader}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-95"
                  >
                    <span>Load {platform.name} into Downloader</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
