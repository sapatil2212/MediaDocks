"use client";

import { AdDenyMarker } from "@/components/ads/AdDenyMarker";

/**
 * Last-resort boundary that replaces the root layout when it fails. It carries
 * the ad deny marker and a noindex tag so nothing third-party survives it.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <AdDenyMarker />
        <meta name="robots" content="noindex,nofollow" />
        <main style={{ padding: "4rem 1.5rem", textAlign: "center", fontFamily: "sans-serif" }}>
          <h1>Something went wrong</h1>
          <p>An unexpected error occurred while loading this page.</p>
          <button type="button" onClick={() => reset()}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
