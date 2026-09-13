import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { buildMetadata } from "@/lib/seo";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service & Legal Disclaimer",
  description:
    "The terms of use and legal disclaimer for MediaDocks: third-party platform notice, copyright compliance, DMCA policy, and acceptable use.",
  path: "/terms",
  keywords: ["downloader terms of use", "legal video downloader", "copyright and downloading", "dmca policy", "disclaimer"],
});

const sections = [
  {
    id: "dmca-disclaimer",
    h: "Third-Party Platforms & DMCA Disclaimer",
    p: "MediaDocks is not connected to, affiliated with, authorized, maintained, sponsored, or endorsed by YouTube™, Instagram™, X (Twitter)™, Pinterest™, Facebook™, Meta™, Google™, or any of their affiliates. All platform names, product names, logos, and trademarks displayed on this website are the intellectual property of their respective owners. We do not host, store, index, or archive any video, audio, or image files on our servers; all media streams originate directly from third-party publicly accessible sources and belong solely to their respective content creators.",
  },
  {
    id: "copyright",
    h: "Copyright Compliance & Prohibited Use",
    p: "Please do not use our tool for copyrighted, proprietary, or access-restricted content without the express written permission of the content owner. MediaDocks is intended exclusively for personal archival of publicly published media. We strictly comply with the Digital Millennium Copyright Act (DMCA) and international copyright legislation, and will promptly disable or restrict access upon receipt of valid infringement notices.",
  },
  {
    id: "acceptable-use",
    h: "Acceptable Use",
    p: "Use MediaDocks only for publicly accessible media that you own, have created, or are legally authorized to access and download. You assume all legal responsibility for how you access, download, and utilize any media file processed through this utility.",
  },
  {
    id: "access-controls",
    h: "No Bypass of Access Controls",
    p: "MediaDocks does not bypass logins, paywalls, private friend-only barriers, DRM (Digital Rights Management), geo-blocks, or authentication tokens, and will never be engineered to circumvent access controls.",
  },
  {
    id: "public-availability",
    h: "Public Availability & Ephemeral Pipelines",
    p: "MediaDocks operates purely as a client-side stream proxy that transiently buffers and pipes media chunks. Availability of third-party public streams may change or cease at any time without notice.",
  },
  {
    id: "warranty",
    h: "No Warranty & Limitation of Liability",
    p: "The service is provided strictly on an 'AS IS' and 'AS AVAILABLE' basis without warranty of any kind, express or implied, to the maximum extent permitted by applicable law.",
  },
];

export default function TermsPage() {
  return (
    <section className="py-16 sm:py-20">
      <div className="section-shell max-w-3xl">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5 text-primary" />
            <span>Legal Compliance & Terms</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl mt-4">
            Terms of Service & Disclaimer
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last revised: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </Reveal>

        <div className="mt-10 space-y-8">
          {sections.map((s, i) => (
            <Reveal key={s.h} delay={i * 50}>
              <div id={s.id} className="rounded-2xl border border-border/70 bg-surface/60 p-6 shadow-soft scroll-mt-24">
                <h2 className="text-lg font-bold text-foreground sm:text-xl">{s.h}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
