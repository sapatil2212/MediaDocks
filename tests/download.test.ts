import { afterEach, describe, expect, it, vi } from "vitest";

// The allow-list / SSRF checks resolve DNS; keep the suite offline.
vi.mock("dns/promises", () => ({
  default: { lookup: async () => [{ address: "93.184.216.34", family: 4 }] },
}));

const { openMediaDownload } = await import("@/lib/download/downloader");
const type = await import("@/lib/media/detect-media-type");

function reference(
  overrides: Partial<{
    mediaUrl: string;
    mimeType: string;
    extension: string;
    kind: "image" | "video";
    descriptor: string;
    platform: string;
  }> = {},
) {
  return {
    mediaId: "test-media",
    platform: overrides.platform ?? "instagram",
    descriptor: overrides.descriptor ?? "Reel",
    itemIndex: 1,
    itemCount: 1,
    item: {
      id: "item-1",
      kind: overrides.kind ?? "video",
      mediaUrl: overrides.mediaUrl ?? "https://scontent.cdninstagram.com/v/clip.mp4",
      mimeType: overrides.mimeType ?? "video/mp4",
      extension: overrides.extension ?? "mp4",
      label: "MP4",
    },
  };
}

function mediaResponse(body: ArrayBuffer, contentType: string, extraHeaders: Record<string, string> = {}) {
  return new Response(body, {
    status: 200,
    headers: { "content-type": contentType, "content-length": String(body.byteLength), ...extraHeaders },
  });
}

function bytes(size: number): ArrayBuffer {
  const buffer = new ArrayBuffer(size);
  new Uint8Array(buffer).fill(9);
  return buffer;
}

async function drain(stream: ReadableStream<Uint8Array>): Promise<number> {
  const reader = stream.getReader();
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value?.length ?? 0;
  }
  return total;
}

afterEach(() => vi.restoreAllMocks());

describe("openMediaDownload — media type fidelity", () => {
  it("serves an MP4 as video/mp4 with a .mp4 filename", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mediaResponse(bytes(4096), "video/mp4"));

    const download = await openMediaDownload(reference());

    expect(download.mimeType).toBe("video/mp4");
    expect(download.extension).toBe("mp4");
    expect(download.filename).toBe("mediaflow-instagram-reel-video.mp4");
    expect(download.filename.endsWith(".jpg")).toBe(false);
    expect(await drain(download.body)).toBe(4096);
  });

  it("serves a JPEG as image/jpeg with a .jpg filename", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mediaResponse(bytes(1024), "image/jpeg"));

    const download = await openMediaDownload(
      reference({
        kind: "image",
        mediaUrl: "https://i.pinimg.com/originals/a/b/c.jpg",
        mimeType: "image/jpeg",
        extension: "jpg",
        descriptor: "Pin",
        platform: "pinterest",
      }),
    );

    expect(download.mimeType).toBe("image/jpeg");
    expect(download.filename).toBe("mediaflow-pinterest-pin-image.jpg");
  });

  it("preserves PNG", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mediaResponse(bytes(512), "image/png"));

    const download = await openMediaDownload(
      reference({ kind: "image", mediaUrl: "https://pbs.twimg.com/media/a.png", mimeType: "image/png", extension: "png" }),
    );

    expect(download.mimeType).toBe("image/png");
    expect(download.extension).toBe("png");
    expect(download.filename.endsWith(".png")).toBe(true);
  });

  it("preserves WEBP even when the URL has no extension", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mediaResponse(bytes(512), "image/webp"));

    const download = await openMediaDownload(
      reference({
        kind: "image",
        mediaUrl: "https://pbs.twimg.com/media/FpfeTLWXwAEppTI?format=webp&name=large",
        mimeType: "image/webp",
        extension: "webp",
        platform: "x",
        descriptor: "Post image",
      }),
    );

    expect(download.mimeType).toBe("image/webp");
    expect(download.filename).toBe("mediaflow-x-post-image.webp");
  });

  it("lets the live Content-Type override a stale stored type", async () => {
    // Stored as jpg, but the CDN actually serves webp.
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mediaResponse(bytes(256), "image/webp"));

    const download = await openMediaDownload(
      reference({
        kind: "image",
        mediaUrl: "https://scontent.cdninstagram.com/v/photo.jpg",
        mimeType: "image/jpeg",
        extension: "jpg",
      }),
    );

    expect(download.mimeType).toBe("image/webp");
    expect(download.extension).toBe("webp");
  });

  it("falls back to the stored type when the CDN says octet-stream", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mediaResponse(bytes(256), "application/octet-stream"),
    );

    const download = await openMediaDownload(reference());
    expect(download.mimeType).toBe("video/mp4");
    expect(download.extension).toBe("mp4");
  });
});

