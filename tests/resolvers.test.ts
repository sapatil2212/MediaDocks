import { afterEach, describe, expect, it, vi } from "vitest";

// SSRF checks resolve DNS; keep the suite offline and deterministic.
vi.mock("dns/promises", () => ({
  default: { lookup: async () => [{ address: "93.184.216.34", family: 4 }] },
}));

const { InstagramResolver } = await import("@/lib/platforms/instagram");
const { PinterestResolver } = await import("@/lib/platforms/pinterest");
const { FacebookResolver } = await import("@/lib/platforms/facebook");
const { XResolver } = await import("@/lib/platforms/x");
const { YouTubeResolver } = await import("@/lib/platforms/youtube");

function htmlResponse(head: string, status = 200) {
  return new Response(`<!doctype html><html><head>${head}</head><body></body></html>`, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/** Answers the media type probe for URLs without a usable extension. */
function probeResponse(contentType: string) {
  return new Response(new ArrayBuffer(1), {
    status: 206,
    headers: { "content-type": contentType, "content-length": "1" },
  });
}

afterEach(() => vi.restoreAllMocks());

describe("canHandle", () => {
  it("accepts the real URL shapes for each platform", () => {
    const instagram = new InstagramResolver();
    expect(instagram.canHandle(new URL("https://www.instagram.com/reel/DNZXfV7uI2N/"))).toBe(true);
    expect(instagram.canHandle(new URL("https://instagram.com/p/C_ntulJK_V2"))).toBe(true);
    expect(instagram.canHandle(new URL("https://www.instagram.com/reel.chess/"))).toBe(false);

    const youtube = new YouTubeResolver();
    expect(youtube.canHandle(new URL("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))).toBe(true);
    expect(youtube.canHandle(new URL("https://youtu.be/dQw4w9WgXcQ"))).toBe(true);
    expect(youtube.canHandle(new URL("https://www.youtube.com/shorts/dQw4w9WgXcQ"))).toBe(true);

    const pinterest = new PinterestResolver();
    expect(pinterest.canHandle(new URL("https://www.pinterest.com/pin/350295677252925156/"))).toBe(true);
    expect(pinterest.canHandle(new URL("https://pin.it/abc123"))).toBe(true);

    const facebook = new FacebookResolver();
    expect(facebook.canHandle(new URL("https://www.facebook.com/watch/?v=101532313"))).toBe(true);
    expect(facebook.canHandle(new URL("https://fb.watch/-2Y_mvbay/"))).toBe(true);

    const x = new XResolver();
    expect(x.canHandle(new URL("https://x.com/BroadlandPark/status/1628014342229704710"))).toBe(true);
    expect(x.canHandle(new URL("https://twitter.com/Seraph_31/status/916713192017055745"))).toBe(true);
  });
});

describe("InstagramResolver", () => {
  const photoPage = `
    <meta property="og:title" content="Someone on Instagram: &quot;a caption&quot;" />
    <meta property="og:description" content="12 likes - someone on July 1, 2025: &quot;a caption&quot;" />
    <meta property="og:image" content="https://scontent.cdninstagram.com/v/t51/649228528.webp?stp=c216" />
    <meta name="twitter:title" content="Someone (&#064;someone) &#x2022; Instagram photos" />
  `;

  it("types a photo post from what the CDN actually serves", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("instagram.com/p/")) return htmlResponse(photoPage);
      return probeResponse("image/webp");
    });

    const result = await new InstagramResolver().resolve(
      new URL("https://www.instagram.com/p/C_ntulJK_V2"),
    );

    expect(result.postKind).toBe("image");
    expect(result.title).toBe("a caption");
    expect(result.creator).toBe("@someone");
    expect(result.media).toHaveLength(1);
    expect(result.media[0]).toMatchObject({
      kind: "image",
      mimeType: "image/webp",
      extension: "webp",
      label: "WEBP",
    });
    expect(result.unavailable).toBeUndefined();
  });

  it("trusts the CDN over a misleading URL extension", async () => {
    // Real Instagram behaviour: the URL ends in .webp but the `stp` transform
    // makes the CDN serve image/jpeg.
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("instagram.com/p/")) return htmlResponse(photoPage);
      return probeResponse("image/jpeg");
    });

    const result = await new InstagramResolver().resolve(
      new URL("https://www.instagram.com/p/C_ntulJK_V2"),
    );

    expect(result.media[0]).toMatchObject({
      kind: "image",
      mimeType: "image/jpeg",
      extension: "jpg",
    });
  });

  it("never offers a reel's cover image as the download", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      htmlResponse(`
        <meta property="og:title" content="ReelChess on Instagram: &quot;Knight&quot;" />
        <meta property="og:image" content="https://scontent.cdninstagram.com/v/t51/532088108.jpg" />
        <meta name="twitter:title" content="ReelChess (&#064;reel.chess) &#x2022; Instagram reel" />
      `),
    );

    const result = await new InstagramResolver().resolve(
      new URL("https://www.instagram.com/reel/DNZXfV7uI2N"),
    );

    expect(result.postKind).toBe("video");
    // Cover image is a preview only.
    expect(result.thumbnail).toContain("cdninstagram.com");
    expect(result.media).toHaveLength(0);
    expect(result.unavailable?.code).toBe("VIDEO_MEDIA_UNAVAILABLE");
  });

  it("returns a video item when Instagram does publish og:video", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      htmlResponse(`
        <meta property="og:title" content="Someone on Instagram: &quot;clip&quot;" />
        <meta property="og:image" content="https://scontent.cdninstagram.com/v/cover.jpg" />
        <meta property="og:video" content="https://scontent.cdninstagram.com/v/clip.mp4" />
        <meta property="og:video:type" content="video/mp4" />
      `),
    );

    const result = await new InstagramResolver().resolve(
      new URL("https://www.instagram.com/reel/DNZXfV7uI2N"),
    );

    expect(result.postKind).toBe("video");
    expect(result.media).toHaveLength(1);
    expect(result.media[0]).toMatchObject({
      kind: "video",
      mimeType: "video/mp4",
      extension: "mp4",
      posterUrl: "https://scontent.cdninstagram.com/v/cover.jpg",
    });
    expect(result.unavailable).toBeUndefined();
  });
});

