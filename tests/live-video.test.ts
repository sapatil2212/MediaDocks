/**
 * Live video acceptance test.
 *
 * Runs only when LIVE_MEDIA_TESTS=true. Verifies the full pipeline:
 *   resolve → kind=video → mp4 extension → /api/download → real video bytes
 *
 *   LIVE_MEDIA_TESTS=true npx vitest run tests/live-video.test.ts
 *
 * The default URL is the one confirmed reachable in the pre-work:
 *   https://x.com/youhaveagift/status/1735368654609629240
 * Set LIVE_VIDEO_URL to override it.
 */
import { describe, expect, it } from "vitest";

const live = process.env.LIVE_MEDIA_TESTS === "true";
const base = process.env.BASE_URL ?? "http://localhost:3010";
const videoUrl =
  process.env.LIVE_VIDEO_URL ?? "https://x.com/youhaveagift/status/1735368654609629240";

interface ApiResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: { code: string; message: string };
}

describe.skipIf(!live)("live video pipeline", () => {
  it("resolves an X video post to real MP4 items", async () => {
    const res = await fetch(`${base}/api/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: videoUrl }),
    });

    const body = (await res.json()) as ApiResponse;
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    const data = body.data!;
    expect(data.postKind).toBe("video");
    expect(data.mediaId).toBeTruthy();

    const media = (data.media ?? []) as Array<Record<string, unknown>>;
    expect(media.length).toBeGreaterThan(0);

    for (const item of media) {
      // The fundamental contract: a video item is never a JPEG thumbnail.
      expect(item.kind).toBe("video");
      expect(String(item.mimeType).startsWith("video/")).toBe(true);
      expect(item.extension).not.toBe("jpg");
      expect(item.extension).not.toBe("jpeg");
      expect(item.extension).not.toBe("png");
      expect(item.extension).not.toBe("webp");
      expect(item.mediaUrl).not.toBe(data.thumbnail);
      expect(item.downloadable).toBe(true);
    }

    const best = media[0]!;
    console.log(
      `  platform=${data.platform} kind=${data.postKind} items=${media.length}\n` +
        `  best: id=${best.id} mime=${best.mimeType} ext=${best.extension}` +
        ` quality=${best.quality} dims=${best.width}x${best.height} dur=${best.duration}s\n` +
        `  url: ${String(best.mediaUrl).slice(0, 90)}`,
    );
  }, 60_000);

  it("downloads the best rendition as a real video file", async () => {
    const resolveRes = await fetch(`${base}/api/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: videoUrl }),
    });
    const resolveBody = (await resolveRes.json()) as ApiResponse;

    const data = resolveBody.data!;
    const media = data.media as Array<Record<string, unknown>>;
    const best = media[0]!;
    expect(best.downloadable).toBe(true);

    const dlRes = await fetch(`${base}/api/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId: data.mediaId, itemId: best.id }),
    });

    expect(dlRes.ok).toBe(true);

    const contentType = dlRes.headers.get("content-type") ?? "";
    const disposition = dlRes.headers.get("content-disposition") ?? "";
    const filename = disposition.match(/filename="?([^"]+)"?/)?.[1] ?? "";

    // Header contract.
    expect(contentType.startsWith("video/")).toBe(true);
    expect(filename.endsWith(`.${best.extension}`)).toBe(true);
    expect(filename).not.toMatch(/\.jpg$/);

    // Body contract: real MP4 starts with an `ftyp` box.
    const bytes = await dlRes.arrayBuffer();
    expect(bytes.byteLength).toBeGreaterThan(10_000);

    const header = new Uint8Array(bytes.slice(0, 12));
    const boxType = String.fromCharCode(header[4]!, header[5]!, header[6]!, header[7]!);
    expect(boxType).toBe("ftyp");

    console.log(
      `  Content-Type: ${contentType}\n` +
        `  filename: ${filename}\n` +
        `  size: ${(bytes.byteLength / 1024).toFixed(0)} KB\n` +
        `  ftyp box: yes`,
    );
  }, 120_000);
});
