import { describe, it, expect } from "vitest";
import type { ConverterContent } from "@/components/converters/content-types";

import { content as imageConverter } from "@/app/image-converter/content";
import { content as imageResizer } from "@/app/image-resizer/content";
import { content as imageToPdf } from "@/app/image-to-pdf/content";
import { content as pdfToImage } from "@/app/pdf-to-image/content";
import { content as base64Image } from "@/app/base64-image/content";
import { content as qrCode } from "@/app/qr-code-generator/content";
import { content as svgToPng } from "@/app/svg-to-png/content";
import { content as urlShortener } from "@/app/url-shortener/content";

/**
 * LOCKED invariant for the AdSense "low-value content" fix: the eight converter
 * pages must not share templated prose. This test reads every content module,
 * pulls out all the real prose (intro paragraphs, use cases, the privacy note,
 * every FAQ answer, every how-to body, and the per-page ConverterSections copy),
 * and fails if any normalized 20-word window appears on more than one page. It
 * also guards the per-page word-count floor so a page cannot be gutted back to
 * thin content without the suite noticing.
 */

const PAGES: Array<{ name: string; content: ConverterContent }> = [
  { name: "image-converter", content: imageConverter },
  { name: "image-resizer", content: imageResizer },
  { name: "image-to-pdf", content: imageToPdf },
  { name: "pdf-to-image", content: pdfToImage },
  { name: "base64-image", content: base64Image },
  { name: "qr-code-generator", content: qrCode },
  { name: "svg-to-png", content: svgToPng },
  { name: "url-shortener", content: urlShortener },
];

const MIN_WORDS_PER_PAGE = 450;
const WINDOW_SIZE = 20;

/** Every prose string a reader actually sees on the page. */
function proseStrings(c: ConverterContent): string[] {
  return [
    ...c.intro,
    ...c.useCases,
    c.privacyNote,
    ...c.faqs.map((f) => f.a),
    ...c.howTo.map((s) => s.body),
    c.featuresHeading,
    c.featuresSubline,
    c.privacyBannerTitle,
    c.privacyBannerBody,
  ];
}

/** Lowercase, strip punctuation to spaces, collapse whitespace, split to words. */
function toWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/** All contiguous WINDOW_SIZE-word windows across a page's prose, joined. */
function windowsForPage(c: ConverterContent): Set<string> {
  const windows = new Set<string>();
  for (const str of proseStrings(c)) {
    const words = toWords(str);
    for (let i = 0; i + WINDOW_SIZE <= words.length; i++) {
      windows.add(words.slice(i, i + WINDOW_SIZE).join(" "));
    }
  }
  return windows;
}

describe("converter content uniqueness", () => {
  it("has no 20-word prose window shared between any two pages", () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];

    for (const page of PAGES) {
      for (const window of windowsForPage(page.content)) {
        const previous = seen.get(window);
        if (previous && previous !== page.name) {
          collisions.push(`"${window}" — in both ${previous} and ${page.name}`);
        } else if (!previous) {
          seen.set(window, page.name);
        }
      }
    }

    expect(collisions, `Duplicate 20-word windows found:\n${collisions.join("\n")}`).toEqual([]);
  });

  it.each(PAGES)("$name has at least $MIN_WORDS_PER_PAGE words of prose", ({ content }) => {
    const total = proseStrings(content).reduce((sum, s) => sum + toWords(s).length, 0);
    expect(total).toBeGreaterThanOrEqual(MIN_WORDS_PER_PAGE);
  });

  it("every page has a unique FAQ, use-case set and feature list", () => {
    for (const page of PAGES) {
      expect(page.content.faqs.length, `${page.name} FAQ`).toBeGreaterThanOrEqual(2);
      expect(page.content.useCases.length, `${page.name} use cases`).toBeGreaterThanOrEqual(3);
      expect(page.content.featureList.length, `${page.name} features`).toBeGreaterThanOrEqual(3);
    }
  });
});
