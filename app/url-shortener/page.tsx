import { UrlShortenerHero } from "@/components/converters/UrlShortenerHero";
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

const TOOL_NAME = "URL Shortener";
const PATH = "/url-shortener";

export const metadata = buildMetadata({
  title: "Free URL Shortener — Custom Aliases, UTM Tags & QR Codes | MediaDocks",
  description:
    "Turn long URLs into clean, permanent short links with custom aliases, a UTM builder and a QR code each. Direct redirects, a safety preview and anonymous aggregate click counts.",
  path: PATH,
  keywords: [
    "url shortener",
    "free url shortener",
    "short link generator",
    "custom alias url shortener",
    "link shortener with qr code",
    "utm link builder",
    "shorten url online",
    "permanent short links",
  ],
});

export default function UrlShortenerPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: `${TOOL_NAME} — MediaDocks`,
            description:
              "Shorten long URLs into clean, permanent links with custom aliases, a UTM builder, a QR code per link and anonymous aggregate click counts.",
            path: PATH,
            featureList: content.featureList,
          }),
          howToJsonLd({
            name: "How to shorten a URL",
            description:
              "Paste a destination URL, optionally set a custom alias and UTM tags, create the short link, then share it or download its QR code.",
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
                  Link Tools
                </span>
                <span className="text-border">|</span>
                <span>Free URL Shortener</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="hero-title mt-4 text-balance font-display font-bold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl">
                Shorten, Customize &amp; Track Links
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Transform long, messy URLs into clean, memorable short links. Customize aliases,
                generate vector QR codes, add UTM parameters and track clicks anonymously.
              </p>
            </Reveal>
          </div>

          <Reveal delay={180}>
            <UrlShortenerHero />
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
