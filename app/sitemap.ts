import type { MetadataRoute } from "next";
import { PLATFORM_PAGES } from "@/lib/platform-pages";
import { GUIDE_ARTICLES } from "@/lib/guides-data";
import { absoluteUrl } from "@/lib/seo";

/**
 * Only canonical, indexable public URLs belong here.
 *
 * Redirect aliases in next.config.ts are deliberately excluded to avoid
 * wasting Google crawl budget.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const corePages: Array<{
    path: string;
    priority: number;
    changeFrequency: "weekly" | "monthly" | "yearly";
  }> = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/video-to-text", priority: 0.9, changeFrequency: "weekly" },
    { path: "/audio-to-text", priority: 0.9, changeFrequency: "weekly" },
    { path: "/audio-summarizer", priority: 0.9, changeFrequency: "weekly" },
    { path: "/add-subtitles-to-video", priority: 0.9, changeFrequency: "weekly" },
    { path: "/youtube-to-mp3", priority: 0.9, changeFrequency: "weekly" },
    { path: "/guides", priority: 0.9, changeFrequency: "weekly" },
    { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
    { path: "/copyright", priority: 0.4, changeFrequency: "yearly" },
  ];

  return [
    // Core application & information pages
    ...corePages.map((entry) => ({
      url: absoluteUrl(entry.path),
      lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
    // Platform landing pages
    ...PLATFORM_PAGES.map((page) => ({
      url: absoluteUrl(page.slug),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    // Educational resource center guides
    ...GUIDE_ARTICLES.map((article) => ({
      url: absoluteUrl(`/guides/${article.slug}`),
      lastModified: new Date(article.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
