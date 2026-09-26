import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { Hero } from "@/components/sections/Hero";
import { WhatIsMediaDocks } from "@/components/sections/WhatIsMediaDocks";
import { ToolsSuite } from "@/components/sections/ToolsSuite";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { UseCases } from "@/components/sections/UseCases";
import { Capabilities } from "@/components/sections/Capabilities";
import { UsageGuide } from "@/components/sections/UsageGuide";
import { DownloaderLinks } from "@/components/sections/DownloaderLinks";
import { TrustSection } from "@/components/sections/TrustSection";
import { FeaturedGuides } from "@/components/sections/FeaturedGuides";
import { Troubleshooting } from "@/components/sections/Troubleshooting";
import { FAQSection, FAQ_ITEMS } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";
import { buildMetadata, faqJsonLd, howToJsonLd, softwareAppJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "MediaDocks — Free Universal Media Downloader, MP3 & AI Transcriber",
  description:
    "Universal media utility for public links. Extract video up to 4K MP4, convert to MP3/M4A audio, transcribe speech with AI, add subtitles, and summarize recordings with 100% ephemeral privacy.",
  path: "/",
  keywords: [
    "video downloader",
    "video downloader online",
    "4k video downloader",
    "1080p video downloader",
    "youtube to mp3",
    "youtube video downloader",
    "instagram downloader",
    "instagram reels downloader",
    "twitter video downloader",
    "x video downloader",
    "facebook video downloader",
    "pinterest downloader",
    "mp4 downloader",
    "mp3 converter online",
    "transcribe video to text",
    "audio to text converter",
    "ai audio summarizer",
    "add subtitles to video",
    "downloader without watermark",
    "free downloader no sign up",
  ],
});

/** Mirrors the on-page steps in HowItWorks so the markup matches what is shown. */
const HOME_STEPS = [
  {
    title: "Paste the link or upload a file",
    body: "Copy a public link from YouTube, Instagram, X, Pinterest, or Facebook, or upload an audio/video file for AI transcription.",
  },
  {
    title: "Inspect formats and stream options",
    body: "The title, creator, duration, and published format rungs appear with verified resolution choices and bitrates.",
  },
  {
    title: "Select quality and stream directly",
    body: "Choose an MP4 resolution from 144p to 4K, switch to MP3/M4A audio, or download an AI transcript. The file streams directly to your browser with zero permanent retention.",
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: "MediaDocks — Precision Media Suite",
            description:
              "Universal media processing platform for public links and recordings: multi-rung video downloader, audio extractor, AI speech-to-text transcriber, and subtitle generator.",
            path: "/",
            featureList: [
              "Download public videos as MP4 from 144p to 4K UHD",
              "Extract pristine audio as MP3 or original M4A track",
              "AI speech-to-text transcription with auto-language detection",
              "Generate and edit timed SRT and WebVTT subtitle cues",
              "AI audio summarizer with action items and key takeaways",
              "Instagram reels, X (Twitter) videos, and Pinterest Pins",
              "Ephemeral in-memory streaming pipelines with zero permanent storage",
              "No registration, no accounts, and no client software needed",
            ],
          }),
          howToJsonLd({
            name: "How to download media and transcribe speech with MediaDocks",
            description:
              "Three straightforward steps from a public media link or upload to a finished MP4, MP3, or plain-text transcript.",
            steps: HOME_STEPS,
          }),
          faqJsonLd(FAQ_ITEMS),
        ]}
      />
      <Hero />
      <WhatIsMediaDocks />
      <ToolsSuite />
      <HowItWorks />
      <UseCases />
      <Capabilities />
      <UsageGuide />
      <DownloaderLinks />
      <TrustSection />
      <FeaturedGuides />
      <Troubleshooting />
      <FAQSection />
      <CTASection />
    </>
  );
}
