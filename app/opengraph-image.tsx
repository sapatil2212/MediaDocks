import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "MediaDocks — paste a link, get the media";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "Universal media downloader",
    title: "Paste a link. Get the media.",
    subtitle:
      "One field for Instagram, Pinterest, X, Facebook and YouTube links. No account, no app.",
  });
}
