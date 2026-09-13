import { describe, expect, it } from "vitest";
import { detectPlatform, detectPlatformFromUrl, normalizeUrl } from "@/lib/platforms/detector";
import type { Platform } from "@/lib/platforms/types";

describe("detectPlatform", () => {
  const cases: Array<[string, Platform, string]> = [
    ["https://instagram.com/reel/example", "instagram", "reel"],
    ["https://www.instagram.com/p/example", "instagram", "post"],
    ["https://www.instagram.com/reels/example", "instagram", "reel"],
    ["https://www.instagram.com/tv/example", "instagram", "tv"],
    ["https://youtube.com/watch?v=dQw4w9WgXcQ", "youtube", "watch"],
    ["https://youtu.be/dQw4w9WgXcQ", "youtube", "video"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "youtube", "shorts"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "youtube", "embed"],
    ["https://pinterest.com/pin/example", "pinterest", "pin"],
    ["https://www.pinterest.co.uk/pin/12345", "pinterest", "pin"],
    ["https://pin.it/example", "pinterest", "pin"],
    ["https://facebook.com/watch/example", "facebook", "watch"],
    ["https://www.facebook.com/reel/12345", "facebook", "reel"],
    ["https://fb.watch/example", "facebook", "video"],
    ["https://x.com/user/status/123", "x", "status"],
    ["https://twitter.com/user/status/123", "x", "status"],
  ];

  it.each(cases)("detects %s", (url, platform, typeHint) => {
    const detection = detectPlatform(url);
    expect(detection.platform).toBe(platform);
    expect(detection.typeHint).toBe(typeHint);
    expect(detection.normalizedUrl).toBeTruthy();
  });

  it("accepts URLs without a protocol", () => {
    expect(detectPlatform("instagram.com/reel/example").platform).toBe("instagram");
    expect(detectPlatform("  www.x.com/user/status/1  ").platform).toBe("x");
  });

  it("returns null for unsupported domains", () => {
    for (const url of [
      "https://example.com/video/1",
      "https://vimeo.com/12345",
      "https://tiktok.com/@user/video/1",
      "https://not-instagram.com/reel/x",
    ]) {
      expect(detectPlatform(url).platform).toBeNull();
    }
  });

  it("returns null for empty or malformed input", () => {
    for (const url of ["", "   ", "http://", "https://", "::::", "not a url at all"]) {
      expect(detectPlatform(url).platform).toBeNull();
    }
  });

  it("returns null for non-HTTP schemes", () => {
    expect(detectPlatform("ftp://instagram.com/reel/x").platform).toBeNull();
    expect(detectPlatform("file:///etc/passwd").platform).toBeNull();
  });

  it("works directly on a parsed URL", () => {
    const detection = detectPlatformFromUrl(new URL("https://www.instagram.com/reel/abc"));
    expect(detection).toEqual({ platform: "instagram", typeHint: "reel" });
  });
});

describe("normalizeUrl", () => {
  it("adds https and lowercases the hostname", () => {
    expect(normalizeUrl("WWW.Instagram.COM/reel/AbC")).toBe("https://www.instagram.com/reel/AbC");
  });

  it("keeps path casing because shortcodes are case sensitive", () => {
    expect(normalizeUrl("https://instagram.com/p/AbC_dEf")).toContain("/p/AbC_dEf");
  });

  it("strips tracking parameters and fragments", () => {
    const normalized = normalizeUrl(
      "https://youtu.be/dQw4w9WgXcQ?si=abc123&utm_source=news&feature=share#top",
    );
    expect(normalized).toBe("https://youtu.be/dQw4w9WgXcQ");
  });

  it("keeps parameters that identify the content", () => {
    const normalized = normalizeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_medium=x");
    expect(normalized).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });

  it("removes a trailing slash", () => {
    expect(normalizeUrl("https://instagram.com/reel/abc/")).toBe("https://instagram.com/reel/abc");
  });

  it("throws on empty input", () => {
    expect(() => normalizeUrl("")).toThrow();
    expect(() => normalizeUrl("   ")).toThrow();
  });
});
