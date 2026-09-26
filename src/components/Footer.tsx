"use client";

import Link from "next/link";
import { ShieldAlert, BookOpen, Globe } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PLATFORM_PAGES } from "@/lib/platform-pages";
import { scrollToDownloader } from "@/lib/scroll";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="section-shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        {/* Column 1: Branding & Philosophy */}
        <div className="lg:col-span-1">
          <Logo height={38} />
          <p className="mt-4 max-w-xs text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Privacy-first universal media utility. Extract high-resolution video and audio from
            public links, transcribe speech with AI, and generate subtitles.
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
              <button
                onClick={scrollToDownloader}
                className="transition-colors hover:text-foreground text-left"
              >
                Universal Downloader
              </button>
            </li>
            <li>
              <Link
                href="/youtube-to-mp3"
                className="transition-colors hover:text-foreground font-medium text-foreground"
              >
                YouTube to MP3
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
          </ul>
        </div>

        {/* Column 3: Platform Portals */}
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">Platforms</h2>
          <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-muted-foreground">
            {PLATFORM_PAGES.map((page) => (
              <li key={page.slug}>
                <Link href={page.slug} className="transition-colors hover:text-foreground">
                  {page.navLabel} Downloader
                </Link>
              </li>
            ))}
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
                <p className="font-semibold text-foreground">
                  Disclaimer & Intellectual Property Notice
                </p>
                <p>
                  MediaDocks is an independent tool and is <strong>not affiliated, associated, authorized, endorsed by, or in any way officially connected</strong> with YouTube™, Instagram™, X (Twitter)™, Pinterest™, Facebook™, Meta™, Google™, or any of their subsidiaries or affiliates. All platform names, trademarks, logos, and registered marks are the property of their respective rights holders.
                </p>
                <p>
                  <strong>We do not host, store, or archive media files on our servers.</strong> All content belongs exclusively to its original owners and content creators. MediaDocks serves strictly as an ephemeral client-side streaming utility for publicly accessible media.
                </p>
                <p>
                  Please do not use this service to download copyrighted, proprietary, or restricted material without explicit authorization from the copyright holder. We strictly comply with <strong>DMCA policies</strong> and international copyright standards, and respond promptly to all valid infringement notices submitted to <a href="mailto:sapdigitechsolutions@gmail.com" className="text-primary hover:underline">sapdigitechsolutions@gmail.com</a>.
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
              DMCA
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
