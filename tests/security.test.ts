import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertSafeUrl,
  hashUrl,
  isAllowedMediaHost,
  isPrivateAddress,
} from "@/lib/download/security";
import { resolveMedia } from "@/lib/resolver/resolver-service";

const OFFLINE = { skipDnsCheck: true } as const;

describe("isPrivateAddress", () => {
  it("flags loopback, private, link-local and reserved ranges", () => {
    for (const ip of [
      "127.0.0.1",
      "127.10.20.30",
      "0.0.0.0",
      "10.0.0.1",
      "10.255.255.255",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254",
      "100.64.0.1",
      "255.255.255.255",
      "224.0.0.1",
      "::1",
      "::",
      "fd00::1",
      "fc00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
    ]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
  });

  it("allows public addresses", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "172.15.0.1", "2606:4700::1111"]) {
      expect(isPrivateAddress(ip), ip).toBe(false);
    }
  });
});

describe("assertSafeUrl", () => {
  it("rejects non-HTTP schemes", async () => {
    await expect(assertSafeUrl("file:///etc/passwd", OFFLINE)).rejects.toThrow(/HTTP/i);
    await expect(assertSafeUrl("ftp://example.com/file", OFFLINE)).rejects.toThrow(/HTTP/i);
    await expect(assertSafeUrl("gopher://example.com", OFFLINE)).rejects.toThrow();
  });

  it("rejects localhost, loopback and private addresses", async () => {
    for (const url of [
      "http://localhost",
      "http://localhost:3000/x",
      "http://127.0.0.1:8000",
      "http://0.0.0.0",
      "http://10.0.0.1",
      "http://192.168.1.1/admin",
      "http://169.254.169.254/latest/meta-data",
      "http://[::1]:9000",
    ]) {
      await expect(assertSafeUrl(url, OFFLINE), url).rejects.toThrow();
    }
  });

  it("rejects internal hostnames", async () => {
    for (const url of [
      "http://intranet",
      "http://db.internal/x",
      "http://printer.local",
      "http://app.localhost",
    ]) {
      await expect(assertSafeUrl(url, OFFLINE), url).rejects.toThrow();
    }
  });

  it("enforces the media host allow-list when downloading", async () => {
    await expect(
      assertSafeUrl("https://evil.example.com/video.mp4", {
        ...OFFLINE,
        requireMediaHost: true,
      }),
    ).rejects.toThrow(/not allowed/i);

    await expect(
      assertSafeUrl("https://scontent-lhr8-1.cdninstagram.com/v/video.mp4", {
        ...OFFLINE,
        requireMediaHost: true,
      }),
    ).resolves.toBeInstanceOf(URL);
  });

  it("recognises platform CDNs", () => {
    expect(isAllowedMediaHost("video.twimg.com")).toBe(true);
    expect(isAllowedMediaHost("i.pinimg.com")).toBe(true);
    expect(isAllowedMediaHost("scontent.xx.fbcdn.net")).toBe(true);
    expect(isAllowedMediaHost("cdninstagram.com.evil.com")).toBe(false);
    expect(isAllowedMediaHost("example.com")).toBe(false);
  });
});

describe("unsafe URLs never reach a platform resolver", () => {
  afterEach(() => vi.restoreAllMocks());

  it("fails before any outbound request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    for (const url of [
      "http://localhost",
      "http://127.0.0.1",
      "http://192.168.1.1",
      "http://10.0.0.1",
      "file:///etc/passwd",
      "ftp://example.com",
      "https://example.com/video",
    ]) {
      await expect(resolveMedia(url), url).rejects.toThrow();
    }

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("helpers", () => {
  it("hashes URLs deterministically without keeping the original", () => {
    const hash = hashUrl("https://instagram.com/reel/abc");
    expect(hash).toHaveLength(64);
    expect(hash).toBe(hashUrl("  https://instagram.com/reel/abc  "));
    expect(hash).not.toContain("instagram");
  });

});
