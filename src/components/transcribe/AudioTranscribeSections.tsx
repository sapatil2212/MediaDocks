"use client";

import Link from "next/link";
import {
  AudioLines,
  BookOpen,
  CheckCircle2,
  FileDown,
  Globe2,
  Headphones,
  Mic,
  Radio,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Upload,
  Users2,
  Zap,
} from "lucide-react";
import { FaqAccordion } from "@/components/FaqAccordion";
import { Reveal } from "@/components/Reveal";

/**
 * Supporting content for /audio-to-text.
 *
 * Deliberately audio-specific rather than a re-skin of the video page: the
 * intent behind "audio to text" is podcasts, voice notes, interviews and calls,
 * so the copy, formats and questions are written for that reader.
 */

const STEPS = [
  {
    num: "Step 1",
    title: "Add your audio",
    desc: "Upload an MP3, WAV, M4A, FLAC, OGG or AAC recording, or paste a public link and we will pull just its audio track.",
    icon: <Upload className="h-6 w-6 text-primary" />,
  },
  {
    num: "Step 2",
    title: "Automatic speech recognition",
    desc: "The recording is normalised, split into chunks and transcribed with automatic language detection — no manual language choice needed.",
    icon: <Sparkles className="h-6 w-6 text-primary" />,
  },
  {
    num: "Step 3",
    title: "Edit and download",
    desc: "Read the transcript as clean paragraphs, fix any term you want, then copy it or download a UTF-8 TXT file.",
    icon: <FileDown className="h-6 w-6 text-primary" />,
  },
];

const FEATURES = [
  {
    title: "Built for spoken audio",
    desc: "Handles conversational speech, overlapping accents and background noise from real recordings rather than studio-clean samples.",
    icon: <AudioLines className="h-5 w-5 text-primary" />,
  },
  {
    title: "Automatic language detection",
    desc: "Detects the spoken language and keeps it. Multilingual and code-switched speech stays in the original words, never translated.",
    icon: <Globe2 className="h-5 w-5 text-purple-500" />,
  },
  {
    title: "Long recordings supported",
    desc: "Audio is processed in sequential chunks, so hour-long interviews and podcasts transcribe without being truncated.",
    icon: <Zap className="h-5 w-5 text-amber-500" />,
  },
  {
    title: "Plain text, no clutter",
    desc: "You get readable prose without timestamps or invented speaker labels — ready to paste into notes, docs or a CMS.",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  },
  {
    title: "Editable before export",
    desc: "Correct names, jargon or numbers directly in the preview, then copy or download the text you actually approved.",
    icon: <BookOpen className="h-5 w-5 text-rose-500" />,
  },
  {
    title: "Deleted after processing",
    desc: "Uploads and the derived audio chunks are removed as soon as the request finishes. Nothing is kept on the server.",
    icon: <ShieldCheck className="h-5 w-5 text-teal-500" />,
  },
];

const USE_CASES = [
  {
    title: "Podcasts",
    desc: "Turn episodes into show notes, quotable pull-outs and searchable text for SEO.",
    icon: <Radio className="h-5 w-5 text-primary" />,
  },
  {
    title: "Interviews",
    desc: "Transcribe recorded interviews for journalism, user research and qualitative analysis.",
    icon: <Mic className="h-5 w-5 text-primary" />,
  },
  {
    title: "Voice notes & dictation",
    desc: "Convert phone memos and dictated ideas into written drafts you can edit immediately.",
    icon: <Headphones className="h-5 w-5 text-primary" />,
  },
  {
    title: "Calls & meetings",
    desc: "Turn recorded calls and audio-only meetings into written records and action items.",
    icon: <Users2 className="h-5 w-5 text-primary" />,
  },
  {
    title: "Lectures & audiobooks",
    desc: "Make spoken lessons and long-form narration readable, searchable and easy to revise from.",
    icon: <BookOpen className="h-5 w-5 text-primary" />,
  },
  {
    title: "Field & clinical notes",
    desc: "Write up spoken observations accurately without typing while you work.",
    icon: <Stethoscope className="h-5 w-5 text-primary" />,
  },
];

