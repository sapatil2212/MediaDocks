/**
 * Downloader pages (YouTube, Instagram, Facebook, X, Pinterest, YouTube to MP3)
 * stay reachable by direct link and ad-free, but are not indexable, not in the
 * sitemap, and not linked from navigation, the footer, the home page or guides.
 *
 * Flip to true only as a deliberate product decision. Moving the downloaders to a
 * separate domain later needs only an origin value and redirects; nothing else
 * here depends on where they are served.
 */
export const DOWNLOADERS_INDEXABLE = false;
