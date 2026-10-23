import { QrCodeHero } from "@/components/converters/QrCodeHero";
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

const TOOL_NAME = "QR Code Generator";
const PATH = "/qr-code-generator";

export const metadata = buildMetadata({
  title: "Free QR Code Generator — Vector SVG, EPS, PDF & High-Res PNG | MediaDocks",
  description:
    "Create static QR codes that never expire for URLs, Wi-Fi, vCards and text. Add a logo, pick colours, and export vector SVG, EPS and PDF or high-resolution PNG. Private and free.",
  path: PATH,
  keywords: [
    "qr code generator",
    "free qr code generator",
    "qr code with logo",
    "vector qr code svg",
    "wifi qr code",
    "vcard qr code",
    "static qr code",
    "qr code for print",
  ],
});

export default function QrCodeGeneratorPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: `${TOOL_NAME} — MediaDocks`,
            description:
              "Generate static QR codes for URLs, Wi-Fi, vCards and text, with logo support and vector SVG, EPS, PDF or high-res PNG export.",
            path: PATH,
            featureList: content.featureList,
          }),
          howToJsonLd({
            name: "How to generate a QR code",
            description:
              "Choose a payload type, style and optionally brand the code, pick vector or raster output, then download it.",
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
                  Design Tools
                </span>
                <span className="text-border">|</span>
                <span>QR Code Generator</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="hero-title mt-4 text-balance font-display font-bold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl">
                Create Custom QR Codes with Logo
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Generate permanent, high-resolution QR codes for websites, Wi-Fi networks, text and
                contacts. Customize colours, embed your brand logo, and export for print and web.
              </p>
            </Reveal>
          </div>

          <Reveal delay={180}>
            <QrCodeHero />
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
