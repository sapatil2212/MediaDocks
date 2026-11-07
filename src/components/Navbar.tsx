"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronDown,
  Music2,
  ArrowRight,
  AudioLines,
  Captions,
  FileVideo2,
  ListChecks,
  Wrench,
  Repeat,
  Image as ImageIcon,
  Scaling,
  FileText,
  FilePlus2,
  QrCode,
  FileCode2,
  Binary,
  Link2,
  Eraser,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

/**
 * The AI media tools.
 *
 * These used to be one top-level link. They now live behind a "Tools" menu so
 * transcription, summarizing and subtitling are presented as siblings, and they
 * are listed once, here, so it is clear which menu is canonical.
 */
const TOOL_OPTIONS: Array<{
  name: string;
  slug: string;
  tagline: string;
  icon: typeof FileVideo2;
}> = [
  {
    name: "Video to Audio",
    slug: "/video-to-audio",
    tagline: "Extract MP3, WAV, M4A from any long video",
    icon: Music2,
  },
  {
    name: "Video to Text",
    slug: "/video-to-text",
    tagline: "MP4, MOV, WebM or a public video link",
    icon: FileVideo2,
  },
  {
    name: "Audio to Text",
    slug: "/audio-to-text",
    tagline: "MP3, WAV, M4A, FLAC podcasts & voice notes",
    icon: AudioLines,
  },
  {
    name: "AI Audio Summarizer",
    slug: "/audio-summarizer",
    tagline: "Recap, key points & action items from audio",
    icon: ListChecks,
  },
  {
    name: "Add Subtitles to Video",
    slug: "/add-subtitles-to-video",
    tagline: "Timed cues you can edit, export SRT & VTT",
    icon: Captions,
  },
];

const CONVERTER_OPTIONS = [
  {
    name: "URL Shortener",
    slug: "/url-shortener",
    tagline: "Custom alias, QR code, analytics & UTM builder",
    icon: Link2,
  },
  {
    name: "Image Converter",
    slug: "/image-converter",
    tagline: "Batch JPG, PNG, WebP, AVIF, GIF, SVG (Up to 10)",
    icon: ImageIcon,
  },
  {
    name: "Image Resizer",
    slug: "/image-resizer",
    tagline: "Resize by px or %, auto-detect aspect ratio",
    icon: Scaling,
  },
  {
    name: "Background Remover",
    slug: "/background-remover",
    tagline: "AI cutouts to transparent PNG, bulk ZIP (up to 25)",
    icon: Eraser,
  },
  {
    name: "PDF to Image",
    slug: "/pdf-to-image",
    tagline: "Extract pages to high-res PNG, JPG or WebP",
    icon: FileText,
  },
  {
    name: "Image to PDF",
    slug: "/image-to-pdf",
    tagline: "Merge multiple photos into a single PDF document",
    icon: FilePlus2,
  },
  {
    name: "QR Code Generator",
    slug: "/qr-code-generator",
    tagline: "Custom logo overlay, URL, WiFi & high-res export",
    icon: QrCode,
  },
  {
    name: "SVG to PNG Converter",
    slug: "/svg-to-png",
    tagline: "Vector rasterization up to 8x resolution",
    icon: FileCode2,
  },
  {
    name: "Base64 Image Converter",
    slug: "/base64-image",
    tagline: "Encode images to Data URI & decode Base64",
    icon: Binary,
  },
];

