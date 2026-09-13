import type { MetadataRoute } from "next";
import { PLATFORM_PAGES } from "@/lib/platform-pages";
import { absoluteUrl } from "@/lib/seo";

/**
 * Only canonical, indexable URLs belong here.
 *
 * The keyword aliases in next.config.ts are 301 redirects, so they are
 * deliberately excluded — listing a redirect in a sitemap asks Google to crawl a
 * URL that only points elsewhere, which wastes crawl budget and muddies the
 * canonical signal.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticPages: Array<{
    path: string;
    priority: number;
    changeFrequency: "weekly" | "monthly" | "yearly";
  }> = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    // Ranks for its own high-volume intent, so it sits with the platform pages.
    { path: "/youtube-to-mp3", priority: 0.9, changeFrequency: "weekly" },
    { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ];

  return [
    ...staticPages.map((entry) => ({
      url: absoluteUrl(entry.path),
      lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
    // Platform landing pages rank for their own keywords, so they sit just
    // below the home page.
    ...PLATFORM_PAGES.map((page) => ({
      url: absoluteUrl(page.slug),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
