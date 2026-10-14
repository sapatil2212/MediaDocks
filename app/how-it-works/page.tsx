import type { Metadata } from "next";
import Link from "next/link";
import { UsageGuide } from "@/components/sections/UsageGuide";
import { Capabilities } from "@/components/sections/Capabilities";
import { Troubleshooting } from "@/components/sections/Troubleshooting";
import { CTASection } from "@/components/sections/CTASection";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { breadcrumbJsonLd, buildMetadata, howToJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "How It Works — The Extraction & Transcription Pipeline",
  description:
    "A technical walkthrough of what happens between pasting a link and saving a file: URL validation, format enumeration, DASH stream muxing with FFmpeg, ephemeral streaming, and the AI transcription chunking pipeline.",
  path: "/how-it-works",
  keywords: [
    "how video downloaders work",
    "dash stream muxing explained",
    "how to download videos online",
    "how video extraction works",
    "ffmpeg remux explained",
    "how ai transcription works",
    "which video resolution to choose",
    "ephemeral media processing",
  ],
});

/**
 * Mirrors the four visible stages in the pipeline walkthrough below so the
 * HowTo markup matches what a reader actually sees on the page.
 */
const GUIDE_STEPS = [
  {
    title: "Paste and validate the link",
    body: "The URL is parsed, the platform is identified from its host, short links such as youtu.be, pin.it and fb.watch are expanded through validated redirects, and the host is checked against an allow-list before any outbound request is made.",
  },
  {
    title: "Enumerate what the source publishes",
    body: "The extractor asks the platform what renditions exist for that specific item and reads back the real ladder — resolutions, codecs, bitrates and durations. Nothing is assumed or padded.",
  },
  {
    title: "Fetch and assemble the format you chose",
    body: "Progressive formats are streamed straight through. Separate DASH video and audio streams are fetched in parallel and muxed into one MP4 with FFmpeg, so what you save is a single playable file.",
  },
  {
    title: "Stream to the browser and delete",
    body: "Bytes are piped to your browser as they are produced, then the request-scoped temporary directory is removed. No finished file is retained on the server.",
  },
];

/** The four pipeline stages, written out at length. */
const STAGES = [
  {
    id: "stage-validate",
    label: "Stage 01",
    title: "Validating the link before anything is fetched",
    paragraphs: [
      "The first thing that happens to a pasted URL is that it gets taken apart rather than trusted. The string is length-checked, parsed into a real URL object, and matched against the set of hosts the service knows how to handle. A URL that does not parse, or that points somewhere unexpected, is rejected at this boundary before a single outbound byte is sent.",
      "Short links need an extra step. A youtu.be, pin.it or fb.watch address does not contain the identifier the extractor needs, so it has to be followed to its destination. Those redirects are followed deliberately rather than blindly: each hop is re-validated against the same host allow-list, which stops a short link from being used to point the server at an address it would never accept directly.",
      "Only once the final URL is known and permitted does the extractor run. This ordering matters more than it sounds — a media service that fetches first and validates second is a server-side request forgery waiting to happen.",
    ],
  },
  {
    id: "stage-enumerate",
    label: "Stage 02",
    title: "Reading the real format ladder",
    paragraphs: [
      "With a validated URL, the extractor queries the platform for the renditions it publishes for that one item. What comes back is a list of concrete streams, each with its own container, codec, resolution, bitrate and file size. That list is what you see in the format picker — it is read from the source, not generated from a template.",
      "This is why two links from the same platform can offer different choices. A clip uploaded at 720p exposes no 1080p rendition, so none is listed. Showing one anyway would mean upscaling: a larger file carrying exactly the same detail, which is a worse outcome dressed up as a better one.",
      "Metadata arrives in the same pass — title, creator, duration and thumbnail — which is why the result card can show you what you are about to download before you commit to it. Duration is also where a source longer than the one-hour extraction ceiling gets caught and reported early, rather than after you have waited through a doomed transfer.",
    ],
  },
  {
    id: "stage-assemble",
    label: "Stage 03",
    title: "Muxing: why high resolutions cost more time",
    paragraphs: [
      "Below roughly 360p, most platforms still serve a progressive file — one container holding both picture and sound. Those downloads are close to a straight pass-through, which is why they feel instant.",
      "Above that, the model changes. YouTube and several others adopt DASH, publishing video and audio as entirely separate streams so a player can switch quality on the fly without re-buffering the soundtrack. It is an excellent design for streaming and an inconvenient one for downloading, because neither stream on its own is a usable file: the video track is silent and the audio track has no picture.",
      "To hand you one playable file, the server fetches both streams and muxes them — interleaving the two into a single MP4 container using FFmpeg. Muxing is not re-encoding. The compressed frames are copied across untouched, so there is no generational quality loss; only the wrapper changes. What it does cost is time, because a meaningful portion of both streams has to be on hand before output can begin. A ten-minute 1080p video typically takes about two minutes end to end, and that gap between picking 1080p and seeing the save dialog is almost entirely this step.",
      "Audio-only requests skip the video stream altogether. That is why extracting an MP3 from a long video finishes far quicker than any video rung — there is simply far less to move. MP3 output is the one place a genuine re-encode happens, and the available bitrates are capped at whatever the source track actually carries, because transcoding 128 kbps up to 320 kbps produces a bigger file and not one extra decibel of detail.",
    ],
  },
  {
    id: "stage-stream",
    label: "Stage 04",
    title: "Streaming out, then deleting",
    paragraphs: [
      "Output is piped to your browser as it is produced rather than assembled into a finished file and then served. The practical effect is that the download starts moving as soon as there is something to send, and the server never needs to hold a complete copy of your media.",
      "Whatever temporary working files the muxer needed live in a directory scoped to that single request, and that directory is removed when the request ends — on the error path as well as the success path. There is no media library, no cache of completed downloads and no archive to browse, which is the whole reason the privacy claim on this site is a structural fact rather than a promise.",
      "The descriptor produced when a link resolves is valid for thirty minutes. After that it expires and the URL has to be pasted again. A short window is what makes it safe to keep nothing: there is no long-lived handle pointing at anything.",
    ],
  },
];

