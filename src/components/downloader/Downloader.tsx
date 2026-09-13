"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UrlInput } from "@/components/downloader/UrlInput";
import { ProcessingState } from "@/components/downloader/ProcessingState";
import { ResultCard } from "@/components/downloader/ResultCard";
import { ErrorState } from "@/components/downloader/ErrorState";
import { RecentDownloads } from "@/components/downloader/RecentDownloads";
import { useRecent } from "@/hooks/use-recent";
import { detectPlatform } from "@/lib/platforms";
import { resolveMedia } from "@/lib/resolve-media";
import { ResolveError, type MediaResult, type ResolveErrorCode } from "@/lib/media";
import { DOWNLOADER_ID, SET_URL_EVENT } from "@/lib/scroll";

type Status = "idle" | "processing" | "result" | "error";

export function Downloader({ placeholder }: { placeholder?: string } = {}) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<MediaResult | null>(null);
  const [errorCode, setErrorCode] = useState<ResolveErrorCode>("invalid_url");
  const runId = useRef(0);
  const { items, add, remove, clear } = useRecent();

  useEffect(() => {
    const handler = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      setUrl(next);
      setStatus("idle");
      setResult(null);
    };
    window.addEventListener(SET_URL_EVENT, handler);
    return () => window.removeEventListener(SET_URL_EVENT, handler);
  }, []);

  const run = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("Add a link first", { description: "Paste a media URL to get started." });
      return;
    }
    const id = ++runId.current;
    setStatus("processing");
    setStep(0);
    setResult(null);
    toast.info("Processing started", { description: "Analyzing your link." });

    try {
      const resolved = await resolveMedia(trimmed, (index) => {
        if (runId.current === id) setStep(index);
      });
      if (runId.current !== id) return;
      setResult(resolved);
      setStatus("result");
      const local = detectPlatform(trimmed);
      if (local.platform) {
        add({ url: trimmed, platform: local.platform.id, label: local.label ?? trimmed });
      }
      // Never claim a download is ready when only metadata was obtained.
      const downloadable = Boolean(resolved.mediaId) && resolved.media.length > 0;
      toast.success(downloadable ? "Formats ready" : "Media details found", {
        description: downloadable
          ? `${resolved.media.length} ${resolved.media.length === 1 ? "option" : "options"} available — pick a quality below.`
          : "No downloadable file is published for this link.",
      });
    } catch (error) {
      if (runId.current !== id) return;
      const code = error instanceof ResolveError ? error.code : "restricted";
      setErrorCode(code);
      setStatus("error");
      toast.error(code === "invalid_url" ? "Invalid URL" : "Couldn't process that link");
    }
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast.error("Clipboard is empty");
        return;
      }
      setUrl(text.trim());
      setStatus("idle");
      toast.success("URL pasted from clipboard");
    } catch {
      toast.error("Clipboard unavailable", {
        description: "Your browser blocked access — paste with Ctrl/Cmd + V instead.",
      });
    }
  };

  return (
    <div id={DOWNLOADER_ID} className="flex scroll-mt-24 flex-col gap-4">
      <UrlInput
        value={url}
        onChange={(next) => {
          setUrl(next);
          if (status !== "processing") setStatus("idle");
        }}
        onSubmit={() => run(url)}
        onPaste={paste}
        onClear={() => {
          setUrl("");
          setStatus("idle");
          setResult(null);
        }}
        loading={status === "processing"}
        invalid={status === "error" && errorCode === "invalid_url"}
        placeholder={placeholder}
      />

      {status === "processing" ? <ProcessingState step={step} /> : null}
      {status === "error" ? <ErrorState code={errorCode} onRetry={() => run(url)} /> : null}
      {status === "result" && result ? (
        <ResultCard
          result={result}
          onReset={() => {
            setUrl("");
            setResult(null);
            setStatus("idle");
          }}
        />
      ) : null}

      <RecentDownloads
        items={items}
        onOpen={(item) => {
          setUrl(item.url);
          setStatus("idle");
          setResult(null);
          void run(item.url);
        }}
        onRemove={remove}
        onClear={clear}
      />
    </div>
  );
}
