"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CandidateReportShape {
  id: string;
  source: string;
  host: string;
  kindHint?: string;
  declaredMimeType?: string;
  probedContentType?: string;
  resolvedKind?: string;
  resolvedMimeType?: string;
  extension?: string;
  bitrate?: number;
  accepted: boolean;
  rejectedReason?: string;
}

interface Diagnostics {
  platform?: string;
  durationMs?: number;
  resolverStatus?: string;
  mediaTypes?: string[];
  unavailable?: string | null;
  videoResolver?: string | null;
  candidateCount?: number;
  candidates?: CandidateReportShape[];
  trace?: Array<{ step: string; detail: string; at: number }>;
}

interface MediaItemShape {
  id: string;
  kind: "image" | "video";
  mediaUrl: string;
  mimeType: string;
  extension: string;
  label: string;
  quality?: string;
  posterUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  engineKind?: "video" | "audio" | "image";
  audioBitrate?: number;
  downloadable?: boolean;
}

interface ProbeResponse {
  success: boolean;
  data?: Record<string, unknown> & { media?: MediaItemShape[] };
  error?: { code: string; message: string };
  diagnostics?: Diagnostics;
}

const FIELDS = [
  "platform",
  "postKind",
  "kind",
  "title",
  "creator",
  "thumbnail",
  "width",
  "height",
  "duration",
  "sourceUrl",
  "mediaId",
  "isMock",
] as const;

