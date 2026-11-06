"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type DragEvent,
  type KeyboardEvent,
  type Ref,
  type SetStateAction,
} from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Download,
  FileArchive,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useBackgroundRemoval, type EngineState } from "@/hooks/use-background-removal";
import {
  ACCEPT_ATTRIBUTE,
  MAX_FILES,
  formatBytes,
  outputNameFor,
  outputNamesFor,
  overflowMessage,
  planBatchAddition,
  rejectionMessage,
  validateImageFile,
} from "@/lib/background-remover/rules";
import {
  engineAnnouncement,
  engineProgressPercent,
  engineProgressText,
} from "@/lib/background-remover/status";

type Engine = ReturnType<typeof useBackgroundRemoval>;

interface Item {
  id: string;
  file: File;
  previewUrl: string;
  status: "queued" | "processing" | "done" | "error";
  resultUrl?: string;
  png?: Blob;
  width?: number;
  height?: number;
  resized?: boolean;
  error?: string;
}

const UNSUPPORTED_MESSAGE =
  "Your browser can't run the on-device model. Use a current version of Chrome, Edge, Firefox or Safari 16.4+.";

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function createItem(file: File): Item {
  return { id: newId(), file, previewUrl: URL.createObjectURL(file), status: "queued" };
}

function revokeItem(item: Item) {
  URL.revokeObjectURL(item.previewUrl);
  if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Focus the element returned by the registered getter after the next commit.
 * Used when a view transition unmounts the focused control, so keyboard and
 * screen-reader users land on a stable target instead of `<body>`.
 */
function usePendingFocus() {
  const pending = useRef<(() => HTMLElement | null | undefined) | null>(null);
  useEffect(() => {
    const get = pending.current;
    if (!get) return;
    pending.current = null;
    get()?.focus();
  });
  return useCallback((get: () => HTMLElement | null | undefined) => {
    pending.current = get;
  }, []);
}

/**
 * Processes queued items one at a time. If the engine fails to load, items stay
 * queued; once the engine recovers (phase leaves "error") the queue resumes.
 */
function useQueueRunner(
  items: Item[],
  setItems: Dispatch<SetStateAction<Item[]>>,
  api: Engine
) {
  const runningRef = useRef(false);
  const removedIds = useRef(new Set<string>());
  const mountedRef = useRef(true);
  const itemsRef = useRef(items);
  const [tick, setTick] = useState(0);
  const { ensureReady, removeBackground } = api;
  const phase = api.engine.phase;

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      itemsRef.current.forEach(revokeItem);
    };
  }, []);

  useEffect(() => {
    if (runningRef.current || phase === "error") return;
    const next = items.find((i) => i.status === "queued");
    if (!next) return;
    runningRef.current = true;

    const isGone = () =>
      !mountedRef.current ||
      removedIds.current.has(next.id) ||
      !itemsRef.current.some((i) => i.id === next.id && i.status !== "done");

    (async () => {
      try {
        const ready = await ensureReady();
        if (!ready || isGone()) return;
        setItems((prev) =>
          prev.map((i) => (i.id === next.id ? { ...i, status: "processing", error: undefined } : i))
        );
        try {
          const result = await removeBackground(next.id, next.file);
          if (isGone()) return;
          const resultUrl = URL.createObjectURL(result.png);
          setItems((prev) => {
            if (!prev.some((i) => i.id === next.id)) {
              URL.revokeObjectURL(resultUrl);
              return prev;
            }
            return prev.map((i) =>
              i.id === next.id
                ? {
                    ...i,
                    status: "done",
                    resultUrl,
                    png: result.png,
                    width: result.width,
                    height: result.height,
                    resized: result.resized,
                  }
                : i
            );
          });
        } catch (err) {
          if (isGone()) return;
          const message = err instanceof Error ? err.message : "Background removal failed.";
          setItems((prev) =>
            prev.map((i) => (i.id === next.id ? { ...i, status: "error", error: message } : i))
          );
        }
      } finally {
        removedIds.current.delete(next.id);
        runningRef.current = false;
        if (mountedRef.current) setTick((t) => t + 1);
      }
    })();
  }, [items, phase, tick, ensureReady, removeBackground, setItems]);

  /** Mark an item as discarded; an in-flight result for it is thrown away. */
  const markRemoved = useCallback((item: Item) => {
    if (item.status === "processing") removedIds.current.add(item.id);
    revokeItem(item);
  }, []);

  return { markRemoved };
}

