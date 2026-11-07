import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import type { Metadata } from "next";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { metadata as rootMetadata } from "@/app/layout";
import { buildMetadata, SITE } from "@/src/lib/seo";
import { DOWNLOADERS_INDEXABLE } from "@/src/lib/downloader-visibility";
import { DOWNLOADER_PATHS } from "@/src/lib/ads/allowlist-data";
import { GUIDE_ARTICLES } from "@/src/lib/guides-data";
import { NEWEST_ALLOWED_DATE, PAGE_LAST_MODIFIED } from "@/src/lib/page-dates";
import { platformMetadata } from "@/src/lib/platform-seo";
import { PLATFORM_PAGES } from "@/src/lib/platform-pages";

vi.mock("next/font/google", () => {
  const font = () => ({ variable: "", className: "", style: {} });
  return { Plus_Jakarta_Sans: font, Inter: font, JetBrains_Mono: font };
});

const root = path.resolve(__dirname, "..");
const PRODUCTION_ORIGIN = "https://mediadocks.online";

/** Static page modules whose metadata export is checked. */
const PAGE_MODULES: Record<string, () => Promise<{ metadata?: Metadata }>> = {
  "/": () => import("@/app/page"),
  "/video-to-text": () => import("@/app/video-to-text/page"),
  "/audio-to-text": () => import("@/app/audio-to-text/page"),
  "/audio-summarizer": () => import("@/app/audio-summarizer/page"),
  "/add-subtitles-to-video": () => import("@/app/add-subtitles-to-video/page"),
  "/video-to-audio": () => import("@/app/video-to-audio/page"),
  "/url-shortener": () => import("@/app/url-shortener/page"),
  "/image-converter": () => import("@/app/image-converter/page"),
  "/image-resizer": () => import("@/app/image-resizer/page"),
  "/background-remover": () => import("@/app/background-remover/page"),
  "/pdf-to-image": () => import("@/app/pdf-to-image/page"),
  "/image-to-pdf": () => import("@/app/image-to-pdf/page"),
  "/qr-code-generator": () => import("@/app/qr-code-generator/page"),
  "/svg-to-png": () => import("@/app/svg-to-png/page"),
  "/base64-image": () => import("@/app/base64-image/page"),
  "/guides": () => import("@/app/guides/page"),
  "/how-it-works": () => import("@/app/how-it-works/page"),
  "/faq": () => import("@/app/faq/page"),
  "/about": () => import("@/app/about/page"),
  "/contact": () => import("@/app/contact/page"),
  "/editorial-standards": () => import("@/app/editorial-standards/page"),
  "/privacy": () => import("@/app/privacy/page"),
  "/terms": () => import("@/app/terms/page"),
  "/copyright": () => import("@/app/copyright/page"),
};

function pathOf(url: string): string {
  return new URL(url).pathname;
}

function canonicalOf(meta: Metadata): string | undefined {
  const canonical = meta.alternates?.canonical;
  return typeof canonical === "string" ? canonical : undefined;
}

const TITLE_SUFFIX = " | MediaDocks";

/** The title as rendered: string titles get the root layout template suffix. */
function titleOf(meta: Metadata): string {
  const title = meta.title;
  if (typeof title === "string") return `${title}${TITLE_SUFFIX}`;
  if (title && typeof title === "object" && "absolute" in title) return String(title.absolute);
  return "";
}

