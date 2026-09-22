import { describe, expect, it } from "vitest";
import {
  ariaSortFor,
  nextSortState,
  sortBreakdown,
  sortFailures,
  timestampOf,
  type SortableFailure,
} from "@/lib/admin/sorting";

/**
 * The dashboard sorts server-provided data in the browser, so these comparators
 * are the only thing standing between an operator and a misleading order.
 */

const breakdown = [
  { label: "youtube", count: 12 },
  { label: "Instagram", count: 40 },
  { label: "facebook", count: 12 },
  { label: "x", count: 3 },
];

describe("sortBreakdown", () => {
  it("orders by count, highest first", () => {
    expect(sortBreakdown(breakdown, "count", "desc").map((row) => row.count)).toEqual([40, 12, 12, 3]);
  });

  it("orders by count ascending", () => {
    expect(sortBreakdown(breakdown, "count", "asc").map((row) => row.count)).toEqual([3, 12, 12, 40]);
  });

  it("keeps equal counts in their original order", () => {
    const sorted = sortBreakdown(breakdown, "count", "desc").map((row) => row.label);
    expect(sorted.indexOf("youtube")).toBeLessThan(sorted.indexOf("facebook"));
  });

  it("orders labels case-insensitively", () => {
    expect(sortBreakdown(breakdown, "label", "asc").map((row) => row.label)).toEqual([
      "facebook",
      "Instagram",
      "x",
      "youtube",
    ]);
  });

  it("does not mutate the source array", () => {
    const original = [...breakdown];
    sortBreakdown(breakdown, "count", "asc");
    expect(breakdown).toEqual(original);
  });

  it("survives non-finite counts and empty input", () => {
    const messy = [
      { label: "a", count: Number.NaN },
      { label: "b", count: 5 },
    ];
    expect(sortBreakdown(messy, "count", "desc")[0].label).toBe("b");
    expect(sortBreakdown([], "count", "desc")).toEqual([]);
  });
});

const failures: SortableFailure[] = [
  { at: new Date("2026-09-20T10:00:00Z"), type: "download", platform: "youtube", quality: "1080p", errorCode: "TIMEOUT" },
  { at: "2026-09-21T09:00:00Z", type: "resolve", platform: null, quality: null, errorCode: "INVALID_URL" },
  { at: new Date("2026-09-19T08:00:00Z"), type: "download", platform: "instagram", quality: "720p", errorCode: null },
];

describe("sortFailures", () => {
  it("orders newest first and accepts serialized dates", () => {
    expect(sortFailures(failures, "at", "desc").map((row) => timestampOf(row.at))).toEqual([
      timestampOf("2026-09-21T09:00:00Z"),
      timestampOf("2026-09-20T10:00:00Z"),
      timestampOf("2026-09-19T08:00:00Z"),
    ]);
  });

  it("orders oldest first when ascending", () => {
    expect(sortFailures(failures, "at", "asc")[0].at).toEqual(new Date("2026-09-19T08:00:00Z"));
  });

  it("pushes missing values last in both directions", () => {
    expect(sortFailures(failures, "platform", "desc").at(-1)?.platform).toBeNull();
    expect(sortFailures(failures, "platform", "asc").at(-1)?.platform).toBeNull();
    expect(sortFailures(failures, "errorCode", "asc").at(-1)?.errorCode).toBeNull();
  });

  it("orders text columns alphabetically", () => {
    expect(sortFailures(failures, "platform", "asc").map((row) => row.platform)).toEqual([
      "instagram",
      "youtube",
      null,
    ]);
  });

  it("handles empty input", () => {
    expect(sortFailures([], "at", "desc")).toEqual([]);
  });
});

describe("timestampOf", () => {
  it("returns 0 for unusable values", () => {
    expect(timestampOf(null)).toBe(0);
    expect(timestampOf(undefined)).toBe(0);
    expect(timestampOf("not-a-date")).toBe(0);
  });
});

describe("sort state helpers", () => {
  it("starts a new column descending and toggles the active one", () => {
    expect(nextSortState({ key: "at", direction: "desc" }, "platform")).toEqual({
      key: "platform",
      direction: "desc",
    });
    expect(nextSortState({ key: "at", direction: "desc" }, "at")).toEqual({
      key: "at",
      direction: "asc",
    });
    expect(nextSortState({ key: "at", direction: "asc" }, "at")).toEqual({
      key: "at",
      direction: "desc",
    });
  });

  it("reports ARIA sort state only for the active column", () => {
    expect(ariaSortFor(true, "asc")).toBe("ascending");
    expect(ariaSortFor(true, "desc")).toBe("descending");
    expect(ariaSortFor(false, "desc")).toBe("none");
  });
});
