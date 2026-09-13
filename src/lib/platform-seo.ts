import type { Metadata } from "next";
import type { PlatformPage } from "./platform-pages";
import {
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
  howToJsonLd,
  softwareAppJsonLd,
} from "./seo";

/** Metadata for a platform landing page: unique title, description and canonical. */
export function platformMetadata(page: PlatformPage): Metadata {
  return buildMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: page.slug,
    keywords: page.keywords,
    ogTitle: `${page.h1} — ${page.tagline}`,
  });
}

/**
 * Structured data for a platform page: the app itself, a HowTo for the steps,
 * the FAQ block and the breadcrumb trail.
 */
export function platformJsonLd(page: PlatformPage): Record<string, unknown>[] {
  return [
    softwareAppJsonLd({
      name: `${page.name} downloader — MediaDocks`,
      description: page.metaDescription,
      path: page.slug,
      featureList: page.youGet,
    }),
    howToJsonLd({
      name: `How to use the ${page.navLabel} downloader`,
      description: page.tagline,
      steps: page.steps,
    }),
    faqJsonLd(page.faqs),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: `${page.navLabel} downloader`, path: page.slug },
    ]),
  ];
}
