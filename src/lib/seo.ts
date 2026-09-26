import type { Metadata } from "next";

const defaultProductionUrl = "https://mediadocks.online";
const envAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
const rawSiteUrl =
  envAppUrl && !/localhost|127\.0\.0\.1/.test(envAppUrl)
    ? envAppUrl
    : process.env.NODE_ENV === "production"
    ? defaultProductionUrl
    : envAppUrl || "http://localhost:3000";

/**
 * Every canonical link, OpenGraph URL, sitemap entry and JSON-LD @id is built
 * from this value.
 */
if (process.env.NODE_ENV === "production" && /localhost|127\.0\.0\.1/.test(rawSiteUrl)) {
  console.warn(
    "\n[seo] WARNING: NEXT_PUBLIC_APP_URL is not set to a public domain " +
      `(currently "${rawSiteUrl}").\n` +
      "       Canonical URLs, OpenGraph tags, the sitemap and structured data will\n" +
      "       all point at localhost, which stops the site being indexed correctly.\n" +
      "       Set NEXT_PUBLIC_APP_URL=https://mediadocks.online before deploying.\n",
  );
}

export const SITE = {
  name: "MediaDocks",
  url: rawSiteUrl,
  tagline: "Paste a link. Choose the quality.",
  description:
    "Free universal media utility for public links. Extract high-resolution MP4 video from 144p to 4K, convert to MP3 audio, transcribe speech with AI, generate subtitles, and summarize recordings.",
  locale: "en_US",
  twitter: "@mediadocks",
} as const;

/**
 * Keywords that apply to every page. Platform pages append their own.
 *
 * Worth being clear-eyed about these: Google dropped the keywords meta tag as a
 * ranking signal in 2009 and has never reinstated it, so this list does not
 * affect Google or Bing rankings. It is kept because Yandex still reads it and
 * it costs nothing. The signals that actually rank these pages are the title
 * tag, the H1/H2 structure, the on-page intent coverage in `searchIntents`, and
 * internal links with descriptive anchor text.
 */
export const GLOBAL_KEYWORDS = [
  "video downloader",
  "media downloader",
  "online video downloader",
  "free video downloader",
  "download videos online",
  "4k video downloader",
  "1080p video downloader",
  "mp4 downloader",
  "mp3 downloader",
  "audio downloader",
  "photo downloader",
  "image downloader",
  "social media downloader",
  "no watermark downloader",
  "video downloader without app",
  "downloader no sign up",
  "download reels photos videos",
  "save video from link",
  "paste link download video",
  "mediadocks",
];

export function absoluteUrl(path = "/"): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface PageSeo {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  /** Overrides the OG title when the meta title is long. */
  ogTitle?: string;
  noIndex?: boolean;
}

/**
 * Single source of truth for page metadata: canonical URL, OpenGraph, Twitter
 * card and keywords. Keeps every route consistent and prevents duplicate-content
 * signals between the home page and the platform pages.
 */
export function buildMetadata({
  title,
  description,
  path,
  keywords = [],
  ogTitle,
  noIndex = false,
}: PageSeo): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title,
    description,
    keywords: [...keywords, ...GLOBAL_KEYWORDS],
    alternates: { canonical },
    openGraph: {
      title: ogTitle ?? title,
      description,
      url: canonical,
      siteName: SITE.name,
      locale: SITE.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle ?? title,
      description,
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/* ────────────────────────────── structured data ───────────────────────────── */

type JsonLdObject = Record<string, unknown>;

export function webSiteJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}#website`,
    name: SITE.name,
    url: absoluteUrl("/"),
    description: SITE.description,
    inLanguage: "en",
    publisher: { "@id": `${absoluteUrl("/")}#organization` },
  };
}

/**
 * Brand entity. Referenced by @id from the WebSite node so Google can tie pages,
 * site and publisher into one graph instead of three unrelated blobs.
 */
export function organizationJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${absoluteUrl("/")}#organization`,
    name: SITE.name,
    url: absoluteUrl("/"),
    description: SITE.description,
  };
}

export function softwareAppJsonLd({
  name,
  description,
  path,
  featureList,
}: {
  name: string;
  description: string;
  path: string;
  featureList: string[];
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url: absoluteUrl(path),
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires JavaScript",
    isAccessibleForFree: true,
    featureList,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function faqJsonLd(items: ReadonlyArray<{ q: string; a: string }>): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function howToJsonLd({
  name,
  description,
  steps,
}: {
  name: string;
  description: string;
  steps: ReadonlyArray<{ title: string; body: string }>;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    totalTime: "PT1M",
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.body,
    })),
  };
}

export function breadcrumbJsonLd(trail: ReadonlyArray<{ name: string; path: string }>): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(entry.path),
    })),
  };
}

export function articleJsonLd({
  title,
  description,
  path,
  datePublished,
  dateModified,
  author = SITE.name,
}: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: absoluteUrl(path),
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Organization",
      name: author,
      url: absoluteUrl("/about"),
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: absoluteUrl("/"),
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(path),
    },
  };
}

export function aboutPageJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About MediaDocks",
    description:
      "MediaDocks is a privacy-first universal media utility engineered for high-resolution video extraction, audio conversion, and AI speech-to-text processing.",
    url: absoluteUrl("/about"),
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: absoluteUrl("/"),
    },
  };
}

export function contactPageJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact MediaDocks Support",
    description:
      "Get in touch with the MediaDocks team for technical support, feedback, bug reports, and DMCA inquiries.",
    url: absoluteUrl("/contact"),
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: absoluteUrl("/"),
    },
  };
}

