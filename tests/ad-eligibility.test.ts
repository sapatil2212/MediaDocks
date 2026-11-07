import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  classifyPath,
  decideAds,
  decideCmp,
  isAllowlistedGuide,
  needsSyncTeardown,
  nextAction,
  type ConsentState,
  type RuntimeState,
} from "@/src/lib/ads/eligibility";
import { ALLOWLISTED_GUIDE_SLUGS } from "@/src/lib/ads/allowlist-data";

const SLOT = "1234567890";
const GUIDE = `/guides/${ALLOWLISTED_GUIDE_SLUGS[0]}`;
const NON_ALLOWLISTED_GUIDE = "/guides/understanding-video-codecs-h264-hevc-vp9-av1";

function enable(): void {
  vi.stubEnv("NEXT_PUBLIC_ADS_ENABLED", "true");
  vi.stubEnv("NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT", SLOT);
}

beforeEach(() => {
  vi.unstubAllEnvs();
});
afterEach(() => {
  vi.unstubAllEnvs();
});

function ads(pathname: unknown, ...rest: unknown[]) {
  const consent = rest.length > 0 ? rest[0] : "granted";
  const denyMarkerPresent = rest.length > 1 ? rest[1] : false;
  return decideAds({ pathname, consent: consent as ConsentState, denyMarkerPresent: denyMarkerPresent as boolean });
}

describe("classifyPath", () => {
  const table: Array<[string, string]> = [
    ["/", "home"],
    ["/yt-downloader", "downloader"],
    ["/insta-downloader", "downloader"],
    ["/fb-downloader", "downloader"],
    ["/x-downloader", "downloader"],
    ["/pinterest-downloader", "downloader"],
    ["/youtube-to-mp3", "downloader"],
    ["/downloader", "downloader"],
    ["/image-converter", "converter-tool"],
    ["/background-remover", "converter-tool"],
    ["/video-to-audio", "converter-tool"],
    ["/video-to-text", "ai-tool"],
    ["/add-subtitles-to-video", "ai-tool"],
    ["/url-shortener", "shortener"],
    ["/s/abc", "shortener"],
    ["/guides", "guide-index"],
    [GUIDE, "guide-article"],
    ["/about", "editorial"],
    ["/faq", "editorial"],
    ["/how-it-works", "editorial"],
    ["/privacy", "legal"],
    ["/terms", "legal"],
    ["/copyright", "legal"],
    ["/api/resolve", "api"],
    ["/superadmin", "admin"],
    ["/superadmin/login", "admin"],
    ["/dev/resolver-test", "dev"],
    ["/dmca", "redirect"],
    ["/youtube-downloader", "redirect"],
    ["/guides/nope", "unknown"],
    ["/new-tool-xyz", "unknown"],
  ];
  it.each(table)("%s is %s", (path, category) => {
    expect(classifyPath(path).category).toBe(category);
  });

  it("strips query, hash and one trailing slash", () => {
    expect(classifyPath(`${GUIDE}/?a=1#x`).category).toBe("guide-article");
    expect(classifyPath("/privacy/").category).toBe("legal");
  });

  const garbage: unknown[] = [
    undefined,
    null,
    42,
    {},
    "",
    "guides/x",
    "//evil.example/guides/x",
    "/guides/../api",
    "/guides\\x",
    "/guides/a%20b",
    "/%2e%2e/api",
    "/%2E",
    "/x".repeat(150),
    "/guides/\u0000",
    "/guides/\u00e9",
  ];
  it.each(garbage.map((g) => [String(g).slice(0, 20), g] as const))("rejects %s as unknown", (_label, input) => {
    expect(classifyPath(input).category).toBe("unknown");
    expect(classifyPath(input).cmpAllowed).toBe(false);
  });

  it("is case sensitive", () => {
    expect(classifyPath(`/Guides/${ALLOWLISTED_GUIDE_SLUGS[0]}`).category).toBe("unknown");
    expect(classifyPath(GUIDE.toUpperCase()).category).toBe("unknown");
  });

  it("allows the consent tool only on guide articles", () => {
    expect(classifyPath(GUIDE).cmpAllowed).toBe(true);
    expect(classifyPath("/privacy").cmpAllowed).toBe(false);
    expect(classifyPath("/").cmpAllowed).toBe(false);
  });
});

