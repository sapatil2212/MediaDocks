import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { TranscribeHero } from "@/src/components/transcribe/TranscribeHero";
import { TranscribeSections } from "@/src/components/transcribe/TranscribeSections";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/sections/CTASection";
import {
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
  howToJsonLd,
  softwareAppJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Transcribe Video to Text Online — AI Video to Text Converter",
  description:
    "Convert video or audio to accurate, editable plain text. Upload a file or paste a supported public video link with automatic language detection and TXT download.",
  path: "/video-to-text",
  keywords: [
    "transcribe video to text",
    "video to text converter",
    "online video to text",
    "convert video to text",
    "transcribe video online",
    "ai video transcriber",
    "video transcript generator",
    "youtube video to text",
    "zoom meeting transcript",
    "speech to text video",
    "mp4 to text",
    "mov to text",
    "video subtitle generator",
    "export srt subtitles",
    "free video transcription",
  ],
});

const STEPS = [
  {
    title: "Upload your video",
    body: "Import a local video or audio file, or paste a supported public link from YouTube, Facebook, Instagram, X, or Pinterest.",
  },
  {
    title: "Automatic speech recognition",
    body: "MediaDocks extracts the speech track, detects its language automatically, and converts the spoken content to readable text.",
  },
  {
    title: "Preview, edit & download",
    body: "Review the plain-text transcript, correct any words if needed, copy it, or download it as a TXT file without timestamps.",
  },
];

const FAQS = [
  {
    q: "Is there free usage available?",
    a: "Yes! MediaDocks offers free video-to-text transcription without requiring an account, email, or credit card.",
  },
  {
    q: "How do I transcribe a video to text?",
    a: "Upload a video or audio file, or paste a supported public video link, then click Transcribe. The spoken language is detected automatically."
  },
  {
    q: "What are the main ways to convert video to text?",
    a: "Doing it manually, using automated AI software, or using human transcription. MediaDocks provides instant AI transcription with an interactive editor.",
  },
  {
    q: "Can I convert YouTube videos to text?",
    a: "Yes. Paste a public YouTube link to generate an editable plain-text transcript that you can copy or download as TXT.",
  },
  {
    q: "Can I edit my video transcription?",
    a: "Yes. Review and edit the plain transcript directly in the preview before copying or downloading it."
  },
  {
    q: "Is my data secure?",
    a: "Media is held only for the active request, sent to the configured speech-to-text provider for transcription, and deleted immediately after processing. MediaDocks does not permanently store it."
  },
];

export default function VideoToTextPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: "Video to Text Converter — MediaDocks",
            description:
              "Generate editable plain-text transcripts from video or audio. Upload a file or paste a supported public link, then preview, edit, copy, or download TXT.",
            path: "/video-to-text",
            featureList: [
              "File upload for MP4, MOV, AVI, MKV, WebM, MP3",
              "Paste supported public video links",
              "Automatic spoken-language detection",
              "Editable plain-text transcript preview",
              "Copy text or download a clean TXT file",
              "Zero permanent storage and 100% ephemeral privacy",
            ],
          }),
          howToJsonLd({
            name: "How to transcribe video to text online",
            description:
              "Upload a video or paste a supported public link, then generate an editable plain-text transcript with automatic language detection.",
            steps: STEPS,
          }),
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Video to Text", path: "/video-to-text" },
          ]),
        ]}
      />

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 lg:pt-20">
        {/* Dynamic Ambient Lighting Canvas */}
        <InteractiveBackground />

        {/* Subtle Micro-Grid & Vignette */}
        <div
          className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[36rem] opacity-40"
          aria-hidden="true"
        />

        <div className="section-shell relative z-10">
          <div className="mx-auto max-w-6xl text-center">
            {/* Eyebrow Pill */}
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-soft backdrop-blur-md transition-colors hover:border-primary/40 hover:text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[0.7rem] uppercase tracking-wider font-semibold text-foreground">
                  AI Speech-to-Text
                </span>
                <span className="text-border" aria-hidden="true">|</span>
                <span className="text-muted-foreground">Auto Language · Plain TXT Export</span>
              </div>
            </Reveal>

            {/* Title */}
            <Reveal delay={60}>
              <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
                Transcribe Video to Text Online
              </h1>
            </Reveal>

            {/* Tagline */}
            <Reveal delay={120}>
              <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-foreground/90 sm:text-lg">
                Use our online video to text converter to generate accurate video transcripts in minutes.
              </p>
            </Reveal>

            {/* Transcription Hero Dropzone & Link Switcher Card */}
            <Reveal delay={180} className="mt-8 text-left">
              <TranscribeHero />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── HappyScribe-style Content Sections ──────────────────────────── */}
      <TranscribeSections />

      {/* ── Bottom CTA ──────────────────────────────────────────────────── */}
      <div className="mt-28">
        <CTASection />
      </div>
    </>
  );
}
