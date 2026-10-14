import type { Metadata } from "next";
import Link from "next/link";
import { CTASection } from "@/components/sections/CTASection";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { GUIDE_ARTICLES, getGuideWordCount } from "@/lib/guides-data";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Editorial Standards — How We Write and Review Content",
  description:
    "Who writes the MediaDocks guides, how technical claims are verified against real pipelines, our correction policy, our position on AI-generated text, and how we handle the limits of our own tools.",
  path: "/editorial-standards",
  keywords: [
    "editorial standards",
    "editorial policy",
    "content review process",
    "fact checking policy",
    "corrections policy",
    "mediadocks editorial",
  ],
});

const PRINCIPLES = [
  {
    id: "who-writes",
    heading: "Who writes this material",
    paragraphs: [
      "The guides and reference pages on this site are written by the engineers who build and maintain MediaDocks. We publish under a collective byline — MediaDocks Engineering Team — rather than attributing articles to a named individual.",
      "That is a deliberate choice, and worth being plain about. It is common practice to invent a plausible-sounding author with a stock photograph and an impressive biography in order to satisfy a search-quality checklist. We think a fabricated expert is a worse signal than an honest collective one, so we do not do it. What you can verify instead is the substance: the technical claims below are checkable against the tools themselves, and the limits we document are the limits you will actually hit.",
    ],
  },
  {
    id: "how-verified",
    heading: "How technical claims are verified",
    paragraphs: [
      "Anything we state about what MediaDocks does is checked against the running pipeline rather than written from memory. When a page says the resolution ladder is read from the source, that it muxes DASH streams with FFmpeg, or that a resolved link expires after thirty minutes, those statements correspond to actual behaviour and actual configuration values, and they are updated when the implementation changes.",
      "Claims about formats and codecs that are not specific to our service — compression ratios, browser support, container capabilities — come from the specifications and from the maintainers' own documentation. Where a figure is a range or an approximation, we write it as one. A number presented without qualification is a number we are willing to defend.",
      "The scope sections on each platform page are tested against live public links instead of assumed from a platform's API documentation, which is why those pages are specific about which link shapes fail. A downloader that claims universal coverage and then fails silently wastes more of your time than one that tells you the truth up front.",
    ],
  },
  {
    id: "what-we-wont-say",
    heading: "What we will not claim",
    paragraphs: [
      "We do not advertise capabilities the software does not have. MediaDocks cannot reach private accounts, age-gated videos, paywalled media or DRM-protected streams, and no page on this site suggests otherwise — including the pages that would get more traffic if they did.",
      "We do not present a thumbnail as though it were a video, pad a resolution list with upscaled rungs that add file size and no detail, or describe an MP3 as higher quality than the source track it was made from. Each of those is a small deception that makes a product demo look better and makes the actual result worse.",
      "We also try not to overstate the AI features. Transcription accuracy is high on clean audio and visibly worse on crosstalk, music and heavy reverb, and we say so on the pages that sell it. A transcript from this or any other service is a strong first draft, not a certified record.",
    ],
  },
  {
    id: "ai-disclosure",
    heading: "Our position on AI-generated text",
    paragraphs: [
      "AI tooling is used as a drafting and editing aid in producing this material, in the same way a spell-checker or a reference lookup is. It is not used to mass-produce articles on topics nobody on the team understands, and nothing is published without an engineer reading it against the behaviour it describes and signing off on the technical content.",
      "The distinction we care about is not whether a machine touched the draft but whether a person is accountable for the claims. On every page here, one is.",
    ],
  },
  {
    id: "corrections",
    heading: "Corrections and updates",
    paragraphs: [
      "Every guide carries a published date and a last-updated date, and the updated date moves when the substance changes rather than on a schedule designed to look fresh. Read-time estimates are computed from the article body, so they cannot drift away from the text as it is edited.",
      "If you find an error, tell us through the contact page and we will fix it. Factual corrections to a technical claim are made in place, and where a correction changes the practical advice we leave a note rather than quietly rewriting history. We would rather be corrected than consistent.",
    ],
  },
  {
    id: "independence",
    heading: "Commercial independence",
    paragraphs: [
      "The guides exist to explain the formats and trade-offs people run into while using the tools, not to funnel readers toward a paid upgrade — there is no paid tier to upgrade to. Where an article links to one of our own tools, it is because the tool does the thing the article just described.",
      "We take no payment for coverage, and there are no sponsored articles, affiliate placements or paid reviews anywhere on this site. If that ever changes, it will be disclosed on the page in question and here.",
    ],
  },
];

export default function EditorialStandardsPage() {
  const totalWords = GUIDE_ARTICLES.reduce(
    (sum, article) => sum + getGuideWordCount(article),
    0,
  );

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "MediaDocks Editorial Standards",
            description:
              "How MediaDocks guides are written, how technical claims are verified, our correction policy, and our disclosure on AI-assisted drafting.",
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
              Who writes the material on this site, how its technical claims are checked, what we
              refuse to claim, and what happens when we get something wrong.
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
                  Sponsored content
                </dt>
                <dd className="font-display mt-2 text-2xl font-semibold">None</dd>
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
