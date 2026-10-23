import { Base64ImageHero } from "@/components/converters/Base64ImageHero";
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

const TOOL_NAME = "Base64 Image Converter";
const PATH = "/base64-image";

export const metadata = buildMetadata({
  title: "Free Base64 Image Converter — Encode & Decode Data URIs | MediaDocks",
  description:
    "Encode images to Base64 Data URIs with ready-made HTML and CSS snippets, or decode a Base64 string back to a downloadable file. Runs locally on your CPU, nothing uploaded.",
  path: PATH,
  keywords: [
    "base64 image",
    "image to base64",
    "base64 to image",
    "base64 encode image",
    "data uri generator",
    "base64 decode image",
    "image data uri",
    "free base64 converter",
  ],
});

export default function Base64ImagePage() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: `${TOOL_NAME} — MediaDocks`,
            description:
              "Encode images to Base64 Data URIs with copy-ready HTML and CSS snippets, or decode a Base64 string to a file, all locally.",
            path: PATH,
            featureList: content.featureList,
          }),
          howToJsonLd({
            name: "How to encode or decode a Base64 image",
            description:
              "Choose encode or decode, provide an image or a Base64 string, then copy the snippet or download the reconstructed file.",
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
                  Developer Utilities
                </span>
                <span className="text-border">|</span>
                <span>Base64 Image Converter</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="hero-title mt-4 text-balance font-display font-bold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl">
                Encode &amp; Decode Base64 Images
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Convert images to embeddable Data URIs and HTML snippets, or decode Base64 strings
                back into downloadable files.
              </p>
            </Reveal>
          </div>

          <Reveal delay={180}>
            <Base64ImageHero />
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
