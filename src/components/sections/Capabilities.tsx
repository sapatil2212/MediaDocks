"use client";

import { useState } from "react";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Reveal } from "@/components/Reveal";
import { PLATFORMS } from "@/lib/platforms";
import { getPlatformPage } from "@/lib/platform-pages";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Sliders,
  HardDrive,
  Clock,
  ShieldCheck,
  Film,
  Music,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

const LIMITS = [
  {
    figure: "500 MB",
    label: "Maximum Single Payload",
    body: "Ample headroom for ~60 minutes at 1080p Full HD. Larger sources resolve at slightly lower rungs.",
    icon: HardDrive,
  },
  {
    figure: "30 min",
    label: "Stream Token Lifetime",
    body: "Resolved stream links expire after 30 minutes to preserve origin token freshness and security.",
    icon: Clock,
  },
  {
    figure: "0 bytes",
    label: "Persistent Server Retention",
    body: "Ephemeral in-memory streaming pipelines. Zero user files or media archives reside on disk.",
    icon: ShieldCheck,
  },
];

const FORMAT_PRESETS = [
  { id: "4k", label: "4K UHD 2160p", type: "video", mbPerMin: 55, bitrate: "24-35 Mbps", codec: "H.264 / VP9", badge: "Max Quality" },
  { id: "1080p", label: "Full HD 1080p", type: "video", mbPerMin: 18, bitrate: "6-10 Mbps", codec: "AVC1 / AAC", badge: "Recommended" },
  { id: "720p", label: "HD 720p", type: "video", mbPerMin: 8, bitrate: "3.5 Mbps", codec: "AVC1 / AAC", badge: "Fast" },
  { id: "480p", label: "SD 480p", type: "video", mbPerMin: 4, bitrate: "1.5 Mbps", codec: "AVC1", badge: "Compact" },
  { id: "mp3_320", label: "MP3 320 kbps", type: "audio", mbPerMin: 2.4, bitrate: "320 kbps CBR", codec: "LAME Transcode", badge: "Audiophile" },
  { id: "mp3_192", label: "MP3 192 kbps", type: "audio", mbPerMin: 1.4, bitrate: "192 kbps VBR", codec: "Balanced Audio", badge: "Standard" },
  { id: "m4a", label: "Original M4A", type: "audio", mbPerMin: 1.1, bitrate: "128-256 kbps", codec: "Direct AAC Pass-thru", badge: "Lossless" },
];

