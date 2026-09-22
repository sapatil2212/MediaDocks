"use client";

import { useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  FileText,
  FileType,
  FileVideo,
  Play,
  RotateCcw,
  Sparkles,
  Video,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import {
  downloadBlob,
  downloadFile,
  exportToCsv,
  exportToDocx,
  exportToJson,
  exportToPdfHtml,
  exportToSrt,
  exportToTxt,
  exportToVtt,
  type TranscriptionResult,
} from "@/src/lib/transcribe";

interface TranscriptEditorProps {
  result: TranscriptionResult;
  onReset: () => void;
  mediaFileUrl?: string;
  sourceUrl?: string;
}

/**
 * Extracts pure plain text with zero timestamps and zero speaker labels.
 */
function extractCleanPlainText(result: TranscriptionResult): string {
  if (result.text?.trim()) {
    return result.text
      .replace(/\[\d{1,2}:\d{2}(?::\d{2})?(?:\s*[-–]\s*\d{1,2}:\d{2}(?::\d{2})?)?\]\s*/g, "")
      .replace(/^[A-Za-z0-9\s]+:\s*/gm, "")
      .trim();
  }
  if (result.segments && result.segments.length > 0) {
    return result.segments
      .map((seg) => seg.text.trim())
      .filter(Boolean)
      .join("\n\n");
  }
  return exportToTxt(result.segments || [], {
    includeTimestamps: false,
    includeSpeakers: false,
  }).trim();
}

/**
 * Detects public video providers and returns an embeddable URL for iframe preview.
 */
function getEmbedUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/")[2];
        if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
      }
      if (parsed.pathname.startsWith("/embed/")) return url;
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "").split(/[?#]/)[0];
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (host.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function TranscriptEditor({
  result,
  onReset,
  mediaFileUrl,
  sourceUrl,
}: TranscriptEditorProps) {
  const originalText = useMemo(() => extractCleanPlainText(result), [result]);
  const [transcript, setTranscript] = useState(originalText);
  const [copied, setCopied] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  const embedUrl = useMemo(() => getEmbedUrl(sourceUrl), [sourceUrl]);

  // Word count and character calculations
  const wordCount = useMemo(() => {
    try {
      return Array.from(
        new Intl.Segmenter(undefined, { granularity: "word" }).segment(transcript)
      ).filter((part) => part.isWordLike).length;
    } catch {
      return transcript.split(/\s+/u).filter(Boolean).length;
    }
  }, [transcript]);

  const charCount = transcript.length;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript.trim());
      setCopied(true);
      toast.success("Plain text transcript copied to clipboard!");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Clipboard access was blocked by your browser.");
    }
  };

  const handleDownloadTxt = () => {
    downloadFile(
      transcript.trim(),
      `${result.title || "transcript"}.txt`,
      "text/plain;charset=utf-8"
    );
    toast.success("Plain text transcript downloaded (.txt)");
  };

  const handleDownloadPdf = () => {
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Popup was blocked. Please allow popups to generate your PDF.");
      return;
    }
    // Create clean printable HTML document with no timestamps and no speaker labels
    const paragraphs = transcript
      .split(/\n\n+/)
      .map((p) => `<p style="margin-bottom:1.15rem;line-height:1.75;font-size:1rem;color:#1e293b;">${p.replace(/\n/g, "<br/>")}</p>`)
      .join("\n");

    const html = `<!DOCTYPE html>
<html lang="${result.language || "en"}">
<head>
  <meta charset="utf-8">
  <title>${result.title || "Video Transcript"} — MediaDocks</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',system-ui,-apple-system,sans-serif;color:#0f172a;background:#fff;padding:3rem;max-width:820px;margin:0 auto}
    h1{font-size:1.65rem;font-weight:700;color:#0f172a;margin-bottom:0.4rem}
    .meta{font-size:0.82rem;color:#64748b;margin-bottom:2rem;border-bottom:1px solid #e2e8f0;padding-bottom:0.85rem;display:flex;flex-wrap:wrap;gap:1.25rem}
    .meta span{display:inline-flex;align-items:center}
    .content{margin-top:1.5rem}
    .footer{margin-top:3rem;padding-top:1rem;border-top:1px solid #f1f5f9;font-size:0.75rem;color:#94a3b8;text-align:center}
    @media print{body{padding:1.5cm}@page{margin:1.5cm}}
  </style>
</head>
<body>
  <h1>${result.title || "Video Transcript"}</h1>
  <div class="meta">
    ${result.duration > 0 ? `<span>⏱ ${result.durationFormatted}</span>` : ""}
    <span>🌐 ${result.languageName || "Detected Language"}</span>
    <span>📝 ${wordCount.toLocaleString()} words</span>
    <span>🎯 Plain-text transcript (No timestamps · No speaker labels)</span>
  </div>
  <div class="content">
    ${paragraphs}
  </div>
  <div class="footer">Generated by MediaDocks Video to Text Converter • ${new Date().toLocaleDateString()}</div>
  <script>window.onload=()=>{window.print()}</script>
</body>
</html>`;

    win.document.write(html);
    win.document.close();
    toast.success("Opened print dialog for PDF export");
  };

  const handleDownloadDocx = async () => {
    setIsExportingDocx(true);
    try {
      const blob = await exportToDocx(result.segments || [], {
        ...result,
        text: transcript,
      });
      downloadBlob(blob, `${result.title || "transcript"}.docx`);
      toast.success("Microsoft Word document downloaded (.docx)");
    } catch {
      toast.error("Failed to generate Word document.");
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleDownloadCsv = () => {
    const csvContent = exportToCsv(result.segments || [], {
      ...result,
      text: transcript,
    });
    downloadFile(
      csvContent,
      `${result.title || "transcript"}.csv`,
      "text/csv;charset=utf-8"
    );
    toast.success("Excel / CSV spreadsheet downloaded");
  };

  const handleDownloadSrt = () => {
    const srt = exportToSrt(result.segments || []);
    downloadFile(srt, `${result.title || "subtitles"}.srt`, "text/plain;charset=utf-8");
    toast.success("Subtitles downloaded (.srt)");
  };

  const handleDownloadVtt = () => {
    const vtt = exportToVtt(result.segments || []);
    downloadFile(vtt, `${result.title || "subtitles"}.vtt`, "text/vtt;charset=utf-8");
    toast.success("WebVTT subtitles downloaded (.vtt)");
  };

  const handleDownloadJson = () => {
    const data = exportToJson({
      ...result,
      text: transcript,
    });
    downloadFile(data, `${result.title || "transcript"}.json`, "application/json;charset=utf-8");
    toast.success("JSON data downloaded (.json)");
  };

  return (
    <div className="w-full transition-all duration-300 animate-in fade-in-50 zoom-in-95">
      {/* ── Top Bar with Media Summary & New Transcript Action ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-surface/90 p-4 sm:px-6 shadow-soft backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">
              {result.title || "Video transcript"}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {result.duration > 0 && <span>{result.durationFormatted}</span>}
              {result.duration > 0 && <span>•</span>}
              <span>{wordCount.toLocaleString()} words</span>
              <span>•</span>
              <span>{result.languageName}</span>
              <span>•</span>
              <span className="text-emerald-500 font-medium">Ready</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-surface px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/40 hover:bg-surface-strong hover:text-foreground active:scale-95 shadow-sm"
          title="Transcribe another video or audio file"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Transcribe another</span>
        </button>
      </div>

      {/* ── Two-Column Layout: Left Card (Plain-text) | Right Card (Video & Exports) ── */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* ── Left Side Card: Plain-Text Preview (No timestamps · No speaker labels) ── */}
        <div className="flex flex-col rounded-2xl border border-border/80 bg-surface/90 shadow-xl backdrop-blur-xl overflow-hidden transition-all lg:col-span-7">
          {/* Card Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-surface-strong/60 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground sm:text-base">
                  Plain-text preview
                </h3>
                <p className="text-[11px] font-medium text-primary/90">
                  No timestamps · no speaker labels
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-surface-strong active:scale-95 shadow-sm"
                title="Copy clean plain text to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
                title="Download plain text as .txt"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download TXT</span>
              </button>
            </div>
          </div>

          {/* Card Body: Editable Textarea */}
          <div className="flex flex-col p-4 sm:p-6">
            <div className="mb-2.5 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono text-[11px]">
                {wordCount.toLocaleString()} words · {charCount.toLocaleString()} characters
              </span>
              <span className="text-[11px]">~{readingTimeMin} min read</span>
            </div>

            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              dir="auto"
              spellCheck
              className="min-h-[460px] w-full resize-y rounded-xl border border-border/80 bg-surface/60 p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 sm:text-base sm:leading-8 font-normal"
              placeholder="Your plain-text transcript will appear here..."
              aria-label="Clean plain-text transcript without timestamps or speaker labels"
            />

            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Edit directly in the box above before downloading.</span>
              {transcript !== originalText && (
                <button
                  type="button"
                  onClick={() => setTranscript(originalText)}
                  className="text-primary hover:underline"
                >
                  Reset text
                </button>
              )}
            </div>
          </div>

          {/* Card Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-surface-strong/40 px-5 py-3 text-xs text-muted-foreground">
            <span>Clean plain text formatted for documents, notes, and sharing.</span>
            <span className="font-mono text-[11px]">Zero permanent storage</span>
          </div>
        </div>

        {/* ── Right Side Card: Video Player & Multi-Format Download Options ── */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Video Player Card */}
          <div className="flex flex-col rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-xl backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-border/70 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                  {result.mediaType === "audio" ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <Video className="h-4 w-4" />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {result.mediaType === "audio" ? "Audio Track" : "Video"}
                </h3>
              </div>
              {result.duration > 0 && (
                <span className="rounded-md border border-border/80 bg-surface px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
                  {result.durationFormatted}
                </span>
              )}
            </div>

            {/* Video / Audio Rendering */}
            <div className="overflow-hidden rounded-xl border border-border/80 bg-black/90 shadow-inner">
              {mediaFileUrl ? (
                result.mediaType === "audio" ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/20 text-primary">
                      <FileAudio className="h-6 w-6" />
                    </div>
                    <audio
                      ref={mediaRef as React.RefObject<HTMLAudioElement>}
                      src={mediaFileUrl}
                      className="w-full"
                      controls
                      preload="metadata"
                    />
                  </div>
                ) : (
                  <video
                    ref={mediaRef as React.RefObject<HTMLVideoElement>}
                    src={mediaFileUrl}
                    className="max-h-72 w-full object-contain"
                    controls
                    preload="metadata"
                  />
                )
              ) : embedUrl ? (
                <div className="relative aspect-video w-full">
                  <iframe
                    src={embedUrl}
                    title={result.title || "Video preview"}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-surface-strong text-primary border border-border">
                    <FileVideo className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                    {result.title || "Video source"}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Processed ephemerally in memory
                  </p>
                  {sourceUrl && (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <span>Open source link</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Media Information Pill */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate max-w-[200px]">
                {result.title || "Uploaded media"}
              </span>
              <span className="font-mono text-[11px] text-emerald-500 font-medium">
                {result.languageName}
              </span>
            </div>
          </div>

          {/* Download Formats Card */}
          <div className="flex flex-col rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-xl backdrop-blur-xl sm:p-6">
            <div className="mb-3 flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Download Formats
                </h3>
              </div>
              <span className="text-[11px] text-muted-foreground">One-click export</span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {/* Plain Text (.txt) */}
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-surface/70 p-2.5 text-left transition-all hover:border-primary/40 hover:bg-surface-strong active:scale-95 group"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">Plain Text</div>
                  <div className="text-[10px] text-muted-foreground">Clean .txt file</div>
                </div>
              </button>

              {/* PDF Document (.pdf) */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-surface/70 p-2.5 text-left transition-all hover:border-rose-500/40 hover:bg-surface-strong active:scale-95 group"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <FileType className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">PDF Document</div>
                  <div className="text-[10px] text-muted-foreground">Print-ready .pdf</div>
                </div>
              </button>

              {/* Microsoft Word (.docx) */}
              <button
                type="button"
                onClick={handleDownloadDocx}
                disabled={isExportingDocx}
                className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-surface/70 p-2.5 text-left transition-all hover:border-blue-500/40 hover:bg-surface-strong active:scale-95 group disabled:opacity-60"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <FileType className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">Word (.docx)</div>
                  <div className="text-[10px] text-muted-foreground">Editable document</div>
                </div>
              </button>

              {/* Excel / CSV (.csv) */}
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-surface/70 p-2.5 text-left transition-all hover:border-emerald-500/40 hover:bg-surface-strong active:scale-95 group"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">Excel / CSV</div>
                  <div className="text-[10px] text-muted-foreground">Spreadsheet data</div>
                </div>
              </button>

              {/* Subtitles (.srt) */}
              <button
                type="button"
                onClick={handleDownloadSrt}
                className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-surface/70 p-2.5 text-left transition-all hover:border-amber-500/40 hover:bg-surface-strong active:scale-95 group"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <FileCode className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">Subtitles (.srt)</div>
                  <div className="text-[10px] text-muted-foreground">Standard subtitles</div>
                </div>
              </button>

              {/* WebVTT (.vtt) */}
              <button
                type="button"
                onClick={handleDownloadVtt}
                className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-surface/70 p-2.5 text-left transition-all hover:border-indigo-500/40 hover:bg-surface-strong active:scale-95 group"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <FileCode className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">WebVTT (.vtt)</div>
                  <div className="text-[10px] text-muted-foreground">Video web player</div>
                </div>
              </button>

              {/* JSON (.json) */}
              <button
                type="button"
                onClick={handleDownloadJson}
                className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-surface/70 p-2.5 text-left transition-all hover:border-cyan-500/40 hover:bg-surface-strong active:scale-95 group sm:col-span-2"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                  <FileCode className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">JSON (.json)</div>
                  <div className="text-[10px] text-muted-foreground">Structured raw data</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
