"use client";

import { useState } from "react";
import {
  ChevronDown,
  ShieldCheck,
  Zap,
  Lock,
  Sparkles,
  Layers,
  Scaling,
  FileText,
  FilePlus2,
  FileCode2,
  Binary,
  Image as ImageIcon,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  q: string;
  a: string;
}

export interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
}

const ICON_MAP: Record<string, any> = {
  layers: Layers,
  shield: ShieldCheck,
  zap: Zap,
  scaling: Scaling,
  lock: Lock,
  fileText: FileText,
  filePlus: FilePlus2,
  fileCode: FileCode2,
  binary: Binary,
  image: ImageIcon,
  qrcode: QrCode,
  sparkles: Sparkles,
};

export function ConverterSections({
  toolName,
  features,
  howItWorks,
  faqs,
}: {
  toolName: string;
  features: FeatureItem[];
  howItWorks: Array<{ step: number; title: string; description: string }>;
  faqs: FaqItem[];
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="section-shell relative z-10 space-y-20 py-16">
      {/* Features Grid */}
      <section>
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">
            Key Advantages
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold mt-2">
            Engineered for Speed, Quality & Privacy
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            MediaDocks processes everything directly in your browser. No files are stored or logged.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((feat, i) => {
            const Icon = (feat.icon && ICON_MAP[feat.icon]) || Sparkles;
            return (
              <div
                key={i}
                className="rounded-xl border border-border/80 bg-surface/60 p-5 shadow-none backdrop-blur transition-all hover:border-primary/40 hover:bg-surface-strong"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-primary/10 text-primary mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{feat.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it Works */}
      <section className="rounded-2xl border border-border/80 bg-surface-strong/60 p-8 sm:p-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">
            Simple 3-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold mt-2">
            How to use {toolName}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {howItWorks.map((step) => (
            <div key={step.step} className="flex flex-col items-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono font-bold text-sm mb-4">
                {step.step}
              </div>
              <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
              <p className="mt-1.5 text-xs text-muted-foreground max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy Guarantee Banner */}
      <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Zero Server Uploads & Client-Side Privacy
          </h4>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Your images, PDFs, and data never leave your computer. Processing occurs entirely in local memory via HTML5 Canvas and WebAssembly. No permanent storage, no tracking, and no data retention.
          </p>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">
            FAQ
          </span>
          <h2 className="text-2xl font-display font-bold mt-2">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-lg border border-border/80 bg-surface/80 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-4 text-left text-sm font-semibold transition-colors hover:text-primary"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground",
                      isOpen && "rotate-180 text-primary",
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
