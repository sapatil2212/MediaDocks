import path from "path";
import type { NextConfig } from "next";
import { REDIRECT_ALIASES } from "./src/lib/redirect-aliases";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin the tracing root to this project. Without it, Next infers the root from
  // the nearest parent lockfile, so a build inside a git worktree nests
  // server.js under .next/standalone/<subpath>/ and the postbuild check fails.
  // In a normal checkout and in Docker (/app) this equals the inferred root.
  outputFileTracingRoot: path.resolve(__dirname),
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
   * Keyword variants people type are folded into the one canonical page for each
   * intent with a permanent redirect. The list lives in src/lib/redirect-aliases.ts
   * so the ad eligibility module classifies the same sources as redirects.
   */
  async redirects() {
    return REDIRECT_ALIASES.map(([source, destination]) => ({
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
