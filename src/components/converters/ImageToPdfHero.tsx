"use client";

import { useState, useRef, ChangeEvent } from "react";
import { PDFDocument, PageSizes } from "pdf-lib";
import { toast } from "sonner";
import {
  Upload,
  Download,
  FilePlus2,
  ArrowUp,
  ArrowDown,
  Trash2,
  RefreshCw,
  Sparkles,
  Sliders,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export function ImageToPdfHero() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<"fit" | "a4" | "letter">("a4");
  const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">("portrait");
  const [margin, setMargin] = useState<number>(15); // 0, 15, 30
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [pdfName, setPdfName] = useState<string>("mediadocks_document");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const accepted = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (accepted.length === 0) {
      toast.error("Please upload valid image files");
      return;
    }

    const newItems: ImageItem[] = accepted.map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));

    setImages((prev) => [...prev, ...newItems]);
    toast.success(`Added ${newItems.length} image${newItems.length > 1 ? "s" : ""}`);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const nextIdx = index + direction;
    if (nextIdx < 0 || nextIdx >= images.length) return;
    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIdx, 0, moved);
    setImages(reordered);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id === id);
    });
  };

  const clearAll = () => {
    images.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setImages([]);
  };

  const generatePdf = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of images) {
        const arrayBuffer = await item.file.arrayBuffer();
        let pdfImage;

        // pdf-lib supports embedding PNG and JPG natively
        if (item.file.type === "image/png") {
          pdfImage = await pdfDoc.embedPng(arrayBuffer);
        } else if (item.file.type === "image/jpeg" || item.file.type === "image/jpg") {
          pdfImage = await pdfDoc.embedJpg(arrayBuffer);
        } else {
          // Convert WebP/GIF/SVG/AVIF to PNG via offscreen canvas
          const img = new Image();
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
            img.src = item.previewUrl;
          });

          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas unsupported");
          ctx.drawImage(img, 0, 0);

          const pngBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
          const pngBuffer = await pngBlob.arrayBuffer();
          pdfImage = await pdfDoc.embedPng(pngBuffer);
        }

        const imgWidth = pdfImage.width;
        const imgHeight = pdfImage.height;

        let pageWidth = imgWidth;
        let pageHeight = imgHeight;

        if (pageSize === "a4") {
          pageWidth = PageSizes.A4[0];
          pageHeight = PageSizes.A4[1];
        } else if (pageSize === "letter") {
          pageWidth = PageSizes.Letter[0];
          pageHeight = PageSizes.Letter[1];
        }

        if (orientation === "landscape" && pageSize !== "fit") {
          const temp = pageWidth;
          pageWidth = pageHeight;
          pageHeight = temp;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Fit image within margins
        const availableW = pageWidth - margin * 2;
        const availableH = pageHeight - margin * 2;

        const scale = Math.min(availableW / imgWidth, availableH / imgHeight, 1);
        const drawW = imgWidth * scale;
        const drawH = imgHeight * scale;

        const x = margin + (availableW - drawW) / 2;
        const y = margin + (availableH - drawH) / 2;

        page.drawImage(pdfImage, {
          x,
          y,
          width: drawW,
          height: drawH,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pdfName.trim() || "document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsGenerating(false);
      toast.success("PDF created and downloaded successfully!");
    } catch (err: any) {
      setIsGenerating(false);
      toast.error("Failed to generate PDF", { description: err?.message || "Error processing image file." });
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Upload Box */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-border/80 bg-surface/70 p-8 text-center transition-all hover:border-primary/50 hover:bg-surface-strong sm:p-12"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            handleFiles(e.target.files);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px] bg-primary/10 text-primary">
          <FilePlus2 className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base sm:text-lg font-semibold text-foreground">
          Upload images to combine into PDF
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Select single or multiple photos · JPG, PNG, WebP, GIF, BMP · Rearrange in any order
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-[4px] border border-border/80 bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Vector PDF Compilation · Lossless Embedding · 100% Private</span>
        </div>
      </div>

      {images.length > 0 && (
        <div className="mt-8 space-y-6">
          {/* Settings Bar */}
          <div className="rounded-xl border border-border/80 bg-surface p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Page Size */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Page Size:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as any)}
                  className="rounded-[4px] border border-border bg-surface-strong px-2 py-1 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="a4">A4 Standard</option>
                  <option value="letter">US Letter</option>
                  <option value="fit">Fit to Image</option>
                </select>
              </div>

              {/* Orientation */}
              {pageSize !== "fit" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Orientation:</span>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as any)}
                    className="rounded-[4px] border border-border bg-surface-strong px-2 py-1 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              )}

              {/* Margins */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Margin:</span>
                <select
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="rounded-[4px] border border-border bg-surface-strong px-2 py-1 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                >
                  <option value={0}>None (0 pt)</option>
                  <option value={15}>Small (15 pt)</option>
                  <option value={30}>Normal (30 pt)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="h-[34px] rounded-[4px] px-3 text-xs font-medium text-muted-foreground shadow-none"
              >
                Clear all ({images.length})
              </Button>
              <Button
                size="sm"
                onClick={generatePdf}
                disabled={isGenerating}
                className="h-[34px] rounded-[4px] px-4 text-xs font-medium shadow-none"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    Convert & Download PDF ({images.length})
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Reorderable Image Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((item, idx) => (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border/80 bg-surface shadow-none"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-strong/60 p-2 flex items-center justify-center">
                  <img
                    src={item.previewUrl}
                    alt={`Slide ${idx + 1}`}
                    className="max-h-full max-w-full object-contain rounded"
                  />
                  <span className="absolute top-2 left-2 rounded-[4px] bg-background/90 border border-border/60 px-2 py-0.5 text-[10px] font-mono font-bold">
                    #{idx + 1}
                  </span>
                </div>

                <div className="p-2 border-t border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveImage(idx, -1)}
                      className="rounded-[4px] p-1 text-muted-foreground hover:bg-surface-strong hover:text-foreground disabled:opacity-30"
                      title="Move backward"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => moveImage(idx, 1)}
                      className="rounded-[4px] p-1 text-muted-foreground hover:bg-surface-strong hover:text-foreground disabled:opacity-30"
                      title="Move forward"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeImage(item.id)}
                    className="rounded-[4px] p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Remove image"
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
