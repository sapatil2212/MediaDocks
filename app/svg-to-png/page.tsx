import { SvgToPngHero } from "@/components/converters/SvgToPngHero";
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

const TOOL_NAME = "SVG to PNG";
const PATH = "/svg-to-png";

export const metadata = buildMetadata({
  title: "Free SVG to PNG Converter — Rasterize Vectors at High Resolution | MediaDocks",
  description:
    "Convert SVG vector graphics to crisp PNG images. Scale from 1x to 8x, keep transparency or add a solid background. Rendered privately in your browser, nothing uploaded.",
  path: PATH,
  keywords: [
    "svg to png",
    "convert svg to png",
    "svg to png converter",
    "rasterize svg",
    "svg to png high resolution",
    "svg to png transparent",
    "vector to png",
    "free svg to png",
  ],
});

export default function SvgToPngPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: `${TOOL_NAME} — MediaDocks`,
            description:
              "Rasterize SVG vector files to PNG in the browser, scaling from 1x to 8x with transparent or solid backgrounds.",
            path: PATH,
            featureList: content.featureList,
          }),
          howToJsonLd({
            name: "How to convert an SVG to PNG",
            description:
              "Load an SVG, choose a scale factor and background, then download the rasterized PNG.",
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
                  Vector Tools
                </span>
                <span className="text-border">|</span>
                <span>SVG to PNG Converter</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="hero-title mt-4 text-balance font-display font-bold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl">
                Convert SVG to High-Res PNG
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Rasterize vector illustrations, icons and logos into crisp, transparent PNG images at
                up to 8x resolution.
              </p>
            </Reveal>
          </div>

          <Reveal delay={180}>
            <SvgToPngHero />
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
