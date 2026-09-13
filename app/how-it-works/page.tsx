import type { Metadata } from "next";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { UsageGuide } from "@/components/sections/UsageGuide";
import { Capabilities } from "@/components/sections/Capabilities";
import { Troubleshooting } from "@/components/sections/Troubleshooting";
import { CTASection } from "@/components/sections/CTASection";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { buildMetadata, howToJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "How to Download a Video and Pick Its Quality",
  description:
    "Where to copy a link from on each platform, what every format option means, how to choose between MP4 resolutions and MP3 audio, and how to fix failures.",
  path: "/how-it-works",
  keywords: [
    "how to download videos online",
    "how to download youtube videos",
    "how to save instagram reels",
    "how to convert video to mp3",
    "how to download pinterest images",
    "media downloader guide",
    "which video resolution to choose",
  ],
});

const GUIDE_STEPS = [
  {
    title: "Copy the link",
    body: "Use the platform's share menu, or copy the browser address bar. Short links like youtu.be, pin.it and fb.watch all work.",
  },
  {
    title: "Paste it into the field",
    body: "The platform is recognised as you type. Press Enter or Get formats to read what the link publishes.",
  },
  {
    title: "Choose a format",
    body: "Pick an MP4 resolution between 144p and 4K, or switch to audio for MP3 or the original M4A track.",
  },
  {
    title: "Save the file",
    body: "The file is assembled on the server, streamed to your browser, then deleted. Nothing is kept.",
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
        ]}
      />

      <section className="relative overflow-hidden pt-16 pb-6">
        <div
          className="aurora pointer-events-none absolute inset-x-0 -top-20 h-72 opacity-50"
          aria-hidden="true"
        />
        <div className="section-shell relative max-w-3xl">
          <Reveal>
            <p className="eyebrow">Guide</p>
            <h1 className="hero-title mt-4">How to use MediaDocks</h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Paste a public link, pick a quality, keep the file. This page covers where to find the
              link on each platform, which format to choose, and what the error messages mean.
            </p>
          </Reveal>
        </div>
      </section>

      <HowItWorks id="steps" />
      <UsageGuide />
      <Capabilities />
      <Troubleshooting />
      <CTASection />
    </>
  );
}