describe("decideAds", () => {
  it("is off by default, even on an allowlisted guide with consent", () => {
    expect(ads(GUIDE).eligible).toBe(false);
  });

  it.each(["", "TRUE", "1", "yes", "True", " true"])("stays off for NEXT_PUBLIC_ADS_ENABLED=%j", (value) => {
    vi.stubEnv("NEXT_PUBLIC_ADS_ENABLED", value);
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT", SLOT);
    expect(ads(GUIDE).eligible).toBe(false);
  });

  it("allows only an allowlisted guide with consent, no marker and a valid slot", () => {
    enable();
    expect(ads(GUIDE, "granted").eligible).toBe(true);
    expect(ads(GUIDE, "not-required").eligible).toBe(true);
  });

  it.each(["unknown", "denied", "maybe", undefined, null, 1] as unknown[])("denies consent=%s", (consent) => {
    enable();
    expect(ads(GUIDE, consent as ConsentState).eligible).toBe(false);
  });

  it.each([true, undefined, null, "false", 0, "", {}] as unknown[])("denies deny marker value %j", (marker) => {
    enable();
    expect(ads(GUIDE, "granted", marker).eligible).toBe(false);
  });

  it("denies a missing or malformed slot", () => {
    vi.stubEnv("NEXT_PUBLIC_ADS_ENABLED", "true");
    for (const slot of [undefined, "", "abc", "12345", "1".repeat(21)]) {
      if (slot === undefined) vi.stubEnv("NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT", "");
      else vi.stubEnv("NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT", slot);
      expect(ads(GUIDE).eligible).toBe(false);
      expect(decideCmp({ pathname: GUIDE, denyMarkerPresent: false }).load).toBe(false);
    }
  });

  const ineligible = [
    "/",
    "/guides",
    NON_ALLOWLISTED_GUIDE,
    "/guides/nope",
    "/yt-downloader",
    "/youtube-to-mp3",
    "/image-converter",
    "/background-remover",
    "/video-to-text",
    "/url-shortener",
    "/s/abc",
    "/api/resolve",
    "/superadmin",
    "/dev/resolver-test",
    "/privacy",
    "/terms",
    "/copyright",
    "/contact",
    "/about",
    "/faq",
    "/how-it-works",
    "/dmca",
    "/not-a-page",
    "",
    "/guides/../api",
    undefined,
    null,
  ];
  it.each(ineligible.map((p) => [String(p), p] as const))("never eligible: %s", (_label, path) => {
    enable();
    expect(ads(path, "granted").eligible).toBe(false);
    expect(ads(path, "not-required").eligible).toBe(false);
  });

  it("fails closed when the allowlist accessor throws", async () => {
    enable();
    vi.resetModules();
    vi.doMock("@/src/lib/ads/allowlist-data", async (orig) => {
      const actual = await orig<typeof import("@/src/lib/ads/allowlist-data")>();
      return {
        ...actual,
        getAllowlistedGuideSlugs: () => {
          throw new Error("boom");
        },
      };
    });
    const mod = await import("@/src/lib/ads/eligibility");
    expect(mod.decideAds({ pathname: GUIDE, consent: "granted", denyMarkerPresent: false }).eligible).toBe(false);
    expect(mod.decideCmp({ pathname: GUIDE, denyMarkerPresent: false }).load).toBe(false);
    expect(mod.isAllowlistedGuide(GUIDE)).toBe(false);
    vi.doUnmock("@/src/lib/ads/allowlist-data");
    vi.resetModules();
  });

  it("no input makes an ad eligible while consent is unknown", () => {
    enable();
    for (const path of [GUIDE, ...ineligible]) {
      expect(ads(path as string, "unknown").eligible).toBe(false);
    }
  });
});

describe("decideCmp", () => {
  it("loads only on an allowlisted guide, flag on, valid slot, marker false", () => {
    enable();
    expect(decideCmp({ pathname: GUIDE, denyMarkerPresent: false }).load).toBe(true);
  });

  it("does not load when the flag is off", () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT", SLOT);
    expect(decideCmp({ pathname: GUIDE, denyMarkerPresent: false }).load).toBe(false);
  });

  it.each([true, undefined, null, "false"] as unknown[])("does not load for marker %j", (marker) => {
    enable();
    expect(decideCmp({ pathname: GUIDE, denyMarkerPresent: marker as boolean }).load).toBe(false);
  });

  it.each(["/", "/privacy", "/guides", NON_ALLOWLISTED_GUIDE, "/yt-downloader", "/image-converter", undefined, 7])(
    "does not load on %s",
    (path) => {
      enable();
      expect(decideCmp({ pathname: path, denyMarkerPresent: false }).load).toBe(false);
    },
  );
});

