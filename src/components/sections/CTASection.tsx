import Link from "next/link";
import { ArrowRight, BookOpen, Zap } from "lucide-react";

/**
 * Closing call to action shared by the home, guide and tool pages. It links to
 * first-party tools and the guides library only.
 */
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
                <span>No account needed</span>
              </div>
              <h2 className="section-title mt-4">Pick a tool and start with your own file.</h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                Transcribe a recording, add subtitles, convert an image or document, or read a
                guide first. There is nothing to install and no sign-up step.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/guides"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
              >
                <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Read the guides</span>
              </Link>
              <Link
                href="/video-to-text"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5"
              >
                <span>Try Video to Text</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
