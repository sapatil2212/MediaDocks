import { describe, expect, it } from "vitest";
import {
  buildDownloadFilename,
  detectMediaType,
  extensionFromUrl,
  fromMimeType,
  fromUrlExtension,
  isNonMediaContentType,
  isSupportedMimeType,
  normalizeMimeType,
} from "@/lib/media/detect-media-type";

describe("normalizeMimeType", () => {
  it("strips parameters and lowercases", () => {
    expect(normalizeMimeType("Image/JPEG; charset=utf-8")).toBe("image/jpeg");
    expect(normalizeMimeType("video/mp4")).toBe("video/mp4");
    expect(normalizeMimeType(null)).toBeUndefined();
    expect(normalizeMimeType("")).toBeUndefined();
  });
});

describe("fromMimeType", () => {
  it("maps every supported image type", () => {
    expect(fromMimeType("image/jpeg")).toMatchObject({ kind: "image", extension: "jpg", label: "JPG" });
    expect(fromMimeType("image/png")).toMatchObject({ kind: "image", extension: "png", label: "PNG" });
    expect(fromMimeType("image/webp")).toMatchObject({ kind: "image", extension: "webp", label: "WEBP" });
    expect(fromMimeType("image/gif")).toMatchObject({ kind: "image", extension: "gif", label: "GIF" });
    expect(fromMimeType("image/avif")).toMatchObject({ kind: "image", extension: "avif", label: "AVIF" });
  });

  it("maps every supported video type", () => {
    expect(fromMimeType("video/mp4")).toMatchObject({ kind: "video", extension: "mp4", label: "MP4" });
    expect(fromMimeType("video/webm")).toMatchObject({ kind: "video", extension: "webm", label: "WEBM" });
    expect(fromMimeType("video/quicktime")).toMatchObject({ kind: "video", extension: "mov", label: "MOV" });
  });

  it("refuses unsupported and streaming-only types", () => {
    expect(fromMimeType("application/x-mpegURL")).toBeUndefined();
    expect(fromMimeType("application/vnd.apple.mpegurl")).toBeUndefined();
    expect(fromMimeType("application/octet-stream")).toBeUndefined();
    expect(fromMimeType("text/html")).toBeUndefined();
    expect(isSupportedMimeType("video/mp4")).toBe(true);
    expect(isSupportedMimeType("text/html")).toBe(false);
  });
});

describe("extension detection", () => {
  it("reads the extension from the path, not the query string", () => {
    expect(extensionFromUrl("https://pbs.twimg.com/media/abc.jpg")).toBe("jpg");
    expect(extensionFromUrl("https://cdn.example.com/a/b/clip.mp4?token=x.jpg")).toBe("mp4");
    expect(extensionFromUrl("https://i.pinimg.com/736x/a/b/c.png")).toBe("png");
  });

  it("returns nothing when the path has no usable extension", () => {
    // This is the X case that used to be assumed to be JPEG.
    expect(extensionFromUrl("https://pbs.twimg.com/media/FpfeTLWXwAEppTI?format=webp")).toBeUndefined();
    expect(extensionFromUrl("https://example.com/media/12345")).toBeUndefined();
    expect(fromUrlExtension("https://example.com/media/12345")).toBeUndefined();
  });

  it("maps known extensions to the right kind", () => {
    expect(fromUrlExtension("https://a/b.mp4")).toMatchObject({ kind: "video", mimeType: "video/mp4" });
    expect(fromUrlExtension("https://a/b.webp")).toMatchObject({ kind: "image", mimeType: "image/webp" });
    expect(fromUrlExtension("https://a/b.mov")).toMatchObject({ kind: "video", extension: "mov" });
  });
});

describe("detectMediaType priority", () => {
  it("prefers the explicit platform MIME type", () => {
    const info = detectMediaType({
      explicitMimeType: "video/mp4",
      contentType: "image/jpeg",
      mediaUrl: "https://a/b.png",
    });
    expect(info).toMatchObject({ kind: "video", extension: "mp4", source: "explicit-mime" });
  });

  it("falls back to the HTTP content type", () => {
    const info = detectMediaType({
      contentType: "image/webp",
      mediaUrl: "https://pbs.twimg.com/media/abc?format=webp",
    });
    expect(info).toMatchObject({ kind: "image", extension: "webp", source: "content-type" });
  });

  it("then falls back to the URL extension", () => {
    const info = detectMediaType({ mediaUrl: "https://video.twimg.com/vid/1280x720/a.mp4" });
    expect(info).toMatchObject({ kind: "video", extension: "mp4", source: "extension" });
  });

  it("uses the platform hint only as a last resort", () => {
    const info = detectMediaType({ platformHint: "video" });
    expect(info).toMatchObject({ kind: "video", extension: "mp4", source: "platform-hint" });
  });

  it("returns undefined instead of guessing JPEG", () => {
    expect(detectMediaType({})).toBeUndefined();
    expect(detectMediaType({ mediaUrl: "https://example.com/media/12345" })).toBeUndefined();
    expect(
      detectMediaType({ explicitMimeType: "application/x-mpegURL", mediaUrl: "https://a/b.m3u8" }),
    ).toBeUndefined();
  });
});

describe("isNonMediaContentType", () => {
  it("flags responses that are pages, not media", () => {
    expect(isNonMediaContentType("text/html; charset=utf-8")).toBe(true);
    expect(isNonMediaContentType("application/json")).toBe(true);
    expect(isNonMediaContentType("text/plain")).toBe(true);
    expect(isNonMediaContentType("image/jpeg")).toBe(false);
    expect(isNonMediaContentType("video/mp4")).toBe(false);
  });
});

describe("buildDownloadFilename", () => {
  it("preserves the real extension", () => {
    expect(buildDownloadFilename("instagram", "reel-video", "mp4")).toBe(
      "mediaflow-instagram-reel-video.mp4",
    );
    expect(buildDownloadFilename("pinterest", "pin-image", "png")).toBe(
      "mediaflow-pinterest-pin-image.png",
    );
    expect(buildDownloadFilename("x", "image", "webp")).toBe("mediaflow-x-image.webp");
  });

  it("sanitizes anything unsafe for a header", () => {
    const name = buildDownloadFilename('inst"agram', '../../etc/passwd";', "mp4/../sh");
    expect(name).toMatch(/^mediaflow-[a-z0-9-]+\.[a-z0-9]+$/);
    expect(name).not.toContain('"');
    expect(name).not.toContain("/");
    expect(name).not.toContain("..");
  });
});
