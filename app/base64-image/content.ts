import type { ConverterContent } from "@/components/converters/content-types";

export const content: ConverterContent = {
  features: [
    {
      icon: "binary",
      title: "Encode and decode both ways",
      description:
        "Turn an image into a Data URI string, or paste a Base64 string back and preview and save the picture it represents.",
    },
    {
      icon: "zap",
      title: "Ready-to-paste snippets",
      description:
        "The encoder hands back the raw Data URI plus copy-ready HTML img and CSS background-image snippets so the output drops straight into code.",
    },
    {
      icon: "shield",
      title: "Runs on your CPU",
      description:
        "Encoding and decoding go through the browser's FileReader, so the operation is pure local computation with no network round-trip.",
    },
  ],
  featureList: [
    "Image to Base64 Data URI encoding",
    "Base64 to downloadable image decoding",
    "Copy-ready HTML <img> and CSS background snippets",
    "Local FileReader processing with no upload",
  ],
  howTo: [
    {
      title: "Choose encode or decode",
      body: "Pick 'Image to Base64' to turn a file into a string, or 'Base64 to Image' when you already have a string and need the picture back out of it.",
    },
    {
      title: "Provide the input",
      body: "For encoding, drop in an image and it is read straight into a Data URI. For decoding, paste the Base64 text — with or without the leading data URI prefix — and the preview appears.",
    },
    {
      title: "Copy the snippet or save the file",
      body: "After encoding, copy the raw Data URI or one of the generated HTML and CSS snippets. After decoding, download the reconstructed image as a file.",
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Pick a mode",
      description: "Encode an image or decode a Base64 string.",
    },
    {
      step: 2,
      title: "Add the input",
      description: "Upload a file to encode, or paste a string to decode.",
    },
    {
      step: 3,
      title: "Copy or download",
      description: "Grab the snippet, or save the decoded image.",
    },
  ],
  intro: [
    "A Base64 image is a picture rewritten as plain text. Instead of a separate file on disk, the bytes of the image are encoded into an ASCII string — a Data URI — that can live directly inside an HTML document, a stylesheet, or a JSON payload. This tool does that translation in both directions: it encodes an image into a Data URI, and it decodes a Data URI back into a real image file you can save.",
    "The reason to inline an image rather than link to it is to remove an HTTP request. Every external image a page references is a separate round-trip to a server, and for tiny assets — a 1-pixel spacer, a small icon, a logo in an email — the overhead of that request can cost more than the image itself. Embedding the bytes inline means the picture arrives with the document that uses it, which is exactly why email templates, single-file HTML exports and small CSS icons so often reach for Base64.",
    "That convenience is not free, and the cost is size. Base64 represents three bytes of binary with four characters of text, so an encoded image is roughly a third larger than the original file. For a small icon that overhead is trivially outweighed by the saved request; for a large photograph it is a bad trade that bloats the document and cannot be cached separately. The practical line is simple — inline the small stuff, keep large images as linked files — and the tool makes the size visible so the choice is informed rather than blind.",
    "The output is built to be pasted, not just read. Encoding returns the raw Data URI alongside an HTML img tag and a CSS background-image rule already wrapped around it, so the string drops into markup or a stylesheet without hand-editing. Decoding is the mirror image: paste a Base64 blob you received from an API or a config file, confirm it in the preview, and save it back out as a normal PNG or JPEG.",
  ],
  formats: [
    { label: "Encode input", value: "Any common raster image, e.g. PNG, JPG, GIF, WebP." },
    { label: "Encode output", value: "Raw Data URI plus HTML <img> and CSS snippets." },
    { label: "Decode input", value: "A Base64 string, with or without the data URI prefix." },
    { label: "Decode output", value: "A downloadable image file." },
    { label: "Size note", value: "Base64 text is about 33% larger than the binary original." },
  ],
  useCases: [
    "Embedding a small logo directly into an HTML email template so it renders without a hosted file.",
    "Inlining a tiny icon as a CSS background-image to save an HTTP request on a critical page.",
    "Decoding a Base64 image string returned by an API to inspect or save the actual picture.",
    "Bundling an image into a single-file HTML document that has to work with no external assets.",
  ],
  howToTitle: "Encoding or decoding, step by step",
  formatsTitle: "Inputs, outputs and the size trade-off",
  useCasesTitle: "Where inlining an image pays off",
  privacyTitle: "Pure local computation",
  privacyNote:
    "Both encoding and decoding are handled by the browser's FileReader and run entirely on your CPU. The image or string you provide is processed in local memory and never transmitted to MediaDocks, so nothing you paste or upload is logged or stored anywhere beyond the tab you are using.",
  faqs: [
    {
      q: "What exactly is a Base64 Data URI?",
      a: "It is an image expressed as a text string rather than a file. The binary bytes of the picture are encoded into ASCII characters and prefixed with a short header that names the format, so the whole image can be dropped directly into HTML, CSS or JSON instead of being linked as a separate file.",
    },
    {
      q: "Why is the encoded string bigger than my image?",
      a: "Base64 uses four text characters to represent every three bytes of binary data, which adds roughly a third to the size. That overhead is easily worth it for small assets where you save an HTTP request, but it makes Base64 a poor choice for large photographs that are better left as linked, cacheable files.",
    },
    {
      q: "Can I paste a string that already has the data URI prefix?",
      a: "Yes. The decoder accepts a Base64 string whether or not it still carries its leading data URI header, so you can paste the full value you copied from markup or a plain blob you pulled from an API response and it will reconstruct the image either way.",
    },
    {
      q: "When should I not inline an image as Base64?",
      a: "Avoid it for anything large or reused across pages. Inlined images cannot be cached on their own, so a big Base64 blob is re-downloaded with every copy of the document and inflates its size. Reserve the technique for small, single-use assets like icons and email logos.",
    },
  ],
  relatedGuides: [
    { slug: "optimizing-media-for-web-and-social", label: "Optimizing media for web and social" },
  ],
  relatedTools: [
    { href: "/svg-to-png", label: "SVG to PNG — rasterize a vector first" },
    { href: "/image-converter", label: "Image converter — change the format" },
  ],
  featuresHeading: "Images as text, both directions, no server",
  featuresSubline:
    "Encode a picture into a Data URI with ready-made snippets, or decode a Base64 string back into a file.",
  privacyBannerTitle: "FileReader on your CPU, nothing sent",
  privacyBannerBody:
    "Encoding and decoding happen through the browser's FileReader on your own machine. The image or string you provide is never uploaded to MediaDocks and is discarded as soon as you leave the page.",
};
