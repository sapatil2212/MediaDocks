import { describe, expect, it } from "vitest";
import {
  assertValidMediaUrl,
  downloadRequestSchema,
  resolveRequestSchema,
  validateMediaUrl,
} from "@/lib/validation/url";

describe("validateMediaUrl", () => {
  it("accepts supported platform URLs", () => {
    const result = validateMediaUrl("https://www.instagram.com/reel/abc123/");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.platform).toBe("instagram");
      expect(result.typeHint).toBe("reel");
      expect(result.normalizedUrl).toBe("https://www.instagram.com/reel/abc123");
      expect(result.url).toBeInstanceOf(URL);
    }
  });

  it("rejects non-string input", () => {
    for (const input of [undefined, null, 42, {}, []]) {
      const result = validateMediaUrl(input);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("INVALID_URL");
    }
  });

  it("rejects empty input", () => {
    expect(validateMediaUrl("").ok).toBe(false);
    expect(validateMediaUrl("     ").ok).toBe(false);
  });

  it("enforces a configurable maximum length", () => {
    const long = `https://instagram.com/reel/${"a".repeat(300)}`;
    expect(validateMediaUrl(long, 100).ok).toBe(false);
    expect(validateMediaUrl(long, 4096).ok).toBe(true);
  });

  it("rejects malformed URLs", () => {
    for (const input of ["http://", "https://", "h ttp://instagram.com", "://instagram.com"]) {
      expect(validateMediaUrl(input).ok).toBe(false);
    }
  });

  it("rejects unsupported protocols", () => {
    for (const input of ["file:///etc/passwd", "ftp://example.com/x", "javascript:alert(1)"]) {
      const result = validateMediaUrl(input);
      expect(result.ok).toBe(false);
    }
  });

  it("rejects hostnames that are not a supported platform", () => {
    const result = validateMediaUrl("https://example.com/video/1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("UNSUPPORTED_PLATFORM");
  });

  it("rejects localhost and private hosts before any request", () => {
    for (const input of ["http://localhost", "http://127.0.0.1", "http://192.168.1.1", "http://10.0.0.1"]) {
      const result = validateMediaUrl(input);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(["INVALID_URL", "UNSUPPORTED_PLATFORM"]).toContain(result.code);
    }
  });

  it("assertValidMediaUrl throws a typed error", () => {
    expect(() => assertValidMediaUrl("https://example.com")).toThrowError(
      /don't support this platform/i,
    );
    expect(() => assertValidMediaUrl("https://x.com/user/status/1")).not.toThrow();
  });
});

describe("request schemas", () => {
  it("requires a url on resolve", () => {
    expect(resolveRequestSchema.safeParse({}).success).toBe(false);
    expect(resolveRequestSchema.safeParse({ url: "https://x.com/a/status/1" }).success).toBe(true);
  });

  it("requires both references on download", () => {
    expect(downloadRequestSchema.safeParse({ mediaId: "abc" }).success).toBe(false);
    expect(downloadRequestSchema.safeParse({ mediaId: "", itemId: "f" }).success).toBe(false);
    expect(downloadRequestSchema.safeParse({ mediaId: "abc", itemId: "item-1" }).success).toBe(true);
  });
});
