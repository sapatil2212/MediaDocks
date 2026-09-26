import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  Captions,
  FileVideo2,
  ListChecks,
  Music2,
  Sparkles,
  Zap,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";

const TOOLS = [
  {
    name: "Precision Video Downloader",
    path: "/",
    icon: FileVideo2,
    badge: "Core Utility",
    description:
      "Extract public video streams from YouTube, Instagram, X (Twitter), Pinterest, and Facebook at any published rung from 144p to 4K UHD.",
    useCase: "Video editors and creators archiving high-resolution public footage for offline backup and creative reference.",
    cta: "Use Downloader",
    highlight: false,
  },
  {
    name: "YouTube to MP3 & M4A Audio",
    path: "/youtube-to-mp3",
    icon: Music2,
    badge: "Audio Extraction",
    description:
      "Extract pristine soundtracks from YouTube without downloading video. Choose original M4A or high-bitrate MP3 capped at the source.",
    useCase: "Music producers, students, and podcast listeners wanting offline audio files for headphones or car stereos.",
    cta: "Extract MP3",
    highlight: false,
  },
  {
    name: "AI Video to Text Transcriber",
    path: "/video-to-text",
    icon: Sparkles,
    badge: "AI Powered",
    description:
      "Transform video speech into clean, editable plain text. Upload local MP4/MOV files or paste public links with auto-language detection.",
    useCase: "Researchers, students, and educators turning recorded lectures, webinars, and tutorials into readable notes.",
    cta: "Transcribe Video",
    highlight: true,
  },
  {
    name: "AI Audio to Text Transcriber",
    path: "/audio-to-text",
    icon: AudioLines,
    badge: "AI Speech-to-Text",
    description:
      "Transcribe voice memos, interviews, and podcasts from MP3, WAV, M4A, FLAC, and OGG files into formatted plain text.",
    useCase: "Journalists and writers generating accurate written transcripts from spoken field interviews.",
    cta: "Transcribe Audio",
    highlight: false,
  },
  {
    name: "AI Audio Summarizer",
    path: "/audio-summarizer",
    icon: ListChecks,
    badge: "AI Insights",
    description:
      "Summarize recordings into four structured formats: executive recap, scannable key points, action items, or Q&A pairs.",
    useCase: "Busy professionals and project leads distilling 60-minute meeting recordings into quick takeaways.",
    cta: "Summarize Audio",
    highlight: false,
  },
  {
    name: "Subtitle & Closed Caption Studio",
    path: "/add-subtitles-to-video",
    icon: Captions,
    badge: "Accessibility",
    description:
      "Generate auto-timed subtitle cues with AI speech recognition or import existing SRT/VTT files for in-browser timestamp editing.",
    useCase: "Social media creators optimizing short-form Reels and Shorts for viewers watching on mute.",
    cta: "Create Subtitles",
    highlight: false,
  },
];

export function ToolsSuite() {
  return (
    <section id="tools" className="scroll-mt-24 border-t border-border bg-surface-strong/30 py-20 lg:py-24">
      <div className="section-shell">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Complete Media Suite</p>
            <h2 className="section-title mt-2">Available MediaDocks utilities</h2>
            <p className="mt-3 text-muted-foreground">
              Every tool runs directly in your browser with zero account registration, no client
              software, and strictly ephemeral data handling.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Reveal key={tool.name} delay={index * 50}>
                <div
                  className={`panel group flex h-full flex-col justify-between p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift ${
                    tool.highlight
                      ? "border-primary/50 shadow-glow"
                      : "hover:border-primary/40"
                  }`}
                >
                  <div>
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-center justify-between">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-surface shadow-soft transition-transform duration-300 group-hover:scale-105">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 font-mono text-[0.7rem] font-semibold text-muted-foreground">
                        {tool.badge}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mt-5 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                      {tool.name}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {tool.description}
                    </p>

                    {/* Use Case Box */}
                    <div className="mt-4 rounded-xl border border-border/70 bg-surface/60 p-3 text-xs text-muted-foreground">
                      <strong className="text-foreground">Primary Use:</strong> {tool.useCase}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="mt-6 border-t border-border pt-4">
                    <Link
                      href={tool.path}
                      className="inline-flex w-full items-center justify-between rounded-xl bg-surface px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-surface-strong hover:text-primary"
                    >
                      <span>{tool.cta}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
