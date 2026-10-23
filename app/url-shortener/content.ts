import type { ConverterContent } from "@/components/converters/content-types";

export const content: ConverterContent = {
  features: [
    {
      icon: "link",
      title: "Clean, permanent short links",
      description:
        "A long URL cluttered with tracking parameters becomes a short, readable link that does not expire and carries no interstitial or countdown.",
    },
    {
      icon: "sparkles",
      title: "Custom alias and UTM builder",
      description:
        "Pick a readable slug so people can see where a link goes, and attach UTM campaign tags without hand-editing the query string.",
    },
    {
      icon: "qrcode",
      title: "A QR code for every link",
      description:
        "Each short link comes with a matching QR code, so the same destination works whether it is clicked online or scanned off print.",
    },
  ],
  featureList: [
    "Shorten long URLs into clean, permanent links",
    "Custom alias and built-in UTM campaign builder",
    "Instant QR code for each short link",
    "Safety preview and anonymous aggregate click counts",
  ],
  howTo: [
    {
      title: "Paste the destination",
      body: "Enter the long URL you want to shorten. Optionally choose a custom alias so the slug is readable, and add UTM campaign parameters if you are tracking a specific source.",
    },
    {
      title: "Create the link",
      body: "Generate the short link. The destination is checked and a permanent short URL under the /s/ path is created and stored so it can resolve on every future visit.",
    },
    {
      title: "Share it or scan it",
      body: "Copy the short link to share online, or download the QR code that comes with it for posters, packaging and slides. Visitors are sent straight through with an instant redirect.",
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Paste a URL",
      description: "Add the destination, plus an optional alias and UTM tags.",
    },
    {
      step: 2,
      title: "Shorten",
      description: "A permanent short link is created and stored.",
    },
    {
      step: 3,
      title: "Share or scan",
      description: "Copy the link or download its QR code.",
    },
  ],
  intro: [
    "The URL shortener turns a long, unwieldy web address into a compact link that is easy to print, post and remember. Where a raw URL might run to a line of random characters and tracking tokens, a short link is a handful of characters under the /s/ path that redirects to the same place. That compactness matters wherever space or legibility counts: a link read aloud, printed on a flyer, or shown on a slide is far more usable short than long.",
    "This is the one tool on the site that deliberately keeps something after you use it, and it is worth being plain about why. A short link only works because the mapping between the short slug and its destination is saved — without that stored record there would be nothing to redirect to. So when you create a link, MediaDocks writes a row holding the short code and the destination URL, and it keeps a simple aggregate counter of how many times the link has been followed. That is the entire footprint, and it exists because the feature cannot function otherwise.",
    "What is stored is deliberately minimal and the tracking is deliberately anonymous. The click counter increments a single number; it does not record who clicked, their IP address, their location or their browsing history, so you get a sense of a link's reach without building a profile of the people behind the clicks. A custom alias lets you choose a human-readable slug so recipients can see roughly where a link leads before tapping it, and the UTM builder appends standard campaign parameters to the destination so your own analytics can attribute traffic correctly.",
    "Safety and directness are built into how the links resolve. There is no advertising interstitial and no countdown timer — a visitor is sent on with an immediate redirect. For anyone who wants to check a link first, appending a preview flag to the short URL opens an inspection screen that shows the real destination before visiting, which is a simple defence against the phishing that plagues anonymous shorteners. And because each link pairs with a QR code, the same destination is one tap online and one scan in the physical world.",
  ],
  formats: [
    { label: "Input", value: "Any valid destination URL to shorten." },
    { label: "Short link", value: "A permanent link under the /s/ path, no expiry." },
    { label: "Alias", value: "Optional custom, human-readable slug." },
    { label: "Campaign tags", value: "Built-in UTM parameter builder." },
    { label: "Stored data", value: "The slug-to-URL mapping and an anonymous click count only." },
    { label: "Safety", value: "Instant redirect with an optional destination preview." },
  ],
  useCases: [
    "Replacing a sprawling URL with a short, tidy link that fits cleanly on a printed flyer or business card.",
    "Building a trackable campaign link with UTM tags so your own analytics can credit the right source.",
    "Choosing a readable custom alias so recipients can tell roughly where a link goes before clicking.",
    "Pairing a short link with its QR code so one destination works both online and on packaging.",
  ],
  howToTitle: "Creating a short link, step by step",
  formatsTitle: "What it accepts, produces and stores",
  useCasesTitle: "When a short link is the right tool",
  privacyTitle: "What this tool stores, and what it does not",
  privacyNote:
    "Unlike the image and file converters on MediaDocks, the URL shortener does persist data, because a short link cannot redirect without a saved record. Creating a link stores the short slug, its destination URL and an anonymous aggregate click counter. It does not log who clicks, their IP address, their location or their browsing history, and there are no advertising interstitials. The stored mapping is simply what makes the redirect work — nothing more is retained.",
  faqs: [
    {
      q: "Do my short links ever expire?",
      a: "No. Links created here are permanent and keep resolving indefinitely without a subscription or renewal. Because the slug-to-destination mapping is stored, the redirect continues to work for as long as the link exists, which is exactly why this tool keeps a record rather than discarding one.",
    },
    {
      q: "Is anything stored when I shorten a URL?",
      a: "Yes, and that is by design. A short link only functions because the mapping between the short code and its destination is saved, so MediaDocks stores that pairing along with a simple aggregate click count. It does not store the identity, IP address or browsing history of anyone who follows the link.",
    },
    {
      q: "What does the click tracking actually record?",
      a: "Only a running total of how many times a link has been followed. The counter is a single anonymous number per link; it is not tied to individual visitors, their devices or their location, so you can gauge a link's reach without any profiling of the people clicking it.",
    },
    {
      q: "How does the safety preview work?",
      a: "Adding a preview flag to any short link opens an inspection page that shows the real destination domain and full target URL before you continue. It lets a cautious recipient confirm where a link leads first, which is a practical safeguard against the misuse that affects anonymous link shorteners.",
    },
  ],
  relatedGuides: [
    { slug: "optimizing-media-for-web-and-social", label: "Optimizing media for web and social" },
    {
      slug: "troubleshooting-common-media-playback-errors",
      label: "Troubleshooting common media and link errors",
    },
  ],
  relatedTools: [{ href: "/qr-code-generator", label: "QR code generator — standalone codes" }],
  featuresHeading: "Short, honest links with a built-in QR",
  featuresSubline:
    "Clean permanent links with custom aliases, UTM tags and a matching QR code, with transparent click counts.",
  privacyBannerTitle: "This tool stores the link mapping on purpose",
  privacyBannerBody:
    "A short link needs a saved record to redirect, so MediaDocks stores the slug, its destination and an anonymous aggregate click count. It does not log who clicks, their IP address or their browsing history.",
};
