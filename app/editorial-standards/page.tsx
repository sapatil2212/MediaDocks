import type { Metadata } from "next";
import Link from "next/link";
import { CTASection } from "@/components/sections/CTASection";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { GUIDE_ARTICLES, getGuideWordCount } from "@/lib/guides-data";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Editorial Standards: How Guides Are Written",
  description:
    "How MediaDocks guides are attributed, how their claims should be read, what we do not claim, and how to report a mistake.",
  path: "/editorial-standards",
});

const PRINCIPLES = [
  {
    id: "authorship",
    heading: "Authorship",
    paragraphs: [
      "Guides are published under the byline “MediaDocks Engineering Team”. No individual author is named on this site, and no biography, qualification or photograph is claimed for anyone.",
      "The byline identifies the publisher of the material. It is not a profile of a person, so judge each guide by what it says and by whether its claims hold up.",
    ],
  },
  {
    id: "claims",
    heading: "How claims should be read",
    paragraphs: [
      "Statements about what a MediaDocks tool does are written to match how the tool behaves, and the tool pages list their limits. If a tool and a guide ever disagree, the tool page is the source to trust, and we would like to hear about it.",
      "General technical figures in the guides, such as compression ratios, bitrates, browser support and standards references, are rules of thumb drawn from public specifications and common practice. They are not measurements made by this site. Where a figure is a range or an approximation, the text says so.",
    ],
  },
  {
    id: "what-we-wont-say",
    heading: "What we do not claim",
    paragraphs: [
      "We do not describe a capability the software does not have. Transcripts are first drafts: accuracy is better on clean single-speaker audio and worse with crosstalk, music and heavy echo, and no transcript here should be treated as a certified record.",
      "Guides do not promise results for a particular file. Quality depends on the source material, the settings you choose and the player you use.",
    ],
  },
  {
    id: "corrections",
    heading: "Corrections and dates",
    paragraphs: [
      "Each guide shows the month it was last updated. That date comes from the guide's own data and is changed by hand when the content of the guide changes, so it can lag behind a small edit.",
      "If you find an error, tell us through the contact page with the guide name and the sentence in question. A confirmed factual error is corrected in the guide.",
    ],
  },
  {
    id: "independence",
    heading: "Advertising and independence",
    paragraphs: [
      "The guide library currently contains no sponsored articles, affiliate links or paid placements. Ads, when they are enabled, are shown by Google on long-form guide pages only, and they do not decide which topics are covered. The privacy policy explains how advertising works and how to change your choices.",
      "Where a guide links to one of our tools, it is because the tool performs the task the guide describes.",
    ],
  },
];
export default function EditorialStandardsPage() {
  const totalWords = GUIDE_ARTICLES.reduce(
    (sum, article) => sum + getGuideWordCount(article),
    0,
  );

  const latestUpdate = new Date(
    Math.max(...GUIDE_ARTICLES.map((article) => new Date(article.updatedAt).getTime())),
  ).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "MediaDocks Editorial Standards",
            description:
              "How MediaDocks guides are attributed, how their claims should be read, and how to report a mistake.",
            url: absoluteUrl("/editorial-standards"),
            publisher: { "@id": `${absoluteUrl("/")}#organization` },
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Editorial standards", path: "/editorial-standards" },
          ]),
        ]}
      />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-6">
        <div
          className="aurora pointer-events-none absolute inset-x-0 -top-20 h-72 opacity-50"
          aria-hidden="true"
        />
        <div className="section-shell relative max-w-3xl">
          <Reveal>
            <p className="eyebrow">Editorial</p>
            <h1 className="hero-title mt-4">Editorial standards</h1>
            <p className="mt-5 text-lg text-muted-foreground">
              How guides are attributed, how their claims should be read, what we do not claim, and
              how to report a mistake.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Snapshot ───────────────────────────────────────────────────────── */}
      <section className="border-t border-border py-12">
        <div className="section-shell">
          <Reveal>
            <dl className="grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Published guides
                </dt>
                <dd className="font-display mt-2 text-2xl font-semibold">
                  {GUIDE_ARTICLES.length}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Words of reference material
                </dt>
                <dd className="font-display mt-2 text-2xl font-semibold">
                  {totalWords.toLocaleString("en-US")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Most recent guide update
                </dt>
                <dd className="font-display mt-2 text-2xl font-semibold">{latestUpdate}</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ── Principles ─────────────────────────────────────────────────────── */}
      <section className="border-t border-border py-16 lg:py-20">
        <div className="section-shell">
          <div className="space-y-14">
            {PRINCIPLES.map((principle, index) => (
              <Reveal key={principle.id} delay={index * 50}>
                <article id={principle.id} className="scroll-mt-24 grid gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-balance sm:text-2xl">
                      {principle.heading}
                    </h2>
                  </div>
                  <div className="space-y-4 lg:col-span-8">
                    {principle.paragraphs.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 48)}
                        className="text-sm leading-relaxed text-muted-foreground"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Related ────────────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-surface-strong/30 py-16">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Related</p>
            <h2 className="section-title mt-3">Policies and scope</h2>
          </Reveal>
          <Reveal delay={80}>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: "/about", title: "About", body: "What the project is and why it exists." },
                {
                  href: "/copyright",
                  title: "Copyright & DMCA",
                  body: "Our position on rights and how to report an issue.",
                },
                {
                  href: "/privacy",
                  title: "Privacy",
                  body: "What is processed, what is kept, and for how long.",
                },
                {
                  href: "/terms",
                  title: "Terms",
                  body: "Acceptable use and where responsibility sits.",
                },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="panel group block h-full p-5 transition-all hover:border-primary/40 hover:shadow-soft"
                  >
                    <h3 className="text-sm font-semibold transition-colors group-hover:text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground">{item.body}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <CTASection />
    </>
  );
}