describe("PinterestResolver", () => {
  it("returns a typed image item for an image pin", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      htmlResponse(`
        <meta property="og:title" content="A pin" />
        <meta property="og:image" content="https://i.pinimg.com/736x/be/f1/1f/bef.jpg" />
        <meta property="og:image:width" content="736" />
        <meta property="og:image:height" content="572" />
      `),
    );

    const result = await new PinterestResolver().resolve(
      new URL("https://www.pinterest.com/pin/350295677252925156/"),
    );

    expect(result.postKind).toBe("image");
    expect(result.media[0]).toMatchObject({ kind: "image", extension: "jpg", mimeType: "image/jpeg" });
  });

  it("returns a video item for a video pin, with the image as poster", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      htmlResponse(`
        <meta property="og:title" content="A video pin" />
        <meta property="og:image" content="https://i.pinimg.com/736x/a/b/c.jpg" />
        <meta property="og:video" content="https://v.pinimg.com/videos/mc/720p/clip.mp4" />
        <meta property="og:video:type" content="video/mp4" />
      `),
    );

    const result = await new PinterestResolver().resolve(
      new URL("https://www.pinterest.com/pin/123456/"),
    );

    expect(result.postKind).toBe("video");
    expect(result.media).toHaveLength(1);
    expect(result.media[0]).toMatchObject({
      kind: "video",
      mimeType: "video/mp4",
      extension: "mp4",
      posterUrl: "https://i.pinimg.com/736x/a/b/c.jpg",
    });
    // The poster is not a media item.
    expect(result.media.every((item) => item.kind === "video")).toBe(true);
  });
});

