/**
 * Fixed last-modified dates for static pages, used by sitemap.xml.
 *
 * These are constants on purpose: a date computed at build time would change on
 * every deploy and tell crawlers nothing. Pages edited in the AdSense
 * remediation carry the day of that edit; other pages carry the committer date
 * of their last change (git log -1 --format=%cs -- <page file>). Update a
 * page's date only when its content changes. Guide dates come from guides-data.
 */
const REMEDIATION_EDIT_DAY = "2026-11-07";

export const PAGE_LAST_MODIFIED: Readonly<Record<string, string>> = {
  "/": REMEDIATION_EDIT_DAY,
  "/video-to-text": "2026-09-22",
  "/audio-to-text": "2026-09-22",
  "/audio-summarizer": "2026-09-22",
  "/add-subtitles-to-video": "2026-09-22",
  "/video-to-audio": "2026-10-16",
  "/url-shortener": "2026-10-23",
  "/image-converter": "2026-10-23",
  "/image-resizer": "2026-10-23",
  "/background-remover": "2026-10-25",
  "/pdf-to-image": "2026-10-23",
  "/image-to-pdf": "2026-10-23",
  "/qr-code-generator": "2026-10-23",
  "/svg-to-png": "2026-10-23",
  "/base64-image": "2026-10-23",
  "/guides": REMEDIATION_EDIT_DAY,
  "/how-it-works": REMEDIATION_EDIT_DAY,
  "/faq": REMEDIATION_EDIT_DAY,
  "/about": REMEDIATION_EDIT_DAY,
  "/contact": REMEDIATION_EDIT_DAY,
  "/editorial-standards": REMEDIATION_EDIT_DAY,
  "/privacy": REMEDIATION_EDIT_DAY,
  "/terms": REMEDIATION_EDIT_DAY,
  "/copyright": REMEDIATION_EDIT_DAY,
  // Downloader pages are not in the sitemap while they are noindex.
  "/youtube-to-mp3": "2026-10-16",
};

/** Newest date any page may carry. Tests use this instead of the clock. */
export const NEWEST_ALLOWED_DATE = REMEDIATION_EDIT_DAY;
