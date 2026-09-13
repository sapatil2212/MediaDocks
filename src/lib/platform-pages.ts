import type { Platform } from "./media";

/**
 * Content for the per-platform landing pages.
 *
 * `capability` describes what MediaDocks can genuinely do for that platform,
 * measured against live public URLs. The copy on every page is written from
 * these values, so a page can never promise a download the resolver cannot
 * deliver.
 */
export type Capability = "downloads" | "public-only";

export interface PlatformPage {
  slug: string;
  platform: Platform;
  /** Short label used in navigation and internal links. */
  navLabel: string;
  /** Full platform name, including the former name where people still search it. */
  name: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  tagline: string;
  intro: string;
  inputPlaceholder: string;
  keywords: string[];
  capability: Capability;
  /** Headline for the capability panel. */
  capabilityTitle: string;
  /** Plain statement of what you get, shown prominently on the page. */
  capabilityBody: string;
  /** Concrete bullet points: what works, what does not. */
  youGet: string[];
  limits: string[];
  /**
   * Coverage for the distinct things people actually search on this platform
   * ("instagram reel downloader", "instagram post downloader", ...).
   *
   * These live on the one canonical page on purpose. Spinning up a separate thin
   * page per phrase is the definition of a doorway page, which Google's spam
   * policy treats as an abuse and which its 2026 spam updates targeted directly.
   * A single page that answers every variant substantively is both safer and
   * what Google's own guidance points at.
   */
  searchIntents: Array<{
    /** The phrase this block is written for, used as the visible heading. */
    heading: string;
    body: string;
  }>;
  supportedLinks: string[];
  steps: Array<{ title: string; body: string }>;
  faqs: Array<{ q: string; a: string }>;
  related: Platform[];
}

