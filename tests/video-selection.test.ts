import { describe, expect, it } from "vitest";
import {
  isRejectedVariant,
  qualityLabel,
  resolutionFromUrl,
  selectVideoVariants,
} from "@/lib/platforms/video/video-selection";

describe("isRejectedVariant", () => {
  it("rejects HLS and DASH manifests by content type", () => {
    expect(
      isRejectedVariant({ url: "https://video.twimg.com/a.m3u8", contentType: "application/x-mpegURL" }),
    ).toMatch(/manifest/i);
    expect(
      isRejectedVariant({ url: "https://video.twimg.com/a", contentType: "application/dash+xml" }),
    ).toMatch(/manifest/i);
  });

  it("rejects manifests by extension even without a content type", () => {
    expect(isRejectedVariant({ url: "https://video.twimg.com/pl/x.m3u8?tag=12" })).toMatch(/manifest/i);
    expect(isRejectedVariant({ url: "https://cdn.example.com/x.mpd" })).toMatch(/manifest/i);
  });

  it("rejects images and pages", () => {
    expect(isRejectedVariant({ url: "https://pbs.twimg.com/a.jpg", contentType: "image/jpeg" })).toMatch(
      /not a video/i,
    );
    expect(isRejectedVariant({ url: "https://x.com/page", contentType: "text/html" })).toMatch(
      /not a video/i,
    );
  });

  it("accepts a direct mp4", () => {
    expect(
      isRejectedVariant({ url: "https://video.twimg.com/vid/720x1280/a.mp4", contentType: "video/mp4" }),
    ).toBeNull();
  });

  it("rejects empty and malformed urls", () => {
    expect(isRejectedVariant({ url: "" })).toBe("missing url");
    expect(isRejectedVariant({ url: "not a url" })).toBe("malformed url");
  });
});

describe("resolutionFromUrl", () => {
  it("reads the rendition size from the CDN path", () => {
    expect(resolutionFromUrl("https://video.twimg.com/ext_tw_video/1/pu/vid/avc1/720x1280/a.mp4")).toEqual({
      width: 720,
      height: 1280,
    });
    expect(resolutionFromUrl("https://video.twimg.com/vid/320x568/b.mp4")).toEqual({
      width: 320,
      height: 568,
    });
    expect(resolutionFromUrl("https://video.twimg.com/vid/a.mp4")).toBeUndefined();
  });
});

describe("qualityLabel", () => {
  it("uses the short side, so portrait video is not mislabelled", () => {
    expect(qualityLabel(720, 1280)).toBe("720p");
    expect(qualityLabel(1280, 720)).toBe("720p");
    expect(qualityLabel(320, 568)).toBe("320p");
    expect(qualityLabel(undefined, 720)).toBeUndefined();
  });
});

describe("selectVideoVariants", () => {
  // Shape taken from a real public syndication response.
  const variants = [
    { url: "https://video.twimg.com/ext_tw_video/1/pu/pl/x.m3u8?tag=12", contentType: "application/x-mpegURL" },
    {
      url: "https://video.twimg.com/ext_tw_video/1/pu/vid/avc1/320x568/c.mp4?tag=12",
      contentType: "video/mp4",
      bitrate: 632000,
    },
    {
      url: "https://video.twimg.com/ext_tw_video/1/pu/vid/avc1/480x852/b.mp4?tag=12",
      contentType: "video/mp4",
      bitrate: 950000,
    },
    {
      url: "https://video.twimg.com/ext_tw_video/1/pu/vid/avc1/720x1280/a.mp4?tag=12",
      contentType: "video/mp4",
      bitrate: 2176000,
    },
  ];

  it("drops the manifest and orders renditions best first", () => {
    const selected = selectVideoVariants(variants);

    expect(selected).toHaveLength(3);
    expect(selected.every((variant) => variant.url.endsWith(".mp4?tag=12"))).toBe(true);
    expect(selected.map((variant) => variant.bitrate)).toEqual([2176000, 950000, 632000]);
    expect(selected.map((variant) => variant.quality)).toEqual(["720p", "480p", "320p"]);
  });

  it("attaches each rendition's own resolution", () => {
    const [best, mid, low] = selectVideoVariants(variants);
    expect(best).toMatchObject({ width: 720, height: 1280 });
    expect(mid).toMatchObject({ width: 480, height: 852 });
    expect(low).toMatchObject({ width: 320, height: 568 });
  });

  it("falls back to pixel count when no bitrate is published", () => {
    const selected = selectVideoVariants([
      { url: "https://v.pinimg.com/videos/mc/720p/a.mp4", width: 720, height: 1280 },
      { url: "https://v.pinimg.com/videos/mc/expressively/b.mp4", width: 1080, height: 1920 },
    ]);
    expect(selected[0]?.width).toBe(1080);
  });

  it("dedupes repeated urls", () => {
    const selected = selectVideoVariants([
      { url: "https://video.twimg.com/vid/720x1280/a.mp4", contentType: "video/mp4", bitrate: 100 },
      { url: "https://video.twimg.com/vid/720x1280/a.mp4", contentType: "video/mp4", bitrate: 100 },
    ]);
    expect(selected).toHaveLength(1);
  });

  it("returns nothing when only manifests are offered", () => {
    expect(
      selectVideoVariants([
        { url: "https://video.twimg.com/pl/a.m3u8", contentType: "application/x-mpegURL" },
      ]),
    ).toEqual([]);
  });
});
