import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import JSZip from "jszip";
import {
  MAX_FILES,
  MAX_FILE_BYTES,
  validateImageFile,
  planBatchAddition,
  rejectionMessage,
  overflowMessage,
  outputNameFor,
  dedupeFileNames,
  fitWithinPixelBudget,
  formatBytes,
} from "@/src/lib/background-remover/rules";
import { toModelInput, maskToUint8, maskToRgba } from "@/src/lib/background-remover/tensor";
import { buildResultsZip, zipArchiveName } from "@/src/lib/background-remover/zip";
import { MODEL, ORT_VERSION, ORT_WASM_BASE } from "@/src/lib/background-remover/protocol";

const file = (name: string, type: string, size = 1000) => ({ name, type, size });

describe("validateImageFile", () => {
  it("accepts JPEG, PNG and WebP by MIME type", () => {
    expect(validateImageFile(file("a.jpg", "image/jpeg"))).toEqual({ ok: true });
    expect(validateImageFile(file("a.png", "image/png"))).toEqual({ ok: true });
    expect(validateImageFile(file("a.webp", "image/webp"))).toEqual({ ok: true });
  });

  it("falls back to the extension when the MIME type is empty", () => {
    expect(validateImageFile(file("SCAN.JPG", ""))).toEqual({ ok: true });
    expect(validateImageFile(file("photo.webp", ""))).toEqual({ ok: true });
    expect(validateImageFile(file("notes.txt", ""))).toEqual({ ok: false, reason: "unsupported-type" });
  });

  it("rejects unsupported types", () => {
    for (const [name, type] of [
      ["a.gif", "image/gif"],
      ["a.svg", "image/svg+xml"],
      ["a.pdf", "application/pdf"],
      ["a.heic", "image/heic"],
    ]) {
      expect(validateImageFile(file(name, type))).toEqual({ ok: false, reason: "unsupported-type" });
    }
  });

  it("enforces the empty and 15 MB limits", () => {
    expect(validateImageFile(file("a.png", "image/png", 0))).toEqual({ ok: false, reason: "empty" });
    expect(validateImageFile(file("a.png", "image/png", MAX_FILE_BYTES + 1))).toEqual({
      ok: false,
      reason: "too-large",
    });
    expect(validateImageFile(file("a.png", "image/png", 15 * 1024 * 1024))).toEqual({ ok: true });
  });
});

describe("planBatchAddition", () => {
  it("fills the remaining slots and overflows the rest", () => {
    const incoming = Array.from({ length: 8 }, (_, i) => file(`p${i}.png`, "image/png"));
    const plan = planBatchAddition(20, incoming);
    expect(plan.accepted.map((f) => f.name)).toEqual(["p0.png", "p1.png", "p2.png", "p3.png", "p4.png"]);
    expect(plan.overflow.map((f) => f.name)).toEqual(["p5.png", "p6.png", "p7.png"]);
    expect(plan.rejected).toEqual([]);
  });

  it("rejects invalid files without consuming slots and preserves order", () => {
    const incoming = [
      file("a.gif", "image/gif"),
      file("b.png", "image/png"),
      file("c.png", "image/png", 0),
      file("d.jpg", "image/jpeg"),
      file("e.webp", "image/webp", MAX_FILE_BYTES + 1),
      file("f.webp", "image/webp"),
    ];
    const plan = planBatchAddition(MAX_FILES - 2, incoming);
    expect(plan.accepted.map((f) => f.name)).toEqual(["b.png", "d.jpg"]);
    expect(plan.overflow.map((f) => f.name)).toEqual(["f.webp"]);
    expect(plan.rejected.map((r) => [r.file.name, r.reason])).toEqual([
      ["a.gif", "unsupported-type"],
      ["c.png", "empty"],
      ["e.webp", "too-large"],
    ]);
  });

  it("accepts nothing when the batch is full", () => {
    const plan = planBatchAddition(25, [file("a.png", "image/png")]);
    expect(plan.accepted).toEqual([]);
    expect(plan.overflow).toHaveLength(1);
  });
});

