import type { Platform } from "./media";

export interface PlatformMeta {
  id: Platform;
  name: string;
  /** tailwind text color class using the platform token */
  colorClass: string;
  description: string;
  status: "available" | "soon";
  hosts: string[];
  /**
   * A real, public URL used by the "try an example" affordance.
   *
   * These must actually resolve: earlier placeholders like
   * `instagram.com/reel/demo` loaded a link that could never work, which made
   * the feature look broken. Each one below was downloaded successfully against
   * the live engine.
   */
  exampleUrl: string;
  /** What the example is, so the button is not a blind action. */
  exampleLabel: string;
  /** What the platform actually yields, shown in the capability table. */
  outputs: string;
}

export const PLATFORMS: PlatformMeta[] = [
  {
    id: "youtube",
    name: "YouTube",
    colorClass: "text-brand-youtube",
    description: "Full resolution ladder plus audio-only MP3 and M4A.",
    status: "available",
    hosts: ["youtube.com", "m.youtube.com", "youtu.be"],
    exampleUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    exampleLabel: "Blender's Big Buck Bunny, up to 4K",
    outputs: "144p → 4K MP4 · M4A · MP3",
  },
  {
    id: "instagram",
    name: "Instagram",
    colorClass: "text-brand-instagram",
    description: "Public reels as MP4 with audio, and post images.",
    status: "available",
    hosts: ["instagram.com", "instagr.am"],
    exampleUrl: "https://www.instagram.com/reel/DNZXfV7uI2N",
    exampleLabel: "A public reel, 1080p",
    outputs: "Reel MP4 · MP3 · JPEG",
  },
  {
    id: "x",
    name: "X",
    colorClass: "text-brand-x",
    description: "Post videos at every published rendition, and photos.",
    status: "available",
    hosts: ["x.com", "twitter.com"],
    exampleUrl: "https://x.com/youhaveagift/status/1735368654609629240",
    exampleLabel: "A post with video",
    outputs: "MP4 renditions · MP3 · JPEG",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    colorClass: "text-brand-pinterest",
    description: "Pin images at published size, and video Pins.",
    status: "available",
    hosts: ["pinterest.com", "pinterest.ca", "pin.it"],
    exampleUrl: "https://www.pinterest.com/pin/350295677252925156/",
    exampleLabel: "An image Pin",
    outputs: "JPEG / PNG · video Pin MP4",
  },
  {
    id: "facebook",
    name: "Facebook",
    colorClass: "text-brand-facebook",
    description: "Public videos and reels as MP4, when not behind a login.",
    status: "available",
    hosts: ["facebook.com", "fb.watch", "m.facebook.com"],
    exampleUrl: "https://www.facebook.com/watch/?v=10153231379946729",
    exampleLabel: "A public Watch video",
    outputs: "MP4 · MP3",
  },
];

export function getPlatform(id: Platform) {
  return PLATFORMS.find((p) => p.id === id)!;
}

function normalize(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProtocol);
  } catch {
    return null;
  }
}

export interface DetectionResult {
  /** the url looks structurally like a url */
  isUrl: boolean;
  platform: PlatformMeta | null;
  /** host + path, trimmed for display */
  label: string | null;
}

export function detectPlatform(raw: string): DetectionResult {
  const url = normalize(raw);
  if (!url || !url.hostname.includes(".")) {
    return { isUrl: false, platform: null, label: null };
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const platform =
    PLATFORMS.find((p) => p.hosts.some((h) => host === h || host.endsWith(`.${h}`))) ?? null;
  const path = url.pathname === "/" ? "" : url.pathname;
  const label = `${host}${path}${url.search}`.slice(0, 72);
  return { isUrl: true, platform, label };
}
