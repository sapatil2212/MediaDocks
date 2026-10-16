import type { Metadata } from "next";
import { Sparkles, Music2, ShieldCheck, Zap, Scissors, Layers, CheckCircle2 } from "lucide-react";
import { VideoToAudioHero } from "@/src/components/converters/VideoToAudioHero";
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
  title: "Extract Audio from Video Online — Video to MP3 & Audio Converter",
  description:
    "Extract audio from any video online. Convert MP4, MKV, MOV, WebM to MP3 (up to 320 kbps), WAV, M4A, FLAC, OGG, or OPUS. Upload videos of any length without file size limits.",
  path: "/video-to-audio",
  keywords: [
    "video to audio",
    "extract audio from video",
    "video to mp3",
    "convert video to audio",
    "video to audio converter",
    "extract mp3 from mp4",
    "convert mkv to mp3",
    "extract audio from long video",
    "large video to mp3 converter",
    "video to wav converter",
    "video to m4a",
    "video to flac",
    "video to opus",
    "extract sound from video",
    "mp4 to mp3 320kbps",
    "free video to audio extractor",
  ],
});

const HOW_TO_STEPS = [
  {
    title: "Upload your video file",
    body: "Drag and drop or browse any video (MP4, MKV, MOV, WebM, AVI, FLV, M4V, etc.). Long recordings of any duration — 10 minutes to 3+ hours — are fully supported.",
  },
  {
    title: "Select audio format and settings",
    body: "Choose MP3 (up to 320 kbps Studio Quality), M4A, Lossless WAV, FLAC, OGG, or OPUS. Customize channels (stereo/mono), volume gain, or trim a specific segment.",
  },
  {
    title: "Extract, preview & download",
    body: "Our high-speed media engine strips the video frames and extracts the audio track in seconds. Listen directly in your browser and download with one click.",
  },
];

const FAQS = [
  {
    q: "Can I upload very long videos (1 hour, 2 hours, or longer)?",
    a: "Yes! MediaDocks is specifically engineered to handle long recordings of any duration, including 1-hour lectures, 2-hour podcasts, 3-hour webinars, and church sermons. Our chunked streaming pipeline uploads the video smoothly without browser crashes or timeouts.",
  },
  {
    q: "Is there a file size upload limit?",
    a: "Unlike typical online converters that cap uploads at 50 MB or 100 MB, MediaDocks supports large video files (500 MB, 1 GB, 2 GB, and beyond) by streaming the video in resilient chunks directly to our ephemeral media processor.",
  },
  {
    q: "Which audio format should I choose?",
    a: "MP3 at 320 kbps is the best all-around choice for universal playback on smartphones, cars, and media players. Choose M4A for Apple devices, WAV or FLAC if you require uncompressed studio-grade lossless fidelity for sound editing, and OPUS for exceptional voice clarity at compact file sizes.",
  },
  {
    q: "Does extracting audio reduce the sound quality?",
    a: "No. MediaDocks preserves the pristine quality of the source audio. When selecting 320 kbps MP3 or lossless WAV/FLAC, you get the highest possible fidelity without generation loss.",
  },
  {
    q: "Can I trim or extract just a part of a long video?",
    a: "Yes. Simply toggle the 'Clip / Trim Audio' option in the settings, set your desired Start Time and End Time (e.g., 00:15:30 to 00:25:00), and MediaDocks will extract only that exact segment.",
  },
  {
    q: "Are my uploaded videos stored or shared?",
    a: "Never. Privacy and security are core principles of MediaDocks. Your uploaded video is processed ephemerally in an isolated buffer and permanently deleted immediately after the audio track is extracted. We retain zero files.",
  },
];

