import type { Metadata } from "next";
import Link from "next/link";
import { HardDrive, Lock, Mail, Shield, ShieldAlert, Globe, Sliders } from "lucide-react";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/sections/CTASection";
import { aboutPageJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About MediaDocks: Mission and Privacy Approach",
  description:
    "What MediaDocks is for, how it handles files, which tools it offers and who is responsible for the content published on this site.",
  path: "/about",
});

const PRINCIPLES = [
  {
    icon: HardDrive,
    title: "No media library",
    desc: "Files that must be processed on the server are handled in a temporary location scoped to the request. MediaDocks keeps no archive of what you upload or convert.",
  },
  {
    icon: Sliders,
    title: "Work on your own files",
    desc: "The tools take files you provide. Many of them, such as the image, PDF and QR tools and the Background Remover, run entirely in your browser.",
  },
  {
    icon: Lock,
    title: "No account",
    desc: "There is no registration and no paywall. The privacy policy lists exactly which data is processed and which cookies exist.",
  },
  {
    icon: Shield,
    title: "Responsible use",
    desc: "You are responsible for the rights to any file you use. Rights holders can contact us through the copyright page.",
  },
];

const TOOL_GROUPS = [
  {
    title: "Speech to text",
    desc: "Turns audio and video recordings into editable text with automatic language detection, and exports TXT.",
  },
  {
    title: "Subtitles",
    desc: "Generates timed cues from speech or imports existing SRT and VTT files for editing, then exports SRT or WebVTT.",
  },
  {
    title: "Audio summaries",
    desc: "Condenses a recording into an overview, key points, action items or question and answer pairs.",
  },
  {
    title: "Audio extraction",
    desc: "Extracts the audio track from a video file you upload and returns it in the format you choose.",
  },
  {
    title: "Images and documents",
    desc: "Converts and resizes images, turns PDF pages into images and images into PDFs, removes backgrounds, builds QR codes, and converts SVG and Base64.",
  },
  {
    title: "Guides",
    desc: "A library of long-form explainers on video formats, codecs, bitrates, subtitles and transcription.",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={[
          aboutPageJsonLd(),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
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
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[0.7rem] uppercase tracking-wider font-semibold text-foreground">
                  About
                </span>
              </div>
            </Reveal>
            <Reveal delay={60}>
              <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
                About MediaDocks
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                MediaDocks is a set of browser-based tools for working with recordings, images and
                documents, plus a library of guides that explain the formats behind them.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16 sm:py-20">
        <div className="section-shell">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="eyebrow">Purpose</p>
              <h2 className="section-title mt-2">What this site is for</h2>
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                <p>
                  Recordings are hard to search and hard to reuse. A two-hour lecture or interview
                  holds a small amount of material you actually need, and the only way to find it is
                  to listen. MediaDocks turns recordings into text, captions and summaries you can
                  read, search and quote, and it covers the everyday conversions that surround that
                  work.
                </p>
                <p>
                  The guides exist because the tools are easier to use well when you understand the
                  choices: which subtitle format a platform wants, what a bitrate changes, why a
                  video will not play. They are written to be read on their own.
                </p>
                <p>
                  How a guide is written and updated is described on the{" "}
                  <Link href="/editorial-standards" className="font-semibold text-primary underline-offset-4 hover:underline">
                    editorial standards
                  </Link>{" "}
                  page.
                </p>
              </div>
            </Reveal>
            <Reveal delay={90}>
              <div className="panel space-y-6 p-6 sm:p-8">
                <h3 className="text-lg font-bold text-foreground">How it is built to behave</h3>
                <div className="space-y-4">
                  {PRINCIPLES.map((p) => {
                    const Icon = p.icon;
                    return (
                      <div key={p.title} className="flex gap-4">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface text-primary shadow-soft">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{p.title}</h4>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface-strong/30 py-16 sm:py-20">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">What is here</p>
            <h2 className="section-title mt-2">The main parts of the site</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOOL_GROUPS.map((group, idx) => (
              <Reveal key={group.title} delay={idx * 60}>
                <div className="panel flex h-full flex-col justify-between p-6">
                  <div>
                    <span className="font-mono text-xs font-bold text-primary">0{idx + 1}</span>
                    <h3 className="mt-2 text-base font-bold text-foreground">{group.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{group.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16 sm:py-20">
        <div className="section-shell">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <div className="rounded-2xl border border-border/80 bg-surface/70 p-6 shadow-soft sm:p-8">
                <div className="flex items-start gap-4">
                  <ShieldAlert className="mt-1 h-6 w-6 shrink-0 text-primary" />
                  <div>
                    <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                      Responsible use and copyright
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Only upload, convert or save material you own, that is licensed for your use,
                      or that you have permission to use. MediaDocks cannot check the rights to a
                      file, so that responsibility is yours.
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      If you hold rights to material and have a concern, the copyright page explains
                      what to send and where.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4">
                      <Link href="/terms" className="text-xs font-semibold text-primary underline-offset-4 hover:underline">
                        Terms of Service
                      </Link>
                      <Link href="/copyright" className="text-xs font-semibold text-primary underline-offset-4 hover:underline">
                        Copyright policy
                      </Link>
                      <Link href="/privacy" className="text-xs font-semibold text-primary underline-offset-4 hover:underline">
                        Privacy policy
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface-strong/20 py-16">
        <div className="section-shell">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Get in touch</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Questions, bug reports, feedback and privacy requests all go to one email address.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                <a
                  href="mailto:sapdigitechsolutions@gmail.com"
                  className="text-sm font-semibold text-foreground underline underline-offset-4 hover:text-primary"
                >
                  sapdigitechsolutions@gmail.com
                </a>
              </div>
              <div className="mt-8">
                <Link
                  href="/contact"
                  className="rounded-xl border border-primary/40 bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90"
                >
                  Visit the contact page
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
