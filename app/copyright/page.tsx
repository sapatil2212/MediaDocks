import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Mail,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  XCircle,
  Scale,
  FileWarning,
} from "lucide-react";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/sections/CTASection";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Copyright & DMCA Takedown Policy — MediaDocks",
  description:
    "MediaDocks respects intellectual property rights. Review our DMCA policy, designated copyright agent contact, takedown procedure, and counter-notification process.",
  path: "/copyright",
  keywords: [
    "mediadocks dmca policy",
    "copyright compliance",
    "dmca takedown notice",
    "digital millennium copyright act",
    "designated copyright agent",
  ],
});

export default function CopyrightPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Copyright & DMCA", path: "/copyright" },
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
                <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[0.7rem] uppercase tracking-wider font-semibold text-foreground">
                  Intellectual Property
                </span>
                <span className="text-border" aria-hidden="true">|</span>
                <span className="text-muted-foreground">DMCA Compliance Policy</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
                Copyright & DMCA Policy
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                MediaDocks respects the intellectual property rights of creators and copyright
                holders. We comply with the Digital Millennium Copyright Act (17 U.S.C. § 512).
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Main Policy Content */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="section-shell max-w-4xl space-y-12">
          {/* Important Technical Distinction */}
          <Reveal>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-soft sm:p-8">
              <div className="flex items-start gap-4">
                <Shield className="h-6 w-6 shrink-0 text-primary mt-1" />
                <div>
                  <h2 className="text-lg font-bold text-foreground sm:text-xl">
                    Ephemeral Architecture & Non-Hosting Notice
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    MediaDocks is an ephemeral stream multiplexing and conversion utility.{" "}
                    <strong className="text-foreground">
                      We do not host, store, index, or archive any user video, audio, or image files
                      on our servers.
                    </strong>{" "}
                    All media files processed through our tool originate directly from third-party
                    public servers and are streamed transiently in memory directly to the user&apos;s
                    browser.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Despite storing zero permanent media files, MediaDocks takes all copyright
                    concerns seriously and maintains a proactive system to block access to specific
                    URLs, channels, or accounts upon receipt of a valid notice.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Permitted vs prohibited use — stated plainly rather than implied */}
          <Reveal delay={30}>
            <div className="panel space-y-5 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <Scale className="mt-1 h-6 w-6 shrink-0 text-primary" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    What this service may and may not be used for
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    The AI transcription, subtitle and summarisation tools operate on files you
                    supply, and we assume you have the right to process them. The link-based
                    converters read publicly accessible media, and a file arriving on your device
                    grants you no rights you did not already hold. The distinction below is the one
                    that matters.
                  </p>
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>Generally legitimate</span>
                  </h3>
                  <ul className="mt-4 space-y-3 text-xs text-muted-foreground sm:text-sm">
                    {[
                      "Transcribing or captioning recordings you made or commissioned yourself.",
                      "Saving your own uploads back from a platform you published them to.",
                      "Material released under a permissive licence such as Creative Commons, within that licence's terms.",
                      "Works in the public domain, where copyright has expired or was never asserted.",
                      "Content whose rightsholder has given you explicit permission.",
                      "Producing accessibility accommodations — captions, transcripts — where you hold the rights or have authorisation.",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <XCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span>Not permitted</span>
                  </h3>
                  <ul className="mt-4 space-y-3 text-xs text-muted-foreground sm:text-sm">
                    {[
                      "Republishing, redistributing or monetising someone else's work without authorisation.",
                      "Re-uploading third-party content to your own channel or feed.",
                      "Building a derivative library, archive or dataset from material you do not hold rights to.",
                      "Removing or obscuring attribution, watermarks or credit from a creator's work.",
                      "Commercial use of third-party media without a licence that permits it.",
                      "Bulk or automated extraction at scale, which we rate-limit and do not support.",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface-strong/50 p-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                <span className="font-semibold text-foreground">Where responsibility sits:</span>{" "}
                MediaDocks is a general-purpose utility and has no way to determine whether you hold
                rights to a particular file. Deciding whether you may lawfully process, save or
                reuse something is your judgement and your liability. If you are unsure about a
                specific item, treat it as restricted and obtain permission.
              </div>
            </div>
          </Reveal>

          {/* Platform terms are a separate obligation from copyright */}
          <Reveal delay={60}>
            <div className="panel space-y-4 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <FileWarning className="mt-1 h-6 w-6 shrink-0 text-primary" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Platform terms of service are a separate obligation
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Copyright is not the only thing governing what you may do with media from a
                    hosting platform. Most large platforms, YouTube among them, prohibit downloading
                    their content in their own terms of service, independently of who owns the
                    copyright in any particular video.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    That restriction is a contractual matter between you and the platform, and it
                    can apply even to material that is public domain or openly licensed, and in some
                    cases even to your own uploads. Agreeing to a platform&apos;s terms and then
                    downloading from it is a question of that agreement rather than of copyright
                    law. You are responsible for knowing which terms you have accepted, and we
                    encourage you to use a platform&apos;s own official download or export feature
                    where one is offered.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Fair use, honestly framed */}
          <Reveal delay={90}>
            <div className="panel space-y-4 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-primary" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Fair use is narrower than it is usually assumed to be
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Fair use in the United States, and fair dealing in the United Kingdom, Canada,
                    Australia and elsewhere, can permit limited unlicensed use for purposes such as
                    criticism, commentary, news reporting, teaching and research. These doctrines are
                    real and genuinely important.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    They are also narrower, more fact-specific and less predictable than internet
                    convention suggests. Fair use is assessed case by case against statutory factors
                    including the purpose and character of the use, the nature of the work, how much
                    was taken, and the effect on the market for the original. Crediting the creator
                    does not establish it. Neither does adding a disclaimer, keeping a clip under
                    some supposed duration threshold, or not making money — these are widely
                    repeated and none of them is a rule. Fair dealing regimes outside the US are
                    typically more restrictive still, limited to enumerated purposes.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Nothing on this page is legal advice. If your intended use depends on fair use
                    or fair dealing to be lawful, that is precisely the situation in which
                    qualified advice for your jurisdiction is worth obtaining.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* DMCA Notice Requirements */}
          <Reveal delay={60}>
            <div className="panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground">
                How to Submit a Valid DMCA Notice
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                If you are a copyright owner or an agent authorized to act on behalf of one, and you
                believe that a public URL processed through MediaDocks infringes upon your copyright,
                please provide our designated Copyright Agent with a written notice containing the
                following statutory requirements (pursuant to 17 U.S.C. § 512(c)(3)):
              </p>
              <ul className="space-y-3 pt-2 text-xs text-muted-foreground sm:text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    <strong>1. Identification of Work:</strong> A description or link to the
                    copyrighted work that you claim has been infringed.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    <strong>2. Specific Location:</strong> The exact public URL(s) processed by our
                    utility that you request to be blocked from extraction.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    <strong>3. Contact Information:</strong> Your full name, mailing address,
                    telephone number, and valid email address.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    <strong>4. Good Faith Statement:</strong> A statement that you have a good faith
                    belief that use of the material in the manner complained of is not authorized by
                    the copyright owner, its agent, or the law.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    <strong>5. Accuracy & Penalty of Perjury:</strong> A statement, under penalty of
                    perjury, that the information in the notification is accurate and that you are
                    the copyright owner or authorized to act on their behalf.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    <strong>6. Signature:</strong> A physical or electronic signature of the
                    copyright owner or authorized representative.
                  </span>
                </li>
              </ul>
            </div>
          </Reveal>

          {/* Designated DMCA Agent */}
          <Reveal delay={120}>
            <div className="panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground">
                Designated Copyright Agent Contact
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Please deliver all written copyright notifications to our designated DMCA Agent at
                SAP DigiTech Solutions:
              </p>
              <div className="rounded-xl border border-border bg-surface p-4 text-xs sm:text-sm">
                <p className="font-semibold text-foreground">MediaDocks Copyright Department</p>
                <p className="text-muted-foreground">Operator: SAP DigiTech Solutions</p>
                <p className="mt-2 text-muted-foreground">
                  Email:{" "}
                  <a
                    href="mailto:sapdigitechsolutions@gmail.com?subject=DMCA%20Copyright%20Notice"
                    className="font-semibold text-primary underline underline-offset-4"
                  >
                    sapdigitechsolutions@gmail.com
                  </a>
                </p>
                <p className="text-muted-foreground">
                  Subject Line: <strong>DMCA Copyright Notice</strong>
                </p>
              </div>
            </div>
          </Reveal>

          {/* Counter-Notification Procedure */}
          <Reveal delay={180}>
            <div className="panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground">
                Counter-Notification Procedure
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                If you believe that access to your content was blocked by mistake or
                misidentification, you may send a written counter-notification to our designated
                agent containing your contact information, the blocked URL, a statement consenting
                to applicable jurisdiction, and your physical or electronic signature.
              </p>
            </div>
          </Reveal>

          {/* Prohibited Content & Terms */}
          <Reveal delay={240}>
            <div className="panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground">
                Prohibited Conduct & Repeat Infringers
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Users are strictly prohibited from using MediaDocks to process copyrighted material
                without authorization. In accordance with applicable law, MediaDocks maintains a
                strict policy of terminating or blocking access to users, automated systems, or IP
                ranges that repeatedly attempt to misuse the service for copyright infringement.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Several measures support this in the design of the service rather than only in
                policy. The tool never authenticates, so private, follower-only and paywalled
                material stays out of reach; it does not bypass age gates, CAPTCHA or DRM; bulk
                playlist and channel extraction is deliberately unimplemented, since that is the
                pattern most associated with wholesale republishing; and per-visitor rate limits cap
                sustained automated use. Where a valid notice identifies specific sources, we block
                extraction from them.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We would rather the scope of this tool be clear than maximise what it appears able
                to do. Each platform page states which links work and which do not, measured against
                live public URLs, and the service reports an honest unavailable result instead of
                attempting to work around a restriction.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <CTASection />
    </>
  );
}
