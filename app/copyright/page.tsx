import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Scale, Shield, ShieldAlert } from "lucide-react";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/sections/CTASection";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Copyright and DMCA Policy",
  description:
    "How MediaDocks treats copyright: what users may and may not do, what happens to files, and how to send a copyright notice.",
  path: "/copyright",
});

const NOTICE_ITEMS = [
  "Your name, your email address and, if you are acting for someone else, who that is.",
  "A description of the work you say has been infringed and where the original can be found.",
  "Where the material appears or how it reaches our tools, such as the page address, the tool name and the date.",
  "A statement that you believe in good faith that the use is not authorized by the rights holder, its agent or the law.",
  "A statement that the information in the notice is accurate, and that you are the rights holder or authorized to act for them.",
  "Your signature, typed or scanned.",
];

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
                <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-foreground">
                  Copyright
                </span>
              </div>
            </Reveal>
            <Reveal delay={60}>
              <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
                Copyright and DMCA policy
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                MediaDocks respects the rights of creators. This page explains how files are
                handled, what we expect of users, and how to send a copyright notice.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16 sm:py-20">
        <div className="section-shell max-w-4xl space-y-12">
          <Reveal>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-soft sm:p-8">
              <div className="flex items-start gap-4">
                <Shield className="mt-1 h-6 w-6 shrink-0 text-primary" />
                <div>
                  <h2 className="text-lg font-bold text-foreground sm:text-xl">
                    How files are handled
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    MediaDocks does not run a media library. Files that have to be processed on the
                    server are handled in a temporary location scoped to the request, and many tools
                    process files in your browser without uploading them. Short links created with
                    the URL shortener are stored so that they keep working; they point to pages, not
                    to media held by MediaDocks.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={30}>
            <div className="panel space-y-5 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <Scale className="mt-1 h-6 w-6 shrink-0 text-primary" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">What users may and may not do</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    The tools work on files you supply, and we assume you have the right to process
                    them. A converted file grants you no rights you did not already hold.
                  </p>
                </div>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Reasonable uses</h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-xs text-muted-foreground sm:text-sm">
                    <li>Transcribing or captioning your own recordings.</li>
                    <li>Converting your own images, documents and audio.</li>
                    <li>Working with material that is licensed for your use or in the public domain.</li>
                    <li>Working with material for which you have the rights holder&apos;s permission.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Not acceptable</h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-xs text-muted-foreground sm:text-sm">
                    <li>Processing material you have no right to use.</li>
                    <li>Republishing or selling someone else&apos;s work.</li>
                    <li>Removing rights information or watermarks to disguise where something came from.</li>
                    <li>Using the tools to break a platform&apos;s terms or a license you agreed to.</li>
                  </ul>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                This page is general information and not legal advice. Whether a particular use is
                lawful depends on the facts and on where you are.
              </p>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <div className="panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground">Sending a copyright notice</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                If you are a rights holder with a concern about material connected to MediaDocks,
                email us. Notices that include the following details are the easiest to act on:
              </p>
              <ol className="list-decimal space-y-2 pl-5 text-xs text-muted-foreground sm:text-sm">
                {NOTICE_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
              <div className="rounded-xl border border-border bg-surface p-4 text-xs sm:text-sm">
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>Copyright notices</span>
                </p>
                <p className="mt-1 text-muted-foreground">
                  Email:{" "}
                  <a
                    href="mailto:sapdigitechsolutions@gmail.com?subject=Copyright%20notice"
                    className="font-semibold text-primary underline underline-offset-4"
                  >
                    sapdigitechsolutions@gmail.com
                  </a>
                </p>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                This address is a contact address. This page does not state that a designated agent
                has been registered with a copyright office. If something was blocked or removed
                by mistake, write to the same address and explain why.
              </p>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <p className="text-sm text-muted-foreground">
              See also the{" "}
              <Link href="/terms" className="font-semibold text-primary underline-offset-4 hover:underline">
                Terms of Service
              </Link>{" "}
              and the{" "}
              <Link href="/privacy" className="font-semibold text-primary underline-offset-4 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>

      <CTASection />
    </>
  );
}
