"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  AudioLines,
  FileAudio,
  FileVideo,
  Globe,
  Link2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { TranscriptionResult } from "@/src/lib/transcribe";
import {
  acceptAttribute,
  exceedsUploadLimit,
  isAcceptedUpload,
  MAX_UPLOAD_MB,
  variantCopy,
  type TranscribeVariant,
} from "@/src/lib/transcribe-input";
import { TranscriptEditor } from "./TranscriptEditor";

const PROGRESS_MESSAGES = [
  "Securely preparing the media...",
  "Extracting and optimizing the speech track...",
  "Detecting language and transcribing every spoken word...",
];

function responseError(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Failed to transcribe this media.";
  const error = (payload as { error?: unknown }).error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Failed to transcribe this media.";
}

export function TranscribeHero({ variant = "video" }: { variant?: TranscribeVariant } = {}) {
  const copy = variantCopy(variant);
  const [activeTab, setActiveTab] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "result" | "error">("idle");
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    };
  }, [mediaPreviewUrl]);

  const handleSelectedFile = (selected: File) => {
    if (!isAcceptedUpload(selected.name, selected.type, variant)) {
      toast.error("Unsupported file format", { description: copy.unsupportedDescription });
      return;
    }
    if (exceedsUploadLimit(selected.size)) {
      toast.error(`File exceeds the ${MAX_UPLOAD_MB} MB limit`);
      return;
    }

    setFile(selected);
    setResult(null);
    setStatus("idle");
    setMediaPreviewUrl(URL.createObjectURL(selected));
    toast.success(`Selected ${selected.name}`);
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) handleSelectedFile(selected);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const selected = event.dataTransfer.files?.[0];
    if (selected) handleSelectedFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    setMediaPreviewUrl(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePasteClipboard = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) return toast.error("Clipboard is empty");
      setUrl(text);
      toast.success("Link pasted");
    } catch {
      toast.error("Clipboard access was blocked");
    }
  };

  const startTranscription = async () => {
    if (activeTab === "file" && !file) return toast.error(copy.emptyFileError);
    if (activeTab === "link" && !url.trim()) return toast.error("Paste a public video link first");

    setStatus("processing");
    setProgressStep(0);
    setErrorMessage("");
    const stepTimer = window.setInterval(() => {
      setProgressStep((current) => Math.min(current + 1, PROGRESS_MESSAGES.length - 1));
    }, 4500);

    try {
      let response: Response;
      if (activeTab === "file" && file) {
        const body = new FormData();
        body.append("file", file);
        response = await fetch("/api/transcribe", { method: "POST", body });
      } else {
        response = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });
      }

      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseError(payload));

      const transcription = payload as TranscriptionResult;
      if (!transcription.text?.trim() && transcription.segments.length === 0) {
        throw new Error("No spoken words were detected in this media.");
      }

      setResult(transcription);
      setStatus("result");
      toast.success("Transcription complete", {
        description: `${transcription.wordCount.toLocaleString()} words are ready to preview and download.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transcription failed. Please try again.";
      setErrorMessage(message);
      setStatus("error");
      toast.error(message);
    } finally {
      window.clearInterval(stepTimer);
    }
  };

  const resetAll = () => {
    setStatus("idle");
    setResult(null);
    setFile(null);
    setUrl("");
    setErrorMessage("");
    setMediaPreviewUrl(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (status === "result" && result) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <TranscriptEditor
          result={result}
          onReset={resetAll}
          mediaFileUrl={mediaPreviewUrl}
          sourceUrl={url}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-3xl border border-border/80 bg-surface/85 p-4 shadow-lift backdrop-blur-2xl sm:p-7">
        <div className="flex items-center justify-between border-b border-border/70 pb-4">
          <div className="flex items-center gap-2">
            {(["file", "link"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                disabled={status === "processing"}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-surface-strong hover:text-foreground"
                }`}
              >
                {tab === "file" ? <Upload className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                {tab === "file" ? "File upload" : "Paste link"}
              </button>
            ))}
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-border/80 bg-surface-strong px-3 py-1 text-[11px] font-medium text-muted-foreground sm:flex">
            <Globe className="h-3 w-3 text-primary" />
            Automatic language detection
          </div>
        </div>

        {status === "processing" ? (
          <div className="py-14 text-center" aria-live="polite">
            <div className="relative mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-foreground sm:text-xl">Creating your transcript…</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {PROGRESS_MESSAGES[progressStep]}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Long recordings can take several minutes. Keep this page open.
            </p>
          </div>
        ) : (
          <>
            {activeTab === "file" ? (
              <div className="mt-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInput}
                  accept={acceptAttribute(variant)}
                  className="hidden"
                />
                {file ? (
                  <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:flex-row">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        {file.type.startsWith("audio/") ? <FileAudio className="h-6 w-6" /> : <FileVideo className="h-6 w-6" />}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">{file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB · Ready
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium">Change</button>
                      <button type="button" onClick={clearFile} className="rounded-lg border border-border bg-surface p-1.5 text-muted-foreground hover:text-destructive" aria-label="Remove file">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-12 ${isDragging ? "border-primary bg-primary/10" : "border-border/80 bg-surface/40 hover:border-primary/50"}`}
                  >
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                      {variant === "audio" ? <AudioLines className="h-8 w-8" /> : <Upload className="h-8 w-8" />}
                    </div>
                    <h4 className="mt-4 text-lg font-semibold text-foreground">{copy.dropzoneTitle}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{copy.dropzoneHint}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6">
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder={copy.linkPlaceholder}
                    className="w-full rounded-xl border border-border/80 bg-surface py-3 pl-10 pr-20 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button type="button" onClick={handlePasteClipboard} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-surface-strong px-2.5 py-1 text-xs font-medium hover:text-primary">Paste</button>
                </div>
                <p className="mt-2.5 text-[11px] text-muted-foreground">{copy.linkHint}</p>
              </div>
            )}

            {status === "error" && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-4 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>Original language is detected automatically. Temporary media is deleted after processing.</span>
              </div>
              <button type="button" onClick={startTranscription} className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition-all hover:bg-primary/90 active:scale-95 sm:w-auto">
                <Sparkles className="h-4 w-4" />
                Transcribe to text
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
