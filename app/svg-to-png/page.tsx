import type { Metadata } from "next";
import { SvgToPngHero } from "@/components/converters/SvgToPngHero";
import { ConverterSections } from "@/components/converters/ConverterSections";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { Reveal } from "@/components/Reveal";
import { FileCode2, ShieldCheck, Zap, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Free SVG to PNG Converter — Render Vectors at High Resolutions | MediaDocks",
  description:
    "Convert SVG vector graphics to crisp PNG images online. Scale up to 8x resolution (4096px), transparent or solid backgrounds. 100% private in browser.",
  alternates: {
    canonical: "/svg-to-png",
  },
};

const FEATURES = [
  {
    icon: "fileCode",
    title: "Lossless Vector Rasterization",
    description: "Render complex SVG paths, gradients, and typography into razor-sharp PNG images without jagged pixel edges.",
  },
  {
    icon: "zap",
    title: "1x to 8x Ultra Resolution",
    description: "Scale your SVG up to 8x base dimensions (up to 4096px) for 4K displays, print merchandise, and high-DPI assets.",
  },
  {
    icon: "shield",
    title: "100% Client-Side Privacy",
    description: "Your SVGs are processed entirely in memory via the browser Canvas renderer. No external servers or tracking.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Upload SVG File",
    description: "Select or drop your .svg vector file. Dimensions and viewBox are auto-detected.",
  },
  {
    step: 2,
    title: "Choose Scale & Background",
    description: "Select 1x, 2x, 4x, or 8x scale and transparent or solid background color.",
  },
  {
    step: 3,
    title: "Download PNG",
    description: "Click Download PNG to save your crystal clear rasterized graphic instantly.",
  },
];

const FAQS = [
  {
    q: "Why convert SVG to PNG?",
    a: "While SVG is great for scalable web graphics, many platforms (like social media, older image editors, and presentation apps) require raster formats like PNG. Our converter gives you the sharpest possible PNG at any resolution you need.",
  },
  {
    q: "Does it preserve transparency in the SVG?",
    a: "Yes! By default, the output PNG preserves full alpha channel transparency. You can also choose white or black solid backgrounds if preferred.",
  },
];

export default function SvgToPngPage() {
  return (
    <div className="relative overflow-hidden pt-8 pb-20">
      <InteractiveBackground />

      <div className="section-shell relative z-10">
        <div className="mx-auto max-w-3xl text-center mb-10">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-none backdrop-blur-md">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Vector Tools
              </span>
              <span className="text-border">|</span>
              <span>SVG to PNG Converter</span>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="hero-title mt-4 text-balance font-display font-bold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl">
              Convert SVG to High-Res PNG
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Rasterize vector illustrations, icons, and logos into crisp, transparent PNG images at up to 8x resolution.
            </p>
          </Reveal>
        </div>

        <Reveal delay={180}>
          <SvgToPngHero />
        </Reveal>

        <ConverterSections
          toolName="SVG to PNG"
          features={FEATURES}
          howItWorks={HOW_IT_WORKS}
          faqs={FAQS}
        />
      </div>
    </div>
  );
}
