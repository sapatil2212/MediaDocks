/**
 * Full FAQ knowledge base for /faq.
 *
 * Deliberately separate from `FAQ_ITEMS` in components/sections/FAQSection.tsx.
 * That array is the eight-question summary shown on the home page; this is the
 * long-form reference. Keeping them distinct is the point — rendering the home
 * page accordion on /faq made the route a duplicate with no independent value.
 *
 * Every answer here has to stay factually true against the real pipeline,
 * because /faq publishes FAQPage structured data. Numbers quoted below come
 * from lib/config.ts defaults: 500 MB per download, a 30-minute resolved-link
 * TTL, 10 resolves and 5 downloads per minute, 100 MB / 2 hours for AI
 * transcription.
 */

export interface FaqEntry {
  q: string;
  a: string;
}

export interface FaqCategory {
  id: string;
  label: string;
  /** Shown under the category heading to frame the questions that follow. */
  blurb: string;
  items: FaqEntry[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "getting-started",
    label: "Getting started",
    blurb:
      "What MediaDocks is, what it costs, and what you need before you paste a link.",
    items: [
      {
        q: "What is MediaDocks?",
        a: "MediaDocks is a browser-based media utility with two halves. The first reads a public link from YouTube, Instagram, X, Pinterest or Facebook and offers the video, audio or image that link publishes. The second works on files you already have: it transcribes speech to text, generates timed subtitles, and summarises long recordings. Everything runs server-side and streams back to you — there is nothing to install.",
      },
      {
        q: "Do I need to create an account?",
        a: "No. There is no sign-up, no email capture and no password. The tools are reachable directly from the page you land on. Because there are no accounts, there is also no profile, no history and no saved library — each request stands on its own.",
      },
      {
        q: "Is it free, and is there a catch?",
        a: "It is free to use and there is no paid tier, no trial clock and no feature held back behind a wall. The practical ceiling is a light rate limit — ten link resolves and five downloads per minute — which exists to keep the service responsive rather than to upsell you.",
      },
      {
        q: "Which browsers and devices work?",
        a: "Any current browser on any operating system: Chrome, Firefox, Safari and Edge on desktop, plus mobile Safari and Chrome on iOS and Android. JavaScript needs to be enabled. There is no desktop app, no browser extension and no mobile app, and we do not publish one — if you find something claiming to be a MediaDocks app, it is not ours.",
      },
      {
        q: "Do I need to install FFmpeg or yt-dlp myself?",
        a: "No. Those run on the server as part of the extraction pipeline. You only ever interact with a web page.",
      },
      {
        q: "How do I report a bug or ask for a platform to be added?",
        a: "Use the contact page. Bug reports are most useful when they include the kind of link you used (you do not need to send the link itself), the format you picked, and the exact message you saw.",
      },
    ],
  },
  {
    id: "formats-quality",
    label: "Formats & video quality",
    blurb:
      "How the resolution list is built, why it varies between links, and which rung to pick.",
    items: [
      {
        q: "How is the resolution list decided?",
        a: "It is read from the source, never assumed. When a link resolves, the pipeline enumerates the renditions the platform actually publishes for that specific item and lists exactly those. This is why two YouTube links can offer different ladders: a video uploaded at 720p will never show a 1080p option, because inventing one would mean upscaling and handing you a larger file with no extra detail.",
      },
      {
        q: "Why does 1080p or 4K take longer than 360p?",
        a: "Above roughly 360p, YouTube and several other platforms stop serving a single combined file and instead publish video and audio as separate streams — the DASH model. To give you one playable file, the server fetches both and muxes them with FFmpeg before the first byte reaches your browser. A 360p download often needs no muxing at all, so it starts almost immediately. As a rough guide, a ten-minute 1080p video takes about two minutes end to end.",
      },
      {
        q: "What is the difference between MP4 and WebM here?",
        a: "MP4 is the default because it plays essentially everywhere without codec packs, and it is what desktop editors expect. WebM with VP9 or AV1 is typically 20–35% smaller at comparable visual quality, but support on older iOS webviews and legacy players is patchier. Our guide on MP4 versus WebM goes through the trade-off properly.",
      },
      {
        q: "Will the download have a watermark?",
        a: "Nothing is added on our side. You get the stream as the platform published it. If the creator burned a watermark into the video itself before uploading, that is part of the picture data and cannot be removed by re-downloading.",
      },
      {
        q: "Is the video re-encoded, so does quality drop?",
        a: "No re-encode happens for video. The published streams are copied and, when necessary, remuxed into an MP4 container — the picture data is bit-for-bit what the platform served. Remuxing changes the wrapper, not the frames. The only place re-encoding occurs is MP3 audio, which is lossy by definition.",
      },
      {
        q: "Can I download a whole playlist or channel at once?",
        a: "No. Each request handles one link. Bulk playlist and channel extraction is deliberately out of scope — it is the pattern most likely to be used for wholesale republishing, and it puts heavy sustained load on both the source platform and this service.",
      },
      {
        q: "What resolution should I actually pick?",
        a: "For watching on a phone, 720p is usually indistinguishable from 1080p and roughly half the size. For a laptop or TV, 1080p is the sweet spot. Reach for 1440p or 2160p only if you are editing, projecting, or cropping into the frame, since 4K files are several times larger for a difference most screens cannot show.",
      },
    ],
  },
  {
    id: "audio-mp3",
    label: "Audio & MP3",
    blurb: "Extracting sound on its own, bitrate choices, and when a conversion is pointless.",
    items: [
      {
        q: "How do I get only the audio from a video?",
        a: "Resolve the link as usual, then switch the format selection from video to audio. You will be offered the original audio track as M4A plus MP3 at 128, 192 or 320 kbps. Choosing audio skips the video streams entirely, so it finishes considerably faster than any video rung.",
      },
      {
        q: "Should I pick M4A or MP3?",
        a: "Pick M4A when you just want the sound and your player supports it — it is the original track, copied without a second round of compression, so it is both smaller and cleaner than any MP3 you could make from it. Pick MP3 when you need maximum compatibility with older hardware, car stereos, DJ software or devices that refuse AAC.",
      },
      {
        q: "Is 320 kbps worth it over 192?",
        a: "Usually not, and sometimes it is actively meaningless. MP3 rungs are capped at the source bitrate: if the platform only published a 128 kbps AAC track, asking for 320 kbps MP3 cannot invent detail that was discarded before we ever saw the file. It just produces a bigger file. For speech and podcasts, 128 kbps is genuinely sufficient; for music you care about, 192 is a sensible default.",
      },
      {
        q: "Does converting to MP3 lose quality?",
        a: "Yes, slightly, and unavoidably. The source track is already lossy, so encoding it to MP3 is a second lossy pass — generational loss. It is rarely audible at 192 kbps or above on normal listening equipment, but if you want to avoid it entirely, take the original M4A instead.",
      },
      {
        q: "Does the MP3 keep the title and artwork?",
        a: "The title and creator name are carried through as tags where the source publishes them. Treat embedded artwork as best-effort rather than guaranteed, since not every platform exposes a usable cover image alongside the audio stream.",
      },
    ],
  },
  {
    id: "ai-tools",
    label: "AI transcription, subtitles & summaries",
    blurb:
      "How the speech-to-text pipeline works, what it costs you in accuracy, and where its limits sit.",
    items: [
      {
        q: "How accurate is the transcription?",
        a: "On clear single-speaker audio in a common accent, expect accuracy in the mid-to-high nineties — good enough to publish after a skim. Accuracy falls with background music, crosstalk, heavy reverb, phone-quality recordings and dense technical jargon or proper nouns the model has not seen. Treat every transcript as a strong first draft, not a finished record, and never as a substitute for a certified transcript in a legal or medical setting.",
      },
      {
        q: "What are the file size and length limits for transcription?",
        a: "100 MB per upload and two hours of duration. Before analysis, audio is normalised to 16 kHz mono and chunked, which is why a long recording can sit in a processing state for a while. If your file is over the limit, extracting audio first is usually enough on its own — the audio track of a video is a small fraction of its total size.",
      },
      {
        q: "Which languages are supported?",
        a: "The model detects the spoken language automatically and handles the major world languages well, with quality broadly tracking how much training material exists for a given language. Code-switching mid-sentence between two languages is where it struggles most.",
      },
      {
        q: "What is the difference between SRT and VTT subtitles?",
        a: "Both are plain-text files pairing timecodes with lines of dialogue, and both are offered. SRT is the older and more universally accepted format — video editors, desktop players and most social platforms take it without complaint. WebVTT is the HTML5 standard, required by the browser's native <track> element, and supports styling and positioning that SRT cannot express. If you are uploading to a platform, send SRT; if you are embedding video on your own site, use VTT.",
      },
      {
        q: "Can I correct the transcript before downloading?",
        a: "Yes. The result opens in an editor so you can fix names, punctuation and misheard terms, then copy it or download it as a file. Proofreading is worth the few minutes, especially for proper nouns.",
      },
      {
        q: "Is my uploaded file used to train an AI model?",
        a: "No. Your audio is sent to the transcription provider to produce your result and nothing else. We do not retain it afterwards, we do not build a dataset from it, and we do not use it to improve any model. See the privacy page for the full detail on third-party processing.",
      },
      {
        q: "What does the summariser actually produce?",
        a: "A condensed overview of a recording, with key points and any action items it can identify, aimed at meetings, lectures and interviews where you need the substance without re-listening. It is a reading aid. For anything consequential, check the summary against the transcript rather than trusting it blind.",
      },
    ],
  },
  {
    id: "privacy",
    label: "Privacy & data handling",
    blurb: "What is kept, what is not, and for how long.",
    items: [
      {
        q: "Are my downloads or uploads stored on your server?",
        a: "No media is kept. A download is assembled in a request-scoped temporary location, streamed to your browser and deleted. Uploaded audio is processed and discarded the same way. There is no media library, no archive and no cache of finished files to browse or leak.",
      },
      {
        q: "Do you log the links I paste?",
        a: "The URL itself is not recorded. Usage measurement stores only which platform a request belonged to — enough to know that, say, Pinterest is heavily used, and not enough to reconstruct what anyone looked at.",
      },
      {
        q: "Do you store my IP address?",
        a: "Not in the analytics record. Visitors are counted using a salted digest that rotates daily, which means the same person on two different days cannot be linked, and the value cannot be reversed back into an address. An IP is necessarily visible to the server while a request is in flight, as it is for any website, but it is not written into the usage data.",
      },
      {
        q: "How long does a resolved link stay valid?",
        a: "Thirty minutes. After that the descriptor expires and you will be asked to paste the URL again. The short window is why nothing has to persist on disk.",
      },
      {
        q: "Do you use tracking cookies or sell data?",
        a: "No tracking or advertising cookies are set by us, and nothing is sold or shared with data brokers. If you have not visited the admin area, the site does not set a session cookie at all.",
      },
      {
        q: "Who else can see my data?",
        a: "Two necessary parties. The source platform sees a request for public content, as it would for any visitor. For AI features, the transcription provider receives your audio to process it. No one else is in the path, and the privacy page names both.",
      },
    ],
  },
  {
    id: "limits-errors",
    label: "Limits & error messages",
    blurb: "The hard caps, and what each failure message actually means.",
    items: [
      {
        q: "What are the exact limits?",
        a: "500 MB per download, one hour of source duration for extraction, 100 MB and two hours for AI transcription, ten link resolves per minute and five downloads per minute. Resolved links expire after thirty minutes.",
      },
      {
        q: "Why does it say the file is larger than the limit?",
        a: "The rendition you chose exceeds 500 MB. Drop a rung — 1080p instead of 4K, or 720p instead of 1080p — or take audio only, which is a small fraction of the size. The cap exists so one very large request cannot monopolise the pipeline.",
      },
      {
        q: "Why does my link say the content is private or unavailable?",
        a: "Because that is genuinely what the platform reports to a signed-out visitor. The usual causes are a private or restricted account, a friends-only or group-only post, an age gate, a story, or a deleted item. Instagram and Facebook in particular serve a large share of normal-looking posts only to logged-in users. We pass the real answer through rather than guessing or substituting a cover image for a missing video.",
      },
      {
        q: "Why am I being asked to wait and try again?",
        a: "You hit the per-minute rate limit. Wait around forty-five seconds and continue. It is applied per visitor and is not a penalty.",
      },
      {
        q: "The download sat on 'Preparing' for a long time. Is it stuck?",
        a: "Most likely it was muxing. High resolutions need separate video and audio streams fetched and combined before streaming starts, which can take fifteen to sixty seconds on a long HD video. If it runs far past that, resolve the link again — the descriptor may have expired mid-request.",
      },
      {
        q: "Why can I not download a live stream?",
        a: "A stream in progress has no finished file to copy, only a rolling manifest. For the same reason, streaming-only HLS playlists are excluded on X: an .m3u8 file is a list of segment pointers, not something you can save and play. Once a live stream ends and the platform publishes a normal recording, the link behaves like any other video.",
      },
      {
        q: "Why did the resolution list change between two attempts?",
        a: "Platforms occasionally finish transcoding higher rungs after publication, and some vary what they expose to signed-out requests. If a rung you expected is missing, waiting a short while and resolving again sometimes surfaces it.",
      },
    ],
  },
  {
    id: "legal",
    label: "Legal & responsible use",
    blurb:
      "What this tool is for, what it refuses to do, and where your responsibility begins.",
    items: [
      {
        q: "Is downloading a video legal?",
        a: "It depends entirely on the content, your jurisdiction and your purpose, and nothing here is legal advice. Saving your own uploads, material published under a permissive licence such as Creative Commons, public-domain works, or content whose rightsholder has given you permission is generally fine. Copying someone else's copyrighted video to republish, redistribute or monetise is generally not, regardless of the tool used. Many platforms, YouTube among them, also prohibit downloading in their own terms of service, which is a contractual matter between you and that platform. If you are unsure about a specific file, assume it is restricted and get permission.",
      },
      {
        q: "What does MediaDocks refuse to do?",
        a: "It does not sign in, present credentials, replay cookies or use session tokens, so private and follower-only content stays out of reach. It does not bypass age gates, paywalls, CAPTCHA or DRM. It does not decrypt protected streams from subscription services. It reads only what an ordinary signed-out visitor could already load, and when that is nothing, it says so instead of working around the restriction.",
      },
      {
        q: "Who is responsible for how I use a downloaded file?",
        a: "You are. MediaDocks is a general-purpose utility, like a browser or a file manager, and it has no way to know whether you hold rights to a given item. Deciding whether you may save, keep or reuse something is your call and your liability. The terms of service set this out directly.",
      },
      {
        q: "I am a rightsholder and I want something addressed.",
        a: "Use the copyright and DMCA page. Because no media is ever stored on our servers, there is no hosted copy for us to take down — but we do act on reports by blocking specific sources where that is the appropriate remedy, and the page explains the process and what to include in a notice.",
      },
      {
        q: "Can I use downloaded media commercially?",
        a: "Only if you hold the rights or the licence permits it. The file arriving on your device grants you no rights you did not already have. Commercial reuse of third-party media without clearance is the single most common way people get themselves into trouble, and it is worth checking the licence before you build anything around a clip.",
      },
      {
        q: "Why does the site tell me what it cannot do so prominently?",
        a: "Because the alternative is wasting your time. A tool that implies it can reach private posts, then fails silently or hands you a cover image labelled as a video, is worse than one that is specific about its scope up front. Each platform page lists what works and what does not for that platform, checked against live public links rather than guessed.",
      },
    ],
  },
];

/** Flattened list for FAQPage structured data. */
export const ALL_FAQ_ITEMS: FaqEntry[] = FAQ_CATEGORIES.flatMap(
  (category) => category.items,
);
