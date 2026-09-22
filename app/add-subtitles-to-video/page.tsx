import type { Metadata } from "next";
import Link from "next/link";
import {
  Accessibility,
  AudioLines,
  Captions,
  Clock3,
  Download,
  FileUp,
  Languages,
  PencilLine,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { SubtitleStudio } from "@/src/components/subtitles/SubtitleStudio";
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
  title: "Add Subtitles to Video — Free Online Subtitle & Caption Generator",
  description:
    "Add subtitles and captions to your video online. Generate timed cues with AI or import your own SRT or VTT, edit the text and timings in the browser, then export SRT, VTT or TXT.",
  path: "/add-subtitles-to-video",
  keywords: [
    "add subtitles to video",
    "subtitle generator",
    "caption generator",
    "add captions to video",
    "srt generator",
    "vtt generator",
    "subtitle editor online",
    "auto subtitles",
    "video captions",
    "generate srt from video",
    "free subtitle tool",
    "subtitle timing editor",
  ],
});

const STEPS = [
  {
    title: "Add your video",
    body: "Upload an MP4, MOV, MKV, WebM or AVI file, or paste a supported public link. You can also import a subtitle file you already have.",
  },
  {
    title: "Generate or import the cues",
    body: "The audio is transcribed in short windows to produce timed cues. When the source platform already publishes captions, those exact timings are reused instead.",
  },
  {
    title: "Edit, sync and export",
    body: "Fix wording, nudge start and end times, shift every cue at once if playback runs early or late, then download SRT, VTT or plain text.",
  },
];

const STEP_CARDS = [
  {
    num: "Step 1",
    title: STEPS[0].title,
    desc: STEPS[0].body,
    icon: <Upload className="h-6 w-6 text-primary" />,
  },
  {
    num: "Step 2",
    title: STEPS[1].title,
    desc: STEPS[1].body,
    icon: <Captions className="h-6 w-6 text-primary" />,
  },
  {
    num: "Step 3",
    title: STEPS[2].title,
    desc: STEPS[2].body,
    icon: <Download className="h-6 w-6 text-primary" />,
  },
];

const CAPABILITIES = [
  {
    title: "Real timecodes, not one block of text",
    desc: "Cues are produced against short audio windows and split at sentence boundaries, so each line carries its own start and end time instead of a single caption spanning the whole video.",
    icon: <Clock3 className="h-5 w-5 text-primary" />,
  },
  {
    title: "Editable in the browser",
    desc: "Change the text, adjust individual timings, delete a cue, or shift the entire track by half a second at a time. The preview updates as you type.",
    icon: <PencilLine className="h-5 w-5 text-emerald-500" />,
  },
  {
    title: "Bring your own subtitles",
    desc: "Already have an SRT or VTT? Import it, clean it up in the editor, and export it back out. Nothing has to be generated from scratch.",
    icon: <FileUp className="h-5 w-5 text-amber-500" />,
  },
  {
    title: "Standard export formats",
    desc: "Download SRT for most players and social uploads, VTT for the web and HTML5 video, or TXT when you want the transcript text on its own.",
    icon: <Download className="h-5 w-5 text-purple-500" />,
  },
];

const BENEFITS = [
  {
    label: "Accessibility",
    title: "Make your video watchable without sound",
    body: "Captions let people who are deaf or hard of hearing follow your video, and they help everyone else watching on mute in a commute, an office or a feed that autoplays silently.",
    icon: <Accessibility className="h-5 w-5 text-primary" />,
  },
  {
    label: "Retention",
    title: "Keep viewers with you for longer",
    body: "On-screen text keeps attention anchored when audio is unclear, accented, or competing with background noise. Fixing the wording of a key line takes seconds in the editor.",
    icon: <Sparkles className="h-5 w-5 text-primary" />,
  },
  {
    label: "Discoverability",
    title: "Turn spoken words into indexable text",
    body: "Export the plain-text version and use it for descriptions, chapters or article drafts. Upload the SRT alongside your video so platforms have the wording rather than guessing at it.",
    icon: <Search className="h-5 w-5 text-primary" />,
  },
];