describe("messages", () => {
  it("explains each rejection reason", () => {
    expect(rejectionMessage("unsupported-type")).toBe("Only JPG, PNG and WebP images are supported.");
    expect(rejectionMessage("too-large")).toBe("Each image must be 15 MB or smaller.");
    expect(rejectionMessage("empty")).toBe("This file is empty.");
  });

  it("explains overflow", () => {
    expect(overflowMessage(3)).toBe("Bulk mode holds up to 25 images — 3 were not added.");
    expect(overflowMessage(1)).toBe("Bulk mode holds up to 25 images — 1 was not added.");
  });

  it("formats byte sizes like the sibling tools", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});

describe("outputNameFor", () => {
  it("derives the output name from the original", () => {
    expect(outputNameFor("photo.jpg")).toBe("photo-no-bg.png");
    expect(outputNameFor("my.holiday.pic.webp")).toBe("my.holiday.pic-no-bg.png");
    expect(outputNameFor("scan")).toBe("scan-no-bg.png");
    expect(outputNameFor("C:\\Users\\x\\pic.png")).toBe("pic-no-bg.png");
    expect(outputNameFor("folder/sub/pic.png")).toBe("pic-no-bg.png");
  });

  it("sanitises reserved and control characters", () => {
    expect(outputNameFor("a:b*c?.png")).toBe("a-b-c--no-bg.png");
    expect(outputNameFor('x<y>"z|.jpg')).toBe("x-y--z--no-bg.png");
    expect(outputNameFor("tab\u0001name.png")).toBe("tab-name-no-bg.png");
    expect(outputNameFor("  lots   of   space .png")).toBe("lots of space-no-bg.png");
  });

  it("falls back to `image` and caps long names", () => {
    expect(outputNameFor(".png")).toBe("image-no-bg.png");
    expect(outputNameFor("")).toBe("image-no-bg.png");
    expect(outputNameFor("...")).toBe("image-no-bg.png");
    const long = outputNameFor(`${"a".repeat(300)}.jpg`);
    expect(long.replace(/-no-bg\.png$/, "").length).toBeLessThanOrEqual(100);
    expect(long.endsWith("-no-bg.png")).toBe(true);
  });
});

describe("dedupeFileNames", () => {
  it("numbers case-insensitive duplicates", () => {
    expect(dedupeFileNames(["a-no-bg.png", "a-no-bg.png", "A-NO-BG.png"])).toEqual([
      "a-no-bg.png",
      "a-no-bg-2.png",
      "A-NO-BG-3.png",
    ]);
  });

  it("never collides with a literal name in the list", () => {
    expect(dedupeFileNames(["x.png", "x-2.png", "x.png"])).toEqual(["x.png", "x-2.png", "x-3.png"]);
    expect(dedupeFileNames(["x.png", "x.png", "x-2.png"])).toEqual(["x.png", "x-3.png", "x-2.png"]);
  });

  it("returns unique input unchanged", () => {
    const names = ["a.png", "b.png", "c.png"];
    expect(dedupeFileNames(names)).toEqual(names);
  });
});

describe("fitWithinPixelBudget", () => {
  it("leaves images within the budget unchanged", () => {
    expect(fitWithinPixelBudget(4000, 3000)).toEqual({ width: 4000, height: 3000, resized: false });
  });

  it("proportionally downscales larger images", () => {
    const r = fitWithinPixelBudget(6000, 4000);
    expect(r.resized).toBe(true);
    expect(Number.isInteger(r.width) && Number.isInteger(r.height)).toBe(true);
    expect(r.width * r.height).toBeLessThanOrEqual(16_000_000);
    expect(Math.abs(r.width / r.height - 1.5) / 1.5).toBeLessThan(0.005);
  });

  it("keeps extreme aspect ratios at least 1px wide and within budget", () => {
    const r = fitWithinPixelBudget(1, 100_000_000);
    expect(r.width).toBeGreaterThanOrEqual(1);
    expect(r.width * r.height).toBeLessThanOrEqual(16_000_000);
  });
});

describe("tensor helpers", () => {
  it("converts RGBA to CHW float planes", () => {
    const out = toModelInput(new Uint8ClampedArray([255, 0, 0, 7, 0, 128, 255, 9]), 2, 1);
    const expected = [1, 0, 0, 128 / 255, 0, 1];
    expect(out).toHaveLength(6);
    expected.forEach((v, i) => expect(out[i]).toBeCloseTo(v, 6));
  });

  it("throws on a size mismatch", () => {
    expect(() => toModelInput(new Uint8Array(7), 2, 1)).toThrow();
  });

  it("maps probabilities directly to bytes", () => {
    expect(Array.from(maskToUint8([0, 0.5, 1]))).toEqual([0, 128, 255]);
  });

  it("applies a sigmoid to logits", () => {
    expect(Array.from(maskToUint8([-10, 0, 10]))).toEqual([0, 128, 255]);
  });

  it("does not treat tiny overshoots as logits", () => {
    expect(Array.from(maskToUint8([0, 1.000001]))).toEqual([0, 255]);
  });

  it("places the mask in the alpha channel", () => {
    expect(Array.from(maskToRgba(new Uint8ClampedArray([10, 200])))).toEqual([0, 0, 0, 10, 0, 0, 0, 200]);
  });
});

describe("buildResultsZip", () => {
  it("packages every entry byte-for-byte", async () => {
    const names = dedupeFileNames(["photo-no-bg.png", "photo-no-bg.png", "cat-no-bg.png"]);
    const entries = names.map((name, i) => ({
      name,
      data: new Uint8Array([i, 1, 2, 3, 255 - i]),
    }));
    const bytes = await buildResultsZip(entries);
    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files)).toEqual(["photo-no-bg.png", "photo-no-bg-2.png", "cat-no-bg.png"]);
    for (const entry of entries) {
      const data = await zip.file(entry.name)!.async("uint8array");
      expect(Array.from(data)).toEqual(Array.from(entry.data));
    }
  });

  it("rejects an empty list", async () => {
    await expect(buildResultsZip([])).rejects.toThrow("No finished images to package.");
  });

  it("names the archive after the count", () => {
    expect(zipArchiveName(3)).toBe("mediadocks_background_removed_3.zip");
  });
});

describe("engine pins", () => {
  it("keeps the CDN wasm version in lockstep with the npm dependency", () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8"));
    expect(pkg.dependencies["onnxruntime-web"]).toBe(ORT_VERSION);
    expect(ORT_WASM_BASE).toContain(`onnxruntime-web@${ORT_VERSION}/`);
  });

  it("pins the model to an exact revision", () => {
    expect(MODEL.url).toContain(MODEL.revision);
    expect(MODEL.sha256).toMatch(/^[0-9a-f]{64}$/);
  });
});
