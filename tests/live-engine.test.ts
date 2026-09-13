/**
 * Live engine acceptance test.
 *
 * Runs only when LIVE_MEDIA_TESTS=true against a running dev/prod server:
 *   LIVE_MEDIA_TESTS=true BASE_URL=http://localhost:3012 \
 *     npx vitest run tests/live-engine.test.ts
 *
 * Verifies the whole pipeline for real: resolve exposes selectable
 * resolutions/audio, and each chosen option downloads to a file of the right
 * type (mp4 with an ftyp box, mp3 with an audio frame, jpeg image).
 */
import { describe, expect, it } from "vitest";

const live = process.env.LIVE_MEDIA_TESTS === "true";
// MEDIAFLOW_BASE_URL avoids clashing with vitest.config env overrides.
const base = process.env.MEDIAFLOW_BASE_URL || process.env.BASE_URL || "http://localhost:3012";

interface Api {
  success: boolean;
  data?: {
    postKind: string;
    mediaId?: string;
    media: Array<{
      id: string;
      engineKind?: string;
      kind: string;
      quality?: string;
      extension: string;
      mimeType: string;
      height?: number;
    }>;
  };
  error?: { code: string; message: string };
}

async function resolve(url: string): Promise<Api> {
  const res = await fetch(`${base}/api/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return (await res.json()) as Api;
}

async function download(mediaId: string, itemId: string) {
  const res = await fetch(`${base}/api/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mediaId, itemId }),
  });
  if (!res.ok) throw new Error(`download ${res.status}: ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    contentType: res.headers.get("content-type") ?? "",
    filename: (res.headers.get("content-disposition") ?? "").match(/filename="?([^"]+)"?/)?.[1] ?? "",
    bytes: buf.byteLength,
    isMp4: buf.slice(4, 8).toString("latin1") === "ftyp",
    isMp3: buf.slice(0, 3).toString("latin1") === "ID3" || (buf[0] === 0xff && (buf[1]! & 0xe0) === 0xe0),
    isJpeg: buf[0] === 0xff && buf[1] === 0xd8,
  };
}

describe.skipIf(!live)("live engine — YouTube", () => {
  const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  it("exposes a resolution ladder and an audio menu", async () => {
    const body = await resolve(url);
    expect(body.success).toBe(true);
    const media = body.data!.media;

    const heights = media.filter((m) => m.engineKind === "video").map((m) => m.height);
    expect(heights).toContain(1080);
    expect(heights).toContain(720);
    expect(heights).toContain(360);

    const audio = media.filter((m) => m.engineKind === "audio");
    expect(audio.length).toBeGreaterThan(0);
    expect(audio.some((m) => m.extension === "mp3")).toBe(true);
  }, 60_000);

  it("downloads 1080p as a real MP4", async () => {
    const body = await resolve(url);
    const item = body.data!.media.find((m) => m.id === "v-1080")!;
    const file = await download(body.data!.mediaId!, item.id);

    expect(file.contentType).toBe("video/mp4");
    expect(file.filename.endsWith(".mp4")).toBe(true);
    expect(file.isMp4).toBe(true);
    expect(file.bytes).toBeGreaterThan(1_000_000);
  }, 180_000);

  it("downloads audio as a real MP3", async () => {
    const body = await resolve(url);
    const mp3 = body.data!.media.find((m) => m.extension === "mp3")!;
    const file = await download(body.data!.mediaId!, mp3.id);

    expect(file.contentType).toBe("audio/mpeg");
    expect(file.filename.endsWith(".mp3")).toBe(true);
    expect(file.isMp3).toBe(true);
    expect(file.bytes).toBeGreaterThan(100_000);
  }, 180_000);
});

describe.skipIf(!live)("live engine — X video", () => {
  it("downloads a real MP4 rendition", async () => {
    const body = await resolve("https://x.com/youhaveagift/status/1735368654609629240");
    expect(body.success).toBe(true);
    const video = body.data!.media.find((m) => m.engineKind === "video" || m.kind === "video")!;
    const file = await download(body.data!.mediaId!, video.id);

    expect(file.contentType.startsWith("video/")).toBe(true);
    expect(file.isMp4).toBe(true);
    expect(file.filename).not.toMatch(/\.jpg$/);
  }, 120_000);
});
