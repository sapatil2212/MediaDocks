import type { Metadata } from "next";
import Link from "next/link";
import {
  AudioLines,
  BookOpen,
  Briefcase,
  FileDown,
  GraduationCap,
  ListChecks,
  Mic,
  Newspaper,
  Radio,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { AudioSummarizerHero } from "@/src/components/summarize/AudioSummarizerHero";
import { FaqAccordion } from "@/components/FaqAccordion";
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
  title: "AI Audio Summarizer — Turn Recordings Into Key Insights",
  description:
    "Summarize audio with AI. Upload a file, paste a public link or record from your microphone to get a brief recap, key points, action items or Q&A you can copy or download.",
  path: "/audio-summarizer",
  keywords: [
    "ai audio summarizer",
    "audio summarizer",
    "summarize audio",
    "podcast summarizer",
    "meeting recording summary",
    "lecture summarizer",
    "audio to summary",
    "ai meeting notes",
    "interview summary",
    "voice note summary",
    "mp3 summarizer",
    "audio summary generator",
  ],
});

const STEPS = [
  {
    title: "Add your audio",
    body: "Upload an MP3, WAV, M4A, FLAC, OGG or AAC file, paste a supported public link, or record straight from your microphone.",
  },
  {
    title: "We transcribe it first",
    body: "The recording is converted to text with automatic language detection, so the summary is grounded in the words that were actually spoken.",
  },
  {
    title: "Choose a format and summarize",
    body: "Pick a brief recap, key points, action items or Q&A, choose a length, then copy the result or download it as TXT.",
  },
];

const STEP_CARDS = [
  { num: "Step 1", title: "Add your audio", desc: STEPS[0].body, icon: <Upload className="h-6 w-6 text-primary" /> },
  { num: "Step 2", title: "We transcribe it first", desc: STEPS[1].body, icon: <AudioLines className="h-6 w-6 text-primary" /> },
  { num: "Step 3", title: "Pick a format", desc: STEPS[2].body, icon: <FileDown className="h-6 w-6 text-primary" /> },
];

const FORMATS = [
  {
    title: "Brief recap",
    desc: "A short prose summary that tells you what the recording was about, without the detail.",
    icon: <BookOpen className="h-5 w-5 text-primary" />,
  },
  {
    title: "Key points",
    desc: "The main ideas as a scannable list, so you can find the part you care about quickly.",
    icon: <ListChecks className="h-5 w-5 text-emerald-500" />,
  },
  {
    title: "Action items",
    desc: "Decisions and follow-ups that were actually committed to — with the owner named when it was stated.",
    icon: <Briefcase className="h-5 w-5 text-amber-500" />,
  },
  {
    title: "Questions & answers",
    desc: "The substantive questions raised in the recording, paired with how they were answered.",
    icon: <Newspaper className="h-5 w-5 text-purple-500" />,
  },
];

const USE_CASES = [
  {
    title: "Students",
    desc: "Condense a recorded lecture into revision notes and check what the session actually covered.",
    icon: <GraduationCap className="h-5 w-5 text-primary" />,
  },
  {
    title: "Podcasters & creators",
    desc: "Draft show notes and episode descriptions from the episode audio instead of re-listening to it.",
    icon: <Radio className="h-5 w-5 text-primary" />,
  },
  {
    title: "Researchers & journalists",
    desc: "Review long interviews faster, find the parts worth quoting, and keep the full transcript alongside.",
    icon: <Mic className="h-5 w-5 text-primary" />,
  },
  {
    title: "Teams",
    desc: "Turn a recorded call into written notes and a list of the follow-ups people agreed to.",
    icon: <Briefcase className="h-5 w-5 text-primary" />,
  },
];

const FAQS = [
  {
    q: "What is an AI audio summarizer?",
    a: "It is a tool that transcribes a recording and then condenses that transcript into a much shorter written form — a recap, a list of key points, the action items, or a Q&A. You read the summary instead of listening to the whole recording.",
  },
  {
    q: "How do I summarize an audio file?",
    a: "Add your audio by uploading a file, pasting a supported public link, or recording from your microphone. Choose a summary format and length, then select Summarize. The transcript is produced first, then the summary.",
  },
  {
    q: "Is the audio summarizer free?",
    a: "Yes. Summarizing is free to use and requires no account, email or credit card. Fair-use rate limits apply so the service stays available to everyone.",
  },
  {
    q: "Which languages does it work with?",
    a: "The spoken language is detected automatically and the summary is written in that same language. Many languages are supported by the underlying speech model, and multilingual recordings stay in their original wording rather than being translated.",
  },
  {
    q: "Can it handle long recordings?",
    a: "Yes. Long audio is transcribed in sequential chunks, and long transcripts are condensed section by section before the final summary, so the middle of a recording is not silently dropped. Files are limited to 100 MB per upload and microphone recordings to 15 minutes.",
  },
  {
    q: "How accurate are the summaries?",
    a: "The summary is only as good as the transcript beneath it, so clear audio produces better results than noisy or distant recordings. The model is instructed not to invent facts, and the full transcript is shown alongside the summary so you can verify anything before relying on it.",
  },
  {
    q: "What happens to my audio and transcript?",
    a: "Your audio is held only for the active request, processed, and deleted immediately afterwards. The transcript and summary are returned to your browser and are not stored on the server.",
  },
];