const FORMAT_COMPARISON = [
  {
    format: "MP3",
    bitrate: "128 – 320 kbps",
    compression: "Lossy (Universal)",
    fidelity: "Excellent (320k)",
    bestFor: "Everyday listening, smartphones, car stereos, podcasts, sharing",
  },
  {
    format: "M4A / AAC",
    bitrate: "128 – 256 kbps",
    compression: "Lossy (Advanced)",
    fidelity: "Near-Lossless",
    bestFor: "iPhone, iPad, Mac, Apple Music, high efficiency at lower bitrates",
  },
  {
    format: "WAV",
    bitrate: "1411 kbps (16/24-bit)",
    compression: "Uncompressed",
    fidelity: "Lossless Master",
    bestFor: "DAWs, Premiere Pro, Final Cut, audio engineering, studio sampling",
  },
  {
    format: "FLAC",
    bitrate: "Variable (~800 kbps)",
    compression: "Lossless Compressed",
    fidelity: "Lossless Master",
    bestFor: "Audiophiles, archival storage, high-end Hi-Fi sound systems",
  },
  {
    format: "OGG (Vorbis)",
    bitrate: "128 – 320 kbps",
    compression: "Lossy (Open)",
    fidelity: "Very High",
    bestFor: "Game development (Unity/Unreal), web audio, open-source players",
  },
  {
    format: "OPUS",
    bitrate: "96 – 256 kbps",
    compression: "Lossy (Next-Gen)",
    fidelity: "Superior Voice",
    bestFor: "Speech, voice recordings, Discord, streaming voice applications",
  },
];

