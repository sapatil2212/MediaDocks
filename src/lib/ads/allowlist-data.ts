/**
 * Hand-listed route constants used by the client-side ad eligibility path.
 *
 * Deliberately tiny and import-free: the root layout ships this to every page,
 * so it must not pull in guide text or platform copy. Tests keep these lists
 * honest against GUIDE_ARTICLES, PLATFORM_PAGES and the real route tree.
 */

/** Every guide slug. Used only to classify /guides/<slug> as a guide article. */
export const ALL_GUIDE_SLUGS: readonly string[] = [
  "mp4-vs-webm-video-format-comparison",
  "video-resolution-guide-720p-1080p-4k",
  "understanding-video-codecs-h264-hevc-vp9-av1",
  "audio-bitrates-explained-128-192-320-kbps",
  "how-to-extract-audio-from-video-cleanly",
  "complete-guide-to-srt-vtt-subtitles",
  "how-speech-to-text-ai-transcription-works",
  "how-video-compression-affects-quality",
  "optimizing-media-for-web-and-social",
  "troubleshooting-common-media-playback-errors",
  "video-accessibility-captions-transcripts-wcag",
  "transcribing-interviews-and-meetings-workflow",
];

/**
 * Guides that may carry ads. The computed set in guide-allowlist.ts (word floor
 * plus a first-party tool CTA) must equal this list; a test fails on drift.
 */
export const ALLOWLISTED_GUIDE_SLUGS: readonly string[] = [
  "mp4-vs-webm-video-format-comparison",
  "audio-bitrates-explained-128-192-320-kbps",
  "how-to-extract-audio-from-video-cleanly",
  "complete-guide-to-srt-vtt-subtitles",
  "how-speech-to-text-ai-transcription-works",
  "video-accessibility-captions-transcripts-wcag",
  "transcribing-interviews-and-meetings-workflow",
];

/**
 * Downloader routes. The single list behind the downloader policy: ad
 * eligibility denies them, and the sitemap, navigation and noindex decisions
 * read it too. `/downloader` has no route today and is kept as a deny-only entry.
 */
export const DOWNLOADER_PATHS: readonly string[] = [
  "/yt-downloader",
  "/insta-downloader",
  "/fb-downloader",
  "/x-downloader",
  "/pinterest-downloader",
  "/youtube-to-mp3",
  "/downloader",
];

export function getAllGuideSlugs(): readonly string[] {
  return ALL_GUIDE_SLUGS;
}

export function getAllowlistedGuideSlugs(): readonly string[] {
  return ALLOWLISTED_GUIDE_SLUGS;
}

export function getDownloaderPaths(): readonly string[] {
  return DOWNLOADER_PATHS;
}
