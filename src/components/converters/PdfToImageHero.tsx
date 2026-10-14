"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import {
  Upload,
  Download,
  FileText,
  FileArchive,
  RefreshCw,
  Sparkles,
  Layers,
  Check,
  X,
  Maximize2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
  LayoutGrid,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageRender {
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function PdfToImageHero() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageRender[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>("");
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [scale, setScale] = useState<number>(2); // 2x high-res by default
  const [zipProgress, setZipProgress] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [previewPage, setPreviewPage] = useState<PageRender | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "single">("grid");
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to ensure pdf.js is loaded
  const loadPdfJs = async (): Promise<any> => {
    if ((window as any).pdfjsLib) {
      return (window as any).pdfjsLib;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        const lib = (window as any).pdfjsLib;
        lib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(lib);
      };
      script.onerror = () => reject(new Error("Failed to load PDF library"));
      document.body.appendChild(script);
    });
  };

  const processPdf = async (pdfFile: File, targetFormat = format, targetScale = scale) => {
    setLoading(true);
    setProgressMsg("Loading PDF engine…");

    try {
      const pdfjsLib = await loadPdfJs();
      setProgressMsg("Reading PDF pages…");

      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      const renderedPages: PageRender[] = [];
      const mime =
        targetFormat === "jpeg"
          ? "image/jpeg"
          : targetFormat === "webp"
            ? "image/webp"
            : "image/png";

      for (let i = 1; i <= numPages; i++) {
        setProgressMsg(`Rendering page ${i} of ${numPages}…`);
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: targetScale });

        const roundedWidth = Math.round(viewport.width);
        const roundedHeight = Math.round(viewport.height);

        const canvas = document.createElement("canvas");
        canvas.width = roundedWidth;
        canvas.height = roundedHeight;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          // White background for transparent or jpeg
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvasContext: ctx, viewport }).promise;

          const dataUrl = canvas.toDataURL(mime, 0.95);
          const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), mime, 0.95));

          renderedPages.push({
            pageNumber: i,
            dataUrl,
            blob,
            width: roundedWidth,
            height: roundedHeight,
          });
        }
      }

      setPages(renderedPages);
      setActivePageIndex(0);
      setLoading(false);
      setProgressMsg("");
      toast.success(`Extracted ${numPages} page${numPages > 1 ? "s" : ""}`);
    } catch (err: any) {
      setLoading(false);
      setProgressMsg("");
      toast.error("Failed to parse PDF", {
        description: err?.message || "File might be corrupted or protected.",
      });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setFile(f);
      void processPdf(f);
    }
  };

  const downloadPage = (page: PageRender) => {
    const base = file?.name.replace(/\.[^/.]+$/, "") || "document";
    const filename = `${base}_page_${page.pageNumber}.${format}`;
    const url = URL.createObjectURL(page.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded Page ${page.pageNumber}`);
  };

  const copyPageImage = async (page: PageRender) => {
    try {
      if (!navigator.clipboard?.write) {
        toast.error("Clipboard writing not supported by your browser");
        return;
      }
      // If the blob is PNG, clipboard supports it directly.
      if (page.blob.type === "image/png") {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": page.blob }),
        ]);
        toast.success(`Page ${page.pageNumber} copied to clipboard!`);
      } else {
        // Convert to PNG on canvas for clipboard API
        const img = new Image();
        img.src = page.dataUrl;
        await new Promise((res) => (img.onload = res));
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(async (blob) => {
            if (blob) {
              await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
              ]);
              toast.success(`Page ${page.pageNumber} copied as PNG to clipboard!`);
            }
          }, "image/png");
        }
      }
    } catch {
      toast.error("Failed to copy image to clipboard");
    }
  };

  const downloadAllZip = async () => {
    if (pages.length === 0 || !file) return;

    // If single page, download directly as single file instead of creating ZIP
    if (pages.length === 1) {
      downloadPage(pages[0]);
      return;
    }

    setZipProgress(true);

    try {
      const zip = new JSZip();
      const base = file.name.replace(/\.[^/.]+$/, "") || "document";

      pages.forEach((p) => {
        const filename = `${base}_page_${p.pageNumber}.${format}`;
        zip.file(filename, p.blob);
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}_all_pages_${pages.length}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setZipProgress(false);
      toast.success("ZIP archive downloaded!");
    } catch {
      setZipProgress(false);
      toast.error("Failed to build ZIP archive");
    }
  };

  const reset = () => {
    setFile(null);
    setPages([]);
    setPreviewPage(null);
    setActivePageIndex(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Keyboard navigation for full-screen preview lightbox
  useEffect(() => {
    if (!previewPage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewPage(null);
      } else if (e.key === "ArrowLeft") {
        const currentIndex = pages.findIndex((p) => p.pageNumber === previewPage.pageNumber);
        if (currentIndex > 0) {
          setPreviewPage(pages[currentIndex - 1]);
        }
      } else if (e.key === "ArrowRight") {
        const currentIndex = pages.findIndex((p) => p.pageNumber === previewPage.pageNumber);
        if (currentIndex < pages.length - 1) {
          setPreviewPage(pages[currentIndex + 1]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewPage, pages]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files[0]) {
              const f = e.dataTransfer.files[0];
              if (f.type === "application/pdf" || f.name.endsWith(".pdf")) {
                setFile(f);
                void processPdf(f);
              } else {
                toast.error("Please upload a PDF file");
              }
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-14 text-center transition-all backdrop-blur-sm",
            isDragging
              ? "border-primary bg-primary/5 ring-4 ring-primary/10"
              : "border-border/80 bg-surface/70 hover:border-primary/50 hover:bg-surface-strong"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-inner">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="mt-5 text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Upload PDF to convert to images
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Drag & drop your PDF document here, or click to browse. Every page is rendered directly
            in high definition PNG, JPEG, or WebP.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface px-3 py-1 font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Up to 300 DPI High-Res</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface px-3 py-1 font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>100% In-Browser Privacy</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface px-3 py-1 font-medium text-muted-foreground">
              <Layers className="h-3.5 w-3.5 text-blue-500" />
              <span>Single or Batch ZIP Export</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Control Bar Container: Expanded width and aligned controls */}
          <div className="rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Document Info */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 shadow-inner">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className="truncate text-sm sm:text-base font-semibold text-foreground max-w-[280px] sm:max-w-md"
                      title={file.name}
                    >
                      {file.name}
                    </h3>
                    <span className="shrink-0 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-primary">
                      {pages.length > 0
                        ? `${pages.length} ${pages.length === 1 ? "page" : "pages"} extracted`
                        : "Processing…"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
                    <span>{formatBytes(file.size)}</span>
                    <span className="text-border">•</span>
                    <span className="text-emerald-500 font-medium inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Client-Side Only
                    </span>
                    {pages.length > 1 && (
                      <>
                        <span className="text-border">•</span>
                        <div className="inline-flex items-center gap-1 rounded bg-surface-strong/80 px-1.5 py-0.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            className={cn(
                              "px-1.5 py-0.5 rounded transition-colors",
                              viewMode === "grid"
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Grid
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewMode("single")}
                            className={cn(
                              "px-1.5 py-0.5 rounded transition-colors",
                              viewMode === "single"
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Reader
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Controls & Actions */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Format Selector Pill */}
                <div className="inline-flex items-center rounded-lg border border-border/80 bg-surface-strong/70 p-1">
                  <span className="text-[11px] font-semibold text-muted-foreground px-2">
                    Format:
                  </span>
                  {(["png", "jpeg", "webp"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => {
                        if (format !== fmt) {
                          setFormat(fmt);
                          if (file) void processPdf(file, fmt, scale);
                        }
                      }}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition-all",
                        format === fmt
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-surface"
                      )}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>

                {/* Quality / Resolution Selector Pill */}
                <div className="inline-flex items-center rounded-lg border border-border/80 bg-surface-strong/70 p-1">
                  <span className="text-[11px] font-semibold text-muted-foreground px-2">
                    Quality:
                  </span>
                  {[
                    { label: "1x", title: "Standard (150 DPI)", value: 1 },
                    { label: "2x High Res", title: "High Res (300 DPI)", value: 2 },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      title={opt.title}
                      onClick={() => {
                        if (scale !== opt.value) {
                          setScale(opt.value);
                          if (file) void processPdf(file, format, opt.value);
                        }
                      }}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
                        scale === opt.value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-surface"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Change PDF Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reset}
                  className="h-8 sm:h-9 rounded-lg px-3 text-xs font-medium border-border/80 hover:bg-surface-strong shadow-none"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Change PDF
                </Button>

                {/* Download All / ZIP Button */}
                {pages.length > 0 && (
                  <Button
                    size="sm"
                    onClick={downloadAllZip}
                    disabled={zipProgress || loading}
                    className="h-8 sm:h-9 rounded-lg px-3.5 text-xs font-semibold shadow-sm shrink-0"
                  >
                    {zipProgress ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Generating ZIP…
                      </>
                    ) : pages.length === 1 ? (
                      <>
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download Image
                      </>
                    ) : (
                      <>
                        <FileArchive className="h-3.5 w-3.5 mr-1.5" />
                        Download All as ZIP ({pages.length})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-border/80 bg-surface/50 text-center backdrop-blur-sm animate-pulse">
              <RefreshCw className="h-9 w-9 text-primary animate-spin mb-3" />
              <p className="text-sm font-semibold text-foreground">{progressMsg}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Parsing and rendering document safely inside your browser memory…
              </p>
            </div>
          )}

          {/* Pages Display: Single-page showcase vs Multi-page grid */}
          {!loading && pages.length === 1 && (
            /* Single Page Showcase View: Auto-adjusts naturally to document proportions */
            <div className="w-full max-w-4xl mx-auto">
              <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm transition-all hover:border-primary/40">
                {/* Header bar completely outside canvas: ZERO overlapping text */}
                <div className="flex items-center justify-between border-b border-border/60 px-4 sm:px-6 py-3.5 bg-surface-strong/40 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-md bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-mono font-bold text-primary">
                      Page 1 of 1
                    </span>
                    <span className="rounded bg-surface-strong border border-border/60 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase text-foreground">
                      {format}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {pages[0].width} × {pages[0].height} px
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyPageImage(pages[0])}
                      className="h-8 rounded-md px-2.5 text-xs font-medium border-border/70 hover:bg-surface-strong"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewPage(pages[0])}
                      className="h-8 rounded-md px-2.5 text-xs font-medium border-border/70 hover:bg-surface-strong"
                    >
                      <Maximize2 className="h-3.5 w-3.5 mr-1.5" />
                      Fullscreen
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => downloadPage(pages[0])}
                      className="h-8 rounded-md px-3.5 text-xs font-semibold shadow-none"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Save Image
                    </Button>
                  </div>
                </div>

                {/* Flexible Canvas: Fits document aspect ratio naturally */}
                <div
                  onClick={() => setPreviewPage(pages[0])}
                  className="relative w-full flex items-center justify-center p-4 sm:p-8 bg-surface-strong/30 cursor-zoom-in transition-colors hover:bg-surface-strong/50"
                >
                  <img
                    src={pages[0].dataUrl}
                    alt="Page 1 preview"
                    className="w-auto h-auto max-w-full max-h-[750px] object-contain rounded-lg shadow-lg border border-border/60 transition-transform hover:scale-[1.01]"
                  />
                </div>

                {/* Footer Bar */}
                <div className="flex items-center justify-between border-t border-border/60 px-4 sm:px-6 py-3 bg-surface/80 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span>
                      Estimated file size:{" "}
                      <strong className="text-foreground font-mono">
                        {formatBytes(pages[0].blob.size)}
                      </strong>
                    </span>
                    <span className="text-border">•</span>
                    <span>
                      Render scale:{" "}
                      <strong className="text-foreground">
                        {scale === 2 ? "High Res (2x, 300 DPI)" : "Standard (1x)"}
                      </strong>
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => downloadPage(pages[0])}
                    className="h-8 rounded-md px-4 text-xs font-semibold shadow-none"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download {format.toUpperCase()}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Multiple Pages: Reader View Mode */}
          {!loading && pages.length > 1 && viewMode === "single" && (
            <div className="w-full max-w-4xl mx-auto">
              <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm">
                {/* Header bar with page navigation */}
                <div className="flex items-center justify-between border-b border-border/60 px-4 sm:px-6 py-3.5 bg-surface-strong/40 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={activePageIndex === 0}
                      onClick={() => setActivePageIndex((prev) => Math.max(0, prev - 1))}
                      className="h-8 w-8 p-0 rounded-md"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="rounded-md bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-mono font-bold text-primary">
                      Page {pages[activePageIndex].pageNumber} of {pages.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={activePageIndex === pages.length - 1}
                      onClick={() =>
                        setActivePageIndex((prev) => Math.min(pages.length - 1, prev + 1))
                      }
                      className="h-8 w-8 p-0 rounded-md"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="ml-2 font-mono text-xs text-muted-foreground hidden sm:inline">
                      {pages[activePageIndex].width} × {pages[activePageIndex].height} px
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyPageImage(pages[activePageIndex])}
                      className="h-8 rounded-md px-2.5 text-xs font-medium border-border/70"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewPage(pages[activePageIndex])}
                      className="h-8 rounded-md px-2.5 text-xs font-medium border-border/70"
                    >
                      <Maximize2 className="h-3.5 w-3.5 mr-1.5" />
                      Fullscreen
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => downloadPage(pages[activePageIndex])}
                      className="h-8 rounded-md px-3.5 text-xs font-semibold shadow-none"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Save Page
                    </Button>
                  </div>
                </div>

                {/* Canvas */}
                <div
                  onClick={() => setPreviewPage(pages[activePageIndex])}
                  className="relative w-full flex items-center justify-center p-4 sm:p-8 bg-surface-strong/30 cursor-zoom-in"
                >
                  <img
                    src={pages[activePageIndex].dataUrl}
                    alt={`Page ${pages[activePageIndex].pageNumber}`}
                    className="w-auto h-auto max-w-full max-h-[700px] object-contain rounded-lg shadow-lg border border-border/60"
                  />
                </div>

                {/* Footer Bar */}
                <div className="flex items-center justify-between border-t border-border/60 px-4 sm:px-6 py-3 bg-surface/80 text-xs text-muted-foreground">
                  <span>
                    Size:{" "}
                    <strong className="text-foreground font-mono">
                      {formatBytes(pages[activePageIndex].blob.size)}
                    </strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadAllZip}
                      disabled={zipProgress}
                      className="h-8 rounded-md text-xs font-medium"
                    >
                      <FileArchive className="h-3.5 w-3.5 mr-1.5" />
                      ZIP All Pages
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => downloadPage(pages[activePageIndex])}
                      className="h-8 rounded-md px-3.5 text-xs font-semibold shadow-none"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Save Page {pages[activePageIndex].pageNumber}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multiple Pages: Responsive Grid View */}
          {!loading && pages.length > 1 && viewMode === "grid" && (
            <div
              className={cn(
                "grid gap-6",
                pages.length === 2
                  ? "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              )}
            >
              {pages.map((p) => (
                <div
                  key={p.pageNumber}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-border/80 bg-surface shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  {/* Card Header outside canvas: ZERO overlapping text */}
                  <div className="flex items-center justify-between border-b border-border/60 px-3.5 py-2.5 bg-surface-strong/40">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-mono font-bold text-primary">
                        Page {p.pageNumber}
                      </span>
                      <span className="text-[11px] text-muted-foreground">of {pages.length}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => copyPageImage(p)}
                        className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewPage(p)}
                        className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
                        title="Fullscreen preview"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Flexible Canvas: auto-adjusts height & width with image content */}
                  <div
                    onClick={() => setPreviewPage(p)}
                    className="relative w-full flex items-center justify-center p-3 bg-surface-strong/30 min-h-[280px] max-h-[460px] overflow-hidden cursor-zoom-in"
                  >
                    <img
                      src={p.dataUrl}
                      alt={`Page ${p.pageNumber}`}
                      className="w-auto h-auto max-w-full max-h-[420px] object-contain rounded shadow-sm transition-transform group-hover:scale-[1.02]"
                    />
                  </div>

                  {/* Card Footer: clean integer dimensions and prominent, unhidden Save button */}
                  <div className="flex items-center justify-between gap-2 border-t border-border/60 p-3 bg-surface/90">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="rounded bg-surface-strong border border-border/60 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-foreground shrink-0">
                        {format}
                      </span>
                      <span className="truncate font-mono text-[11px] text-muted-foreground">
                        {p.width} × {p.height}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => downloadPage(p)}
                      className="h-8 rounded-md px-3 text-xs font-semibold shadow-none shrink-0"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full-screen Lightbox Modal */}
      {previewPage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewPage(null)}
        >
          <div
            className="relative flex flex-col max-h-[92vh] max-w-5xl w-full rounded-2xl border border-border/80 bg-surface shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5 bg-surface-strong/60">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-mono font-bold text-primary">
                  Page {previewPage.pageNumber} of {pages.length}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {previewPage.width} × {previewPage.height} px
                </span>
                <span className="rounded bg-surface-strong border border-border/60 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-foreground">
                  {format}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyPageImage(previewPage)}
                  className="h-8 rounded-md px-2.5 text-xs font-medium border-border/70"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  onClick={() => downloadPage(previewPage)}
                  className="h-8 rounded-md px-3.5 text-xs font-semibold shadow-none"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Save Image
                </Button>
                <button
                  type="button"
                  onClick={() => setPreviewPage(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors ml-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Display */}
            <div className="relative flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-background/50 min-h-[300px]">
              <img
                src={previewPage.dataUrl}
                alt={`Page ${previewPage.pageNumber} full preview`}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-border/40"
              />

              {/* Navigation Arrows for Multi-page */}
              {pages.length > 1 && (
                <>
                  <button
                    type="button"
                    disabled={previewPage.pageNumber === 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = pages.findIndex((p) => p.pageNumber === previewPage.pageNumber);
                      if (idx > 0) setPreviewPage(pages[idx - 1]);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 border border-border text-foreground shadow-lg backdrop-blur-sm transition-all hover:bg-surface-strong disabled:opacity-30 disabled:pointer-events-none"
                    title="Previous page (Left Arrow)"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    disabled={previewPage.pageNumber === pages.length}
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = pages.findIndex((p) => p.pageNumber === previewPage.pageNumber);
                      if (idx < pages.length - 1) setPreviewPage(pages[idx + 1]);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 border border-border text-foreground shadow-lg backdrop-blur-sm transition-all hover:bg-surface-strong disabled:opacity-30 disabled:pointer-events-none"
                    title="Next page (Right Arrow)"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border/60 px-5 py-2.5 bg-surface-strong/40 text-xs text-muted-foreground">
              <span>Use Left / Right arrow keys to navigate, Esc to close</span>
              <span>
                File size:{" "}
                <strong className="text-foreground font-mono">
                  {formatBytes(previewPage.blob.size)}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