const PAGES: Record<Platform, PlatformPage> = {
  instagram: {
    slug: "/insta-downloader",
    platform: "instagram",
    navLabel: "Instagram",
    name: "Instagram",
    // Titles are kept short on purpose: the layout appends " | MediaDocks" (12
    // chars) and Google truncates the SERP link around 65 characters.
    metaTitle: "Instagram Reel & Post Downloader — MP4 & JPEG",
    metaDescription:
      "Save public Instagram reels as MP4 with audio, pull the sound as MP3, or download post photos as JPEG. No login, no app, no sign up.",
    h1: "Instagram reel & post downloader",
    tagline: "Paste a public Instagram link. Save the reel or the photo.",
    intro:
      "MediaDocks downloads public Instagram reels as MP4 with their audio intact, offers the soundtrack on its own as MP3, and saves post images at the size Instagram serves. Instagram hides a lot behind a login, so links that are not publicly visible report as unavailable rather than failing quietly.",
    inputPlaceholder: "Paste an Instagram reel, post or IGTV link...",
    keywords: [
      "instagram downloader",
      "insta downloader",
      "instagram video downloader",
      "instagram reels downloader",
      "instagram photo downloader",
      "instagram post downloader",
      "ig downloader",
      "download instagram reels",
      "download instagram photos",
      "save instagram images",
      "instagram image download online",
      "instagram downloader without app",
      "instagram reel cover download",
      "instagram thumbnail downloader",
    ],
    capability: "public-only",
    capabilityTitle: "Public reels and photos download; private ones cannot",
    capabilityBody:
      "For a publicly visible reel, MediaDocks reads the video renditions Instagram publishes and saves the MP4 with its audio, or extracts an MP3. Post images download as JPEG. Instagram serves a large share of posts only to signed-in visitors, and those report as unavailable — MediaDocks does not log in, use cookies, or present a cover image as though it were the video.",
    youGet: [
      "Public reels as MP4 at the published resolutions, audio included",
      "The reel's audio on its own as MP3 or the original track",
      "Post and carousel images as JPEG at the size Instagram serves",
      "Caption as the title, plus the creator handle",
    ],
    limits: [
      "Private accounts, close friends and stories are out of scope",
      "Many public-looking posts are still login-walled and will report as unavailable",
      "A cover image is never offered in place of a missing video",
    ],
    searchIntents: [
      {
        heading: "Instagram reel downloader",
        body: "Paste a /reel/ or /reels/ link and MediaDocks lists the MP4 renditions Instagram publishes for it, usually 1080p and a smaller 480p, with the audio already included. Pick a rung and it saves as a single playable file — no screen recording and no watermark added on our side.",
      },
      {
        heading: "Instagram post downloader",
        body: "A /p/ link resolves to the post's image at the size Instagram serves, along with the caption as the title and the creator handle. Carousel posts expose the image Instagram publishes for the post itself; where several images are available each one is listed as its own option.",
      },
      {
        heading: "Instagram photo downloader",
        body: "Photos come back as real JPEG files read from Instagram's CDN, not as re-encoded screenshots. The download is checked against its live content type before it is offered, so a page or a placeholder can never be handed to you with a .jpg name.",
      },
      {
        heading: "Instagram video downloader",
        body: "Feed videos and IGTV (/tv/) links work the same way reels do: the published resolutions are listed and the one you pick is downloaded with audio. If Instagram serves the post only to signed-in visitors, it reports as unavailable rather than returning a broken file.",
      },
      {
        heading: "Instagram reel to MP3",
        body: "Every reel that resolves also offers its soundtrack on its own — MP3 at 128 or 192 kbps, or the original audio track as M4A with no re-encoding. Useful for saving a sound without the video attached.",
      },
    ],
    supportedLinks: [
      "https://www.instagram.com/reel/SHORTCODE/",
      "https://www.instagram.com/reels/SHORTCODE/",
      "https://www.instagram.com/p/SHORTCODE/",
      "https://www.instagram.com/tv/SHORTCODE/",
    ],
    steps: [
      {
        title: "Copy the Instagram link",
        body: "Open the reel or post, tap the share icon and choose Copy link.",
      },
      {
        title: "Paste it above",
        body: "MediaDocks detects Instagram automatically and reads the public post information.",
      },
      {
        title: "Pick a format and save",
        body: "Choose a video resolution, switch to audio for MP3, or download the image, then press Download.",
      },
    ],
    faqs: [
      {
        q: "Can I download an Instagram reel video?",
        a: "Yes, when the reel is publicly visible. It saves as an MP4 with the audio included, at the resolutions Instagram publishes. Reels on private accounts, or ones Instagram only serves to signed-in visitors, report as unavailable.",
      },
      {
        q: "Can I get the audio from a reel as MP3?",
        a: "Yes. Public reels offer their audio track separately, as MP3 or as the original file without re-encoding.",
      },
      {
        q: "Do I need to log in or install anything?",
        a: "No. There is no account, no extension and no app. Paste a public link in your browser and you are done.",
      },
      {
        q: "Does it work with private Instagram accounts?",
        a: "No. Only publicly accessible posts can be read. MediaDocks never uses credentials, cookies or session tokens.",
      },
      {
        q: "Is the Instagram downloader free?",
        a: "Yes, it is free and there is no request limit beyond a light rate limit that keeps the service responsive.",
      },
      {
        q: "Which Instagram links are supported?",
        a: "Reel links (/reel/ and /reels/), post links (/p/) and IGTV links (/tv/) from instagram.com.",
      },
    ],
    related: ["pinterest", "x", "facebook"],
  },

  pinterest: {
    slug: "/pinterest-downloader",
    platform: "pinterest",
    navLabel: "Pinterest",
    name: "Pinterest",
    metaTitle: "Pinterest Photo Downloader — Images & Video Pins",
    metaDescription:
      "Paste a pinterest.com Pin or pin.it link to save the image at its published size, or the MP4 from a video Pin. Free, no login, no sign up.",
    h1: "Pinterest photo & video downloader",
    tagline: "Paste a Pin link. Save the image Pinterest publishes.",
    intro:
      "Pinterest publishes full details for a public Pin — title, description, dimensions and the image on its own CDN — so this is the most complete downloader in MediaDocks. Short pin.it links are expanded through validated redirects before anything is read.",
    inputPlaceholder: "Paste a Pinterest Pin or pin.it link...",
    keywords: [
      "pinterest downloader",
      "pinterest image downloader",
      "pinterest video downloader",
      "pinterest photo download",
      "download pinterest pins",
      "save pinterest images",
      "pin downloader",
      "pin.it downloader",
      "pinterest gif downloader",
      "pinterest idea pin downloader",
      "download pinterest images online",
      "pinterest downloader free",
    ],
    capability: "downloads",
    capabilityTitle: "Full image download",
    capabilityBody:
      "A public Pin resolves to a real image on Pinterest's CDN, so the download button saves the actual file. Video Pins resolve to the published video when Pinterest exposes one for that Pin.",
    youGet: [
      "Pin title and description",
      "Published width and height",
      "The image file from Pinterest's CDN",
      "Video Pin support when a video URL is published",
    ],
    limits: [
      "Secret boards and private Pins cannot be read",
      "Some Pins publish a resized derivative rather than the original — the format is then labelled Preview",
      "Removed Pins return a clear \"we couldn't find this media\" message",
    ],
    searchIntents: [
      {
        heading: "Pinterest photo downloader",
        body: "Paste a Pin link and the photo is saved straight from Pinterest's own CDN at the size the Pin publishes, keeping its original JPEG or PNG encoding. The Pin title and description come back with it so you can tell saved files apart later.",
      },
      {
        heading: "Pinterest image downloader",
        body: "The published width and height are shown before you download, so you know whether you are getting the full-size asset or a resized derivative. When Pinterest only exposes a derivative, the option is labelled Preview instead of being passed off as the original.",
      },
      {
        heading: "Pinterest video downloader",
        body: "Video Pins resolve to the MP4 Pinterest publishes for them, and the audio can be taken separately as MP3. Many Idea Pins publish no video file at all; those report the details and the cover image rather than inventing a stream.",
      },
      {
        heading: "pin.it link downloader",
        body: "Short pin.it links are expanded first, with every redirect hop validated before anything is fetched, and then read as a normal Pin. You can paste the short form directly — there is no need to open it in a browser first.",
      },
    ],
    supportedLinks: [
      "https://www.pinterest.com/pin/PIN_ID/",
      "https://pinterest.co.uk/pin/PIN_ID/",
      "https://pin.it/SHORT_CODE",
    ],
    steps: [
      {
        title: "Copy the Pin link",
        body: "Use the share button on the Pin, or copy the address from your browser.",
      },
      {
        title: "Paste it above",
        body: "pin.it short links are expanded automatically and checked before the Pin is read.",
      },
      {
        title: "Download the image",
        body: "Confirm the preview, then press Download to save the file.",
      },
    ],
    faqs: [
      {
        q: "Can I download Pinterest images in full quality?",
        a: "MediaDocks saves exactly the file Pinterest publishes for that Pin. When that file is a resized derivative, the format is labelled Preview so you know it is not the original.",
      },
      {
        q: "Do pin.it short links work?",
        a: "Yes. The short link is followed to its destination, each redirect hop is validated, and the Pin is then read normally.",
      },
      {
        q: "Can I download Pinterest videos and Idea Pins?",
        a: "When Pinterest publishes a video URL for the Pin, it is offered as a download. Many Idea Pins do not publish one, and in that case you get the details and the cover image.",
      },
      {
        q: "Is a Pinterest account needed?",
        a: "No. Public Pins are read without signing in, and secret boards are never accessible.",
      },
    ],
    related: ["instagram", "x", "facebook"],
  },

  x: {
    slug: "/x-downloader",
    platform: "x",
    navLabel: "X (Twitter)",
    name: "X (formerly Twitter)",
    metaTitle: "Twitter & X Video Downloader — MP4 & Photos",
    metaDescription:
      "Paste a public X or Twitter post link to save its video as MP4 at every published rendition, or its photos as JPEG. Works with x.com and twitter.com.",
    h1: "X (Twitter) downloader",
    tagline: "Paste a public post link. Save the photos or video it contains.",
    intro:
      "MediaDocks reads the public embed data behind an X post and lists every image or video rendition it publishes, with the post text, the author handle and the real pixel dimensions. Both x.com and twitter.com links work.",
    inputPlaceholder: "Paste an X or Twitter post link...",
    keywords: [
      "x video downloader",
      "twitter video downloader",
      "twitter downloader",
      "x downloader",
      "download twitter videos",
      "twitter image downloader",
      "twitter photo downloader",
      "x photo downloader",
      "twitter gif downloader",
      "download x videos online",
      "twitter mp4 downloader",
      "save twitter media",
    ],
    capability: "downloads",
    capabilityTitle: "Photos and video renditions",
    capabilityBody:
      "Public posts expose their media on X's own CDN, so downloads are real files. Multi-photo posts list every image separately, and video posts list the published MP4 renditions with the highest quality first.",
    youGet: [
      "Post text as the title and the author handle",
      "Every photo in a multi-image post, listed separately",
      "MP4 renditions for video posts, best quality first",
      "The video's audio on its own as MP3 or the original track",
      "Real pixel dimensions and video duration",
    ],
    limits: [
      "Protected accounts and deleted posts return a clear \"no longer available\" message",
      "Streaming-only manifests (HLS) are not offered — only published MP4 files",
      "Quote-tweeted media belongs to the quoted post, so paste that link instead",
    ],
    searchIntents: [
      {
        heading: "Twitter video downloader",
        body: "Paste a twitter.com or x.com post link and every MP4 rendition the post publishes is listed, highest quality first, typically 720p down to 320p. Old twitter.com and mobile.twitter.com links behave identically to x.com ones.",
      },
      {
        heading: "X video downloader",
        body: "The file you pick is the MP4 X serves from its own CDN, downloaded as-is with no re-encoding. Streaming-only HLS manifests are deliberately excluded, because a .m3u8 playlist is not a file you can save and play.",
      },
      {
        heading: "Twitter photo downloader",
        body: "Photo posts return real JPEGs at their published pixel dimensions. A post carrying several images lists each one separately, so you can download them one after another by switching the selection.",
      },
      {
        heading: "Twitter video to MP3",
        body: "Any post whose video resolves also offers audio-only output: MP3 at your choice of bitrate, or the original track untouched. Handy for pulling a clip's audio without keeping the video.",
      },
    ],
    supportedLinks: [
      "https://x.com/USERNAME/status/POST_ID",
      "https://twitter.com/USERNAME/status/POST_ID",
      "https://mobile.twitter.com/USERNAME/status/POST_ID",
    ],
    steps: [
      {
        title: "Copy the post link",
        body: "Use Copy link on the post, or copy the address bar from the post page.",
      },
      {
        title: "Paste it above",
        body: "x.com and twitter.com are both recognised, and tracking parameters are stripped.",
      },
      {
        title: "Pick a format",
        body: "Choose the image or video rendition you want, then press Download.",
      },
    ],
    faqs: [
      {
        q: "Can I download a Twitter video as MP4?",
        a: "Yes, when the post publishes MP4 renditions. They are listed from highest to lowest quality and the file you pick is streamed straight to your device.",
      },
      {
        q: "Do old twitter.com links still work?",
        a: "Yes. twitter.com and mobile.twitter.com links are treated exactly like x.com links.",
      },
      {
        q: "How do I download all images from a multi-photo post?",
        a: "Every image is listed as its own format. Download one, then switch the selection to the next image.",
      },
      {
        q: "Why does a post say it is no longer available?",
        a: "That is what X reports for deleted posts and protected accounts. MediaDocks passes the real answer through instead of guessing.",
      },
    ],
    related: ["instagram", "pinterest", "facebook"],
  },

  facebook: {
    slug: "/fb-downloader",
    platform: "facebook",
    navLabel: "Facebook",
    name: "Facebook",
    metaTitle: "Facebook Video Downloader — Public MP4 & MP3",
    metaDescription:
      "Paste a public Facebook video, reel or fb.watch link and save it as MP4, or take the audio as MP3. Public posts only — no login, no sign up.",
    h1: "Facebook video downloader",
    tagline: "Paste a public Facebook link. Save the video as MP4.",
    intro:
      "MediaDocks downloads Facebook videos and reels that are genuinely public, at the resolutions Facebook publishes, and can pull the audio out as MP3. Facebook keeps a large share of its content behind a login, so this page is explicit about which links work and which will report as unavailable.",
    inputPlaceholder: "Paste a Facebook video, reel or fb.watch link...",
    keywords: [
      "facebook video downloader",
      "fb video downloader",
      "fb downloader",
      "download facebook video",
      "facebook reel downloader",
      "fb watch downloader",
      "facebook mp4 download",
      "facebook video to mp3",
      "save facebook videos online",
      "public facebook video download",
    ],
    capability: "public-only",
    capabilityTitle: "Public videos download; login-walled ones cannot",
    capabilityBody:
      "When a Facebook video is visible to anyone without signing in, MediaDocks reads its published streams and saves the file. When the post is limited to friends, a private group, or is a story, no public stream exists — that link reports as unavailable rather than producing a broken file. MediaDocks does not sign in or use cookies to get around it.",
    youGet: [
      "Public videos and reels as MP4 at the published resolutions",
      "Audio extracted as MP3, or the original track",
      "Title and reaction summary as published on the page",
      "A clear unavailable state for anything behind a login",
    ],
    limits: [
      "Friends-only posts, private groups and stories cannot be read without an account",
      "Some public videos still withhold their streams to signed-out visitors",
      "Dead fb.watch links report that the link is no longer available",
      "Single downloads are capped at 500 MB",
    ],
    searchIntents: [
      {
        heading: "Facebook video downloader",
        body: "Paste a facebook.com/watch or /videos/ link and the published MP4 renditions are listed for you to choose from. This works for videos that are genuinely public — anything limited to friends or a private group has no public stream to read.",
      },
      {
        heading: "Facebook reel downloader",
        body: "Reel links (/reel/) resolve the same way as Watch videos, returning the MP4 with its audio intact. The title and reaction summary Facebook publishes on the page come back alongside it.",
      },
      {
        heading: "fb.watch link downloader",
        body: "Short fb.watch links are expanded through validated redirects before anything is fetched, then read as the underlying video page. If the target has been removed, you get a clear \"no longer available\" message instead of a silent failure.",
      },
      {
        heading: "Facebook video to MP3",
        body: "Public Facebook videos also offer audio-only output, as MP3 at a bitrate you pick or as the original track. The video streams are never downloaded when you choose audio, so it finishes considerably faster.",
      },
    ],
    supportedLinks: [
      "https://www.facebook.com/watch/?v=VIDEO_ID",
      "https://www.facebook.com/PAGE/videos/VIDEO_ID",
      "https://www.facebook.com/reel/REEL_ID",
      "https://fb.watch/SHORT_CODE/",
    ],
    steps: [
      {
        title: "Copy the Facebook link",
        body: "Use the share menu on the video and choose Copy link.",
      },
      {
        title: "Paste it above",
        body: "fb.watch short links are expanded through validated redirects first.",
      },
      {
        title: "Pick a format and save",
        body: "Choose the MP4 rendition you want, or switch to audio for MP3, then press Download.",
      },
    ],
    faqs: [
      {
        q: "Can I download Facebook videos as MP4?",
        a: "Yes, when the video is genuinely public. MediaDocks reads the streams Facebook publishes to signed-out visitors and saves the file directly.",
      },
      {
        q: "Why does my Facebook link say it is unavailable?",
        a: "Almost always because the post is not fully public — friends-only posts, private groups and stories have no publicly published stream. MediaDocks will not sign in or use cookies to reach them.",
      },
      {
        q: "Can I get just the audio from a Facebook video?",
        a: "Yes. Public videos offer an audio-only option, including MP3, alongside the video renditions.",
      },
      {
        q: "Do fb.watch short links work?",
        a: "Yes, they are expanded to the real page first. If the target is gone, you get a clear \"no longer available\" message.",
      },
    ],
    related: ["instagram", "x", "pinterest"],
  },

  youtube: {
    slug: "/yt-downloader",
    platform: "youtube",
    navLabel: "YouTube",
    name: "YouTube",
    metaTitle: "YouTube Video Downloader — 4K to 144p MP4 or MP3",
    metaDescription:
      "Paste any YouTube, Shorts or youtu.be link and save it as MP4 from 144p up to 4K, or take the audio as MP3 or original M4A. Free, no sign up.",
    h1: "YouTube video downloader",
    tagline: "Paste a YouTube link. Pick any resolution, or take just the audio.",
    intro:
      "MediaDocks reads the formats YouTube publishes for a public video and offers each one as a download: the full resolution ladder as MP4, the original audio track as M4A, and MP3 at your choice of bitrate. Video and audio streams are combined server-side, so what you save is a single ready-to-play file.",
    inputPlaceholder: "Paste a YouTube, Shorts or youtu.be link...",
    keywords: [
      "youtube video downloader",
      "youtube downloader",
      "yt downloader",
      "youtube to mp3",
      "youtube mp3 converter",
      "youtube 4k downloader",
      "youtube 1080p downloader",
      "download youtube shorts",
      "youtube audio downloader",
      "youtu.be downloader",
      "youtube mp4 download",
      "free youtube downloader no sign up",
    ],
    capability: "downloads",
    capabilityTitle: "Every resolution the video has, plus audio-only",
    capabilityBody:
      "YouTube serves high resolutions as separate video and audio streams. MediaDocks fetches both and combines them with FFmpeg into one MP4, which is why 1080p and 4K are available rather than just the low progressive format. Audio-only downloads skip the video entirely. Nothing here bypasses a login, an age gate or DRM — only what a signed-out visitor can already play.",
    youGet: [
      "MP4 at every published rung: 2160p, 1440p, 1080p, 720p, 480p, 360p, 240p, 144p",
      "The original audio track as M4A, with no re-encoding",
      "MP3 at 128, 192 or 320 kbps, capped at the source bitrate",
      "Exact title, channel, duration and thumbnail",
    ],
    limits: [
      "Private, age-restricted, members-only and removed videos report as unavailable",
      "Live streams in progress are not downloadable",
      "The resolution list follows the source — a 720p upload will not offer 1080p",
      "Single downloads are capped at 500 MB; pick a lower rung for very long videos",
    ],
    searchIntents: [
      {
        heading: "YouTube video downloader",
        body: "Paste any watch link and every resolution the upload actually contains is listed — 2160p, 1440p, 1080p, 720p, 480p, 360p, 240p and 144p on a 4K source. Whatever you pick arrives as one finished MP4 with audio, not as separate files to join yourself.",
      },
      {
        heading: "YouTube audio downloader",
        body: "Skip the video entirely and take the soundtrack: the original AAC track as M4A with no re-encoding, or MP3 at 128, 192 or 320 kbps. Audio-only downloads are far quicker because no video stream is fetched at all. There is a dedicated walkthrough on the YouTube to MP3 page.",
      },
      {
        heading: "YouTube Shorts downloader",
        body: "Shorts links (/shorts/) resolve to the same video id as a watch link and behave identically, returning the vertical MP4 at the resolutions published for it. youtu.be and /embed/ forms work too.",
      },
      {
        heading: "YouTube 4K and 1080p downloader",
        body: "YouTube serves anything above 360p as separate video and audio streams, which is why many tools quietly cap out at 360p. MediaDocks fetches both and combines them with FFmpeg before sending the file, so 1080p and 4K are genuinely available when the upload has them.",
      },
    ],
    supportedLinks: [
      "https://www.youtube.com/watch?v=VIDEO_ID",
      "https://youtu.be/VIDEO_ID",
      "https://www.youtube.com/shorts/VIDEO_ID",
      "https://www.youtube.com/embed/VIDEO_ID",
    ],
    steps: [
      {
        title: "Copy the YouTube link",
        body: "Any watch, Shorts, embed or youtu.be link works, with or without a timestamp.",
      },
      {
        title: "Paste it above",
        body: "Tracking parameters are removed while the video id is preserved.",
      },
      {
        title: "Pick a resolution or MP3",
        body: "Choose a rung from the video list, or switch to audio for M4A or MP3, then press Download.",
      },
    ],
    faqs: [
      {
        q: "Can I download YouTube videos in 1080p or 4K?",
        a: "Yes, when the video was uploaded at that resolution. YouTube serves those rungs as separate video and audio streams, and MediaDocks combines them into a single MP4 before sending it to you.",
      },
      {
        q: "Can I convert a YouTube video to MP3?",
        a: "Yes. Every video offers MP3 at 128, 192 or 320 kbps, plus the original M4A track if you would rather avoid re-encoding. The MP3 options stop at the source bitrate, since encoding above it only adds file size.",
      },
      {
        q: "Do Shorts and youtu.be links work?",
        a: "Yes. Watch, Shorts, embed and youtu.be links all resolve to the same video id and behave identically.",
      },
      {
        q: "Why does a 1080p download take longer than 360p?",
        a: "360p is often a single ready-made file, while 1080p and above must be fetched as two streams and combined. A 10-minute 1080p video takes roughly two minutes end to end.",
      },
      {
        q: "Can I download age-restricted or private videos?",
        a: "No. MediaDocks reads only what a signed-out visitor can already watch, and it does not sign in or work around age gates, private settings or DRM.",
      },
    ],
    related: ["instagram", "pinterest", "x"],
  },
};

export const PLATFORM_PAGES: PlatformPage[] = [
  PAGES.instagram,
  PAGES.pinterest,
  PAGES.x,
  PAGES.facebook,
  PAGES.youtube,
];

export function getPlatformPage(platform: Platform): PlatformPage {
  return PAGES[platform];
}

/** Short capability label used on cards and internal links. */
export const CAPABILITY_LABEL: Record<Capability, string> = {
  downloads: "Video + audio download",
  "public-only": "Public posts only",
};
