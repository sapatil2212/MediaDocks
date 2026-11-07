import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/FaqAccordion";
import { CTASection } from "@/components/sections/CTASection";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { ALL_FAQ_ITEMS, FAQ_CATEGORIES } from "@/lib/faq-data";
import { breadcrumbJsonLd, buildMetadata, faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "FAQ: Tools, Accuracy, Privacy and Limits",
  description:
    "Answers about the MediaDocks speech and image tools: transcription accuracy and limits, subtitle formats, what runs in your browser, and what data is kept.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(ALL_FAQ_ITEMS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ]}
      />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-4">
        <div
          className="aurora pointer-events-none absolute inset-x-0 -top-20 h-72 opacity-50"
          aria-hidden="true"
        />
        <div className="section-shell relative max-w-3xl">
          <Reveal>
            <p className="eyebrow">Reference</p>
            <h1 className="hero-title mt-4">Frequently asked questions</h1>
            <p className="mt-5 text-lg text-muted-foreground">
              {ALL_FAQ_ITEMS.length} answers about how the speech tools behave, which tools run in your browser,
              what data is kept, and where your responsibility as a user begins.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Looking for something more in-depth? The{" "}
              <Link
                href="/guides"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                guides section
              </Link>{" "}
              covers codecs, bitrates and subtitle formats at article length.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Category jump nav ──────────────────────────────────────────────── */}
      <section className="pt-8 pb-4">
        <div className="section-shell">
          <Reveal>
            <nav aria-label="Jump to a FAQ category">
              <ul className="flex flex-wrap gap-2">
                {FAQ_CATEGORIES.map((category) => (
                  <li key={category.id}>
                    <a
                      href={`#${category.id}`}
                      className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground sm:text-sm"
                    >
                      <span>{category.label}</span>
                      <span className="font-mono text-[0.7rem] text-primary">
                        {category.items.length}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </Reveal>
        </div>
      </section>

      {/* ── One section per category ───────────────────────────────────────── */}
      {FAQ_CATEGORIES.map((category, index) => (
        <section
          key={category.id}
          id={category.id}
          className={`scroll-mt-24 border-t border-border py-16 lg:py-20 ${
            index % 2 === 1 ? "bg-surface-strong/30" : ""
          }`}
        >
          <div className="section-shell grid gap-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
            <Reveal>
              <p className="eyebrow">
                {String(index + 1).padStart(2, "0")} / {String(FAQ_CATEGORIES.length).padStart(2, "0")}
              </p>
              <h2 className="section-title mt-3">{category.label}</h2>
              <p className="mt-4 text-sm text-muted-foreground">{category.blurb}</p>
            </Reveal>

            <Reveal delay={100}>
              <FaqAccordion items={category.items} />
            </Reveal>
          </div>
        </section>
      ))}

      {/* ── Still stuck ────────────────────────────────────────────────────── */}
      <section className="border-t border-border py-16">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Not covered here</p>
            <h2 className="section-title mt-3">Still stuck?</h2>
            <p className="mt-4 text-muted-foreground">
              If your question is not above, the guides explain the underlying formats and the contact page is the way to reach us.
            </p>
          </Reveal>

          <Reveal delay={90}>
            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              <li>
                <Link
                  href="/how-it-works"
                  className="panel group block h-full p-5 transition-all hover:border-primary/40 hover:shadow-soft"
                >
                  <h3 className="text-sm font-semibold transition-colors group-hover:text-primary">
                    How it works
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    How the transcription pipeline and the in-browser tools work.
                  </p>
                </Link>
              </li>
              <li>
                <Link
                  href="/guides"
                  className="panel group block h-full p-5 transition-all hover:border-primary/40 hover:shadow-soft"
                >
                  <h3 className="text-sm font-semibold transition-colors group-hover:text-primary">
                    Format guides
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Codecs, resolutions, bitrates and subtitles explained properly.
                  </p>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="panel group block h-full p-5 transition-all hover:border-primary/40 hover:shadow-soft"
                >
                  <h3 className="text-sm font-semibold transition-colors group-hover:text-primary">
                    Contact us
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Bug reports, feedback and copyright enquiries.
                  </p>
                </Link>
              </li>
            </ul>
          </Reveal>
        </div>
      </section>

      <CTASection />
    </>
  );
}
