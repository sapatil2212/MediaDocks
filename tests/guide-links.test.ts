import { describe, expect, it } from "vitest";
import { GUIDE_ARTICLES, getGuidesForTool, getRelatedGuides } from "@/src/lib/guides-data";

/** Inbound links from the /guides hub (every guide is listed there). */
const HUB_LINKS = 1;

describe("guide link graph", () => {
  const slugs = new Set(GUIDE_ARTICLES.map((g) => g.slug));

  it("every guide has three valid, distinct related guides that are not itself", () => {
    for (const guide of GUIDE_ARTICLES) {
      expect(guide.relatedGuides, guide.slug).toHaveLength(3);
      expect(new Set(guide.relatedGuides).size).toBe(3);
      for (const slug of guide.relatedGuides) {
        expect(slugs.has(slug), `${guide.slug} -> ${slug}`).toBe(true);
        expect(slug).not.toBe(guide.slug);
      }
      expect(getRelatedGuides(guide)).toHaveLength(3);
    }
  });

  it("every guide has at least three inbound internal links", () => {
    for (const guide of GUIDE_ARTICLES) {
      const fromGuides = GUIDE_ARTICLES.filter((g) => g.relatedGuides.includes(guide.slug)).length;
      const toolPageLinks = guide.relatedTool ? getGuidesForTool(guide.relatedTool.path).includes(guide) ? 1 : 0 : 0;
      expect(fromGuides + HUB_LINKS + toolPageLinks, guide.slug).toBeGreaterThanOrEqual(3);
    }
  });

  it("related-guide in-degree is balanced at three", () => {
    for (const guide of GUIDE_ARTICLES) {
      const fromGuides = GUIDE_ARTICLES.filter((g) => g.relatedGuides.includes(guide.slug)).length;
      expect(fromGuides, guide.slug).toBe(3);
    }
  });

  it("guide dates are valid and updatedAt is not before publishedAt", () => {
    for (const guide of GUIDE_ARTICLES) {
      const published = new Date(guide.publishedAt).getTime();
      const updated = new Date(guide.updatedAt).getTime();
      expect(Number.isNaN(published) || Number.isNaN(updated)).toBe(false);
      expect(updated).toBeGreaterThanOrEqual(published);
    }
  });

  it("guide bylines are the organization, not an invented person", () => {
    for (const guide of GUIDE_ARTICLES) {
      expect(guide.author, guide.slug).toBe("MediaDocks Engineering Team");
    }
  });
});
