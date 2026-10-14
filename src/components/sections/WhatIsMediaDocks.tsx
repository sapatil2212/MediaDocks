import Link from "next/link";
import { ArrowRight, CheckCircle2, Cpu, HardDrive, Shield, Sparkles, Zap } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const KEY_BENEFITS = [
  "AI speech recognition with automatic spoken-language detection",
  "Transcripts open in an editor, so you can fix names before exporting",
  "Timed SRT and WebVTT cues for editors, platforms and HTML5 players",
  "Summaries that surface key points and action items from long recordings",
  "No registration, user accounts, paywalls, or client software installs",
  "Zero permanent media storage — strictly ephemeral request-scoped processing",
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
                <strong>MediaDocks</strong> turns recordings into things you can read, search and
                publish. Upload a lecture, an interview or a meeting and you get back an editable
                transcript, a set of timed subtitle cues, or a summary with its key points and
                action items.
              </p>
              <p>
                The problem it solves is that audio and video are terrible formats for finding
                anything. A two-hour recording holds maybe fifteen minutes you actually need, and
                the only way to locate them is to sit through it. Transcription converts that into
                text you can skim in a minute, quote accurately, and search months later.
              </p>
              <p>
                The surrounding tooling exists because the alternatives are unpleasant: desktop
                converters bundled with adware, sites buried under pop-up redirects, and cloud
                services that quietly retain your files. MediaDocks processes everything in a
                request-scoped temporary location, streams the result to your browser, and leaves{" "}
                <strong className="text-foreground">zero permanent footprint</strong> on our
                servers. It also converts public media links to MP4 or MP3 when that is what you
                need.
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
                  The AI tools work on files you provide. Link-based conversion reads only publicly
                  accessible media — we do not sign in or circumvent DRM, passwords, paywalls, age
                  gates or friends-only barriers, and you remain responsible for holding the rights
                  to anything you save.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