const FAQS = [
  {
    q: "Which audio formats can I transcribe?",
    a: "MP3, WAV, M4A, AAC, FLAC, OGG, Opus and WMA are accepted, up to 100 MB per file. If your recording is larger, compress it or export a lower bitrate — speech transcribes accurately well below music-quality bitrates.",
  },
  {
    q: "Do I need to pick the language first?",
    a: "No. The language is detected from the audio automatically and the transcript is returned in that same language. Nothing is translated unless you ask another tool to do it afterwards.",
  },
  {
    q: "How accurate is audio-to-text transcription?",
    a: "Accuracy depends mostly on the recording. Clear speech with little background noise transcribes very reliably; heavy crosstalk, distant microphones or loud music will reduce it. The transcript is editable, so you can correct names and technical terms before exporting.",
  },
  {
    q: "Can I transcribe a long podcast episode?",
    a: "Yes. Longer recordings are split into sequential chunks and stitched back into one transcript, so a full episode is not cut short. Keep the tab open while it processes.",
  },
  {
    q: "Does it add timestamps or speaker names?",
    a: "No. This tool returns clean plain text on purpose. It does not invent speaker labels, because guessing who spoke would be misleading rather than helpful.",
  },
  {
    q: "What happens to my audio file?",
    a: "It is held only for the active request, sent to the configured speech-to-text provider for transcription, and deleted immediately afterwards. MediaDocks does not permanently store your recording or the transcript.",
  },
];

const FORMATS = [
  "MP3 to text",
  "WAV to text",
  "M4A to text",
  "FLAC to text",
  "OGG to text",
  "AAC to text",
  "Voice memo to text",
  "Podcast transcription",
  "Interview transcription",
  "Audio notes to text",
];

export function AudioTranscribeSections() {
  return (
    <div className="mt-20 space-y-24">
      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="section-shell">
        <Reveal>
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              How to convert audio to text
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Three steps from a recording to editable text, with the spoken language detected for you.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
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
                <h3 className="mt-5 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="section-shell">
        <Reveal>
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Why use MediaDocks for audio transcription?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              An audio-to-text converter that keeps the original language, stays editable, and does not keep your files.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 60}>
              <div className="flex h-full flex-col rounded-2xl border border-border/80 bg-surface/60 p-6 shadow-soft backdrop-blur-sm transition-all hover:border-border hover:bg-surface/90">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface-strong">
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Use cases ────────────────────────────────────────────────────── */}
      <section className="section-shell">
        <Reveal>
          <div className="text-center">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              Practical applications
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              What people transcribe
            </h2>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((useCase, index) => (
            <Reveal key={useCase.title} delay={index * 60}>
              <div className="h-full rounded-2xl border border-border/80 bg-surface/60 p-6 shadow-soft transition-all hover:border-border hover:bg-surface/90">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-primary/10">
                    {useCase.icon}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{useCase.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{useCase.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Explainer ────────────────────────────────────────────────────── */}
      <section className="section-shell">
        <Reveal>
          <div className="grid gap-8 rounded-3xl border border-border/80 bg-surface/50 p-8 sm:p-12 md:grid-cols-2">
            <div>
              <h3 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                What is an audio-to-text converter?
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                An audio-to-text converter listens to a recording and writes down the words that were
                spoken. MediaDocks normalises the audio, detects the language, and returns the speech
                as readable paragraphs you can edit, copy or download — no software to install and no
                account required.
              </p>
            </div>
            <div className="md:border-l md:border-border/60 md:pl-8">
              <h3 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                Why transcribe audio at all?
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Text is searchable, skimmable and quotable in a way audio is not. A transcript turns a
                recording into something you can quote in an article, summarise into notes, translate,
                caption, or hand to someone who cannot listen right now — including people who rely on
                text for accessibility.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="section-shell">
        <Reveal>
          <div className="text-center">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">FAQ</span>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Audio transcription questions
            </h2>
          </div>
        </Reveal>
        <Reveal delay={100} className="mx-auto mt-10 max-w-3xl">
          <FaqAccordion items={FAQS} />
        </Reveal>
      </section>

      {/* ── Formats & cross-link ─────────────────────────────────────────── */}
      <section className="section-shell">
        <Reveal>
          <div className="rounded-3xl border border-border/80 bg-surface/50 p-8 sm:p-10">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Popular audio transcription formats
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {FORMATS.map((format) => (
                <span
                  key={format}
                  className="rounded-xl border border-border/80 bg-surface px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {format}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border/60 pt-6">
              <p className="text-sm text-muted-foreground">Working with video instead?</p>
              <Link
                href="/video-to-text"
                className="focus-ring inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                <Sparkles className="h-4 w-4" />
                Try Video to Text
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
