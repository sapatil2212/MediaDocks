"use client";

import Link from "next/link";
import { ArrowUpRight, Music2, Play } from "lucide-react";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Reveal } from "@/components/Reveal";
import { getPlatform } from "@/lib/platforms";
import { PLATFORM_PAGES } from "@/lib/platform-pages";
import { requestUrl } from "@/lib/scroll";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function DownloaderLinks() {
  return (
    <section
      id="downloaders"
      className="scroll-mt-24 border-t border-border bg-surface-strong/30 py-20 lg:py-24"
    >
      <div className="section-shell">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Platform-Specific Portals</p>
            <h2 className="section-title mt-2">Dedicated platform downloaders</h2>
            <p className="mt-3 text-muted-foreground">
              Deep dive into platform-specific URL formats, extraction capabilities, and limits.
            </p>
          </Reveal>
        </div>

        {/* Interactive Platform Grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Audio extraction is its own search intent with its own page, so it
              is listed alongside the platform portals rather than hidden inside
              the YouTube one. */}
          <Reveal>
            <Link
              href="/youtube-to-mp3"
              className="panel group flex h-full flex-col justify-between p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lift"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-surface shadow-soft transition-transform duration-300 group-hover:scale-110">
                    <Music2 className="h-6 w-6 text-primary" aria-hidden="true" />
                  </span>
                  <span className="figure-mono rounded-full border border-border bg-surface px-2.5 py-1 text-[0.7rem] font-semibold text-muted-foreground">
                    M4A · MP3
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                  YouTube to MP3
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                  Audio only, without the video. MP3 at 128, 192 or 320 kbps, or the original M4A.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                  <span>Explore page</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          </Reveal>

          {PLATFORM_PAGES.map((page, index) => {
            const meta = getPlatform(page.platform);
            return (
              <Reveal key={page.slug} delay={index * 60}>
                <div className="panel group flex h-full flex-col justify-between p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lift">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-surface shadow-soft transition-transform duration-300 group-hover:scale-110">
                        <PlatformIcon
                          platform={page.platform}
                          className={cn("h-6 w-6", meta.colorClass)}
                        />
                      </span>

                      <span className="figure-mono rounded-full border border-border bg-surface px-2.5 py-1 text-[0.7rem] font-semibold text-muted-foreground">
                        {meta.outputs}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {page.navLabel} Downloader
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                      {page.tagline}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-2 border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        requestUrl(meta.exampleUrl);
                        toast.info(`Loaded ${meta.name} into Downloader`);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      <Play className="h-3 w-3 fill-current text-primary" />
                      <span>Test Demo</span>
                    </button>

                    <Link
                      href={page.slug}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5"
                    >
                      <span>Explore page</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
