import type { Metadata } from "next";
import { PdfToImageHero } from "@/components/converters/PdfToImageHero";
import { ConverterSections } from "@/components/converters/ConverterSections";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { Reveal } from "@/components/Reveal";
import { FileText, ShieldCheck, Zap, Layers, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Free PDF to Image Converter — Convert PDF to PNG, JPG, WebP | MediaDocks",
  description:
    "Convert PDF pages to high-resolution PNG, JPG, or WebP images online. Extract single pages or download all pages in a single ZIP file. 100% private in browser.",
  alternates: {
    canonical: "/pdf-to-image",
  },
};

const FEATURES = [
  {
    icon: "fileText",
    title: "High-DPI Page Rendering",
    description: "Render pages at 1x or 2x high-definition (up to 300 DPI) for crystal clear text, diagrams, and figures.",
  },
  {
    icon: "layers",
    title: "Batch ZIP Export",
    description: "Download individual pages or extract every page in your PDF document simultaneously in a single ZIP archive.",
  },
  {
    icon: "shield",
    title: "100% Client-Side Privacy",
    description: "Your PDF document is rendered directly inside your browser. No files are uploaded or saved to any server.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Upload Your PDF",
    description: "Select or drop your PDF document. All pages are extracted and previewed instantly.",
  },
  {
    step: 2,
    title: "Choose Format & Resolution",
    description: "Pick your preferred format (PNG, JPEG, WebP) and resolution scale (Standard or High Res).",
  },
  {
    step: 3,
    title: "Save Images",
    description: "Download single pages or click 'Download All as ZIP' to save the complete document.",
  },
];

const FAQS = [
  {
    q: "Can I convert multi-page PDF documents?",
    a: "Yes! MediaDocks extracts and renders every page in your document. You can preview all pages in an interactive grid and download them individually or as a ZIP archive.",
  },
  {
    q: "Is there any file size limit for PDFs?",
    a: "Because all rendering happens locally inside your browser via WebAssembly and HTML5 Canvas, you can convert PDFs of any size without network timeouts or upload caps.",
  },
  {
    q: "Which image format is best for PDF conversion?",
    a: "PNG is best for documents containing text and vector diagrams because it provides lossless, crisp readability. JPEG is ideal for documents with photographs where you want smaller file sizes.",
  },
];

export default function PdfToImagePage() {
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
              <span>PDF to Image Converter</span>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="hero-title mt-4 text-balance font-display font-bold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl">
              Convert PDF Pages to Images
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Extract every page from your PDF into crisp, high-resolution PNG, JPG, or WebP images.
              Download individual pages or batch download the entire document as a ZIP file.
            </p>
          </Reveal>
        </div>

        <Reveal delay={180}>
          <PdfToImageHero />
        </Reveal>

        <ConverterSections
          toolName="PDF to Image"
          features={FEATURES}
          howItWorks={HOW_IT_WORKS}
          faqs={FAQS}
        />
      </div>
    </div>
  );
}
