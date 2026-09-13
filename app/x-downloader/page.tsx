import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { PlatformLanding } from "@/components/sections/PlatformLanding";
import { getPlatformPage } from "@/lib/platform-pages";
import { platformJsonLd, platformMetadata } from "@/lib/platform-seo";

const page = getPlatformPage("x");

export const metadata: Metadata = platformMetadata(page);

export default function XDownloaderPage() {
  return (
    <>
      <JsonLd data={platformJsonLd(page)} />
      <PlatformLanding page={page} />
    </>
  );
}
