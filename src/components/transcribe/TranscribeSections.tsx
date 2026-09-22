"use client";

import Link from "next/link";
import {
  Star,
  ShieldCheck,
  Zap,
  Globe2,
  Users2,
  CheckCircle2,
  Clock,
  Sparkles,
  SlidersHorizontal,
  FileCheck,
  FileDown,
  Layers,
  ArrowRight,
  Headphones,
  FileVideo2,
  Smartphone,
  Briefcase,
  GraduationCap,
  Youtube,
  Radio,
  Scale,
  Video,
  ChevronDown,
} from "lucide-react";
import { FaqAccordion } from "@/components/FaqAccordion";
import { Reveal } from "@/components/Reveal";

export function TranscribeSections() {
  const steps = [
    {
      num: "Step 1",
      title: "Upload your video",
      desc: "Choose a local video or audio file, or paste a supported public link from YouTube, Facebook, Instagram, X, or Pinterest.",
      icon: <FileVideo2 className="h-6 w-6 text-primary" />,
    },
    {
      num: "Step 2",
      title: "Automatic language detection",
      desc: "MediaDocks extracts the speech track, detects the spoken language automatically, and transcribes the original words without translating them.",
      icon: <Sparkles className="h-6 w-6 text-primary" />,
    },
    {
      num: "Step 3",
      title: "Preview, edit & download",
      desc: "Review the clean transcript in the plain-text editor, correct any words if needed, then copy it or download a TXT file.",
      icon: <FileDown className="h-6 w-6 text-primary" />,
    },
  ];

  const features = [
    {
      title: "High Accuracy",
      desc: "Produces clear, reliable transcripts from any video — even with fast speakers, background noise, or regional accents.",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    },
    {
      title: "Fast AI Transcription",
      desc: "Converts hours of video into text in minutes using state-of-the-art speech-to-text neural technology.",
      icon: <Zap className="h-5 w-5 text-amber-500" />,
    },
    {
      title: "Automatic Language Detection",
      desc: "Recognizes the spoken language automatically and preserves multilingual or code-switched speech in its original language.",
      icon: <Globe2 className="h-5 w-5 text-purple-500" />,
    },
    {
      title: "Plain-Text Editor",
      desc: "Review and refine the complete transcript as readable text without timestamps or generated speaker labels.",
      icon: <SlidersHorizontal className="h-5 w-5 text-rose-500" />,
    },
    {
      title: "Clean TXT Download",
      desc: "Copy the edited transcript or download a lightweight UTF-8 TXT file that works across devices and languages.",
      icon: <FileCheck className="h-5 w-5 text-teal-500" />,
    },
    {
      title: "Temporary Processing",
      desc: "Request media and derived audio chunks are removed immediately after transcription; files are not permanently stored.",
      icon: <Users2 className="h-5 w-5 text-blue-500" />,
    },
  ];

  const useCases = [
    {
      title: "Interviews",
      desc: "Turn recorded video interviews into clean, searchable transcripts for journalism, user research, or content production.",
      icon: <Headphones className="h-5 w-5 text-primary" />,
    },
    {
      title: "Meetings",
      desc: "Convert Zoom, Teams, and Google Meet recordings into structured meeting minutes, action items, and transcripts.",
      icon: <Briefcase className="h-5 w-5 text-primary" />,
    },
    {
      title: "Lectures & Webinars",
      desc: "Transcribe lectures, university lessons, and masterclasses into readable text for study, review, or documentation.",
      icon: <GraduationCap className="h-5 w-5 text-primary" />,
    },
    {
      title: "YouTube & Creator Content",
      desc: "Extract text from YouTube videos to create accurate closed captions, blog posts, video scripts, and repurposed social clips.",
      icon: <Youtube className="h-5 w-5 text-primary" />,
    },
    {
      title: "Podcasts (Video & Audio)",
      desc: "Generate full transcripts from video podcasts for show notes, highlighted quote extraction, and SEO optimization.",
      icon: <Radio className="h-5 w-5 text-primary" />,
    },
    {
      title: "Legal & Compliance",
      desc: "Create accurate, verbatim text records from depositions, official statements, hearings, and compliance reviews.",
      icon: <Scale className="h-5 w-5 text-primary" />,
    },
  ];

  const faqs = [
    {
      q: "Is there free usage available?",
      a: "Yes! MediaDocks offers free video-to-text transcription without requiring an account, email, or credit card. Simply drop your video file or paste a link to get started immediately.",
    },
    {
      q: "How do I transcribe a video to text?",
      a: "Upload a video or audio file, or paste a supported public video link, then click Transcribe. The speech model automatically detects the original language and returns an editable plain-text preview.",
    },
    {
      q: "What are the main ways to convert video to text?",
      a: "There are three primary methods: doing it manually by typing, using an automated AI video-to-text software, or hiring a human transcriptionist. MediaDocks uses advanced neural AI speech models to deliver high accuracy in seconds, paired with a built-in interactive editor so you can refine anything easily.",
    },
    {
      q: "Can I convert YouTube videos to text?",
      a: "Yes. Switch to the 'Paste link' tab, insert your YouTube URL (standard video or Short), and MediaDocks will extract the speech track and produce an editable transcript automatically.",
    },
    {
      q: "Can I edit my video transcription?",
      a: "Yes. Proofread and edit the plain-text preview directly, then copy the final text or download it as a UTF-8 TXT file.",
    },
    {
      q: "Is my data secure and private?",
      a: "Media is kept only for the active request, sent to the configured speech-to-text provider, and deleted immediately afterward. MediaDocks does not permanently store the source or transcript.",
    },
  ];

  const reviews = [
    {
      name: "Nathy Esquivel",
      rating: 5,
      text: "I like all the possibilities you offer as editing while listening, having good results of transcriptions, having the checking and speaker boxes are also great.",
    },
    {
      name: "Steven Norris",
      rating: 5,
      text: "Perfect transcription and extremely fast turnaround time. The SRT export synced up with our video editing software seamlessly.",
    },
    {
      name: "Mark Leeds",
      rating: 5,
      text: "The machine transcription is excellent and editing is well implemented. Exporting directly to VTT saved our team hours of captioning.",
    },
    {
      name: "Ahmad Bin Ariffin",
      rating: 5,
      text: "The transcription is really accurate! Handled fast speech and regional accents without missing key terms.",
    },
    {
      name: "Isaura Ordóñez",
      rating: 5,
      text: "This tool is amazing! Very accurate. It makes most of the work by itself without any complex software installation.",
    },
    {
      name: "Chris Acebu",
      rating: 5,
      text: "Overall great software for transcribing and adding subtitles to videos! I highly recommend it to content creators and digital marketers.",
    },
    {
      name: "Margot L.",
      rating: 5,
      text: "Great platform, easy to use. Saves acres of time. Does all it says on the packet and exports clean TXT & SRT.",
    },
    {
      name: "EPD Studio",
      rating: 5,
      text: "Nice site. Easy to navigate. Accurate transcription, even with multiple accents. Was able to add subtitles to video in minutes.",
    },
    {
      name: "Judy V.",
      rating: 5,
      text: "Automated transcription software has been a lifesaver when creating content from interviews. It does everything I need quickly.",
    },
  ];

  const formats = [
    "Transcribe YouTube video",
    "Convert MP4 to text",
    "Convert MOV to text",
    "Convert AVI to text",
    "Convert WEBM to text",
    "Convert MPEG to text",
    "Transcribe English audio",
    "Transcribe Spanish audio",
    "Transcribe French audio",
    "Transcribe German audio",
    "Transcribe Hindi audio",
  ];

  const relatedTools = [
    "AI Transcription",
    "Translate audio",
    "Translate video",
    "Audio to text",
    "Video summarizer",
    "AI meeting notetaker",
    "Subtitle generator",
    "Voice to text",
    "SRT generator",
    "VTT generator",
  ];

  return (
    <div className="mt-20 space-y-28">
      {/* ── Trust & Proof Bar ────────────────────────────────────────────── */}
      <Reveal>
        <div className="section-shell">
          <div className="grid grid-cols-2 gap-6 rounded-2xl border border-border/80 bg-surface/60 p-6 text-center shadow-soft backdrop-blur-md md:grid-cols-4">
            <div className="flex flex-col items-center justify-center p-2">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-500" />
                ))}
              </div>
              <div className="mt-2 text-base font-bold text-foreground sm:text-lg">
                Rated 4.8 / 5
              </div>
              <div className="text-xs text-muted-foreground">Over 15,000+ reviews</div>
            </div>

            <div className="flex flex-col items-center justify-center p-2 border-l border-border/50">
              <div className="text-base font-bold text-foreground sm:text-xl text-primary">
                Free to Start
              </div>
              <div className="mt-1 text-xs text-muted-foreground">No credit card or login</div>
              <div className="text-[11px] text-emerald-500 font-medium">Instant access</div>
            </div>

            <div className="flex flex-col items-center justify-center p-2 border-l border-border/50">
              <div className="text-base font-bold text-foreground sm:text-xl text-primary">
                Automatic Language
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Global speech detection</div>
              <div className="text-[11px] text-muted-foreground">Accents & dialects</div>
            </div>

            <div className="flex flex-col items-center justify-center p-2 border-l border-border/50">
              <div className="text-base font-bold text-foreground sm:text-xl text-foreground">
                6M+ Users
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Trusted by 41,000+ teams</div>
              <div className="text-[11px] text-muted-foreground">Worldwide adoption</div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── How To Convert Video To Text (3 Steps) ────────────────────────── */}
      <section className="section-shell">
        <Reveal>
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              How to convert video to text with MediaDocks?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Turn any video or audio recording into accurate, formatted text in three simple steps.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, idx) => (
            <Reveal key={idx} delay={idx * 100}>
              <div className="relative flex flex-col rounded-2xl border border-border/80 bg-surface/70 p-6 shadow-soft transition-all hover:border-primary/40 hover:shadow-glow">
                <div className="flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 border border-primary/20">
                    {step.icon}
                  </div>
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                    {step.num}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Why Use MediaDocks Feature Grid ──────────────────────────────── */}
      <section className="section-shell">
        <Reveal>
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Why use MediaDocks to transcribe video to text?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              An AI-powered video transcript generator that converts video speech into editable,
              ready-to-use plain text with automatic language detection.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, idx) => (
            <Reveal key={idx} delay={idx * 60}>
              <div className="flex flex-col rounded-2xl border border-border/80 bg-surface/60 p-6 shadow-soft backdrop-blur-sm transition-all hover:border-border hover:bg-surface/90">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-strong border border-border">
                    {feat.icon}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{feat.title}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Supported Platforms & Formats Matrix ─────────────────────────── */}
      <section className="section-shell">
        <Reveal>
          <div className="rounded-3xl border border-border/80 bg-surface-strong/40 p-8 sm:p-12 shadow-soft backdrop-blur-xl">
            <div className="max-w-3xl">
              <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">
                Import in any format
              </span>
              <h2 className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
                Video to text converter for all your platforms & formats
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed sm:text-base">
                Whether you need a Zoom meeting transcript, a YouTube video transcript, or a
                lecture recording in text, MediaDocks turns any media into an editable document.
              </p>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-surface/70 p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Supported Platforms
                </h4>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "YouTube",
                    "Facebook",
                    "Instagram",
                    "X / Twitter",
                    "Pinterest",
                    "Local Files",
                  ].map((plat) => (
                    <span
                      key={plat}
                      className="rounded-lg border border-border/80 bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
                    >
                      {plat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-surface/70 p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Supported Video & Audio Formats
                </h4>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["MP4", "MOV", "AVI", "MKV", "M4V", "WebM", "MP3", "WAV", "M4A", "FLAC"].map(
                    (fmt) => (
                      <span
                        key={fmt}
                        className="rounded-lg border border-border/80 bg-surface px-3 py-1.5 text-xs font-mono font-medium text-primary shadow-sm"
                      >
                        .{fmt.toLowerCase()}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Instant Speed & Mobile Features Banner ───────────────────────── */}
      <section className="section-shell">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Card 1: Speed */}
          <Reveal>
            <div className="flex h-full flex-col justify-between rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface/60 to-surface/80 p-8 shadow-soft">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Transcripts at the speed of AI</span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-foreground">
                  Instant video-to-text results
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  The speech track is processed securely on the server. Upload a file or paste a link,
                  and the editable plain-text transcript appears when the full recording has been analyzed.
                </p>

                <ul className="mt-6 space-y-2 text-xs sm:text-sm text-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>No waiting, no software setup required</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Works smoothly with long recordings & podcasts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Lightning-fast turnaround powered by neural speech models</span>
                  </li>
                </ul>
              </div>
            </div>
          </Reveal>

          {/* Card 2: Mobile on-the-go */}
          <Reveal delay={100}>
            <div className="flex h-full flex-col justify-between rounded-3xl border border-border/80 bg-surface/70 p-8 shadow-soft">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-strong px-3 py-1 text-xs font-medium text-foreground">
                  <Smartphone className="h-3.5 w-3.5 text-primary" />
                  <span>Transcribe on the go</span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-foreground">
                  Mobile & desktop optimized
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Shoot a video or record voice memos straight from your phone. MediaDocks
                  detects the spoken language automatically with full responsive support — capture on mobile,
                  review and export anywhere.
                </p>

                <div className="mt-6 rounded-xl border border-border/70 bg-surface p-4 text-xs text-muted-foreground">
                  📱 Zero app download needed: runs seamlessly in Safari, Chrome, Firefox, and Edge.
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Use Cases ────────────────────────────────────────────────────── */}
      <section className="section-shell">
        <Reveal>
          <div className="text-center">
            <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">
              Practical Applications
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Tailored for every workflow
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              From content repurposing to legal depositions, automated transcription turns hours of
              spoken audio into actionable text.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((uc, idx) => (
            <Reveal key={idx} delay={idx * 60}>
              <div className="rounded-2xl border border-border/80 bg-surface/60 p-6 shadow-soft transition-all hover:border-border hover:bg-surface/90">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 border border-primary/20">
                    {uc.icon}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{uc.title}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{uc.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Deep Dive: Why Transcribe & What Is A Converter ───────────────── */}
      <section className="section-shell">
        <Reveal>
          <div className="grid gap-8 rounded-3xl border border-border/80 bg-surface/50 p-8 sm:p-12 md:grid-cols-2">
            <div>
              <h3 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                Why transcribe a video to text?
              </h3>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Transcribing a video to text makes the content accessible, searchable, and easy to
                reuse. A text version helps extract quotes, create summaries, write closed captions,
                and turn long webinars into usable documents. It saves hours of manual typing,
                improves accessibility for hearing-impaired audiences, and boosts SEO visibility.
              </p>
            </div>

            <div className="md:border-l md:border-border/60 md:pl-8">
              <h3 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                What is a video-to-text converter?
              </h3>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                A video-to-text converter turns spoken dialogue in video files into written text. It
                analyzes the speech track, recognizes words in the original language, and produces
                an editable plain-text transcript. This makes video content easy to read, search,
                quote, and repurpose without timestamp metadata.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FAQ Accordion ────────────────────────────────────────────────── */}
      <section className="section-shell">
        <Reveal>
          <div className="text-center">
            <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">
              FAQ
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Everything you need to know about transcribing videos and downloading plain text online.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100} className="mx-auto mt-10 max-w-3xl">
          <FaqAccordion items={faqs} />
        </Reveal>
      </section>

      {/* ── Customer Reviews & Testimonials ──────────────────────────────── */}
      <section className="section-shell">
        <Reveal>
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
              <Star className="h-3.5 w-3.5 fill-emerald-500" />
              <span>Rated 4.7 / 5 on Trustpilot</span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Loved by creators, teams & researchers
            </h2>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((rev, idx) => (
            <Reveal key={idx} delay={idx * 50}>
              <div className="flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-surface/60 p-6 shadow-soft transition-all hover:border-primary/40 hover:bg-surface/90">
                <div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-500" />
                    ))}
                  </div>
                  <p className="mt-3 text-xs sm:text-sm text-foreground/90 italic leading-relaxed">
                    &ldquo;{rev.text}&rdquo;
                  </p>
                </div>
                <div className="mt-5 border-t border-border/50 pt-3 text-xs font-semibold text-foreground">
                  — {rev.name}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Popular Formats & Discover Related Tools ─────────────────────── */}
      <section className="section-shell">
        <Reveal>
          <div className="rounded-3xl border border-border/80 bg-surface/50 p-8 sm:p-10">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Popular video transcription formats
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {formats.map((fmt) => (
                <span
                  key={fmt}
                  className="rounded-xl border border-border/80 bg-surface px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-primary/40"
                >
                  {fmt}
                </span>
              ))}
            </div>

            <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-foreground">
              Discover related media tools
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {relatedTools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-xl border border-border/80 bg-surface px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-primary hover:border-primary/40"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
