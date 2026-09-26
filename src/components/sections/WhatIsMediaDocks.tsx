import Link from "next/link";
import { ArrowRight, CheckCircle2, Cpu, HardDrive, Shield, Sparkles, Zap } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const KEY_BENEFITS = [
  "Zero permanent media storage on disk — strictly ephemeral memory streaming",
  "True multi-rung resolution selection from 144p up to 4K UHD without fake upscaling",
  "No registration, user accounts, paywalls, or invasive client software installs",
  "Preserves original AAC audio without double-compression generation loss",
  "Built-in AI speech recognition with automatic spoken-language detection",
];

export function WhatIsMediaDocks() {
  return (
    <section id="what-is-mediadocks" className="scroll-mt-24 border-t border-border py-20 lg:py-24">
      <div className="section-shell">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Column: Mission & Problem Solved */}
          <Reveal>
            <p className="eyebrow">Product Overview</p>
            <h2 className="section-title mt-2 text-balance">
              What is MediaDocks and what problem does it solve?
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>
                <strong>MediaDocks</strong> is an independent, universal web utility designed to simplify
                how creators, researchers, and digital professionals access and process public digital
                media.
              </p>
              <p>
                The digital web has long suffered from broken media converters: desktop applications
                bundled with unwanted adware, suspicious websites loaded with intrusive pop-up
                redirects, and cloud tools that secretly hoard personal video files on third-party servers.
              </p>
              <p>
                We engineered MediaDocks to resolve this: a clean, responsive web application that
                multiplexes public audio and video streams transiently in memory, pipes finished MP4,
                MP3, or SRT files directly to your device, and leaves{" "}
                <strong className="text-foreground">zero permanent footprint</strong> on our servers.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-xs font-semibold text-foreground shadow-soft transition-all hover:border-foreground/30 hover:bg-surface-strong"
              >
                <span>Read our full mission</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/guides"
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-2.5 text-xs font-semibold text-primary shadow-soft transition-all hover:bg-primary/20"
              >
                <span>Browse Resource Center</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Reveal>

          {/* Right Column: Architectural Highlights Card */}
          <Reveal delay={90}>
            <div className="panel relative overflow-hidden p-6 sm:p-8 shadow-lift border-border/80">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-4 w-4" />
                <span>Engineered for Reliability</span>
              </div>
              <h3 className="mt-3 text-xl font-bold text-foreground">
                How MediaDocks operates differently
              </h3>
              <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                Every feature is built on genuine technical capabilities without marketing exaggerations.
              </p>

              <ul className="mt-6 space-y-3.5 text-xs sm:text-sm text-muted-foreground">
                {KEY_BENEFITS.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <span className="text-foreground/90">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-xl border border-border bg-surface-strong/50 p-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>100% Lawful & Ethical Scope</span>
                </div>
                <p className="mt-1.5 leading-relaxed">
                  MediaDocks processes only publicly accessible media. We do not circumvent DRM,
                  passwords, paywalls, or private friend-only barriers.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
