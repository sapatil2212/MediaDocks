"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Clock, Copy, ImageIcon, Info, Music, Play, RotateCcw, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlatformBadge } from "@/components/downloader/PlatformBadge";
import { DownloadButton, type DownloadPhase } from "@/components/downloader/DownloadButton";
import { downloadMedia } from "@/lib/api-client";
import { formatDuration, formatSize, type MediaItem, type MediaResult } from "@/lib/media";
import { cn } from "@/lib/utils";

const DOWNLOAD_ERROR_COPY: Record<string, string> = {
  MEDIA_REFERENCE_EXPIRED: "This link expired. Paste it again to refresh the media.",
  MEDIA_NOT_FOUND: "We couldn't find the requested media.",
  FORMAT_NOT_AVAILABLE: "This media isn't available for download.",
  DOWNLOAD_FAILED: "This media couldn't be downloaded. Please try again.",
  INVALID_MEDIA_RESPONSE: "The platform returned a page instead of a media file.",
  MEDIA_TYPE_UNKNOWN: "We couldn't determine this file's media type.",
  VIDEO_MEDIA_UNAVAILABLE: "The video file isn't publicly available to download.",
  IMAGE_MEDIA_UNAVAILABLE: "The image file isn't publicly available to download.",
  FILE_TOO_LARGE: "This file is larger than the current size limit.",
  UNSAFE_URL: "This media isn't available for download.",
  RATE_LIMITED: "Please wait a moment and try again.",
  REQUEST_TIMEOUT: "The request took too long. Please try again.",
};

function downloadErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  return (code && DOWNLOAD_ERROR_COPY[code]) ?? "Something went wrong. Please try again.";
}

function saveBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function groupKind(item: MediaItem): "video" | "audio" | "image" {
  return item.engineKind ?? (item.kind === "video" ? "video" : "image");
}

