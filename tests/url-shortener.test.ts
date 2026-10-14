import { describe, it, expect, beforeEach } from "vitest";
import {
  validateTargetUrl,
  createShortUrl,
  getShortUrl,
  recordClick,
  isAliasAvailable,
} from "@/lib/shortener/store";

describe("URL Shortener - URL Validation & SSRF Protection", () => {
  it("prepends https:// when protocol is missing", () => {
    const res = validateTargetUrl("example.com/test");
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe("https://example.com/test");
  });

  it("accepts valid http and https urls", () => {
    expect(validateTargetUrl("https://github.com").valid).toBe(true);
    expect(validateTargetUrl("http://wikipedia.org/wiki/URL").valid).toBe(true);
  });

  it("rejects empty or whitespace strings", () => {
    expect(validateTargetUrl("").valid).toBe(false);
    expect(validateTargetUrl("   ").valid).toBe(false);
  });

  it("rejects non-http protocols like file: or javascript:", () => {
    expect(validateTargetUrl("javascript:alert(1)").valid).toBe(false);
    expect(validateTargetUrl("file:///etc/passwd").valid).toBe(false);
    expect(validateTargetUrl("ftp://ftp.example.com").valid).toBe(false);
  });

  it("blocks localhost, loopback, and private IPs (SSRF protection)", () => {
    expect(validateTargetUrl("http://localhost:3000").valid).toBe(false);
    expect(validateTargetUrl("http://127.0.0.1:8080").valid).toBe(false);
    expect(validateTargetUrl("http://0.0.0.0").valid).toBe(false);
    expect(validateTargetUrl("http://192.168.1.1").valid).toBe(false);
    expect(validateTargetUrl("http://10.0.0.5").valid).toBe(false);
    expect(validateTargetUrl("http://172.16.0.1").valid).toBe(false);
  });
});

describe("URL Shortener - Slug Creation & Custom Aliases", () => {
  it("creates a short URL with a random slug", async () => {
    const res = await createShortUrl({ targetUrl: "https://example.com/article/123" });
    expect(res.slug).toBeDefined();
    expect(res.slug.length).toBeGreaterThanOrEqual(6);
    expect(res.targetUrl).toBe("https://example.com/article/123");
    expect(res.clicks).toBe(0);

    const fetched = await getShortUrl(res.slug);
    expect(fetched).not.toBeNull();
    expect(fetched?.targetUrl).toBe("https://example.com/article/123");
  });

  it("supports valid custom aliases", async () => {
    const custom = `test-alias-${Date.now()}`;
    const res = await createShortUrl({
      targetUrl: "https://mediadocks.com",
      customAlias: custom,
    });
    expect(res.slug).toBe(custom);
    expect(res.customAlias).toBe(true);

    const fetched = await getShortUrl(custom);
    expect(fetched?.targetUrl).toBe("https://mediadocks.com/");
  });

  it("rejects reserved system keywords as custom aliases", async () => {
    await expect(
      createShortUrl({
        targetUrl: "https://example.com",
        customAlias: "api",
      })
    ).rejects.toThrow(/reserved/i);

    await expect(
      createShortUrl({
        targetUrl: "https://example.com",
        customAlias: "admin",
      })
    ).rejects.toThrow(/reserved/i);
  });

  it("rejects duplicate custom aliases", async () => {
    const unique = `duplicate-test-${Date.now()}`;
    await createShortUrl({ targetUrl: "https://example.com/first", customAlias: unique });

    await expect(
      createShortUrl({ targetUrl: "https://example.com/second", customAlias: unique })
    ).rejects.toThrow(/already taken/i);
  });

  it("increments clicks when recordClick is called", async () => {
    const res = await createShortUrl({ targetUrl: "https://example.com/track" });
    expect(res.clicks).toBe(0);

    await recordClick(res.slug);
    await recordClick(res.slug);

    const fetched = await getShortUrl(res.slug);
    expect(fetched?.clicks).toBe(2);
  });
});
