import type { Metadata } from "next";
import { Base64ImageHero } from "@/components/converters/Base64ImageHero";
import { ConverterSections } from "@/components/converters/ConverterSections";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { Reveal } from "@/components/Reveal";
import { Binary, ShieldCheck, Zap, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Free Base64 Image Converter — Encode & Decode Images Online | MediaDocks",
  description:
    "Convert images to Base64 data URIs and decode Base64 strings back to PNG/JPEG files online. Fast, secure, and 100% private in your browser.",
  alternates: {
    canonical: "/base64-image",
  },
};

const FEATURES = [
  {
    icon: "binary",
    title: "Instant Data URI & HTML Snippets",
    description: "Get one-click copyable Data URIs, HTML <img> tags, and CSS background-image code snippets.",
  },
  {
    icon: "zap",
    title: "Two-Way Encode & Decode",
    description: "Turn photos into Base64 strings or paste any Base64 string to preview and download as a PNG image.",
  },
  {
    icon: "shield",
    title: "100% Client-Side Privacy",
    description: "All encoding and decoding operations happen directly on your CPU via the FileReader API with zero server calls.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Select Mode",
    description: "Choose 'Image to Base64 (Encode)' or 'Base64 to Image (Decode)'.",
  },
  {
    step: 2,
    title: "Upload or Paste",
    description: "Upload an image to get your encoded data URI, or paste a Base64 string to decode it.",
  },
  {
    step: 3,
    title: "Copy or Download",
    description: "Copy code snippets with one click or download the decoded image file directly.",
  },
];

const FAQS = [
  {
    q: "What is a Base64 image?",
    a: "Base64 encoding represents binary image data as an ASCII string. This lets you embed images directly inside HTML, CSS, or JSON without needing external image files or additional HTTP requests.",
  },
  {
    q: "Does Base64 increase file size?",
    a: "Yes, Base64 strings are typically ~33% larger than raw binary files. For small icons, logos, and email templates, the reduction in HTTP requests outweighs the slight size increase.",
  },
];

export default function Base64ImagePage() {
  return (
    <div className="relative overflow-hidden pt-8 pb-20">
      <InteractiveBackground />

      <div className="section-shell relative z-10">
        <div className="mx-auto max-w-3xl text-center mb-10">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-none backdrop-blur-md">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Developer Utilities
              </span>
              <span className="text-border">|</span>
              <span>Base64 Image Converter</span>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="hero-title mt-4 text-balance font-display font-bold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl">
              Encode & Decode Base64 Images
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Convert images to embeddable Data URIs and HTML snippets, or decode Base64 strings back into downloadable files.
            </p>
          </Reveal>
        </div>

        <Reveal delay={180}>
          <Base64ImageHero />
        </Reveal>

        <ConverterSections
          toolName="Base64 Image Converter"
          features={FEATURES}
          howItWorks={HOW_IT_WORKS}
          faqs={FAQS}
        />
      </div>
    </div>
  );
}
