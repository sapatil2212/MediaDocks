import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(path.join(root, dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(path.join(root, rel)).isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(rel);
  }
  return out;
}

describe("ArticleAd wiring", () => {
  const guidePage = read("app/guides/[slug]/page.tsx");

  it("is imported only by the guide page", () => {
    const importers = [...walk("app"), ...walk("src")].filter(
      (f) => f !== "src/components/ads/ArticleAd.tsx" && /components\/ads\/ArticleAd/.test(read(f)),
    );
    expect(importers).toEqual(["app/guides/[slug]/page.tsx"]);
  });

  it("is placed only from the placeSlots result, once, between paragraphs", () => {
    expect(guidePage).toContain("placeSlots(article.sections)");
    expect(guidePage.match(/<ArticleAd \/>/g)?.length).toBe(1);
    const idx = guidePage.indexOf("<ArticleAd />");
    const around = guidePage.slice(Math.max(0, idx - 400), idx + 60);
    expect(around).toContain("adSlots.some(");
    expect(around).toContain("</p>");
  });

  it("is not inside the CTA card, FAQ, related guides, table, list or callout", () => {
    const idx = guidePage.indexOf("<ArticleAd />");
    const cta = guidePage.indexOf("Related Tool Hero Banner");
    const faq = guidePage.indexOf("FAQ Accordion Section");
    const related = guidePage.indexOf("Next / Related Guides");
    const callout = guidePage.indexOf("Callout Box if present");
    const table = guidePage.indexOf("Comparison Table if present");
    const bullets = guidePage.indexOf("Bullet Points if present");
    // The slot sits in the paragraph map, which precedes the callout, table and list blocks.
    for (const marker of [cta, faq, related, callout, table, bullets]) {
      expect(marker).toBeGreaterThan(idx);
    }
  });
});
