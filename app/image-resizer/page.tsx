import { ImageResizerHero } from "@/components/converters/ImageResizerHero";
import { ConverterSections } from "@/components/converters/ConverterSections";
import { ContentSections } from "@/components/converters/ContentSections";
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
import { content } from "./content";

const TOOL_NAME = "Image Resizer";
const PATH = "/image-resizer";

export const metadata = buildMetadata({
  title: "Free Image Resizer — Resize by Pixels, Dimensions & Percentage | MediaDocks",
  description:
    "Resize any image by exact pixels or percentage with the aspect ratio locked, and reformat to PNG, JPEG or WebP on export. Processed privately in your browser.",
  path: PATH,
  keywords: [
    "image resizer",
    "resize image online",
    "resize image by pixels",
    "resize image percentage",
    "change image dimensions",
    "photo resizer",
    "resize jpg png",
    "free image resizer",
  ],
});

export default function ImageResizerPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: `${TOOL_NAME} — MediaDocks`,
            description:
              "Resize images by exact pixels or percentage in the browser, with an aspect-ratio lock and optional format change on export.",
            path: PATH,
            featureList: content.featureList,
          }),
          howToJsonLd({
            name: "How to resize an image",
            description:
              "Upload a photo, set new dimensions in pixels or a percentage with the ratio locked, and download the resized image.",
            steps: content.howTo,
          }),
          faqJsonLd(content.faqs),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: TOOL_NAME, path: PATH },
          ]),
        ]}
      />

      <div className="relative overflow-hidden pt-8 pb-10">
        <InteractiveBackground />

        <div className="section-shell relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-10">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-none backdrop-blur-md">
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Smart Dimensions
                </span>
                <span className="text-border">|</span>
                <span>Online Image Resizer</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="hero-title mt-4 text-balance font-display font-bold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl">
                Resize Images with Precision
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Auto-detect image dimensions, lock the aspect ratio, resize by pixel or percentage,
                and export in your preferred format without distortion.
              </p>
            </Reveal>
          </div>

          <Reveal delay={180}>
            <ImageResizerHero />
          </Reveal>

          <ConverterSections
            toolName={TOOL_NAME}
            features={content.features}
            howItWorks={content.howItWorks}
            featuresHeading={content.featuresHeading}
            featuresSubline={content.featuresSubline}
            privacyBannerTitle={content.privacyBannerTitle}
            privacyBannerBody={content.privacyBannerBody}
          />
        </div>
      </div>

      <ContentSections
        toolName={TOOL_NAME}
        intro={content.intro}
        howToTitle={content.howToTitle}
        howTo={content.howTo}
        formatsTitle={content.formatsTitle}
        formats={content.formats}
        useCasesTitle={content.useCasesTitle}
        useCases={content.useCases}
        privacyTitle={content.privacyTitle}
        privacyNote={content.privacyNote}
        faqs={content.faqs}
        relatedGuides={content.relatedGuides}
        relatedTools={content.relatedTools}
      />

      <CTASection />
    </>
  );
}
