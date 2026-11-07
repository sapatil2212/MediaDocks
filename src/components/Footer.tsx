"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, BookOpen, Globe } from "lucide-react";
import { Logo } from "@/components/Logo";
import { hasAdapter, reopenConsent, subscribe } from "@/lib/ads/consent";

/**
 * "Privacy choices" is a link to the ad-choices section of the privacy page
 * everywhere. Once a consent tool is installed (only on guide pages, only when ads
 * are enabled) it becomes a button that reopens the tool. The swap happens in an
 * effect, never during render, so server and first client render match.
 */
function PrivacyChoices({ className }: { className: string }) {
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const sync = () => setInstalled(hasAdapter());
    sync();
    return subscribe(sync);
  }, []);

  if (installed) {
    return (
      <button type="button" onClick={() => reopenConsent()} className={className}>
        Privacy choices
      </button>
    );
  }
  return (
    <Link href="/privacy#ad-choices" className={className}>
      Privacy choices
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="section-shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        {/* Column 1: Branding & Philosophy */}
        <div className="lg:col-span-1">
          <Logo height={38} />
          <p className="mt-4 max-w-xs text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Browser-based tools for transcribing speech, creating subtitles, summarizing recordings and converting images and documents. No account needed.
          </p>
          <div className="mt-5 space-y-1 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Developed & Operated by:</p>
            <a
              href="https://www.sapdigitechsolutions.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline underline-offset-4"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>SAP DigiTech Solutions</span>
            </a>
          </div>
        </div>

        {/* Column 2: Tools & AI Suite */}
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">Tools & AI</h2>
          <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-muted-foreground">
            <li>
              <Link
                href="/video-to-audio"
                className="transition-colors hover:text-foreground font-medium text-foreground"
              >
                Video to Audio
              </Link>
            </li>
            <li>
              <Link
                href="/video-to-text"
                className="transition-colors hover:text-foreground font-medium text-primary"
              >
                Video to Text (AI)
              </Link>
            </li>
            <li>
              <Link
                href="/audio-to-text"
                className="transition-colors hover:text-foreground font-medium text-primary"
              >
                Audio to Text (AI)
              </Link>
            </li>
            <li>
              <Link
                href="/audio-summarizer"
                className="transition-colors hover:text-foreground font-medium text-primary"
              >
                Audio Summarizer (AI)
              </Link>
            </li>
            <li>
              <Link
                href="/add-subtitles-to-video"
                className="transition-colors hover:text-foreground font-medium text-primary"
              >
                Subtitle Studio (AI)
              </Link>
            </li>
            <li className="pt-2 border-t border-border/40 font-semibold text-foreground text-xs uppercase tracking-wider">
              Converters & Tools
            </li>
            <li>
              <Link href="/url-shortener" className="transition-colors hover:text-foreground font-medium text-foreground/90">
                URL Shortener
              </Link>
            </li>
            <li>
              <Link href="/image-converter" className="transition-colors hover:text-foreground">
                Image Converter
              </Link>
            </li>
            <li>
              <Link href="/image-resizer" className="transition-colors hover:text-foreground">
                Image Resizer
              </Link>
            </li>
            <li>
              <Link href="/background-remover" className="transition-colors hover:text-foreground">
                Background Remover
              </Link>
            </li>
            <li>
              <Link href="/pdf-to-image" className="transition-colors hover:text-foreground">
                PDF to Image
              </Link>
            </li>
            <li>
              <Link href="/image-to-pdf" className="transition-colors hover:text-foreground">
                Image to PDF
              </Link>
            </li>
            <li>
              <Link href="/qr-code-generator" className="transition-colors hover:text-foreground">
                QR Code Generator
              </Link>
            </li>
            <li>
              <Link href="/svg-to-png" className="transition-colors hover:text-foreground">
                SVG to PNG
              </Link>
            </li>
            <li>
              <Link href="/base64-image" className="transition-colors hover:text-foreground">
                Base64 Image Tool
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: How it works */}
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">Learn</h2>
          <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-muted-foreground">
            <li>
              <Link href="/how-it-works" className="transition-colors hover:text-foreground">
                How it works
              </Link>
            </li>
            <li>
              <Link href="/faq" className="transition-colors hover:text-foreground">
                FAQ & Troubleshooting
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Guides & Knowledge Center */}
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>Resources</span>
          </h2>
          <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-muted-foreground">
            <li>
              <Link
                href="/guides"
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                Browse All Guides →
              </Link>
            </li>
            <li>
              <Link
                href="/guides/mp4-vs-webm-video-format-comparison"
                className="transition-colors hover:text-foreground"
              >
                MP4 vs WebM Comparison
              </Link>
            </li>
            <li>
              <Link
                href="/guides/video-resolution-guide-720p-1080p-4k"
                className="transition-colors hover:text-foreground"
              >
                720p vs 1080p vs 4K
              </Link>
            </li>
            <li>
              <Link
                href="/guides/understanding-video-codecs-h264-hevc-vp9-av1"
                className="transition-colors hover:text-foreground"
              >
                Video Codecs (H.264/VP9/AV1)
              </Link>
            </li>
            <li>
              <Link
                href="/guides/audio-bitrates-explained-128-192-320-kbps"
                className="transition-colors hover:text-foreground"
              >
                Audio Bitrate (128 vs 320 kbps)
              </Link>
            </li>
            <li>
              <Link
                href="/guides/complete-guide-to-srt-vtt-subtitles"
                className="transition-colors hover:text-foreground"
              >
                SRT vs WebVTT Subtitles
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 5: Company & Legal */}
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">Company & Legal</h2>
          <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-muted-foreground">
            <li>
              <Link href="/about" className="transition-colors hover:text-foreground font-medium text-foreground">
                About MediaDocks
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-foreground font-medium text-foreground">
                Contact Support
              </Link>
            </li>
            <li>
              <Link href="/editorial-standards" className="transition-colors hover:text-foreground">
                Editorial Standards
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="transition-colors hover:text-foreground">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="transition-colors hover:text-foreground">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/copyright" className="transition-colors hover:text-foreground">
                DMCA & Copyright Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Prominent Legal & DMCA Disclaimer Block */}
      <div className="border-t border-border bg-surface-strong/40 py-8">
        <div className="section-shell">
          <div className="rounded-2xl border border-border/80 bg-surface/70 p-5 shadow-soft sm:p-6">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
              <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <p className="font-semibold text-foreground">Notice</p>
                <p>
                  MediaDocks is an independent service and is not affiliated with, endorsed by or
                  sponsored by YouTube, Instagram, X, Pinterest, Facebook, Meta or Google. Platform
                  names and marks belong to their owners.
                </p>
                <p>
                  You are responsible for holding the rights to any file you upload, convert or save.
                  Rights holders can find how to contact us on the{" "}
                  <Link href="/copyright" className="text-primary hover:underline">
                    copyright page
                  </Link>
                  , or write to{" "}
                  <a href="mailto:sapdigitechsolutions@gmail.com" className="text-primary hover:underline">
                    sapdigitechsolutions@gmail.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright & Credit Bar */}
      <div className="border-t border-border bg-surface/40">
        <div className="section-shell flex flex-col items-center justify-between gap-3 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} MediaDocks. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <span className="text-border">•</span>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
            <span className="text-border">•</span>
            <Link href="/guides" className="hover:text-foreground transition-colors">
              Guides
            </Link>
            <span className="text-border">•</span>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span className="text-border">•</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <span className="text-border">•</span>
            <Link href="/copyright" className="hover:text-foreground transition-colors">
              Copyright
            </Link>
            <span className="text-border">•</span>
            <PrivacyChoices className="hover:text-foreground transition-colors" />
          </div>
        </div>
      </div>
    </footer>
  );
}
