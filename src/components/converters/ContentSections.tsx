import Link from "next/link";
import { ArrowUpRight, BookOpen, Check, ShieldCheck, Wrench } from "lucide-react";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { Reveal } from "@/components/Reveal";

export interface FormatRow {
  label: string;
  value: string;
}

export interface RelatedGuide {
  slug: string;
  label: string;
}

export interface RelatedTool {
  href: string;
  label: string;
}

/**
 * Long-form, per-page editorial sections for the converter pages. Every string
 * arrives through props — this component carries no literal body copy of its
 * own, so no two pages can share a paragraph through it. The FAQ renders via
 * the shared <FaqAccordion>, which keeps every answer in the DOM for crawlers.
 */
export function ContentSections({
  toolName,
  intro,
  howToTitle,
  howTo,
  formatsTitle,
  formats,
  useCasesTitle,
  useCases,
  privacyTitle,
  privacyNote,
  faqs,
  relatedGuides,
  relatedTools,
}: {
  toolName: string;
  intro: string[];
  howToTitle: string;
  howTo: Array<{ title: string; body: string }>;
  formatsTitle: string;
  formats: FormatRow[];
  useCasesTitle: string;
  useCases: string[];
  privacyTitle: string;
  privacyNote: string;
  faqs: FaqItem[];
  relatedGuides: RelatedGuide[];
  relatedTools: RelatedTool[];
}) {
  return (
    <div className="relative z-10">
      {/* What it does — deeper prose */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="section-shell">
          <Reveal className="max-w-3xl">
            <p className="eyebrow">What it does</p>
            <h2 className="section-title mt-3">About the {toolName}</h2>
            <div className="mt-5 space-y-4">
              {intro.map((paragraph, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed sm:text-base">
                  {paragraph}
                </p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* How to use — detailed steps */}
      <section className="border-t border-border bg-surface-strong/30 py-16 sm:py-20">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Step by step</p>
            <h2 className="section-title mt-3">{howToTitle}</h2>
          </Reveal>

          <ol className="mt-10 max-w-3xl">
            {howTo.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 70}>
                <div className="relative flex gap-5 pb-8 sm:gap-7">
                  {index < howTo.length - 1 ? (
                    <span
                      className="absolute top-11 bottom-0 left-[1.1875rem] w-px bg-border sm:left-[1.4375rem]"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="font-display relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-surface text-sm font-semibold shadow-soft sm:h-12 sm:w-12 sm:text-base">
                    {index + 1}
                  </span>
                  <div className="min-w-0 pt-1.5">
                    <h3 className="text-base font-semibold sm:text-lg">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Supported formats & limits */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Formats &amp; limits</p>
            <h2 className="section-title mt-3">{formatsTitle}</h2>
          </Reveal>

          <Reveal delay={80} className="mt-8">
            <div className="panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                  <caption className="sr-only">
                    Supported formats, options and limits for the {toolName}
                  </caption>
                  <tbody>
                    {formats.map((row) => (
                      <tr key={row.label} className="rule-row align-top">
                        <th
                          scope="row"
                          className="w-1/3 px-5 py-4 font-semibold whitespace-nowrap text-foreground"
                        >
                          {row.label}
                        </th>
                        <td className="px-5 py-4 text-xs text-muted-foreground sm:text-sm">
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Common use cases */}
      <section className="border-t border-border bg-surface-strong/30 py-16 sm:py-20">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">In practice</p>
            <h2 className="section-title mt-3">{useCasesTitle}</h2>
          </Reveal>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((useCase, index) => (
              <Reveal as="li" key={index} delay={index * 55}>
                <div className="flex h-full gap-3 rounded-xl border border-border/80 bg-surface/60 p-5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{useCase}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Privacy note */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="section-shell">
          <Reveal className="max-w-3xl">
            <div className="flex items-start gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{privacyTitle}</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{privacyNote}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 border-t border-border py-16 sm:py-20">
        <div className="section-shell grid gap-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <Reveal>
            <p className="eyebrow">FAQ</p>
            <h2 className="section-title mt-3">{toolName} questions</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Formats, quality, limits and privacy, answered for this tool.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <FaqAccordion items={faqs} />
          </Reveal>
        </div>
      </section>

      {/* Related guides & tools */}
      <section className="border-t border-border bg-surface-strong/30 py-16 sm:py-20">
        <div className="section-shell grid gap-10 md:grid-cols-2">
          <Reveal>
            <p className="eyebrow flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Keep reading
            </p>
            <h2 className="section-title mt-3">Related guides</h2>
            <ul className="mt-6 space-y-3">
              {relatedGuides.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="focus-ring group flex items-center gap-3 rounded-xl py-1.5 text-sm font-semibold transition-colors hover:text-primary"
                  >
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                    {guide.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={90}>
            <p className="eyebrow flex items-center gap-2">
              <Wrench className="h-3.5 w-3.5" aria-hidden="true" /> More tools
            </p>
            <h2 className="section-title mt-3">Related tools</h2>
            <ul className="mt-6 space-y-3">
              {relatedTools.map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className="focus-ring group flex items-center gap-3 rounded-xl py-1.5 text-sm font-semibold transition-colors hover:text-primary"
                  >
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