const SAMPLES: Array<{ label: string; url: string }> = [
  { label: "Instagram image", url: "https://www.instagram.com/p/C_ntulJK_V2/" },
  { label: "Instagram reel", url: "https://www.instagram.com/reel/DNZXfV7uI2N/" },
  { label: "Pinterest image", url: "https://www.pinterest.com/pin/350295677252925156/" },
  { label: "X image", url: "https://x.com/BroadlandPark/status/1628014342229704710" },
  { label: "X multi-image", url: "https://twitter.com/Seraph_31/status/916713192017055745" },
  { label: "YouTube video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { label: "YouTube Short", url: "https://www.youtube.com/shorts/dQw4w9WgXcQ" },
  { label: "Facebook video", url: "https://www.facebook.com/watch/?v=10153231379946729" },
];

export function ResolverTester() {
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [response, setResponse] = useState<ProbeResponse | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadNote, setDownloadNote] = useState<string | null>(null);

  const probe = async (target: string) => {
    if (!target.trim() || pending) return;
    setPending(true);
    setResponse(null);
    setDownloadNote(null);
    try {
      const res = await fetch("/api/dev/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target.trim() }),
      });
      setResponse((await res.json()) as ProbeResponse);
    } catch (error) {
      setResponse({
        success: false,
        error: { code: "REQUEST_FAILED", message: (error as Error).message },
      });
    } finally {
      setPending(false);
    }
  };

  const download = async (mediaId: string, item: MediaItemShape) => {
    setDownloading(item.id);
    setDownloadNote(null);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, itemId: item.id }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setDownloadNote(`HTTP ${res.status} — ${body?.error?.code ?? "unknown"}`);
        return;
      }

      const disposition = res.headers.get("content-disposition") ?? "";
      const filename = disposition.match(/filename="?([^"]+)"?/)?.[1] ?? "download";
      const blob = await res.blob();
      setDownloadNote(
        `Content-Type: ${res.headers.get("content-type")} · filename: ${filename} · ${blob.size} bytes`,
      );

      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (error) {
      setDownloadNote((error as Error).message);
    } finally {
      setDownloading(null);
    }
  };

  const data = response?.data;
  const media = data?.media ?? [];
  const mediaId = typeof data?.mediaId === "string" ? data.mediaId : undefined;

  return (
    <div className="mt-6 flex flex-col gap-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void probe(url);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://www.instagram.com/reel/..."
          className="h-11"
          aria-label="URL to test"
        />
        <Button type="submit" disabled={pending || !url.trim()} className="h-11 shrink-0 px-5">
          {pending ? "Testing..." : "Test resolver"}
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {SAMPLES.map((sample) => (
          <button
            key={sample.label}
            onClick={() => {
              setUrl(sample.url);
              void probe(sample.url);
            }}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {sample.label}
          </button>
        ))}
      </div>

      {response ? (
        <div className="flex flex-col gap-5">
          <section className="rounded-xl border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold">Outcome</h2>
            <dl className="mt-3 grid grid-cols-[10rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Resolver status</dt>
              <dd className="font-mono">{response.diagnostics?.resolverStatus ?? "—"}</dd>
              <dt className="text-muted-foreground">Video resolver</dt>
              <dd className="font-mono">{response.diagnostics?.videoResolver ?? "—"}</dd>
              <dt className="text-muted-foreground">Candidates found</dt>
              <dd className="font-mono">{response.diagnostics?.candidateCount ?? 0}</dd>
              <dt className="text-muted-foreground">Media types</dt>
              <dd className="font-mono">
                {response.diagnostics?.mediaTypes?.join(", ") || "none"}
              </dd>
              <dt className="text-muted-foreground">Unavailable</dt>
              <dd className="font-mono">{response.diagnostics?.unavailable ?? "—"}</dd>
              <dt className="text-muted-foreground">Error code</dt>
              <dd className="font-mono">{response.error?.code ?? "none"}</dd>
              <dt className="text-muted-foreground">Error message</dt>
              <dd className="break-words">{response.error?.message ?? "—"}</dd>
              <dt className="text-muted-foreground">Processing time</dt>
              <dd className="font-mono">{response.diagnostics?.durationMs ?? "—"} ms</dd>
            </dl>
          </section>

          {data ? (
            <section className="rounded-xl border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold">Post</h2>
              <dl className="mt-3 grid grid-cols-[10rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
                {FIELDS.map((field) => (
                  <div key={field} className="contents">
                    <dt className="text-muted-foreground">{field}</dt>
                    <dd className="break-all font-mono">
                      {data[field] === undefined || data[field] === null ? "—" : String(data[field])}
                    </dd>
                  </div>
                ))}
              </dl>

              {typeof data.thumbnail === "string" ? (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground">Thumbnail (preview only)</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.thumbnail}
                    alt="thumbnail"
                    className="mt-2 max-h-40 rounded-lg border border-border"
                  />
                </div>
              ) : null}
            </section>
          ) : null}

          {response.diagnostics?.candidates?.length ? (
            <section className="rounded-xl border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold">
                Candidates ({response.diagnostics.candidates.filter((c) => c.accepted).length}{" "}
                accepted / {response.diagnostics.candidates.length})
              </h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[46rem] text-left font-mono text-xs">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="py-1 pr-3">id</th>
                      <th className="py-1 pr-3">source</th>
                      <th className="py-1 pr-3">host</th>
                      <th className="py-1 pr-3">hint</th>
                      <th className="py-1 pr-3">declared</th>
                      <th className="py-1 pr-3">probed</th>
                      <th className="py-1 pr-3">resolved</th>
                      <th className="py-1 pr-3">ext</th>
                      <th className="py-1 pr-3">bitrate</th>
                      <th className="py-1">verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {response.diagnostics.candidates.map((candidate) => (
                      <tr key={candidate.id} className="border-t border-border/60">
                        <td className="py-1 pr-3">{candidate.id}</td>
                        <td className="py-1 pr-3">{candidate.source}</td>
                        <td className="py-1 pr-3">{candidate.host}</td>
                        <td className="py-1 pr-3">{candidate.kindHint ?? "—"}</td>
                        <td className="py-1 pr-3">{candidate.declaredMimeType ?? "—"}</td>
                        <td className="py-1 pr-3">{candidate.probedContentType ?? "—"}</td>
                        <td className="py-1 pr-3">
                          {candidate.resolvedKind
                            ? `${candidate.resolvedKind} / ${candidate.resolvedMimeType}`
                            : "—"}
                        </td>
                        <td className="py-1 pr-3">{candidate.extension ?? "—"}</td>
                        <td className="py-1 pr-3">{candidate.bitrate ?? "—"}</td>
                        <td className="py-1">
                          {candidate.accepted ? (
                            <span className="font-semibold text-primary">selected</span>
                          ) : (
                            <span className="text-muted-foreground">
                              {candidate.rejectedReason ?? "rejected"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold">Media items ({media.length})</h2>

            {media.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No downloadable media item. The thumbnail above is a preview and is deliberately not
                offered as a download.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-4">
                {media.map((item) => (
                  <li key={item.id} className="rounded-lg border border-border p-3">
                    <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
                      <dt className="text-muted-foreground">id</dt>
                      <dd className="font-mono">{item.id}</dd>
                      <dt className="text-muted-foreground">group</dt>
                      <dd className="font-mono font-semibold">{item.engineKind ?? item.kind}</dd>
                      <dt className="text-muted-foreground">label / quality</dt>
                      <dd className="font-mono">{item.quality ?? item.label}</dd>
                      <dt className="text-muted-foreground">MIME type</dt>
                      <dd className="font-mono">{item.mimeType}</dd>
                      <dt className="text-muted-foreground">extension</dt>
                      <dd className="font-mono">.{item.extension}</dd>
                      <dt className="text-muted-foreground">dimensions</dt>
                      <dd className="font-mono">
                        {item.width && item.height ? `${item.width} × ${item.height}` : "—"}
                      </dd>
                      {item.audioBitrate ? (
                        <>
                          <dt className="text-muted-foreground">bitrate</dt>
                          <dd className="font-mono">{item.audioBitrate} kbps</dd>
                        </>
                      ) : null}
                      <dt className="text-muted-foreground">source</dt>
                      <dd className="truncate font-mono text-xs">
                        {item.mediaUrl && item.mediaUrl.startsWith("http")
                          ? item.mediaUrl
                          : "engine (produced on download)"}
                      </dd>
                    </dl>

                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground">Preview</p>
                      {item.kind === "video" && item.mediaUrl?.startsWith("http") ? (
                        <video
                          controls
                          playsInline
                          preload="metadata"
                          poster={item.posterUrl}
                          className="mt-2 max-h-64 w-full rounded-lg border border-border bg-black"
                        >
                          <source src={item.mediaUrl} type={item.mimeType} />
                        </video>
                      ) : item.mediaUrl?.startsWith("http") || item.posterUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.mediaUrl?.startsWith("http") ? item.mediaUrl : item.posterUrl}
                          alt={item.id}
                          className="mt-2 max-h-64 rounded-lg border border-border"
                        />
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Produced on download by the engine.
                        </p>
                      )}
                    </div>

                    {mediaId ? (
                      <Button
                        onClick={() => void download(mediaId, item)}
                        disabled={downloading === item.id}
                        className="mt-3 h-9 px-4 text-xs"
                      >
                        {downloading === item.id ? "Downloading..." : `Download .${item.extension}`}
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            {downloadNote ? (
              <p className="mt-3 rounded-lg bg-surface-strong p-3 font-mono text-xs">{downloadNote}</p>
            ) : null}
          </section>

          {response.diagnostics?.trace?.length ? (
            <section className="rounded-xl border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold">Trace</h2>
              <ol className="mt-3 flex flex-col gap-1 font-mono text-xs">
                {response.diagnostics.trace.map((entry, index) => (
                  <li key={`${entry.step}-${index}`} className="flex gap-3">
                    <span className="w-12 shrink-0 text-right text-muted-foreground">
                      {entry.at}ms
                    </span>
                    <span className="w-24 shrink-0 font-semibold">{entry.step}</span>
                    <span className="break-all text-muted-foreground">{entry.detail}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