const FAQS = [
  {
    q: "How do I add subtitles to a video?",
    a: "Upload your video file or paste a supported public link, then select Generate subtitles. The audio is transcribed into timed cues that appear in an editor next to a preview of your video. Adjust anything that needs fixing, then download the result as SRT, VTT or TXT and attach it to your video on the platform where you publish it.",
  },
  {
    q: "Is the subtitle generator free?",
    a: "Yes. Generating, editing and exporting subtitles is free and needs no account, email or card. Fair-use rate limits apply so the service stays responsive for everyone.",
  },
  {
    q: "Can I edit the subtitles after they are generated?",
    a: "That is the point of the editor. Every cue is editable: the text, the start time and the end time. You can delete cues you do not want, click a timecode to jump the preview to that moment, and watch the caption overlay update live as you type.",
  },
  {
    q: "How accurate are the timings?",
    a: "It depends on the source. When you paste a link to a platform that already publishes captions, those published timings are reused exactly. When cues are generated from your own file, the audio is transcribed in short windows and the text is distributed across each window, so timings are close but estimated rather than word-accurate. The editor exists so you can correct them.",
  },
  {
    q: "What if my subtitles are out of sync with the video?",
    a: "Use the sync adjustment buttons to shift every cue forward or back in half-second or one-second steps, which fixes a track that is uniformly early or late. If only a few cues drift, edit their start and end values directly in the cue list.",
  },
  {
    q: "What is the difference between subtitles and captions?",
    a: "Subtitles carry the spoken dialogue, usually for viewers who can hear the audio but need the words written out or translated. Captions are aimed at viewers who cannot hear the audio, so they also describe relevant non-speech sound. This tool produces the dialogue text with timings, which you can extend with sound descriptions in the editor if you need full captions.",
  },
  {
    q: "Can I burn the subtitles into the video file?",
    a: "Not here. Burning in subtitles means re-encoding the entire video, which is slow and would mean handling large rendered files. Instead you get a standard SRT or VTT sidecar file that YouTube, Vimeo, most players and most editing apps accept directly, plus a live preview so you can see how the captions read before exporting.",
  },
  {
    q: "Which formats and file sizes are supported?",
    a: "Common video containers including MP4, MOV, MKV, WebM, AVI and M4V, plus audio files such as MP3, WAV, M4A, FLAC and OGG. Uploads are limited to 100 MB. For anything larger, paste a public link instead, or export a smaller version of the video first.",
  },
  {
    q: "What happens to my video?",
    a: "Your upload is held only for the duration of the request, used to extract audio, and deleted as soon as processing finishes. Cues are returned to your browser and are not stored on the server, so closing the tab discards them.",
  },
];

export default function AddSubtitlesToVideoPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: "Add Subtitles to Video — MediaDocks",
            description:
              "Generate timed subtitle cues from a video or import an existing SRT or VTT, edit the text and timings in the browser, then export SRT, VTT or TXT.",
            path: "/add-subtitles-to-video",
            featureList: [
              "Upload MP4, MOV, MKV, WebM, AVI and M4V video",
              "Generate subtitles from a supported public link",
              "Reuse published platform captions when available",
              "Import an existing SRT or VTT file",
              "Edit cue text, start and end times",
              "Shift the whole subtitle track to fix sync",
              "Live caption overlay on the video preview",
              "Export SRT, VTT and plain text",
            ],
          }),
          howToJsonLd({
            name: "How to add subtitles to a video",
            description:
              "Add a video, generate or import timed subtitle cues, edit and sync them, then export SRT, VTT or TXT.",
            steps: STEPS,
          }),
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Add Subtitles to Video", path: "/add-subtitles-to-video" },
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
                <Captions className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-foreground">
                  Subtitle Generator
                </span>
                <span className="text-border" aria-hidden="true">
                  |
                </span>
                <span className="text-muted-foreground">Generate · Edit · Export</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
                Add Subtitles to Your Video
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-foreground/90 sm:text-lg">
                Generate timed captions with AI or import subtitles you already have, then fix the
                wording and the timing in an editor built for it.
              </p>
            </Reveal>

            <Reveal delay={180} className="mt-8 text-left">
              <SubtitleStudio />
            </Reveal>

            <Reveal delay={240}>
              <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Free, no account needed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5 text-primary" />
                  SRT, VTT & TXT export
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <PencilLine className="h-3.5 w-3.5 text-primary" />
                  Every cue editable
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
                How to add subtitles to a video
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Three steps, and the last one is where the quality comes from. Automatic cues get you
                most of the way; the editor closes the gap.
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

        {/* ── Capabilities ───────────────────────────────────────────────── */}
        <section className="section-shell">
          <Reveal>
            <div className="text-center">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                What you actually get
              </span>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Automatic subtitles, fully editable
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Start from generated cues or your own file, then change anything that reads wrong.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {CAPABILITIES.map((capability, index) => (
              <Reveal key={capability.title} delay={index * 60}>
                <div className="flex h-full gap-4 rounded-2xl border border-border/80 bg-surface/60 p-6 shadow-soft backdrop-blur-sm transition-all hover:border-border hover:bg-surface/90">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-strong">
                    {capability.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold">{capability.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{capability.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Why subtitle your videos ───────────────────────────────────── */}
        <section className="section-shell">
          <Reveal>
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Why subtitle your videos
              </h2>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {BENEFITS.map((benefit, index) => (
              <Reveal key={benefit.title} delay={index * 80}>
                <div className="h-full rounded-2xl border border-border/80 bg-surface/60 p-6 shadow-soft transition-all hover:border-border hover:bg-surface/90">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-primary/10">
                    {benefit.icon}
                  </div>
                  <span className="mt-4 block font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
                    {benefit.label}
                  </span>
                  <h3 className="mt-1 text-base font-semibold">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{benefit.body}</p>
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
                <h3 className="font-display text-lg font-bold sm:text-xl">Where the timings come from</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Paste a link to a platform that publishes captions and those exact timings are used.
                  For your own uploads the audio is transcribed in short windows and the text is spread
                  across each window, which is accurate to roughly the window rather than the word. The
                  editor labels which source you got, so you always know what you are working with.
                </p>
              </div>
              <div className="md:border-l md:border-border/60 md:pl-8">
                <h3 className="font-display text-lg font-bold sm:text-xl">Sidecar files, not re-encoding</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Exports are SRT, VTT and TXT. Burning captions permanently into the picture is not
                  offered, because it requires re-encoding the whole video. The live preview shows how
                  each cue will read on screen, and sidecar files are what YouTube, Vimeo and most
                  editors expect anyway.
                </p>
              </div>
              <div className="md:border-l md:border-border/60 md:pl-8">
                <h3 className="font-display text-lg font-bold sm:text-xl">Nothing kept afterwards</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Uploads and the audio extracted from them are deleted when the request finishes. Audio
                  is sent to the configured speech-to-text provider for processing; the resulting cues
                  are returned to your browser and never written to our database.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Readability notes ──────────────────────────────────────────── */}
        <section className="section-shell">
          <Reveal>
            <div className="mx-auto max-w-4xl rounded-3xl border border-border/80 bg-surface/50 p-8 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <Languages className="h-5 w-5" />
                </span>
                <h2 className="font-display text-xl font-bold sm:text-2xl">
                  Cues shaped for readers, not just for files
                </h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Subtitles that are technically valid can still be unreadable. Lines are wrapped to about
                42 characters across at most two lines, cues are held on screen for at least a second and
                at most six, and text is split at sentence ends where possible so a thought is not cut in
                half. If a cue still ends up too long, too fast or overlapping, the editor flags it as a
                readability note rather than silently letting it through.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The spoken language is detected automatically and cues are written in that language, so
                you are not forced to pick one up front. Translating into a different language is not part
                of this tool.
              </p>
            </div>
          </Reveal>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <section className="section-shell">
          <Reveal>
            <div className="text-center">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">FAQ</span>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Video subtitle questions
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
              <h3 className="text-sm font-semibold uppercase tracking-wider">Working with the same media?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Use transcription when you want the full text without timecodes, or the summarizer when you
                only need the gist.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/video-to-text"
                  className="focus-ring inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                >
                  <Sparkles className="h-4 w-4" />
                  Video to Text
                </Link>
                <Link
                  href="/audio-to-text"
                  className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-strong"
                >
                  <AudioLines className="h-4 w-4 text-primary" />
                  Audio to Text
                </Link>
                <Link
                  href="/audio-summarizer"
                  className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-strong"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Audio Summarizer
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
