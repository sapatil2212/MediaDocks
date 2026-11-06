/**
 * Live Pinterest acceptance test.
 *
 * Skipped by default. Runs only with LIVE_MEDIA_TESTS=true, against a running
 * dev/prod server for the "server" suite:
 *   LIVE_MEDIA_TESTS=true MEDIAFLOW_BASE_URL=http://localhost:3107 \
 *     npx vitest run tests/live-pinterest.test.ts
 *
 * The "resolver direct" suite calls PinterestResolver against live Pinterest
 * with no server. Request volume is kept to one resolve per Pin.
 */
import { describe, expect, it } from "vitest";

const live = process.env.LIVE_MEDIA_TESTS === "true";
// MEDIAFLOW_BASE_URL avoids clashing with vitest.config env overrides.
const base = process.env.MEDIAFLOW_BASE_URL || process.env.BASE_URL || "http://localhost:3012";

interface Api {
  success: boolean;
  data?: {
    postKind: string;
    sourceUrl: string;
    mediaId?: string;
    media: Array<{ id: string; kind: string; engineKind?: string; mediaUrl: string; extension: string }>;
  };
  error?: { code: string; message: string };
}

async function resolve(url: string): Promise<{ status: number; body: Api }> {
  const res = await fetch(`${base}/api/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return { status: res.status, body: (await res.json()) as Api };
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
    bytes: buf.byteLength,
    isMp4: buf.subarray(4, 8).toString("latin1") === "ftyp",
    isJpeg: buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  };
}

const IMAGE_PIN = "https://www.pinterest.com/pin/311241024270560610/";

describe.skipIf(!live)("live Pinterest — server", () => {
  it.each([IMAGE_PIN, "https://www.pinterest.co.uk/pin/311241024270560610/"])(
    "downloads the original image for %s",
    async (url) => {
      const { status, body } = await resolve(url);
      expect(status).toBe(200);
      expect(body.data?.postKind).toBe("image");
      const item = body.data!.media[0]!;
      expect(item.mediaUrl).toContain("/originals/");

      const file = await download(body.data!.mediaId!, item.id);
      expect(file.contentType).toBe("image/jpeg");
      expect(file.isJpeg).toBe(true);
      expect(file.bytes).toBeGreaterThan(50_000);
    },
    120_000,
  );

  it.each([
    "https://www.pinterest.com/pin/664281013778109217/",
    "https://www.pinterest.com/pin/32580797303002442/",
    "https://pin.it/6LbkInhRx",
  ])(
    "downloads a real MP4 for the video Pin %s",
    async (url) => {
      const { status, body } = await resolve(url);
      expect(status).toBe(200);
      expect(body.data?.postKind).toBe("video");
      expect(body.data?.sourceUrl).not.toMatch(/invite_code|sender=/);
      const item = body.data!.media.find((entry) => (entry.engineKind ?? entry.kind) === "video")!;

      const file = await download(body.data!.mediaId!, item.id);
      expect(file.contentType).toBe("video/mp4");
      expect(file.isMp4).toBe(true);
      expect(file.bytes).toBeGreaterThan(100_000);
    },
    240_000,
  );

  it.each([
    ["https://www.pinterest.com/pin/824721750502199491/", "removed Pin"],
    ["https://pin.it/zzzzzzzzzq", "unknown pin.it code"],
  ])(
    "reports %s (%s) as not found",
    async (url) => {
      const { status, body } = await resolve(url);
      expect(status).toBe(404);
      expect(body.error?.code).toBe("MEDIA_NOT_FOUND");
    },
    120_000,
  );
});

describe.skipIf(!live)("live Pinterest — resolver direct", () => {
  it.each([
    ["https://www.pinterest.com/pin/311241024270560610/", "image"],
    ["https://www.pinterest.com/pin/350295677252925156/", "image"],
    ["https://www.pinterest.com/pin/32580797303002442/", "video"],
    ["https://www.pinterest.com/pin/873909502709617339/", "video"],
    ["https://www.pinterest.com/pin/1052575744158055904/", "video"],
  ])(
    "resolves %s as %s",
    async (url, expected) => {
      const { PinterestResolver } = await import("@/lib/platforms/pinterest");
      const result = await new PinterestResolver().resolve(new URL(url));

      expect(result.postKind).toBe(expected);
      expect(result.media.length).toBeGreaterThan(0);
      if (expected === "image") {
        expect(result.media[0]?.mediaUrl).toContain("/originals/");
      } else {
        const first = result.media[0]!;
        const isMp4 = first.mediaUrl.endsWith(".mp4");
        const isHls = first.downloadSpec?.strategy === "engine-hls";
        expect(isMp4 || isHls).toBe(true);
        expect(first.mediaUrl).not.toMatch(/\/(hdr|hdrct|hevc)/i);
      }
    },
    120_000,
  );
});
