import type { Platform, PublicResolveResult } from "@/lib/platforms/types";

/**
 * MOCK_RESOLVER=true results.
 *
 * No external request is made. `mediaId` is absent because no real media exists,
 * and `isMock` is set so demo data can never be mistaken for a real resolution.
 * The demo files under /public/demo are genuinely of the type they claim, so the
 * media-type pipeline behaves the same in mock mode.
 */
const templates: Record<Platform, Omit<PublicResolveResult, "sourceUrl">> = {
  instagram: {
    platform: "instagram",
    postKind: "video",
    kind: "Reel",
    title: "Summer memories",
    creator: "@demo_creator",
    thumbnail: "/demo/demo-reel.jpg",
    duration: 24,
    width: 1080,
    height: 1920,
    media: [],
    unavailable: {
      code: "VIDEO_MEDIA_UNAVAILABLE",
      message:
        "Demo mode: Instagram does not publish a video file for reels, so there is nothing to download.",
    },
  },
  youtube: {
    platform: "youtube",
    postKind: "video",
    kind: "Video",
    title: "A calmer way to work — full walkthrough",
    creator: "Demo Channel",
    thumbnail: "/demo/demo-video.jpg",
    duration: 612,
    media: [],
    unavailable: {
      code: "VIDEO_MEDIA_UNAVAILABLE",
      message: "Demo mode: YouTube publishes no downloadable video file.",
    },
  },
  pinterest: {
    platform: "pinterest",
    postKind: "image",
    kind: "Pin",
    title: "Weeknight pasta board",
    creator: "demo_kitchen",
    thumbnail: "/demo/demo-pin.jpg",
    width: 1200,
    height: 1800,
    media: [
      {
        id: "mock-pin-image",
        kind: "image",
        mediaUrl: "/demo/demo-pin.jpg",
        mimeType: "image/jpeg",
        extension: "jpg",
        label: "JPG",
        quality: "Original",
        width: 1200,
        height: 1800,
        downloadable: false,
      },
    ],
  },
  facebook: {
    platform: "facebook",
    postKind: "video",
    kind: "Video",
    title: "Community meetup recap",
    creator: "Demo Page",
    thumbnail: "/demo/demo-video.jpg",
    duration: 148,
    media: [],
    unavailable: {
      code: "VIDEO_MEDIA_UNAVAILABLE",
      message: "Demo mode: Facebook publishes no downloadable video file.",
    },
  },
  x: {
    platform: "x",
    postKind: "image",
    kind: "Post image",
    title: "Shipping notes, thread 1/4",
    creator: "@demo_dev",
    thumbnail: "/demo/demo-photo.jpg",
    width: 1440,
    height: 1440,
    media: [
      {
        id: "mock-x-image",
        kind: "image",
        mediaUrl: "/demo/demo-photo.jpg",
        mimeType: "image/jpeg",
        extension: "jpg",
        label: "JPG",
        quality: "Original",
        width: 1440,
        height: 1440,
        downloadable: false,
      },
    ],
  },
};

export function buildMockResult(
  platform: Platform,
  sourceUrl: string,
  typeHint?: string | null,
): PublicResolveResult {
  const base: PublicResolveResult = { ...templates[platform], sourceUrl, isMock: true };

  if (platform === "instagram" && (typeHint === "post" || typeHint === "photo")) {
    return {
      ...base,
      postKind: "image",
      kind: "Photo",
      title: "Quiet corner",
      thumbnail: "/demo/demo-photo.jpg",
      duration: undefined,
      width: 1440,
      height: 1440,
      unavailable: undefined,
      media: [
        {
          id: "mock-ig-image",
          kind: "image",
          mediaUrl: "/demo/demo-photo.jpg",
          mimeType: "image/jpeg",
          extension: "jpg",
          label: "JPG",
          quality: "Original",
          width: 1440,
          height: 1440,
          downloadable: false,
        },
      ],
    };
  }

  return base;
}