export function ResultCard({ result, onReset }: { result: MediaResult; onReset: () => void }) {
  const [selected, setSelected] = useState(0);
  const [phase, setPhase] = useState<DownloadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const alive = useRef(true);

  const item: MediaItem | undefined = result.media[selected] ?? result.media[0];

  // Group the options for the selector.
  const groups = useMemo(() => {
    const video: Array<{ item: MediaItem; index: number }> = [];
    const audio: Array<{ item: MediaItem; index: number }> = [];
    const image: Array<{ item: MediaItem; index: number }> = [];
    result.media.forEach((m, index) => {
      const bucket = groupKind(m);
      if (bucket === "video") video.push({ item: m, index });
      else if (bucket === "audio") audio.push({ item: m, index });
      else image.push({ item: m, index });
    });
    return { video, audio, image };
  }, [result.media]);

  const selectedGroup = item ? groupKind(item) : "image";
  const isVideoPreview = selectedGroup === "video";
  const isImagePreview = selectedGroup === "image";
  const canDownload = Boolean(result.mediaId && item?.id && item.downloadable);

  // An engine option has no direct URL, so preview falls back to the poster.
  const poster = item?.posterUrl ?? result.thumbnail;
  const hasDirectVideo = isVideoPreview && item?.mediaUrl && item.mediaUrl.startsWith("http");
  const previewImage = isImagePreview
    ? (item?.mediaUrl && item.mediaUrl.startsWith("http") ? item.mediaUrl : poster)
    : poster;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    setPhase("idle");
    setProgress(0);
  }, [selected]);

  const runDownload = async () => {
    if (!result.mediaId || !item) return;
    setPhase("downloading");
    setProgress(0);

    try {
      const { blob, filename } = await downloadMedia(
        { mediaId: result.mediaId, itemId: item.id },
        (fraction, received, total) => {
          if (!alive.current) return;
          setProgress(total ? Math.max(3, fraction * 100) : Math.min(95, received / 262_144));
        },
      );

      if (!alive.current) return;
      saveBlob(blob, filename);
      setProgress(100);
      setPhase("done");
      toast.success("Download complete", { description: `${filename} — saved to your device.` });
      window.setTimeout(() => {
        if (!alive.current) return;
        setPhase("idle");
        setProgress(0);
      }, 1600);
    } catch (error) {
      if (!alive.current) return;
      setPhase("idle");
      setProgress(0);
      toast.error("Download unavailable", { description: downloadErrorMessage(error) });
    }
  };

  const startDownload = () => {
    if (phase !== "idle" || !canDownload) return;
    void runDownload();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(result.sourceUrl ?? "");
      toast.success("Media link copied");
    } catch {
      toast.error("Couldn't copy", { description: "Your browser blocked clipboard access." });
    }
  };

  const width = item?.width ?? result.width;
  const height = item?.height ?? result.height;
  const duration = item?.duration ?? result.duration;
  const downloadVerb =
    selectedGroup === "audio" ? "Audio" : selectedGroup === "video" ? "Video" : "Image";

  const renderOptionButton = (entry: { item: MediaItem; index: number }) => (
    <button
      key={entry.item.id}
      role="radio"
      aria-checked={entry.index === selected}
      disabled={phase !== "idle"}
      onClick={() => setSelected(entry.index)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 disabled:opacity-60",
        entry.index === selected
          ? "border-primary bg-accent text-accent-foreground"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {entry.item.quality ?? entry.item.label}
    </button>
  );

  return (
    <article className="animate-pop overflow-hidden rounded-2xl border border-border bg-surface shadow-lift">
      <div className="grid gap-0 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <div className="relative bg-surface-strong">
          <div
            className={cn(
              "relative w-full overflow-hidden",
              selectedGroup === "image" ? "aspect-square" : "aspect-video sm:aspect-[3/4]",
            )}
          >
            {hasDirectVideo && item ? (
              <video
                controls
                playsInline
                preload="metadata"
                poster={poster}
                className="size-full bg-black object-contain"
              >
                <source src={item.mediaUrl} type={item.mimeType} />
                Your browser can&apos;t play this video.
              </video>
            ) : previewImage ? (
              <img
                src={previewImage}
                alt={result.title ? `Preview of ${result.title}` : "Media preview"}
                loading="lazy"
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center text-muted-foreground">
                {selectedGroup === "audio" ? (
                  <Music className="h-8 w-8" />
                ) : (
                  <ImageIcon className="h-8 w-8" />
                )}
              </div>
            )}

            {!hasDirectVideo ? (
              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                {selectedGroup === "audio" ? (
                  <Music className="h-3 w-3" />
                ) : selectedGroup === "video" ? (
                  <Play className="h-3 w-3" />
                ) : (
                  <ImageIcon className="h-3 w-3" />
                )}
                {result.kind ?? downloadVerb}
              </span>
            ) : null}

            {duration && !hasDirectVideo ? (
              <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-xs font-medium backdrop-blur">
                <Clock className="h-3 w-3" />
                {formatDuration(duration)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge platform={result.platform} />
            <span className="rounded-full border border-border px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase">
              {downloadVerb}
            </span>
            {item ? (
              <span className="text-xs font-medium text-muted-foreground">
                {item.mimeType} · .{item.extension}
              </span>
            ) : null}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">{result.title ?? "Untitled media"}</h3>
            {result.creator ? (
              <p className="mt-1 text-sm text-muted-foreground">{result.creator}</p>
            ) : null}
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            {width && height && selectedGroup !== "audio" ? (
              <div>
                <dt className="text-xs text-muted-foreground">Resolution</dt>
                <dd className="font-semibold">
                  {width} × {height}
                </dd>
              </div>
            ) : null}
            {selectedGroup === "audio" && item?.audioBitrate ? (
              <div>
                <dt className="text-xs text-muted-foreground">Bitrate</dt>
                <dd className="font-semibold">{item.audioBitrate} kbps</dd>
              </div>
            ) : null}
            {item?.size ? (
              <div>
                <dt className="text-xs text-muted-foreground">Size</dt>
                <dd className="font-semibold">~{formatSize(item.size)}</dd>
              </div>
            ) : null}
            {duration ? (
              <div>
                <dt className="text-xs text-muted-foreground">Duration</dt>
                <dd className="font-semibold">{formatDuration(duration)}</dd>
              </div>
            ) : null}
          </dl>

          {/* Grouped format / resolution / audio selector */}
          {groups.video.length > 0 ? (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Video className="h-3.5 w-3.5" /> Video resolution
              </p>
              <div role="radiogroup" aria-label="Video resolution" className="flex flex-wrap gap-2">
                {groups.video.map(renderOptionButton)}
              </div>
            </div>
          ) : null}

          {groups.audio.length > 0 ? (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Music className="h-3.5 w-3.5" /> Audio format
              </p>
              <div role="radiogroup" aria-label="Audio format" className="flex flex-wrap gap-2">
                {groups.audio.map(renderOptionButton)}
              </div>
            </div>
          ) : null}

          {groups.image.length > 1 ? (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" /> Images
              </p>
              <div role="radiogroup" aria-label="Images" className="flex flex-wrap gap-2">
                {groups.image.map(renderOptionButton)}
              </div>
            </div>
          ) : null}

          {!canDownload ? (
            <div className="flex gap-3 rounded-xl border border-border bg-surface-strong p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 text-sm">
                <p className="font-semibold">
                  {result.media.length > 0 ? "Preview only" : "Media information found"}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {result.unavailable?.message ??
                    (result.isMock
                      ? "Demo mode — no real media file is attached to this result."
                      : "We found the post, but a downloadable media file isn't available.")}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-2">
            {canDownload && item ? (
              <DownloadButton
                label={`Download ${downloadVerb}${item.quality ? ` · ${item.quality}` : ""}`}
                phase={phase}
                progress={progress}
                onClick={startDownload}
              />
            ) : null}
            <Button
              variant="outline"
              onClick={copyLink}
              className="h-11 rounded-xl px-4 text-sm font-semibold"
            >
              <Copy className="h-4 w-4" />
              Copy media link
            </Button>
            <Button
              variant="ghost"
              onClick={onReset}
              className="h-11 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              New link
            </Button>
          </div>

          {phase !== "idle" && item ? (
            <div className="flex flex-col gap-1.5" aria-live="polite">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {phase === "done"
                    ? "Saved — check your downloads"
                    : `Preparing ${downloadVerb.toLowerCase()}${item.quality ? ` · ${item.quality}` : ""}`}
                </span>
                <span className="font-semibold tabular-nums">
                  {item.size && progress < 100
                    ? `~${formatSize((item.size * progress) / 100)} / ${formatSize(item.size)}`
                    : `${Math.floor(progress)}%`}
                </span>
              </div>
              {phase === "downloading" ? (
                <p className="text-[0.7rem] text-muted-foreground">
                  Larger videos are prepared on the server and may take a few seconds.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
