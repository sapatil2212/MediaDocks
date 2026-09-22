import type { Metadata } from "next";
import { AudioLines } from "lucide-react";
import { TranscribeHero } from "@/src/components/transcribe/TranscribeHero";
import { AudioTranscribeSections } from "@/src/components/transcribe/AudioTranscribeSections";
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
  title: "Audio to Text — Free AI Audio Transcription Online",
  description:
    "Convert audio to text online. Upload MP3, WAV, M4A, FLAC or OGG and get an editable plain-text transcript with automatic language detection and TXT download.",
  path: "/audio-to-text",
  keywords: [
    "audio to text",
    "audio to text converter",
    "transcribe audio to text",
    "audio transcription online",
    "mp3 to text",
    "wav to text",
    "m4a to text",
    "voice to text",
    "voice memo to text",
    "podcast transcription",
    "interview transcription",
    "speech to text online",
    "free audio transcription",
    "dictation to text",
  ],
});

const STEPS = [
  {
    title: "Add your audio",
    body: "Upload an MP3, WAV, M4A, FLAC, OGG or AAC recording, or paste a public link to use its audio track.",
  },
  {
    title: "Automatic speech recognition",
    body: "The recording is normalised and transcribed with the spoken language detected automatically, without translating it.",
  },
  {
    title: "Edit and download",
    body: "Review the plain-text transcript, correct anything you need, then copy it or download a TXT file.",
  },
];

const FAQS = [
  {
    q: "Which audio formats can I transcribe?",
    a: "MP3, WAV, M4A, AAC, FLAC, OGG, Opus and WMA are accepted, up to 100 MB per file.",
  },
  {
    q: "Do I need to pick the language first?",
    a: "No. The spoken language is detected automatically and the transcript stays in that language.",
  },
  {
    q: "Can I transcribe a long podcast episode?",
    a: "Yes. Long recordings are split into sequential chunks and returned as one continuous transcript.",
  },
  {
    q: "Does it add timestamps or speaker names?",
    a: "No. The transcript is clean plain text, without timestamps or guessed speaker labels.",
  },
  {
    q: "Is it free to use?",
    a: "Yes. Audio transcription is free and requires no account, email or credit card.",
  },
  {
    q: "What happens to my audio file?",
    a: "It is held only for the active request, sent to the configured speech-to-text provider, and deleted immediately afterwards.",
  },
];

export default function AudioToTextPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: "Audio to Text Converter — MediaDocks",
            description:
              "Transcribe audio recordings to editable plain text. Upload MP3, WAV, M4A, FLAC or OGG, or paste a public link, then preview, edit, copy or download TXT.",
            path: "/audio-to-text",
            featureList: [
              "Upload MP3, WAV, M4A, AAC, FLAC, OGG, Opus and WMA",
              "Automatic spoken-language detection",
              "Long recordings transcribed in sequential chunks",
              "Editable plain-text transcript preview",
              "Copy text or download a clean UTF-8 TXT file",
              "Files deleted immediately after processing",
            ],
          }),
          howToJsonLd({
            name: "How to convert audio to text online",
            description:
              "Upload an audio recording or paste a public link, then generate an editable plain-text transcript with automatic language detection.",
            steps: STEPS,
          }),
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Audio to Text", path: "/audio-to-text" },
          ]),
        ]}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 lg:pt-20">
        <InteractiveBackground />
        <div
          className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[36rem] opacity-40"
          aria-hidden="true"
        />

        <div className="section-shell relative z-10">
          <div className="mx-auto max-w-6xl text-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-soft backdrop-blur-md transition-colors hover:border-primary/40 hover:text-foreground">
                <AudioLines className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-foreground">
                  AI Audio Transcription
                </span>
                <span className="text-border" aria-hidden="true">
                  |
                </span>
                <span className="text-muted-foreground">Auto Language · Plain TXT Export</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
                Convert Audio to Text Online
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-foreground/90 sm:text-lg">
                Transcribe podcasts, interviews and voice notes into editable text, with the spoken
                language detected automatically.
              </p>
            </Reveal>

            <Reveal delay={180} className="mt-8 text-left">
              <TranscribeHero variant="audio" />
            </Reveal>
          </div>
        </div>
      </section>

      <AudioTranscribeSections />

      <div className="mt-28">
        <CTASection />
      </div>
    </>
  );
}
