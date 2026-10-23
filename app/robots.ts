import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // API routes, the development-only resolver probe and the admin area are
        // not public content. /superadmin also sends noindex in its own metadata,
        // since robots.txt only discourages crawling, it does not prevent
        // indexing of a URL discovered elsewhere. /s/ holds short-link redirect
        // handlers (not pages), so keep them out of the crawl budget too.
        disallow: ["/api/", "/dev/", "/superadmin", "/s/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
