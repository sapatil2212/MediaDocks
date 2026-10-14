"use client";

import Link from "next/link";
import { Downloader } from "@/components/downloader/Downloader";
import { ExampleLinks } from "@/components/sections/ExampleLinks";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { Reveal } from "@/components/Reveal";
import {
  ArrowRight,
  AudioLines,
  Captions,
  FileVideo2,
  ListChecks,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";

/**
 * The four AI tools are the primary entry points on purpose.
 *
 * These are the things MediaDocks does that nothing else on the page does:
 * they work on files you already own, they produce something that did not
 * exist before (text, cues, a summary), and they carry none of the rights
 * ambiguity that comes with saving someone else's upload. The link field below
 * is still here and still works — it is just no longer the whole pitch.
 */
const TOOLS = [
  {
    name: "Video to text",
    detail: "MP4, MOV or WebM",
    href: "/video-to-text",
    icon: FileVideo2,
  },
  {
    name: "Audio to text",
    detail: "Interviews & voice notes",
    href: "/audio-to-text",
    icon: AudioLines,
  },
  {
    name: "Summarize audio",
    detail: "Key points & actions",
    href: "/audio-summarizer",
    icon: ListChecks,
  },
  {
    name: "Add subtitles",
    detail: "Editable SRT & VTT",
    href: "/add-subtitles-to-video",
    icon: Captions,
  },
];

/**
 * Claims here are deliberately limited to what the engine actually guarantees.
 * Earlier copy promised "320kbps MP3", "Lossless Quality" and "Zero Server
 * Logs" — none of which hold: MP3 rungs are capped at the source bitrate so 320
 * is often absent, MP3 is a lossy re-encode by definition, and lib/logger.ts
 * writes a request log line on every resolve and download.
 */
const SPECS = [
  { icon: Sparkles, label: "Automatic language detection" },
  { icon: Captions, label: "Timed SRT & VTT export" },
  { icon: Zap, label: "144p to 4K MP4, MP3 or M4A" },
  { icon: Shield, label: "No account · files deleted after sending" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 lg:pt-24">
      {/* Dynamic Ambient Lighting Canvas */}
      <InteractiveBackground />

      {/* Subtle Micro-Grid & Vignette */}
      <div
        className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[34rem] opacity-40"
        aria-hidden="true"
      />

      <div className="section-shell relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          {/* Top Badge */}
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-soft backdrop-blur-md transition-colors hover:border-primary/40 hover:text-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              {/* No invented version numbers — this states what it is. */}
              <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Free · no account
              </span>
              <span className="text-border" aria-hidden="true">
                |
              </span>
              <span>Transcribe · Caption · Summarize · Save</span>
            </div>
          </Reveal>

          {/* Master Headline */}
          <Reveal delay={60}>
            <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
              Turn any recording into
              <br />
              <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                text, captions, or a clean file.
              </span>
            </h1>
          </Reveal>

          {/* Subtitle */}
          <Reveal delay={120}>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-normal text-muted-foreground sm:text-base">
              Upload a lecture, interview or meeting and get an editable transcript, timed
              subtitles, or a summary with its key points. Public media links resolve to MP4 and
              MP3 as well. Nothing is stored after it reaches you.
            </p>
          </Reveal>

          {/* Main Command Input Box */}
          <Reveal delay={180} className="mx-auto mt-8 max-w-4xl text-left">
            <div className="relative rounded-2xl border border-border/80 bg-surface/80 p-2 shadow-lift backdrop-blur-2xl transition-all duration-300 hover:border-border sm:p-3">
              <Downloader />
            </div>
          </Reveal>

          {/* Example Quick Presets */}
          <Reveal delay={220} className="mx-auto mt-6 max-w-4xl">
            <div className="flex flex-col items-center justify-center">
              <ExampleLinks />
            </div>
          </Reveal>

          {/* AI Media Tools Divider */}
          <Reveal delay={260} className="mx-auto mt-10 max-w-4xl">
            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              <span className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                or use AI media tools
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
          </Reveal>

          {/* AI tool entry points */}
          <Reveal delay={300} className="mx-auto mt-6 max-w-4xl">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="focus-ring group flex flex-col items-center gap-2 rounded-[6px] border border-border/80 bg-surface/70 px-3 py-3.5 text-center shadow-none backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface-strong"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-[5px] border border-border bg-surface shadow-none transition-transform duration-200 group-hover:scale-105">
                      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold text-foreground sm:text-sm">
                      {tool.name}
                    </span>
                    <span className="text-[0.7rem] text-muted-foreground">{tool.detail}</span>
                  </Link>
                );
              })}
            </div>
          </Reveal>

          {/* Rights posture, stated up front rather than buried in the footer */}
          <Reveal delay={360} className="mx-auto mt-6 max-w-4xl">
            <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
              Public posts only. MediaDocks does not sign in or bypass private accounts, age gates,
              paywalls or DRM. Make sure you hold the rights to anything you save — see our{" "}
              <Link
                href="/copyright"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                copyright policy
              </Link>
              .
            </p>
          </Reveal>

          {/* Quiet Technical Specifications Bar */}
          <Reveal delay={400} className="mx-auto mt-12 max-w-3xl">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SPECS.map((spec) => {
                const Icon = spec.icon;
                return (
                  <div
                    key={spec.label}
                    className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-surface/40 px-3 py-2.5 text-center shadow-soft backdrop-blur-sm transition-colors hover:border-border hover:bg-surface/70"
                  >
                    <Icon className="mb-1 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-xs font-medium text-foreground/90">{spec.label}</span>
                  </div>
                );
              })}
            </div>
          </Reveal>

          {/* Honest, visible link to the deeper explanation */}
          <Reveal delay={440} className="mx-auto mt-8">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              <span>How the pipeline actually works</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
