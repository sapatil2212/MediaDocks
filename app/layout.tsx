import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/hooks/use-theme";
import { Navbar } from "@/components/Navbar";
import { PageViewTracker } from "@/components/PageViewTracker";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Toaster } from "@/components/ui/sonner";
import {
  absoluteUrl,
  GLOBAL_KEYWORDS,
  organizationJsonLd,
  SITE,
  webSiteJsonLd,
} from "@/lib/seo";
import "./globals.css";

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "MediaDocks — Free Video Downloader: Any Resolution or MP3",
    // Page titles stay unique while keeping the brand in the SERP.
    template: "%s | MediaDocks",
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: GLOBAL_KEYWORDS,
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "technology",
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    title: "MediaDocks — Free Video Downloader: Any Resolution or MP3",
    description: SITE.description,
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: absoluteUrl("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: "MediaDocks — Free Video Downloader: Any Resolution or MP3",
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Icons are intentionally not declared here. app/icon.png and
  // app/apple-icon.png are picked up by Next's file convention, which emits the
  // correct <link> tags with cache-busting hashes. Declaring them again would
  // override that with unhashed paths, and the previous entries pointed at SVGs
  // of the old placeholder glyph rather than the real brand mark.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col bg-background font-sans antialiased">
        <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
