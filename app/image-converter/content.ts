import type { ConverterContent } from "@/components/converters/content-types";

export const content: ConverterContent = {
  features: [
    {
      icon: "layers",
      title: "Batch up to 10 files",
      description:
        "Drop a whole folder's worth at once and convert every file to a single target, or override the format on individual items that need something different.",
    },
    {
      icon: "zap",
      title: "Per-file quality control",
      description:
        "A quality slider on lossy targets lets you trade a little fidelity for a much smaller file, and watch the estimated size respond before you commit.",
    },
    {
      icon: "shield",
      title: "Decoded on your device",
      description:
        "Every pixel is read and re-encoded through the browser's own image decoders, so the original photos are never transmitted anywhere.",
    },
  ],
  featureList: [
    "Batch convert up to 10 images in one pass",
    "JPG, PNG, WebP, AVIF, GIF, BMP, SVG and ICO targets",
    "Per-file target format and quality slider",
    "Single-click ZIP of the whole batch",
  ],
  howTo: [
    {
      title: "Add your images",
      body: "Drag up to ten files onto the drop zone or pick them from disk. Mixed input formats are fine — JPG, PNG, WebP, AVIF, GIF, BMP, SVG and ICO are all read the same way.",
    },
    {
      title: "Pick a target format",
      body: "Set one format for the whole batch when you want consistency, or expand a file and give it its own target when a single image needs a different container.",
    },
    {
      title: "Tune quality on lossy targets",
      body: "For JPG, WebP and AVIF a quality slider appears. Lower it to shrink the file and keep an eye on how the preview holds up; PNG and the vector formats stay untouched.",
    },
    {
      title: "Download one file or the ZIP",
      body: "Save a single result directly, or use Download All to get a ZIP that preserves each file's chosen format in one archive.",
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Add your images",
      description: "Drop up to 10 files of any supported type onto the page.",
    },
    {
      step: 2,
      title: "Choose formats",
      description: "Set one target for all, or override the format per file.",
    },
    {
      step: 3,
      title: "Download",
      description: "Grab a single file or the whole batch as a ZIP.",
    },
  ],
  intro: [
    "The image converter re-encodes raster and vector pictures between the formats the modern web actually uses: JPG, PNG, WebP, AVIF, GIF, BMP, SVG and ICO. The reason there are so many containers is that each one makes a different bargain between file size, colour fidelity and transparency, and picking the right one is usually more impactful than any amount of resizing.",
    "The sharpest distinction is lossy versus lossless. JPG and the newer WebP and AVIF are lossy: they discard detail the eye is least likely to miss, which is why a photograph saved as JPG can be a fraction of the size of the same image as PNG. PNG is lossless and keeps an alpha channel, so it is the right home for logos, screenshots and anything with crisp edges or transparency that must survive untouched. WebP and AVIF straddle both worlds — they offer lossless and lossy modes and routinely beat JPG at the same visual quality, which is why converting an older folder of JPGs to AVIF can halve its weight.",
    "A practical rule falls out of that: reach for JPG when you need the widest compatibility for a photo, WebP or AVIF when you control the audience's browsers and want the smallest file, and PNG whenever transparency or pixel-perfect text is non-negotiable. The converter never forces the choice — it simply hands you every target so you can match the format to the job in front of you.",
    "Work is capped at ten files per batch on purpose. Because decoding and re-encoding happen in your browser's memory rather than on a server, a very large batch would compete with everything else the tab is doing; ten keeps conversions fast and the page responsive even on a modest laptop. When you need more, clear the batch and run another — there is no daily quota behind it.",
  ],
  formats: [
    { label: "Input formats", value: "JPG, JPEG, PNG, WebP, AVIF, GIF, BMP, SVG, ICO." },
    { label: "Output formats", value: "JPG, PNG, WebP, AVIF, GIF, BMP, SVG, ICO." },
    {
      label: "Lossy targets",
      value: "JPG, WebP and AVIF expose a quality slider; PNG stays lossless.",
    },
    { label: "Batch size", value: "Up to 10 files per pass, re-runnable with no quota." },
    { label: "Delivery", value: "Save individually or as a single ZIP archive." },
  ],
  useCases: [
    "Shrinking a batch of holiday photos to JPG so they slip under an email provider's attachment cap.",
    "Modernising an old PNG and JPG folder to WebP or AVIF to cut a site's image payload roughly in half.",
    "Flattening transparent screenshots to JPG when a form or printer refuses PNG.",
    "Turning a single SVG mark into an ICO for a favicon or a desktop shortcut.",
  ],
  howToTitle: "Converting an image, step by step",
  formatsTitle: "What you can convert and the batch limit",
  useCasesTitle: "When a quick convert saves the day",
  privacyTitle: "Your photos stay on your machine",
  privacyNote:
    "Conversion runs entirely through the browser's Canvas and image decoders. The file you drop is read into memory, re-encoded and handed straight back as a download — it is never uploaded to MediaDocks, logged, or retained after you close the tab. Nothing about the picture, its name or its contents reaches a server.",
  faqs: [
    {
      q: "Should I convert my photos to WebP or AVIF?",
      a: "AVIF usually produces the smallest file at a given quality and WebP is a close second, so both beat JPG for the same picture. The catch is reach: if the image has to open in very old software, JPG remains the safest bet. Convert to AVIF or WebP when you control where the images will be viewed.",
    },
    {
      q: "Why can I only add ten images at a time?",
      a: "Decoding and re-encoding happen in your browser rather than on a server, so a huge batch would compete for the same memory the tab needs to stay responsive. Ten keeps each pass fast, and you can clear the list and run another batch immediately with no limit on how many times you do it.",
    },
    {
      q: "Will converting a JPG to PNG make it look better?",
      a: "No. Detail a lossy JPG has already discarded cannot be rebuilt by moving it into a lossless PNG; you only get a larger file of the same picture. PNG is worth choosing before the first save, or when you need transparency, not as a repair step afterwards.",
    },
    {
      q: "Does lowering the quality slider change the dimensions?",
      a: "No. The slider only affects how aggressively a lossy format compresses the pixels, which changes file size, not width or height. If you need different dimensions, run the file through the image resizer instead.",
    },
  ],
  relatedGuides: [
    { slug: "optimizing-media-for-web-and-social", label: "Optimizing media for web and social" },
    {
      slug: "how-video-compression-affects-quality",
      label: "How compression affects quality: lossy vs lossless",
    },
  ],
  relatedTools: [
    { href: "/image-resizer", label: "Image resizer — change dimensions" },
    { href: "/svg-to-png", label: "SVG to PNG — rasterize vectors" },
  ],
  featuresHeading: "Every format, one batch, zero uploads",
  featuresSubline:
    "Convert between JPG, PNG, WebP, AVIF and more right in the browser, with per-file control and a one-click ZIP.",
  privacyBannerTitle: "Canvas-only conversion, nothing uploaded",
  privacyBannerBody:
    "Each image is decoded and re-encoded through the browser's Canvas pipeline on your own device. The files never travel to MediaDocks and nothing is stored once the download finishes.",
};
