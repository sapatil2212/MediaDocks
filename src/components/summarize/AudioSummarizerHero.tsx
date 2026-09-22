"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  AudioLines,
  Check,
  Copy,
  Download,
  FileAudio,
  Link2,
  Loader2,
  Mic,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { downloadFile, type TranscriptionResult } from "@/src/lib/transcribe";
import {
  acceptAttribute,
  exceedsUploadLimit,
  isAcceptedUpload,
  MAX_UPLOAD_MB,
} from "@/src/lib/transcribe-input";
import {
  countWords,
  isSummarizable,
  MIN_TRANSCRIPT_WORDS,
  SUMMARY_FORMATS,
  SUMMARY_LENGTHS,
  summaryFileName,
  summaryToText,
  type SummaryFormat,
  type SummaryLength,
  type SummaryResult,
} from "@/src/lib/summarize";

type Tab = "file" | "link" | "record";
type Stage = "idle" | "transcribing" | "summarizing" | "done" | "error";

/** Recording ceiling, chosen to stay inside the upload limit. */
const MAX_RECORDING_SECONDS = 15 * 60;

function errorMessageFrom(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) return error;
  }
  return fallback;
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function AudioSummarizerHero() {
  const [tab, setTab] = useState<Tab>("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<SummaryFormat>("brief");
  const [length, setLength] = useState<SummaryLength>("medium");
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // A live microphone stream must be released even if the component unmounts
  // mid-recording, otherwise the browser keeps showing the recording indicator.
  useEffect(() => {
    return () => {
      stopTimer();
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const acceptFile = (selected: File) => {
    if (!isAcceptedUpload(selected.name, selected.type, "audio")) {
      toast.error("Unsupported file format", {
        description: "Choose an audio file such as MP3, WAV, M4A, FLAC, or OGG.",
      });
      return;
    }
    if (exceedsUploadLimit(selected.size)) {
      toast.error(`File exceeds the ${MAX_UPLOAD_MB} MB limit`);
      return;
    }
    setFile(selected);
    setSummary(null);
    setTranscript("");
    setStage("idle");
    toast.success(`Selected ${selected.name}`);
  };

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) acceptFile(selected);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) acceptFile(dropped);
  };

  const startRecording = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Recording is not supported in this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const extension = (recorder.mimeType || "audio/webm").includes("ogg") ? "ogg" : "webm";
        const recorded = new File([blob], `recording.${extension}`, { type: blob.type });
        if (exceedsUploadLimit(recorded.size)) {
          toast.error(`Recording exceeds the ${MAX_UPLOAD_MB} MB limit`);
          return;
        }
        setFile(recorded);
        setSummary(null);
        setTranscript("");
        setStage("idle");
        toast.success(`Recorded ${formatClock(elapsed)} of audio`);
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed((seconds) => {
          if (seconds + 1 >= MAX_RECORDING_SECONDS) {
            recorder.stop();
            stopTimer();
            setIsRecording(false);
            toast.info("Reached the maximum recording length");
          }
          return seconds + 1;
        });
      }, 1000);
    } catch {
      toast.error("Microphone access was blocked", {
        description: "Allow microphone permission in your browser to record.",
      });
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    stopTimer();
    setIsRecording(false);
  };

  const run = async () => {
    if (tab === "link" && !url.trim()) return toast.error("Paste a public link first");
    if (tab !== "link" && !file) {
      return toast.error(tab === "record" ? "Record some audio first" : "Select an audio file first");
    }

    setStage("transcribing");
    setErrorMessage("");
    setSummary(null);
    setShowTranscript(false);

    try {
      // Step 1 — transcribe, reusing the existing speech pipeline.
      const transcribeResponse =
        tab === "link"
          ? await fetch("/api/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: url.trim() }),
            })
          : await (() => {
              const body = new FormData();
              body.append("file", file as File);
              return fetch("/api/transcribe", { method: "POST", body });
            })();

      const transcribePayload: unknown = await transcribeResponse.json().catch(() => null);
      if (!transcribeResponse.ok) {
        throw new Error(errorMessageFrom(transcribePayload, "Could not transcribe this audio."));
      }

      const transcription = transcribePayload as TranscriptionResult;
      const text = transcription.text?.trim() ?? "";
      if (!text) throw new Error("No speech was detected in this recording.");
      setTranscript(text);

      if (!isSummarizable(text)) {
        throw new Error(
          `This recording is too short to summarize. At least ${MIN_TRANSCRIPT_WORDS} spoken words are needed.`,
        );
      }

      // Step 2 — summarize the transcript.
      setStage("summarizing");
      const summaryResponse = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, format, length }),
      });
      const summaryPayload: unknown = await summaryResponse.json().catch(() => null);
      if (!summaryResponse.ok) {
        throw new Error(errorMessageFrom(summaryPayload, "Could not summarize this recording."));
      }

      setSummary(summaryPayload as SummaryResult);
      setStage("done");
      toast.success("Summary ready");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setErrorMessage(message);
      setStage("error");
      toast.error(message);
    }
  };

  const reset = () => {
    setStage("idle");
    setSummary(null);
    setTranscript("");
    setFile(null);
    setUrl("");
    setErrorMessage("");
    setShowTranscript(false);
    setElapsed(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const copySummary = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summaryToText(summary));
      setCopied(true);
      toast.success("Summary copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard access was blocked");
    }
  };

  const busy = stage === "transcribing" || stage === "summarizing";

  /* ── Result view ──────────────────────────────────────────────────────── */
  if (stage === "done" && summary) {
    return (
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-border/80 bg-surface/90 shadow-lift backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-surface-strong/50 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold">{summary.title}</h2>
              <p className="text-xs text-muted-foreground">
                {SUMMARY_FORMATS.find((entry) => entry.id === summary.format)?.label} ·{" "}
                {summary.sourceWords.toLocaleString()} words transcribed
                {summary.language ? ` · ${summary.language}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copySummary}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-strong"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => {
                downloadFile(summaryToText(summary), summaryFileName(summary.title), "text/plain;charset=utf-8");
                toast.success("Summary downloaded");
              }}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Download className="h-3.5 w-3.5" />
              TXT
            </button>
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

        <div className="space-y-6 p-5 sm:p-6">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Summary</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-foreground">{summary.summary}</p>
          </section>

          {summary.keyPoints.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Key points</h3>
              <ul className="mt-2 space-y-2">
                {summary.keyPoints.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm leading-6">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {summary.actionItems.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Action items</h3>
              <ul className="mt-2 space-y-2">
                {summary.actionItems.map((item) => (
                  <li key={item} className="flex gap-2.5 rounded-lg border border-border/70 bg-surface-strong/40 p-3 text-sm leading-6">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {summary.format === "actionItems" && summary.actionItems.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
              No explicit decisions or follow-ups were committed to in this recording.
            </p>
          )}

          {summary.qa.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Questions &amp; answers
              </h3>
              <dl className="mt-2 space-y-3">
                {summary.qa.map((pair) => (
                  <div key={pair.question} className="rounded-lg border border-border/70 bg-surface-strong/40 p-3">
                    <dt className="text-sm font-semibold">{pair.question}</dt>
                    <dd className="mt-1 text-sm leading-6 text-muted-foreground">{pair.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {transcript ? (
            <section className="border-t border-border/60 pt-4">
              <button
                type="button"
                onClick={() => setShowTranscript((value) => !value)}
                aria-expanded={showTranscript}
                className="focus-ring text-xs font-semibold text-primary hover:underline"
              >
                {showTranscript ? "Hide full transcript" : "Show full transcript"}
              </button>
              {showTranscript && (
                <p className="mt-3 max-h-80 overflow-y-auto whitespace-pre-line rounded-xl border border-border/70 bg-background/60 p-4 text-xs leading-6 text-muted-foreground">
                  {transcript}
                </p>
              )}
            </section>
          ) : null}
        </div>
      </div>
    );
  }

  /* ── Input view ───────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-3xl border border-border/80 bg-surface/85 p-4 shadow-lift backdrop-blur-2xl sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["file", "File upload", Upload],
                ["link", "Paste link", Link2],
                ["record", "Record audio", Mic],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                disabled={busy || isRecording}
                aria-pressed={tab === id}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all disabled:opacity-60 sm:text-sm ${
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
          <span className="hidden items-center gap-1.5 rounded-full border border-border/80 bg-surface-strong px-3 py-1 text-[11px] font-medium text-muted-foreground sm:flex">
            <AudioLines className="h-3 w-3 text-primary" />
            Automatic language detection
          </span>
        </div>

        {busy ? (
          <div className="py-14 text-center" aria-live="polite">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold sm:text-xl">
              {stage === "transcribing" ? "Transcribing your audio…" : "Writing your summary…"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {stage === "transcribing"
                ? "The recording is being converted to text first, so the summary is based on the actual words."
                : "Condensing the transcript into the format you chose."}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Long recordings can take several minutes. Keep this page open.
            </p>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              onChange={onFileInput}
              accept={acceptAttribute("audio")}
              className="hidden"
            />

            {tab === "file" && (
              <div className="mt-6">
                {file ? (
                  <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:flex-row">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <FileAudio className="h-6 w-6" />
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
                      isDragging ? "border-primary bg-primary/10" : "border-border/80 bg-surface/40 hover:border-primary/50"
                    }`}
                  >
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <AudioLines className="h-8 w-8" />
                    </div>
                    <h4 className="mt-4 text-lg font-semibold">Drop your audio file here</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      MP3, WAV, M4A, FLAC, OGG, AAC · up to {MAX_UPLOAD_MB} MB
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                      <Upload className="h-4 w-4" />
                      Upload a file
                    </span>
                  </div>
                )}
              </div>
            )}

            {tab === "link" && (
              <div className="mt-6">
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="Paste a public link and we will summarize its audio"
                    className="w-full rounded-xl border border-border/80 bg-surface py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <p className="mt-2.5 text-[11px] text-muted-foreground">
                  Supported public links: YouTube, Facebook, Instagram, X and Pinterest.
                </p>
              </div>
            )}

            {tab === "record" && (
              <div className="mt-6 rounded-2xl border border-border/80 bg-surface/40 p-8 text-center sm:p-10">
                <div
                  className={`mx-auto grid h-16 w-16 place-items-center rounded-full border ${
                    isRecording
                      ? "animate-pulse border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-primary/30 bg-primary/10 text-primary"
                  }`}
                >
                  <Mic className="h-8 w-8" />
                </div>

                {isRecording ? (
                  <>
                    <p className="figure-mono mt-4 text-2xl font-semibold">{formatClock(elapsed)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Recording · up to {formatClock(MAX_RECORDING_SECONDS)}
                    </p>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="focus-ring mt-5 inline-flex items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground"
                    >
                      <Square className="h-4 w-4" />
                      Stop recording
                    </button>
                  </>
                ) : (
                  <>
                    <h4 className="mt-4 text-lg font-semibold">
                      {file?.name.startsWith("recording.") ? "Recording ready" : "Record from your microphone"}
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {file?.name.startsWith("recording.")
                        ? `${formatClock(elapsed)} captured · ${(file.size / 1024 / 1024).toFixed(2)} MB`
                        : "Your browser will ask for microphone permission."}
                    </p>
                    <button
                      type="button"
                      onClick={startRecording}
                      className="focus-ring mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                    >
                      <Mic className="h-4 w-4" />
                      {file?.name.startsWith("recording.") ? "Record again" : "Start recording"}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Format and length controls */}
            <div className="mt-6 grid gap-4 border-t border-border/70 pt-5 sm:grid-cols-2">
              <div>
                <label htmlFor="summary-format" className="text-xs font-semibold text-foreground">
                  Summary format
                </label>
                <select
                  id="summary-format"
                  value={format}
                  onChange={(event) => setFormat(event.target.value as SummaryFormat)}
                  className="focus-ring mt-2 w-full rounded-xl border border-border/80 bg-surface px-3 py-2.5 text-sm"
                >
                  {SUMMARY_FORMATS.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {SUMMARY_FORMATS.find((entry) => entry.id === format)?.description}
                </p>
              </div>
              <div>
                <label htmlFor="summary-length" className="text-xs font-semibold text-foreground">
                  Length
                </label>
                <select
                  id="summary-length"
                  value={length}
                  onChange={(event) => setLength(event.target.value as SummaryLength)}
                  className="focus-ring mt-2 w-full rounded-xl border border-border/80 bg-surface px-3 py-2.5 text-sm"
                >
                  {SUMMARY_LENGTHS.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {SUMMARY_LENGTHS.find((entry) => entry.id === length)?.hint}
                </p>
              </div>
            </div>

            {stage === "error" && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {transcript && stage === "error" ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                The transcript was produced ({countWords(transcript).toLocaleString()} words) but the summary step
                failed.
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-4 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>Audio is transcribed first, then summarized. Temporary files are deleted after processing.</span>
              </p>
              <button
                type="button"
                onClick={run}
                disabled={isRecording}
                className="focus-ring inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60 sm:w-auto"
              >
                <Sparkles className="h-4 w-4" />
                Summarize audio
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
