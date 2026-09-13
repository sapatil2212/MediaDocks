import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronRight, Info, Music2 } from "lucide-react";
import { Downloader } from "@/components/downloader/Downloader";
import { FaqAccordion } from "@/components/FaqAccordion";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { Troubleshooting } from "@/components/sections/Troubleshooting";
import { CTASection } from "@/components/sections/CTASection";
import {
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
  howToJsonLd,
  softwareAppJsonLd,
} from "@/lib/seo";

/**
 * Dedicated page for the audio-extraction intent.
 *
 * This exists as its own route rather than a section of /yt-downloader because
 * the task is genuinely different — the decision a visitor faces is MP3 versus
 * M4A and which bitrate, not which resolution — and there is enough real
 * material to answer it properly. It is not a keyword variant of the video page:
 * none of the content below appears there.
 */
export const metadata: Metadata = buildMetadata({
  title: "YouTube to MP3 — Free Audio Downloader",
  description:
    "Convert a YouTube link to MP3 at 128, 192 or 320 kbps, or keep the original M4A with no re-encoding. Paste, pick a bitrate, save. Free, no sign up.",
  path: "/youtube-to-mp3",
  keywords: [
    "youtube to mp3",
    "youtube mp3 converter",
    "youtube audio downloader",
    "yt to mp3",
    "youtube to mp3 320kbps",
    "youtube to m4a",
    "download youtube audio",
    "youtube music downloader",
    "convert youtube video to mp3",
    "youtube to mp3 free no sign up",
    "extract audio from youtube",
    "youtube shorts to mp3",
  ],
});

const FORMATS = [
  {
    format: "M4A (original)",
    bitrate: "Whatever YouTube served",
    size: "~1 MB / min",
    best: "Best fidelity. The track is copied as-is with no second encode, so nothing is lost.",
  },
  {
    format: "MP3 320 kbps",
    bitrate: "320 kbps CBR",
    size: "~2.4 MB / min",
    best: "Only offered when the source is rich enough to justify it. Widest device support.",
  },
  {
    format: "MP3 192 kbps",
    bitrate: "192 kbps CBR",
    size: "~1.4 MB / min",
    best: "Sensible default for music when you need an MP3 specifically.",
  },
  {
    format: "MP3 128 kbps",
    bitrate: "128 kbps CBR",
    size: "~1 MB / min",
    best: "Speech, podcasts, lectures. Half the size with no audible loss on voice.",
  },
];

const STEPS = [
  {
    title: "Copy the YouTube link",
    body: "Any watch, Shorts, embed or youtu.be link works. Timestamps are ignored, so a link copied at 2:14 still gives you the whole track.",
  },
  {
    title: "Paste it and press Get formats",
    body: "The video resolves in a second or two and shows its title, channel and duration along with every available option.",
  },
  {
    title: "Scroll to Audio format",
    body: "Ignore the resolution row and pick from the audio group: the original M4A, or MP3 at the bitrate you want.",
  },
  {
    title: "Download",
    body: "The audio track alone is fetched and converted, so it finishes far faster than a video download of the same clip.",
  },
];

const FAQS = [
  {
    q: "Is converting YouTube to MP3 free here?",
    a: "Yes. There is no account, no email, no install and no paid tier. A light rate limit of five downloads a minute keeps the service responsive for everyone.",
  },
  {
    q: "Should I choose MP3 320 kbps or the original M4A?",
    a: "M4A, in almost every case. YouTube stores audio as AAC or Opus at roughly 130 kbps, and MediaDocks copies that track without touching it. Re-encoding it to MP3 320 cannot recover detail that was never there — it only triples the file size. Choose MP3 when a device or editor specifically needs MP3.",
  },
  {
    q: "Why is 320 kbps sometimes missing from the list?",
    a: "Because the bitrate options are capped at what the source actually carries. Encoding a 130 kbps source to 320 kbps produces a bigger file with identical audio, so that option is hidden rather than offered as a false upgrade.",
  },
  {
    q: "How long does it take?",
    a: "Audio-only downloads skip the video streams entirely, so a ten-minute track typically completes in well under a minute — much faster than downloading the same video at 1080p.",
  },
  {
    q: "Can I get audio from a YouTube Short?",
    a: "Yes. Shorts resolve exactly like standard videos, and the audio group appears for them in the same place.",
  },
  {
    q: "Does this work for private or age-restricted videos?",
    a: "No. MediaDocks only reads what a signed-out visitor can already play. It does not sign in or work around age gates, membership walls or DRM.",
  },
  {
    q: "Is the audio quality reduced?",
    a: "Not if you take the M4A, which is a byte-for-byte copy of the track YouTube served. MP3 options involve a re-encode by definition, which is why the original is listed first.",
  },
];

