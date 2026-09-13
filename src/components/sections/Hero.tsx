"use client";

import { Downloader } from "@/components/downloader/Downloader";
import { ExampleLinks } from "@/components/sections/ExampleLinks";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { Reveal } from "@/components/Reveal";
import { Sparkles, Shield, Zap, Music2 } from "lucide-react";

/**
 * Claims here are deliberately limited to what the engine actually guarantees.
 * Earlier copy promised "320kbps MP3", "Lossless Quality" and "Zero Server
 * Logs" — none of which hold: MP3 rungs are capped at the source bitrate so 320
 * is often absent, MP3 is a lossy re-encode by definition, and lib/logger.ts
 * writes a request log line on every resolve and download.
 */
const SPECS = [
  { icon: Zap, label: "144p to 4K MP4" },
  { icon: Music2, label: "MP3 or original M4A" },
  { icon: Sparkles, label: "No watermark added" },
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
              <span className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground font-semibold">
                Public links only
              </span>
              <span className="text-border" aria-hidden="true">|</span>
              <span>YouTube, Instagram, X, Pinterest & FB</span>
            </div>
          </Reveal>

          {/* Master Headline */}
          <Reveal delay={60}>
            <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
              Paste any media link.
              <br />
              <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                Save the master file.
              </span>
            </h1>
          </Reveal>

          {/* Subtitle */}
          <Reveal delay={120}>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-normal text-muted-foreground sm:text-base">
              One unified tool for extracting video from 144p to 4K or separating high-fidelity audio.
              Zero registration, no client software, and zero watermark.
            </p>
          </Reveal>

          {/* Main Command Input Box */}
          <Reveal delay={180} className="mx-auto mt-9 max-w-2xl text-left">
            <div className="relative rounded-2xl border border-border/80 bg-surface/80 p-2 shadow-lift backdrop-blur-2xl transition-all duration-300 hover:border-border hover:shadow-glow sm:p-3">
              <Downloader />
            </div>
          </Reveal>

          {/* Example Quick Presets */}
          <Reveal delay={240} className="mx-auto mt-6 max-w-2xl">
            <div className="flex flex-col items-center justify-center">
              <ExampleLinks />
            </div>
          </Reveal>

          {/* Quiet Technical Specifications Bar */}
          <Reveal delay={300} className="mx-auto mt-12 max-w-3xl">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SPECS.map((spec) => {
                const Icon = spec.icon;
                return (
                  <div
                    key={spec.label}
                    className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-surface/40 px-3 py-2.5 text-center shadow-soft backdrop-blur-sm transition-colors hover:border-border hover:bg-surface/70"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-xs font-medium text-foreground/90">{spec.label}</span>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
