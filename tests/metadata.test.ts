import { describe, expect, it } from "vitest";
import { parseIsoDuration, parsePublicMetadata } from "@/lib/platforms/metadata";
import { describeImageQuality, isDownloadableMediaUrl } from "@/lib/platforms/base";

function page(head: string): string {
  return `<!doctype html><html><head>${head}</head><body></body></html>`;
}

describe("parsePublicMetadata", () => {
  it("reads OpenGraph tags", () => {
    const meta = parsePublicMetadata(
      page(`
        <meta property="og:title" content="A pin title" />
        <meta property="og:description" content="Some description" />
        <meta property="og:image" content="https://i.pinimg.com/736x/aa/bb/cc.jpg" />
        <meta property="og:image:width" content="736" />
        <meta property="og:image:height" content="1104" />
        <meta property="og:video" content="https://v.pinimg.com/videos/mc/720p/clip.mp4" />
        <meta property="og:video:type" content="video/mp4" />
        <meta property="og:type" content="video.other" />
      `),
    );

    expect(meta.title).toBe("A pin title");
    expect(meta.image).toBe("https://i.pinimg.com/736x/aa/bb/cc.jpg");
    expect(meta.imageWidth).toBe(736);
    expect(meta.imageHeight).toBe(1104);
    expect(meta.video).toBe("https://v.pinimg.com/videos/mc/720p/clip.mp4");
    expect(meta.videoType).toBe("video/mp4");
    expect(meta.ogType).toBe("video.other");
    expect(meta.sources).toContain("opengraph");
    expect(meta.isEmptyShell).toBe(false);
  });

  it("prefers secure_url variants", () => {
    const meta = parsePublicMetadata(
      page(`
        <meta property="og:image" content="http://cdn.example.com/a.jpg" />
        <meta property="og:image:secure_url" content="https://cdn.example.com/a.jpg" />
      `),
    );
    expect(meta.image).toBe("https://cdn.example.com/a.jpg");
  });

  it("falls back to Twitter card tags", () => {
    const meta = parsePublicMetadata(
      page(`
        <meta name="twitter:title" content="Card title" />
        <meta name="twitter:image" content="https://pbs.twimg.com/media/x.jpg" />
        <meta name="twitter:creator" content="someone" />
      `),
    );
    expect(meta.title).toBe("Card title");
    expect(meta.image).toBe("https://pbs.twimg.com/media/x.jpg");
    expect(meta.creator).toBe("@someone");
    expect(meta.sources).toContain("twitter-card");
  });

  it("reads JSON-LD VideoObject data", () => {
    const meta = parsePublicMetadata(
      page(`<script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: "Structured title",
        thumbnailUrl: ["https://i.ytimg.com/vi/abc/hq.jpg"],
        duration: "PT1M45S",
        author: { name: "A Creator" },
      })}</script>`),
    );

    expect(meta.title).toBe("Structured title");
    expect(meta.image).toBe("https://i.ytimg.com/vi/abc/hq.jpg");
    expect(meta.duration).toBe(105);
    expect(meta.creator).toBe("A Creator");
    expect(meta.sources).toContain("json-ld");
  });

  it("walks a JSON-LD @graph", () => {
    const meta = parsePublicMetadata(
      page(`<script type="application/ld+json">${JSON.stringify({
        "@graph": [{ "@type": "WebSite" }, { "@type": "ImageObject", name: "Graph image" }],
      })}</script>`),
    );
    expect(meta.title).toBe("Graph image");
  });

  it("reads duration from microdata", () => {
    const meta = parsePublicMetadata(page(`<meta itemprop="duration" content="PT3M34S" />`));
    expect(meta.duration).toBe(214);
    expect(meta.sources).toContain("microdata");
  });

  it("exposes raw namespaced tags for platform specific parsing", () => {
    const meta = parsePublicMetadata(
      page(`
        <meta property="og:title" content="Name on Instagram: &quot;caption&quot;" />
        <meta name="twitter:title" content="Name (&#064;handle) &#x2022; Instagram reel" />
      `),
    );
    expect(meta.tags["twitter:title"]).toBe("Name (@handle) • Instagram reel");
    expect(meta.tags["og:title"]).toBe('Name on Instagram: "caption"');
  });

  it("flags a client rendered shell with no metadata", () => {
    const meta = parsePublicMetadata(page(`<script>window.__d = 1;</script>`));
    expect(meta.isEmptyShell).toBe(true);
    expect(meta.title).toBeUndefined();
    expect(meta.sources).toHaveLength(0);
  });

  it("survives malformed JSON-LD", () => {
    const meta = parsePublicMetadata(
      page(`<script type="application/ld+json">{ not json </script>
            <meta property="og:title" content="Still fine" />`),
    );
    expect(meta.title).toBe("Still fine");
  });

  it("returns an empty result for an empty document", () => {
    const meta = parsePublicMetadata("");
    expect(meta.isEmptyShell).toBe(true);
    expect(meta.tags).toEqual({});
  });
});

describe("parseIsoDuration", () => {
  it("converts ISO 8601 durations", () => {
    expect(parseIsoDuration("PT3M34S")).toBe(214);
    expect(parseIsoDuration("PT1H2M3S")).toBe(3723);
    expect(parseIsoDuration("PT45S")).toBe(45);
    expect(parseIsoDuration("PT0S")).toBeUndefined();
    expect(parseIsoDuration("nonsense")).toBeUndefined();
    expect(parseIsoDuration(undefined)).toBeUndefined();
  });
});

describe("isDownloadableMediaUrl", () => {
  it("accepts platform CDN media URLs", () => {
    expect(isDownloadableMediaUrl("https://pbs.twimg.com/media/x.jpg")).toBe(true);
    expect(isDownloadableMediaUrl("https://i.pinimg.com/736x/a.jpg")).toBe(true);
    expect(isDownloadableMediaUrl("https://scontent.cdninstagram.com/v/x.mp4")).toBe(true);
  });

  it("rejects non-CDN hosts and player pages", () => {
    expect(isDownloadableMediaUrl("https://example.com/a.mp4")).toBe(false);
    expect(isDownloadableMediaUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(false);
    expect(isDownloadableMediaUrl("https://www.facebook.com/plugins/video.php")).toBe(false);
    expect(isDownloadableMediaUrl(undefined)).toBe(false);
    expect(isDownloadableMediaUrl("not a url")).toBe(false);
  });
});

describe("describeImageQuality", () => {
  it("labels resized derivatives as previews", () => {
    expect(describeImageQuality("https://i.pinimg.com/736x/a/b/c.jpg")).toBe("Preview");
    expect(describeImageQuality("https://scontent.cdninstagram.com/v/a.webp?stp=c216")).toBe("Preview");
    expect(describeImageQuality("https://pbs.twimg.com/media/x.jpg")).toBe("Original");
  });
});
