"use client";

import { useState, ChangeEvent } from "react";
import { toast } from "sonner";
import {
  Binary,
  Copy,
  Download,
  Upload,
  Check,
  Code2,
  FileImage,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Base64ImageHero() {
  const [tab, setTab] = useState<"encode" | "decode">("encode");

  // Encode
  const [base64String, setBase64String] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number; mime: string } | null>(null);

  // Decode
  const [decodeInput, setDecodeInput] = useState<string>("");
  const [decodedPreview, setDecodedPreview] = useState<string | null>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileMeta({ name: file.name, size: file.size, mime: file.type });
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBase64String(result);
      setImagePreview(result);
      toast.success("Image converted to Base64!");
    };
    reader.readAsDataURL(file);
  };

  const copySnippet = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleDecode = (text: string) => {
    setDecodeInput(text);
    const clean = text.trim();
    if (clean.startsWith("data:image/") || clean.startsWith("iVBORw0KGgo") || clean.startsWith("/9j/")) {
      const dataUri = clean.startsWith("data:image/") ? clean : `data:image/png;base64,${clean}`;
      setDecodedPreview(dataUri);
    } else {
      setDecodedPreview(null);
    }
  };

  const downloadDecodedImage = () => {
    if (!decodedPreview) return;
    const a = document.createElement("a");
    a.href = decodedPreview;
    a.download = `decoded_image_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Decoded image downloaded!");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Mode Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-[4px] border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setTab("encode")}
            className={cn(
              "rounded-[4px] px-4 py-1.5 text-xs font-medium transition-colors",
              tab === "encode"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Image to Base64 (Encode)
          </button>
          <button
            type="button"
            onClick={() => setTab("decode")}
            className={cn(
              "rounded-[4px] px-4 py-1.5 text-xs font-medium transition-colors",
              tab === "decode"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Base64 to Image (Decode)
          </button>
        </div>
      </div>

      {tab === "encode" ? (
        <div className="space-y-6 rounded-2xl border border-border/80 bg-surface p-6">
          {!imagePreview ? (
            <label className="cursor-pointer block rounded-xl border-2 border-dashed border-border/80 bg-surface-strong/60 p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[5px] bg-primary/10 text-primary">
                <Upload className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-sm font-semibold text-foreground">Upload image to encode</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Converts JPG, PNG, WebP, SVG into an embeddable data URL string
              </p>
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-10 w-10 object-contain rounded border border-border bg-surface-strong"
                  />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{fileMeta?.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Base64 length: {base64String.length.toLocaleString()} characters
                    </p>
                  </div>
                </div>
                <label className="cursor-pointer text-xs text-primary hover:underline">
                  Change image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              {/* Formats Copy */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Data URI:</span>
                    <button
                      type="button"
                      onClick={() => copySnippet(base64String)}
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      <Copy className="h-3 w-3" /> Copy Data URI
                    </button>
                  </div>
                  <textarea
                    readOnly
                    rows={3}
                    value={base64String}
                    className="w-full rounded-[4px] border border-border bg-surface-strong p-2 font-mono text-[11px] text-muted-foreground select-all focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">HTML Image Tag:</span>
                    <button
                      type="button"
                      onClick={() => copySnippet(`<img src="${base64String}" alt="${fileMeta?.name || "image"}" />`)}
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      <Copy className="h-3 w-3" /> Copy HTML
                    </button>
                  </div>
                  <textarea
                    readOnly
                    rows={2}
                    value={`<img src="${base64String}" alt="${fileMeta?.name || "image"}" />`}
                    className="w-full rounded-[4px] border border-border bg-surface-strong p-2 font-mono text-[11px] text-muted-foreground select-all focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 rounded-2xl border border-border/80 bg-surface p-6">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Paste Base64 or Data URI string here:
            </label>
            <textarea
              rows={4}
              value={decodeInput}
              onChange={(e) => handleDecode(e.target.value)}
              placeholder="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
              className="w-full rounded-[4px] border border-border bg-surface-strong p-3 font-mono text-[11px] text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {decodedPreview && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border/60 bg-surface-strong p-4">
              <div className="flex items-center gap-4">
                <img
                  src={decodedPreview}
                  alt="Decoded"
                  className="max-h-24 max-w-[120px] object-contain rounded border border-border bg-surface"
                />
                <div>
                  <p className="text-xs font-semibold text-foreground">Valid Base64 Image</p>
                  <p className="text-[11px] text-muted-foreground">Ready to download as PNG</p>
                </div>
              </div>

              <Button
                onClick={downloadDecodedImage}
                className="h-[34px] rounded-[4px] text-xs font-medium shadow-none"
              >
                <Download className="h-3.5 w-3.5" />
                Download Decoded Image
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