const mainLinks = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [convertersOpen, setConvertersOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileConvertersOpen, setMobileConvertersOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [pathname, setPathname] = useState("");
  const convertersTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toolsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const convertersRef = useRef<HTMLDivElement | null>(null);
  const toolsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname);
    }
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleConvertersEnter = () => {
    if (convertersTimeoutRef.current) clearTimeout(convertersTimeoutRef.current);
    setConvertersOpen(true);
  };

  const handleConvertersLeave = () => {
    convertersTimeoutRef.current = setTimeout(() => setConvertersOpen(false), 150);
  };

  const handleToolsEnter = () => {
    if (toolsTimeoutRef.current) clearTimeout(toolsTimeoutRef.current);
    setToolsOpen(true);
  };

  const handleToolsLeave = () => {
    toolsTimeoutRef.current = setTimeout(() => setToolsOpen(false), 150);
  };

  useEffect(() => {
    if (!convertersOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConvertersOpen(false);
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!convertersRef.current?.contains(event.target as Node)) setConvertersOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [convertersOpen]);

  // A menu opened by click must also close on Escape and on an outside click,
  // otherwise it can be left hanging over the page with no obvious way to
  // dismiss it — especially for keyboard users.
  useEffect(() => {
    if (!toolsOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setToolsOpen(false);
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!toolsRef.current?.contains(event.target as Node)) setToolsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [toolsOpen]);

  const isConverterPath = CONVERTER_OPTIONS.some((c) => c.slug === pathname);
  const isToolPath = TOOL_OPTIONS.some((tool) => tool.slug === pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-b border-border bg-background shadow-sm"
          : "border-b border-transparent bg-background/70 backdrop-blur-md",
      )}
    >
      <div className="section-shell flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="MediaDocks home"
          className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* Above the fold on every page, so it is fetched eagerly. */}
          <Logo height={34} priority />
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main" className="hidden items-center gap-0.5 md:flex">
          <Link
            href="/"
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-surface-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              pathname === "/" ? "text-foreground font-semibold" : "text-muted-foreground",
            )}
          >
            Home
          </Link>

          {/* Converters Dropdown */}
          <div
            className="relative"
            ref={convertersRef}
            onMouseEnter={handleConvertersEnter}
            onMouseLeave={handleConvertersLeave}
          >
            <button
              type="button"
              onClick={() => setConvertersOpen((v) => !v)}
              aria-expanded={convertersOpen}
              aria-haspopup="true"
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-surface-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                convertersOpen || isConverterPath
                  ? "bg-surface-strong/60 font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <span>Converters</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-hover:text-foreground",
                  convertersOpen ? "rotate-180 text-primary" : "",
                )}
                aria-hidden="true"
              />
            </button>

            {convertersOpen && (
              <div
                className="absolute left-0 top-full z-50 mt-1.5 w-[360px] animate-in fade-in zoom-in-95 rounded-2xl border border-border bg-surface p-2.5 shadow-lift duration-150"
                role="menu"
                aria-label="Converters menu"
              >
                <div className="mb-1 border-b border-border/60 px-3 py-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Media Converters & Tools
                  </p>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    100% In-Browser
                  </span>
                </div>

                <div className="space-y-1">
                  {CONVERTER_OPTIONS.map((conv) => {
                    const isSelected = pathname === conv.slug;
                    return (
                      <Link
                        key={conv.slug}
                        href={conv.slug}
                        onClick={() => setConvertersOpen(false)}
                        role="menuitem"
                        aria-current={isSelected ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl p-2.5 transition-all duration-150",
                          isSelected
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-foreground/90 hover:bg-surface-strong hover:text-foreground",
                        )}
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-surface shadow-soft transition-transform duration-150 group-hover:scale-105">
                          <conv.icon className="h-4 w-4 text-primary" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold leading-none">{conv.name}</span>
                          </div>
                          <p className="mt-1 truncate text-[11px] font-normal text-muted-foreground">
                            {conv.tagline}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Tools Dropdown (AI transcription) */}
          <div
            className="relative"
            ref={toolsRef}
            onMouseEnter={handleToolsEnter}
            onMouseLeave={handleToolsLeave}
          >
            <button
              type="button"
              onClick={() => setToolsOpen((v) => !v)}
              aria-expanded={toolsOpen}
              aria-haspopup="true"
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-surface-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                toolsOpen || isToolPath
                  ? "bg-surface-strong/60 font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <span>Tools</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-hover:text-foreground",
                  toolsOpen ? "rotate-180 text-primary" : "",
                )}
                aria-hidden="true"
              />
            </button>

            {toolsOpen && (
              <div
                className="absolute left-0 top-full z-50 mt-1.5 w-[320px] animate-in fade-in zoom-in-95 rounded-2xl border border-border bg-surface p-2.5 shadow-lift duration-150"
                role="menu"
                aria-label="Tools menu"
              >
                <div className="mb-1 border-b border-border/60 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    AI Media Tools
                  </p>
                </div>

                <div className="space-y-1">
                  {TOOL_OPTIONS.map((tool) => {
                    const isSelected = pathname === tool.slug;
                    return (
                      <Link
                        key={tool.slug}
                        href={tool.slug}
                        onClick={() => setToolsOpen(false)}
                        role="menuitem"
                        aria-current={isSelected ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl p-2.5 transition-all duration-150",
                          isSelected
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-foreground/90 hover:bg-surface-strong hover:text-foreground",
                        )}
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-surface shadow-soft transition-transform duration-150 group-hover:scale-105">
                          <tool.icon className="h-4 w-4 text-primary" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold leading-none">{tool.name}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100" />
                          </div>
                          <p className="mt-1 truncate text-[11px] font-normal text-muted-foreground">
                            {tool.tagline}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/guides"
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-surface-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              pathname.startsWith("/guides") ? "text-foreground font-semibold" : "text-muted-foreground",
            )}
          >
            Guides
          </Link>

          <Link
            href="/how-it-works"
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-surface-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              pathname === "/how-it-works" ? "text-foreground font-semibold" : "text-muted-foreground",
            )}
          >
            How it works
          </Link>

          <Link
            href="/faq"
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-surface-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              pathname === "/faq" ? "text-foreground font-semibold" : "text-muted-foreground",
            )}
          >
            FAQ
          </Link>

          <Link
            href="/about"
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-surface-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              pathname === "/about" ? "text-foreground font-semibold" : "text-muted-foreground",
            )}
          >
            About
          </Link>

          <Link
            href="/contact"
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-surface-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              pathname === "/contact" ? "text-foreground font-semibold" : "text-muted-foreground",
            )}
          >
            Contact
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="min-h-10 min-w-10 rounded-[5px] border border-border/60 md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <div
        id="mobile-nav"
        className={cn(
          "overflow-hidden border-border/70 bg-background/95 backdrop-blur-xl transition-[max-height,opacity] duration-300 md:hidden",
          open ? "max-h-[85vh] overflow-y-auto border-t opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav aria-label="Mobile" className="section-shell flex flex-col gap-0.5 py-3">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-strong hover:text-foreground"
          >
            Home
          </Link>

          {/* Mobile Accordion for Converters */}
          <div className="my-0.5 rounded-xl border border-border/60 bg-surface/50 p-2">
            <button
              type="button"
              onClick={() => setMobileConvertersOpen((v) => !v)}
              aria-expanded={mobileConvertersOpen}
              className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold text-foreground"
            >
              <span className="flex items-center gap-2">
                <Repeat className="h-3.5 w-3.5 text-emerald-500" />
                <span>Converters</span>
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                  mobileConvertersOpen ? "rotate-180 text-primary" : "",
                )}
              />
            </button>

            {mobileConvertersOpen && (
              <div className="mt-1.5 space-y-1 border-t border-border/60 pt-1.5 animate-in fade-in duration-150">
                {CONVERTER_OPTIONS.map((conv) => (
                  <Link
                    key={conv.slug}
                    href={conv.slug}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === conv.slug ? "page" : undefined}
                    className="flex items-center gap-2.5 rounded-lg p-2 text-xs transition-colors hover:bg-surface-strong"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-surface">
                      <conv.icon className="h-3.5 w-3.5 text-primary" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground">{conv.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{conv.tagline}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Accordion for Tools */}
          <div className="my-0.5 rounded-xl border border-border/60 bg-surface/50 p-2">
            <button
              type="button"
              onClick={() => setMobileToolsOpen((v) => !v)}
              aria-expanded={mobileToolsOpen}
              className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold text-foreground"
            >
              <span className="flex items-center gap-2">
                <Wrench className="h-3.5 w-3.5 text-primary" />
                <span>Tools</span>
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                  mobileToolsOpen ? "rotate-180 text-primary" : "",
                )}
              />
            </button>

            {mobileToolsOpen && (
              <div className="mt-1.5 space-y-1 border-t border-border/60 pt-1.5 animate-in fade-in duration-150">
                {TOOL_OPTIONS.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={tool.slug}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === tool.slug ? "page" : undefined}
                    className="flex items-center gap-2.5 rounded-lg p-2 text-xs transition-colors hover:bg-surface-strong"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-surface">
                      <tool.icon className="h-3.5 w-3.5 text-primary" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground">{tool.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{tool.tagline}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/guides"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-strong hover:text-foreground"
          >
            Guides & Resources
          </Link>

          <Link
            href="/how-it-works"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-strong hover:text-foreground"
          >
            How it works
          </Link>

          <Link
            href="/faq"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-strong hover:text-foreground"
          >
            FAQ
          </Link>

          <Link
            href="/about"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-strong hover:text-foreground"
          >
            About
          </Link>

          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-strong hover:text-foreground"
          >
            Contact
          </Link>

        </nav>
      </div>
    </header>
  );
}
