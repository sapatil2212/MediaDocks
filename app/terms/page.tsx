import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, FileText, Scale, CheckCircle2, AlertOctagon, HelpCircle } from "lucide-react";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/sections/CTASection";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service & Acceptable Use Policy — MediaDocks",
  description:
    "Review MediaDocks Terms of Service: user responsibilities, lawful acceptable use, intellectual property notice, service limitations, and legal disclaimers.",
  path: "/terms",
  keywords: [
    "mediadocks terms of service",
    "downloader terms and conditions",
    "acceptable use policy",
    "intellectual property terms",
    "media downloader disclaimer",
  ],
});

const SECTIONS = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: [
      "By accessing or using MediaDocks (accessible at https://mediadocks.online, operated by SAP DigiTech Solutions), you agree to be bound by these Terms of Service, our Privacy Policy, and our Copyright & DMCA Policy.",
      "If you do not agree with any portion of these terms, you are prohibited from accessing or using our services. Your continued use of the website constitutes acceptance of any subsequent revisions to these terms.",
    ],
  },
  {
    id: "service-nature",
    title: "2. Nature of Service & Ephemeral Architecture",
    content: [
      "MediaDocks provides browser-based multimedia processing utilities, including public media stream extraction, format multiplexing, audio conversion, AI speech-to-text transcription, and subtitle editing.",
      "You acknowledge and understand that MediaDocks operates as an ephemeral stream pipeline. We do not host, store, index, or archive any media files on our servers. All media data is streamed transiently and piped directly to your client application.",
    ],
  },
  {
    id: "acceptable-use",
    title: "3. Lawful & Acceptable Use",
    content: [
      "You agree to use MediaDocks exclusively for lawful purposes and in full compliance with all applicable local, national, and international laws, regulations, and third-party terms of service.",
      "You represent and warrant that:",
      "• You possess the legal right, copyright ownership, or explicit permission from the copyright owner to download, convert, transcribe, or process any media content submitted to the service.",
      "• Your use of MediaDocks is for personal, non-commercial, archival, educational, or fair-use purposes.",
      "• You will not use the service to commit, facilitate, or encourage copyright infringement or unlawful distribution of proprietary digital assets.",
    ],
  },
  {
    id: "prohibited-activities",
    title: "4. Prohibited Activities",
    content: [
      "When using MediaDocks, you are strictly prohibited from:",
      "• Submitting URLs to content protected by access control technologies, DRM (Digital Rights Management), private paywalls, or restricted friend-only permissions.",
      "• Attempting to circumvent, disable, or tamper with security-related features, rate limiters, or token expiration controls.",
      "• Utilizing automated scrapers, bots, crawlers, or high-volume scripts that disrupt server stability or degrade responsiveness for other users.",
      "• Processing media containing illegal, defamatory, harmful, hateful, or abusive material.",
      "• Reselling, leasing, white-labeling, or commercially exploiting MediaDocks APIs without express written consent from SAP DigiTech Solutions.",
    ],
  },
  {
    id: "trademarks-disclaimer",
    title: "5. Third-Party Trademarks & Disclaimer of Affiliation",
    content: [
      "MediaDocks is an independent software application and is NOT affiliated, associated, authorized, endorsed by, or in any way officially connected with YouTube™, Instagram™, X (Twitter)™, Pinterest™, Facebook™, Meta™, Google™, or any of their subsidiaries or affiliates.",
      "All platform names, logos, trademarks, and registered marks displayed on this website are the intellectual property of their respective owners. Their mention on this site is purely for technical compatibility and descriptive identification purposes under nominative fair use.",
    ],
  },
  {
    id: "service-limits",
    title: "6. Service Limitations & Rate Limits",
    content: [
      "To maintain high service availability and prevent resource exhaustion:",
      "• Single download payloads are capped at 500 MB. Streams exceeding this ceiling will not be served at high resolutions.",
      "• Automated rate limiting applies to incoming resolve and download requests.",
      "• Resolved media references and stream tokens expire automatically after 30 minutes.",
      "MediaDocks reserves the right to modify, throttle, or discontinue any feature at any time without prior notice.",
    ],
  },
  {
    id: "warranty-disclaimer",
    title: "7. Disclaimer of Warranties",
    content: [
      "MediaDocks is provided strictly on an 'AS IS' and 'AS AVAILABLE' basis, without warranties of any kind, whether express, implied, statutory, or otherwise.",
      "SAP DigiTech Solutions explicitly disclaims all implied warranties of merchantability, fitness for a particular purpose, non-infringement, and uninterrupted or error-free operation. We make no guarantee that third-party public streams will remain available or accessible.",
    ],
  },
  {
    id: "liability-limitation",
    title: "8. Limitation of Liability",
    content: [
      "To the fullest extent permitted by applicable law, SAP DigiTech Solutions, its directors, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, profits, goodwill, or device malfunction, arising from your use of or inability to use MediaDocks.",
      "You assume total legal responsibility for the manner in which you access, download, store, and utilize any media file processed through this application.",
    ],
  },
  {
    id: "governing-law",
    title: "9. Governing Law & Contact",
    content: [
      "These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.",
      "If you have questions, feedback, or legal inquiries regarding these Terms of Service, please contact:",
      "SAP DigiTech Solutions — Legal Department",
      "Email: sapdigitechsolutions@gmail.com",
      "Official Domain: https://www.sapdigitechsolutions.in",
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
                Please read these terms carefully before utilizing MediaDocks. They govern your
                permitted use of our software utilities, intellectual property, and service
                limitations.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Last Updated: March 2026 · Operator: SAP DigiTech Solutions
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
                DMCA & Copyright Notice
              </Link>
              <span>•</span>
              <Link
                href="/contact"
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                Contact Legal Department
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
