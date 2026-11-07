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
  tagline: "Transcribe it. Caption it. Keep it.",
  description:
    "Free AI media toolkit: transcribe video and audio to editable text, generate timed SRT and VTT subtitles, summarize long recordings into key points, and convert images and documents. No account needed.",
  locale: "en_US",
  twitter: "@mediadocks",
} as const;

export function absoluteUrl(path = "/"): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface PageSeo {
  title: string;
  description: string;
  path: string;
  /** Overrides the OG title when the meta title is long. */
  ogTitle?: string;
  noIndex?: boolean;
}

/**
 * Single source of truth for page metadata: canonical URL, OpenGraph and Twitter
 * card. No keywords meta is emitted. Keeps every route consistent and prevents duplicate-content
 * signals between the home page and the platform pages.
 */
export function buildMetadata({
  title,
  description,
  path,
  ogTitle,
  noIndex = false,
}: PageSeo): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title,
    description,
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
    // Google's publisher guidance asks for a resolvable logo and at least one
    // sameAs profile to tie the brand to an entity it already knows about.
    // Without these the Organization node is an orphan with nothing to verify.
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/logo/logo-light.png"),
      contentUrl: absoluteUrl("/logo/logo-light.png"),
      caption: `${SITE.name} logo`,
    },
    sameAs: [`https://x.com/${SITE.twitter.replace(/^@/, "")}`],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: absoluteUrl("/contact"),
      availableLanguage: ["English"],
    },
    publishingPrinciples: absoluteUrl("/editorial-standards"),
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
    // Authorship stays an Organization rather than a Person on purpose. These
    // guides are written and reviewed by the team, and inventing a named author
    // with a fabricated bio to satisfy an E-E-A-T checklist would be a worse
    // signal than an honest collective byline. /editorial-standards documents
    // who writes them and how they are reviewed.
    author: {
      "@type": "Organization",
      "@id": `${absoluteUrl("/")}#organization`,
      name: author,
      url: absoluteUrl("/editorial-standards"),
    },
    publisher: { "@id": `${absoluteUrl("/")}#organization` },
    publishingPrinciples: absoluteUrl("/editorial-standards"),
    isAccessibleForFree: true,
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
      "MediaDocks is a set of browser-based tools for transcription, subtitles, audio extraction and image and document conversion, with a library of guides.",
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
    name: "Contact MediaDocks",
    description:
      "Contact MediaDocks by email about bugs, feedback, privacy requests and copyright concerns.",
    url: absoluteUrl("/contact"),
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: absoluteUrl("/"),
    },
  };
}

