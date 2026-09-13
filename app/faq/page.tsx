import type { Metadata } from "next";
import { FAQSection, FAQ_ITEMS } from "@/components/sections/FAQSection";
import { Troubleshooting } from "@/components/sections/Troubleshooting";
import { CTASection } from "@/components/sections/CTASection";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { breadcrumbJsonLd, buildMetadata, faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "FAQ — Formats, Quality, Privacy & Limits",
  description:
    "Which resolutions you can pick, MP3 and M4A audio, private content, storage and the size limit — plus what MediaDocks deliberately will not do.",
  path: "/faq",
  keywords: [
    "media downloader faq",
    "is video downloader safe",
    "download without account",
    "which video resolution should i pick",
    "which platforms can i download from",
  ],
});

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(FAQ_ITEMS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ]}
      />
      <section className="relative overflow-hidden pt-16 pb-4">
        <div
          className="aurora pointer-events-none absolute inset-x-0 -top-20 h-72 opacity-50"
          aria-hidden="true"
        />
        <div className="section-shell relative max-w-3xl">
          <Reveal>
            <p className="eyebrow">FAQ</p>
            <h1 className="hero-title mt-4">Frequently asked</h1>
            <p className="mt-5 text-lg text-muted-foreground">
              What MediaDocks does, what it deliberately does not do, and how it treats your links.
            </p>
          </Reveal>
        </div>
      </section>
      <FAQSection heading="Common questions" />
      <Troubleshooting />
      <CTASection />
    </>
  );
}
