import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Capabilities } from "@/components/sections/Capabilities";
import { UsageGuide } from "@/components/sections/UsageGuide";
import { DownloaderLinks } from "@/components/sections/DownloaderLinks";
import { Troubleshooting } from "@/components/sections/Troubleshooting";
import { FAQSection, FAQ_ITEMS } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";
import { buildMetadata, faqJsonLd, howToJsonLd, softwareAppJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "MediaDocks — Free Video Downloader: Pick Any Resolution or MP3",
  description:
    "Paste a YouTube, Instagram, X, Pinterest or Facebook link and save it as MP4 from 144p to 4K, or pull the audio out as MP3 or M4A. Free, no sign up.",
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
    "download reels online",
    "all in one video downloader",
    "universal media downloader",
    "downloader without watermark",
    "free downloader no sign up",
  ],
});

/** Mirrors the on-page steps in HowItWorks so the markup matches what is shown. */
const HOME_STEPS = [
  {
    title: "Paste the link",
    body: "Copy a public link from the app or the browser address bar and drop it into the field.",
  },
  {
    title: "Read what came back",
    body: "The title, creator and preview appear with every format the source actually publishes.",
  },
  {
    title: "Pick a quality and save",
    body: "Choose a resolution from 144p to 4K, or switch to audio for MP3 or the original M4A.",
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: "MediaDocks",
            description:
              "Free online downloader for public media links from YouTube, Instagram, X, Pinterest and Facebook, with selectable video resolutions and MP3 or M4A audio.",
            path: "/",
            featureList: [
              "Download public videos as MP4 from 144p to 4K",
              "Extract audio as MP3 at 128, 192 or 320 kbps",
              "Keep the original M4A audio track without re-encoding",
              "Instagram reels and post images",
              "X (Twitter) videos and photos",
              "Pinterest Pin images and video Pins",
              "No account, no app, no tracking",
            ],
          }),
          howToJsonLd({
            name: "How to download a video and choose its quality",
            description:
              "Three steps from a public media link to a saved MP4 or MP3, with the resolution you pick.",
            steps: HOME_STEPS,
          }),
          faqJsonLd(FAQ_ITEMS),
        ]}
      />
      <Hero />
      <HowItWorks />
      <Capabilities />
      <UsageGuide />
      <DownloaderLinks />
      <Troubleshooting />
      <FAQSection />
      <CTASection />
    </>
  );
}
