import { decodeEmbeddedUrl } from "../base";

/**
 * Field-name-agnostic scan for video URLs inside a public HTML response.
 *
 * Social pages embed their state as JSON in <script> tags, and the field names
 * differ per platform and change over time. Rather than depending on one shape,
 * this collects every plausible direct video URL and lets the central validator
 * decide what each one really is.
 */

/** Ordered so the more specific, more trustworthy fields come first. */
const VIDEO_URL_PATTERNS: Array<{ source: string; pattern: RegExp }> = [
  { source: "video_versions", pattern: /"video_versions"\s*:\s*\[(.*?)\]/gs },
  { source: "video_url", pattern: /"video_url"\s*:\s*"([^"]+)"/g },
  { source: "playback_url", pattern: /"playback_url"\s*:\s*"([^"]+)"/g },
  { source: "browser_native_hd_url", pattern: /"browser_native_hd_url"\s*:\s*"([^"]+)"/g },
  { source: "browser_native_sd_url", pattern: /"browser_native_sd_url"\s*:\s*"([^"]+)"/g },
  { source: "playable_url_quality_hd", pattern: /"playable_url_quality_hd"\s*:\s*"([^"]+)"/g },
  { source: "playable_url", pattern: /"playable_url"\s*:\s*"([^"]+)"/g },
  { source: "hd_src", pattern: /"hd_src"\s*:\s*"([^"]+)"/g },
  { source: "sd_src", pattern: /"sd_src"\s*:\s*"([^"]+)"/g },
  { source: "contentUrl", pattern: /"contentUrl"\s*:\s*"([^"]+\.mp4[^"]*)"/g },
  { source: "video_list", pattern: /"video_list"\s*:\s*\{(.*?)\}\s*\}/gs },
  { source: "sources", pattern: /"sources"\s*:\s*\[(.*?)\]/gs },
];

/** Pulls every `"url": "...mp4..."` out of a JSON fragment. */
function urlsInFragment(fragment: string): string[] {
  const found: string[] = [];
  for (const match of fragment.matchAll(/"(?:url|src)"\s*:\s*"([^"]+)"/g)) {
    if (match[1]) found.push(match[1]);
  }
  // `url_list` arrays hold bare strings.
  for (const match of fragment.matchAll(/"url_list"\s*:\s*\[([^\]]+)\]/g)) {
    for (const inner of (match[1] ?? "").matchAll(/"([^"]+)"/g)) {
      if (inner[1]) found.push(inner[1]);
    }
  }
  return found;
}

export interface EmbeddedVideoUrl {
  url: string;
  source: string;
}

/** Collects candidate video URLs from embedded JSON in a public page. */
export function extractEmbeddedVideoUrls(html: string): EmbeddedVideoUrl[] {
  if (!html) return [];

  const results: EmbeddedVideoUrl[] = [];
  const seen = new Set<string>();

  const push = (raw: string, source: string) => {
    const url = decodeEmbeddedUrl(raw);
    if (!url.startsWith("http")) return;
    if (seen.has(url)) return;
    seen.add(url);
    results.push({ url, source });
  };

  for (const { source, pattern } of VIDEO_URL_PATTERNS) {
    for (const match of html.matchAll(pattern)) {
      const captured = match[1];
      if (!captured) continue;
      // Array/object fragments need a second pass for their inner urls.
      if (captured.includes('"url"') || captured.includes('"src"') || captured.includes("url_list")) {
        for (const inner of urlsInFragment(captured)) push(inner, source);
      } else {
        push(captured, source);
      }
    }
  }

  // Last resort: any absolute .mp4 URL in the document.
  for (const match of html.matchAll(/https:(?:\\?\/){2}[^"'\s\\]+?\.mp4[^"'\s\\]*/g)) {
    push(match[0], "raw-mp4-scan");
  }

  return results;
}

/** True when the payload says the media is a video, whatever the field style. */
export function looksLikeVideoPayload(html: string): boolean {
  if (!html) return false;
  return (
    /"is_video"\s*:\s*true/.test(html) ||
    /"media_type"\s*:\s*2/.test(html) ||
    /"clips_metadata"\s*:\s*\{/.test(html) ||
    /"video_versions"\s*:\s*\[/.test(html)
  );
}