export default function YouTubeToMp3Page() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: "YouTube to MP3 — MediaDocks",
            description:
              "Free YouTube audio downloader. Convert a YouTube link to MP3 at 128, 192 or 320 kbps, or save the original M4A track without re-encoding.",
            path: "/youtube-to-mp3",
            featureList: [
              "MP3 at 128, 192 or 320 kbps",
              "Original M4A audio with no re-encoding",
              "Works with watch, Shorts, embed and youtu.be links",
              "No account and no software to install",
            ],
          }),
          howToJsonLd({
            name: "How to convert a YouTube video to MP3",
            description:
              "Paste a YouTube link, choose MP3 or the original M4A track, pick a bitrate and save the audio.",
            steps: STEPS,
          }),
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "YouTube downloader", path: "/yt-downloader" },
            { name: "YouTube to MP3", path: "/youtube-to-mp3" },
          ]),
        ]}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 lg:pt-20">
        {/* Dynamic Ambient Lighting Canvas */}
        <InteractiveBackground />

        {/* Subtle Micro-Grid & Vignette */}
        <div
          className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[34rem] opacity-40"
          aria-hidden="true"
        />

        <div className="section-shell relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            {/* Centered Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-6 flex justify-center">
              <ol className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-border/70 bg-surface/70 px-3.5 py-1 text-xs text-muted-foreground shadow-soft backdrop-blur-md">
                <li>
                  <Link href="/" className="transition-colors hover:text-foreground">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRight className="h-3 w-3 opacity-60" />
                </li>
                <li>
                  <Link href="/yt-downloader" className="transition-colors hover:text-foreground">
                    YouTube Downloader
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRight className="h-3 w-3 opacity-60" />
                </li>
                <li className="font-medium text-foreground" aria-current="page">
                  YouTube to MP3
                </li>
              </ol>
            </nav>

            {/* Audio Eyebrow Pill */}
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-soft backdrop-blur-md transition-colors hover:border-primary/40 hover:text-foreground">
                <Music2 className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[0.7rem] uppercase tracking-wider font-semibold text-foreground">
                  YouTube Audio
                </span>
                <span className="text-border" aria-hidden="true">|</span>
                <span className="text-muted-foreground">M4A · MP3 128 / 192 / 320 kbps</span>
              </div>
            </Reveal>

            {/* Centered Title */}
            <Reveal delay={60}>
              <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
                YouTube to MP3
              </h1>
            </Reveal>

            {/* Subtitles */}
            <Reveal delay={120}>
              <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-foreground/90 sm:text-lg">
                Paste a link, take the audio, skip the video entirely.
              </p>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                MediaDocks pulls the soundtrack out of any public YouTube video: MP3 at 128, 192 or
                320 kbps, or the original M4A track copied without a second encode. Because no video
                stream is fetched, audio downloads finish in a fraction of the time.
              </p>
            </Reveal>

            {/* Centered Command Downloader Box */}
            <Reveal delay={180} className="mx-auto mt-8 max-w-2xl text-left">
              <div className="relative rounded-2xl border border-border/80 bg-surface/80 p-2 shadow-lift backdrop-blur-2xl transition-all duration-300 hover:border-border hover:shadow-glow sm:p-3">
                <Downloader placeholder="Paste a YouTube, Shorts or youtu.be link..." />
              </div>
            </Reveal>

            {/* Centered Where to find notice Card */}
            <Reveal delay={240} className="mx-auto mt-5 max-w-2xl text-left">
              <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3.5 text-xs text-foreground shadow-soft backdrop-blur-md sm:text-sm">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="min-w-0">
                  <strong className="font-semibold text-foreground">Where to find it.</strong>{" "}
                  <span className="text-muted-foreground">
                    A YouTube link returns video resolutions and audio formats together. For audio,
                    skip the resolution row and choose from the <em>Audio format</em> group.
                  </span>
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Format comparison ────────────────────────────────────────────── */}
      <section id="which-format" className="scroll-mt-24 border-t border-border py-20">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Choosing</p>
            <h2 className="section-title mt-3">MP3 or M4A, and which bitrate</h2>
            <p className="mt-4 text-muted-foreground">
              YouTube stores audio as AAC or Opus at roughly 130 kbps. That single fact decides most
              of this choice.
            </p>
          </Reveal>

          <Reveal delay={90} className="mt-10">
            <div className="panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
                  <caption className="sr-only">
                    Comparison of available audio formats, bitrates and file sizes
                  </caption>
                  <thead>
                    <tr className="bg-surface-strong/60">
                      <th scope="col" className="px-5 py-3 text-xs font-semibold">
                        Option
                      </th>
                      <th scope="col" className="px-5 py-3 text-xs font-semibold">
                        Bitrate
                      </th>
                      <th scope="col" className="px-5 py-3 text-xs font-semibold">
                        Size
                      </th>
                      <th scope="col" className="px-5 py-3 text-xs font-semibold">
                        When to pick it
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {FORMATS.map((row) => (
                      <tr key={row.format} className="rule-row align-top">
                        <th scope="row" className="px-5 py-4 font-semibold whitespace-nowrap">
                          {row.format}
                        </th>
                        <td className="figure-mono px-5 py-4 text-xs whitespace-nowrap">
                          {row.bitrate}
                        </td>
                        <td className="figure-mono px-5 py-4 text-xs whitespace-nowrap">
                          {row.size}
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{row.best}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-5 max-w-2xl text-sm text-muted-foreground">
              <strong className="font-semibold text-foreground">The short answer:</strong> take the
              M4A unless something you own insists on MP3. Converting a 130 kbps source up to 320
              kbps cannot add detail that was never captured — it just makes the file bigger. That is
              also why the 320 option only appears for sources rich enough to warrant it.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Steps ────────────────────────────────────────────────────────── */}
      <section id="steps" className="scroll-mt-24 border-t border-border bg-surface-strong/30 py-20">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Step by step</p>
            <h2 className="section-title mt-3">How to convert a YouTube video to MP3</h2>
          </Reveal>

          <ol className="mt-10 max-w-3xl">
            {STEPS.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 80}>
                <div className="relative flex gap-5 pb-8 sm:gap-7">
                  {index < STEPS.length - 1 ? (
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
                    <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Also works for ──────────────────────────────────────────────── */}
      <section className="border-t border-border py-20">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Beyond YouTube</p>
            <h2 className="section-title mt-3">Audio from other platforms</h2>
            <p className="mt-4 text-muted-foreground">
              The same audio group appears for any video link that resolves, not just YouTube.
            </p>
          </Reveal>

          <ul className="mt-8 grid gap-x-10 gap-y-4 sm:grid-cols-2">
            {[
              ["Instagram reel to MP3", "/insta-downloader"],
              ["Twitter and X video to MP3", "/x-downloader"],
              ["Facebook video to MP3", "/fb-downloader"],
              ["Pinterest video Pin to MP3", "/pinterest-downloader"],
            ].map(([label, href], index) => (
              <Reveal as="li" key={href} delay={index * 55}>
                <Link
                  href={href}
                  className="focus-ring group flex items-center gap-3 rounded-xl py-2 text-sm font-semibold transition-colors hover:text-primary"
                >
                  <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {label}
                  <ArrowUpRight
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={220}>
            <p className="mt-8 text-sm text-muted-foreground">
              Need the picture as well as the sound? Use the{" "}
              <Link href="/yt-downloader" className="font-semibold text-primary hover:underline">
                YouTube video downloader
              </Link>{" "}
              for the full resolution ladder from 144p to 4K.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-24 border-t border-border py-20">
        <div className="section-shell grid gap-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <Reveal>
            <p className="eyebrow">FAQ</p>
            <h2 className="section-title mt-3">YouTube to MP3 questions</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Quality, speed, limits and what is out of scope.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <FaqAccordion items={FAQS} />
          </Reveal>
        </div>
      </section>

      <Troubleshooting />
      <CTASection />
    </>
  );
}
