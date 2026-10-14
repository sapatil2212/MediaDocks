import type { Metadata } from "next";
import { ImageToPdfHero } from "@/components/converters/ImageToPdfHero";
import { ConverterSections } from "@/components/converters/ConverterSections";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { Reveal } from "@/components/Reveal";
import { FilePlus2, ShieldCheck, Zap, Layers, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Free Image to PDF Converter — Merge Photos into PDF Online | MediaDocks",
  description:
    "Combine multiple JPG, PNG, and WebP images into a single professional PDF document. Reorder pages, customize margins, page orientation and size. 100% private in browser.",
  alternates: {
    canonical: "/image-to-pdf",
  },
};

const FEATURES = [
  {
    icon: "filePlus",
    title: "Multi-Image Merging",
    description: "Combine multiple photos and screenshots into a single clean PDF document in seconds.",
  },
  {
    icon: "layers",
    title: "Custom Orientation & Margins",
    description: "Choose A4, US Letter, or Fit to Image with customizable portrait/landscape orientation and margins.",
  },
  {
    icon: "shield",
    title: "100% Client-Side Privacy",
    description: "Your pictures are compiled into a PDF document directly inside your browser memory. No data is stored.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Upload Photos",
    description: "Select or drop your photos (JPG, PNG, WebP, GIF, or BMP).",
  },
  {
    step: 2,
    title: "Arrange & Configure",
    description: "Reorder images using up/down controls, choose page size (A4, Letter) and margins.",
  },
  {
    step: 3,
    title: "Download PDF",
    description: "Click Convert & Download to get your combined PDF document instantly.",
  },
];

const FAQS = [
  {
    q: "How many images can I merge into a PDF?",
    a: "You can merge as many images as you need. Processing is handled client-side with optimized memory buffers for smooth performance.",
  },
  {
    q: "Can I rearrange the order of pages?",
    a: "Yes! Use the up and down arrow buttons on each photo card to position your images in the exact sequence you want them to appear in the PDF.",
  },
  {
    q: "Will my images retain their high quality in the PDF?",
    a: "Yes. Images are embedded directly into the PDF structure at their native resolution without lossy re-compression.",
  },
];

export default function ImageToPdfPage() {
  return (
    <div className="relative overflow-hidden pt-8 pb-20">
      <InteractiveBackground />

      <div className="section-shell relative z-10">
        <div className="mx-auto max-w-3xl text-center mb-10">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-none backdrop-blur-md">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Document Tools
              </span>
              <span className="text-border">|</span>
              <span>Image to PDF Converter</span>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="hero-title mt-4 text-balance font-display font-bold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl">
              Merge Images into a Clean PDF
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Combine your photos, scans, and screenshots into a single PDF document.
              Rearrange page order, choose margins and page sizes, and download immediately.
            </p>
          </Reveal>
        </div>

        <Reveal delay={180}>
          <ImageToPdfHero />
        </Reveal>

        <ConverterSections
          toolName="Image to PDF"
          features={FEATURES}
          howItWorks={HOW_IT_WORKS}
          faqs={FAQS}
        />
      </div>
    </div>
  );
}
