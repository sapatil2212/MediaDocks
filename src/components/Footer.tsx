"use client";

import Link from "next/link";
import { Github, Linkedin, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PlatformIcon } from "@/components/PlatformIcon";
import { PLATFORM_PAGES } from "@/lib/platform-pages";
import { scrollToDownloader } from "@/lib/scroll";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="section-shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo height={38} />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Precision media downloader. Extract high-resolution video and audio from public links.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              aria-label="MediaDocks on X"
              className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-surface-strong hover:text-foreground"
            >
              <PlatformIcon platform="x" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="MediaDocks on GitHub"
              className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-surface-strong hover:text-foreground"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="MediaDocks on LinkedIn"
              className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-surface-strong hover:text-foreground"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">Product</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              <button
                onClick={scrollToDownloader}
                className="transition-colors hover:text-foreground"
              >
                Downloader
              </button>
            </li>
            <li>
              <Link href="/how-it-works" className="transition-colors hover:text-foreground">
                How it works
              </Link>
            </li>
            <li>
              <Link href="/#capabilities" className="transition-colors hover:text-foreground">
                Supported platforms
              </Link>
            </li>
            <li>
              <Link href="/#how-to-copy-links" className="transition-colors hover:text-foreground">
                Where to copy a link
              </Link>
            </li>
            <li>
              <Link href="/#troubleshooting" className="transition-colors hover:text-foreground">
                Troubleshooting
              </Link>
            </li>
            <li>
              <Link href="/faq" className="transition-colors hover:text-foreground">
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">Downloaders</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {PLATFORM_PAGES.map((page) => (
              <li key={page.slug}>
                <Link href={page.slug} className="transition-colors hover:text-foreground">
                  {page.navLabel} downloader
                </Link>
              </li>
            ))}
            <li>
              <Link href="/youtube-to-mp3" className="transition-colors hover:text-foreground">
                YouTube to MP3
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">Legal & Safety</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
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
              <Link href="/terms#dmca-disclaimer" className="transition-colors hover:text-foreground">
                DMCA & Disclaimer
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
                  Please do not use this service to download copyrighted, proprietary, or restricted material without explicit authorization from the copyright holder. We strictly comply with <strong>DMCA policies</strong> and international copyright standards, and respond promptly to all valid infringement notices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright & Credit Bar */}
      <div className="border-t border-border bg-surface/40">
        <div className="section-shell flex flex-col items-center justify-center gap-1.5 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:gap-2">
          <p>© {new Date().getFullYear()} MediaDocks. All rights reserved.</p>
          <span className="hidden sm:inline text-border" aria-hidden="true">•</span>
          <p>
            Copyright and product of{" "}
            <a
              href="https://www.sapdigitechsolutions.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-4 decoration-border transition-colors hover:text-primary hover:decoration-primary"
            >
              SAP DigiTech Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
