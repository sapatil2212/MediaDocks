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
const { readFixture } = await import("./helpers/fixtures");

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

  it("extracts all slides in an Instagram carousel uncropped", async () => {
    const carouselHtml = `
      <meta property="og:title" content="Photographer on Instagram: &quot;album&quot;" />
      <meta property="og:image" content="https://scontent.cdninstagram.com/v/cropped-cover.jpg?stp=c216" />
      <script type="application/json">
        {
          "require": [["ScheduledServerJS", "handle", null, [{
            "__bbox": {
              "result": {
                "data": {
                  "xig_polaris_media": {
                    "if_not_gated_logged_out": {
                      "id": "123",
                      "carousel_media": [
                        {
                          "id": "slide_1",
                          "image_versions2": {
                            "candidates": [
                              { "url": "https://scontent.cdninstagram.com/v/slide1-full.webp" },
                              { "url": "https://scontent.cdninstagram.com/v/slide1-crop.webp?stp=c0.135.1080.1080a" }
                            ]
                          }
                        },
                        {
                          "id": "slide_2",
                          "image_versions2": {
                            "candidates": [
                              { "url": "https://scontent.cdninstagram.com/v/slide2-full.webp" },
                              { "url": "https://scontent.cdninstagram.com/v/slide2-crop.webp?stp=c0.135.1080.1080a" }
                            ]
                          }
                        },
                        {
                          "id": "slide_3",
                          "image_versions2": {
                            "candidates": [
                              { "url": "https://scontent.cdninstagram.com/v/slide3-full.webp" }
                            ]
                          }
                        }
                      ]
                    }
                  }
                }
              }
            }
          }]]]
        }
      </script>
    `;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("instagram.com/p/")) return htmlResponse(carouselHtml);
      return probeResponse("image/webp");
    });

    const result = await new InstagramResolver().resolve(
      new URL("https://www.instagram.com/p/C_ntulJK_V2"),
    );

    expect(result.postKind).toBe("carousel");
    expect(result.media).toHaveLength(3);
    expect(result.media[0].quality).toBe("Image 1");
    expect(result.media[0].mediaUrl).toBe("https://scontent.cdninstagram.com/v/slide1-full.webp");
    expect(result.media[1].quality).toBe("Image 2");
    expect(result.media[1].mediaUrl).toBe("https://scontent.cdninstagram.com/v/slide2-full.webp");
    expect(result.media[2].quality).toBe("Image 3");
    expect(result.media[2].mediaUrl).toBe("https://scontent.cdninstagram.com/v/slide3-full.webp");
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

