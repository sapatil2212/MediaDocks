"use client";

import { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import {
  FileVideo,
  Music,
  Upload,
  Download,
  Play,
  Pause,
  RotateCcw,
  SlidersHorizontal,
  Scissors,
  Volume2,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Zap,
  ShieldCheck,
  Clock,
  Radio,
  Layers,
  ArrowRight,
  X,
  Link2,
  Globe,
  ClipboardPaste,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AUDIO_OUTPUT_FORMATS,
  AUDIO_BITRATES,
  AUDIO_CHANNELS,
  VOLUME_BOOST_OPTIONS,
  AudioOutputFormat,
  AudioBitrate,
  AudioChannels,
  VolumeBoostValue,
  formatFileSize,
  formatAudioDuration,
  isSupportedVideoFile,
} from "@/src/lib/video-to-audio";
import { cn } from "@/lib/utils";

const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB chunks for smooth streaming upload

interface VideoMetadata {
  name: string;
  size: number;
  duration: number;
  width?: number;
  height?: number;
}

interface ConversionResult {
  token: string;
  filename: string;
  format: AudioOutputFormat;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
  durationFormatted: string;
  downloadUrl: string;
}

type Stage = "idle" | "selected" | "uploading" | "extracting" | "ready" | "error";

export function VideoToAudioHero() {
  const [stage, setStage] = useState<Stage>("idle");
  const [sourceType, setSourceType] = useState<"file" | "link">("file");
  const [videoUrl, setVideoUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [videoMeta, setVideoMeta] = useState<VideoMetadata | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Conversion Options
  const [format, setFormat] = useState<AudioOutputFormat>("mp3");
  const [bitrate, setBitrate] = useState<AudioBitrate>("320k");
  const [channels, setChannels] = useState<AudioChannels>("2");
  const [volume, setVolume] = useState<VolumeBoostValue>("1.0");
  const [enableTrim, setEnableTrim] = useState(false);
  const [trimStart, setTrimStart] = useState("00:00:00");
  const [trimEnd, setTrimEnd] = useState("00:00:00");

  // Progress tracking
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState("");
  const [uploadEta, setUploadEta] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Result
  const [result, setResult] = useState<ConversionResult | null>(null);

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedFormatConfig =
    AUDIO_OUTPUT_FORMATS.find((f) => f.format === format) || AUDIO_OUTPUT_FORMATS[0];

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFileSelect = (selected: File) => {
    if (!isSupportedVideoFile(selected.name)) {
      toast.error("Unsupported file format", {
        description: "Please select a valid video file (MP4, MKV, MOV, WebM, AVI, etc.).",
      });
      return;
    }

    setSourceType("file");
    setFile(selected);
    setVideoUrl("");
    setStage("selected");
    setErrorMessage("");
    setResult(null);

    // Probe duration and resolution in-browser via a temporary object URL
    const probeUrl = URL.createObjectURL(selected);
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      const dur = video.duration || 0;
      setVideoMeta({
        name: selected.name,
        size: selected.size,
        duration: dur,
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined,
      });
      setTrimEnd(formatAudioDuration(dur));
      URL.revokeObjectURL(probeUrl);
    };

    video.onerror = () => {
      // Fallback if browser can't decode the video container preview locally (e.g. MKV/AVI)
      setVideoMeta({
        name: selected.name,
        size: selected.size,
        duration: 0,
      });
      URL.revokeObjectURL(probeUrl);
    };

    video.src = probeUrl;
    toast.success(`Selected ${selected.name}`);
  };

  const handleLinkSubmit = (rawInput?: string) => {
    const candidate = (rawInput ?? videoUrl).trim();
    if (!candidate) {
      toast.error("Please enter a video URL first.");
      return;
    }
    if (!/^https?:\/\//i.test(candidate)) {
      toast.error("Please enter a valid HTTP or HTTPS video link.");
      return;
    }
    setSourceType("link");
    setVideoUrl(candidate);
    setFile(null);
    setVideoMeta(null);
    setStage("selected");
    setErrorMessage("");
    setResult(null);
    toast.success("Video link added. Choose your audio settings below.");
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileSelect(dropped);
  };

  const cancelOperation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStage("selected");
    setUploadProgress(0);
    toast.info("Conversion cancelled");
  };

  const resetAll = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setFile(null);
    setVideoUrl("");
    setVideoMeta(null);
    setStage("idle");
    setUploadProgress(0);
    setResult(null);
    setErrorMessage("");
    setIsPlaying(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startExtraction = async () => {
    if (sourceType === "file" && !file) {
      toast.error("Please select a video file first.");
      return;
    }
    if (sourceType === "link" && !videoUrl.trim()) {
      toast.error("Please enter a video URL first.");
      return;
    }

    setErrorMessage("");
    abortControllerRef.current = new AbortController();

    if (sourceType === "link") {
      setStage("extracting");
      try {
        const extractResponse = await fetch("/api/video-to-audio/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: videoUrl.trim(),
            format,
            bitrate,
            channels,
            volume,
            trimStart: enableTrim ? trimStart : null,
            trimEnd: enableTrim ? trimEnd : null,
          }),
          signal: abortControllerRef.current.signal,
        });

        const extractData = await extractResponse.json().catch(() => null);
        if (!extractResponse.ok) {
          throw new Error(extractData?.error || "Audio extraction from link failed.");
        }

        const downloadUrl = `/api/video-to-audio/download?token=${extractData.token}`;
        setResult({
          ...extractData,
          downloadUrl,
        });
        setStage("ready");
        toast.success("Audio extracted successfully!", {
          description: `Generated ${extractData.filename} (${formatFileSize(extractData.sizeBytes)})`,
        });
      } catch (err: any) {
        if (err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Something went wrong during extraction.";
        setErrorMessage(message);
        setStage("error");
        toast.error(message);
      }
      return;
    }

    const currentFile = file;
    if (!currentFile) {
      toast.error("Please select a video file first.");
      return;
    }

    setStage("uploading");
    setUploadProgress(0);

    const uploadId = `v2a_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const totalBytes = currentFile.size;
    const isChunked = totalBytes > 25 * 1024 * 1024; // Chunk if > 25 MB
    const totalChunks = isChunked ? Math.ceil(totalBytes / CHUNK_SIZE) : 1;

    abortControllerRef.current = new AbortController();
    const startTime = Date.now();

    try {
      if (isChunked) {
        // Chunked streaming upload for long/large videos (100MB to 5GB+)
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          if (abortControllerRef.current?.signal.aborted) return;

          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, totalBytes);
          const chunkBlob = currentFile.slice(start, end);

          const response = await fetch("/api/video-to-audio/upload", {
            method: "POST",
            headers: {
              "x-upload-id": uploadId,
              "x-chunk-index": String(chunkIndex),
              "x-total-chunks": String(totalChunks),
              "x-file-name": encodeURIComponent(currentFile.name),
              "x-file-size": String(totalBytes),
              "Content-Type": "application/octet-stream",
            },
            body: chunkBlob,
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(errData?.error || "Upload chunk failed.");
          }

          // Calculate progress & metrics
          const uploadedBytes = end;
          const pct = Math.round((uploadedBytes / totalBytes) * 100);
          setUploadProgress(pct);

          const elapsedSeconds = (Date.now() - startTime) / 1000;
          if (elapsedSeconds > 0) {
            const bytesPerSec = uploadedBytes / elapsedSeconds;
            const mbPerSec = (bytesPerSec / (1024 * 1024)).toFixed(1);
            setUploadSpeed(`${mbPerSec} MB/s`);

            const remainingBytes = totalBytes - uploadedBytes;
            const etaSec = Math.ceil(remainingBytes / bytesPerSec);
            setUploadEta(etaSec > 0 ? `~${etaSec}s remaining` : "Completing...");
          }
        }
      } else {
        // Single shot multipart for smaller videos
        const formData = new FormData();
        formData.append("file", currentFile);
        formData.append("uploadId", uploadId);

        setUploadProgress(50);
        const response = await fetch("/api/video-to-audio/upload", {
          method: "POST",
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.error || "Upload failed.");
        }
        setUploadProgress(100);
      }

      // Phase 2: Audio extraction
      setStage("extracting");

      const extractResponse = await fetch("/api/video-to-audio/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId,
          format,
          bitrate,
          channels,
          volume,
          trimStart: enableTrim ? trimStart : null,
          trimEnd: enableTrim ? trimEnd : null,
        }),
        signal: abortControllerRef.current.signal,
      });

      const extractData = await extractResponse.json().catch(() => null);
      if (!extractResponse.ok) {
        throw new Error(extractData?.error || "Audio extraction failed.");
      }

      const downloadUrl = `/api/video-to-audio/download?token=${extractData.token}`;
      setResult({
        ...extractData,
        downloadUrl,
      });
      setStage("ready");
      toast.success("Audio extracted successfully!", {
        description: `Generated ${extractData.filename} (${formatFileSize(extractData.sizeBytes)})`,
      });
    } catch (err: any) {
      if (err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Something went wrong during conversion.";
      setErrorMessage(message);
      setStage("error");
      toast.error(message);
    }
  };

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleAudioSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current && Number.isFinite(val)) {
      audioRef.current.currentTime = val;
      setAudioCurrentTime(val);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Hidden Audio Player for Preview */}
      {result?.downloadUrl && (
        <audio
          ref={audioRef}
          src={result.downloadUrl}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setAudioCurrentTime(audioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setAudioDuration(audioRef.current.duration);
            }
          }}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Main Studio Card */}
      <div className="relative rounded-2xl border border-border/80 bg-surface/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all">
        {/* Dynamic ambient highlight glow */}
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-20 blur-xl transition-opacity bg-gradient-to-r from-primary/30 via-emerald-500/20 to-primary/30"
          aria-hidden="true"
        />

        {/* ── STAGE: IDLE ─────────────────────────────────────────────────── */}
        {stage === "idle" && (
          <div className="space-y-6">
            {/* Top Toggle: Upload Video File vs Paste Video Link */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-xl border border-border bg-surface-strong/80 p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setSourceType("file")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all",
                    sourceType === "file"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface/50",
                  )}
                >
                  <Upload className="h-4 w-4" />
                  Upload Video File
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType("link")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all",
                    sourceType === "link"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface/50",
                  )}
                >
                  <Link2 className="h-4 w-4" />
                  Paste Video Link
                </button>
              </div>
            </div>

            {sourceType === "file" ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 sm:p-14 text-center transition-all cursor-pointer",
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border/80 hover:border-primary/50 hover:bg-surface-strong/50",
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,.mp4,.mov,.avi,.mkv,.webm,.m4v,.flv,.wmv,.ts,.3gp,.ogv,.mpeg,.mpg"
                  className="hidden"
                  onChange={(e) => {
                    const picked = e.target.files?.[0];
                    if (picked) handleFileSelect(picked);
                  }}
                />

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5 shadow-inner">
                  <Upload className="h-8 w-8 stroke-[1.75]" />
                </div>

                <h3 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
                  Drop any video here or click to browse
                </h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                  MP4, MKV, MOV, WebM, AVI, FLV & more. Upload long videos of any length — from 10 minutes to 3+ hours.
                </p>

                {/* Feature Pills */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-strong px-3 py-1 text-xs font-medium text-foreground/80">
                    <Zap className="h-3 w-3 text-amber-400" />
                    Zero File Size Limit
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-strong px-3 py-1 text-xs font-medium text-foreground/80">
                    <Music className="h-3 w-3 text-primary" />
                    Studio 320 kbps MP3
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-strong px-3 py-1 text-xs font-medium text-foreground/80">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    100% Ephemeral & Private
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border/80 bg-surface-strong/50 p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-foreground">Extract Audio from Video Link</h3>
                    <p className="text-xs text-muted-foreground">
                      Paste a public video link from YouTube, Instagram, Facebook, X, Pinterest, or any video URL.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleLinkSubmit();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text")?.trim();
                        if (pasted && /^https?:\/\//i.test(pasted)) {
                          setVideoUrl(pasted);
                          setTimeout(() => handleLinkSubmit(pasted), 50);
                        }
                      }}
                      placeholder="Paste video link (e.g. https://www.youtube.com/watch?v=...)"
                      className="w-full h-12 rounded-xl border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const clip = await navigator.clipboard.readText();
                        if (clip.trim()) {
                          setVideoUrl(clip.trim());
                          handleLinkSubmit(clip.trim());
                        } else {
                          toast.error("Clipboard is empty.");
                        }
                      } catch {
                        toast.error("Clipboard permission denied. Please paste manually.");
                      }
                    }}
                    className="h-12 px-4 rounded-xl shrink-0"
                  >
                    <ClipboardPaste className="h-4 w-4 mr-2" />
                    Paste
                  </Button>

                  <Button
                    type="button"
                    onClick={() => handleLinkSubmit()}
                    className="h-12 px-6 rounded-xl font-semibold shrink-0"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2 text-xs text-muted-foreground">
                  <span className="font-medium">Supported sources:</span>
                  <span className="rounded-full bg-surface px-2.5 py-1 border border-border/80">YouTube Videos & Shorts</span>
                  <span className="rounded-full bg-surface px-2.5 py-1 border border-border/80">Instagram Reels</span>
                  <span className="rounded-full bg-surface px-2.5 py-1 border border-border/80">Facebook Videos</span>
                  <span className="rounded-full bg-surface px-2.5 py-1 border border-border/80">X / Twitter</span>
                  <span className="rounded-full bg-surface px-2.5 py-1 border border-border/80">Pinterest Video Pins</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STAGE: SELECTED (Customizer & Settings) ────────────────────────── */}
        {(stage === "selected" || stage === "uploading" || stage === "extracting") && (file || videoUrl) && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/80 bg-surface-strong/70 p-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {sourceType === "file" ? <FileVideo className="h-6 w-6" /> : <Link2 className="h-6 w-6" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {sourceType === "file" ? file?.name : videoUrl}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {sourceType === "file" && file ? (
                      <>
                        <span>{formatFileSize(file.size)}</span>
                        {videoMeta?.duration ? (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatAudioDuration(videoMeta.duration)}
                            </span>
                          </>
                        ) : null}
                        {videoMeta?.width && videoMeta?.height ? (
                          <>
                            <span>•</span>
                            <span>
                              {videoMeta.width}x{videoMeta.height}
                            </span>
                          </>
                        ) : null}
                      </>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-500 font-medium">
                        <Globe className="h-3 w-3" />
                        Online Video Stream
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {stage === "selected" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAll}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  {sourceType === "file" ? "Change Video" : "Change Link"}
                </Button>
              )}
            </div>

            {/* Customization Controls (Disabled while processing) */}
            {stage === "selected" && (
              <div className="space-y-6 pt-2">
                {/* 1. Target Format Selection */}
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold block mb-3">
                    1. Choose Audio Format
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {AUDIO_OUTPUT_FORMATS.map((fmt) => {
                      const isSelected = format === fmt.format;
                      return (
                        <button
                          key={fmt.format}
                          type="button"
                          onClick={() => setFormat(fmt.format)}
                          className={cn(
                            "relative flex flex-col items-start p-3.5 rounded-xl border text-left transition-all",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border/70 bg-surface/50 hover:border-border hover:bg-surface-strong",
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-semibold text-sm text-foreground">{fmt.label}</span>
                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          <span className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                            {fmt.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Audio Quality / Bitrate (if applicable) */}
                {selectedFormatConfig.supportsBitrate && (
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold block mb-3">
                      2. Audio Bitrate & Quality
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {AUDIO_BITRATES.map((br) => {
                        const isSelected = bitrate === br.value;
                        return (
                          <button
                            key={br.value}
                            type="button"
                            onClick={() => setBitrate(br.value)}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border text-left text-xs transition-all",
                              isSelected
                                ? "border-primary bg-primary/10 font-semibold text-foreground"
                                : "border-border/70 bg-surface/50 text-muted-foreground hover:border-border hover:text-foreground",
                            )}
                          >
                            <span>{br.label.split("—")[0].trim()}</span>
                            {br.recommended && (
                              <span className="text-[10px] font-mono text-primary font-bold">BEST</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Channels & Volume Enhancements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Audio Channels */}
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold block mb-2">
                      Audio Channels
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {AUDIO_CHANNELS.map((ch) => {
                        const isSelected = channels === ch.value;
                        return (
                          <button
                            key={ch.value}
                            type="button"
                            onClick={() => setChannels(ch.value as AudioChannels)}
                            className={cn(
                              "p-2.5 rounded-lg border text-xs text-center transition-all",
                              isSelected
                                ? "border-primary bg-primary/10 font-medium text-foreground"
                                : "border-border/70 bg-surface/50 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {ch.label.split("(")[0].trim()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Volume Booster / Normalizer */}
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold block mb-2">
                      Volume Level & Gain
                    </label>
                    <select
                      value={volume}
                      onChange={(e) => setVolume(e.target.value as VolumeBoostValue)}
                      aria-label="Volume Level and Gain"
                      className="w-full rounded-lg border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {VOLUME_BOOST_OPTIONS.map((vol) => (
                        <option key={vol.value} value={vol.value}>
                          {vol.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Optional Audio Trimming */}
                <div className="rounded-xl border border-border/70 bg-surface-strong/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">
                        Clip / Trim Audio Segment
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableTrim}
                        onChange={(e) => setEnableTrim(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {enableTrim && (
                    <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">
                          Start Time (HH:MM:SS)
                        </label>
                        <input
                          type="text"
                          value={trimStart}
                          onChange={(e) => setTrimStart(e.target.value)}
                          placeholder="00:00:00"
                          className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 font-mono text-xs text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">
                          End Time (HH:MM:SS)
                        </label>
                        <input
                          type="text"
                          value={trimEnd}
                          onChange={(e) => setTrimEnd(e.target.value)}
                          placeholder="00:05:00"
                          className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 font-mono text-xs text-foreground"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
                <Button
                  onClick={startExtraction}
                  size="lg"
                  className="w-full py-6 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  Extract Audio ({selectedFormatConfig.label.toUpperCase()})
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* ── PROCESSING: Uploading & Extracting States ────────────────── */}
            {(stage === "uploading" || stage === "extracting") && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Music className="h-6 w-6 text-primary absolute inset-0 m-auto" />
                  </div>
                </div>

                {stage === "uploading" ? (
                  <div>
                    <h4 className="font-semibold text-foreground text-base">
                      Uploading video stream... {uploadProgress}%
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {uploadSpeed ? `${uploadSpeed} • ` : ""}
                      {uploadEta || "Preparing chunks..."}
                    </p>
                    <div className="mt-4 max-w-md mx-auto">
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-semibold text-foreground text-base animate-pulse">
                      Demuxing & Encoding Audio ({selectedFormatConfig.label})...
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Bypassing video frames with FFmpeg for instant extraction without quality loss.
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelOperation}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STAGE: READY (Audio Preview & Download) ────────────────────────── */}
        {stage === "ready" && result && (
          <div className="space-y-6">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5 sm:p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-3">
                <Check className="h-6 w-6 stroke-[2.5]" />
              </div>
              <h3 className="text-lg sm:text-xl font-display font-semibold text-foreground">
                Audio Extracted Successfully!
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Your video has been converted and the original file purged for privacy.
              </p>

              {/* Output File Details Pill */}
              <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-border bg-surface px-4 py-1.5 text-xs">
                <span className="font-semibold text-foreground">{result.filename}</span>
                <span className="text-border">|</span>
                <span className="text-primary font-mono uppercase">{result.format}</span>
                <span className="text-border">|</span>
                <span className="text-muted-foreground">{formatFileSize(result.sizeBytes)}</span>
                {result.durationSeconds > 0 && (
                  <>
                    <span className="text-border">|</span>
                    <span className="text-muted-foreground">{result.durationFormatted}</span>
                  </>
                )}
              </div>
            </div>

            {/* In-Browser Interactive Audio Player */}
            <div className="rounded-xl border border-border/80 bg-surface-strong/60 p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={toggleAudioPlayback}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:scale-105 transition-all"
                  aria-label={isPlaying ? "Pause audio" : "Play audio"}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </button>

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs font-mono text-muted-foreground">
                    <span>{formatAudioDuration(audioCurrentTime)}</span>
                    <span>
                      {audioDuration > 0
                        ? formatAudioDuration(audioDuration)
                        : result.durationFormatted || "--:--"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={audioDuration || result.durationSeconds || 100}
                    step="0.1"
                    value={audioCurrentTime}
                    onChange={handleAudioSeek}
                    aria-label="Seek Audio"
                    className="w-full accent-primary h-1.5 bg-border rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={result.downloadUrl}
                download={result.filename}
                className="flex-1"
              >
                <Button
                  size="lg"
                  className="w-full py-6 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 flex items-center justify-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Download {result.format.toUpperCase()} ({formatFileSize(result.sizeBytes)})
                </Button>
              </a>

              <Button
                variant="outline"
                size="lg"
                onClick={resetAll}
                className="py-6 font-medium text-foreground hover:bg-surface-strong"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Convert Another Video
              </Button>
            </div>
          </div>
        )}

        {/* ── STAGE: ERROR ─────────────────────────────────────────────────── */}
        {stage === "error" && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20 text-destructive mb-1">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-foreground text-base">Extraction Failed</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">{errorMessage}</p>
            <div className="pt-2">
              <Button onClick={() => setStage("selected")} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