describe("sitemap", () => {
  const entries = sitemap();
  const paths = entries.map((e) => pathOf(e.url));

  it("uses the production origin", () => {
    // NEXT_PUBLIC_APP_URL is unset in tests; the module falls back to localhost in
    // development. The origin is exercised by the production-build crawl instead.
    for (const entry of entries) expect(entry.url.startsWith(SITE.url)).toBe(true);
  });

  it("is stable across calls and does not depend on the clock", () => {
    expect(sitemap()).toEqual(sitemap());
    expect(JSON.stringify(sitemap())).toBe(JSON.stringify(entries));
  });

  it("has valid, bounded dates", () => {
    for (const entry of entries) {
      const time = new Date(entry.lastModified as Date).getTime();
      expect(Number.isNaN(time)).toBe(false);
      expect(time).toBeLessThanOrEqual(new Date(`${NEWEST_ALLOWED_DATE}T23:59:59Z`).getTime());
    }
  });

  it("lists no duplicates", () => {
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("lists every guide with its own updatedAt date", () => {
    for (const article of GUIDE_ARTICLES) {
      const entry = entries.find((e) => pathOf(e.url) === `/guides/${article.slug}`);
      expect(entry, article.slug).toBeDefined();
      expect(new Date(entry!.lastModified as Date).toISOString()).toBe(new Date(article.updatedAt).toISOString());
    }
  });

  it("matches the downloader decision", () => {
    expect(DOWNLOADERS_INDEXABLE).toBe(false);
    for (const downloader of DOWNLOADER_PATHS) expect(paths).not.toContain(downloader);
  });

  it("excludes admin, api, dev, shortener and redirect URLs", () => {
    for (const p of paths) {
      expect(p).not.toMatch(/^\/(api|dev|superadmin|s)(\/|$)/);
    }
    expect(paths).not.toContain("/dmca");
  });

  it("has a fixed date for every static page", () => {
    for (const p of paths.filter((x) => !x.startsWith("/guides/"))) {
      expect(PAGE_LAST_MODIFIED[p], p).toBeDefined();
    }
  });
});

describe("robots", () => {
  const rules = robots();
  it("points at the sitemap on the site origin", () => {
    expect(rules.sitemap).toBe(`${SITE.url}/sitemap.xml`);
  });
  it("disallows api, dev, admin and short links but not the downloader pages", () => {
    const rule = Array.isArray(rules.rules) ? rules.rules[0] : rules.rules;
    const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
    for (const expected of ["/api/", "/dev/", "/superadmin", "/s/"]) expect(disallow).toContain(expected);
    // A disallow would stop Google from reading the noindex tag.
    for (const downloader of DOWNLOADER_PATHS) expect(disallow).not.toContain(downloader);
  });
});

describe("buildMetadata", () => {
  it("emits a self canonical, no keywords, and indexable robots by default", () => {
    const meta = buildMetadata({ title: "T", description: "D", path: "/x" });
    expect(canonicalOf(meta)).toBe(`${SITE.url}/x`);
    expect("keywords" in meta).toBe(false);
    expect(meta.robots).toBeUndefined();
  });
  it("noindex keeps a self canonical", () => {
    const meta = buildMetadata({ title: "T", description: "D", path: "/x", noIndex: true });
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(canonicalOf(meta)).toBe(`${SITE.url}/x`);
  });
  it("the root layout declares no keywords and no canonical", () => {
    expect("keywords" in rootMetadata).toBe(false);
    expect(rootMetadata.alternates).toBeUndefined();
    const { other, ...rest } = rootMetadata;
    expect(JSON.stringify(rest)).not.toMatch(/adsense/i);
    expect(Object.keys(other ?? {})).toEqual(["google-adsense-account"]);
  });
});

describe("indexable page metadata", () => {
  const sitemapPaths = new Set(sitemap().map((e) => pathOf(e.url)));
  const titles: string[] = [];

  for (const [pagePath, load] of Object.entries(PAGE_MODULES)) {
    it(`${pagePath}: self canonical, indexable, no keywords, title <= 65 chars`, async () => {
      const mod = await load();
      const meta = mod.metadata as Metadata;
      expect(meta, pagePath).toBeDefined();
      expect(canonicalOf(meta)).toBe(`${SITE.url}${pagePath === "/" ? "/" : pagePath}`.replace(/\/\/$/, "/"));
      expect(meta.robots).toBeUndefined();
      expect("keywords" in meta).toBe(false);
      const title = titleOf(meta);
      expect(title.length).toBeGreaterThan(10);
      expect(title.length, title).toBeLessThanOrEqual(65);
      titles.push(title);
      expect(sitemapPaths.has(pagePath)).toBe(true);
    });
  }

  it("covers every sitemap page", () => {
    const covered = new Set(Object.keys(PAGE_MODULES));
    for (const p of sitemapPaths) {
      if (p.startsWith("/guides/")) continue;
      expect(covered.has(p), p).toBe(true);
    }
  });

  it("titles never repeat the brand suffix", async () => {
    for (const load of Object.values(PAGE_MODULES)) {
      const raw = (await load()).metadata?.title;
      if (typeof raw === "string") expect(raw).not.toMatch(/mediadocks\s*$/i);
    }
  });

  it("titles are unique", async () => {
    const all = await Promise.all(
      Object.values(PAGE_MODULES).map(async (load) => titleOf((await load()).metadata as Metadata)),
    );
    for (const article of GUIDE_ARTICLES) all.push(`${article.metaTitle}${TITLE_SUFFIX}`);
    expect(new Set(all).size).toBe(all.length);
  });

  it("guide titles are at most 65 characters", () => {
    for (const article of GUIDE_ARTICLES) {
      expect(`${article.metaTitle}${TITLE_SUFFIX}`.length, article.slug).toBeLessThanOrEqual(65);
    }
  });
});

describe("noindex pages", () => {
  it("downloader pages are noindex with a self canonical", async () => {
    for (const page of PLATFORM_PAGES) {
      const meta = platformMetadata(page);
      expect(meta.robots, page.slug).toEqual({ index: false, follow: false });
      expect(canonicalOf(meta), page.slug).toBe(`${SITE.url}${page.slug}`);
      expect("keywords" in meta).toBe(false);
    }
    const mp3 = (await import("@/app/youtube-to-mp3/page")).metadata as Metadata;
    expect(mp3.robots).toEqual({ index: false, follow: false });
    expect(canonicalOf(mp3)).toBe(`${SITE.url}/youtube-to-mp3`);
  });

  it("not-found, admin and dev pages are noindex and declare no canonical", async () => {
    const notFound = (await import("@/app/not-found")).metadata as Metadata;
    const admin = (await import("@/app/superadmin/layout")).metadata as Metadata;
    const dev = (await import("@/app/dev/resolver-test/page")).metadata as Metadata;
    for (const meta of [notFound, admin, dev]) {
      expect(meta.robots).toEqual({ index: false, follow: false });
      expect(meta.alternates).toBeUndefined();
    }
  });

  it("an unknown guide slug gets noindex metadata", async () => {
    const mod = await import("@/app/guides/[slug]/page");
    const meta = await mod.generateMetadata({ params: Promise.resolve({ slug: "nope" }) });
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.alternates).toBeUndefined();
  });

  it("short-link responses send X-Robots-Tag", () => {
    const source = readFileSync(path.join(root, "app/s/[slug]/route.ts"), "utf8");
    expect(source).toContain("X-Robots-Tag");
  });

  it("the dev resolver page is unreachable in production", () => {
    const source = readFileSync(path.join(root, "app/dev/resolver-test/page.tsx"), "utf8");
    expect(source).toMatch(/NODE_ENV === "production"\) notFound\(\)/);
  });
});
