import { describe, expect, it } from "vitest";
import { validateCandidates, type MediaCandidate } from "@/lib/media/candidates";
import { extractEmbeddedVideoUrls, looksLikeVideoPayload } from "@/lib/platforms/video/embedded-json";
import { InstagramVideoResolver } from "@/lib/platforms/video/instagram";
import { PinterestVideoResolver } from "@/lib/platforms/video/pinterest";
import { FacebookVideoResolver } from "@/lib/platforms/video/facebook";
import { TwitterVideoResolver } from "@/lib/platforms/video/x";
import { parsePublicMetadata } from "@/lib/platforms/metadata";

const allowAll = () => true;

function page(head: string, body = ""): string {
  return `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
}

/* ───────────────────────── embedded JSON extraction ───────────────────────── */

describe("extractEmbeddedVideoUrls", () => {
  it("reads video_versions arrays", () => {
    const html = page(
      "",
      `<script>window.__d={"video_versions":[{"type":101,"url":"https://scontent.cdninstagram.com/v/hi.mp4?efg=1"},{"type":102,"url":"https://scontent.cdninstagram.com/v/lo.mp4"}]}</script>`,
    );
    const found = extractEmbeddedVideoUrls(html);
    expect(found.map((entry) => entry.url)).toContain("https://scontent.cdninstagram.com/v/hi.mp4?efg=1");
    expect(found.map((entry) => entry.url)).toContain("https://scontent.cdninstagram.com/v/lo.mp4");
  });

  it("reads a bare video_url and unescapes it", () => {
    const html = page("", `<script>{"video_url":"https:\\/\\/scontent.cdninstagram.com\\/v\\/a.mp4?x=1\\u0026y=2"}</script>`);
    const found = extractEmbeddedVideoUrls(html);
    expect(found[0]?.url).toBe("https://scontent.cdninstagram.com/v/a.mp4?x=1&y=2");
  });

  it("reads url_list arrays", () => {
    const html = page("", `<script>{"video_versions":[{"url_list":["https://scontent.cdninstagram.com/v/x.mp4"]}]}</script>`);
    expect(extractEmbeddedVideoUrls(html)[0]?.url).toBe("https://scontent.cdninstagram.com/v/x.mp4");
  });

  it("reads Facebook playable fields", () => {
    const html = page(
      "",
      `<script>{"playable_url_quality_hd":"https://video.xx.fbcdn.net/v/hd.mp4","playable_url":"https://video.xx.fbcdn.net/v/sd.mp4"}</script>`,
    );
    const urls = extractEmbeddedVideoUrls(html).map((entry) => entry.url);
    expect(urls).toContain("https://video.xx.fbcdn.net/v/hd.mp4");
    expect(urls).toContain("https://video.xx.fbcdn.net/v/sd.mp4");
  });

  it("finds nothing in a page with no embedded media", () => {
    expect(extractEmbeddedVideoUrls(page("<title>hi</title>"))).toEqual([]);
    expect(extractEmbeddedVideoUrls("")).toEqual([]);
  });

  it("detects video-ish payloads by flag", () => {
    expect(looksLikeVideoPayload(`{"is_video":true}`)).toBe(true);
    expect(looksLikeVideoPayload(`{"media_type":2}`)).toBe(true);
    expect(looksLikeVideoPayload(`{"media_type":1}`)).toBe(false);
  });
});

/* ──────────────────────────── platform extractors ─────────────────────────── */

describe("TwitterVideoResolver", () => {
  const payload = {
    mediaDetails: [
      {
        type: "video",
        media_url_https: "https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/poster.jpg",
        original_info: { width: 720, height: 1280 },
        video_info: {
          duration_millis: 8866,
          variants: [
            { content_type: "application/x-mpegURL", url: "https://video.twimg.com/pu/pl/x.m3u8?tag=12" },
            { content_type: "video/mp4", bitrate: 632000, url: "https://video.twimg.com/vid/avc1/320x568/c.mp4?tag=12" },
            { content_type: "video/mp4", bitrate: 2176000, url: "https://video.twimg.com/vid/avc1/720x1280/a.mp4?tag=12" },
          ],
        },
      },
    ],
  };

  it("produces best-first video candidates with the poster attached", async () => {
    const candidates = await new TwitterVideoResolver().resolve({
      url: new URL("https://x.com/someone/status/1735368654609629240"),
      payload,
    });

    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toMatchObject({
      kindHint: "video",
      declaredMimeType: "video/mp4",
      bitrate: 2176000,
      width: 720,
      height: 1280,
      quality: "720p",
      duration: 9,
      posterUrl: "https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/poster.jpg",
    });
    expect(candidates.some((candidate) => candidate.url.includes(".m3u8"))).toBe(false);
    // The poster is never a candidate of its own.
    expect(candidates.some((candidate) => candidate.url.endsWith("poster.jpg"))).toBe(false);
  });

  it("supports the legacy video.variants shape", async () => {
    const candidates = await new TwitterVideoResolver().resolve({
      url: new URL("https://x.com/someone/status/1"),
      payload: {
        video: {
          poster: "https://pbs.twimg.com/p.jpg",
          durationMs: 4000,
          variants: [{ type: "video/mp4", src: "https://video.twimg.com/vid/640x360/a.mp4" }],
        },
      },
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ quality: "360p", duration: 4 });
  });

  it("returns nothing for a photo-only post", async () => {
    const candidates = await new TwitterVideoResolver().resolve({
      url: new URL("https://x.com/someone/status/1"),
      payload: { mediaDetails: [{ type: "photo", media_url_https: "https://pbs.twimg.com/media/a.jpg" }] },
    });
    expect(candidates).toEqual([]);
  });
});

describe("InstagramVideoResolver", () => {
  it("finds og:video when Instagram publishes one", async () => {
    const html = page(`
      <meta property="og:video" content="https://scontent.cdninstagram.com/v/clip.mp4" />
      <meta property="og:video:type" content="video/mp4" />
      <meta property="og:image" content="https://scontent.cdninstagram.com/v/cover.jpg" />
    `);
    const candidates = await new InstagramVideoResolver().resolve({
      url: new URL("https://www.instagram.com/reel/ABC123"),
      html,
      metadata: parsePublicMetadata(html),
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      url: "https://scontent.cdninstagram.com/v/clip.mp4",
      declaredMimeType: "video/mp4",
      kindHint: "video",
      posterUrl: "https://scontent.cdninstagram.com/v/cover.jpg",
    });
  });

  it("falls back to embedded video_versions", async () => {
    const html = page(
      `<meta property="og:image" content="https://scontent.cdninstagram.com/v/cover.jpg" />`,
      `<script>{"is_video":true,"video_versions":[{"url":"https://scontent.cdninstagram.com/v/reel.mp4"}]}</script>`,
    );
    const candidates = await new InstagramVideoResolver().resolve({
      url: new URL("https://www.instagram.com/reel/ABC123"),
      html,
      metadata: parsePublicMetadata(html),
    });

    expect(candidates[0]?.url).toBe("https://scontent.cdninstagram.com/v/reel.mp4");
    expect(candidates[0]?.source).toBe("video_versions");
  });

  it("yields no candidates for the shell Instagram actually serves", async () => {
    const html = page(
      `<meta property="og:image" content="https://scontent.cdninstagram.com/v/cover.jpg" />
       <meta property="og:title" content="Someone on Instagram: &quot;hi&quot;" />`,
      `<script>window.__d=1;</script>`,
    );
    const candidates = await new InstagramVideoResolver().resolve({
      url: new URL("https://www.instagram.com/reel/ABC123"),
      html,
      metadata: parsePublicMetadata(html),
    });
    expect(candidates).toEqual([]);
  });

  it("ignores a video url that is not on an allow-listed CDN", async () => {
    const html = page(`<meta property="og:video" content="https://evil.example.com/clip.mp4" />`);
    const candidates = await new InstagramVideoResolver().resolve({
      url: new URL("https://www.instagram.com/reel/ABC123"),
      html,
      metadata: parsePublicMetadata(html),
    });
    expect(candidates).toEqual([]);
  });
});

describe("PinterestVideoResolver", () => {
  it("normalizes the video_list object map", async () => {
    const html = page(
      `<meta property="og:image" content="https://i.pinimg.com/736x/a.jpg" />`,
      `<script>{"video_list":{"V_720P":{"url":"https://v.pinimg.com/videos/mc/720p/a.mp4","width":720,"height":1280},"V_EXP7":{"url":"https://v.pinimg.com/videos/mc/exp/b.mp4","width":1080,"height":1920}}}</script>`,
    );

    const candidates = await new PinterestVideoResolver().resolve({
      url: new URL("https://www.pinterest.com/pin/123/"),
      html,
      metadata: parsePublicMetadata(html),
    });

    expect(candidates.length).toBeGreaterThanOrEqual(2);
    // Larger rendition first, poster attached, image never a candidate.
    expect(candidates[0]).toMatchObject({ width: 1080, height: 1920, quality: "1080p" });
    expect(candidates[0]?.posterUrl).toBe("https://i.pinimg.com/736x/a.jpg");
    expect(candidates.some((candidate) => candidate.url.endsWith("a.jpg"))).toBe(false);
  });

  it("uses og:video for a simple video pin", async () => {
    const html = page(`
      <meta property="og:image" content="https://i.pinimg.com/736x/a.jpg" />
      <meta property="og:video" content="https://v.pinimg.com/videos/mc/720p/clip.mp4" />
      <meta property="og:video:type" content="video/mp4" />
    `);
    const candidates = await new PinterestVideoResolver().resolve({
      url: new URL("https://www.pinterest.com/pin/123/"),
      html,
      metadata: parsePublicMetadata(html),
    });
    expect(candidates[0]).toMatchObject({
      url: "https://v.pinimg.com/videos/mc/720p/clip.mp4",
      declaredMimeType: "video/mp4",
    });
  });

  it("yields nothing for an image pin", async () => {
    const html = page(`<meta property="og:image" content="https://i.pinimg.com/736x/a.jpg" />`);
    const candidates = await new PinterestVideoResolver().resolve({
      url: new URL("https://www.pinterest.com/pin/123/"),
      html,
      metadata: parsePublicMetadata(html),
    });
    expect(candidates).toEqual([]);
  });
});

describe("FacebookVideoResolver", () => {
  it("finds a playable url in the embedded state", async () => {
    const html = page(
      `<meta property="og:title" content="A video" />`,
      `<script>{"playable_url_quality_hd":"https://video.xx.fbcdn.net/v/hd.mp4"}</script>`,
    );
    const candidates = await new FacebookVideoResolver().resolve({
      url: new URL("https://www.facebook.com/watch/?v=1"),
      html,
      metadata: parsePublicMetadata(html),
    });
    expect(candidates[0]?.url).toBe("https://video.xx.fbcdn.net/v/hd.mp4");
  });

  it("yields nothing for the details-only response Facebook returns", async () => {
    const html = page(`
      <meta property="og:title" content="How to share with just friends." />
      <meta property="og:description" content="2.8M views" />
    `);
    const candidates = await new FacebookVideoResolver().resolve({
      url: new URL("https://www.facebook.com/watch/?v=1"),
      html,
      metadata: parsePublicMetadata(html),
    });
    expect(candidates).toEqual([]);
  });
});

/* ────────────────────────── central validation rules ─────────────────────── */

describe("validateCandidates", () => {
  // Extensionless URL so the validator probes the live response.
  const candidate = (overrides: Partial<MediaCandidate> = {}): MediaCandidate => ({
    id: "c1",
    url: "https://video.twimg.com/media/probe-me",
    source: "test",
    ...overrides,
  });

  it("never lets a video hint survive an image response", async () => {
    const { items, report } = await validateCandidates(
      [candidate({ url: "https://pbs.twimg.com/media/a", kindHint: "video" })],
      { isAllowedMediaUrl: allowAll, probeContentType: async () => "image/jpeg" },
    );

    expect(items[0]?.kind).toBe("image");
    expect(items[0]?.extension).toBe("jpg");
    expect(report[0]?.probedContentType).toBe("image/jpeg");
  });

  it("never lets an image hint survive a video response", async () => {
    const { items } = await validateCandidates(
      [candidate({ url: "https://video.twimg.com/vid/a", kindHint: "image" })],
      { isAllowedMediaUrl: allowAll, probeContentType: async () => "video/mp4" },
    );

    expect(items[0]?.kind).toBe("video");
    expect(items[0]?.extension).toBe("mp4");
  });

  it("lets the live response override a contradictory declared type", async () => {
    const { items } = await validateCandidates(
      [candidate({ declaredMimeType: "video/mp4" })],
      { isAllowedMediaUrl: allowAll, probeContentType: async () => "image/jpeg" },
    );
    expect(items[0]?.kind).toBe("image");
  });

  it("trusts a clean extension without probing", async () => {
    let probed = false;
    const { items } = await validateCandidates(
      [candidate({ url: "https://video.twimg.com/vid/720x1280/a.mp4" })],
      {
        isAllowedMediaUrl: allowAll,
        probeContentType: async () => {
          probed = true;
          return "image/jpeg";
        },
      },
    );

    expect(probed).toBe(false);
    expect(items[0]?.kind).toBe("video");
    expect(items[0]?.extension).toBe("mp4");
  });

  it("rejects a response that is a page rather than media", async () => {
    const { items, report } = await validateCandidates([candidate()], {
      isAllowedMediaUrl: allowAll,
      probeContentType: async () => "text/html",
    });

    expect(items).toEqual([]);
    expect(report[0]?.rejectedReason).toMatch(/not media/i);
  });

  it("rejects candidates outside the allow-list before probing", async () => {
    let probed = false;
    const { items, report } = await validateCandidates(
      [candidate({ url: "https://evil.example.com/a.mp4" })],
      {
        isAllowedMediaUrl: () => false,
        probeContentType: async () => {
          probed = true;
          return "video/mp4";
        },
      },
    );

    expect(items).toEqual([]);
    expect(probed).toBe(false);
    expect(report[0]?.rejectedReason).toMatch(/allow-listed/i);
  });

  it("falls back through declared type and extension when no probe is made", async () => {
    const { items } = await validateCandidates(
      [
        candidate({ id: "declared", url: "https://video.twimg.com/x", declaredMimeType: "video/webm" }),
        candidate({ id: "ext", url: "https://video.twimg.com/y.mov" }),
        candidate({ id: "hint", url: "https://video.twimg.com/z", kindHint: "video" }),
      ],
      { isAllowedMediaUrl: allowAll, probe: false },
    );

    expect(items.map((item) => item.extension)).toEqual(["webm", "mov", "mp4"]);
  });

  it("drops a candidate whose type cannot be determined at all", async () => {
    const { items, report } = await validateCandidates(
      [{ id: "c1", url: "https://video.twimg.com/mystery", source: "test" }],
      { isAllowedMediaUrl: allowAll, probe: false },
    );

    expect(items).toEqual([]);
    expect(report[0]?.rejectedReason).toMatch(/could not be determined/i);
  });
});
