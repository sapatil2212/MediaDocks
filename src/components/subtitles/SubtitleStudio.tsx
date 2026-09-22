"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Captions,
  Check,
  Download,
  FileUp,
  Link2,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { downloadFile } from "@/src/lib/transcribe";
import { exceedsUploadLimit, MAX_UPLOAD_MB } from "@/src/lib/transcribe-input";
import {
  formatClock,
  normalizeCues,
  parseSubtitleFile,
  shiftCues,
  subtitleFileName,
  toPlainText,
  toSrt,
  toVtt,
  validateCues,
  type SubtitleCue,
} from "@/src/lib/subtitles";

type Tab = "file" | "link";
type Stage = "idle" | "working" | "ready" | "error";

interface SubtitleResponse {
  title: string;
  cues: SubtitleCue[];
  duration: number;
  language: string | null;
  timingSource: "platform" | "generated";
  windowSeconds: number;
}

const VIDEO_ACCEPT =
  "video/*,audio/*,.mp4,.mov,.avi,.mkv,.webm,.m4v,.mpeg,.mpg,.mp3,.wav,.m4a,.aac,.flac,.ogg";

function errorMessageFrom(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) return error;
  }
  return fallback;
}

export function SubtitleStudio() {
  const [tab, setTab] = useState<Tab>("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [title, setTitle] = useState("subtitles");
  const [timingSource, setTimingSource] = useState<"platform" | "generated">("generated");
  const [mediaUrl, setMediaUrl] = useState<string>();
  const [currentTime, setCurrentTime] = useState(0);
  const [copied, setCopied] = useState(false);

  const mediaRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Object URLs are revoked on replacement and unmount so a long editing
  // session does not accumulate blobs in memory.
  useEffect(() => {
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    };
  }, [mediaUrl]);

  const issues = useMemo(() => validateCues(cues), [cues]);
  const activeCue = cues.find((cue) => currentTime >= cue.start && currentTime <= cue.end);

  const selectFile = (selected: File) => {
    const looksLikeMedia =
      selected.type.startsWith("video/") ||
      selected.type.startsWith("audio/") ||
      /\.(mp4|mov|avi|mkv|webm|m4v|mpeg|mpg|mp3|wav|m4a|aac|flac|ogg)$/i.test(selected.name);

    if (!looksLikeMedia) {
      toast.error("Unsupported file", { description: "Choose a video or audio file." });
      return;
    }
    if (exceedsUploadLimit(selected.size)) {
      toast.error(`File exceeds the ${MAX_UPLOAD_MB} MB limit`);
      return;
    }

    setFile(selected);
    setMediaUrl(URL.createObjectURL(selected));
    setCues([]);
    setStage("idle");
    toast.success(`Selected ${selected.name}`);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) selectFile(dropped);
  };

  /** Imports an existing SRT or VTT file instead of generating one. */
  const onImportSubtitles = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    try {
      const parsed = normalizeCues(parseSubtitleFile(await selected.text()));
      if (parsed.length === 0) {
        toast.error("No cues found", { description: "The file did not contain readable SRT or VTT cues." });
        return;
      }
      setCues(parsed);
      setTitle(selected.name.replace(/\.[^.]+$/, "") || "subtitles");
      setTimingSource("platform");
      setStage("ready");
      toast.success(`Imported ${parsed.length} cues`);
    } catch {
      toast.error("That subtitle file could not be read");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const generate = async () => {
    if (tab === "file" && !file) return toast.error("Select a video file first");
    if (tab === "link" && !url.trim()) return toast.error("Paste a public link first");

    setStage("working");
    setErrorMessage("");

    try {
      const response =
        tab === "file"
          ? await (() => {
              const body = new FormData();
              body.append("file", file as File);
              return fetch("/api/subtitles", { method: "POST", body });
            })()
          : await fetch("/api/subtitles", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: url.trim() }),
            });

      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(errorMessageFrom(payload, "Could not generate subtitles."));

      const data = payload as SubtitleResponse;
      if (!data.cues?.length) throw new Error("No speech was detected in this media.");

      setCues(data.cues);
      setTitle(data.title || "subtitles");
      setTimingSource(data.timingSource);
      setStage("ready");
      toast.success(`${data.cues.length} cues ready to edit`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      setErrorMessage(message);
      setStage("error");
      toast.error(message);
    }
  };

  const updateCue = (id: string, patch: Partial<SubtitleCue>) => {
    setCues((current) => current.map((cue) => (cue.id === id ? { ...cue, ...patch } : cue)));
  };

  const removeCue = (id: string) => {
    setCues((current) => current.filter((cue) => cue.id !== id));
  };

  const applyShift = (seconds: number) => {
    setCues((current) => shiftCues(current, seconds));
    toast.success(`Shifted ${seconds > 0 ? "+" : ""}${seconds}s`);
  };

  const reset = () => {
    setStage("idle");
    setCues([]);
    setFile(null);
    setUrl("");
    setErrorMessage("");
    setMediaUrl(undefined);
    setCurrentTime(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const copySrt = async () => {
    try {
      await navigator.clipboard.writeText(toSrt(cues));
      setCopied(true);
      toast.success("SRT copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard access was blocked");
    }
  };

  /* ── Editor ───────────────────────────────────────────────────────────── */
  if (stage === "ready" && cues.length > 0) {
    return (
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-border/80 bg-surface/90 shadow-lift backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-surface-strong/50 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Captions className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold">{title}</h2>
              <p className="text-xs text-muted-foreground">
                {cues.length} cues ·{" "}
                {timingSource === "platform"
                  ? "timings from the source file"
                  : "timings estimated from speech windows"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copySrt}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-strong"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Captions className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy SRT"}
            </button>
            {(
              [
                ["srt", toSrt],
                ["vtt", toVtt],
                ["txt", toPlainText],
              ] as const
            ).map(([extension, render]) => (
              <button
                key={extension}
                type="button"
                onClick={() => {
                  downloadFile(render(cues), subtitleFileName(title, extension), "text/plain;charset=utf-8");
                  toast.success(`${extension.toUpperCase()} downloaded`);
                }}
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Download className="h-3.5 w-3.5" />
                {extension.toUpperCase()}
              </button>
            ))}
            <button
              type="button"
              onClick={reset}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Preview */}
          <div className="border-b border-border/60 p-5 lg:border-b-0 lg:border-r">
            {mediaUrl ? (
              <div className="relative overflow-hidden rounded-xl bg-black">
                <video
                  ref={mediaRef}
                  src={mediaUrl}
                  controls
                  preload="metadata"
                  onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                  className="max-h-72 w-full object-contain"
                />
                {/* Captions are overlaid from state so edits appear immediately,
                    without rebuilding a track blob on every keystroke. */}
                {activeCue ? (
                  <p className="pointer-events-none absolute inset-x-0 bottom-14 mx-auto w-fit max-w-[90%] whitespace-pre-line rounded-md bg-black/75 px-3 py-1.5 text-center text-sm font-medium leading-snug text-white">
                    {activeCue.text}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="grid h-44 place-items-center rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                <span>
                  No local preview for linked media.
                  <br />
                  Cue timings are still editable and exportable.
                </span>
              </div>
            )}

            <div className="mt-4 rounded-xl border border-border/70 bg-surface-strong/40 p-4">
              <p className="text-xs font-semibold">Sync adjustment</p>
              <p className="mt-1 text-[0.7rem] text-muted-foreground">
                Shift every cue if the subtitles run early or late.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {[-1, -0.5, 0.5, 1].map((offset) => (
                  <button
                    key={offset}
                    type="button"
                    onClick={() => applyShift(offset)}
                    className="focus-ring inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium hover:bg-surface-strong"
                  >
                    {offset < 0 ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    {Math.abs(offset)}s
                  </button>
                ))}
              </div>
            </div>

            {issues.length > 0 ? (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  {issues.length} readability {issues.length === 1 ? "note" : "notes"}
                </p>
                <ul className="mt-2 space-y-1 text-[0.7rem] text-muted-foreground">
                  {issues.slice(0, 4).map((issue) => (
                    <li key={`${issue.cueId}-${issue.kind}`}>
                      {issue.cueId}: {issue.detail}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Cue list */}
          <div className="max-h-[32rem] overflow-y-auto p-5">
            <ul className="space-y-3">
              {cues.map((cue) => {
                const isActive = activeCue?.id === cue.id;
                return (
                  <li
                    key={cue.id}
                    className={`rounded-xl border p-3 transition-colors ${
                      isActive ? "border-primary/50 bg-primary/5" : "border-border/70 bg-surface-strong/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (mediaRef.current) mediaRef.current.currentTime = cue.start;
                        }}
                        className="focus-ring figure-mono rounded bg-surface px-2 py-1 text-[0.65rem] font-semibold text-primary"
                      >
                        {formatClock(cue.start)} → {formatClock(cue.end)}
                      </button>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          value={cue.start}
                          onChange={(event) => updateCue(cue.id, { start: Number(event.target.value) })}
                          aria-label={`Start time for ${cue.id}`}
                          className="focus-ring w-20 rounded border border-border bg-background px-1.5 py-1 text-[0.65rem]"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={cue.end}
                          onChange={(event) => updateCue(cue.id, { end: Number(event.target.value) })}
                          aria-label={`End time for ${cue.id}`}
                          className="focus-ring w-20 rounded border border-border bg-background px-1.5 py-1 text-[0.65rem]"
                        />
                        <button
                          type="button"
                          onClick={() => removeCue(cue.id)}
                          aria-label={`Delete ${cue.id}`}
                          className="focus-ring rounded p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={cue.text}
                      onChange={(event) => updateCue(cue.id, { text: event.target.value })}
                      rows={2}
                      aria-label={`Text for ${cue.id}`}
                      className="focus-ring mt-2 w-full resize-y rounded-lg border border-transparent bg-transparent p-1 text-sm leading-6 focus:border-border focus:bg-background"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  /* ── Input ────────────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-3xl border border-border/80 bg-surface/85 p-4 shadow-lift backdrop-blur-2xl sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
          <div className="flex items-center gap-2">
            {(
              [
                ["file", "File upload", Upload],
                ["link", "Paste link", Link2],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                disabled={stage === "working"}
                aria-pressed={tab === id}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all disabled:opacity-60 sm:text-sm ${
                  tab === id
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-surface-strong hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            disabled={stage === "working"}
            className="focus-ring inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
          >
            <FileUp className="h-3.5 w-3.5" />
            Import SRT/VTT
          </button>
        </div>

        <input
          ref={importInputRef}
          type="file"
          accept=".srt,.vtt,text/vtt,text/plain"
          onChange={onImportSubtitles}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept={VIDEO_ACCEPT}
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) selectFile(selected);
          }}
          className="hidden"
        />

        {stage === "working" ? (
          <div className="py-14 text-center" aria-live="polite">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold sm:text-xl">Generating subtitles…</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              The audio is split into short windows and transcribed in order, so each cue lands close
              to the speech it belongs to.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Longer videos take proportionally longer. Keep this page open.
            </p>
          </div>
        ) : (
          <>
            {tab === "file" ? (
              <div className="mt-6">
                {file ? (
                  <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:flex-row">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Captions className="h-6 w-6" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB · Ready
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={reset}
                        aria-label="Remove file"
                        className="rounded-lg border border-border bg-surface p-1.5 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-12 ${
                      isDragging
                        ? "border-primary bg-primary/10"
                        : "border-border/80 bg-surface/40 hover:border-primary/50"
                    }`}
                  >
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <Upload className="h-8 w-8" />
                    </div>
                    <h4 className="mt-4 text-lg font-semibold">Drop your video here to upload</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      MP4, MOV, MKV, WebM, AVI and audio files · up to {MAX_UPLOAD_MB} MB
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                      <Upload className="h-4 w-4" />
                      Upload a file
                    </span>
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
                    placeholder="Paste a public YouTube, Facebook, Instagram, X or Pinterest link"
                    className="w-full rounded-xl border border-border/80 bg-surface py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <p className="mt-2.5 text-[11px] text-muted-foreground">
                  If the platform already publishes captions, those exact timings are used instead of
                  generated ones.
                </p>
              </div>
            )}

            {stage === "error" && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-4 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>Cue timings are editable after generation. Temporary media is deleted after processing.</span>
              </p>
              <button
                type="button"
                onClick={generate}
                className="focus-ring inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition-all hover:bg-primary/90 active:scale-95 sm:w-auto"
              >
                <Sparkles className="h-4 w-4" />
                Generate subtitles
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
