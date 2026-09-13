"use client";

import { useState } from "react";
import { Reveal } from "@/components/Reveal";
import { Search, AlertCircle, CheckCircle2, ChevronRight, HelpCircle, RefreshCw } from "lucide-react";
import { requestUrl } from "@/lib/scroll";
import { toast } from "sonner";

interface TroubleCase {
  id: string;
  category: "quality" | "access" | "limits" | "speed";
  seen: string;
  why: string;
  fix: string;
  canRetry?: boolean;
}

const CASES: TroubleCase[] = [
  {
    id: "expired",
    category: "limits",
    seen: "This link has expired",
    why: "A resolved link is only valid for 30 minutes, so zero residual data lingers on the server.",
    fix: "Paste the same URL again to generate a fresh stream descriptor.",
    canRetry: true,
  },
  {
    id: "360p-hd",
    category: "quality",
    seen: "Only 360p / 720p is offered on a video you know is 4K / HD",
    why: "Higher resolutions arrive as separate video and audio streams that must be combined on demand.",
    fix: "Pick the highest offered rung or check back in a moment while the stream indexes.",
  },
  {
    id: "private",
    category: "access",
    seen: "This content is private or unavailable",
    why: "The post is behind a login, restricted to private followers/friends, age-gated, or has been removed.",
    fix: "Ensure the content is publicly visible without logging into an account.",
  },
  {
    id: "size-limit",
    category: "limits",
    seen: "This file is larger than the limit (500 MB)",
    why: "Single downloads are capped at 500 MB to keep the streaming pipeline ultra-fast for everyone.",
    fix: "Pick a lower resolution (e.g. 1080p instead of 4K), or download the audio MP3 track.",
  },
  {
    id: "preparing",
    category: "speed",
    seen: "The download sits at 'Preparing' for a while",
    why: "Video and audio streams are being fetched, muxed, and buffered before sending to your browser.",
    fix: "Give it 15-60 seconds for long HD videos. Lower rungs and audio download almost instantly.",
  },
  {
    id: "rate-limit",
    category: "limits",
    seen: "Please wait a moment and try again",
    why: "A light rate limit allows up to 5 concurrent downloads per minute per visitor.",
    fix: "Wait about 45 seconds, then resume your downloads.",
    canRetry: true,
  },
];

const CATEGORIES = [
  { id: "all", label: "All Topics" },
  { id: "quality", label: "Quality & Formats" },
  { id: "access", label: "Private & Logins" },
  { id: "limits", label: "File & Rate Limits" },
  { id: "speed", label: "Speed & Buffering" },
];

export function Troubleshooting() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredCases = CASES.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesQuery =
      query.trim() === "" ||
      item.seen.toLowerCase().includes(query.toLowerCase()) ||
      item.why.toLowerCase().includes(query.toLowerCase()) ||
      item.fix.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <section id="troubleshooting" className="scroll-mt-24 border-t border-border py-20 lg:py-24">
      <div className="section-shell">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Interactive Troubleshooting</p>
            <h2 className="section-title mt-2">Instant diagnostic & fix finder</h2>
            <p className="mt-3 text-muted-foreground">
              Search any symptom or error message to get the exact reason and instant resolution.
            </p>
          </Reveal>

          {/* Real-time Search Input */}
          <Reveal delay={70} className="w-full md:w-80">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search error or symptom..."
                className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-soft"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </Reveal>
        </div>

        {/* Category Pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? "border-primary bg-primary text-primary-foreground shadow-soft"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Interactive Problem / Resolution Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {filteredCases.length === 0 ? (
            <div className="col-span-2 rounded-2xl border border-dashed border-border p-8 text-center">
              <HelpCircle className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">No matching troubleshooting items found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try searching with different terms or select &quot;All Topics&quot;.
              </p>
            </div>
          ) : (
            filteredCases.map((item, i) => {
              const isExpanded = expandedId === item.id;

              return (
                <Reveal key={item.id} delay={(i % 2) * 60}>
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className={`panel group cursor-pointer p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-lift ${
                      isExpanded ? "ring-2 ring-primary/20 border-primary" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                          <AlertCircle className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {item.seen}
                          </h3>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          isExpanded ? "rotate-90 text-primary" : ""
                        }`}
                      />
                    </div>

                    <div className="mt-3 pl-9 space-y-2 text-xs">
                      <p className="text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground">Why this happens:</span> {item.why}
                      </p>
                      <div className="flex items-start gap-2 rounded-lg bg-surface-strong p-2.5">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                        <p className="text-foreground font-medium">{item.fix}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
