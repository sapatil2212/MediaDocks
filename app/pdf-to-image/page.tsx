import { PdfToImageHero } from "@/components/converters/PdfToImageHero";
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

const TOOL_NAME = "PDF to Image";
const PATH = "/pdf-to-image";

export const metadata = buildMetadata({
  title: "Free PDF to Image Converter — PDF to PNG, JPG, WebP | MediaDocks",
  description:
    "Rasterize PDF pages to high-resolution PNG, JPG or WebP images. Export single pages or the whole document as a ZIP, at the scale that fits screen or print. Private in-browser.",
  path: PATH,
  keywords: [
    "pdf to image",
    "pdf to png",
    "pdf to jpg",
    "convert pdf to image",
    "pdf page to image",
    "extract pdf pages as images",
    "pdf to webp",
    "free pdf to image",
  ],
});

export default function PdfToImagePage() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: `${TOOL_NAME} — MediaDocks`,
            description:
              "Rasterize PDF pages to PNG, JPG or WebP in the browser, at a chosen resolution, single page or whole document as a ZIP.",
            path: PATH,
            featureList: content.featureList,
          }),
          howToJsonLd({
            name: "How to convert a PDF to images",
            description:
              "Open a PDF, choose an image format and render scale, then download a single page or every page as a ZIP.",
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
                  Document Tools
                </span>
                <span className="text-border">|</span>
                <span>PDF to Image Converter</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="hero-title mt-4 text-balance font-display font-bold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl">
                Convert PDF Pages to Images
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Extract every page from your PDF into crisp, high-resolution PNG, JPG or WebP images.
                Download individual pages or batch download the whole document as a ZIP.
              </p>
            </Reveal>
          </div>

          <Reveal delay={180}>
            <PdfToImageHero />
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