describe("XResolver", () => {
  it("maps photos to typed image items", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        __typename: "Tweet",
        text: "hello",
        user: { name: "Broadland", screen_name: "BroadlandPark" },
        mediaDetails: [
          {
            type: "photo",
            media_url_https: "https://pbs.twimg.com/media/FpfeTLWXwAEppTI.jpg",
            original_info: { width: 1125, height: 669 },
          },
        ],
      }),
    );

    const result = await new XResolver().resolve(
      new URL("https://x.com/BroadlandPark/status/1628014342229704710"),
    );

    expect(result.postKind).toBe("image");
    expect(result.media[0]).toMatchObject({
      kind: "image",
      mimeType: "image/jpeg",
      extension: "jpg",
      width: 1125,
    });
  });

  it("probes the CDN when a photo URL has no extension", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("syndication")) {
        return jsonResponse({
          __typename: "Tweet",
          text: "webp photo",
          user: { screen_name: "someone" },
          mediaDetails: [
            { type: "photo", media_url_https: "https://pbs.twimg.com/media/ABC?format=webp" },
          ],
        });
      }
      return probeResponse("image/webp");
    });

    const result = await new XResolver().resolve(new URL("https://x.com/someone/status/123456789"));

    expect(result.media[0]).toMatchObject({
      kind: "image",
      mimeType: "image/webp",
      extension: "webp",
    });
  });

  it("maps a video post to MP4 items, best rendition first, HLS dropped", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        __typename: "Tweet",
        text: "clip",
        user: { screen_name: "someone" },
        mediaDetails: [
          {
            type: "video",
            media_url_https: "https://pbs.twimg.com/ext_tw_video_thumb/1/img/x.jpg",
            original_info: { width: 1280, height: 720 },
            video_info: {
              duration_millis: 42_000,
              variants: [
                { content_type: "application/x-mpegURL", url: "https://video.twimg.com/x.m3u8" },
                { content_type: "video/mp4", bitrate: 832_000, url: "https://video.twimg.com/vid/640x360/a.mp4" },
                { content_type: "video/mp4", bitrate: 2_176_000, url: "https://video.twimg.com/vid/1280x720/b.mp4" },
              ],
            },
          },
        ],
      }),
    );

    const result = await new XResolver().resolve(new URL("https://x.com/someone/status/123456789"));

    expect(result.postKind).toBe("video");
    expect(result.duration).toBe(42);
    expect(result.media.map((item) => item.quality)).toEqual(["720p", "360p"]);
    expect(result.media.every((item) => item.kind === "video")).toBe(true);
    expect(result.media.every((item) => item.extension === "mp4")).toBe(true);
    // The poster is exposed as a poster, never as a downloadable item.
    expect(result.media.every((item) => item.posterUrl?.includes("pbs.twimg.com"))).toBe(true);
    expect(result.media.some((item) => item.mediaUrl.endsWith(".m3u8"))).toBe(false);
  });

  it("treats a tombstone as unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ __typename: "TweetTombstone", tombstone: { text: { text: "gone" } } }),
    );

    await expect(
      new XResolver().resolve(new URL("https://x.com/i/status/925485484964564995")),
    ).rejects.toMatchObject({ code: "MEDIA_NOT_AVAILABLE" });
  });
});

describe("FacebookResolver", () => {
  it("reports the video as unavailable instead of offering an image", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      htmlResponse(`
        <meta property="og:title" content="How to share with just friends." />
        <meta property="og:description" content="2.8M views" />
      `),
    );

    const result = await new FacebookResolver().resolve(
      new URL("https://www.facebook.com/watch/?v=10153231379946729"),
    );

    expect(result.postKind).toBe("video");
    expect(result.media).toHaveLength(0);
    expect(result.unavailable?.code).toBe("VIDEO_MEDIA_UNAVAILABLE");
  });
});

describe("YouTubeResolver", () => {
  it("never treats the ytimg thumbnail as the video", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/oembed")) {
        return jsonResponse({
          title: "Never Gonna Give You Up",
          author_name: "Rick Astley",
          thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        });
      }
      return htmlResponse(`<meta itemprop="duration" content="PT3M34S" />`);
    });

    const result = await new YouTubeResolver().resolve(
      new URL("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    );

    expect(result.postKind).toBe("video");
    expect(result.title).toBe("Never Gonna Give You Up");
    expect(result.duration).toBe(214);
    expect(result.thumbnail).toContain("i.ytimg.com");
    // The thumbnail is an image and must never appear as a media item.
    expect(result.media).toEqual([]);
    expect(result.unavailable?.code).toBe("VIDEO_MEDIA_UNAVAILABLE");
  });

  it("reports an unavailable video", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "not found" }, 400));
    await expect(
      new YouTubeResolver().resolve(new URL("https://www.youtube.com/watch?v=zzzzzzzzzzz")),
    ).rejects.toMatchObject({ code: "MEDIA_NOT_AVAILABLE" });
  });
});
