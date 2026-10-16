import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { Hero } from "@/components/sections/Hero";
import { WhatIsMediaDocks } from "@/components/sections/WhatIsMediaDocks";
import { ToolsSuite } from "@/components/sections/ToolsSuite";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { UseCases } from "@/components/sections/UseCases";
import { DownloaderLinks } from "@/components/sections/DownloaderLinks";
import { TrustSection } from "@/components/sections/TrustSection";
import { FeaturedGuides } from "@/components/sections/FeaturedGuides";
import { FAQSection, FAQ_ITEMS } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";
import { buildMetadata, faqJsonLd, howToJsonLd, softwareAppJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "MediaDocks — AI Transcription, Subtitles & Media Converter",
  description:
    "Transcribe video and audio to editable text, generate timed SRT and VTT subtitles, and summarize long recordings into key points. Public media links also convert to MP4 or MP3. Free, no account, nothing stored.",
  path: "/",
  keywords: [
    "transcribe video to text",
    "audio to text converter",
    "transcribe audio free",
    "ai transcription online",
    "speech to text online",
    "generate subtitles from video",
    "add subtitles to video",
    "srt generator",
    "vtt subtitle generator",
    "ai audio summarizer",
    "summarize meeting recording",
    "transcribe interview online",
    "transcribe lecture to text",
    "video to mp3 converter",
    "media converter online",
    "free transcription no sign up",
  ],
});

/** Mirrors the on-page steps in HowItWorks so the markup matches what is shown. */
const HOME_STEPS = [
  {
    title: "Upload a recording or paste a link",
    body: "Drop in an audio or video file for transcription, subtitles or a summary, or paste a public link from YouTube, Instagram, X, Pinterest or Facebook.",
  },
  {
    title: "Review what came back",
    body: "Transcripts open in an editor so you can fix names and punctuation. Links list the title, creator, duration and every format rung the source actually publishes.",
  },
  {
    title: "Export what you need",
    body: "Copy the text, download it as TXT, export timed SRT or VTT cues, or save an MP4 or MP3. Everything streams straight to your browser with nothing retained afterwards.",
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: "MediaDocks — AI Media Toolkit",
            description:
              "Browser-based media workspace: AI speech-to-text transcription, timed subtitle generation, recording summarisation, and format conversion for public media links.",
            path: "/",
            featureList: [
              "AI speech-to-text transcription with automatic language detection",
              "Editable transcript output as copyable text or TXT download",
              "Generate and edit timed SRT and WebVTT subtitle cues",
              "AI audio summarizer with key points and action items",
              "Extract audio as MP3 or the original M4A track",
              "Extract audio from videos of any length into 320 kbps MP3, WAV, M4A, or FLAC",
              "Convert public media links to MP4 from 144p to 4K UHD",
              "Ephemeral in-memory pipelines with zero permanent storage",
              "No registration, no accounts, and no client software needed",
            ],
          }),
          howToJsonLd({
            name: "How to transcribe, caption or convert media with MediaDocks",
            description:
              "Three steps from an uploaded recording or a public media link to an editable transcript, timed subtitles, a summary, or an MP4 or MP3 file.",
            steps: HOME_STEPS,
          }),
          faqJsonLd(FAQ_ITEMS),
        ]}
      />
      <Hero />
      {/*
        ToolsSuite leads, ahead of the product-overview prose. The AI tools are
        the reason to be here and they carry no rights ambiguity; the link
        downloader is one capability among several rather than the headline.
      */}
      <ToolsSuite />
      <WhatIsMediaDocks />
      {/*
        The deep how-to sections (UsageGuide, Capabilities, Troubleshooting) used
        to render here as well as on /how-it-works, /faq and all five platform
        pages — the same ~1,500 words served from eight URLs. They now live only
        on /how-it-works, which HowItWorks below links through to.
      */}
      <HowItWorks />
      <UseCases />
      <DownloaderLinks />
      <TrustSection />
      <FeaturedGuides />
      <FAQSection />
      <CTASection />
    </>
  );
}
