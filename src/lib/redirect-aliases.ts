/**
 * Keyword-variant aliases folded into one canonical page each with a permanent
 * redirect. Shared by next.config.ts (which serves the redirects) and the ad
 * eligibility module (which classifies every alias source as "redirect", so no
 * redirect path can ever carry an ad).
 *
 * Consolidating variants with a redirect is deliberate: publishing a separate
 * thin page per phrase would be a doorway-page pattern.
 */
export const REDIRECT_ALIASES: ReadonlyArray<readonly [string, string]> = [
  // Instagram
  ["/instagram-downloader", "/insta-downloader"],
  ["/instagram-video-downloader", "/insta-downloader"],
  ["/instagram-reel-downloader", "/insta-downloader"],
  ["/instagram-reels-downloader", "/insta-downloader"],
  ["/instagram-post-downloader", "/insta-downloader"],
  ["/instagram-photo-downloader", "/insta-downloader"],
  ["/instagram-image-downloader", "/insta-downloader"],
  ["/instagram-story-downloader", "/insta-downloader"],
  ["/igtv-downloader", "/insta-downloader"],
  ["/ig-downloader", "/insta-downloader"],
  // Facebook
  ["/facebook-downloader", "/fb-downloader"],
  ["/facebook-video-downloader", "/fb-downloader"],
  ["/facebook-reel-downloader", "/fb-downloader"],
  ["/fb-video-downloader", "/fb-downloader"],
  ["/fb-watch-downloader", "/fb-downloader"],
  // YouTube video
  ["/youtube-downloader", "/yt-downloader"],
  ["/youtube-video-downloader", "/yt-downloader"],
  ["/youtube-shorts-downloader", "/yt-downloader"],
  ["/yt-video-downloader", "/yt-downloader"],
  ["/4k-video-downloader", "/yt-downloader"],
  // YouTube audio
  ["/youtube-audio-downloader", "/youtube-to-mp3"],
  ["/youtube-mp3-converter", "/youtube-to-mp3"],
  ["/youtube-mp3-downloader", "/youtube-to-mp3"],
  ["/yt-to-mp3", "/youtube-to-mp3"],
  ["/yt-mp3", "/youtube-to-mp3"],
  ["/mp3-converter", "/youtube-to-mp3"],
  // Video to Audio
  ["/video-to-mp3", "/video-to-audio"],
  ["/extract-audio", "/video-to-audio"],
  ["/video-audio-extractor", "/video-to-audio"],
  // Background remover
  ["/remove-background", "/background-remover"],
  ["/remove-bg", "/background-remover"],
  ["/bg-remover", "/background-remover"],
  ["/background-eraser", "/background-remover"],
  // Pinterest
  ["/pin-downloader", "/pinterest-downloader"],
  ["/pinterest-photo-downloader", "/pinterest-downloader"],
  ["/pinterest-image-downloader", "/pinterest-downloader"],
  ["/pinterest-video-downloader", "/pinterest-downloader"],
  ["/pinterest-gif-downloader", "/pinterest-downloader"],
  ["/pin-it-downloader", "/pinterest-downloader"],
  // X / Twitter
  ["/twitter-downloader", "/x-downloader"],
  ["/twitter-video-downloader", "/x-downloader"],
  ["/twitter-photo-downloader", "/x-downloader"],
  ["/twitter-image-downloader", "/x-downloader"],
  ["/twitter-gif-downloader", "/x-downloader"],
  ["/x-video-downloader", "/x-downloader"],
  // Legal
  ["/dmca", "/copyright"],
];