export default function VideoToAudioPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: "Video to Audio Converter — MediaDocks",
            description:
              "Extract high-fidelity audio tracks from video files of any length. Convert MP4, MKV, MOV, WebM to MP3 (up to 320 kbps), WAV, M4A, FLAC, OGG, or OPUS. Zero file size limit.",
            path: "/video-to-audio",
            featureList: [
              "Extract audio from MP4, MKV, MOV, WebM, AVI, FLV, M4V, WMV, TS",
              "Any length video supported — 10 minutes to 3+ hours",
              "Chunked stream upload handling large gigabyte files with ease",
              "Output to MP3 (up to 320 kbps), M4A, WAV, FLAC, OGG, OPUS",
              "Custom audio trimming (start & end time clipping)",
              "Volume booster and EBU R128 audio normalization",
              "Interactive in-browser audio preview player",
              "100% ephemeral privacy with zero permanent file storage",
            ],
          }),
          howToJsonLd({
            name: "How to extract audio from video online",
            description:
              "Upload any video file, select your preferred audio format and bitrate, then extract and download the audio track in seconds.",
            steps: HOW_TO_STEPS,
          }),
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Video to Audio", path: "/video-to-audio" },
          ]),
        ]}
      />

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 lg:pt-20">
        <InteractiveBackground />

        <div
          className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[36rem] opacity-40"
          aria-hidden="true"
        />

        <div className="section-shell relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            {/* Eyebrow Pill */}
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-soft backdrop-blur-md transition-colors hover:border-primary/40 hover:text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[0.7rem] uppercase tracking-wider font-semibold text-foreground">
                  Universal Audio Extractor
                </span>
                <span className="text-border" aria-hidden="true">|</span>
                <span className="text-muted-foreground">Any Length · Up to 320 kbps MP3</span>
              </div>
            </Reveal>

            {/* Title */}
            <Reveal delay={60}>
              <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
                Extract Audio from Video Online
              </h1>
            </Reveal>

            {/* Tagline */}
            <Reveal delay={120}>
              <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-foreground/90 sm:text-lg">
                Convert MP4, MKV, MOV, WebM and AVI to studio-quality MP3, WAV, M4A, FLAC, or OPUS.
                Upload videos of any length — from short clips to 3+ hour recordings — with zero file size limits.
              </p>
            </Reveal>
          </div>

          {/* Interactive Studio */}
          <div className="mt-10">
            <VideoToAudioHero />
          </div>
        </div>
      </section>

      {/* ── Key Advantages Section ────────────────────────────────────────── */}
      <section className="border-t border-border bg-surface-strong/30 py-20 lg:py-24">
        <div className="section-shell">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">
              Engineered for Power & Speed
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold mt-2 text-foreground">
              Why MediaDocks Handles Any Video
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Built on native FFmpeg stream processing and chunked uploads, eliminating the limitations of conventional web converters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border/80 bg-surface/60 p-6 backdrop-blur transition-all hover:border-primary/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Any Duration & Large Files</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Whether your video is 5 minutes or 3 hours long (lectures, concerts, podcasts, church services), our chunked streaming pipeline uploads it smoothly without memory crashes or timeouts.
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-surface/60 p-6 backdrop-blur transition-all hover:border-primary/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <Music2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Studio 320 kbps & Lossless</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Choose the maximum 320 kbps CBR MP3 bitrate for unmatched fidelity, or export uncompressed 16/24-bit WAV and FLAC for professional audio production in DAWs.
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-surface/60 p-6 backdrop-blur transition-all hover:border-primary/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Zero Storage Ephemeral Privacy</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Your video never stays on our servers. The moment the audio track is demuxed, the source video is wiped permanently. Download links are short-lived and private.
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-surface/60 p-6 backdrop-blur transition-all hover:border-primary/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <Scissors className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Precision Audio Trimming</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Need only a 5-minute song or speech from a 2-hour video? Set custom start and end timestamps to clip and extract exactly what you need.
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-surface/60 p-6 backdrop-blur transition-all hover:border-primary/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Volume Gain & Normalization</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Quiet recording? Boost the sound by up to 200% or apply broadcast-standard EBU R128 loudness normalization to ensure consistent, punchy audio.
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-surface/60 p-6 backdrop-blur transition-all hover:border-primary/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">In-Browser Live Preview</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Listen to your extracted audio directly in the browser player before saving it. Check clarity, scrub through timestamps, and verify the mix.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Audio Format Comparison Table ─────────────────────────────────── */}
      <section className="border-t border-border py-20 lg:py-24">
        <div className="section-shell">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">
              Audio Format Guide
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold mt-2 text-foreground">
              Compare Output Audio Formats
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Select the optimal audio container and bitrate for your specific workflow.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/80 bg-surface/50">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-border bg-surface-strong/80 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4 font-semibold text-foreground">Format</th>
                  <th className="p-4 font-semibold">Typical Bitrate</th>
                  <th className="p-4 font-semibold">Compression</th>
                  <th className="p-4 font-semibold">Fidelity</th>
                  <th className="p-4 font-semibold">Best Suited For</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {FORMAT_COMPARISON.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-strong/40 transition-colors">
                    <td className="p-4 font-semibold text-foreground">{row.format}</td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{row.bitrate}</td>
                    <td className="p-4 text-muted-foreground">{row.compression}</td>
                    <td className="p-4">
                      <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {row.fidelity}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">{row.bestFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── How It Works Steps ────────────────────────────────────────────── */}
      <section className="border-t border-border bg-surface-strong/30 py-20 lg:py-24">
        <div className="section-shell">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold mt-2 text-foreground">
              How to Extract Audio from Video
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_TO_STEPS.map((step, idx) => (
              <div
                key={idx}
                className="relative rounded-xl border border-border/80 bg-surface/70 p-6 backdrop-blur"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono font-bold text-sm mb-4">
                  {idx + 1}
                </div>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Frequently Asked Questions ────────────────────────────────────── */}
      <section className="border-t border-border py-20 lg:py-24">
        <div className="section-shell max-w-3xl">
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">
              Common Questions
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold mt-2 text-foreground">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border/80 bg-surface/60 p-5 sm:p-6 transition-all hover:border-primary/40"
              >
                <h3 className="text-sm sm:text-base font-semibold text-foreground">{faq.q}</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call to Action ────────────────────────────────────────────────── */}
      <CTASection />
    </>
  );
}
