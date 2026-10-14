"use client";

import { useState, useRef, ChangeEvent } from "react";
import { toast } from "sonner";
import {
  Upload,
  Download,
  FileCode2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SvgToPngHero() {
  const [svgContent, setSvgContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("vector_export");
  const [scale, setScale] = useState<number>(2); // 1x, 2x, 4x, 8x
  const [bgColor, setBgColor] = useState<string>("transparent");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".svg") && file.type !== "image/svg+xml") {
      toast.error("Please upload an SVG file");
      return;
    }
    const text = await file.text();
    setSvgContent(text);
    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    parseSvg(text);
  };

  const parseSvg = (svgText: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, "image/svg+xml");
      const svgEl = doc.querySelector("svg");
      if (!svgEl) {
        toast.error("Invalid SVG markup");
        return;
      }

      let w = parseFloat(svgEl.getAttribute("width") || "");
      let h = parseFloat(svgEl.getAttribute("height") || "");

      if (!w || !h) {
        const viewBox = svgEl.getAttribute("viewBox");
        if (viewBox) {
          const parts = viewBox.split(/[\s,]+/).map(parseFloat);
          if (parts.length >= 4) {
            w = parts[2];
            h = parts[3];
          }
        }
      }

      w = w || 512;
      h = h || 512;
      setDimensions({ width: Math.round(w), height: Math.round(h) });

      const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch {
      toast.error("Error reading SVG");
    }
  };

  const renderAndDownloadPng = () => {
    if (!svgContent || dimensions.width === 0) return;

    const img = new Image();
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width * scale;
      canvas.height = dimensions.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (bgColor !== "transparent") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `${fileName}_${canvas.width}x${canvas.height}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(url);
        toast.success(`Exported ${canvas.width}×${canvas.height} px PNG!`);
      }, "image/png");
    };

    img.src = url;
  };

  return (
    <div className="mx-auto max-w-4xl">
      {!previewUrl ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files[0]) void handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-border/80 bg-surface/70 p-8 text-center transition-all hover:border-primary/50 hover:bg-surface-strong sm:p-12"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,image/svg+xml"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.files?.[0]) void handleFile(e.target.files[0]);
            }}
          />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px] bg-primary/10 text-primary">
            <FileCode2 className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base sm:text-lg font-semibold text-foreground">
            Upload SVG to convert to PNG
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Render crisp raster graphics at 1x, 2x, 4x, or 8x resolution up to 4096px
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-[4px] border border-border/80 bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>High-DPI Anti-Aliased Vector Rasterization · 100% Client-Side</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-2xl border border-border/80 bg-surface p-5 sm:p-6">
          <div className="lg:col-span-7 flex flex-col items-center justify-center rounded-xl border border-border/60 bg-surface-strong/70 p-4">
            <div className="relative max-h-[360px] w-full flex items-center justify-center overflow-hidden rounded-lg p-2">
              <img
                src={previewUrl}
                alt="SVG Preview"
                className="max-h-[320px] w-auto max-w-full object-contain"
              />
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="rounded-[4px] bg-primary/10 px-2 py-0.5 font-mono font-semibold text-primary">
                SVG
              </span>
              <span className="rounded-[4px] border border-border bg-surface px-2 py-0.5 font-mono text-muted-foreground">
                Base: {dimensions.width} × {dimensions.height} px
              </span>
              <span className="rounded-[4px] border border-border bg-surface px-2 py-0.5 font-mono text-muted-foreground">
                Output: {dimensions.width * scale} × {dimensions.height * scale} px
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-sm font-semibold text-foreground">Export Options</h3>
                <button
                  type="button"
                  onClick={() => setPreviewUrl(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Change SVG
                </button>
              </div>

              <div>
                <span className="block text-xs font-medium text-muted-foreground mb-1">
                  Render Scale Multiplier
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 4, 8].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScale(s)}
                      className={cn(
                        "rounded-[4px] border py-1.5 text-center text-xs font-mono font-medium transition-colors",
                        scale === s
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-border bg-surface-strong text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {s}x ({dimensions.width * s}px)
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-muted-foreground mb-1">
                  Background
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBgColor("transparent")}
                    className={cn(
                      "rounded-[4px] border px-2.5 py-1 text-xs font-medium transition-colors",
                      bgColor === "transparent"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-surface-strong text-muted-foreground"
                    )}
                  >
                    Transparent
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgColor("#ffffff")}
                    className={cn(
                      "rounded-[4px] border px-2.5 py-1 text-xs font-medium transition-colors",
                      bgColor === "#ffffff"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-surface-strong text-muted-foreground"
                    )}
                  >
                    White
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgColor("#000000")}
                    className={cn(
                      "rounded-[4px] border px-2.5 py-1 text-xs font-medium transition-colors",
                      bgColor === "#000000"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-surface-strong text-muted-foreground"
                    )}
                  >
                    Black
                  </button>
                </div>
              </div>
            </div>

            <Button
              onClick={renderAndDownloadPng}
              className="h-[36px] w-full rounded-[4px] text-xs font-medium shadow-none"
            >
              <Download className="h-3.5 w-3.5" />
              Download PNG ({dimensions.width * scale} × {dimensions.height * scale} px)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