describe("PinterestResolver — saved Pinterest responses", () => {
  type Route = [RegExp, (init?: RequestInit) => Response];

  /** Routes fetches by URL; anything unrouted is recorded and fails loudly. */
  function routeFetch(routes: Route[]) {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const unrouted: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      calls.push({ url, ...(init ? { init } : {}) });
      const route = routes.find(([pattern]) => pattern.test(url));
      if (!route) {
        unrouted.push(url);
        throw new Error(`unrouted fetch ${url}`);
      }
      return route[1](init);
    });
    return { calls, unrouted };
  }

  const fixtureHtml = (name: string, transform: (html: string) => string = (html) => html) => () =>
    new Response(transform(readFixture(name)), {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  const fixtureJson = (name: string, status = 200) => () =>
    new Response(readFixture(name), {
      status,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  const emptyShell = () => htmlResponse("");
  const imageProbe = () => probeResponse("image/jpeg");

  const PIN_PAGE = /^https:\/\/www\.pinterest\.com\/pin\/\d+\/$/;
  const PIN_API = /^https:\/\/www\.pinterest\.com\/resource\/PinResource\/get\//;
  const ORIGINALS = /^https:\/\/i\.pinimg\.com\/originals\//;

  const noHls = () => new PinterestResolver({ hlsCapable: async () => false });

  it("returns the original image from the legacy page state", async () => {
    const { calls, unrouted } = routeFetch([
      [PIN_PAGE, fixtureHtml("image-pin-legacy-initial-props.html")],
      [ORIGINALS, imageProbe],
    ]);

    const result = await noHls().resolve(new URL("https://www.pinterest.com/pin/311241024270560610/"));

    expect(result.postKind).toBe("image");
    expect(result.media).toHaveLength(1);
    expect(result.media[0]).toMatchObject({
      kind: "image",
      mimeType: "image/jpeg",
      quality: "Original",
      width: 1024,
      height: 1536,
      mediaUrl: "https://i.pinimg.com/originals/44/12/19/441219cffb210a6af2ad959717f6f199.jpg",
    });
    expect(result.sourceUrl).toBe("https://www.pinterest.com/pin/311241024270560610/");
    // The page had a record, so the API fallback was not needed.
    expect(calls.some((call) => PIN_API.test(call.url))).toBe(false);
    expect(unrouted).toEqual([]);
  });

  it("returns the original image from the relay shape", async () => {
    routeFetch([
      [PIN_PAGE, fixtureHtml("image-pin-relay.html")],
      [ORIGINALS, imageProbe],
    ]);

    const result = await noHls().resolve(new URL("https://www.pinterest.com/pin/350295677252925156/"));

    expect(result.postKind).toBe("image");
    expect(result.media[0]?.mediaUrl).toContain("/originals/be/f1/1f/");
    expect(result.thumbnail).toContain("/originals/");
  });

  it("falls back to a sized image when the original is not served", async () => {
    routeFetch([
      [PIN_PAGE, fixtureHtml("image-pin-relay.html")],
      [ORIGINALS, () => new Response("denied", { status: 403, headers: { "content-type": "text/html" } })],
    ]);

    const result = await noHls().resolve(new URL("https://www.pinterest.com/pin/350295677252925156/"));

    expect(result.media).toHaveLength(1);
    expect(result.media[0]?.mediaUrl).toMatch(/\/(1200x|736x)\//);
    expect(result.media[0]?.quality).toBe("Preview");
  });

  it("returns a labelled MP4 for a classic video Pin, not the poster", async () => {
    routeFetch([[PIN_PAGE, fixtureHtml("video-pin-classic-videos-videolist.html")]]);

    const result = await noHls().resolve(new URL("https://www.pinterest.com/pin/664281013778109217/"));

    expect(result.postKind).toBe("video");
    expect(result.media[0]).toMatchObject({
      kind: "video",
      extension: "mp4",
      quality: "720p",
      width: 720,
      height: 1280,
    });
    expect(result.media.every((item) => item.kind === "video")).toBe(true);
    expect(result.width).toBe(720);
    expect(result.duration).toBe(58);
  });

  const withoutMp4 = (html: string) => html.replace(/https:[^"]+?\.mp4[^"]*/g, "");

  it("hands an HLS-only video Pin to the engine as an MP4", async () => {
    routeFetch([[PIN_PAGE, fixtureHtml("video-pin-story-separate-audio.html", withoutMp4)]]);

    const result = await new PinterestResolver({ hlsCapable: async () => true }).resolve(
      new URL("https://www.pinterest.com/pin/873909502709617339/"),
    );

    expect(result.postKind).toBe("video");
    expect(result.media).toHaveLength(1);
    expect(result.media[0]).toMatchObject({
      id: "pin-video-hls",
      kind: "video",
      mimeType: "video/mp4",
      extension: "mp4",
      engineKind: "video",
      downloadSpec: { strategy: "engine-hls" },
    });
    expect(result.media[0]?.sourceUrl).toMatch(/^https:\/\/v1\.pinimg\.com\/videos\/iht\/hls\/.+\.m3u8$/);
    expect(result.unavailable).toBeUndefined();
  });

  it("reports an HLS-only video Pin as unavailable without the engine, never as an image", async () => {
    routeFetch([[PIN_PAGE, fixtureHtml("video-pin-story-separate-audio.html", withoutMp4)]]);

    const result = await noHls().resolve(new URL("https://www.pinterest.com/pin/873909502709617339/"));

    expect(result.postKind).toBe("video");
    expect(result.media).toEqual([]);
    expect(result.unavailable?.code).toBe("VIDEO_MEDIA_UNAVAILABLE");
    expect(result.thumbnail).toContain("i.pinimg.com");
  });

  it("reports a removed Pin served as a 200 shell as not found", async () => {
    routeFetch([[PIN_PAGE, fixtureHtml("removed-pin-200-pinnotfound.html")]]);

    await expect(
      noHls().resolve(new URL("https://www.pinterest.com/pin/824721750502199491/")),
    ).rejects.toMatchObject({ code: "MEDIA_NOT_FOUND", message: expect.stringMatching(/removed/) });
  });

  it("uses the PinResource API when the page has no Pin record", async () => {
    const { calls } = routeFetch([
      [PIN_PAGE, emptyShell],
      [PIN_API, fixtureJson("pinresource-image-311241024270560610.json")],
      [ORIGINALS, imageProbe],
    ]);

    const result = await noHls().resolve(new URL("https://www.pinterest.com/pin/311241024270560610/"));

    expect(result.postKind).toBe("image");
    expect(result.media[0]?.mediaUrl).toBe(
      "https://i.pinimg.com/originals/44/12/19/441219cffb210a6af2ad959717f6f199.jpg",
    );
    expect(result.title).toBe("Upcycled Denim Fox Dolls with Sewing Pattern Pieces for Creative DIY Crafting");

    const api = calls.find((call) => PIN_API.test(call.url));
    expect(api).toBeDefined();
    const headers = (api?.init?.headers ?? {}) as Record<string, string>;
    expect(headers["X-Pinterest-PWS-Handler"]).toBe("www/[username].js");
    const data = JSON.parse(new URL(api!.url).searchParams.get("data") ?? "{}");
    expect(data.options).toMatchObject({ field_set_key: "unauth_react_main_pin", id: "311241024270560610" });
  });

  it("reports not found when the API says the Pin is gone", async () => {
    routeFetch([
      [PIN_PAGE, emptyShell],
      [PIN_API, fixtureJson("pinresource-removed-404-824721750502199491.json", 404)],
    ]);

    await expect(
      noHls().resolve(new URL("https://www.pinterest.com/pin/824721750502199491/")),
    ).rejects.toMatchObject({ code: "MEDIA_NOT_FOUND" });
  });

  it("reports the platform as unavailable when page and API both fail", async () => {
    routeFetch([
      [PIN_PAGE, emptyShell],
      [PIN_API, () => new Response("slow down", { status: 429, headers: { "content-type": "text/html" } })],
    ]);

    await expect(
      noHls().resolve(new URL("https://www.pinterest.com/pin/311241024270560610/")),
    ).rejects.toMatchObject({ code: "PLATFORM_ACCESS_UNAVAILABLE" });
  });

  it("returns one image per slot for a relay carousel", async () => {
    routeFetch([[PIN_PAGE, fixtureHtml("carousel-relay-synthetic.html")]]);

    const result = await noHls().resolve(new URL("https://www.pinterest.com/pin/900000000000000001/"));

    expect(result.postKind).toBe("carousel");
    expect(result.media.map((item) => item.quality)).toEqual(["Image 1", "Image 2", "Image 3"]);
    expect(result.media.map((item) => item.extension)).toEqual(["jpg", "jpg", "png"]);
  });

  it("returns one image per slot for a PinResource carousel", async () => {
    routeFetch([
      [PIN_PAGE, emptyShell],
      [PIN_API, fixtureJson("carousel-pinresource-synthetic.json")],
    ]);

    const result = await noHls().resolve(new URL("https://www.pinterest.com/pin/900000000000000002/"));

    expect(result.postKind).toBe("carousel");
    expect(result.media).toHaveLength(3);
    expect(result.media.every((item) => item.kind === "image")).toBe(true);
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
