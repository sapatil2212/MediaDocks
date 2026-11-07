import { afterEach, describe, expect, it, vi } from "vitest";
import { adsEnabled, getArticleSlotId, isValidSlotId } from "@/src/lib/ads/config";

afterEach(() => vi.unstubAllEnvs());

describe("isValidSlotId", () => {
  it.each([undefined, null, "", "abc", "12345", "1".repeat(21), "123 456 789", 1234567890, {}])(
    "rejects %j",
    (value) => {
      expect(isValidSlotId(value)).toBe(false);
    },
  );
  it.each(["123456", "1234567890", "1".repeat(20)])("accepts %s", (value) => {
    expect(isValidSlotId(value)).toBe(true);
  });
});

describe("adsEnabled", () => {
  it("is false when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_ADS_ENABLED", "");
    expect(adsEnabled()).toBe(false);
  });
  it.each(["TRUE", "True", "1", "yes", "on", "true ", " true"])("is false for %j", (value) => {
    vi.stubEnv("NEXT_PUBLIC_ADS_ENABLED", value);
    expect(adsEnabled()).toBe(false);
  });
  it("is true only for exactly true", () => {
    vi.stubEnv("NEXT_PUBLIC_ADS_ENABLED", "true");
    expect(adsEnabled()).toBe(true);
  });
});

describe("getArticleSlotId", () => {
  it("reads the environment at call time", () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT", "1234567");
    expect(getArticleSlotId()).toBe("1234567");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT", "7654321");
    expect(getArticleSlotId()).toBe("7654321");
  });
});
