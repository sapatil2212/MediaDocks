import { CAPABILITY_LABEL, getPlatformPage } from "@/lib/platform-pages";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

const page = getPlatformPage("pinterest");

export const alt = `${page.h1} — ${page.tagline}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: page.name,
    title: page.h1,
    subtitle: page.tagline,
    badge: CAPABILITY_LABEL[page.capability],
  });
}