describe("openMediaDownload — validation", () => {
  it("rejects an HTML response instead of saving a page as media", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<!doctype html><html></html>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    await expect(openMediaDownload(reference())).rejects.toMatchObject({
      code: "INVALID_MEDIA_RESPONSE",
    });
  });

  it("rejects a JSON response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
    );

    await expect(openMediaDownload(reference())).rejects.toMatchObject({
      code: "INVALID_MEDIA_RESPONSE",
    });
  });

  it("reports an unknown media type rather than guessing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mediaResponse(bytes(64), "application/octet-stream"),
    );

    await expect(
      openMediaDownload(
        reference({ mediaUrl: "https://pbs.twimg.com/media/mystery", mimeType: "application/weird", extension: "bin" }),
      ),
    ).rejects.toMatchObject({ code: "MEDIA_TYPE_UNKNOWN" });
  });

  it("refuses hosts outside the media allow-list before fetching", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(
      openMediaDownload(reference({ mediaUrl: "https://evil.example.com/video.mp4" })),
    ).rejects.toThrow(/not allowed/i);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses private addresses", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(
      openMediaDownload(reference({ mediaUrl: "http://127.0.0.1/video.mp4" })),
    ).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects a file whose declared length exceeds the limit", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mediaResponse(bytes(16), "video/mp4", { "content-length": String(900 * 1024 * 1024) }),
    );

    await expect(openMediaDownload(reference())).rejects.toMatchObject({ code: "FILE_TOO_LARGE" });
  });

  it("reports an upstream failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 403 }));
    await expect(openMediaDownload(reference())).rejects.toMatchObject({ code: "DOWNLOAD_FAILED" });
  });
});

describe("streaming", () => {
  it("does not buffer the body before returning", async () => {
    // A never-ending body would hang if the implementation buffered it.
    let pushed = 0;
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        pushed += 1;
        controller.enqueue(new Uint8Array(1024));
        if (pushed > 10_000) controller.close();
      },
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(endless, { status: 200, headers: { "content-type": "video/mp4" } }),
    );

    const download = await openMediaDownload(reference());
    // Returned immediately, with only a handful of chunks pulled so far.
    expect(download.mimeType).toBe("video/mp4");
    expect(pushed).toBeLessThan(200);
    await download.body.cancel();
  });
});

describe("supported type table", () => {
  it("covers the types the brief requires", () => {
    for (const mime of ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]) {
      expect(type.fromMimeType(mime)?.kind, mime).toBe("image");
    }
    for (const mime of ["video/mp4", "video/webm", "video/quicktime"]) {
      expect(type.fromMimeType(mime)?.kind, mime).toBe("video");
    }
  });
});

describe("multi-item filenames", () => {
  it("keeps each item of a carousel distinct", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mediaResponse(bytes(64), "image/jpeg"));

    const first = await openMediaDownload({
      ...reference({ kind: "image", mediaUrl: "https://pbs.twimg.com/media/a.jpg", mimeType: "image/jpeg", extension: "jpg", platform: "x", descriptor: "Post image" }),
      itemIndex: 1,
      itemCount: 2,
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(mediaResponse(bytes(64), "image/jpeg"));
    const second = await openMediaDownload({
      ...reference({ kind: "image", mediaUrl: "https://pbs.twimg.com/media/b.jpg", mimeType: "image/jpeg", extension: "jpg", platform: "x", descriptor: "Post image" }),
      itemIndex: 2,
      itemCount: 2,
    });

    expect(first.filename).toBe("mediaflow-x-post-image-1.jpg");
    expect(second.filename).toBe("mediaflow-x-post-image-2.jpg");
    expect(first.filename).not.toBe(second.filename);
  });
});