describe("nextAction", () => {
  function state(over: Partial<RuntimeState>): RuntimeState {
    return {
      pathname: GUIDE,
      consent: "unknown",
      denyMarkerPresent: false,
      cmpInstalled: false,
      adScriptLoaded: false,
      ...over,
    };
  }

  beforeEach(() => enable());

  it("installs the consent tool first, then loads the script after consent is reported", () => {
    expect(nextAction(state({}))).toBe("install-cmp");
    expect(nextAction(state({ cmpInstalled: true }))).toBe("none");
    expect(nextAction(state({ cmpInstalled: true, consent: "granted" }))).toBe("load-ad-script");
    expect(nextAction(state({ cmpInstalled: true, consent: "granted", adScriptLoaded: true }))).toBe("none");
  });

  it("never loads the script while consent is unknown, denied or invalid", () => {
    for (const consent of ["unknown", "denied", "x", undefined, null] as unknown[]) {
      for (const cmpInstalled of [true, false]) {
        expect(nextAction(state({ consent: consent as ConsentState, cmpInstalled }))).not.toBe("load-ad-script");
      }
    }
  });

  it("does not reload a returning visitor who declined", () => {
    expect(nextAction(state({ cmpInstalled: true, consent: "denied" }))).toBe("none");
  });

  it("tears down when consent is denied after the script ran", () => {
    expect(nextAction(state({ adScriptLoaded: true, cmpInstalled: true, consent: "denied" }))).toBe("teardown");
  });

  it("tears down on leaving the allowlist, regardless of the marker", () => {
    for (const marker of [false, true]) {
      for (const pathname of ["/image-converter", "/", NON_ALLOWLISTED_GUIDE, null, "garbage"]) {
        const a = nextAction(
          state({ pathname, consent: "granted", adScriptLoaded: true, cmpInstalled: true, denyMarkerPresent: marker }),
        );
        expect(a).toBe("teardown");
      }
    }
    expect(nextAction(state({ pathname: "/image-converter", cmpInstalled: true }))).toBe("teardown");
  });

  it("uses the guarded teardown only for a marker on an allowlisted guide", () => {
    for (const marker of [true, undefined, null, "false"] as unknown[]) {
      expect(
        nextAction(state({ consent: "granted", adScriptLoaded: true, denyMarkerPresent: marker as boolean })),
      ).toBe("teardown-guarded");
      expect(nextAction(state({ cmpInstalled: true, denyMarkerPresent: marker as boolean }))).toBe(
        "teardown-guarded",
      );
    }
    expect(nextAction(state({ consent: "granted", adScriptLoaded: true }))).toBe("none");
  });

  it("does nothing when nothing is loaded and the page is ineligible", () => {
    for (const pathname of ["/image-converter", "/", null, "garbage", NON_ALLOWLISTED_GUIDE]) {
      expect(nextAction(state({ pathname }))).toBe("none");
    }
    expect(nextAction(state({ denyMarkerPresent: true }))).toBe("none");
    vi.unstubAllEnvs();
    expect(nextAction(state({}))).toBe("none");
  });

  it("never installs or loads without a valid slot, and tears down what is loaded", () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT", "bad");
    expect(nextAction(state({ consent: "granted" }))).toBe("none");
    expect(nextAction(state({ consent: "granted", adScriptLoaded: true }))).toBe("teardown");
    expect(nextAction(state({ cmpInstalled: true }))).toBe("teardown");
  });

  it("is safe when the allowlist accessor throws", async () => {
    vi.resetModules();
    vi.doMock("@/src/lib/ads/allowlist-data", async (orig) => {
      const actual = await orig<typeof import("@/src/lib/ads/allowlist-data")>();
      return {
        ...actual,
        getAllowlistedGuideSlugs: () => {
          throw new Error("boom");
        },
      };
    });
    const mod = await import("@/src/lib/ads/eligibility");
    expect(mod.nextAction(state({}))).toBe("none");
    expect(mod.nextAction(state({ adScriptLoaded: true }))).toBe("teardown");
    vi.doUnmock("@/src/lib/ads/allowlist-data");
    vi.resetModules();
  });
});

describe("needsSyncTeardown", () => {
  const base: RuntimeState = {
    pathname: GUIDE,
    consent: "granted",
    denyMarkerPresent: false,
    cmpInstalled: false,
    adScriptLoaded: false,
  };
  it("is true only when something is loaded and the page left the allowlist", () => {
    expect(needsSyncTeardown({ ...base, adScriptLoaded: true, pathname: "/image-converter" })).toBe(true);
    expect(needsSyncTeardown({ ...base, cmpInstalled: true, pathname: "/" })).toBe(true);
    expect(needsSyncTeardown({ ...base, adScriptLoaded: true })).toBe(false);
    expect(needsSyncTeardown({ ...base, pathname: "/image-converter" })).toBe(false);
  });
});
