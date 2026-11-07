import { readdirSync, statSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { classifyPath, decideAds } from "@/src/lib/ads/eligibility";
import { PLATFORM_PAGES } from "@/src/lib/platform-pages";
import sitemap from "@/app/sitemap";
import nextConfig from "../next.config";

const appDir = path.resolve(__dirname, "..", "app");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/^(page\.tsx|route\.ts)$/.test(entry)) out.push(full);
  }
  return out;
}

function toUrl(file: string): string {
  const rel = path.relative(appDir, path.dirname(file)).split(path.sep).join("/");
  return rel === "" ? "/" : `/${rel}`;
}

/** Dynamic patterns that are intentionally not a single classifiable path. */
const DYNAMIC_ALLOWED_UNKNOWN = new Set(["/guides/[slug]"]);

describe("ad route classification", () => {
  const urls = walk(appDir).map(toUrl).sort();

  it("finds the route tree", () => {
    expect(urls.length).toBeGreaterThan(20);
    expect(urls).toContain("/");
  });

  it("classifies every app route", () => {
    const unclassified = urls.filter(
      (url) => classifyPath(url).category === "unknown" && !DYNAMIC_ALLOWED_UNKNOWN.has(url),
    );
    expect(unclassified).toEqual([]);
  });

  it("classifies every sitemap URL", () => {
    for (const entry of sitemap()) {
      const pathname = new URL(entry.url).pathname;
      expect(classifyPath(pathname).category, pathname).not.toBe("unknown");
    }
  });

  it("classifies every redirect source as a redirect", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toBeDefined();
    expect(redirects!.length).toBeGreaterThan(10);
    for (const r of redirects!) {
      expect(classifyPath(r.source).category, r.source).toBe("redirect");
    }
  });

  it("defaults a newly added route to ineligible", () => {
    const decision = decideAds({ pathname: "/new-tool-xyz", consent: "granted", denyMarkerPresent: false });
    expect(decision.eligible).toBe(false);
    expect(classifyPath("/new-tool-xyz").category).toBe("unknown");
  });

  it("classifies every platform page as a downloader", () => {
    for (const page of PLATFORM_PAGES) {
      expect(classifyPath(page.slug).category).toBe("downloader");
    }
  });
});
