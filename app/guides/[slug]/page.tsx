import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  Info,
  Lightbulb,
  Share2,
  Tag,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { FaqAccordion } from "@/components/FaqAccordion";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/sections/CTASection";
import {
  getAllGuideSlugs,
  getGuideArticle,
  GUIDE_ARTICLES,
  type GuideArticle,
} from "@/lib/guides-data";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
} from "@/lib/seo";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getGuideArticle(slug);

  if (!article) {
    return {
      title: "Guide Not Found — MediaDocks",
    };
  }

  return buildMetadata({
    title: article.metaTitle,
    description: article.metaDescription,
    path: `/guides/${article.slug}`,
    keywords: article.keywords,
  });
}

export default async function GuideArticlePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const article = getGuideArticle(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = GUIDE_ARTICLES.filter((g) => g.slug !== article.slug).slice(
    0,
    3,
  );

  return (
    <>
      <JsonLd
        data={[
          articleJsonLd({
            title: article.title,
            description: article.metaDescription,
            path: `/guides/${article.slug}`,
            datePublished: article.publishedAt,
            dateModified: article.updatedAt,
            author: article.author,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: article.title, path: `/guides/${article.slug}` },
          ]),
          ...(article.faqs && article.faqs.length > 0
            ? [faqJsonLd(article.faqs)]
            : []),
        ]}
      />

      {/* Header / Hero */}
      <article className="relative overflow-hidden pt-10 pb-16 sm:pt-14 lg:pt-16">
        <InteractiveBackground />
        <div
          className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[30rem] opacity-35"
          aria-hidden="true"
        />

        <div className="section-shell relative z-10 max-w-4xl">
          {/* Breadcrumb rail */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-foreground"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href="/guides"
                  className="transition-colors hover:text-foreground"
                >
                  Guides
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="max-w-[200px] truncate text-foreground sm:max-w-none">
                {article.title}
              </li>
            </ol>
          </nav>

          {/* Category & Metadata Pill */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-semibold text-primary">
              <Tag className="h-3 w-3" />
              {article.category}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {article.readTime}
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Updated{" "}
              {new Date(article.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          {/* H1 Heading */}
          <h1 className="mt-4 text-balance font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>

          {/* Author attribution */}
          <p className="mt-4 text-xs text-muted-foreground">
            Published by{" "}
            <span className="font-semibold text-foreground">
              {article.author}
            </span>
          </p>

          {/* Summary Callout */}
          <div className="mt-6 rounded-2xl border border-border/80 bg-surface/70 p-5 shadow-soft backdrop-blur-md">
            <p className="text-sm font-medium leading-relaxed text-foreground/90 sm:text-base">
              {article.summary}
            </p>
          </div>

          {/* Table of Contents */}
          <div className="mt-10 rounded-2xl border border-border bg-surface-strong/40 p-6">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Table of Contents
            </h2>
            <ol className="mt-4 space-y-2 text-sm">
              {article.tableOfContents.map((item, index) => (
                <li key={item.id} className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-primary font-bold">
                    {index + 1}.
                  </span>
                  <a
                    href={`#${item.id}`}
                    className="text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>

          {/* Article Main Body */}
          <div className="mt-12 space-y-12">
            {article.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 space-y-4"
              >
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {section.heading}
                </h2>

                {section.subheading ? (
                  <h3 className="text-base font-semibold text-foreground/80">
                    {section.subheading}
                  </h3>
                ) : null}

                {section.paragraphs.map((p, pIndex) => (
                  <p
                    key={pIndex}
                    className="text-sm leading-relaxed text-muted-foreground sm:text-base"
                  >
                    {p}
                  </p>
                ))}

                {/* Callout Box if present */}
                {section.callout ? (
                  <div className="my-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-xs sm:text-sm">
                    <div className="flex items-start gap-3">
                      {section.callout.type === "warning" ? (
                        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                      ) : section.callout.type === "tip" ? (
                        <Lightbulb className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                      ) : (
                        <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                      )}
                      <div>
                        <strong className="font-bold text-foreground">
                          {section.callout.title}:
                        </strong>{" "}
                        <span className="text-foreground/90">
                          {section.callout.body}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Comparison Table if present */}
                {section.table ? (
                  <div className="my-6 overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="border-b border-border bg-surface-strong/70 text-foreground font-semibold">
                        <tr>
                          {section.table.headers.map((h) => (
                            <th key={h} className="p-3">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-surface/50 text-muted-foreground">
                        {section.table.rows.map((row, rIndex) => (
                          <tr
                            key={rIndex}
                            className="transition-colors hover:bg-surface-strong/40"
                          >
                            {row.map((cell, cIndex) => (
                              <td
                                key={cIndex}
                                className={`p-3 ${
                                  cIndex === 0
                                    ? "font-medium text-foreground"
                                    : ""
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {/* Bullet Points if present */}
                {section.bulletPoints && section.bulletPoints.length > 0 ? (
                  <ul className="my-4 space-y-2 pl-2">
                    {section.bulletPoints.map((bp, bpIndex) => (
                      <li
                        key={bpIndex}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          {/* Related Tool Hero Banner */}
          <div className="mt-16 rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-surface to-surface p-6 shadow-lift sm:p-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                  <Wrench className="h-3.5 w-3.5" />
                  <span>Interactive Utility</span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-foreground sm:text-xl">
                  {article.relatedTool.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm max-w-xl">
                  {article.relatedTool.description}
                </p>
              </div>
              <Link
                href={article.relatedTool.path}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90"
              >
                <span>{article.relatedTool.cta}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* FAQ Accordion Section */}
          {article.faqs && article.faqs.length > 0 ? (
            <div className="mt-16 border-t border-border pt-12">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <HelpCircle className="h-4 w-4" />
                <span>Frequently Asked Questions</span>
              </div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Questions about this topic
              </h2>
              <div className="mt-6">
                <FaqAccordion items={article.faqs} />
              </div>
            </div>
          ) : null}

          {/* Next / Related Guides */}
          <div className="mt-16 border-t border-border pt-12">
            <h2 className="text-lg font-bold text-foreground sm:text-xl">
              More guides in this library
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/guides/${rel.slug}`}
                  className="group rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/40 hover:shadow-soft"
                >
                  <span className="text-[0.7rem] font-mono uppercase text-primary font-semibold">
                    {rel.category}
                  </span>
                  <h3 className="mt-2 text-xs font-bold text-foreground line-clamp-2 transition-colors group-hover:text-primary">
                    {rel.title}
                  </h3>
                  <p className="mt-2 text-[0.75rem] text-muted-foreground line-clamp-2">
                    {rel.summary}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Back to Guides link */}
          <div className="mt-12 text-center">
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to all guides & resources</span>
            </Link>
          </div>
        </div>
      </article>

      <CTASection />
    </>
  );
}
