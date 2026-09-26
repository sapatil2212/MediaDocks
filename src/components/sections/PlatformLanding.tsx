import Link from "next/link";
import { ArrowUpRight, Check, Info, Minus } from "lucide-react";
import { Downloader } from "@/components/downloader/Downloader";
import { FaqAccordion } from "@/components/FaqAccordion";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Reveal } from "@/components/Reveal";
import { Troubleshooting } from "@/components/sections/Troubleshooting";
import { CTASection } from "@/components/sections/CTASection";
import { getPlatform } from "@/lib/platforms";
import { getPlatformPage, type PlatformPage } from "@/lib/platform-pages";
import { cn } from "@/lib/utils";

/**
 * Shared template for the five per-platform pages.
 *
 * Left-aligned and asymmetric, matching the home page. The old version centred
 * the hero and then repeated the same lift-on-hover card grid three times (you
 * get / limits, steps, related), which is what made every page feel identical.
 */
export function PlatformLanding({ page }: { page: PlatformPage }) {
  const meta = getPlatform(page.platform);
  // "downloads" platforms work for any public link; "public-only" ones depend on
  // the post not being login-walled, so their notice is toned down accordingly.
  const canDownload = page.capability === "downloads";

  return (
    <>
      {/* ── Hero: breadcrumb, H1 and the same universal downloader ───────── */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 lg:pt-20">
        {/* Dynamic Ambient Lighting Canvas */}
        <InteractiveBackground />

        {/* Subtle Micro-Grid & Vignette */}
        <div
          className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[34rem] opacity-40"
          aria-hidden="true"
        />

        <div className="section-shell relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            {/* Platform Eyebrow Pill */}
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-soft backdrop-blur-md transition-colors hover:border-primary/40 hover:text-foreground">
                <PlatformIcon
                  platform={page.platform}
                  className={cn("h-4 w-4", meta.colorClass)}
                />
                <span className="font-mono text-[0.7rem] uppercase tracking-wider font-semibold text-foreground">
                  {page.name}
                </span>
                <span className="text-border" aria-hidden="true">|</span>
                <span className="text-muted-foreground">{meta.outputs}</span>
              </div>
            </Reveal>

            {/* Centered Title */}
            <Reveal delay={60}>
              <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
                {page.h1}
              </h1>
            </Reveal>

            {/* Tagline */}
            <Reveal delay={120}>
              <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-foreground/90 sm:text-lg">
                {page.tagline}
              </p>
            </Reveal>

            {/* Centered Command Downloader Box */}
            <Reveal delay={180} className="mx-auto mt-8 max-w-2xl text-left">
              <div className="relative rounded-2xl border border-border/80 bg-surface/80 p-2 shadow-lift backdrop-blur-2xl transition-all duration-300 hover:border-border hover:shadow-glow sm:p-3">
                <Downloader placeholder={page.inputPlaceholder} />
              </div>
            </Reveal>

            {/* Intro Description */}
            <Reveal delay={210}>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
                {page.intro}
              </p>
            </Reveal>

            {/* Centered Capability Notice Card */}
            <Reveal delay={240} className="mx-auto mt-5 max-w-2xl text-left">
              <div
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-3.5 text-xs sm:text-sm shadow-soft backdrop-blur-md",
                  canDownload ? "border-primary/30 bg-primary/5 text-foreground" : "border-border/80 bg-surface/60 text-foreground",
                )}
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="min-w-0">
                  <strong className="font-semibold text-foreground">{page.capabilityTitle}.</strong>{" "}
                  <span className="text-muted-foreground">{page.capabilityBody}</span>
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── You get / it will not ─ two columns split by a hairline ──────── */}
      <section className="border-t border-border py-20">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Scope</p>
            <h2 className="section-title mt-3">What a {page.navLabel} link gives you</h2>
            <p className="mt-4 text-muted-foreground">
              Checked against live public links, not guessed.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-14">
            <Reveal>
              <h3 className="text-sm font-semibold">You get</h3>
              <ul className="mt-4">
                {page.youGet.map((item) => (
                  <li key={item} className="rule-row flex gap-3 py-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={90}>
              <h3 className="text-sm font-semibold">What it will not do</h3>
              <ul className="mt-4">
                {page.limits.map((item) => (
                  <li key={item} className="rule-row flex gap-3 py-3 text-sm">
                    <Minus
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Steps as a numbered rail, matching the home page ─────────────── */}
      <section id="steps" className="scroll-mt-24 border-t border-border py-20">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Step by step</p>
            <h2 className="section-title mt-3">
              How to use the {page.navLabel} downloader
            </h2>
          </Reveal>

          <ol className="mt-10 max-w-3xl">
            {page.steps.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 90}>
                <div className="relative flex gap-5 pb-8 sm:gap-7">
                  {index < page.steps.length - 1 ? (
                    <span
                      className="absolute top-11 bottom-0 left-[1.1875rem] w-px bg-border sm:left-[1.4375rem]"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="font-display relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-surface text-sm font-semibold shadow-soft sm:h-12 sm:w-12 sm:text-base">
                    {index + 1}
                  </span>
                  <div className="min-w-0 pt-1.5">
                    <h3 className="text-lg font-semibold sm:text-xl">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Intent coverage ──────────────────────────────────────────────────
          Every distinct thing people search for this platform, answered on this
          one page. Real H3 headings so the structure is legible to a reader and
          to a crawler, instead of a separate thin page per phrase. */}
      <section id="what-you-can-download" className="scroll-mt-24 border-t border-border py-20">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">In detail</p>
            <h2 className="section-title mt-3">
              What you can download from {page.name}
            </h2>
            <p className="mt-4 text-muted-foreground">
              The same field handles every kind of {page.navLabel} link. Here is what each one
              returns.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-x-12 gap-y-9 md:grid-cols-2">
            {page.searchIntents.map((intent, index) => (
              <Reveal key={intent.heading} delay={(index % 2) * 70}>
                <article>
                  <h3 className="text-lg font-semibold">{intent.heading}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {intent.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Supported link shapes ────────────────────────────────────────── */}
      <section className="border-t border-border bg-surface-strong/30 py-20">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Link formats</p>
            <h2 className="section-title mt-3">Supported {page.navLabel} links</h2>
            <p className="mt-4 text-muted-foreground">
              Any of these shapes works, with or without tracking parameters.
            </p>
          </Reveal>

          <Reveal delay={90}>
            <ul className="mt-8 grid gap-2 sm:grid-cols-2">
              {page.supportedLinks.map((link) => (
                <li
                  key={link}
                  className="figure-mono overflow-x-auto rounded-xl border border-border bg-surface px-4 py-3 text-xs whitespace-nowrap text-muted-foreground"
                >
                  {link}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-24 border-t border-border py-20">
        <div className="section-shell grid gap-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <Reveal>
            <p className="eyebrow">FAQ</p>
            <h2 className="section-title mt-3">{page.navLabel} questions</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Straight answers, including where the limits are.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <FaqAccordion items={page.faqs} />
          </Reveal>
        </div>
      </section>

      <Troubleshooting />

      {/* ── Related downloaders: internal linking, as rows not cards ─────── */}
      <section className="border-t border-border bg-surface-strong/30 py-20">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Elsewhere</p>
            <h2 className="section-title mt-3">Other downloaders</h2>
          </Reveal>

          <ul className="mt-8 border-t border-border">
            {page.related.map((platform, index) => {
              const related = getPlatformPage(platform);
              const relatedMeta = getPlatform(platform);
              return (
                <Reveal as="li" key={platform} delay={index * 55}>
                  <Link
                    href={related.slug}
                    className="focus-ring group flex items-center gap-4 border-b border-border py-5 transition-colors hover:bg-surface/70 sm:gap-6"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-surface transition-transform duration-300 group-hover:scale-105">
                      <PlatformIcon
                        platform={platform}
                        className={cn("h-5 w-5", relatedMeta.colorClass)}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-semibold">
                        {related.navLabel} downloader
                      </span>
                      <span className="figure-mono mt-0.5 block text-xs text-muted-foreground">
                        {relatedMeta.outputs}
                      </span>
                    </span>
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── Related Educational Guides ───────────────────────────────────── */}
      <section className="border-t border-border py-16">
        <div className="section-shell">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="eyebrow">Knowledge Base</p>
              <h2 className="section-title mt-2">Related format & media guides</h2>
            </div>
            <Link
              href="/guides"
              className="text-xs font-semibold text-primary hover:underline underline-offset-4"
            >
              Browse all 10 guides →
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Link
              href="/guides/video-resolution-guide-720p-1080p-4k"
              className="panel group p-4 transition-all hover:border-primary/40 hover:shadow-soft"
            >
              <span className="font-mono text-[0.7rem] uppercase text-primary font-semibold">Resolution Guide</span>
              <h3 className="mt-2 text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                720p, 1080p, and 4K Explained
              </h3>
              <p className="mt-1 text-[0.75rem] text-muted-foreground line-clamp-2">
                Learn how pixel dimensions and bitrates impact stream quality and storage size.
              </p>
            </Link>

            <Link
              href="/guides/mp4-vs-webm-video-format-comparison"
              className="panel group p-4 transition-all hover:border-primary/40 hover:shadow-soft"
            >
              <span className="font-mono text-[0.7rem] uppercase text-primary font-semibold">Container Formats</span>
              <h3 className="mt-2 text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                MP4 vs WebM Comparison
              </h3>
              <p className="mt-1 text-[0.75rem] text-muted-foreground line-clamp-2">
                Why standard MP4 offers the broadest hardware acceleration and player compatibility.
              </p>
            </Link>

            <Link
              href="/guides/audio-bitrates-explained-128-192-320-kbps"
              className="panel group p-4 transition-all hover:border-primary/40 hover:shadow-soft"
            >
              <span className="font-mono text-[0.7rem] uppercase text-primary font-semibold">Audio Quality</span>
              <h3 className="mt-2 text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                Audio Bitrates: 128 vs 320 kbps
              </h3>
              <p className="mt-1 text-[0.75rem] text-muted-foreground line-clamp-2">
                Understanding psychoacoustic masking, MP3 vs AAC, and why upscaling doesn&apos;t add fidelity.
              </p>
            </Link>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
