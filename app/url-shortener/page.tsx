import type { Metadata } from "next";
import { UrlShortenerHero } from "@/components/converters/UrlShortenerHero";
import { ConverterSections } from "@/components/converters/ConverterSections";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { Reveal } from "@/components/Reveal";
import { Link2, ShieldCheck, Zap, Sparkles, QrCode } from "lucide-react";

export const metadata: Metadata = {
  title: "Free URL Shortener — Shorten Links, Custom Alias & QR Codes | MediaDocks",
  description:
    "Transform long, messy URLs into clean, memorable short links. Create custom aliases, build UTM campaign tags, generate instant QR codes, and track clicks for free with 100% privacy.",
  alternates: {
    canonical: "/url-shortener",
  },
};

const FEATURES = [
  {
    icon: "link",
    title: "Instant Clean Short Links",
    description: "Transform complex URLs filled with tracking tokens and parameters into clean, concise short links that look professional on social media and print.",
  },
  {
    icon: "sparkles",
    title: "Branded Custom Aliases",
    description: "Choose your own personalized link slug (e.g., /s/my-brand) so your audience knows exactly what to expect before clicking.",
  },
  {
    icon: "qrcode",
    title: "Built-in QR Code Generation",
    description: "Every short link instantly generates high-resolution PNG and vector SVG QR codes ready for posters, business cards, and presentations.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Paste Your Long URL",
    description: "Enter or paste any destination link. Optional: pick a custom alias and append UTM campaign tracking parameters.",
  },
  {
    step: 2,
    title: "Generate Short Link",
    description: "Click 'Shorten Link'. MediaDocks checks the destination and creates an instant, permanent short URL.",
  },
  {
    step: 3,
    title: "Share & Download QR",
    description: "Copy your shortened link with one click, share it across social networks, or download the accompanying QR code.",
  },
];

const FAQS = [
  {
    q: "Do links created on MediaDocks ever expire?",
    a: "No! Shortened URLs created on MediaDocks do not expire. They remain active indefinitely without recurring subscription fees or artificial limits.",
  },
  {
    q: "Are there any interstitial ads or countdown delays before redirecting?",
    a: "Never! MediaDocks provides direct, instant 307 redirects. Your visitors are routed straight to the destination website in milliseconds with zero advertisements or waiting screens.",
  },
  {
    q: "What is the Link Safety Preview feature?",
    a: "Appending '?preview=1' to any MediaDocks short link (e.g., /s/xyz?preview=1) opens a security inspection page displaying the exact destination domain and target URL before visiting, protecting users from phishing.",
  },
  {
    q: "Can I track how many clicks my short link receives?",
    a: "Yes! MediaDocks counts redirects in an aggregated, anonymous fashion without logging visitors' IP addresses or browsing history.",
  },
];

export default function UrlShortenerPage() {
  return (
    <div className="relative overflow-hidden pt-8 pb-20">
      <InteractiveBackground />

      <div className="section-shell relative z-10">
        <div className="mx-auto max-w-3xl text-center mb-10">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-none backdrop-blur-md">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Link Tools
              </span>
              <span className="text-border">|</span>
              <span>Free URL Shortener</span>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="hero-title mt-4 text-balance font-display font-bold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl">
              Shorten, Customize & Track Links
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Transform long, messy URLs into clean, memorable short links.
              Customize aliases, generate vector QR codes, add marketing UTM parameters, and track clicks with 100% privacy.
            </p>
          </Reveal>
        </div>

        <Reveal delay={180}>
          <UrlShortenerHero />
        </Reveal>

        <ConverterSections
          toolName="URL Shortener"
          features={FEATURES}
          howItWorks={HOW_IT_WORKS}
          faqs={FAQS}
        />
      </div>
    </div>
  );
}
