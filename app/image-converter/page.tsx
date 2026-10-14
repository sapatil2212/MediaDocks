import type { Metadata } from "next";
import { ImageConverterHero } from "@/components/converters/ImageConverterHero";
import { ConverterSections } from "@/components/converters/ConverterSections";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { Reveal } from "@/components/Reveal";
import { Layers, ShieldCheck, Zap, Sparkles, Image as ImageIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Free Batch Image Converter — Convert JPG, PNG, WEBP, AVIF, GIF, SVG | MediaDocks",
  description:
    "Convert up to 10 images simultaneously between JPG, PNG, WebP, AVIF, GIF, BMP, SVG, and ICO. 100% private, processed in your browser with instant ZIP download.",
  alternates: {
    canonical: "/image-converter",
  },
};

const FEATURES = [
  {
    icon: "layers",
    title: "Batch Convert Up to 10 Files",
    description: "Upload up to 10 images at once. Convert all to a single format or customize individual formats per file.",
  },
  {
    icon: "zap",
    title: "Zero Quality Loss & Fast Canvas",
    description: "Uses HTML5 Canvas and browser image decoders for ultra-fast conversion with adjustable quality compression.",
  },
  {
    icon: "shield",
    title: "100% Client-Side Privacy",
    description: "Your pictures never leave your device. All conversions happen entirely in local memory with zero tracking.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Upload Your Images",
    description: "Drag and drop up to 10 image files (JPG, PNG, WEBP, AVIF, GIF, BMP, SVG, or ICO).",
  },
  {
    step: 2,
    title: "Choose Target Format",
    description: "Select a global format for all images or adjust the target format and quality slider per item.",
  },
  {
    step: 3,
    title: "Download Instantly or as ZIP",
    description: "Download converted images individually or click 'Download All as ZIP' for a single packaged archive.",
  },
];

const FAQS = [
  {
    q: "Is there a limit on how many images I can convert?",
    a: "You can convert up to 10 images simultaneously in a single batch. Once finished, you can clear and convert another batch with zero restrictions.",
  },
  {
    q: "Are my photos uploaded to any server?",
    a: "No! All image conversions are performed locally in your browser memory using the HTML5 Canvas API. Your files are never sent over the network or stored on any server.",
  },
  {
    q: "Which image formats are supported?",
    a: "MediaDocks supports converting between JPG, JPEG, PNG, WebP, AVIF, GIF, BMP, SVG, and ICO formats.",
  },
  {
    q: "Can I download all converted images at once?",
    a: "Yes. When you convert multiple files, a 'Download All as ZIP' button automatically packages all converted files into a single zip archive for one-click downloading.",
  },
];

export default function ImageConverterPage() {
  return (
    <div className="relative overflow-hidden pt-8 pb-20">
      <InteractiveBackground />

      <div className="section-shell relative z-10">
        <div className="mx-auto max-w-3xl text-center mb-10">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-none backdrop-blur-md">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Free & Unlimited
              </span>
              <span className="text-border">|</span>
              <span>Batch Image Converter</span>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="hero-title mt-4 text-balance font-display font-bold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl">
              Convert Images to Any Format
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Batch convert between JPG, PNG, WebP, AVIF, GIF, BMP, SVG, and ICO. 100% private,
              processed locally in your browser with bulk ZIP download.
            </p>
          </Reveal>
        </div>

        <Reveal delay={180}>
          <ImageConverterHero />
        </Reveal>

        <ConverterSections
          toolName="Image Converter"
          features={FEATURES}
          howItWorks={HOW_IT_WORKS}
          faqs={FAQS}
        />
      </div>
    </div>
  );
}
