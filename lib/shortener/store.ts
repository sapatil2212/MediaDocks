import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface ShortUrlRecord {
  slug: string;
  targetUrl: string;
  createdAt: number;
  clicks: number;
  customAlias?: boolean;
}

const RESERVED_SLUGS = new Set([
  "api",
  "admin",
  "superadmin",
  "s",
  "r",
  "guides",
  "faq",
  "terms",
  "privacy",
  "about",
  "contact",
  "how-it-works",
  "image-converter",
  "image-resizer",
  "pdf-to-image",
  "image-to-pdf",
  "qr-code-generator",
  "svg-to-png",
  "base64-image",
  "url-shortener",
  "video-to-text",
  "audio-to-text",
  "audio-summarizer",
  "add-subtitles-to-video",
  "youtube-to-mp3",
  "yt-downloader",
  "health",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
]);

// Memory store backed by local JSON file for persistence across dev server restarts
const memoryStore = new Map<string, ShortUrlRecord>();
let isInitialized = false;

function getStoreFilePath(): string {
  const dir = path.join(process.cwd(), "storage");
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // Ignored if cannot create directory
    }
  }
  return path.join(dir, "short-links.json");
}

function initStore() {
  if (isInitialized) return;
  isInitialized = true;
  try {
    const filePath = getStoreFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const list = JSON.parse(data) as ShortUrlRecord[];
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item?.slug && item?.targetUrl) {
            memoryStore.set(item.slug.toLowerCase(), item);
          }
        }
      }
    }
  } catch {
    // If reading fails, memoryStore remains clean
  }
}

function persistStore() {
  try {
    const filePath = getStoreFilePath();
    const list = Array.from(memoryStore.values());
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    // Best-effort persistence
  }
}

export function validateTargetUrl(rawUrl: string): {
  valid: boolean;
  error?: string;
  normalized?: string;
} {
  let trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, error: "Please enter a URL to shorten" };
  }

  // Prepend https:// if protocol is missing
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "Only HTTP and HTTPS links are supported" };
    }

    const host = parsed.hostname.toLowerCase();

    // SSRF & loopback protection
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1"
    ) {
      return { valid: false, error: "Localhost and loopback addresses cannot be shortened" };
    }

    // Private IPv4 networks protection
    if (
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return { valid: false, error: "Private network IP addresses are not permitted" };
    }

    // Must have a valid dot in hostname (e.g. domain.tld)
    if (!host.includes(".")) {
      return { valid: false, error: "Please provide a valid domain name (e.g. example.com)" };
    }

    return { valid: true, normalized: parsed.toString() };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

function generateRandomSlug(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let slug = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    slug += chars[bytes[i] % chars.length];
  }
  return slug;
}

export async function createShortUrl({
  targetUrl,
  customAlias,
}: {
  targetUrl: string;
  customAlias?: string;
}): Promise<ShortUrlRecord> {
  initStore();

  const val = validateTargetUrl(targetUrl);
  if (!val.valid || !val.normalized) {
    throw new Error(val.error || "Invalid destination URL");
  }

  const normalizedTarget = val.normalized;

  let finalSlug: string;
  let isCustom = false;

  if (customAlias && customAlias.trim().length > 0) {
    const cleanAlias = customAlias.trim().toLowerCase();

    if (!/^[a-z0-9-_]{3,40}$/i.test(cleanAlias)) {
      throw new Error(
        "Custom alias must be 3-40 characters and contain only letters, numbers, dashes, and underscores."
      );
    }

    if (RESERVED_SLUGS.has(cleanAlias)) {
      throw new Error(`The alias "${cleanAlias}" is reserved for system routes.`);
    }

    if (memoryStore.has(cleanAlias)) {
      throw new Error(`The custom alias "${cleanAlias}" is already taken. Please pick another.`);
    }

    finalSlug = cleanAlias;
    isCustom = true;
  } else {
    // Generate unique random slug
    let attempts = 0;
    do {
      finalSlug = generateRandomSlug(6);
      attempts++;
    } while ((memoryStore.has(finalSlug.toLowerCase()) || RESERVED_SLUGS.has(finalSlug.toLowerCase())) && attempts < 20);

    if (attempts >= 20) {
      finalSlug = generateRandomSlug(8);
    }
  }

  const record: ShortUrlRecord = {
    slug: finalSlug,
    targetUrl: normalizedTarget,
    createdAt: Date.now(),
    clicks: 0,
    customAlias: isCustom,
  };

  memoryStore.set(finalSlug.toLowerCase(), record);
  persistStore();

  return record;
}

export async function getShortUrl(slug: string): Promise<ShortUrlRecord | null> {
  initStore();
  const cleanSlug = slug.trim().toLowerCase();
  return memoryStore.get(cleanSlug) || null;
}

export async function recordClick(slug: string): Promise<number> {
  initStore();
  const cleanSlug = slug.trim().toLowerCase();
  const item = memoryStore.get(cleanSlug);
  if (item) {
    item.clicks += 1;
    persistStore();
    return item.clicks;
  }
  return 0;
}

export async function isAliasAvailable(alias: string): Promise<boolean> {
  initStore();
  const clean = alias.trim().toLowerCase();
  if (clean.length < 3 || clean.length > 40) return false;
  if (!/^[a-z0-9-_]+$/i.test(clean)) return false;
  if (RESERVED_SLUGS.has(clean)) return false;
  return !memoryStore.has(clean);
}
