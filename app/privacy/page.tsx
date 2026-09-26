import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Eye, Database, FileText, CheckCircle2, Globe, Server } from "lucide-react";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/sections/CTASection";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy — Ephemeral Pipelines & Data Protection",
  description:
    "Review the MediaDocks privacy policy: zero permanent file storage, ephemeral streaming pipelines, local storage usage, advertising cookies, and analytics disclosures.",
  path: "/privacy",
  keywords: [
    "mediadocks privacy policy",
    "private video downloader",
    "ephemeral streaming privacy",
    "cookie policy",
    "adsense privacy compliance",
    "gdpr ccpa rights",
  ],
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Privacy Policy", path: "/privacy" },
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
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[0.7rem] uppercase tracking-wider font-semibold text-foreground">
                  Privacy & Data Protection
                </span>
                <span className="text-border" aria-hidden="true">|</span>
                <span className="text-muted-foreground">Transparent Standards</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
                Privacy Policy
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                At MediaDocks, operated by SAP DigiTech Solutions, we believe the best way to protect
                your personal data is simply not to collect or store it in the first place.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Effective Date: March 2026 · Version 2.0
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Main Privacy Sections */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="section-shell max-w-4xl space-y-12">
          {/* Executive Summary Card */}
          <Reveal>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-soft sm:p-8">
              <h2 className="text-lg font-bold text-foreground sm:text-xl">
                Privacy at a Glance
              </h2>
              <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground sm:text-sm">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    <strong>Zero Permanent Media Storage:</strong> Downloaded or converted media files are never saved permanently on our servers. Streams are piped directly to your client.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    <strong>No User Accounts:</strong> You do not need to register, provide an email address, or create a password to use any MediaDocks tool.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    <strong>No Personal IP Tracking:</strong> Internal analytics use daily-rotating one-way salted digests that cannot be reversed or correlated across calendar days.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    <strong>Client-Side Recent Links:</strong> Your history of recently pasted links lives entirely in your own browser&apos;s local storage and can be wiped with one click.
                  </span>
                </li>
              </ul>
            </div>
          </Reveal>

          {/* Section 1: Information We Process */}
          <Reveal delay={50}>
            <div className="panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground">
                1. Information We Process
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                When you interact with MediaDocks, we process minimal technical data necessary to execute your requested media actions:
              </p>
              <div className="space-y-3 pt-2 text-xs sm:text-sm text-muted-foreground">
                <p>
                  <strong>• Source Link URLs:</strong> When you paste a URL into our downloader or transcription tools, our server inspects the public platform metadata to resolve available resolutions and formats. To prevent duplicate remote requests, our database stores only an irreversible SHA-256 cryptographic hash of the normalized URL alongside a short-lived expiration timestamp (30 minutes TTL). The full raw URL is not permanently archived in our database.
                </p>
                <p>
                  <strong>• Transient Media Chunks:</strong> During multi-rung video multiplexing (such as combining adaptive 1080p video and audio tracks via FFmpeg), data packets are buffered temporarily in server memory or ephemeral storage. As soon as the finished stream is transferred to your device, the temporary buffer is immediately unlinked and deleted.
                </p>
                <p>
                  <strong>• Uploaded Media Files:</strong> When you upload a video or audio file for AI transcription, summarization, or subtitling, the audio track is held ephemerally for the duration of the transcription API request and destroyed immediately upon generation of the transcript.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Section 2: Browser Storage & Cookies */}
          <Reveal delay={100}>
            <div className="panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground">
                2. Cookies and Local Storage
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                MediaDocks prioritizes client-side privacy in its technical architecture:
              </p>
              <div className="space-y-3 pt-2 text-xs sm:text-sm text-muted-foreground">
                <p>
                  <strong>• Browser Local Storage (Recent Links):</strong> Our web application offers an optional convenience feature that remembers your recent downloads. This list is saved exclusively on your local device using standard HTML5 <code className="rounded bg-surface-strong px-1.5 py-0.5 text-foreground font-mono">localStorage</code>. This data never leaves your browser, is not transmitted to our servers, and can be purged instantly by clicking &quot;Clear all&quot; in the downloader interface or clearing your browser cache.
                </p>
                <p>
                  <strong>• Functional Cookies:</strong> We do not use session or authentication cookies for public users.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Section 3: Third-Party Advertising (Google AdSense) */}
          <Reveal delay={150}>
            <div className="panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground">
                3. Third-Party Advertising & Google AdSense
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                To support free access to our high-performance infrastructure without charging subscription fees, MediaDocks displays advertisements served by Google AdSense:
              </p>
              <div className="space-y-3 pt-2 text-xs sm:text-sm text-muted-foreground">
                <p>
                  • Google, as a third-party vendor, uses cookies (including the DoubleClick cookie) to serve ads on MediaDocks.
                </p>
                <p>
                  • Google&apos;s use of advertising cookies enables it and its partners to serve personalized or contextual advertisements to our visitors based on their visits to this site and other sites on the Internet.
                </p>
                <p>
                  • You may opt out of personalized advertising by visiting{" "}
                  <a
                    href="https://www.google.com/settings/ads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary underline underline-offset-4"
                  >
                    Google Ads Settings
                  </a>
                  . Alternatively, you can opt out of third-party vendor cookies for personalized advertising by visiting{" "}
                  <a
                    href="https://www.aboutads.info/choices/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary underline underline-offset-4"
                  >
                    www.aboutads.info
                  </a>
                  .
                </p>
              </div>
            </div>
          </Reveal>

          {/* Section 4: AI Processing (Google Gemini API) */}
          <Reveal delay={200}>
            <div className="panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground">
                4. AI Speech-to-Text & Transcription Processing
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Our Video-to-Text, Audio-to-Text, Audio Summarizer, and Subtitle Studio tools process spoken audio tracks through secure, enterprise-grade AI models (Google Gemini API):
              </p>
              <ul className="space-y-2 pt-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    Audio inputs are transmitted over encrypted TLS connections directly to the API endpoint.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    MediaDocks does not use your audio files or resulting transcripts to train proprietary machine learning models.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    Transcripts are delivered directly back to your active browser window for preview and editing.
                  </span>
                </li>
              </ul>
            </div>
          </Reveal>

          {/* Section 5: Aggregate Anonymous Analytics */}
          <Reveal delay={250}>
            <div className="panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground">
                5. Privacy-Preserving Aggregate Measurement
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                MediaDocks monitors aggregate service health and feature usage (e.g. total video resolves, average processing latency, server errors) through an anonymous internal system:
              </p>
              <div className="space-y-2 pt-2 text-xs sm:text-sm text-muted-foreground">
                <p>
                  • We do not log IP addresses in analytics tables. Instead, each incoming request calculates a one-way cryptographic hash combining the client IP with a secret server salt and the current calendar date. This hash changes every 24 hours and cannot be reversed or correlated across days.
                </p>
                <p>
                  • We record coarse device categories (&quot;desktop&quot;, &quot;mobile&quot;) and referring domain hosts, never full query strings or pasted personal URLs.
                </p>
                <p>
                  • Aggregate records older than 90 days are automatically deleted by routine database cleanup scripts.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Section 6: User Rights & Contact */}
          <Reveal delay={300}>
            <div className="panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground">
                6. Your Privacy Rights (GDPR & CCPA)
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Under data protection frameworks including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA), you have the right to request access to, correction of, or deletion of any personal data held about you.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Because MediaDocks does not collect user accounts, names, or persistent media files, we generally do not hold identifiable personal data. However, if you have questions or inquiries regarding our data practices, please contact our Data Protection Team:
              </p>
              <div className="rounded-xl border border-border bg-surface p-4 text-xs sm:text-sm">
                <p className="font-semibold text-foreground">SAP DigiTech Solutions — Privacy Officer</p>
                <p className="text-muted-foreground">
                  Email:{" "}
                  <a
                    href="mailto:sapdigitechsolutions@gmail.com?subject=Privacy%20Inquiry"
                    className="font-semibold text-primary underline underline-offset-4"
                  >
                    sapdigitechsolutions@gmail.com
                  </a>
                </p>
                <p className="text-muted-foreground">
                  Official Website:{" "}
                  <a
                    href="https://www.sapdigitechsolutions.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:underline"
                  >
                    https://www.sapdigitechsolutions.in
                  </a>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <CTASection />
    </>
  );
}
