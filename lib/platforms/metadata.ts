import * as cheerio from "cheerio";

/**
 * Public metadata parser.
 *
 * Reads only metadata a page publishes for consumers: OpenGraph, Twitter card,
 * JSON-LD (schema.org VideoObject / ImageObject) and standard HTML meta tags.
 * It never tries to reconstruct client-rendered content or guess CDN URLs.
 */
export interface PublicMetadata {
  title?: string;
  description?: string;
  creator?: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  video?: string;
  videoType?: string;
  videoWidth?: number;
  videoHeight?: number;
  duration?: number;
  ogType?: string;
  /** Which sources actually produced something — used by debug output. */
  sources: string[];
  /** True when the page is a client-rendered shell with no usable metadata. */
  isEmptyShell: boolean;
  /**
   * Every og:/twitter:/al: tag found, so a platform resolver can apply its own
   * parsing strategy without re-reading the document.
   */
  tags: Record<string, string>;
}

interface JsonLdNode {
  "@type"?: string | string[];
  name?: string;
  headline?: string;
  description?: string;
  thumbnailUrl?: string | string[];
  contentUrl?: string;
  embedUrl?: string;
  image?: unknown;
  duration?: string;
  width?: number | string;
  height?: number | string;
  author?: { name?: string } | string;
  creator?: { name?: string } | string;
  uploadDate?: string;
  video?: JsonLdNode;
  "@graph"?: JsonLdNode[];
}

export function parsePublicMetadata(html: string): PublicMetadata {
  const meta: PublicMetadata = { sources: [], isEmptyShell: true, tags: {} };
  if (!html) return meta;

  const $ = cheerio.load(html);

  // Collect every namespaced meta tag once; cheerio has already decoded entities.
  $("meta").each((_, element) => {
    const key = $(element).attr("property") ?? $(element).attr("name");
    const content = $(element).attr("content")?.trim();
    if (key && content && /^(og|twitter|al|fb):/i.test(key)) {
      meta.tags[key.toLowerCase()] ??= content;
    }
  });

  const tag = (key: string): string | undefined => {
    const value =
      $(`meta[property="${key}"]`).attr("content") ?? $(`meta[name="${key}"]`).attr("content");
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  };

  // ── OpenGraph ─────────────────────────────────────────────────────────────
  const ogTitle = tag("og:title");
  const ogImage = tag("og:image:secure_url") ?? tag("og:image");
  const ogVideo = tag("og:video:secure_url") ?? tag("og:video:url") ?? tag("og:video");
  if (ogTitle || ogImage || ogVideo || tag("og:description")) meta.sources.push("opengraph");

  meta.title = ogTitle;
  meta.description = tag("og:description");
  meta.image = ogImage;
  meta.imageWidth = toInt(tag("og:image:width"));
  meta.imageHeight = toInt(tag("og:image:height"));
  meta.video = ogVideo;
  meta.videoType = tag("og:video:type");
  meta.videoWidth = toInt(tag("og:video:width"));
  meta.videoHeight = toInt(tag("og:video:height"));
  meta.duration = toInt(tag("og:video:duration") ?? tag("video:duration"));
  meta.ogType = tag("og:type");

  // ── Twitter card ──────────────────────────────────────────────────────────
  const twitterTitle = tag("twitter:title");
  const twitterImage = tag("twitter:image") ?? tag("twitter:image:src");
  const twitterPlayerStream = tag("twitter:player:stream");
  if (twitterTitle || twitterImage || twitterPlayerStream) meta.sources.push("twitter-card");

  meta.title ??= twitterTitle;
  meta.description ??= tag("twitter:description");
  meta.image ??= twitterImage;
  meta.video ??= twitterPlayerStream;
  meta.videoType ??= tag("twitter:player:stream:content_type");
  meta.creator ??= tag("twitter:creator")?.replace(/^@?/, "@");

  // ── JSON-LD ───────────────────────────────────────────────────────────────
  const jsonLd = readJsonLd($);
  if (jsonLd) {
    meta.sources.push("json-ld");
    const node = jsonLd.video ?? jsonLd;
    meta.title ??= firstString(node.name, node.headline);
    meta.description ??= firstString(node.description);
    meta.image ??= firstString(pickImage(node.thumbnailUrl), pickImage(node.image));
    meta.duration ??= parseIsoDuration(node.duration);
    meta.imageWidth ??= toInt(node.width);
    meta.imageHeight ??= toInt(node.height);
    meta.creator ??= readName(node.author) ?? readName(node.creator);

    // contentUrl on a VideoObject is a real media file; embedUrl is a player.
    if (!meta.video && typeof node.contentUrl === "string") meta.video = node.contentUrl;
  }

  // ── HTML microdata (itemprop) ─────────────────────────────────────────────
  const itemprop = (key: string): string | undefined => {
    const value = $(`meta[itemprop="${key}"]`).attr("content")?.trim();
    return value ? value : undefined;
  };
  const microDuration = parseIsoDuration(itemprop("duration"));
  if (microDuration || itemprop("name")) meta.sources.push("microdata");
  meta.duration ??= microDuration;
  meta.title ??= itemprop("name");

  // ── Plain HTML fallbacks ──────────────────────────────────────────────────
  if (!meta.title) {
    const documentTitle = $("title").first().text().trim();
    if (documentTitle) {
      meta.title = documentTitle;
      meta.sources.push("html-title");
    }
  }
  meta.description ??= tag("description");

  meta.isEmptyShell = meta.sources.length === 0;
  return meta;
}

function readJsonLd($: cheerio.CheerioAPI): JsonLdNode | null {
  const blocks = $('script[type="application/ld+json"]')
    .map((_, element) => $(element).contents().text())
    .get();

  for (const block of blocks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(block);
    } catch {
      continue;
    }

    const candidates = flatten(parsed);
    const preferred =
      candidates.find((node) => hasType(node, ["VideoObject", "ImageObject"])) ??
      candidates.find((node) => Boolean(node.video)) ??
      candidates.find((node) => hasType(node, ["SocialMediaPosting", "Article", "Product"])) ??
      candidates[0];

    if (preferred) return preferred;
  }

  return null;
}

function flatten(value: unknown): JsonLdNode[] {
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (typeof value !== "object" || value === null) return [];
  const node = value as JsonLdNode;
  return node["@graph"] ? [node, ...node["@graph"].flatMap(flatten)] : [node];
}

function hasType(node: JsonLdNode, wanted: string[]): boolean {
  const type = node["@type"];
  const types = Array.isArray(type) ? type : type ? [type] : [];
  return types.some((candidate) => wanted.includes(candidate));
}

function pickImage(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return pickImage(value[0]);
  if (typeof value === "object" && value !== null) {
    const record = value as { url?: unknown; contentUrl?: unknown };
    return pickImage(record.url) ?? pickImage(record.contentUrl);
  }
  return undefined;
}

function readName(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const name = (value as { name?: unknown }).name;
    if (typeof name === "string") return name;
  }
  return undefined;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function toInt(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : undefined;
  if (typeof value !== "string") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/** ISO 8601 duration (PT1H2M3S) to seconds. */
export function parseIsoDuration(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const match = value.match(/^P(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/i);
  if (!match) return undefined;
  const [, hours, minutes, seconds] = match;
  const total =
    Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Math.round(Number(seconds ?? 0));
  return total > 0 ? total : undefined;
}
