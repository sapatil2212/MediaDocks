import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock,
  HelpCircle,
  Mail,
  MapPin,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { ContactForm } from "@/src/components/contact/ContactForm";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/sections/CTASection";
import { breadcrumbJsonLd, buildMetadata, contactPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact MediaDocks Support — Technical Help & Inquiries",
  description:
    "Get in touch with the MediaDocks team for technical assistance, bug reports, feature requests, and DMCA copyright inquiries. Fast support via email.",
  path: "/contact",
  keywords: [
    "contact mediadocks",
    "mediadocks support",
    "report broken link",
    "mediadocks help",
    "dmca contact mediadocks",
  ],
});

const SUPPORT_CHANNELS = [
  {
    icon: Mail,
    title: "Direct Support Email",
    desc: "For general questions, bug reports, and assistance.",
    value: "sapdigitechsolutions@gmail.com",
    href: "mailto:sapdigitechsolutions@gmail.com",
    label: "Send an email",
  },
  {
    icon: ShieldAlert,
    title: "DMCA & Copyright Inquiries",
    desc: "Dedicated channel for copyright notices and content removal requests.",
    value: "sapdigitechsolutions@gmail.com",
    href: "mailto:sapdigitechsolutions@gmail.com?subject=DMCA%20Notice",
    label: "Submit DMCA Notice",
  },
  {
    icon: Clock,
    title: "Response Window",
    desc: "Our engineering team reviews all incoming requests promptly.",
    value: "Monday – Friday (24 to 48 Hours)",
    href: null,
    label: null,
  },
];

const COMMON_QUESTIONS = [
  {
    q: "Why did my video link report 'unavailable'?",
    a: "If the link is from Instagram or Facebook, it is often login-walled or restricted to friends. MediaDocks operates strictly on public links without using accounts or cookies.",
  },
  {
    q: "Why is a 1080p download taking longer to start?",
    a: "High resolutions arrive as separate video and audio streams that must be multiplexed with FFmpeg before the file is delivered. A 10-minute 1080p video takes approximately two minutes.",
  },
  {
    q: "What is the maximum file size limit?",
    a: "Single downloads are capped at 500 MB to ensure server responsiveness and prevent memory exhaustion. For long videos, choose a lower resolution or select the audio-only MP3/M4A option.",
  },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          contactPageJsonLd(),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
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
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[0.7rem] uppercase tracking-wider font-semibold text-foreground">
                  Support & Help
                </span>
                <span className="text-border" aria-hidden="true">|</span>
                <span className="text-muted-foreground">Direct Engineering Contact</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="hero-title mt-6 text-balance font-display tracking-tight text-foreground">
                We&apos;re here to help
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Have a question about a video resolution, a bug to report, or an inquiry regarding
                our service? Reach out to the team at SAP DigiTech Solutions.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Main Content: Channels & Contact Form */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="section-shell">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
            {/* Left Column: Direct Channels & Information */}
            <div className="space-y-6">
              <Reveal>
                <p className="eyebrow">Direct Channels</p>
                <h2 className="section-title mt-2">Contact details</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Choose the channel that best suits your inquiry. We do not use automated bot
                  replies; real software engineers respond to your messages.
                </p>
              </Reveal>

              <div className="space-y-4 pt-2">
                {SUPPORT_CHANNELS.map((ch, idx) => {
                  const Icon = ch.icon;
                  return (
                    <Reveal key={ch.title} delay={idx * 60}>
                      <div className="panel p-5">
                        <div className="flex items-start gap-4">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface text-primary shadow-soft">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">
                              {ch.title}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {ch.desc}
                            </p>
                            <p className="mt-2 text-xs font-semibold text-foreground">
                              {ch.value}
                            </p>
                            {ch.href && ch.label ? (
                              <a
                                href={ch.href}
                                className="mt-2 inline-block text-xs font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
                              >
                                {ch.label} →
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>

              {/* Legal Notice Cards */}
              <Reveal delay={180}>
                <div className="rounded-2xl border border-border/80 bg-surface/50 p-5 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Important Policies</p>
                  <p className="mt-1 leading-relaxed">
                    Before reaching out, you may find instant answers in our documentation:
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link
                      href="/privacy"
                      className="font-medium text-primary hover:underline underline-offset-4"
                    >
                      Privacy Policy
                    </Link>
                    <span>•</span>
                    <Link
                      href="/terms"
                      className="font-medium text-primary hover:underline underline-offset-4"
                    >
                      Terms of Service
                    </Link>
                    <span>•</span>
                    <Link
                      href="/copyright"
                      className="font-medium text-primary hover:underline underline-offset-4"
                    >
                      DMCA Guidelines
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Right Column: Interactive Form */}
            <div>
              <Reveal delay={90}>
                <div className="panel p-6 sm:p-8">
                  <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Send a Message
                  </h2>
                  <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
                    Fill out the form below and our team will get back to you via email.
                  </p>
                  <div className="mt-6">
                    <ContactForm />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Common Quick Answers Section */}
      <section className="border-t border-border bg-surface-strong/30 py-16">
        <div className="section-shell">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                <HelpCircle className="h-4 w-4" />
                <span>Instant Answers</span>
              </div>
              <h2 className="section-title mt-2">Frequently asked before contacting</h2>
              <div className="mt-8 space-y-4">
                {COMMON_QUESTIONS.map((item, idx) => (
                  <div key={idx} className="panel p-5">
                    <h3 className="text-sm font-bold text-foreground">
                      {item.q}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
