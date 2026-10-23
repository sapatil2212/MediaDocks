import { ImageConverterHero } from "@/components/converters/ImageConverterHero";
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

const TOOL_NAME = "Image Converter";
const PATH = "/image-converter";

export const metadata = buildMetadata({
  title: "Free Batch Image Converter — JPG, PNG, WebP, AVIF, GIF, SVG | MediaDocks",
  description:
    "Convert up to 10 images between JPG, PNG, WebP, AVIF, GIF, BMP, SVG and ICO with per-file control. Processed in your browser with an instant ZIP download.",
  path: PATH,
  keywords: [
    "image converter",
    "convert jpg to png",
    "png to webp converter",
    "convert to avif",
    "batch image converter",
    "image format converter",
    "webp converter",
    "free image converter online",
  ],
});

export default function ImageConverterPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: `${TOOL_NAME} — MediaDocks`,
            description:
              "Batch-convert images between JPG, PNG, WebP, AVIF, GIF, BMP, SVG and ICO in the browser, with per-file format and quality control.",
            path: PATH,
            featureList: content.featureList,
          }),
          howToJsonLd({
            name: "How to convert an image to another format",
            description:
              "Add up to ten images, choose a target format, tune quality on lossy formats, and download one file or the whole batch as a ZIP.",
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
                  Free &amp; Unlimited
                </span>
                <span className="text-border">|</span>
                <span>Batch Image Converter</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="hero-title mt-4 text-balance font-display font-bold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl">
                Convert Images to Any Format
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Batch convert between JPG, PNG, WebP, AVIF, GIF, BMP, SVG and ICO. Private by design,
                processed locally in your browser with bulk ZIP download.
              </p>
            </Reveal>
          </div>

          <Reveal delay={180}>
            <ImageConverterHero />
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
