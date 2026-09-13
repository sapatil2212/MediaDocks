import { describe, expect, it } from "vitest";
import { isInputError } from "@/lib/admin/metrics";

/**
 * The delivery-rate split is the difference between a dashboard that reads "3%"
 * on a healthy server and one that reports something actionable, so the
 * classification is pinned here.
 */
describe("isInputError", () => {
  it("treats bad requests as the visitor's doing, not a fault", () => {
    for (const code of [
      "INVALID_URL",
      "INVALID_PLATFORM_URL",
      "UNSUPPORTED_PLATFORM",
      "RATE_LIMITED",
      "MEDIA_NOT_FOUND",
      "MEDIA_REFERENCE_EXPIRED",
      "FORMAT_NOT_AVAILABLE",
      "UNSAFE_URL",
    ]) {
      expect(isInputError(code), code).toBe(true);
    }
  });

  it("treats undelivered-but-valid requests as real failures", () => {
    for (const code of [
      "DOWNLOAD_FAILED",
      "MEDIA_NOT_AVAILABLE",
      "VIDEO_MEDIA_UNAVAILABLE",
      "PLATFORM_ACCESS_UNAVAILABLE",
      "REQUEST_TIMEOUT",
      "FILE_TOO_LARGE",
      "INTERNAL_ERROR",
      "NO_MEDIA",
    ]) {
      expect(isInputError(code), code).toBe(false);
    }
  });

  it("handles a missing code", () => {
    expect(isInputError(null)).toBe(false);
    expect(isInputError(undefined)).toBe(false);
    expect(isInputError("")).toBe(false);
  });

  it("reproduces the production figures that motivated the split", () => {
    // Observed live: 36 UNSUPPORTED_PLATFORM, 15 INVALID_URL, 3 RATE_LIMITED,
    // 3 MEDIA_NOT_FOUND, 1 MEDIA_NOT_AVAILABLE across 50 resolves + 10 downloads.
    const observed = [
      ["UNSUPPORTED_PLATFORM", 36],
      ["INVALID_URL", 15],
      ["RATE_LIMITED", 3],
      ["MEDIA_NOT_FOUND", 3],
      ["MEDIA_NOT_AVAILABLE", 1],
    ] as const;

    let inputErrors = 0;
    let deliveryFailures = 0;
    for (const [code, count] of observed) {
      if (isInputError(code)) inputErrors += count;
      else deliveryFailures += count;
    }

    expect(inputErrors).toBe(57);
    expect(deliveryFailures).toBe(1);

    // The old formula: (60 - 58) / 60 -> 3%, which implied the app was broken.
    const naive = Math.round(((60 - 58) / 60) * 100);
    expect(naive).toBe(3);

    // The corrected one only counts requests that could have succeeded.
    const serviceable = 50 + 10 - inputErrors;
    const corrected = Math.round(((serviceable - deliveryFailures) / serviceable) * 100);
    expect(serviceable).toBe(3);
    expect(corrected).toBe(67);
  });
});
