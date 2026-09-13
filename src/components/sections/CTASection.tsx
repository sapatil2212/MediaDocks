"use client";

import { ArrowUp, Sparkles, Play, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { scrollToDownloader, requestUrl } from "@/lib/scroll";
import { toast } from "sonner";

export function CTASection() {
  return (
    <section className="relative overflow-hidden border-t border-border py-20 lg:py-24">
      {/* Background Aurora Glow */}
      <div
        className="aurora pointer-events-none absolute inset-x-0 -bottom-36 h-96 opacity-60"
        aria-hidden="true"
      />

      <div className="section-shell relative z-10">
        <div className="panel relative overflow-hidden border-primary/30 bg-gradient-to-b from-surface to-surface-strong/80 p-8 shadow-lift backdrop-blur-xl sm:p-12">
          <div className="flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                <Zap className="h-3.5 w-3.5" />
                <span>Instant & Watermark-Free</span>
              </div>
              <h2 className="section-title mt-4">Got a link? That is the entire setup.</h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                No account required, no software installation, no hidden limits. Paste a public media link and pick the resolution you want.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  requestUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
                  scrollToDownloader();
                  toast.success("Loaded demo video and scrolled to Downloader!");
                }}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Try Demo Link</span>
              </button>

              <Button
                onClick={scrollToDownloader}
                className="h-12 rounded-xl px-7 text-sm font-semibold shadow-glow transition-all hover:-translate-y-0.5"
              >
                <ArrowUp className="h-4 w-4" />
                <span>Back to Downloader</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
