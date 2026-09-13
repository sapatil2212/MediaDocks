import { describe, expect, it } from "vitest";
import { deviceFrom, referrerHostFrom, visitorHashFrom } from "@/lib/analytics/track";

/**
 * The privacy properties of the visitor digest are the reason the product can
 * still claim it does not track people, so they are asserted rather than assumed.
 */

const UA_DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
const UA_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
const UA_IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";

describe("visitorHashFrom", () => {
  it("never contains the IP address it was derived from", () => {
    const ip = "198.51.100.77";
    const hash = visitorHashFrom(ip, UA_DESKTOP);
    expect(hash).not.toContain(ip);
    expect(hash).not.toContain("198");
    expect(hash).toMatch(/^[0-9a-f]{32}$/);
  });

  it("is stable for the same visitor within a day", () => {
    const day = new Date("2026-05-01T09:00:00Z");
    const later = new Date("2026-05-01T23:59:00Z");
    expect(visitorHashFrom("198.51.100.1", UA_DESKTOP, day)).toBe(
      visitorHashFrom("198.51.100.1", UA_DESKTOP, later),
    );
  });

  it("rotates across days, so no cross-day profile can be built", () => {
    expect(visitorHashFrom("198.51.100.1", UA_DESKTOP, new Date("2026-05-01T12:00:00Z"))).not.toBe(
      visitorHashFrom("198.51.100.1", UA_DESKTOP, new Date("2026-05-02T12:00:00Z")),
    );
  });

  it("separates two people sharing one address", () => {
    const day = new Date("2026-05-01T12:00:00Z");
    expect(visitorHashFrom("198.51.100.1", UA_DESKTOP, day)).not.toBe(
      visitorHashFrom("198.51.100.1", UA_IPHONE, day),
    );
  });

  it("separates different addresses", () => {
    const day = new Date("2026-05-01T12:00:00Z");
    expect(visitorHashFrom("198.51.100.1", UA_DESKTOP, day)).not.toBe(
      visitorHashFrom("198.51.100.2", UA_DESKTOP, day),
    );
  });
});

describe("deviceFrom", () => {
  it("buckets the common cases", () => {
    expect(deviceFrom(UA_DESKTOP)).toBe("desktop");
    expect(deviceFrom(UA_IPHONE)).toBe("mobile");
    expect(deviceFrom(UA_IPAD)).toBe("tablet");
  });

  it("identifies crawlers so they can be excluded from visitor counts", () => {
    expect(deviceFrom("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(
      "bot",
    );
    expect(deviceFrom("curl/8.4.0")).toBe("bot");
    expect(deviceFrom("python-requests/2.31.0")).toBe("bot");
  });

  it("falls back to desktop for an empty agent", () => {
    expect(deviceFrom("")).toBe("desktop");
  });
});

describe("referrerHostFrom", () => {
  it("keeps only the host, never the path or query", () => {
    expect(referrerHostFrom("https://www.google.com/search?q=secret+query", "mediaflow.app")).toBe(
      "google.com",
    );
  });

  it("ignores internal navigation", () => {
    expect(referrerHostFrom("https://mediaflow.app/yt-downloader", "mediaflow.app")).toBeNull();
    expect(referrerHostFrom("https://www.mediaflow.app/faq", "mediaflow.app")).toBeNull();
  });

  it("handles a missing or malformed referrer", () => {
    expect(referrerHostFrom(null, "mediaflow.app")).toBeNull();
    expect(referrerHostFrom("not a url", "mediaflow.app")).toBeNull();
  });
});
