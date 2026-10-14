import type { Metadata } from "next";
import { ImageResizerHero } from "@/components/converters/ImageResizerHero";
import { ConverterSections } from "@/components/converters/ConverterSections";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Free Image Resizer — Resize by Pixels, Dimensions & Percentage | MediaDocks",
  description:
    "Resize any image easily. Auto-detects format and dimensions, lock aspect ratio, adjust by percentage or exact pixels, and convert format. 100% private in browser.",
  alternates: {
    canonical: "/image-resizer",
  },
};

const FEATURES = [
  {
    icon: "scaling",
    title: "Exact Dimensions or Percentages",
    description: "Input custom width and height in pixels or use instant percentage presets (25%, 50%, 75%, 150%, 200%).",
  },
  {
    icon: "lock",
    title: "Smart Aspect Ratio Lock",
    description: "Maintains your original photo proportions automatically so images never look stretched or distorted.",
  },
  {
    icon: "shield",
    title: "100% Client-Side Processing",
    description: "All resizing happens locally inside your browser memory using high-quality bicubic interpolation.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Upload Your Photo",
    description: "Drag and drop or select your image. Dimensions and format are detected instantly.",
  },
  {
    step: 2,
    title: "Set Dimensions or Scale",
    description: "Enter your target width/height or click a percentage preset while keeping aspect ratio locked.",
  },
  {
    step: 3,
    title: "Download Resized Image",
    description: "Click Resize & Download to receive your perfectly dimensioned image in seconds.",
  },
];

const FAQS = [
  {
    q: "Will resizing my image reduce its quality?",
    a: "MediaDocks uses browser-native high-quality image smoothing algorithms to maintain crisp lines and sharp details when downscaling or upscaling.",
  },
  {
    q: "Can I convert the format while resizing?",
    a: "Yes! You can choose to keep the original format or export directly to PNG, JPEG, or WebP with adjustable quality compression.",
  },
  {
    q: "Does aspect ratio lock work in both directions?",
    a: "Yes. When the aspect ratio lock is enabled, typing a new width automatically updates the height proportionally, and vice versa.",
  },
];

export default function ImageResizerPage() {
  return (
    <div className="relative overflow-hidden pt-8 pb-20">
      <InteractiveBackground />

      <div className="section-shell relative z-10">
        <div className="mx-auto max-w-3xl text-center mb-10">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-none backdrop-blur-md">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Smart Dimensions
              </span>
              <span className="text-border">|</span>
              <span>Online Image Resizer</span>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="hero-title mt-4 text-balance font-display font-bold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl">
              Resize Images with Precision
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Auto-detect image dimensions, lock aspect ratio, resize by pixel or percentage,
              and export in your preferred format with zero quality degradation.
            </p>
          </Reveal>
        </div>

        <Reveal delay={180}>
          <ImageResizerHero />
        </Reveal>

        <ConverterSections
          toolName="Image Resizer"
          features={FEATURES}
          howItWorks={HOW_IT_WORKS}
          faqs={FAQS}
        />
      </div>
    </div>
  );
}
