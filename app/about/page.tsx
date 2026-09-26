import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  HardDrive,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  Sparkles,
  Zap,
  Globe,
  Sliders,
  Cpu,
} from "lucide-react";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/sections/CTASection";
import { aboutPageJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About MediaDocks — Mission, Architecture & Privacy Philosophy",
  description:
    "Learn about MediaDocks: our privacy-centric architecture, zero persistent storage streaming pipelines, media workflows, and commitment to lawful, responsible use.",
  path: "/about",
  keywords: [
    "about mediadocks",
    "private video downloader",
    "zero storage media tool",
    "mediadocks mission",
    "mediadocks architecture",
    "sap digitech solutions",
  ],
});

const PILLARS = [
  {
    icon: HardDrive,
    title: "Zero Permanent Storage",
    desc: "Media streams are processed transiently in server memory or temporary buffers. Once streamed to your browser, temporary files are destroyed immediately.",
  },
  {
    icon: Sliders,
    title: "Quality Transparency",
    desc: "We strictly publish the authentic media rungs provided by origin platforms—from 144p to 4K—without upscaled or fabricated resolutions.",
  },
  {
    icon: Lock,
    title: "No Account or Tracking Barrier",
    desc: "There are no registration requirements, no email gates, no paywalls, and no cross-site behavioral tracking cookies.",
  },
  {
    icon: Shield,
    title: "Ethical & Lawful Operation",
    desc: "We operate strictly on publicly visible links, never bypass DRM, encryption, or private accounts, and actively cooperate with copyright holders.",
  },
];

const WORKFLOWS = [
  {
    title: "Multi-Platform Video Extraction",
    desc: "Direct stream acquisition from YouTube, Instagram, X (Twitter), Pinterest, and Facebook. Multiplexing adaptive video and audio tracks into universally compatible MP4 files.",
  },
  {
    title: "Clean Audio Extraction (MP3 & M4A)",
    desc: "Direct stream copying of original AAC audio tracks into M4A without generation loss, or clean transcode into MP3 (128, 192, 320 kbps) capped at the source bitrate.",
  },
  {
    title: "AI Speech-to-Text Transcription",
    desc: "Converting video and audio recordings into readable, editable plain text with automatic spoken language detection and TXT export.",
  },
  {
    title: "Subtitle & Closed Caption Studio",
    desc: "Generating timed subtitle cues with AI speech recognition or importing custom SRT/VTT files for in-browser timestamp synchronization and cue editing.",
  },
  {
    title: "AI Audio Summarization",
    desc: "Condensing lectures, interviews, and meetings into actionable bullet points, executive recaps, and Q&A pairs.",
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
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[0.7rem] uppercase tracking-wider font-semibold text-foreground">
                  Our Mission
                </span>
                <span className="text-border" aria-hidden="true">|</span>
                <span className="text-muted-foreground">Privacy-Centric Media Utility</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
                Engineering a cleaner, more transparent media web
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                MediaDocks is an independent universal media processing web application developed by{" "}
                <strong className="text-foreground">SAP DigiTech Solutions</strong>, engineered
                around ephemeral stream delivery and zero persistent data retention.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* What is MediaDocks / Problem it Solves */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="section-shell">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="eyebrow">The Problem We Solve</p>
              <h2 className="section-title mt-2">Why we built MediaDocks</h2>
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                <p>
                  For years, the online media download and conversion landscape has been plagued by
                  deceptive practices: bloated desktop software bundled with malware, shady web
                  converters saturated with intrusive pop-up advertisements, and opaque cloud
                  services that secretly store user media archives on third-party servers.
                </p>
                <p>
                  At the same time, creators, researchers, journalists, and students regularly have
                  legitimate needs to archive their own published content, extract audio from
                  field recordings, generate accessible subtitles, or transcribe spoken interviews.
                </p>
                <p>
                  MediaDocks was designed as a modern, high-performance alternative: a lightweight,
                  browser-accessible web application that processes media ephemerally in memory,
                  delivers clean standard files (MP4, MP3, M4A, SRT, VTT, TXT), and retains{" "}
                  <strong className="text-foreground">zero permanent files</strong> on disk.
                </p>
              </div>
            </Reveal>

            <Reveal delay={90}>
              <div className="panel space-y-6 p-6 sm:p-8">
                <h3 className="text-lg font-bold text-foreground">
                  Core Engineering Principles
                </h3>
                <div className="space-y-4">
                  {PILLARS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <div key={p.title} className="flex gap-4">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface text-primary shadow-soft">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            {p.title}
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {p.desc}
                          </p>
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

      {/* Supported Workflows */}
      <section className="border-t border-border bg-surface-strong/30 py-16 sm:py-20">
        <div className="section-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Capabilities & Features</p>
            <h2 className="section-title mt-2">Supported media workflows</h2>
            <p className="mt-3 text-muted-foreground">
              What MediaDocks actually does across stream extraction, conversion, and AI speech
              processing.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WORKFLOWS.map((wf, idx) => (
              <Reveal key={wf.title} delay={idx * 60}>
                <div className="panel flex h-full flex-col justify-between p-6">
                  <div>
                    <span className="font-mono text-xs font-bold text-primary">
                      0{idx + 1}
                    </span>
                    <h3 className="mt-2 text-base font-bold text-foreground">
                      {wf.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {wf.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Responsible Use & Legal Compliance */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="section-shell">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <div className="rounded-2xl border border-border/80 bg-surface/70 p-6 shadow-soft sm:p-8">
                <div className="flex items-start gap-4">
                  <ShieldAlert className="h-6 w-6 shrink-0 text-primary mt-1" />
                  <div>
                    <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                      Responsible Use & Copyright Policy
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      MediaDocks is built for personal archival, accessibility, and research of
                      publicly accessible media. We do not encourage, condone, or facilitate
                      copyright infringement.
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      We respect intellectual property rights and comply fully with the Digital
                      Millennium Copyright Act (DMCA). Content creators and copyright owners may
                      request URL blocks or report unauthorized material at any time by contacting
                      our designated agent.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4">
                      <Link
                        href="/terms"
                        className="text-xs font-semibold text-primary hover:underline underline-offset-4"
                      >
                        Read Terms of Service →
                      </Link>
                      <Link
                        href="/copyright"
                        className="text-xs font-semibold text-primary hover:underline underline-offset-4"
                      >
                        DMCA & Copyright Notice →
                      </Link>
                      <Link
                        href="/privacy"
                        className="text-xs font-semibold text-primary hover:underline underline-offset-4"
                      >
                        Privacy Policy →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Operator & Contact Info */}
      <section className="border-t border-border bg-surface-strong/20 py-16">
        <div className="section-shell">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Get in Touch
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                MediaDocks is engineered and maintained by SAP DigiTech Solutions. Have technical
                questions, feature suggestions, or business inquiries?
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
                  Visit Contact Page
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
