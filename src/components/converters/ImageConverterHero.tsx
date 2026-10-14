"use client";

import { useState, useRef, ChangeEvent } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import {
  Upload,
  Download,
  Image as ImageIcon,
  Check,
  RefreshCw,
  X,
  FileArchive,
  ArrowRight,
  Sliders,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type ImageFormat = "png" | "jpeg" | "webp" | "avif" | "gif" | "bmp" | "ico";

interface FileEntry {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  originalFormat: string;
  targetFormat: ImageFormat;
  status: "idle" | "converting" | "ready" | "error";
  convertedBlob?: Blob;
  convertedSize?: number;
  error?: string;
}

const SUPPORTED_FORMATS: Array<{ label: string; value: ImageFormat; mime: string }> = [
  { label: "PNG (.png)", value: "png", mime: "image/png" },
  { label: "JPEG (.jpg)", value: "jpeg", mime: "image/jpeg" },
  { label: "WebP (.webp)", value: "webp", mime: "image/webp" },
  { label: "AVIF (.avif)", value: "avif", mime: "image/avif" },
  { label: "GIF (.gif)", value: "gif", mime: "image/gif" },
  { label: "BMP (.bmp)", value: "bmp", mime: "image/bmp" },
  { label: "ICO (.ico)", value: "ico", mime: "image/x-icon" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImageConverterHero() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [globalTargetFormat, setGlobalTargetFormat] = useState<ImageFormat>("png");
  const [quality, setQuality] = useState<number>(90);
  const [isConvertingAll, setIsConvertingAll] = useState(false);
  const [zipProgress, setZipProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilesSelected = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const remainingSlots = 10 - files.length;
    if (remainingSlots <= 0) {
      toast.error("Limit reached", { description: "You can convert up to 10 images at a time." });
      return;
    }

    const accepted = Array.from(selectedFiles)
      .filter((file) => file.type.startsWith("image/") || file.name.endsWith(".ico") || file.name.endsWith(".svg"))
      .slice(0, remainingSlots);

    if (accepted.length === 0) {
      toast.error("Unsupported file", { description: "Please upload image files." });
      return;
    }

    const newEntries: FileEntry[] = accepted.map((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "unknown";
      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        originalSize: file.size,
        originalFormat: ext,
        targetFormat: globalTargetFormat,
        status: "idle",
      };
    });

    setFiles((prev) => [...prev, ...newEntries]);
    toast.success(`Added ${newEntries.length} image${newEntries.length > 1 ? "s" : ""}`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id === id);
    });
  };

  const clearAll = () => {
    files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
  };

  const changeItemTargetFormat = (id: string, format: ImageFormat) => {
    setFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, targetFormat: format, status: "idle" } : item))
    );
  };

  const handleGlobalFormatChange = (format: ImageFormat) => {
    setGlobalTargetFormat(format);
    setFiles((prev) => prev.map((item) => ({ ...item, targetFormat: format, status: "idle" })));
  };

  const convertSingle = async (item: FileEntry): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas context unavailable"));

          // If converting to JPEG or BMP, paint white background for transparent images
          if (item.targetFormat === "jpeg" || item.targetFormat === "bmp") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0);

          let mime = "image/png";
          if (item.targetFormat === "jpeg") mime = "image/jpeg";
          else if (item.targetFormat === "webp") mime = "image/webp";
          else if (item.targetFormat === "avif") mime = "image/avif";
          else if (item.targetFormat === "gif") mime = "image/gif";
          else if (item.targetFormat === "bmp") mime = "image/bmp";
          else if (item.targetFormat === "ico") mime = "image/x-icon";

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Conversion failed"));
            },
            mime,
            quality / 100
          );
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = item.previewUrl;
    });
  };

  const runConvertAll = async () => {
    if (files.length === 0) return;
    setIsConvertingAll(true);

    const updated = [...files];
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      setFiles((curr) => curr.map((f, idx) => (idx === i ? { ...f, status: "converting" } : f)));

      try {
        const convertedBlob = await convertSingle(item);
        setFiles((curr) =>
          curr.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "ready",
                  convertedBlob,
                  convertedSize: convertedBlob.size,
                }
              : f
          )
        );
      } catch (err: any) {
        setFiles((curr) =>
          curr.map((f, idx) =>
            idx === i
              ? { ...f, status: "error", error: err?.message || "Failed to convert" }
              : f
          )
        );
      }
    }

    setIsConvertingAll(false);
    toast.success("Conversion finished!");
  };

  const downloadItem = (item: FileEntry) => {
    if (!item.convertedBlob) return;
    const originalBase = item.file.name.substring(0, item.file.name.lastIndexOf(".")) || item.file.name;
    const filename = `${originalBase}.${item.targetFormat}`;
    const url = URL.createObjectURL(item.convertedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllZip = async () => {
    const readyItems = files.filter((f) => f.convertedBlob);
    if (readyItems.length === 0) {
      toast.error("No converted files", { description: "Please convert your images first." });
      return;
    }

    setZipProgress(10);
    try {
      const zip = new JSZip();
      readyItems.forEach((item, index) => {
        const originalBase = item.file.name.substring(0, item.file.name.lastIndexOf(".")) || `image_${index + 1}`;
        const filename = `${originalBase}.${item.targetFormat}`;
        if (item.convertedBlob) {
          zip.file(filename, item.convertedBlob);
        }
      });

      setZipProgress(60);
      const zipBlob = await zip.generateAsync({ type: "blob" });
      setZipProgress(100);

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mediadocks_converted_images_${readyItems.length}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("ZIP archive downloaded!");
      setTimeout(() => setZipProgress(null), 1500);
    } catch {
      setZipProgress(null);
      toast.error("ZIP creation failed");
    }
  };

  const readyCount = files.filter((f) => f.status === "ready").length;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all sm:p-12",
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border/80 bg-surface/70 hover:border-primary/50 hover:bg-surface-strong"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.ico,.svg"
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            handleFilesSelected(e.target.files);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px] bg-primary/10 text-primary">
          <Upload className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base sm:text-lg font-semibold text-foreground">
          Choose images or drag & drop here
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Supports JPG, PNG, WEBP, AVIF, GIF, BMP, SVG, ICO · Up to 10 files simultaneously
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-[4px] border border-border/80 bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>100% Client-Side In-Memory Processing · Never Uploaded</span>
        </div>
      </div>

      {/* Control Bar & File Queue */}
      {files.length > 0 && (
        <div className="mt-8 space-y-5">
          {/* Controls Settings Card */}
          <div className="rounded-xl border border-border/80 bg-surface p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Global target format */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Convert all to:</span>
                <select
                  value={globalTargetFormat}
                  onChange={(e) => handleGlobalFormatChange(e.target.value as ImageFormat)}
                  className="rounded-[4px] border border-border bg-surface-strong px-2.5 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                >
                  {SUPPORTED_FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quality Slider */}
              <div className="flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Quality:</span>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="h-1.5 w-24 cursor-pointer accent-primary"
                />
                <span className="text-xs font-mono font-semibold tabular-nums">{quality}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="h-[34px] rounded-[4px] px-3 text-xs font-medium text-muted-foreground shadow-none"
              >
                Clear all ({files.length})
              </Button>
              <Button
                size="sm"
                onClick={runConvertAll}
                disabled={isConvertingAll}
                className="h-[34px] rounded-[4px] px-4 text-xs font-medium shadow-none"
              >
                {isConvertingAll ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Converting…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Convert All ({files.length})
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* List of files */}
          <div className="space-y-2.5">
            {files.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border/80 bg-surface/90 p-3 sm:px-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[4px] border border-border bg-surface-strong">
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {item.file.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="uppercase font-mono">{item.originalFormat}</span>
                      <span>·</span>
                      <span>{formatBytes(item.originalSize)}</span>
                      {item.convertedSize && (
                        <>
                          <ArrowRight className="h-3 w-3 text-primary" />
                          <span className="font-semibold text-foreground">
                            {formatBytes(item.convertedSize)}
                          </span>
                          <span
                            className={cn(
                              "font-mono text-[10px] font-bold",
                              item.convertedSize < item.originalSize
                                ? "text-emerald-500"
                                : "text-amber-500"
                            )}
                          >
                            (
                            {item.convertedSize < item.originalSize ? "-" : "+"}
                            {Math.abs(
                              Math.round(
                                ((item.convertedSize - item.originalSize) / item.originalSize) * 100
                              )
                            )}
                            %)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                  {/* Target format select */}
                  <select
                    value={item.targetFormat}
                    onChange={(e) => changeItemTargetFormat(item.id, e.target.value as ImageFormat)}
                    disabled={item.status === "converting"}
                    className="rounded-[4px] border border-border bg-surface-strong px-2 py-1 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  >
                    {SUPPORTED_FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.value.toUpperCase()}
                      </option>
                    ))}
                  </select>

                  {/* Status / Download */}
                  {item.status === "ready" ? (
                    <Button
                      size="sm"
                      onClick={() => downloadItem(item)}
                      className="h-[30px] rounded-[4px] px-3 text-xs font-medium shadow-none bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  ) : item.status === "converting" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-primary font-medium px-2 py-1">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Converting…
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const convertedBlob = await convertSingle(item);
                          setFiles((curr) =>
                            curr.map((f) =>
                              f.id === item.id
                                ? { ...f, status: "ready", convertedBlob, convertedSize: convertedBlob.size }
                                : f
                            )
                          );
                        } catch {
                          toast.error("Conversion failed");
                        }
                      }}
                      className="h-[30px] rounded-[4px] px-3 text-xs font-medium shadow-none border-border"
                    >
                      Convert
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    className="rounded-[4px] p-1 text-muted-foreground hover:bg-surface-strong hover:text-foreground transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Batch Download ZIP Button */}
          {readyCount > 0 && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/80">
              <span className="text-xs text-muted-foreground">
                {readyCount} of {files.length} file{files.length > 1 ? "s" : ""} converted & ready
              </span>
              <Button
                onClick={downloadAllZip}
                disabled={Boolean(zipProgress)}
                className="w-full sm:w-auto h-[34px] rounded-[4px] px-4 text-xs font-medium shadow-none"
              >
                {zipProgress ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Packaging ZIP… {zipProgress}%
                  </>
                ) : (
                  <>
                    <FileArchive className="h-3.5 w-3.5" />
                    Download All as ZIP ({readyCount})
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
