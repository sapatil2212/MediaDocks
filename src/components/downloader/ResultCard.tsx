"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import JSZip from "jszip";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ImageIcon,
  Info,
  Music,
  Play,
  RotateCcw,
  Video,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
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

// ── Carousel thumbnail strip ───────────────────────────────────────────────
function CarouselStrip({
  images,
  selected,
  onSelect,
}: {
  images: Array<{ item: MediaItem; index: number }>;
  selected: number;
  onSelect: (index: number) => void;
}) {
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stripRef.current?.children[images.findIndex((e) => e.index === selected)];
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selected, images]);

  return (
    <div
      ref={stripRef}
      className="flex gap-1.5 overflow-x-auto px-1 py-1 scrollbar-none"
      style={{ scrollbarWidth: "none" }}
      role="listbox"
      aria-label="Carousel images"
    >
      {images.map((entry, idx) => (
        <button
          key={entry.item.id}
          role="option"
          aria-selected={entry.index === selected}
          onClick={() => onSelect(entry.index)}
          className={cn(
            "relative h-14 w-14 shrink-0 overflow-hidden rounded-[4px] border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            entry.index === selected
              ? "border-primary ring-1 ring-primary/50 shadow-none scale-[1.01]"
              : "border-transparent opacity-60 hover:opacity-90 hover:border-border",
          )}
        >
          {entry.item.mediaUrl?.startsWith("http") ? (
            <img
              src={entry.item.mediaUrl}
              alt={`Slide ${idx + 1}`}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full bg-surface-strong grid place-items-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          {entry.index === selected && (
            <span className="absolute inset-0 bg-primary/10 ring-inset ring-2 ring-primary/30 rounded-[4px]" />
          )}
        </button>
      ))}
    </div>
  );
}

export function ResultCard({ result, onReset }: { result: MediaResult; onReset: () => void }) {
  const [selected, setSelected] = useState(0);
  const [phase, setPhase] = useState<DownloadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [downloadAllPhase, setDownloadAllPhase] = useState<"idle" | "downloading" | "done">("idle");
  const [downloadAllIndex, setDownloadAllIndex] = useState(0);
  const [downloadAllProgress, setDownloadAllProgress] = useState(0);
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
  const isCarousel = groups.image.length > 1;
  const canDownload = Boolean(result.mediaId && item?.id && item.downloadable);

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

  const navigateCarousel = (dir: 1 | -1) => {
    const imgs = groups.image;
    const currentIdx = imgs.findIndex((e) => e.index === selected);
    const next = imgs[(currentIdx + dir + imgs.length) % imgs.length];
    if (next) setSelected(next.index);
  };

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

  const startDownloadAll = async () => {
    if (downloadAllPhase !== "idle" || !result.mediaId || groups.image.length === 0) return;
    setDownloadAllPhase("downloading");
    setDownloadAllProgress(5);

    try {
      const zip = new JSZip();
      const total = groups.image.length;

      for (let i = 0; i < total; i++) {
        if (!alive.current) return;
        setDownloadAllIndex(i);
        setDownloadAllProgress(Math.round(5 + (i / total) * 85));

        const target = groups.image[i].item;
        const { blob, filename } = await downloadMedia({
          mediaId: result.mediaId,
          itemId: target.id,
        });
        if (!alive.current) return;

        const ext = target.extension || "jpg";
        const name = filename || `Slide_${i + 1}_${target.quality || "Image"}.${ext}`;
        zip.file(name, blob);

        // Small pacing delay between requests
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      setDownloadAllProgress(95);
      const zipBlob = await zip.generateAsync({ type: "blob" });
      if (!alive.current) return;

      const safeTitle = (result.title || "instagram_carousel")
        .slice(0, 30)
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/_+/g, "_");
      saveBlob(zipBlob, `${safeTitle}_carousel_${total}_images.zip`);

      setDownloadAllProgress(100);
      setDownloadAllPhase("done");
      toast.success("Download complete", {
        description: `Saved all ${total} images in a single ZIP file.`,
      });
      window.setTimeout(() => {
        if (alive.current) {
          setDownloadAllPhase("idle");
          setDownloadAllProgress(0);
        }
      }, 2500);
    } catch (err) {
      if (alive.current) {
        setDownloadAllPhase("idle");
        setDownloadAllProgress(0);
      }
      toast.error("Download failed", { description: downloadErrorMessage(err) });
    }
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
        "inline-flex items-center gap-1 rounded-[4px] border px-2 py-1 text-[11px] font-medium shadow-none transition-all duration-150 disabled:opacity-60",
        entry.index === selected
          ? "border-primary/80 bg-accent text-accent-foreground"
          : "border-border/80 text-muted-foreground hover:border-border hover:text-foreground hover:bg-surface-strong",
      )}
    >
      {entry.item.quality ?? entry.item.label}
    </button>
  );

  return (
    <article className="animate-pop overflow-hidden rounded-2xl border border-border bg-surface shadow-lift">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        {/* ── Media Preview Panel ──────────────────────────────────────────── */}
        <div className="relative flex flex-col bg-surface-strong">
          {/* Main preview image / video */}
          <div
            className={cn(
              "relative w-full overflow-hidden",
              selectedGroup === "image" ? "aspect-square" : "aspect-video lg:aspect-[3/4]",
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
                className="size-full object-cover transition-all duration-300"
              />
            ) : (
              <div className="grid size-full place-items-center text-muted-foreground">
                {selectedGroup === "audio" ? (
                  <Music className="h-10 w-10 opacity-40" />
                ) : (
                  <ImageIcon className="h-10 w-10 opacity-40" />
                )}
              </div>
            )}

            {/* Carousel navigation arrows */}
            {isCarousel && (
              <>
                <button
                  onClick={() => navigateCarousel(-1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-foreground shadow-none border border-border/40 backdrop-blur transition-all hover:bg-background hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => navigateCarousel(1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-foreground shadow-none border border-border/40 backdrop-blur transition-all hover:bg-background hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                {/* Slide counter */}
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/90 border border-border/30 px-2 py-0.5 text-[11px] font-medium backdrop-blur tabular-nums">
                  {groups.image.findIndex((e) => e.index === selected) + 1} / {groups.image.length}
                </span>
              </>
            )}

            {/* Media type badge */}
            {!hasDirectVideo && !isCarousel ? (
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

            {/* Duration badge */}
            {duration && !hasDirectVideo ? (
              <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-xs font-medium backdrop-blur">
                <Clock className="h-3 w-3" />
                {formatDuration(duration)}
              </span>
            ) : null}
          </div>

          {/* Carousel thumbnail strip */}
          {isCarousel && (
            <div className="border-t border-border/60 bg-surface p-2">
              <CarouselStrip
                images={groups.image}
                selected={selected}
                onSelect={setSelected}
              />
            </div>
          )}
        </div>

        {/* ── Info & Controls Panel ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 p-5 lg:p-6">
          {/* Platform + type badges */}
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge platform={result.platform} />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase text-muted-foreground">
              {isCarousel ? (
                <>
                  <Layers className="h-3 w-3" />
                  Carousel · {groups.image.length} images
                </>
              ) : (
                downloadVerb
              )}
            </span>
            {item ? (
              <span className="text-xs font-medium text-muted-foreground">
                {item.mimeType} · .{item.extension}
              </span>
            ) : null}
          </div>

          {/* Title + creator */}
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-semibold leading-tight">
              {result.title ?? "Untitled media"}
            </h3>
            {result.creator ? (
              <p className="mt-1.5 text-sm font-medium text-muted-foreground">{result.creator}</p>
            ) : null}
          </div>

          {/* Metadata grid */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            {width && height && selectedGroup !== "audio" ? (
              <div className="flex flex-col gap-0.5">
                <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">Resolution</dt>
                <dd className="font-semibold tabular-nums">
                  {width} × {height}
                </dd>
              </div>
            ) : null}
            {selectedGroup === "audio" && item?.audioBitrate ? (
              <div className="flex flex-col gap-0.5">
                <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">Bitrate</dt>
                <dd className="font-semibold">{item.audioBitrate} kbps</dd>
              </div>
            ) : null}
            {item?.size ? (
              <div className="flex flex-col gap-0.5">
                <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">Size</dt>
                <dd className="font-semibold">~{formatSize(item.size)}</dd>
              </div>
            ) : null}
            {duration ? (
              <div className="flex flex-col gap-0.5">
                <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">Duration</dt>
                <dd className="font-semibold">{formatDuration(duration)}</dd>
              </div>
            ) : null}
          </dl>

          {/* Video resolution selector */}
          {groups.video.length > 0 ? (
            <div>
              <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Video className="h-3.5 w-3.5" /> Video resolution
              </p>
              <div role="radiogroup" aria-label="Video resolution" className="flex flex-wrap gap-2">
                {groups.video.map(renderOptionButton)}
              </div>
            </div>
          ) : null}

          {/* Audio format selector */}
          {groups.audio.length > 0 ? (
            <div>
              <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Music className="h-3.5 w-3.5" /> Audio format
              </p>
              <div role="radiogroup" aria-label="Audio format" className="flex flex-wrap gap-2">
                {groups.audio.map(renderOptionButton)}
              </div>
            </div>
          ) : null}

          {/* Carousel individual image selector (when > 1 image but no thumbnail strip, or as an alt select UI) */}
          {isCarousel ? (
            <div>
              <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" /> Download individual image
              </p>
              <div role="radiogroup" aria-label="Carousel images" className="flex flex-wrap gap-2">
                {groups.image.map(renderOptionButton)}
              </div>
            </div>
          ) : groups.image.length > 1 ? (
            <div>
              <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" /> Images
              </p>
              <div role="radiogroup" aria-label="Images" className="flex flex-wrap gap-2">
                {groups.image.map(renderOptionButton)}
              </div>
            </div>
          ) : null}

          {/* Unavailable notice */}
          {!canDownload ? (
            <div className="flex gap-3 rounded-xl border border-border bg-surface-strong p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
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

          {/* Action bar */}
          <div className="mt-auto flex flex-col gap-2 pt-2">
            {/* Primary Action Row: Side-by-side on tablet/desktop */}
            <div
              className={cn(
                "grid gap-2",
                canDownload && isCarousel ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
              )}
            >
              {canDownload && item ? (
                <DownloadButton
                  label="Download"
                  phase={phase}
                  progress={progress}
                  onClick={startDownload}
                  className="w-full justify-center shadow-none"
                />
              ) : null}

              {canDownload && isCarousel ? (
                <Button
                  variant="outline"
                  disabled={downloadAllPhase !== "idle" || phase !== "idle"}
                  onClick={startDownloadAll}
                  className="relative h-[34px] w-full justify-center overflow-hidden rounded-[4px] px-3 text-xs font-medium shadow-none border border-border bg-surface-strong hover:bg-surface hover:border-primary/50 text-foreground transition-colors duration-150"
                >
                  {downloadAllPhase === "downloading" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="truncate">{`Downloading (${downloadAllIndex + 1}/${groups.image.length})… ${downloadAllProgress}%`}</span>
                    </>
                  ) : downloadAllPhase === "done" ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      <span>All Saved (ZIP)</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 text-primary" />
                      <span>{`Download All (${groups.image.length})`}</span>
                    </>
                  )}
                </Button>
              ) : null}
            </div>

            {/* Secondary Action Row: Copy Link & New Link side-by-side */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={copyLink}
                className="h-[30px] w-full rounded-[4px] text-[11.5px] font-medium shadow-none border border-border/80 text-muted-foreground hover:text-foreground hover:border-border transition-colors duration-150"
              >
                <Copy className="h-3 w-3" />
                Copy link
              </Button>
              <Button
                variant="ghost"
                onClick={onReset}
                className="h-[30px] w-full rounded-[4px] text-[11.5px] font-medium shadow-none text-muted-foreground hover:text-foreground hover:bg-surface-strong transition-colors duration-150"
              >
                <RotateCcw className="h-3 w-3" />
                New link
              </Button>
            </div>
          </div>

          {/* Download progress for Download All ZIP */}
          {downloadAllPhase !== "idle" && (
            <div className="flex flex-col gap-1.5" aria-live="polite">
              <Progress value={downloadAllProgress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  {downloadAllPhase === "done" ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      All {groups.image.length} images saved to ZIP file
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 animate-bounce" />
                      {`Packaging slide ${downloadAllIndex + 1} of ${groups.image.length} into ZIP archive…`}
                    </>
                  )}
                </span>
                <span className="font-semibold tabular-nums">{downloadAllProgress}%</span>
              </div>
            </div>
          )}

          {/* Single Download progress */}
          {phase !== "idle" && item ? (
            <div className="flex flex-col gap-1.5" aria-live="polite">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  {phase === "done" ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      Saved — check your downloads
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 animate-bounce" />
                      {`Preparing ${downloadVerb.toLowerCase()}${item.quality ? ` · ${item.quality}` : ""}`}
                    </>
                  )}
                </span>
                <span className="font-semibold tabular-nums">
                  {item.size && progress < 100
                    ? `~${formatSize((item.size * progress) / 100)} / ${formatSize(item.size)}`
                    : `${Math.floor(progress)}%`}
                </span>
              </div>
              {phase === "downloading" ? (
                <p className="text-[0.7rem] text-muted-foreground">
                  Larger files are prepared on the server and may take a few seconds.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
