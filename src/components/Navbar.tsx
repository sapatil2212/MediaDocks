"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronDown,
  Music2,
  Sparkles,
  ArrowRight,
  AudioLines,
  Captions,
  FileVideo2,
  ListChecks,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PlatformIcon } from "@/components/PlatformIcon";
import { getPlatform } from "@/lib/platforms";
import { PLATFORM_PAGES } from "@/lib/platform-pages";
import { scrollToDownloader } from "@/lib/scroll";
import { cn } from "@/lib/utils";

interface DownloaderItem {
  name: string;
  slug: string;
  tagline: string;
  platform?: "youtube" | "instagram" | "x" | "pinterest" | "facebook";
  isAudio?: boolean;
}

/**
 * The AI media tools.
 *
 * These used to be one top-level link. They now live behind a "Tools" menu so
 * transcription, summarizing and subtitling are presented as siblings, and they
 * are deliberately not repeated in the Downloaders menu — the same destination
 * in two menus makes it unclear which one is canonical.
 */
const TOOL_OPTIONS: Array<{
  name: string;
  slug: string;
  tagline: string;
  icon: typeof FileVideo2;
}> = [
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

const DOWNLOADER_OPTIONS: DownloaderItem[] = [
  {
    name: "YouTube Downloader",
    slug: "/yt-downloader",
    tagline: "4K & 1080p MP4, Shorts & 60fps",
    platform: "youtube",
  },
  {
    name: "YouTube to MP3",
    slug: "/youtube-to-mp3",
    tagline: "320kbps & 192kbps High-Res Audio",
    platform: "youtube",
    isAudio: true,
  },
  {
    name: "Instagram Downloader",
    slug: "/insta-downloader",
    tagline: "Reels, Video Posts & Photos",
    platform: "instagram",
  },
  {
    name: "X (Twitter) Downloader",
    slug: "/x-downloader",
    tagline: "Videos, Clips & High-Res Media",
    platform: "x",
  },
  {
    name: "Facebook Downloader",
    slug: "/fb-downloader",
    tagline: "Public Reels & HD Videos",
    platform: "facebook",
  },
  {
    name: "Pinterest Downloader",
    slug: "/pinterest-downloader",
    tagline: "Video Pins & High-Res Images",
    platform: "pinterest",
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [pathname, setPathname] = useState("");
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toolsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  };

  const handleToolsEnter = () => {
    if (toolsTimeoutRef.current) clearTimeout(toolsTimeoutRef.current);
    setToolsOpen(true);
  };

  const handleToolsLeave = () => {
    toolsTimeoutRef.current = setTimeout(() => setToolsOpen(false), 150);
  };

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

  const isToolPath = TOOL_OPTIONS.some((tool) => tool.slug === pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-background/40 backdrop-blur-sm",
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
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              pathname === "/" ? "text-foreground font-semibold" : "text-muted-foreground",
            )}
          >
            Home
          </Link>

          {/* Interactive Downloaders Dropdown */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                dropdownOpen || pathname.includes("-downloader") || pathname === "/youtube-to-mp3"
                  ? "text-foreground font-semibold bg-surface-strong/60"
                  : "text-muted-foreground",
              )}
            >
              <span>Downloaders</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200 text-muted-foreground group-hover:text-foreground",
                  dropdownOpen ? "rotate-180 text-primary" : "",
                )}
                aria-hidden="true"
              />
            </button>

            {/* Dropdown Menu Panel */}
            {dropdownOpen && (
              <div
                className="absolute left-0 top-full z-50 mt-1.5 w-[360px] animate-in fade-in zoom-in-95 duration-150 rounded-2xl border border-border/80 bg-surface/95 p-2.5 shadow-lift backdrop-blur-2xl"
                role="menu"
                aria-label="Downloaders menu"
              >
                <div className="px-3 py-2 border-b border-border/60 mb-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Available Downloaders
                  </p>
                </div>

                <div className="space-y-1">
                  {DOWNLOADER_OPTIONS.map((item) => {
                    const isSelected = pathname === item.slug;
                    return (
                      <Link
                        key={item.slug}
                        href={item.slug}
                        onClick={() => setDropdownOpen(false)}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl p-2.5 transition-all duration-150",
                          isSelected
                            ? "bg-primary/10 text-primary font-semibold"
                            : "hover:bg-surface-strong hover:text-foreground text-foreground/90",
                        )}
                        role="menuitem"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface shadow-soft transition-transform duration-150 group-hover:scale-105">
                          {item.isAudio ? (
                            <Music2 className="h-4 w-4 text-indigo-500" />
                          ) : (
                            item.platform && <PlatformIcon platform={item.platform} className="h-4 w-4" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold leading-none sm:text-sm">{item.name}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0.5" />
                          </div>
                          <p className="mt-1 text-[0.7rem] text-muted-foreground font-normal truncate">
                            {item.tagline}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-2 border-t border-border/60 pt-2 px-2">
                  <Link
                    href="/#capabilities"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface-strong hover:text-primary"
                  >
                    <span>View comparison & format matrix</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
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
                "group inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                toolsOpen || isToolPath
                  ? "bg-surface-strong/60 font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <span>Tools</span>
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-primary">
                AI
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:text-foreground",
                  toolsOpen ? "rotate-180 text-primary" : "",
                )}
                aria-hidden="true"
              />
            </button>

            {toolsOpen && (
              <div
                className="absolute left-0 top-full z-50 mt-1.5 w-[320px] animate-in fade-in zoom-in-95 rounded-2xl border border-border/80 bg-surface/95 p-2.5 shadow-lift backdrop-blur-2xl duration-150"
                role="menu"
                aria-label="Tools menu"
              >
                <div className="mb-1 border-b border-border/60 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface shadow-soft transition-transform duration-150 group-hover:scale-105">
                          <tool.icon className="h-4 w-4 text-primary" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold leading-none sm:text-sm">{tool.name}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100" />
                          </div>
                          <p className="mt-1 truncate text-[0.7rem] font-normal text-muted-foreground">
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
            href="/how-it-works"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              pathname === "/how-it-works" ? "text-foreground font-semibold" : "text-muted-foreground",
            )}
          >
            How it works
          </Link>

          <Link
            href="/faq"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              pathname === "/faq" ? "text-foreground font-semibold" : "text-muted-foreground",
            )}
          >
            FAQ
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            onClick={scrollToDownloader}
            className="hidden h-10 rounded-xl px-4 text-sm font-semibold shadow-glow transition-transform hover:-translate-y-0.5 sm:inline-flex"
          >
            Start Downloading
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="min-h-10 min-w-10 rounded-xl border border-border/60 md:hidden"
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
        <nav aria-label="Mobile" className="section-shell flex flex-col gap-1 py-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="rounded-xl px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:bg-surface-strong hover:text-foreground"
          >
            Home
          </Link>

          {/* Mobile Accordion for Downloaders */}
          <div className="rounded-xl border border-border/60 bg-surface/50 p-2 my-1">
            <button
              type="button"
              onClick={() => setMobileDropdownOpen((v) => !v)}
              className="flex w-full items-center justify-between px-2 py-2 text-sm font-semibold text-foreground"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>All Downloaders</span>
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  mobileDropdownOpen ? "rotate-180 text-primary" : "",
                )}
              />
            </button>

            {mobileDropdownOpen && (
              <div className="mt-2 space-y-1 border-t border-border/60 pt-2 animate-in fade-in duration-150">
                {DOWNLOADER_OPTIONS.map((item) => (
                  <Link
                    key={item.slug}
                    href={item.slug}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg p-2 text-sm transition-colors hover:bg-surface-strong"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-surface">
                      {item.isAudio ? (
                        <Music2 className="h-3.5 w-3.5 text-indigo-500" />
                      ) : (
                        item.platform && <PlatformIcon platform={item.platform} className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs text-foreground">{item.name}</p>
                      <p className="text-[0.65rem] text-muted-foreground truncate">{item.tagline}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Accordion for Tools */}
          <div className="my-1 rounded-xl border border-border/60 bg-surface/50 p-2">
            <button
              type="button"
              onClick={() => setMobileToolsOpen((v) => !v)}
              aria-expanded={mobileToolsOpen}
              className="flex w-full items-center justify-between px-2 py-2 text-sm font-semibold text-foreground"
            >
              <span className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <span>Tools</span>
                <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  AI
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  mobileToolsOpen ? "rotate-180 text-primary" : "",
                )}
              />
            </button>

            {mobileToolsOpen && (
              <div className="mt-2 space-y-1 border-t border-border/60 pt-2 animate-in fade-in duration-150">
                {TOOL_OPTIONS.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={tool.slug}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === tool.slug ? "page" : undefined}
                    className="flex items-center gap-3 rounded-lg p-2 text-sm transition-colors hover:bg-surface-strong"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-surface">
                      <tool.icon className="h-3.5 w-3.5 text-primary" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground">{tool.name}</p>
                      <p className="truncate text-[0.65rem] text-muted-foreground">{tool.tagline}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/how-it-works"
            onClick={() => setOpen(false)}
            className="rounded-xl px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:bg-surface-strong hover:text-foreground"
          >
            How it works
          </Link>

          <Link
            href="/faq"
            onClick={() => setOpen(false)}
            className="rounded-xl px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:bg-surface-strong hover:text-foreground"
          >
            FAQ
          </Link>

          <Button
            onClick={() => {
              setOpen(false);
              scrollToDownloader();
            }}
            className="mt-3 h-12 rounded-xl text-base font-semibold shadow-glow"
          >
            Start Downloading
          </Button>
        </nav>
      </div>
    </header>
  );
}
