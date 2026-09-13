"use client";

import { useState } from "react";
import { Reveal } from "@/components/Reveal";
import { requestUrl } from "@/lib/scroll";
import { toast } from "sonner";
import {
  Link2,
  Cpu,
  DownloadCloud,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Terminal,
  Activity,
  Layers,
  ShieldCheck,
} from "lucide-react";

interface PipelineStage {
  id: number;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  metrics: { label: string; value: string }[];
  consoleLog: string[];
}

const STAGES: PipelineStage[] = [
  {
    id: 1,
    code: "01_INGEST",
    title: "URL Ingestion & Auto-Detection",
    subtitle: "Real-time protocol & platform handshake",
    description:
      "When a URL is submitted, the ingestion engine identifies the target provider within milliseconds. It parses short URLs, vanity links, and query parameters without making unauthorized tracking calls.",
    metrics: [
      { label: "Handshake Latency", value: "< 80 ms" },
      { label: "Supported Platforms", value: "5 Native Extractor Modules" },
      { label: "Link Sanitization", value: "Strict SSRF & URL Filter" },
    ],
    consoleLog: [
      "[ingest] Target URL validated and normalized",
      "[detector] Platform identified: YouTube (Video ID: dQw4w9WgXcQ)",
      "[security] SSRF boundary check passed (allowlist verified)",
      "[handshake] Upstream metadata queried without user identity headers",
    ],
  },
  {
    id: 2,
    code: "02_RESOLVE",
    title: "Adaptive Format Matrix Resolution",
    subtitle: "Dynamic stream indexing across 4K, 1080p, and MP3",
    description:
      "The engine requests the remote manifest and catalogues every published stream rung. Video and audio streams are separated and matched to ensure maximum resolution and lossless audio tracks.",
    metrics: [
      { label: "Max Resolution", value: "4K 2160p @ 60 FPS" },
      { label: "Audio Transcoding", value: "320 kbps CBR / Lossless M4A" },
      { label: "Manifest Parsing", value: "DASH & HLS Adaptive Parser" },
    ],
    consoleLog: [
      "[manifest] 8 video format rungs catalogued (144p → 2160p)",
      "[codecs] Video stream: AVC1 / VP09 / AV01 verified",
      "[audio] Extracted audio stream: 44.1kHz AAC stereo @ 160kbps",
      "[matrix] Remux target generated: MP4 (H.264 + AAC)",
    ],
  },
  {
    id: 3,
    code: "03_DELIVER",
    title: "Direct Pipe Streaming & Memory Cleanup",
    subtitle: "Zero-disk retention, multi-chunk high speed transfer",
    description:
      "Files are muxed through an ephemeral stream buffer directly to your browser's download manager. Once the connection closes, all temporary buffers are instantly purged with zero storage footprints.",
    metrics: [
      { label: "Storage Retention", value: "0 bytes kept on disk" },
      { label: "Throughput", value: "Uncapped multi-threaded stream" },
      { label: "Privacy Policy", value: "No logs, no cookie tracking" },
    ],
    consoleLog: [
      "[stream] Pipeline initialized with ephemeral memory buffer",
      "[muxer] FFmpeg demuxing video/audio chunks in real time",
      "[pipe] HTTP response headers: Content-Disposition attachment",
      "[cleanup] Stream flushed and temporary process terminated (0 residual files)",
    ],
  },
];

export function HowItWorks({ id = "how-it-works" }: { id?: string }) {
  const [activeStageId, setActiveStageId] = useState(1);
  const currentStage = STAGES.find((s) => s.id === activeStageId) || STAGES[0];

  return (
    <section id={id} className="scroll-mt-24 border-t border-border bg-surface-strong/20 py-20 lg:py-28">
      <div className="section-shell">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <Reveal className="max-w-xl">
            <p className="eyebrow">System Architecture</p>
            <h2 className="section-title mt-2">How the streaming pipeline works</h2>
            <p className="mt-3 text-muted-foreground">
              A transparent look at how MediaDocks ingests public links, parses adaptive streams, and delivers high-bitrate media.
            </p>
          </Reveal>

          <Reveal delay={90}>
            <button
              onClick={() => {
                requestUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
                toast.info("Sample video loaded into Downloader");
              }}
              className="focus-ring group inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-foreground shadow-soft transition-all hover:border-primary/50 hover:bg-surface-strong hover:shadow-lift"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Test with Live Sample Link</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </button>
          </Reveal>
        </div>

        {/* Pipeline Stage Tabs */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {STAGES.map((stage) => {
            const isActive = activeStageId === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStageId(stage.id)}
                className={`group flex flex-col items-start rounded-2xl border p-5 text-left transition-all duration-200 ${
                  isActive
                    ? "border-primary bg-surface shadow-lift ring-1 ring-primary/30"
                    : "border-border/70 bg-surface/50 hover:border-border hover:bg-surface"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground group-hover:text-foreground">
                    {stage.code}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full transition-colors ${
                      isActive ? "bg-primary animate-pulse" : "bg-border"
                    }`}
                  />
                </div>
                <h3 className="mt-3 text-base font-bold text-foreground">{stage.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{stage.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Precision Architecture Console */}
        <Reveal delay={120} className="mt-6">
          <div className="panel overflow-hidden border-border/80 bg-surface p-6 shadow-lift sm:p-8">
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
              {/* Stage Detail Column */}
              <div className="flex flex-col justify-between space-y-6 lg:col-span-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-surface-strong px-2.5 py-1 text-xs font-mono font-medium text-primary">
                    <Activity className="h-3.5 w-3.5" />
                    <span>Stage {currentStage.id} of 3</span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-foreground sm:text-2xl">
                    {currentStage.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {currentStage.description}
                  </p>
                </div>

                {/* Key Technical Metrics */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-border pt-5">
                  {currentStage.metrics.map((m) => (
                    <div key={m.label} className="rounded-xl border border-border/60 bg-surface-strong/40 p-3">
                      <span className="block text-[0.7rem] uppercase tracking-wider text-muted-foreground font-semibold">
                        {m.label}
                      </span>
                      <span className="mt-1 block font-mono text-xs font-bold text-foreground">
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terminal / Telemetry Column */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl border border-border/80 bg-zinc-950 p-5 font-mono text-xs text-zinc-300 shadow-inner">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2 text-[0.7rem] text-zinc-400">
                      <Terminal className="h-3.5 w-3.5 text-primary" />
                      <span>mediadocks-core-telemetry</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-[0.65rem] text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      ONLINE
                    </span>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {currentStage.consoleLog.map((line, i) => (
                      <div key={i} className="flex items-start gap-2 text-[0.75rem] leading-relaxed">
                        <span className="text-zinc-600 select-none">&gt;</span>
                        <span className={i === currentStage.consoleLog.length - 1 ? "text-emerald-300 font-semibold" : "text-zinc-300"}>
                          {line}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-zinc-800/80 pt-3 text-[0.7rem] text-zinc-500">
                    <span>Engine: Native Rust & Node.js Bridge</span>
                    <span>Zero Cache Retention</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
