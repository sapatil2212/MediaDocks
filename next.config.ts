import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "**.pinimg.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "**.twimg.com" },
    ],
  },
  /**
   * Keyword variants people actually type, folded into the canonical page with a
   * permanent redirect so there is no duplicate content.
   */
  async redirects() {
    // Keyword variants people type, folded into the one canonical page for each
    // intent. Consolidating them with a 301 is deliberate: publishing a separate
    // thin page per phrase would be a doorway-page pattern, which Google's spam
    // policy treats as abuse. The canonical pages answer each variant on-page
    // instead (see `searchIntents` in lib/platform-pages.ts).
    const aliases: Array<[string, string]> = [
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
      // YouTube audio — a distinct intent with its own page
      ["/youtube-audio-downloader", "/youtube-to-mp3"],
      ["/youtube-mp3-converter", "/youtube-to-mp3"],
      ["/youtube-mp3-downloader", "/youtube-to-mp3"],
      ["/yt-to-mp3", "/youtube-to-mp3"],
      ["/yt-mp3", "/youtube-to-mp3"],
      ["/video-to-mp3", "/youtube-to-mp3"],
      ["/mp3-converter", "/youtube-to-mp3"],
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
      // Legal redirects
      ["/dmca", "/copyright"],
    ];

    return aliases.map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
