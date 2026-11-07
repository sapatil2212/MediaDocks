/**
 * Long-form FAQ for /faq.
 *
 * Separate from `FAQ_ITEMS` in components/sections/FAQSection.tsx, which is the
 * short home-page summary. Every answer has to stay true against the code,
 * because /faq publishes FAQPage structured data. Numbers quoted here come from
 * lib/config.ts defaults (100 MB and 2 hours for AI transcription) or from the
 * tool pages themselves; anything that cannot be traced to code is left out.
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
    blurb: "What MediaDocks is and what you need to use it.",
    items: [
      {
        q: "What is MediaDocks?",
        a: "MediaDocks is a set of browser-based media tools. One group works on speech: it transcribes audio and video, generates timed subtitles and summarizes recordings. Another group converts and edits images and documents. A library of guides explains the formats behind the tools.",
      },
      {
        q: "Do I have to create an account?",
        a: "No. There is no sign-up and no password. Each tool opens directly, and there is no saved history tied to you.",
      },
      {
        q: "Which browsers work?",
        a: "Current versions of Chrome, Edge, Firefox and Safari on desktop and mobile. JavaScript has to be enabled. Some tools, such as the Background Remover, depend on modern browser features and may be slower on older devices.",
      },
      {
        q: "How do I report a bug or ask for a change?",
        a: "Use the contact page. A short description of the tool, the file type you used and the message you saw is the most useful thing to include. You do not need to send the file itself.",
      },
    ],
  },
  {
    id: "ai-tools",
    label: "Transcription, subtitles & summaries",
    blurb: "How the speech tools behave, and where their limits sit.",
    items: [
      {
        q: "How accurate is a transcript?",
        a: "Accuracy depends on the recording. Clear speech from one person transcribes well. Background music, crosstalk, echo, phone-quality audio and unusual names make mistakes more likely. Read through the result in the editor before you rely on it, and do not treat it as a certified transcript.",
      },
      {
        q: "What are the upload limits for transcription?",
        a: "By default an upload can be up to 100 MB and two hours long. Audio is converted to a lower-rate mono format and sent in sequential pieces, so a long recording can stay in a processing state for a while. If a video is over the size limit, extracting its audio first usually brings it under.",
      },
      {
        q: "Which languages are supported?",
        a: "The spoken language is detected automatically. Widely spoken languages generally work better than rare ones, and switching languages mid-sentence is the hardest case.",
      },
      {
        q: "What is the difference between SRT and VTT?",
        a: "Both are plain-text files that pair timecodes with lines of dialogue. SRT is accepted by most video editors, players and social platforms. WebVTT is the HTML5 standard used by the browser's track element and can carry styling and positioning that SRT cannot. Send SRT to a platform; use VTT on your own site. The subtitle guide goes into the details.",
      },
      {
        q: "Can I edit a transcript before I download it?",
        a: "Yes. The result opens in an editor so you can correct names and punctuation, then copy it or download it as a file.",
      },
      {
        q: "What does the summarizer produce?",
        a: "A condensed version of a recording in the format you choose, such as an overview, key points, action items or question and answer pairs. It is a reading aid. For anything consequential, check it against the transcript.",
      },
      {
        q: "Is my audio used to train a model?",
        a: "MediaDocks does not use uploads to build a dataset or train models. For AI features, your audio is sent to Google's Gemini API to produce your result; the privacy policy names this processor. Any use of the data by the provider is governed by the provider's own terms, which we do not control.",
      },
    ],
  },
  {
    id: "images-documents",
    label: "Images, PDFs & audio",
    blurb: "The converters and editors that sit beside the speech tools.",
    items: [
      {
        q: "Which tools run in my browser?",
        a: "The image converter, image resizer, PDF to image, image to PDF, SVG to PNG, Base64 and QR code tools run in your browser, and so does the Background Remover after it has loaded its model. Those files are not uploaded to a MediaDocks server.",
      },
      {
        q: "What does Video to Audio do with my file?",
        a: "It uploads the video to the server, extracts the audio track in the format you pick and returns it. The temporary files belong to that request. This is the one converter on the list that needs an upload.",
      },
      {
        q: "Why does the Background Remover take a moment the first time?",
        a: "It downloads an image model from Hugging Face into your browser before it can cut anything out. Your images are not sent there; they are processed on your device.",
      },
      {
        q: "Can I convert many images at once?",
        a: "Yes, within the limits shown on each tool page. The Background Remover can package a batch of results into a single ZIP file.",
      },
    ],
  },
  {
    id: "privacy",
    label: "Privacy & data handling",
    blurb: "What is kept and what is not. The privacy policy has the full detail.",
    items: [
      {
        q: "Are uploads stored on your server?",
        a: "MediaDocks does not keep a media library or an archive of finished files. Uploads that need server processing are handled in a temporary location tied to the request.",
      },
      {
        q: "Do you store IP addresses?",
        a: "Not in the usage records. Visits are counted with a one-way digest built from the IP address, the browser string, a server secret and the calendar date, so the same visitor produces a different value on a different day and the value cannot be turned back into an address. Like any web server, our server sees the IP address of a request while it is handled.",
      },
      {
        q: "Do you use cookies?",
        a: "MediaDocks sets no cookie for visitor measurement. The admin area uses a session cookie for the site operator. A small interface cookie called sidebar_state is used by the admin interface. If advertising is enabled on guide pages, Google and its partners may set advertising cookies as described in the privacy policy, subject to your consent choice where it is required.",
      },
      {
        q: "Who else can see my data?",
        a: "For AI features, Google's Gemini API receives the audio to process it. If advertising is enabled on guide pages, Google as the ad provider receives the data described in the privacy policy. No other third parties are part of the processing path.",
      },
    ],
  },
  {
    id: "rights",
    label: "Rights & responsible use",
    blurb: "Where your responsibility begins.",
    items: [
      {
        q: "Who is responsible for how I use a file?",
        a: "You are. MediaDocks is a general-purpose utility and cannot know whether you hold the rights to a particular file. Only upload, convert or save material that you own, that is licensed for the use you have in mind, or that you have permission to use. The terms of service set this out.",
      },
      {
        q: "I am a rights holder and have a concern.",
        a: "Use the copyright page. It explains what a notice should contain and where to send it.",
      },
    ],
  },
];

/** Flattened list for FAQPage structured data. */
export const ALL_FAQ_ITEMS: FaqEntry[] = FAQ_CATEGORIES.flatMap((category) => category.items);