export function Capabilities() {
  const [durationMins, setDurationMins] = useState(4);
  const [selectedFormatId, setSelectedFormatId] = useState("1080p");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  const currentPreset = FORMAT_PRESETS.find((f) => f.id === selectedFormatId) || FORMAT_PRESETS[1];
  const estimatedSizeMb = Math.round(currentPreset.mbPerMin * durationMins * 10) / 10;
  const estimatedSecondsToDownload = Math.max(1, Math.round(estimatedSizeMb / 20)); // Assuming 20 MB/s connection

  const filteredPlatforms = PLATFORMS.filter((p) => {
    if (platformFilter === "all") return true;
    return p.id === platformFilter;
  });

  return (
    <section id="capabilities" className="scroll-mt-24 border-t border-border py-20 lg:py-28">
      <div className="section-shell">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Technical Capabilities</p>
          <h2 className="section-title mt-2">Verified outputs & format studio</h2>
          <p className="mt-3 text-muted-foreground">
            Explore live calculated file sizes, bitrates, codecs, and verified platform capabilities.
          </p>
        </Reveal>

        {/* Format Calculator Studio */}
        <Reveal delay={70} className="mt-10">
          <div className="panel overflow-hidden border-border/80 bg-surface p-6 shadow-lift sm:p-8">
            <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-bold text-foreground sm:text-lg">
                    Interactive Format & Bandwidth Estimator
                  </h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Simulate bitrate parameters and expected file size based on content duration.
                </p>
              </div>

              {/* Metric Card */}
              <div className="flex items-center gap-4 rounded-xl border border-border bg-surface-strong/60 px-4 py-2">
                <div className="text-right">
                  <span className="block text-[0.65rem] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                    Estimated Payload
                  </span>
                  <span className="font-mono text-lg font-bold text-foreground sm:text-xl">
                    {estimatedSizeMb >= 1000
                      ? `${(estimatedSizeMb / 1024).toFixed(2)} GB`
                      : `${estimatedSizeMb} MB`}
                  </span>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-left">
                  <span className="block text-[0.65rem] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                    Est. Stream Time
                  </span>
                  <span className="font-mono text-xs font-semibold text-primary">
                    ~{estimatedSecondsToDownload}s @ 20MB/s
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 grid gap-8 lg:grid-cols-12">
              {/* Duration Slider */}
              <div className="space-y-4 lg:col-span-5">
                <div className="flex items-center justify-between">
                  <label htmlFor="duration-range" className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Media Duration</span>
                  </label>
                  <span className="font-mono text-xs font-bold text-primary">
                    {durationMins >= 60 ? `${(durationMins / 60).toFixed(1)} hours` : `${durationMins} min`}
                  </span>
                </div>

                <input
                  id="duration-range"
                  type="range"
                  min="0.5"
                  max="60"
                  step="0.5"
                  value={durationMins}
                  onChange={(e) => setDurationMins(parseFloat(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-strong accent-primary"
                />

                <div className="flex justify-between text-[0.7rem] font-mono text-muted-foreground">
                  <span>30s Reel</span>
                  <span>5m Video</span>
                  <span>15m Show</span>
                  <span>60m Podcast</span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {[
                    { l: "30 sec", v: 0.5 },
                    { l: "3 min", v: 3 },
                    { l: "10 min", v: 10 },
                    { l: "30 min", v: 30 },
                    { l: "60 min", v: 60 },
                  ].map((p) => (
                    <button
                      key={p.l}
                      type="button"
                      onClick={() => setDurationMins(p.v)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium font-mono transition-colors ${
                        durationMins === p.v
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface-strong/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Selectors */}
              <div className="space-y-3 lg:col-span-7">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Film className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Target Format & Codec</span>
                  </span>
                  <span className="font-mono text-[0.7rem] text-muted-foreground">
                    Codec: {currentPreset.codec}
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {FORMAT_PRESETS.map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setSelectedFormatId(fmt.id)}
                      className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                        selectedFormatId === fmt.id
                          ? "border-primary bg-primary/10 ring-1 ring-primary shadow-soft"
                          : "border-border bg-surface-strong/40 hover:border-border hover:bg-surface"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {fmt.type === "video" ? (
                          <Film className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Music className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="text-xs font-bold text-foreground">{fmt.label}</span>
                      </div>
                      <span className="text-[0.65rem] text-primary font-medium">{fmt.badge}</span>
                      <span className="font-mono text-[0.65rem] text-muted-foreground">{fmt.bitrate}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Output Matrix Table */}
        <Reveal delay={120} className="mt-12">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h3 className="text-base font-bold text-foreground sm:text-lg">
              Per-Platform Extraction Matrix
            </h3>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setPlatformFilter("all")}
                className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                  platformFilter === "all"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                All Platforms
              </button>
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatformFilter(p.id)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                    platformFilter === p.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="panel mt-4 overflow-hidden border-border/80 bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-surface-strong/60 border-b border-border">
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                      Platform
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                      Available Output Formats
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                      Extraction Protocol & Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlatforms.map((platform) => {
                    const page = getPlatformPage(platform.id);
                    return (
                      <tr key={platform.id} className="rule-row align-top hover:bg-surface-strong/30 transition-colors">
                        <th scope="row" className="px-5 py-4 font-semibold whitespace-nowrap">
                          <Link
                            href={page.slug}
                            className="focus-ring inline-flex items-center gap-2 rounded-md hover:text-primary transition-colors"
                          >
                            <PlatformIcon
                              platform={platform.id}
                              className={cn("h-4 w-4", platform.colorClass)}
                            />
                            {platform.name}
                          </Link>
                        </th>
                        <td className="figure-mono px-5 py-4 text-xs font-medium text-foreground">
                          {platform.outputs}
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">
                          {platform.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* 3 Hard Limits */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {LIMITS.map((limit, i) => {
            const Icon = limit.icon;
            return (
              <Reveal key={limit.label} delay={i * 70}>
                <div className="panel group flex h-full flex-col justify-between p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-lift">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xl font-bold tracking-tight text-primary">
                        {limit.figure}
                      </span>
                      <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">{limit.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{limit.body}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
