"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  Link2,
  Copy,
  ExternalLink,
  QrCode,
  Sparkles,
  Check,
  RefreshCw,
  Trash2,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Download,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShortenResult {
  shortUrl: string;
  slug: string;
  targetUrl: string;
  clicks: number;
  createdAt?: number;
  provider: "mediadocks" | "tinyurl" | "isgd";
  customAlias?: boolean;
}

interface RecentLink {
  id: string;
  shortUrl: string;
  slug: string;
  targetUrl: string;
  createdAt: number;
  provider: string;
}

export function UrlShortenerHero() {
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [customAlias, setCustomAlias] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [provider, setProvider] = useState<"mediadocks" | "tinyurl" | "isgd">("mediadocks");

  // UTM parameters
  const [utmSource, setUtmSource] = useState<string>("");
  const [utmMedium, setUtmMedium] = useState<string>("");
  const [utmCampaign, setUtmCampaign] = useState<string>("");
  const [utmTerm, setUtmTerm] = useState<string>("");
  const [utmContent, setUtmContent] = useState<string>("");

  // States
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [recentLinks, setRecentLinks] = useState<RecentLink[]>([]);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Load recent links from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("md_recent_short_links");
      if (stored) {
        setRecentLinks(JSON.parse(stored));
      }
    } catch {
      // Ignored
    }
  }, []);

  const saveRecentLink = (item: ShortenResult) => {
    try {
      const newEntry: RecentLink = {
        id: `${item.slug}_${Date.now()}`,
        shortUrl: item.shortUrl,
        slug: item.slug,
        targetUrl: item.targetUrl,
        createdAt: item.createdAt || Date.now(),
        provider: item.provider,
      };

      const updated = [newEntry, ...recentLinks.filter((r) => r.slug !== item.slug)].slice(0, 8);
      setRecentLinks(updated);
      localStorage.setItem("md_recent_short_links", JSON.stringify(updated));
    } catch {
      // Ignored
    }
  };

  const removeRecentLink = (id: string) => {
    const updated = recentLinks.filter((r) => r.id !== id);
    setRecentLinks(updated);
    try {
      localStorage.setItem("md_recent_short_links", JSON.stringify(updated));
    } catch {
      // Ignored
    }
  };

  const clearAllRecent = () => {
    setRecentLinks([]);
    try {
      localStorage.removeItem("md_recent_short_links");
      toast.success("History cleared");
    } catch {
      // Ignored
    }
  };

  // Generate QR Code when a result is created
  useEffect(() => {
    if (!result?.shortUrl) return;

    void QRCode.toDataURL(result.shortUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    }).then((url) => {
      setQrCodeDataUrl(url);
    });
  }, [result]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTargetUrl(text.trim());
        toast.success("URL pasted");
      }
    } catch {
      toast.error("Could not access clipboard");
    }
  };

  const handleShorten = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    let urlToShorten = targetUrl.trim();
    if (!urlToShorten) {
      toast.error("Please enter a destination URL");
      return;
    }

    if (!/^https?:\/\//i.test(urlToShorten)) {
      urlToShorten = `https://${urlToShorten}`;
      setTargetUrl(urlToShorten);
    }

    setLoading(true);
    setCopied(false);

    try {
      const payload: any = {
        url: urlToShorten,
        provider,
      };

      if (customAlias.trim()) {
        payload.customAlias = customAlias.trim();
      }

      if (utmSource || utmMedium || utmCampaign || utmTerm || utmContent) {
        payload.utm = {
          source: utmSource,
          medium: utmMedium,
          campaign: utmCampaign,
          term: utmTerm,
          content: utmContent,
        };
      }

      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to shorten URL.");
      }

      setResult(data);
      saveRecentLink(data);
      toast.success("Short URL generated!");
    } catch (err: any) {
      toast.error(err?.message || "Error generating short link");
    } finally {
      setLoading(false);
    }
  };

  const copyShortUrl = async (urlToCopy = result?.shortUrl) => {
    if (!urlToCopy) return;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      toast.success("Short URL copied!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    if (!result?.shortUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "MediaDocks Short Link",
          url: result.shortUrl,
        });
      } catch {
        // Cancelled
      }
    } else {
      void copyShortUrl(result.shortUrl);
    }
  };

  const downloadQrCode = (fmt: "png" | "svg") => {
    if (!result?.shortUrl) return;

    if (fmt === "png" && qrCodeDataUrl) {
      const a = document.createElement("a");
      a.href = qrCodeDataUrl;
      a.download = `qrcode_${result.slug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("QR Code downloaded!");
    } else {
      void QRCode.toString(result.shortUrl, {
        type: "svg",
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      }).then((svg) => {
        const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qrcode_${result.slug}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Vector QR Code downloaded!");
      });
    }
  };

  const getFullPreviewUrl = (): string => {
    if (!targetUrl.trim()) return "";
    try {
      const base = /^https?:\/\//i.test(targetUrl.trim())
        ? targetUrl.trim()
        : `https://${targetUrl.trim()}`;
      const parsed = new URL(base);
      if (utmSource.trim()) parsed.searchParams.set("utm_source", utmSource.trim());
      if (utmMedium.trim()) parsed.searchParams.set("utm_medium", utmMedium.trim());
      if (utmCampaign.trim()) parsed.searchParams.set("utm_campaign", utmCampaign.trim());
      if (utmTerm.trim()) parsed.searchParams.set("utm_term", utmTerm.trim());
      if (utmContent.trim()) parsed.searchParams.set("utm_content", utmContent.trim());
      return parsed.toString();
    } catch {
      return targetUrl;
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Main Shortener Form Card: Zero shadow, compact professional sizing */}
      <div className="rounded-xl border border-border/80 bg-surface p-4 sm:p-5 shadow-none">
        <form onSubmit={handleShorten} className="space-y-4">
          {/* Main Input Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Destination URL
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-muted-foreground pointer-events-none">
                <Link2 className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="Paste link to shorten (e.g. https://example.com/very/long/url)"
                className="w-full rounded-[4px] border border-border bg-surface-strong px-9 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none transition-colors"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {targetUrl && (
                  <button
                    type="button"
                    onClick={() => setTargetUrl("")}
                    className="rounded-[3px] p-1 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
                    title="Clear input"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePaste}
                  className="h-[26px] rounded-[4px] px-2 text-[11px] font-medium border-border/80 hover:bg-surface shadow-none"
                >
                  Paste
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>
                {showAdvanced
                  ? "Hide custom alias & UTM settings"
                  : "Customize alias & UTM parameters"}
              </span>
              {showAdvanced ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Advanced Panel */}
          {showAdvanced && (
            <div className="space-y-4 rounded-lg border border-border/70 bg-surface-strong/60 p-3.5 sm:p-4 text-xs shadow-none animate-in fade-in duration-150">
              {/* Custom Alias & Provider */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                <div className="sm:col-span-7 space-y-1">
                  <label className="block text-[11px] font-medium text-muted-foreground">
                    Custom Alias (Optional)
                  </label>
                  <div className="flex items-center rounded-[4px] border border-border bg-surface overflow-hidden focus-within:border-primary">
                    <span className="bg-surface-strong px-2 py-1 font-mono text-[11px] text-muted-foreground border-r border-border shrink-0 select-none">
                      /s/
                    </span>
                    <input
                      type="text"
                      value={customAlias}
                      onChange={(e) =>
                        setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))
                      }
                      placeholder="custom-alias"
                      maxLength={40}
                      className="w-full bg-transparent px-2.5 py-1 text-xs font-mono font-medium text-foreground focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    3-40 alphanumeric characters, dashes, or underscores.
                  </p>
                </div>

                <div className="sm:col-span-5 space-y-1">
                  <label className="block text-[11px] font-medium text-muted-foreground">
                    Shortening Service
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as any)}
                    className="w-full rounded-[4px] border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="mediadocks">MediaDocks Direct (/s/)</option>
                    <option value="tinyurl">TinyURL (tinyurl.com)</option>
                    <option value="isgd">is.gd (is.gd/)</option>
                  </select>
                </div>
              </div>

              {/* UTM Campaign Builder */}
              <div className="pt-2 border-t border-border/60 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  <span>UTM Campaign Builder</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                      utm_source
                    </label>
                    <input
                      type="text"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      placeholder="twitter, newsletter"
                      className="w-full rounded-[4px] border border-border bg-surface px-2 py-1 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                      utm_medium
                    </label>
                    <input
                      type="text"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                      placeholder="social, email, cpc"
                      className="w-full rounded-[4px] border border-border bg-surface px-2 py-1 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                      utm_campaign
                    </label>
                    <input
                      type="text"
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                      placeholder="summer_promo"
                      className="w-full rounded-[4px] border border-border bg-surface px-2 py-1 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {(utmSource || utmMedium || utmCampaign) && (
                  <div className="rounded-[4px] bg-surface p-2 border border-border/60">
                    <span className="block text-[10px] font-mono text-muted-foreground mb-0.5">
                      Target preview:
                    </span>
                    <span className="block text-[11px] font-mono text-primary break-all">
                      {getFullPreviewUrl()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1 gap-3">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-500" /> 100% In-Browser Privacy
              </span>
              <span>·</span>
              <span>No Expiration</span>
            </div>

            <Button
              type="submit"
              disabled={loading || !targetUrl.trim()}
              className="h-[34px] rounded-[4px] px-4 text-xs font-medium shadow-none shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Shortening…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Shorten URL
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Result Card: Zero shadow, compact, professional */}
      {result && (
        <div className="rounded-xl border border-border/80 bg-surface p-4 sm:p-5 shadow-none space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-semibold text-foreground">
                Short URL Ready
              </h3>
            </div>
            <span className="rounded-[3px] bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono font-bold text-primary uppercase">
              {result.provider}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left: Short Link & Controls */}
            <div className="md:col-span-8 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Shortened Link:
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[34px] rounded-[4px] border border-border bg-surface-strong px-3 flex items-center font-mono text-xs font-bold text-primary select-all break-all shadow-none">
                    {result.shortUrl}
                  </div>
                  <Button
                    onClick={() => copyShortUrl(result.shortUrl)}
                    className="h-[34px] rounded-[4px] px-3.5 text-xs font-medium shadow-none shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Target info */}
              <div className="rounded-[4px] border border-border/60 bg-surface-strong/40 p-2.5 text-xs space-y-1">
                <span className="text-muted-foreground block text-[10px]">
                  Original target:
                </span>
                <p className="font-mono text-muted-foreground text-[11px] break-all truncate" title={result.targetUrl}>
                  {result.targetUrl}
                </p>
                <div className="pt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3" />
                  <span>
                    Reduced from {result.targetUrl.length} to {result.shortUrl.length} characters (
                    {Math.round((1 - result.shortUrl.length / result.targetUrl.length) * 100)}% shorter)
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <a
                  href={result.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-[4px] border border-border/80 bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-surface-strong transition-colors shadow-none"
                >
                  <ExternalLink className="h-3 w-3" />
                  Visit link
                </a>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1 rounded-[4px] border border-border/80 bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-surface-strong transition-colors shadow-none"
                >
                  <Share2 className="h-3 w-3" />
                  Share
                </button>

                {result.provider === "mediadocks" && (
                  <a
                    href={`${result.shortUrl}?preview=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-[4px] border border-border/80 bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-surface-strong transition-colors shadow-none"
                  >
                    <Eye className="h-3 w-3" />
                    Safety check
                  </a>
                )}
              </div>
            </div>

            {/* Right: Compact QR code */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-3 rounded-lg border border-border/60 bg-surface-strong/40 text-center">
              <div className="p-2 bg-white rounded-[4px] border border-border mb-2 shadow-none">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Short URL QR Code"
                    className="h-20 w-20 object-contain"
                  />
                ) : (
                  <div className="h-20 w-20 flex items-center justify-center text-muted-foreground text-[10px]">
                    QR Code
                  </div>
                )}
              </div>

              <span className="text-[11px] font-semibold text-foreground block mb-2">
                Scan QR Code
              </span>

              <div className="flex items-center gap-1.5 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadQrCode("png")}
                  className="flex-1 h-[26px] rounded-[4px] px-1 text-[10px] font-medium shadow-none"
                >
                  <Download className="h-3 w-3 mr-1" /> PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadQrCode("svg")}
                  className="flex-1 h-[26px] rounded-[4px] px-1 text-[10px] font-medium shadow-none"
                >
                  <Download className="h-3 w-3 mr-1" /> SVG
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Links History: Zero shadow, compact table style */}
      {recentLinks.length > 0 && (
        <div className="rounded-xl border border-border/80 bg-surface p-4 sm:p-5 shadow-none space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <span className="text-xs font-semibold text-foreground">
              Recent Short Links ({recentLinks.length})
            </span>
            <button
              type="button"
              onClick={clearAllRecent}
              className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear history
            </button>
          </div>

          <div className="divide-y divide-border/50">
            {recentLinks.map((link) => (
              <div
                key={link.id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono font-semibold text-primary text-xs hover:underline cursor-pointer"
                      onClick={() => copyShortUrl(link.shortUrl)}
                    >
                      {link.shortUrl}
                    </span>
                    <span className="rounded bg-surface-strong px-1.5 py-0.2 text-[9px] font-mono text-muted-foreground uppercase">
                      {link.provider}
                    </span>
                  </div>
                  <p className="truncate text-muted-foreground text-[11px] max-w-md" title={link.targetUrl}>
                    ↳ {link.targetUrl}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyShortUrl(link.shortUrl)}
                    className="h-[26px] rounded-[4px] px-2 text-[11px] font-medium shadow-none"
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  <a
                    href={link.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-[26px] w-[26px] rounded-[4px] border border-border text-muted-foreground hover:text-foreground hover:bg-surface-strong transition-colors"
                    title="Open link"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => removeRecentLink(link.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded-[4px] hover:bg-surface-strong"
                    title="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