/** The AI side of the service, which works on files rather than links. */
const AI_STEPS = [
  {
    title: "Normalise the audio",
    body: "Whatever you upload is decoded and resampled to 16 kHz mono. Speech models are trained at that rate, and stereo carries no information a transcriber can use, so this step shrinks the payload substantially without costing accuracy.",
  },
  {
    title: "Split into chunks",
    body: "Long recordings are cut into sequential segments small enough to fit the model's context. This is why a two-hour lecture spends a while in a processing state — it is being handled piece by piece, not in one shot.",
  },
  {
    title: "Transcribe and stitch",
    body: "Each segment is sent for recognition, then the returned text is reassembled in order. Language is detected automatically rather than being something you have to declare up front.",
  },
  {
    title: "Time-align for subtitles",
    body: "When you ask for subtitles, the recognised words are paired with their timings and written as cues, then emitted as SRT for editors and social platforms or WebVTT for the browser's native track element.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <JsonLd
        data={[
          howToJsonLd({
            name: "How to download a video and choose its quality",
            description:
              "Copy a public media link, paste it into MediaDocks, choose an MP4 resolution or MP3 audio, and save the file.",
            steps: GUIDE_STEPS,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "How it works", path: "/how-it-works" },
          ]),
        ]}
      />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-6">
        <div
          className="aurora pointer-events-none absolute inset-x-0 -top-20 h-72 opacity-50"
          aria-hidden="true"
        />
        <div className="section-shell relative max-w-3xl">
          <Reveal>
            <p className="eyebrow">Under the hood</p>
            <h1 className="hero-title mt-4">How MediaDocks works</h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Four stages sit between pasting a link and saving a file: validation, format
              enumeration, muxing, and ephemeral streaming. This page walks through each one, then
              covers the AI transcription pipeline, where to copy a link in every supported app, and
              what each error message means.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Pipeline walkthrough ───────────────────────────────────────────── */}
      <section id="pipeline" className="scroll-mt-24 border-t border-border py-20">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">The pipeline</p>
            <h2 className="section-title mt-3">From a pasted URL to a file on your disk</h2>
            <p className="mt-4 text-muted-foreground">
              Written out in order, including the parts that explain why some downloads are instant
              and others make you wait.
            </p>
          </Reveal>

          <div className="mt-12 space-y-14">
            {STAGES.map((stage, index) => (
              <Reveal key={stage.id} delay={index * 60}>
                <article id={stage.id} className="scroll-mt-24 grid gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
                      {stage.label}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-balance sm:text-2xl">
                      {stage.title}
                    </h3>
                  </div>
                  <div className="space-y-4 lg:col-span-8">
                    {stage.paragraphs.map((paragraph) => (
                      <p key={paragraph.slice(0, 48)} className="text-sm leading-relaxed text-muted-foreground">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI pipeline ────────────────────────────────────────────────────── */}
      <section
        id="ai-pipeline"
        className="scroll-mt-24 border-t border-border bg-surface-strong/30 py-20"
      >
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Speech to text</p>
            <h2 className="section-title mt-3">How the transcription side works</h2>
            <p className="mt-4 text-muted-foreground">
              The AI tools take a file rather than a link, so they run a different pipeline. Limits
              are 100 MB and two hours per upload.
            </p>
          </Reveal>

          <ol className="mt-10 max-w-3xl">
            {AI_STEPS.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 80}>
                <div className="relative flex gap-5 pb-8 sm:gap-7">
                  {index < AI_STEPS.length - 1 ? (
                    <span
                      className="absolute top-11 bottom-0 left-[1.1875rem] w-px bg-border sm:left-[1.4375rem]"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="font-display relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-surface text-sm font-semibold shadow-soft sm:h-12 sm:w-12 sm:text-base">
                    {index + 1}
                  </span>
                  <div className="min-w-0 pt-1.5">
                    <h3 className="text-lg font-semibold sm:text-xl">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={90}>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Accuracy is strong on clear single-speaker audio and degrades with background music,
              crosstalk and heavy reverb. Treat a transcript as a solid first draft — the{" "}
              <Link
                href="/guides/how-speech-to-text-ai-transcription-works"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                full guide to how speech recognition works
              </Link>{" "}
              explains where the remaining errors come from and why.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Where to copy a link (interactive, exclusive to this page) ─────── */}
      <UsageGuide />

      {/* ── What the service can and cannot do ─────────────────────────────── */}
      <Capabilities />

      {/* ── Interactive error lookup (exclusive to this page) ──────────────── */}
      <Troubleshooting />

      <CTASection />
    </>
  );
}
