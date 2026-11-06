import { describe, expect, it } from "vitest";
import {
  canonicalPinUrl,
  extractPinId,
  isPinterestHost,
  isPinterestShortHost,
} from "@/lib/platforms/pinterest-url";
import { PinterestResolver } from "@/lib/platforms/pinterest";
import { detectPlatform as detectClientPlatform } from "@/src/lib/platforms";

describe("isPinterestHost", () => {
  it.each([
    "www.pinterest.com",
    "pinterest.com",
    "in.pinterest.com",
    "uk.pinterest.com",
    "pinterest.co.uk",
    "www.pinterest.co.uk",
    "www.pinterest.com.au",
    "pinterest.de",
    "pinterest.se",
    "api.pinterest.com",
    "WWW.PINTEREST.COM",
  ])("accepts %s", (host) => {
    expect(isPinterestHost(host)).toBe(true);
  });

  it.each(["pinterest.evil.com", "notpinterest.com", "pinterest.com.evil.io", "pin.it", "evil.com"])(
    "rejects %s",
    (host) => {
      expect(isPinterestHost(host)).toBe(false);
    },
  );

  it("recognises the pin.it shortener separately", () => {
    expect(isPinterestShortHost("pin.it")).toBe(true);
    expect(isPinterestShortHost("pinterest.com")).toBe(false);
  });
});

describe("extractPinId", () => {
  it("reads numeric ids from every Pin path shape", () => {
    expect(extractPinId("/pin/311241024270560610/")).toBe("311241024270560610");
    expect(extractPinId("/pin/32580797303002442/sent/")).toBe("32580797303002442");
    expect(
      extractPinId("/pin/upcycled-denim-fox-dolls--311241024270560610/"),
    ).toBe("311241024270560610");
    expect(extractPinId("/pin/311241024270560610")).toBe("311241024270560610");
  });

  it("keeps opaque Pin tokens and rejects non-Pin paths", () => {
    expect(extractPinId("/pin/AVb3xYz_12/")).toBe("AVb3xYz_12");
    expect(extractPinId("/pinterest/official-news/")).toBeUndefined();
    expect(extractPinId("/")).toBeUndefined();
  });
});

describe("canonicalPinUrl", () => {
  it("drops share parameters, /sent/ and country domains", () => {
    expect(
      canonicalPinUrl(
        "https://www.pinterest.com/pin/32580797303002442/sent/?invite_code=x&sender=y&sfo=1",
      )?.toString(),
    ).toBe("https://www.pinterest.com/pin/32580797303002442/");
    expect(
      canonicalPinUrl(
        "https://in.pinterest.com/pin/1084663891475263837/?utm_source=share&invite_code=abc123#x",
      )?.toString(),
    ).toBe("https://www.pinterest.com/pin/1084663891475263837/");
    expect(canonicalPinUrl("https://www.pinterest.co.uk/pin/311241024270560610")?.toString()).toBe(
      "https://www.pinterest.com/pin/311241024270560610/",
    );
  });

  it("returns undefined for non-Pin or non-Pinterest URLs", () => {
    expect(canonicalPinUrl("https://www.pinterest.com/pinterest/official-news/")).toBeUndefined();
    expect(canonicalPinUrl("https://pinterest.evil.com/pin/123/")).toBeUndefined();
    expect(canonicalPinUrl("not a url")).toBeUndefined();
  });
});

describe("PinterestResolver.canonicalize", () => {
  const resolver = new PinterestResolver({ hlsCapable: async () => false });

  it("rewrites a regional link with params to the canonical Pin URL", () => {
    const url = resolver.canonicalize(
      new URL("https://in.pinterest.com/pin/1084663891475263837/?utm_source=share&invite_code=abc123"),
      { fromShortLink: false },
    );
    expect(url.toString()).toBe("https://www.pinterest.com/pin/1084663891475263837/");
  });

  it("rewrites the /sent/ page a pin.it link lands on", () => {
    const url = resolver.canonicalize(
      new URL("https://www.pinterest.com/pin/32580797303002442/sent/?invite_code=x&sender=y&sfo=1"),
      { fromShortLink: true },
    );
    expect(url.toString()).toBe("https://www.pinterest.com/pin/32580797303002442/");
  });

  it("reports a pin.it link that did not redirect as not found", () => {
    expect(() =>
      resolver.canonicalize(new URL("https://pin.it/abc"), { fromShortLink: true }),
    ).toThrow(expect.objectContaining({ code: "MEDIA_NOT_FOUND", message: expect.stringMatching(/pin\.it link/) }));
  });

  it("reports a pin.it link that redirected to the home page as not found", () => {
    expect(() =>
      resolver.canonicalize(new URL("https://www.pinterest.com/"), { fromShortLink: true }),
    ).toThrow(expect.objectContaining({ code: "MEDIA_NOT_FOUND" }));
  });

  it("rejects a board link as not a single Pin", () => {
    expect(() =>
      resolver.canonicalize(new URL("https://www.pinterest.com/pinterest/official-news/"), {
        fromShortLink: false,
      }),
    ).toThrow(
      expect.objectContaining({ code: "INVALID_PLATFORM_URL", message: expect.stringMatching(/single Pin/) }),
    );
  });
});

describe("browser-side platform detection", () => {
  it.each([
    "https://www.pinterest.co.uk/pin/311241024270560610/",
    "https://pinterest.com.au/pin/311241024270560610/",
    "https://in.pinterest.com/pin/1084663891475263837/",
    "https://pinterest.de/pin/1/",
    "https://pin.it/6LbkInhRx",
  ])("treats %s as Pinterest", (url) => {
    expect(detectClientPlatform(url).platform?.id).toBe("pinterest");
  });

  it("does not treat look-alike hosts as Pinterest", () => {
    expect(detectClientPlatform("https://pinterest.evil.com/pin/1/").platform).toBeNull();
  });
});
