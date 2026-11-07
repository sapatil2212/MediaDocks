import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, FileText, Scale, CheckCircle2, AlertOctagon, HelpCircle } from "lucide-react";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/sections/CTASection";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service and Acceptable Use",
  description:
    "The rules for using MediaDocks: acceptable use, user responsibilities, service limits, disclaimers and how to contact us.",
  path: "/terms",
});

const BULLET = "\u2022";

const SECTIONS = [
  {
    id: "acceptance",
    title: "1. Acceptance of terms",
    content: [
      "By using MediaDocks (https://mediadocks.online) you agree to these Terms of Service, the Privacy Policy and the Copyright and DMCA Policy.",
      "If you do not agree, do not use the service. Continued use after the terms change means you accept the changed terms.",
    ],
  },
  {
    id: "service-nature",
    title: "2. What the service is",
    content: [
      "MediaDocks provides browser-based tools: AI speech-to-text transcription, subtitle creation and editing, audio summaries, audio extraction, image and PDF conversion, background removal, QR codes and a URL shortener, together with a library of guides.",
      "MediaDocks does not run a media library. Files that are processed on the server are handled in a temporary location for the request, and many tools process files in your browser. See the Privacy Policy for the details.",
    ],
  },
  {
    id: "acceptable-use",
    title: "3. Lawful and acceptable use",
    content: [
      "You agree to use MediaDocks only for lawful purposes and in line with the laws and third-party terms that apply to you.",
      "You confirm that:",
      `${BULLET} You own, or have the legal right or the permission of the rights holder, to process any file you submit.`,
      `${BULLET} You will not use the service to infringe copyright or to distribute material you have no right to distribute.`,
    ],
  },
  {
    id: "prohibited-activities",
    title: "4. Prohibited activities",
    content: [
      "You may not:",
      `${BULLET} Submit material protected by access controls, DRM or paywalls that you are not permitted to process.`,
      `${BULLET} Try to circumvent, disable or tamper with security features or rate limits.`,
      `${BULLET} Use bots, scrapers or high-volume scripts that degrade the service for others.`,
      `${BULLET} Process or share unlawful, defamatory, hateful or abusive material, or use the URL shortener to link to it.`,
      `${BULLET} Resell or white-label MediaDocks interfaces without written permission.`,
    ],
  },
  {
    id: "trademarks-disclaimer",
    title: "5. Third-party names",
    content: [
      "MediaDocks is independent and is not affiliated with, endorsed by or sponsored by YouTube, Instagram, X, Pinterest, Facebook, Meta or Google. Names and marks belong to their owners and are mentioned only to describe compatibility.",
    ],
  },
  {
    id: "service-limits",
    title: "6. Limits and changes",
    content: [
      "Tools have size, duration and rate limits, which are shown on each tool page and may change.",
      "MediaDocks may change, limit or discontinue any feature at any time.",
    ],
  },
  {
    id: "warranty-disclaimer",
    title: "7. Disclaimer of warranties",
    content: [
      "MediaDocks is provided \"as is\" and \"as available\" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, non-infringement, and uninterrupted or error-free operation.",
      "AI output, such as transcripts and summaries, can contain mistakes. Check it before you rely on it.",
    ],
  },
  {
    id: "liability-limitation",
    title: "8. Limitation of liability",
    content: [
      "To the fullest extent permitted by law, MediaDocks and its operators are not liable for indirect, incidental, special, consequential or punitive damages, including loss of data, profits or goodwill, arising from your use of or inability to use the service.",
      "You are responsible for how you use any file you process with the service.",
    ],
  },
  {
    id: "governing-law",
    title: "9. Governing law and contact",
    content: [
      "These terms are governed by the laws that apply to the service operator, without regard to conflict-of-law rules. This page does not name a governing jurisdiction; that detail is not published on this site.",
      "Questions about these terms can be sent to sapdigitechsolutions@gmail.com.",
    ],
  },
];
export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Terms of Service", path: "/terms" },
          ]),
        ]}
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 lg:pt-20">
        <InteractiveBackground />
        <div
          className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[34rem] opacity-40"
          aria-hidden="true"
        />

        <div className="section-shell relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-soft backdrop-blur-md">
                <Scale className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[0.7rem] uppercase tracking-wider font-semibold text-foreground">
                  Legal Agreement
                </span>
                <span className="text-border" aria-hidden="true">|</span>
                <span className="text-muted-foreground">Terms of Service</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
                Terms of Service & Disclaimer
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Please read these terms before using MediaDocks. They set out what you may do with the service and what we do not promise.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Last updated: 7 November 2026
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Main Terms Sections */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="section-shell max-w-4xl space-y-8">
          {SECTIONS.map((sec, idx) => (
            <Reveal key={sec.id} delay={idx * 40}>
              <div id={sec.id} className="panel scroll-mt-24 p-6 sm:p-8">
                <h2 className="text-lg font-bold text-foreground sm:text-xl">
                  {sec.title}
                </h2>
                <div className="mt-4 space-y-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  {sec.content.map((paragraph, pIdx) => (
                    <p key={pIdx}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}

          {/* Quick Legal Links */}
          <div className="rounded-2xl border border-border/80 bg-surface-strong/30 p-6 text-center text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Related Legal Documents</p>
            <div className="mt-3 flex flex-wrap justify-center gap-4">
              <Link
                href="/privacy"
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                Privacy Policy
              </Link>
              <span>•</span>
              <Link
                href="/copyright"
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                Copyright policy
              </Link>
              <span>•</span>
              <Link
                href="/contact"
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
