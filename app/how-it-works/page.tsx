import type { Metadata } from "next";
import Link from "next/link";
import { CTASection } from "@/components/sections/CTASection";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "How It Works: Transcription and In-Browser Tools",
  description:
    "What happens to a recording when you transcribe it, create subtitles or summarize it, and which MediaDocks tools run entirely in your browser.",
  path: "/how-it-works",
});

/** The speech tools take a file, so they run a server-side pipeline. */
const AI_STEPS = [
  {
    title: "Normalise the audio",
    body: "Whatever you upload is decoded and resampled to 16 kHz mono. Speech recognition does not need stereo or high sample rates, so this step shrinks the payload without hurting recognition.",
  },
  {
    title: "Split into pieces",
    body: "Long recordings are cut into sequential segments small enough to send to the speech model. This is why a long lecture spends a while in a processing state: it is handled piece by piece, not in one request.",
  },
  {
    title: "Transcribe and stitch",
    body: "Each segment is sent to Google's Gemini API for recognition, then the returned text is reassembled in order. The spoken language is detected automatically instead of being something you have to declare.",
  },
  {
    title: "Time-align for subtitles",
    body: "When you ask for subtitles, the recognised text is paired with timings and written as cues, then offered as SRT for editors and social platforms or WebVTT for the browser's native track element.",
  },
];

/** Tools that never send the file to a MediaDocks server. */
const BROWSER_TOOLS = [
  { name: "Image Converter", path: "/image-converter", note: "Converts between common image formats on your device." },
  { name: "Image Resizer", path: "/image-resizer", note: "Resizes by pixels or percentage on your device." },
  { name: "Background Remover", path: "/background-remover", note: "Runs an image model in your browser after fetching it once." },
  { name: "PDF to Image", path: "/pdf-to-image", note: "Renders PDF pages to images on your device." },
  { name: "Image to PDF", path: "/image-to-pdf", note: "Combines images into a PDF on your device." },
  { name: "SVG to PNG", path: "/svg-to-png", note: "Rasterizes vector files on your device." },
  { name: "Base64 Image", path: "/base64-image", note: "Encodes and decodes image data on your device." },
  { name: "QR Code Generator", path: "/qr-code-generator", note: "Draws QR codes on your device." },
];

export default function HowItWorksPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "How it works", path: "/how-it-works" },
          ]),
        ]}
      />

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
              The speech tools process your file on the server in a few stages. Most of the image
              and document tools never leave your browser. This page explains both so you know
              where your file goes.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="ai-pipeline" className="scroll-mt-24 border-t border-border bg-surface-strong/30 py-20">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Speech to text</p>
            <h2 className="section-title mt-3">How the transcription side works</h2>
            <p className="mt-4 text-muted-foreground">
              The speech tools take a file you upload. By default uploads are limited to 100 MB and
              two hours.
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
              Accuracy is better on clear single-speaker audio and drops with background music,
              crosstalk and heavy echo. Treat a transcript as a first draft. The{" "}
              <Link
                href="/guides/how-speech-to-text-ai-transcription-works"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                guide to how speech recognition works
              </Link>{" "}
              explains where the remaining errors come from.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="in-browser" className="scroll-mt-24 border-t border-border py-20">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">On your device</p>
            <h2 className="section-title mt-3">Tools that run in your browser</h2>
            <p className="mt-4 text-muted-foreground">
              These tools process your files with code that runs in your browser tab. The files are
              not uploaded to a MediaDocks server.
            </p>
          </Reveal>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {BROWSER_TOOLS.map((tool, index) => (
              <Reveal as="li" key={tool.path} delay={index * 40}>
                <Link
                  href={tool.path}
                  className="panel group block h-full p-5 transition-all hover:border-primary/40 hover:shadow-soft"
                >
                  <h3 className="text-sm font-semibold transition-colors group-hover:text-primary">
                    {tool.name}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground">{tool.note}</p>
                </Link>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={90}>
            <p className="mt-8 max-w-3xl text-sm text-muted-foreground">
              Two tools do use the server: Video to Audio uploads your video so the audio can be
              extracted, and the URL Shortener stores the links you create. Details are in the{" "}
              <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
                privacy policy
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>

      <CTASection />
    </>
  );
}
