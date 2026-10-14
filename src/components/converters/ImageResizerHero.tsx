"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { toast } from "sonner";
import {
  Upload,
  Download,
  Scaling,
  Lock,
  Unlock,
  RefreshCw,
  Image as ImageIcon,
  Check,
  Sparkles,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImageResizerHero() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [originalFormat, setOriginalFormat] = useState<string>("");

  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<string>("original");
  const [quality, setQuality] = useState<number>(90);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/") && !selectedFile.name.endsWith(".svg")) {
      toast.error("Please upload an image file");
      return;
    }

    const ext = selectedFile.name.split(".").pop()?.toUpperCase() || "IMAGE";
    setOriginalFormat(ext);
    setFile(selectedFile);

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      setOriginalWidth(w);
      setOriginalHeight(h);
      setTargetWidth(w);
      setTargetHeight(h);
    };
    img.src = url;
  };

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (lockRatio && originalWidth > 0 && originalHeight > 0) {
      const ratio = originalHeight / originalWidth;
      setTargetHeight(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (lockRatio && originalWidth > 0 && originalHeight > 0) {
      const ratio = originalWidth / originalHeight;
      setTargetWidth(Math.round(val * ratio));
    }
  };

  const applyPercentage = (pct: number) => {
    if (originalWidth <= 0 || originalHeight <= 0) return;
    setTargetWidth(Math.round((originalWidth * pct) / 100));
    setTargetHeight(Math.round((originalHeight * pct) / 100));
  };

  const resizeAndDownload = async () => {
    if (!previewUrl || !file || targetWidth <= 0 || targetHeight <= 0) return;
    setIsResizing(true);

    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsResizing(false);
          toast.error("Canvas unsupported");
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Determine mime
        let mime = file.type || "image/png";
        let ext = originalFormat.toLowerCase();

        if (outputFormat === "jpeg") {
          mime = "image/jpeg";
          ext = "jpg";
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (outputFormat === "png") {
          mime = "image/png";
          ext = "png";
        } else if (outputFormat === "webp") {
          mime = "image/webp";
          ext = "webp";
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            setIsResizing(false);
            if (!blob) {
              toast.error("Resize failed");
              return;
            }

            const originalBase = file.name.substring(0, file.name.lastIndexOf(".")) || "image";
            const filename = `${originalBase}_${targetWidth}x${targetHeight}.${ext}`;
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            toast.success("Resized image downloaded!", {
              description: `${targetWidth}×${targetHeight} px · ${formatBytes(blob.size)}`,
            });
          },
          mime,
          quality / 100
        );
      };
      img.onerror = () => {
        setIsResizing(false);
        toast.error("Failed to process image");
      };
      img.src = previewUrl;
    } catch {
      setIsResizing(false);
      toast.error("Failed to resize image");
    }
  };

  const resetAll = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setOriginalWidth(0);
    setOriginalHeight(0);
  };

  return (
    <div className="mx-auto max-w-4xl">
      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-border/80 bg-surface/70 p-8 text-center transition-all hover:border-primary/50 hover:bg-surface-strong sm:p-12"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px] bg-primary/10 text-primary">
            <Scaling className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base sm:text-lg font-semibold text-foreground">
            Upload image to resize
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Auto-detects image format, aspect ratio, and dimensions · 100% Client-Side
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-[4px] border border-border/80 bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>High-quality bicubic interpolation · Zero quality loss</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-2xl border border-border/80 bg-surface p-5 sm:p-6">
          {/* Left: Preview Panel */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center rounded-xl border border-border/60 bg-surface-strong/70 p-4">
            <div className="relative max-h-[380px] w-full flex items-center justify-center overflow-hidden rounded-lg">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Original image preview"
                  className="max-h-[360px] w-auto max-w-full object-contain rounded"
                />
              )}
            </div>

            {/* Image Specs Badges */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="rounded-[4px] bg-primary/10 px-2.5 py-1 font-mono font-semibold text-primary">
                {originalFormat}
              </span>
              <span className="rounded-[4px] border border-border bg-surface px-2.5 py-1 font-mono text-muted-foreground">
                Original: {originalWidth} × {originalHeight} px
              </span>
              <span className="rounded-[4px] border border-border bg-surface px-2.5 py-1 font-mono text-muted-foreground">
                {formatBytes(file.size)}
              </span>
            </div>
          </div>

          {/* Right: Resizing Controls */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-sm font-semibold text-foreground">Resize Settings</h3>
                <button
                  type="button"
                  onClick={resetAll}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Change image
                </button>
              </div>

              {/* Dimensions Input */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Dimensions (Pixels)</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-mono text-muted-foreground mb-1">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      value={targetWidth || ""}
                      onChange={(e) => handleWidthChange(Number(e.target.value))}
                      className="w-full rounded-[4px] border border-border bg-surface-strong px-2.5 py-1.5 text-xs font-mono font-semibold focus:border-primary focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setLockRatio(!lockRatio)}
                    className={cn(
                      "mt-5 rounded-[4px] border p-2 transition-colors",
                      lockRatio
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                    title={lockRatio ? "Aspect ratio locked" : "Aspect ratio unlocked"}
                  >
                    {lockRatio ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  </button>

                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-mono text-muted-foreground mb-1">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      value={targetHeight || ""}
                      onChange={(e) => handleHeightChange(Number(e.target.value))}
                      className="w-full rounded-[4px] border border-border bg-surface-strong px-2.5 py-1.5 text-xs font-mono font-semibold focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Scale Percentage Presets */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Quick Presets</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {[25, 50, 75, 100, 150, 200].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => applyPercentage(pct)}
                      className="rounded-[4px] border border-border bg-surface-strong py-1 text-center font-mono text-[11px] font-medium text-foreground hover:border-primary/40 hover:bg-surface transition-colors"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Format */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Output Format</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: "Original", value: "original" },
                    { label: "PNG", value: "png" },
                    { label: "JPEG", value: "jpeg" },
                    { label: "WebP", value: "webp" },
                  ].map((fmt) => (
                    <button
                      key={fmt.value}
                      type="button"
                      onClick={() => setOutputFormat(fmt.value)}
                      className={cn(
                        "rounded-[4px] border py-1.5 text-center text-xs font-medium transition-colors",
                        outputFormat === fmt.value
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border bg-surface-strong text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Slider (for JPEG / WebP) */}
              {(outputFormat === "jpeg" || outputFormat === "webp") && (
                <div className="space-y-1.5 rounded-lg border border-border/60 bg-surface-strong p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Sliders className="h-3 w-3" /> Quality
                    </span>
                    <span className="font-mono font-semibold tabular-nums">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer accent-primary"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border/60 flex flex-col gap-2">
              <Button
                onClick={resizeAndDownload}
                disabled={isResizing || targetWidth <= 0 || targetHeight <= 0}
                className="h-[36px] w-full rounded-[4px] text-xs font-medium shadow-none"
              >
                {isResizing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Resizing image…
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    Resize & Download ({targetWidth} × {targetHeight} px)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
