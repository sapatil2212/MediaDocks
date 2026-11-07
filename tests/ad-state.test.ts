import { afterEach, describe, expect, it, vi } from "vitest";
import { adStateCopy, adStateFrom, getAdState } from "@/src/lib/ads/ad-state";

afterEach(() => vi.unstubAllEnvs());

describe("adStateFrom", () => {
  it.each([
    [false, false, false, "off"],
    [false, true, true, "off"],
    [true, false, false, "off"],
    [true, false, true, "off"],
    [true, true, false, "enabled-no-cmp"],
    [true, true, true, "enabled-with-cmp"],
  ] as const)("enabled=%s slot=%s adapter=%s -> %s", (enabled, slot, adapter, expected) => {
    expect(adStateFrom(enabled, slot, adapter)).toBe(expected);
  });
});

describe("getAdState", () => {
  it("is off by default", () => {
    expect(getAdState()).toBe("off");
  });
  it("stays off with the flag on but no slot", () => {
    vi.stubEnv("NEXT_PUBLIC_ADS_ENABLED", "true");
    expect(getAdState()).toBe("off");
  });
  it("is enabled-no-cmp with flag and slot but no shipped adapter", () => {
    vi.stubEnv("NEXT_PUBLIC_ADS_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT", "1234567890");
    expect(getAdState()).toBe("enabled-no-cmp");
  });
});

describe("adStateCopy", () => {
  const off = adStateCopy("off");
  const noCmp = adStateCopy("enabled-no-cmp");
  const withCmp = adStateCopy("enabled-with-cmp");

  it("never claims another state's facts", () => {
    // The enabled-with-cmp copy must not say that no ads are requested.
    expect(`${withCmp.summary} ${withCmp.choices}`).not.toMatch(/does not request|no ads are requested|no consent tool/i);
    // The off copy must not describe a consent control or ads on guide pages.
    expect(`${off.summary} ${off.choices}`).not.toMatch(/Privacy choices|accept, decline|appear only on/i);
    // The no-CMP copy must not describe a working consent control.
    expect(`${noCmp.summary} ${noCmp.choices}`).not.toMatch(/Privacy choices|accept, decline/i);
  });

  it("each state has non-empty text", () => {
    for (const copy of [off, noCmp, withCmp]) {
      expect(copy.summary.length).toBeGreaterThan(20);
      expect(copy.choices.length).toBeGreaterThan(20);
    }
  });
});
