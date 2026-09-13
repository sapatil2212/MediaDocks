import { describe, expect, it } from "vitest";
import { openMediaDownload } from "@/lib/download/downloader";
import type { StoredMediaItem } from "@/lib/download/reference";

/**
 * Live network tests: they hit real platform CDNs to prove that the download
 * pipeline preserves the source format end to end.
 *
 * Skipped unless LIVE_MEDIA_TESTS=true so the normal suite stays offline:
 *   LIVE_MEDIA_TESTS=true npx vitest run tests/live-media.test.ts
 *
 * Set LIVE_VIDEO_URL to a public video file on an allow-listed CDN (for example
 * a video.twimg.com rendition taken from /dev/resolver-test) to include the
 * video case.
 */
const live = process.env.LIVE_MEDIA_TESTS === "true";

function reference(item: Partial<StoredMediaItem> & { mediaUrl: string }) {
  return {
    mediaId: "live-test",
    platform: item.kind === "video" ? "x" : "x",
    descriptor: item.kind === "video" ? "Post video" : "Post image",
    itemIndex: 1,
    itemCount: 1,
    item: {
      id: "live-1",
      kind: item.kind ?? "image",
      mediaUrl: item.mediaUrl,
      // Deliberately stale: the live Content-Type must win.
      mimeType: item.mimeType ?? "application/octet-stream",
      extension: item.extension ?? "bin",
      label: item.label ?? "?",
    } as StoredMediaItem,
  };
}

describe.skipIf(!live)("live format preservation", () => {
  it("serves a JPEG source as .jpg", async () => {
    const download = await openMediaDownload(
      reference({ mediaUrl: "https://pbs.twimg.com/media/FpfeTLWXwAEppTI.jpg" }),
    );

    expect(download.mimeType).toBe("image/jpeg");
    expect(download.extension).toBe("jpg");
    expect(download.filename.endsWith(".jpg")).toBe(true);
    expect(await countBytes(download.body)).toBeGreaterThan(1000);
  }, 30_000);

  it("serves a WEBP source as .webp, not .jpg", async () => {
    const download = await openMediaDownload(
      reference({
        mediaUrl: "https://pbs.twimg.com/media/FpfeTLWXwAEppTI?format=webp&name=large",
      }),
    );

    expect(download.mimeType).toBe("image/webp");
    expect(download.extension).toBe("webp");
    expect(download.filename.endsWith(".webp")).toBe(true);
    expect(await countBytes(download.body)).toBeGreaterThan(1000);
  }, 30_000);

  it("serves a PNG source as .png", async () => {
    const download = await openMediaDownload(
      reference({
        mediaUrl: "https://pbs.twimg.com/media/FpfeTLWXwAEppTI?format=png&name=small",
      }),
    );

    expect(download.mimeType).toBe("image/png");
    expect(download.extension).toBe("png");
    expect(download.filename.endsWith(".png")).toBe(true);
  }, 30_000);

  it("serves a Pinterest image with its real type", async () => {
    const download = await openMediaDownload(
      reference({
        mediaUrl: "https://i.pinimg.com/736x/be/f1/1f/bef11fca4fc07e7d09928ce2b774bfd0.jpg",
      }),
    );

    expect(download.mimeType).toBe("image/jpeg");
    expect(download.filename.endsWith(".jpg")).toBe(true);
  }, 30_000);

  const videoUrl = process.env.LIVE_VIDEO_URL;

  it.skipIf(!videoUrl)("serves a video source as a video file", async () => {
    const download = await openMediaDownload(
      reference({ mediaUrl: videoUrl as string, kind: "video" }),
    );

    expect(download.mimeType.startsWith("video/")).toBe(true);
    expect(["mp4", "webm", "mov", "m4v"]).toContain(download.extension);
    expect(download.filename.endsWith(`.${download.extension}`)).toBe(true);
    expect(download.filename.endsWith(".jpg")).toBe(false);
    expect(await countBytes(download.body)).toBeGreaterThan(10_000);
  }, 60_000);
});

async function countBytes(stream: ReadableStream<Uint8Array>): Promise<number> {
  const reader = stream.getReader();
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value?.length ?? 0;
  }
  return total;
}
