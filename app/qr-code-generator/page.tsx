import type { Metadata } from "next";
import { QrCodeHero } from "@/components/converters/QrCodeHero";
import { ConverterSections } from "@/components/converters/ConverterSections";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { Reveal } from "@/components/Reveal";
import { QrCode, ShieldCheck, Zap, Sparkles, Image as ImageIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Free Vector QR Code Generator — SVG, EPS, PDF & High-Res PNG | MediaDocks",
  description:
    "Create customized vector QR codes for CorelDRAW, Adobe Illustrator, and print in SVG, EPS, PDF, and high-res PNG. Add logos, custom colors, Wi-Fi, URLs, and vCards. 100% free and private.",
  alternates: {
    canonical: "/qr-code-generator",
  },
};

const FEATURES = [
  {
    icon: "qrcode",
    title: "Vector & Illustration Export (SVG, EPS, PDF)",
    description: "Export infinitely scalable vector files. 100% compatible with CorelDRAW (.cdr), Adobe Illustrator (.ai), Figma, and commercial print shops.",
  },
  {
    icon: "image",
    title: "Custom Brand Logo Overlay",
    description: "Upload your company or personal logo with automatic high error-correction so codes scan effortlessly.",
  },
  {
    icon: "zap",
    title: "Multi-Format Payloads & 4K Print",
    description: "Generate QR codes for URLs, Wi-Fi networks, vCards, and text with custom colors and raster downloads up to 4096×4096 px.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Choose Data Type",
    description: "Select Website URL, Wi-Fi, Text, Email, Phone, or vCard contact.",
  },
  {
    step: 2,
    title: "Add Custom Logo & Colors",
    description: "Upload your brand logo and select custom foreground and background colors.",
  },
  {
    step: 3,
    title: "Download Vector or Raster",
    description: "Download scalable vector SVG, EPS for CorelDRAW, vector PDF, high-res PNG, or the complete all-in-one ZIP suite.",
  },
];

const FAQS = [
  {
    q: "Can I open and edit these QR codes in CorelDRAW (.cdr) or Adobe Illustrator?",
    a: "Yes! Simply download the Vector SVG or Vector EPS file. In CorelDRAW, press Ctrl+I (File → Import) or drag the file into your workspace. It imports as 100% scalable vector curves with zero pixelation, ready for vinyl plotting, flex printing, or CNC engraving.",
  },
  {
    q: "Which vector format is best for CorelDRAW and print shops?",
    a: "Both SVG and EPS are excellent. SVG is ideal for modern digital design, web, and CorelDRAW / Illustrator. EPS (Encapsulated PostScript) is the traditional prepress standard for commercial sign printers, plotters, and print shops.",
  },
  {
    q: "Do QR codes created here ever expire?",
    a: "No! All QR codes generated on MediaDocks are static codes. They encode the actual data directly into the QR pattern and will never expire, require subscription, or stop working.",
  },
  {
    q: "Will the QR code scan reliably with my custom logo in the middle?",
    a: "Yes. When you upload a custom logo, MediaDocks automatically elevates the QR error correction level to 'High' (Level H, 30% redundancy) and draws a contrast backing behind the logo so scanners read it flawlessly.",
  },
];

export default function QrCodeGeneratorPage() {
  return (
    <div className="relative overflow-hidden pt-8 pb-20">
      <InteractiveBackground />

      <div className="section-shell relative z-10">
        <div className="mx-auto max-w-3xl text-center mb-10">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-none backdrop-blur-md">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Design Tools
              </span>
              <span className="text-border">|</span>
              <span>QR Code Generator</span>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="hero-title mt-4 text-balance font-display font-bold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl">
              Create Custom QR Codes with Logo
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Generate permanent, high-resolution QR codes for websites, Wi-Fi networks, text, and contacts.
              Customize colors, embed your brand logo, and download high-res PNGs for print and web.
            </p>
          </Reveal>
        </div>

        <Reveal delay={180}>
          <QrCodeHero />
        </Reveal>

        <ConverterSections
          toolName="QR Code Generator"
          features={FEATURES}
          howItWorks={HOW_IT_WORKS}
          faqs={FAQS}
        />
      </div>
    </div>
  );
}
