import type { MetadataRoute } from "next";
import { PLATFORM_PAGES } from "@/lib/platform-pages";
import { GUIDE_ARTICLES } from "@/lib/guides-data";
import { DOWNLOADERS_INDEXABLE } from "@/lib/downloader-visibility";
import { PAGE_LAST_MODIFIED } from "@/lib/page-dates";
import { absoluteUrl } from "@/lib/seo";

type Frequency = "weekly" | "monthly" | "yearly";

interface CoreEntry {
  path: string;
  priority: number;
  changeFrequency: Frequency;
}

/**
 * Only canonical, indexable public URLs that return 200 belong here.
 *
 * Redirect aliases in src/lib/redirect-aliases.ts are excluded, and so are the
 * downloader pages while DOWNLOADERS_INDEXABLE is false (they are noindex).
 * Dates are fixed constants or guide data, never the build time.
 */
const CORE_PAGES: CoreEntry[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/video-to-text", priority: 0.9, changeFrequency: "weekly" },
  { path: "/audio-to-text", priority: 0.9, changeFrequency: "weekly" },
  { path: "/audio-summarizer", priority: 0.9, changeFrequency: "weekly" },
  { path: "/add-subtitles-to-video", priority: 0.9, changeFrequency: "weekly" },
  { path: "/video-to-audio", priority: 0.9, changeFrequency: "weekly" },
  { path: "/url-shortener", priority: 0.9, changeFrequency: "weekly" },
  { path: "/image-converter", priority: 0.9, changeFrequency: "weekly" },
  { path: "/image-resizer", priority: 0.9, changeFrequency: "weekly" },
  { path: "/background-remover", priority: 0.9, changeFrequency: "weekly" },
  { path: "/pdf-to-image", priority: 0.9, changeFrequency: "weekly" },
  { path: "/image-to-pdf", priority: 0.9, changeFrequency: "weekly" },
  { path: "/qr-code-generator", priority: 0.9, changeFrequency: "weekly" },
  { path: "/svg-to-png", priority: 0.9, changeFrequency: "weekly" },
  { path: "/base64-image", priority: 0.9, changeFrequency: "weekly" },
  { path: "/guides", priority: 0.9, changeFrequency: "weekly" },
  { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/editorial-standards", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/copyright", priority: 0.4, changeFrequency: "yearly" },
];

const DOWNLOADER_CORE: CoreEntry[] = [
  { path: "/youtube-to-mp3", priority: 0.9, changeFrequency: "weekly" },
];

function dateFor(pathname: string): Date {
  const iso = PAGE_LAST_MODIFIED[pathname];
  if (!iso) throw new Error(`No fixed lastModified date for ${pathname}`);
  return new Date(`${iso}T00:00:00Z`);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const core = DOWNLOADERS_INDEXABLE ? [...CORE_PAGES, ...DOWNLOADER_CORE] : CORE_PAGES;

  return [
    ...core.map((entry) => ({
      url: absoluteUrl(entry.path),
      lastModified: dateFor(entry.path),
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
    ...(DOWNLOADERS_INDEXABLE
      ? PLATFORM_PAGES.map((page) => ({
          url: absoluteUrl(page.slug),
          lastModified: dateFor("/youtube-to-mp3"),
          changeFrequency: "weekly" as const,
          priority: 0.9,
        }))
      : []),
    ...GUIDE_ARTICLES.map((article) => ({
      url: absoluteUrl(`/guides/${article.slug}`),
      lastModified: new Date(article.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
