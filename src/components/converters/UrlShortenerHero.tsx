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
  Globe,
  Download,
  ArrowRight,
  Clock,
  Eye,
  X,
  Layers,
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
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      width: 400,
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
        toast.success("URL pasted from clipboard");
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
      toast.success("Short URL generated successfully!");
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
      toast.success("Short URL copied to clipboard!");
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
        // User cancelled share
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
      toast.success("QR Code PNG downloaded!");
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
        toast.success("Vector QR Code SVG downloaded!");
      });
    }
  };

  // Preview full URL with UTM tags
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
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Main Shortener Form Card */}
      <div className="rounded-2xl border border-border/80 bg-surface p-5 sm:p-8 shadow-sm">
        <form onSubmit={handleShorten} className="space-y-5">
          {/* Main Input Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Destination URL
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-muted-foreground pointer-events-none">
                <Link2 className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="Paste long link here (e.g. https://example.com/very/long/article?ref=social)"
                className="w-full rounded-xl border border-border bg-surface-strong/90 py-3.5 pl-11 pr-24 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <div className="absolute right-2.5 flex items-center gap-1.5">
                {targetUrl && (
                  <button
                    type="button"
                    onClick={() => setTargetUrl("")}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
                    title="Clear input"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePaste}
                  className="h-8 rounded-lg px-2.5 text-xs font-semibold border-border/80 hover:bg-surface"
                >
                  Paste
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced Customization Options Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>
                {showAdvanced
                  ? "Hide Custom Alias & UTM Builder"
                  : "Customize Link, Alias & UTM Parameters"}
              </span>
              {showAdvanced ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Advanced Accordion Panel */}
          {showAdvanced && (
            <div className="space-y-5 rounded-xl border border-border/70 bg-surface-strong/50 p-4 sm:p-5 animate-in fade-in duration-200">
              {/* Row 1: Custom Alias & Provider */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-7 space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Custom Alias (Optional)
                  </label>
                  <div className="flex items-center rounded-lg border border-border bg-surface overflow-hidden focus-within:border-primary">
                    <span className="bg-surface-strong px-2.5 py-2 font-mono text-xs text-muted-foreground border-r border-border shrink-0 select-none">
                      /s/
                    </span>
                    <input
                      type="text"
                      value={customAlias}
                      onChange={(e) =>
                        setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))
                      }
                      placeholder="custom-name"
                      maxLength={40}
                      className="w-full bg-transparent px-3 py-2 text-xs font-mono font-medium text-foreground focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    3-40 alphanumeric characters, dashes, or underscores.
                  </p>
                </div>

                <div className="sm:col-span-5 space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Link Shortening Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="mediadocks">MediaDocks Direct (/s/)</option>
                    <option value="tinyurl">TinyURL (tinyurl.com)</option>
                    <option value="isgd">is.gd (is.gd/)</option>
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Direct includes custom alias, QR codes & link safety checks.
                  </p>
                </div>
              </div>

              {/* Row 2: UTM Campaign Builder */}
              <div className="pt-2 border-t border-border/60 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  <span>UTM Campaign Parameters Builder</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Campaign Source (utm_source)
                    </label>
                    <input
                      type="text"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      placeholder="e.g. twitter, newsletter"
                      className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Campaign Medium (utm_medium)
                    </label>
                    <input
                      type="text"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                      placeholder="e.g. social, email, cpc"
                      className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Campaign Name (utm_campaign)
                    </label>
                    <input
                      type="text"
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                      placeholder="e.g. summer_promo"
                      className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Live UTM Preview */}
                {(utmSource || utmMedium || utmCampaign) && (
                  <div className="rounded-lg bg-surface p-2.5 border border-border/60">
                    <span className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">
                      Appended Target Preview:
                    </span>
                    <span className="block text-[11px] font-mono text-primary break-all">
                      {getFullPreviewUrl()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !targetUrl.trim()}
            className="w-full h-12 rounded-xl text-sm font-semibold shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Shortening Link…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Shorten Link & Generate QR Code
              </>
            )}
          </Button>
        </form>

        {/* Feature Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 pt-5 border-t border-border/60 text-xs text-muted-foreground">
          <div className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Zero Tracking & Permanent Privacy</span>
          </div>
          <span>•</span>
          <div className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Never Expires · Free</span>
          </div>
          <span>•</span>
          <div className="inline-flex items-center gap-1.5">
            <QrCode className="h-3.5 w-3.5 text-blue-500" />
            <span>Built-in QR Codes (PNG & SVG)</span>
          </div>
        </div>
      </div>

      {/* Result Card: Displayed when a link is generated */}
      {result && (
        <div className="rounded-2xl border-2 border-primary/30 bg-surface p-5 sm:p-7 shadow-lg animate-in zoom-in-95 duration-200 space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Your Link is Ready!
              </h3>
            </div>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-primary uppercase">
              {result.provider}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Short Link & Actions */}
            <div className="md:col-span-8 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Shortened Link:
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-primary/40 bg-surface-strong px-4 py-3 font-mono text-sm sm:text-base font-bold text-primary select-all break-all shadow-inner">
                    {result.shortUrl}
                  </div>
                  <Button
                    onClick={() => copyShortUrl(result.shortUrl)}
                    className="h-12 px-5 rounded-xl font-semibold shrink-0 shadow-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1.5" /> Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Target Comparison */}
              <div className="rounded-xl border border-border/60 bg-surface-strong/50 p-3 space-y-1 text-xs">
                <span className="text-muted-foreground block text-[11px]">
                  Original Target URL:
                </span>
                <p className="font-mono text-muted-foreground break-all truncate" title={result.targetUrl}>
                  {result.targetUrl}
                </p>
                <div className="pt-1 flex items-center gap-2 text-[11px] font-medium text-emerald-500">
                  <Check className="h-3.5 w-3.5" />
                  <span>
                    Reduced from {result.targetUrl.length} to {result.shortUrl.length} characters (
                    {Math.round((1 - result.shortUrl.length / result.targetUrl.length) * 100)}%
                    shorter)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href={result.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-surface-strong transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Visit Link
                </a>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-surface-strong transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share Link
                </button>

                {result.provider === "mediadocks" && (
                  <a
                    href={`${result.shortUrl}?preview=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-surface-strong transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Safety Preview
                  </a>
                )}
              </div>
            </div>

            {/* Right: Embedded QR Code Card */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl border border-border/80 bg-surface-strong/70 text-center">
              <div className="p-3 bg-white rounded-lg shadow-sm mb-3">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Short URL QR Code"
                    className="h-28 w-28 object-contain"
                  />
                ) : (
                  <div className="h-28 w-28 flex items-center justify-center text-muted-foreground text-xs">
                    Generating QR…
                  </div>
                )}
              </div>

              <span className="text-xs font-semibold text-foreground block mb-2">
                Instant QR Code
              </span>

              <div className="flex items-center gap-1.5 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadQrCode("png")}
                  className="flex-1 h-7 rounded text-[11px] font-medium"
                >
                  <Download className="h-3 w-3 mr-1" /> PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadQrCode("svg")}
                  className="flex-1 h-7 rounded text-[11px] font-medium"
                >
                  <Download className="h-3 w-3 mr-1" /> SVG
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Links History */}
      {recentLinks.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-surface p-5 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Your Recent Short Links</h3>
              <span className="rounded-full bg-surface-strong px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                {recentLinks.length}
              </span>
            </div>
            <button
              type="button"
              onClick={clearAllRecent}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear History
            </button>
          </div>

          <div className="divide-y divide-border/60">
            {recentLinks.map((link) => (
              <div
                key={link.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary text-sm hover:underline cursor-pointer" onClick={() => copyShortUrl(link.shortUrl)}>
                      {link.shortUrl}
                    </span>
                    <span className="rounded bg-surface-strong px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground uppercase">
                      {link.provider}
                    </span>
                  </div>
                  <p className="truncate text-muted-foreground text-[11px] max-w-lg" title={link.targetUrl}>
                    ↳ {link.targetUrl}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyShortUrl(link.shortUrl)}
                    className="h-7 rounded-md px-2.5 text-xs font-medium"
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  <a
                    href={link.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-surface-strong transition-colors"
                    title="Open link"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => removeRecentLink(link.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-surface-strong"
                    title="Remove from history"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