function Dropzone({
  multiple,
  disabled = false,
  label,
  title,
  onFiles,
  focusRef,
}: {
  multiple: boolean;
  disabled?: boolean;
  label: string;
  title: string;
  onFiles: (files: File[]) => void;
  focusRef?: Ref<HTMLDivElement>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hintId = useId();

  const open = () => {
    if (!disabled) inputRef.current?.click();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    onFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div
      ref={focusRef}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-describedby={hintId}
      aria-disabled={disabled || undefined}
      onClick={open}
      onKeyDown={onKeyDown}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={cn(
        "focus-ring rounded-xl border-2 border-dashed p-8 text-center transition-all sm:p-12",
        disabled
          ? "cursor-not-allowed border-border/60 bg-surface/50 opacity-60"
          : isDragging
            ? "cursor-pointer border-primary bg-primary/10"
            : "cursor-pointer border-border/80 bg-surface/70 hover:border-primary/50 hover:bg-surface-strong"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={ACCEPT_ATTRIBUTE}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          if (e.target.files) onFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px] bg-primary/10 text-primary">
        <Upload className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground sm:text-lg">{title}</h3>
      <p id={hintId} className="mt-1 text-xs text-muted-foreground">
        JPG, PNG or WebP · up to 15 MB each · first use downloads a ~44 MB AI model once, then
        it&apos;s cached
      </p>
      <div className="mt-4 inline-flex items-center gap-1.5 rounded-[4px] border border-border/80 bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        <span>On-device AI · Never uploaded</span>
      </div>
    </div>
  );
}

function EngineStatus({
  engine,
  onRetry,
  containerRef,
}: {
  engine: EngineState;
  onRetry: () => void;
  containerRef?: Ref<HTMLDivElement>;
}) {
  // The live region only changes on phase transitions; the per-tick progress
  // text stays visual and is exposed on demand via the progress bar's value.
  const announcement = engineAnnouncement(engine);
  const text = engineProgressText(engine);
  const busy = engine.phase === "downloading" || engine.phase === "starting";
  const pct = engineProgressPercent(engine);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      role="group"
      aria-label="AI model status"
      className="focus-ring mb-4 rounded-lg"
    >
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {busy && (
        <div className="rounded-lg border border-border/80 bg-surface/90 p-3 sm:px-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
            <RefreshCw className="h-3.5 w-3.5 text-primary motion-safe:animate-spin" aria-hidden="true" />
            <span aria-hidden="true">{text}</span>
          </div>
          <Progress
            value={pct}
            aria-label="AI model loading progress"
            getValueLabel={() => text}
          />
        </div>
      )}
      {engine.phase === "error" && (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <span className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            <span aria-hidden="true">{text}</span>
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="h-[34px] rounded-[4px] px-3 text-xs font-medium shadow-none"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry loading model
          </Button>
        </div>
      )}
    </div>
  );
}

function ResultMeta({ item }: { item: Item }) {
  if (item.status !== "done" || !item.png) return null;
  return (
    <span>
      {item.width}×{item.height}px · {formatBytes(item.png.size)}
      {item.resized && " · Resized to fit 16 MP"}
    </span>
  );
}

function SingleMode({ api }: { api: Engine }) {
  const [items, setItems] = useState<Item[]>([]);
  const { markRemoved } = useQueueRunner(items, setItems, api);
  const requestFocus = usePendingFocus();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const item = items[0];

  const onFiles = (files: File[]) => {
    if (files.length === 0) return;
    if (files.length > 1) {
      toast.info("Single mode takes one image — switch to Bulk to process several.");
    }
    const file = files[0];
    const check = validateImageFile(file);
    if (!check.ok) {
      toast.error(`${file.name} wasn't added`, { description: rejectionMessage(check.reason) });
      return;
    }
    items.forEach(markRemoved);
    setItems([createItem(file)]);
    // The dropzone is replaced by the before/after view.
    requestFocus(() => headingRef.current);
  };

  const reset = () => {
    items.forEach(markRemoved);
    setItems([]);
    // "Try another image" unmounts itself; land on the upload control.
    requestFocus(() => dropzoneRef.current);
  };

  const retry = () => {
    setItems((prev) => prev.map((i) => ({ ...i, status: "queued", error: undefined })));
    // The Retry button unmounts once the item is re-queued.
    requestFocus(() => headingRef.current);
  };

  if (!item) {
    return (
      <Dropzone
        focusRef={dropzoneRef}
        multiple={false}
        label="Choose an image or drop it here"
        title="Choose an image or drag & drop it here"
        onFiles={onFiles}
      />
    );
  }

  const name = item.file.name;
  const statusText =
    item.status === "done"
      ? "Background removed."
      : item.status === "error"
        ? `Failed: ${item.error ?? "Background removal failed."}`
        : item.status === "processing"
          ? "Removing background…"
          : "Waiting for the AI model…";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <figure className="rounded-xl border border-border/80 bg-surface/90 p-3">
          <figcaption className="mb-2 text-xs font-semibold text-muted-foreground">Original</figcaption>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-surface-strong">
            <img
              src={item.previewUrl}
              alt={`Original: ${name}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </figure>
        <figure className="rounded-xl border border-border/80 bg-surface/90 p-3">
          <figcaption className="mb-2 text-xs font-semibold text-muted-foreground">
            Background removed
          </figcaption>
          <div className="checkerboard flex aspect-square items-center justify-center overflow-hidden rounded-lg">
            {item.status === "done" && item.resultUrl ? (
              <img
                src={item.resultUrl}
                alt={`${name} with the background removed`}
                className="max-h-full max-w-full object-contain"
              />
            ) : item.status === "error" ? (
              <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-8 w-8 text-primary motion-safe:animate-spin" aria-hidden="true" />
            )}
          </div>
        </figure>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-xs">
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="focus-ring truncate rounded-[2px] font-sans font-semibold tracking-normal text-foreground"
          >
            {name}
          </h3>
          <p
            aria-live="polite"
            className={cn("mt-1", item.status === "error" ? "text-destructive" : "text-muted-foreground")}
          >
            {statusText} <ResultMeta item={item} />
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {item.status === "error" && (
            <Button
              size="sm"
              variant="outline"
              onClick={retry}
              className="h-[34px] rounded-[4px] px-3 text-xs font-medium shadow-none"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={reset}
            className="h-[34px] rounded-[4px] px-3 text-xs font-medium text-muted-foreground shadow-none"
          >
            Try another image
          </Button>
          <Button
            size="sm"
            disabled={item.status !== "done" || !item.png}
            onClick={() => item.png && triggerDownload(item.png, outputNameFor(name))}
            className="h-[34px] rounded-[4px] px-4 text-xs font-medium shadow-none"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download PNG
          </Button>
        </div>
      </div>
    </div>
  );
}

function BulkMode({ api }: { api: Engine }) {
  const [items, setItems] = useState<Item[]>([]);
  const [zipping, setZipping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const addInputRef = useRef<HTMLInputElement | null>(null);
  const { markRemoved } = useQueueRunner(items, setItems, api);
  const requestFocus = usePendingFocus();
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const removeRefs = useRef(new Map<string, HTMLButtonElement>());

  // One deduped name per item, over every row in display order. Row downloads,
  // their aria-labels and ZIP entries all read from this map, so they agree.
  const outputNames = useMemo(() => {
    const names = outputNamesFor(items.map((i) => i.file.name));
    return new Map(items.map((i, idx) => [i.id, names[idx]]));
  }, [items]);

  const addFiles = (files: File[]) => {
    if (files.length === 0) return;
    const plan = planBatchAddition(items.length, files);
    if (plan.rejected.length > 0) {
      const shown = plan.rejected
        .slice(0, 3)
        .map((r) => `${r.file.name}: ${rejectionMessage(r.reason)}`)
        .join(" ");
      const more = plan.rejected.length > 3 ? ` …and ${plan.rejected.length - 3} more.` : "";
      toast.error(
        `${plan.rejected.length} file${plan.rejected.length === 1 ? "" : "s"} skipped`,
        { description: shown + more }
      );
    }
    if (plan.overflow.length > 0) toast.warning(overflowMessage(plan.overflow.length));
    if (plan.accepted.length > 0) {
      setItems((prev) => [...prev, ...plan.accepted.map(createItem)]);
      toast.success(`Added ${plan.accepted.length} image${plan.accepted.length === 1 ? "" : "s"}`);
      // Dropzone → list, or "Add more" about to become disabled: both drop focus.
      if (items.length === 0 || items.length + plan.accepted.length >= MAX_FILES) {
        requestFocus(() => listRef.current);
      }
    }
  };

  const remove = (id: string) => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    markRemoved(items[idx]);
    setItems((prev) => prev.filter((i) => i.id !== id));
    // The Remove button unmounts with its row: move to the next row's Remove,
    // else (bottom row) the batch list, else (batch now empty) the dropzone
    // that replaces the list.
    const next = items[idx + 1];
    requestFocus(() =>
      next
        ? removeRefs.current.get(next.id)
        : items.length > 1
          ? listRef.current
          : dropzoneRef.current
    );
  };

  const clearAll = () => {
    items.forEach(markRemoved);
    setItems([]);
    requestFocus(() => dropzoneRef.current);
  };

  const retry = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "queued", error: undefined } : i))
    );
    // The row's Retry button unmounts once the item is re-queued.
    requestFocus(() => removeRefs.current.get(id));
  };

  const doneItems = items.filter((i) => i.status === "done" && i.png);
  const doneCount = items.filter((i) => i.status === "done").length;
  const failedCount = items.filter((i) => i.status === "error").length;
  const total = items.length;
  const full = total >= MAX_FILES;

  const downloadZip = async () => {
    if (doneItems.length === 0 || zipping) return;
    setZipping(true);
    try {
      const { buildResultsZip, zipArchiveName } = await import("@/lib/background-remover/zip");
      const entries = await Promise.all(
        doneItems.map(async (it) => ({
          name: outputNames.get(it.id) ?? outputNameFor(it.file.name),
          data: new Uint8Array(await it.png!.arrayBuffer()),
        }))
      );
      const bytes = await buildResultsZip(entries);
      triggerDownload(
        new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/zip" }),
        zipArchiveName(entries.length)
      );
      toast.success(`ZIP with ${entries.length} image${entries.length === 1 ? "" : "s"} downloaded`);
    } catch {
      toast.error("ZIP creation failed");
    } finally {
      setZipping(false);
    }
  };

  if (total === 0) {
    return (
      <Dropzone
        focusRef={dropzoneRef}
        multiple
        label={`Choose up to ${MAX_FILES} images or drop them here`}
        title={`Choose up to ${MAX_FILES} images or drag & drop them here`}
        onFiles={addFiles}
      />
    );
  }

  return (
    <div
      className={cn("space-y-4 rounded-xl", isDragging && "ring-2 ring-primary")}
      onDragOver={(e) => {
        e.preventDefault();
        if (!full) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <input
        ref={addInputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          if (e.target.files) addFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />

      <div className="rounded-xl border border-border/80 bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p aria-live="polite" className="text-xs font-medium text-foreground">
            {doneCount} of {total} done · {failedCount} failed
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={full}
              onClick={() => addInputRef.current?.click()}
              className="h-[34px] rounded-[4px] px-3 text-xs font-medium shadow-none"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              {full ? `Batch full (${MAX_FILES})` : "Add more"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearAll}
              className="h-[34px] rounded-[4px] px-3 text-xs font-medium text-muted-foreground shadow-none"
            >
              Clear all
            </Button>
            <Button
              size="sm"
              // aria-disabled (not disabled) while zipping keeps focus on the button;
              // downloadZip already ignores clicks during packaging.
              disabled={doneItems.length === 0}
              aria-disabled={zipping || undefined}
              onClick={downloadZip}
              className="h-[34px] rounded-[4px] px-4 text-xs font-medium shadow-none aria-disabled:cursor-progress aria-disabled:opacity-50"
            >
              {zipping ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden="true" />
                  Packaging ZIP…
                </>
              ) : (
                <>
                  <FileArchive className="h-3.5 w-3.5" aria-hidden="true" />
                  Download all as ZIP ({doneItems.length})
                </>
              )}
            </Button>
          </div>
        </div>
        <Progress
          className="mt-3"
          value={total ? ((doneCount + failedCount) / total) * 100 : 0}
          aria-label="Batch progress"
        />
      </div>

      <ul
        ref={listRef}
        tabIndex={-1}
        aria-label="Images in this batch"
        className="focus-ring space-y-2.5 rounded-lg"
      >
        {items.map((item) => {
          const name = item.file.name;
          const outputName = outputNames.get(item.id) ?? outputNameFor(name);
          const done = item.status === "done" && item.resultUrl;
          return (
            <li
              key={item.id}
              className="flex flex-col justify-between gap-3 rounded-lg border border-border/80 bg-surface/90 p-3 sm:flex-row sm:items-center sm:px-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-[4px] border border-border",
                    done ? "checkerboard" : "bg-surface-strong"
                  )}
                >
                  <img
                    src={done ? item.resultUrl : item.previewUrl}
                    alt={done ? `${name} with the background removed` : `Original: ${name}`}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">{name}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatBytes(item.file.size)}
                    {" · "}
                    <span
                      className={cn(
                        item.status === "error" && "text-destructive",
                        item.status === "done" && "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {item.status === "queued" && "Queued"}
                      {item.status === "processing" && "Processing…"}
                      {item.status === "done" && "Done"}
                      {item.status === "error" && `Failed: ${item.error ?? "Background removal failed."}`}
                    </span>
                    {item.status === "done" && (
                      <>
                        {" · "}
                        <ResultMeta item={item} />
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                {item.status === "processing" && (
                  <RefreshCw className="h-3.5 w-3.5 text-primary motion-safe:animate-spin" aria-hidden="true" />
                )}
                {item.status === "done" && item.png && (
                  <Button
                    size="sm"
                    onClick={() => triggerDownload(item.png!, outputName)}
                    aria-label={`Download ${outputName}`}
                    className="h-[30px] rounded-[4px] bg-emerald-600 px-3 text-xs font-medium text-white shadow-none hover:bg-emerald-700"
                  >
                    <Download className="h-3 w-3" aria-hidden="true" />
                    Download
                  </Button>
                )}
                {item.status === "error" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => retry(item.id)}
                    aria-label={`Retry ${name}`}
                    className="h-[30px] rounded-[4px] border-border px-3 text-xs font-medium shadow-none"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    Retry
                  </Button>
                )}
                <button
                  ref={(el) => {
                    if (el) removeRefs.current.set(item.id, el);
                    else removeRefs.current.delete(item.id);
                  }}
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`Remove ${name}`}
                  className="focus-ring rounded-[4px] p-1 text-muted-foreground transition-colors hover:bg-surface-strong hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function BackgroundRemoverHero() {
  const api = useBackgroundRemoval();
  const [mode, setMode] = useState("single");
  const requestFocus = usePendingFocus();
  const engineRef = useRef<HTMLDivElement>(null);

  if (!api.supported) {
    return (
      <div className="mx-auto max-w-4xl">
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-foreground"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          <span>{UNSUPPORTED_MESSAGE}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Tabs value={mode} onValueChange={setMode}>
        <div className="mb-4 flex justify-center">
          <TabsList aria-label="Processing mode">
            <TabsTrigger value="single">Single image</TabsTrigger>
            <TabsTrigger value="bulk">Bulk (up to {MAX_FILES})</TabsTrigger>
          </TabsList>
        </div>

        <EngineStatus
          engine={api.engine}
          containerRef={engineRef}
          onRetry={() => {
            // "Retry loading model" unmounts as soon as the phase leaves "error".
            requestFocus(() => engineRef.current);
            void api.ensureReady();
          }}
        />

        {/* forceMount keeps each mode's work alive while the other tab is open. */}
        <TabsContent value="single" forceMount className="mt-0 data-[state=inactive]:hidden">
          <SingleMode api={api} />
        </TabsContent>
        <TabsContent value="bulk" forceMount className="mt-0 data-[state=inactive]:hidden">
          <BulkMode api={api} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