export default function AudioSummarizerPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: "AI Audio Summarizer — MediaDocks",
            description:
              "Summarize audio recordings into a brief recap, key points, action items or Q&A. Upload a file, paste a public link, or record from your microphone.",
            path: "/audio-summarizer",
            featureList: [
              "Upload MP3, WAV, M4A, AAC, FLAC and OGG audio",
              "Record directly from the microphone",
              "Summarize the audio of supported public links",
              "Brief recap, key points, action items and Q&A formats",
              "Selectable summary length",
              "Full transcript shown alongside the summary",
              "Copy the summary or download it as TXT",
            ],
          }),
          howToJsonLd({
            name: "How to summarize an audio file",
            description:
              "Add an audio recording, let it transcribe, then generate a summary in your chosen format and length.",
            steps: STEPS,
          }),
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "AI Audio Summarizer", path: "/audio-summarizer" },
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
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-soft backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-foreground">
                  AI Audio Summarizer
                </span>
                <span className="text-border" aria-hidden="true">
                  |
                </span>
                <span className="text-muted-foreground">Recap · Key points · Action items</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
                Turn Audio Into Key Insights
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-foreground/90 sm:text-lg">
                Summarize recordings into concise, readable notes so you can grasp the key points
                without listening to the whole thing.
              </p>
            </Reveal>

            <Reveal delay={180} className="mt-8 text-left">
              <AudioSummarizerHero />
            </Reveal>

            <Reveal delay={240}>
              <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Free, no account needed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <AudioLines className="h-3.5 w-3.5 text-primary" />
                  Automatic language detection
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileDown className="h-3.5 w-3.5 text-primary" />
                  Transcript included
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="mt-20 space-y-24">
        {/* ── How it works ───────────────────────────────────────────────── */}
        <section className="section-shell">
          <Reveal>
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                How to summarize an audio file
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                The recording is transcribed first, so every summary is based on the actual words rather
                than a guess about the audio.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEP_CARDS.map((step, index) => (
              <Reveal key={step.title} delay={index * 100}>
                <div className="flex h-full flex-col rounded-2xl border border-border/80 bg-surface/70 p-6 shadow-soft transition-all hover:border-primary/40 hover:shadow-glow">
                  <div className="flex items-center justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-xl border border-primary/20 bg-primary/10">
                      {step.icon}
                    </div>
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Formats ────────────────────────────────────────────────────── */}
        <section className="section-shell">
          <Reveal>
            <div className="text-center">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                Insight formats
              </span>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Pick the output that fits your workflow
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Four formats and three lengths, from a couple of sentences to a thorough walkthrough.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {FORMATS.map((format, index) => (
              <Reveal key={format.title} delay={index * 60}>
                <div className="flex h-full gap-4 rounded-2xl border border-border/80 bg-surface/60 p-6 shadow-soft backdrop-blur-sm transition-all hover:border-border hover:bg-surface/90">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-strong">
                    {format.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold">{format.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{format.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Use cases ──────────────────────────────────────────────────── */}
        <section className="section-shell">
          <Reveal>
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Use cases</h2>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((useCase, index) => (
              <Reveal key={useCase.title} delay={index * 60}>
                <div className="h-full rounded-2xl border border-border/80 bg-surface/60 p-6 shadow-soft transition-all hover:border-border hover:bg-surface/90">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-primary/10">
                    {useCase.icon}
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{useCase.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{useCase.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Honest capability notes ────────────────────────────────────── */}
        <section className="section-shell">
          <Reveal>
            <div className="grid gap-8 rounded-3xl border border-border/80 bg-surface/50 p-8 sm:p-12 md:grid-cols-3">
              <div>
                <h3 className="font-display text-lg font-bold sm:text-xl">Grounded in the transcript</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  The summary is generated from a written transcript, not from the audio directly, and the
                  model is instructed not to add anything that was not said. The full transcript stays
                  available beside the summary so you can check it.
                </p>
              </div>
              <div className="md:border-l md:border-border/60 md:pl-8">
                <h3 className="font-display text-lg font-bold sm:text-xl">Built for real recordings</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  MP3, WAV, M4A, AAC, FLAC, OGG, Opus and WMA are accepted up to 100 MB. Long transcripts
                  are condensed in sections first, so a two-hour conversation is summarized as a whole
                  rather than just its opening minutes.
                </p>
              </div>
              <div className="md:border-l md:border-border/60 md:pl-8">
                <h3 className="font-display text-lg font-bold sm:text-xl">Nothing kept afterwards</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Uploads and the audio derived from them are deleted once the request finishes. Audio is
                  sent to the configured speech-to-text provider for processing; the transcript and
                  summary are returned to your browser and not stored on our server.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <section className="section-shell">
          <Reveal>
            <div className="text-center">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">FAQ</span>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Audio summarizer questions
              </h2>
            </div>
          </Reveal>
          <Reveal delay={100} className="mx-auto mt-10 max-w-3xl">
            <FaqAccordion items={FAQS} />
          </Reveal>
        </section>

        {/* ── Related tools ──────────────────────────────────────────────── */}
        <section className="section-shell">
          <Reveal>
            <div className="rounded-3xl border border-border/80 bg-surface/50 p-8 sm:p-10">
              <h3 className="text-sm font-semibold uppercase tracking-wider">Need the full text instead?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Use the transcription tools when you want every spoken word rather than a condensed summary.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/audio-to-text"
                  className="focus-ring inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                >
                  <AudioLines className="h-4 w-4" />
                  Audio to Text
                </Link>
                <Link
                  href="/video-to-text"
                  className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-strong"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  Video to Text
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </div>

      <div className="mt-28">
        <CTASection />
      </div>
    </>
  );
}
