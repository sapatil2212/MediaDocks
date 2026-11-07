import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { Hero } from "@/components/sections/Hero";
import { WhatIsMediaDocks } from "@/components/sections/WhatIsMediaDocks";
import { ToolsSuite } from "@/components/sections/ToolsSuite";
import { UseCases } from "@/components/sections/UseCases";
import { TrustSection } from "@/components/sections/TrustSection";
import { FeaturedGuides } from "@/components/sections/FeaturedGuides";
import { FAQSection, FAQ_ITEMS } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";
import { buildMetadata, faqJsonLd, softwareAppJsonLd } from "@/lib/seo";

const homeMetadata = buildMetadata({
  title: "MediaDocks: AI Transcription, Subtitles & Media Tools",
  description:
    "Transcribe video and audio to editable text, generate timed SRT and VTT subtitles, summarize long recordings, and convert images and documents. No account needed.",
  path: "/",
});

/** The home title is the brand, so it skips the " | MediaDocks" template suffix. */
export const metadata: Metadata = {
  ...homeMetadata,
  title: { absolute: "MediaDocks: AI Transcription, Subtitles & Media Tools" },
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: "MediaDocks: AI Media Toolkit",
            description:
              "Browser-based tools: AI speech-to-text transcription, timed subtitle generation, recording summaries, and image and document converters.",
            path: "/",
            featureList: [
              "AI speech-to-text transcription with automatic language detection",
              "Editable transcript output as copyable text or TXT download",
              "Generate and edit timed SRT and WebVTT subtitle cues",
              "AI audio summarizer with key points and action items",
              "Extract audio from video files",
              "Image, PDF, SVG, Base64 and QR code tools",
              "Background Remover with transparent PNG export",
              "No account required",
            ],
          }),
          faqJsonLd(FAQ_ITEMS),
        ]}
      />
      <Hero />
      {/* The AI tools lead; they work on files you already have. */}
      <ToolsSuite />
      <WhatIsMediaDocks />
      <UseCases />
      <TrustSection />
      <FeaturedGuides />
      <FAQSection />
      <CTASection />
    </>
  );
}