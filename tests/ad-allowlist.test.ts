import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  ALL_GUIDE_SLUGS,
  ALLOWLISTED_GUIDE_SLUGS,
  DOWNLOADER_PATHS,
} from "@/src/lib/ads/allowlist-data";
import {
  computeAllowlist,
  guideHasFirstPartyTool,
  guideRunningWords,
  MIN_GUIDE_WORDS,
} from "@/src/lib/ads/guide-allowlist";
import { classifyPath } from "@/src/lib/ads/eligibility";
import { GUIDE_ARTICLES } from "@/src/lib/guides-data";
import { PLATFORM_PAGES } from "@/src/lib/platform-pages";

const root = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

describe("guide allowlist", () => {
  it("equals the computed set", () => {
    expect([...ALLOWLISTED_GUIDE_SLUGS].sort()).toEqual(computeAllowlist().sort());
  });

  it("ALL_GUIDE_SLUGS matches the guide data", () => {
    expect([...ALL_GUIDE_SLUGS].sort()).toEqual(GUIDE_ARTICLES.map((g) => g.slug).sort());
  });

  it("every allowlisted guide meets the word floor and points at a first-party tool", () => {
    for (const slug of ALLOWLISTED_GUIDE_SLUGS) {
      const article = GUIDE_ARTICLES.find((g) => g.slug === slug);
      expect(article, slug).toBeDefined();
      expect(guideRunningWords(article!)).toBeGreaterThanOrEqual(MIN_GUIDE_WORDS);
      expect(guideHasFirstPartyTool(article!)).toBe(true);
      const category = classifyPath(article!.relatedTool!.path).category;
      expect(["converter-tool", "ai-tool"]).toContain(category);
    }
  });

  it("guides pointing at downloader routes or thin pages are excluded", () => {
    const excluded = GUIDE_ARTICLES.filter((g) => !ALLOWLISTED_GUIDE_SLUGS.includes(g.slug));
    for (const g of excluded) {
      const target = g.relatedTool?.path;
      const category = target ? classifyPath(target).category : "none";
      const short = guideRunningWords(g) < MIN_GUIDE_WORDS;
      expect(short || !["converter-tool", "ai-tool"].includes(category), g.slug).toBe(true);
    }
  });

  it("DOWNLOADER_PATHS matches the platform pages plus the two literals", () => {
    const expected = [...PLATFORM_PAGES.map((p) => p.slug), "/youtube-to-mp3", "/downloader"].sort();
    expect([...DOWNLOADER_PATHS].sort()).toEqual(expected);
  });

  it("client-path modules do not import guide or platform copy", () => {
    for (const file of [
      "src/lib/ads/eligibility.ts",
      "src/lib/ads/allowlist-data.ts",
      "src/components/ads/AdRuntime.tsx",
      "src/components/ads/ArticleAd.tsx",
    ]) {
      const source = read(file);
      expect(source, file).not.toMatch(/from\s+["'][^"']*(guides-data|guide-allowlist|platform-pages)["']/);
    }
  });
});
