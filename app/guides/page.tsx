import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, FileText, Sparkles, Tag } from "lucide-react";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/sections/CTASection";
import { GUIDE_ARTICLES } from "@/lib/guides-data";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Resource Center & Media Guides — MediaDocks",
  description:
    "Explore educational guides on video container formats, codecs (H.264, VP9, AV1), audio bitrates, subtitles (SRT vs VTT), AI transcription, and compression.",
  path: "/guides",
  keywords: [
    "media guides",
    "video format guide",
    "audio bitrate guide",
    "srt vtt subtitle guide",
    "h264 vs vp9 vs av1",
    "video compression tutorial",
    "mediadocks learning center",
  ],
});

const CATEGORIES = [
  "All",
  "Video Formats",
  "Audio Processing",
  "Subtitles & Text",
  "Media Optimization",
] as const;

export default function GuidesIndexPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides & Resources", path: "/guides" },
          ]),
        ]}
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 lg:pt-20">
        <InteractiveBackground />
        <div
          className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[32rem] opacity-40"
          aria-hidden="true"
        />

        <div className="section-shell relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-soft backdrop-blur-md">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[0.7rem] uppercase tracking-wider font-semibold text-foreground">
                  Knowledge Base
                </span>
                <span className="text-border" aria-hidden="true">|</span>
                <span className="text-muted-foreground">Engineering & Media Guides</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
                Media Architecture & Guides
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Practical, in-depth documentation on digital video containers, audio fidelity, AI
                speech transcription, subtitle timecodes, and web media optimization.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="section-shell">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="eyebrow">Curated Articles</p>
              <h2 className="section-title mt-2">All guides & tutorials</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 font-semibold text-primary">
                10 Comprehensive Guides
              </span>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {GUIDE_ARTICLES.map((article, index) => (
              <Reveal key={article.slug} delay={index * 50}>
                <article className="panel group flex h-full flex-col justify-between p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lift">
                  <div>
                    {/* Category & Read Time */}
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 font-medium text-foreground/80">
                        <Tag className="h-3 w-3 text-primary" />
                        {article.category}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[0.7rem]">
                        <Clock className="h-3 w-3" />
                        {article.readTime}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mt-4 text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                      <Link href={`/guides/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>

                    {/* Summary */}
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                      {article.summary}
                    </p>
                  </div>

                  {/* Footer metadata & Read CTA */}
                  <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
                    <span className="text-[0.75rem] text-muted-foreground">
                      {new Date(article.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <Link
                      href={`/guides/${article.slug}`}
                      className="inline-flex items-center gap-1 font-semibold text-primary transition-transform group-hover:translate-x-1"
                    >
                      <span>Read guide</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tools Cross-Promotion */}
      <section className="border-t border-border bg-surface-strong/30 py-16">
        <div className="section-shell">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Put technical knowledge into practice
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                MediaDocks applies these exact engineering standards—multi-rung stream extraction,
                lossless stream copying, and AI speech recognition—in every tool.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/"
                  className="rounded-xl border border-primary/50 bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90"
                >
                  Universal Downloader
                </Link>
                <Link
                  href="/video-to-text"
                  className="rounded-xl border border-border bg-surface px-5 py-2.5 text-xs font-semibold text-foreground shadow-soft transition-all hover:border-foreground/30 hover:bg-surface-strong"
                >
                  Video to Text
                </Link>
                <Link
                  href="/add-subtitles-to-video"
                  className="rounded-xl border border-border bg-surface px-5 py-2.5 text-xs font-semibold text-foreground shadow-soft transition-all hover:border-foreground/30 hover:bg-surface-strong"
                >
                  Subtitle Studio
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
