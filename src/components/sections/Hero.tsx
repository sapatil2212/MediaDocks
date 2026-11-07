import Link from "next/link";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { Reveal } from "@/components/Reveal";
import {
  ArrowRight,
  AudioLines,
  Captions,
  Eraser,
  FileVideo2,
  Image as ImageIcon,
  ListChecks,
  Shield,
  Sparkles,
} from "lucide-react";

/**
 * The AI tools lead on purpose: they work on files you already own and produce
 * something that did not exist before (text, cues, a summary). The image tools
 * sit beside them as the second entry row.
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

const MORE_TOOLS = [
  { name: "Remove background", detail: "Transparent PNG", href: "/background-remover", icon: Eraser },
  { name: "Convert images", detail: "JPG, PNG, WebP, AVIF", href: "/image-converter", icon: ImageIcon },
];

/** Claims here are limited to what the code does. */
const SPECS = [
  { icon: Sparkles, label: "Automatic language detection" },
  { icon: Captions, label: "Timed SRT & VTT export" },
  { icon: Shield, label: "No account needed" },
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
        <div className="mx-auto max-w-5xl text-center">
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
              <span>Transcribe · Caption · Summarize · Convert</span>
            </div>
          </Reveal>

          {/* Master Headline (strictly two lines) */}
          <Reveal delay={60}>
            <h1 className="mt-6 text-[clamp(1.4rem,4.1vw,3.35rem)] font-bold font-display leading-[1.08] tracking-tight text-foreground">
              <span className="block whitespace-nowrap">Turn any recording into</span>
              <span className="block whitespace-nowrap bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                text, captions, or a clean file.
              </span>
            </h1>
          </Reveal>

          {/* Subtitle */}
          <Reveal delay={120}>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-normal text-muted-foreground sm:text-base">
              Upload a lecture, interview or meeting and get an editable transcript, timed
              subtitles, or a summary with its key points. Image and document converters sit
              alongside them, and the guides explain the formats behind each tool.
            </p>
          </Reveal>

          {/* AI tool entry points */}
          <Reveal delay={180} className="mx-auto mt-10 max-w-4xl">
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

          {/* More tools */}
          <Reveal delay={240} className="mx-auto mt-3 max-w-4xl">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {MORE_TOOLS.map((tool) => {
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
          {/* Quiet Technical Specifications Bar */}
          <Reveal delay={400} className="mx-auto mt-12 max-w-3xl">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

          {/* Link to the deeper explanation */}
          <Reveal delay={440} className="mx-auto mt-8">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              <span>How the tools work</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
