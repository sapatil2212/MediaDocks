import type { ConverterContent } from "@/components/converters/content-types";

export const content: ConverterContent = {
  features: [
    {
      icon: "fileText",
      title: "Choose the render resolution",
      description:
        "Rasterize pages at standard or high-definition scale so text stays legible and figures stay crisp whether they are headed for screen or print.",
    },
    {
      icon: "layers",
      title: "Per-page or whole-document ZIP",
      description:
        "Preview every page, grab just the one you need, or export the entire document as a numbered set of images in a single ZIP.",
    },
    {
      icon: "shield",
      title: "Rendered in the browser",
      description:
        "Pages are drawn on your device with WebAssembly and Canvas, so the PDF is read locally and never handed to a server.",
    },
  ],
  featureList: [
    "Rasterize PDF pages to PNG, JPG or WebP",
    "Standard and high-resolution render scales",
    "Download single pages or the whole document as a ZIP",
    "Interactive page preview before you export",
  ],
  howTo: [
    {
      title: "Open your PDF",
      body: "Add the document and every page is rendered into a preview grid, so you can see what you are working with before deciding which pages and what format you need.",
    },
    {
      title: "Pick a format for the job",
      body: "Choose PNG for pages that are mostly text or line art, or JPG and WebP for pages dominated by photographs where a smaller file matters more than perfectly crisp edges.",
    },
    {
      title: "Set the resolution",
      body: "Use the standard scale for on-screen use and the high-resolution scale when the image is going to print or needs to survive zooming, which renders the page at a higher pixel density.",
    },
    {
      title: "Save a page or the ZIP",
      body: "Download an individual page straight from its preview, or export the complete document as a numbered set of images bundled into one ZIP.",
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Upload a PDF",
      description: "Each page renders into an interactive preview.",
    },
    {
      step: 2,
      title: "Choose format and scale",
      description: "Pick PNG, JPG or WebP and a standard or high-res scale.",
    },
    {
      step: 3,
      title: "Export",
      description: "Save one page or every page as a ZIP.",
    },
  ],
  intro: [
    "PDF-to-image turns the pages of a document into standalone pictures. A PDF is a page-description format built to be printed and read as a whole; the moment you want to drop a single page into a slide deck, post a diagram to social media, or show a figure inside a chat, you need that page as an ordinary image file instead. This tool rasterizes each page — it draws the vector text and layout into a grid of pixels — and hands you the result as PNG, JPG or WebP.",
    "Because rasterizing is a one-way flattening, the resolution you render at is the decision that matters most. The page is redrawn at a chosen pixel density, so a higher scale produces a larger, sharper image that holds up when zoomed or printed, while the standard scale produces a lighter file that is perfect for on-screen use. There is no benefit to rendering a page you will only ever glance at on a phone at print density, and no sense in sending a low-resolution capture to a printer — matching the scale to the destination is the whole game.",
    "Format follows the content of the page. Pages that are mostly text, tables or vector diagrams belong in PNG, whose lossless encoding keeps letterforms and thin lines razor-sharp with no compression fuzz around the edges. Pages dominated by photographs are better as JPG or WebP, where lossy compression shrinks the file dramatically with no visible cost on a continuous-tone image. A mixed page is a judgement call, but PNG is the safe default when readability is the priority.",
    "Export scales to the task. For a single figure, preview the document, find the page and download it on its own. For a whole deck or a scanned booklet you want as images, the ZIP export renders every page and packages them as a numbered set in one download, preserving their order. Either way the PDF is opened and drawn on your own device, so even large documents convert without an upload step.",
  ],
  formats: [
    { label: "Input", value: "A single PDF document, any page count." },
    { label: "Output formats", value: "PNG, JPG or WebP images." },
    { label: "Resolution", value: "Standard scale for screen, high scale for print and zoom." },
    { label: "Best for text", value: "PNG keeps letters and thin lines crisp." },
    { label: "Delivery", value: "One page at a time, or every page in a ZIP." },
  ],
  useCases: [
    "Pulling a single chart or figure out of a research paper to drop into a presentation.",
    "Posting one slide from a PDF deck to social media without sharing the whole file.",
    "Generating thumbnail images of every page to build a visual index of a document.",
    "Rendering a certificate or invoice page at high resolution for clean printing.",
  ],
  howToTitle: "Turning PDF pages into images, step by step",
  formatsTitle: "Inputs, formats and resolution",
  useCasesTitle: "When a page needs to become a picture",
  privacyTitle: "The PDF is read on your device",
  privacyNote:
    "Each page is rendered in your browser using a WebAssembly PDF engine and Canvas, so the document is processed entirely in local memory. The PDF is never uploaded to MediaDocks, its text and images are not logged, and the rendered pages exist only until you close the tab.",
  faqs: [
    {
      q: "Can I convert a long, multi-page PDF?",
      a: "Yes. Every page is rendered into the preview, and the ZIP export packages them all as a numbered image set in one download. Because the rendering happens in your browser rather than on a server, there is no upload timeout to trip over on a long document.",
    },
    {
      q: "Which format should I pick for the pages?",
      a: "Match it to the content. PNG is the right choice for pages that are mostly text, tables or vector diagrams because it keeps edges sharp with no compression artefacts. JPG or WebP suit pages that are mainly photographs, where lossy compression shrinks the file with no visible loss on a continuous-tone image.",
    },
    {
      q: "What does the high-resolution scale change?",
      a: "It renders each page at a higher pixel density, producing a larger, sharper image that stays clean when printed or zoomed. The standard scale is lighter and ideal for anything that will only be viewed on screen, so choose the scale that matches where the image is going rather than always reaching for the biggest.",
    },
    {
      q: "Is there a file-size limit for the PDF?",
      a: "There is no server-imposed cap because the document is opened locally. The only real constraint is your device's memory when rendering a very large or very high-resolution document, which you would notice as slower rendering rather than a hard failure.",
    },
  ],
  relatedGuides: [
    { slug: "optimizing-media-for-web-and-social", label: "Optimizing media for web and social" },
  ],
  relatedTools: [{ href: "/image-to-pdf", label: "Image to PDF — go the other direction" }],
  featuresHeading: "Every page, as the image you actually need",
  featuresSubline:
    "Rasterize PDF pages to PNG, JPG or WebP at the resolution that fits screen or print, one page or all of them.",
  privacyBannerTitle: "Rendered locally with WebAssembly",
  privacyBannerBody:
    "Pages are drawn inside your browser using a WebAssembly PDF engine and Canvas. The document stays on your device, is never uploaded to MediaDocks, and the rendered images vanish when you leave.",
};
