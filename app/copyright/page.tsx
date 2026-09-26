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
            </div>
          </Reveal>
        </div>
      </section>

      <CTASection />
    </>
  );
}
