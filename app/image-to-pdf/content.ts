import type { ConverterContent } from "@/components/converters/content-types";

export const content: ConverterContent = {
  features: [
    {
      icon: "filePlus",
      title: "Many images, one document",
      description:
        "Gather scans, photos and screenshots into a single paginated PDF where each image becomes its own page in the order you set.",
    },
    {
      icon: "layers",
      title: "Page size and margins",
      description:
        "Choose A4, US Letter or Fit-to-image, set portrait or landscape, and add margins so nothing crowds the edge of the sheet.",
    },
    {
      icon: "shield",
      title: "Assembled in the browser",
      description:
        "The PDF is built on your device with pdf-lib, so the photos that become its pages never leave the machine you are working on.",
    },
  ],
  featureList: [
    "Merge multiple images into one paginated PDF",
    "A4, US Letter or Fit-to-image page sizes",
    "Portrait or landscape with adjustable margins",
    "Drag-free reordering before the document is built",
  ],
  howTo: [
    {
      title: "Add the images in any order",
      body: "Select the photos or scans you want in the document. They appear as cards you can rearrange, so the order you add them in does not have to be the final order.",
    },
    {
      title: "Put the pages in sequence",
      body: "Use the up and down controls on each card to arrange the images into the exact page order the finished PDF should follow.",
    },
    {
      title: "Set page size and orientation",
      body: "Pick A4 or Letter for a standard document, or Fit-to-image when you want each page sized to its picture, then choose portrait or landscape and a margin.",
    },
    {
      title: "Build and download",
      body: "Convert the stack into a single PDF and save it. Each image is embedded at its native resolution so the pages stay crisp.",
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Add photos",
      description: "Select the scans or images that will become pages.",
    },
    {
      step: 2,
      title: "Order and size",
      description: "Reorder the cards and pick a page size, orientation and margin.",
    },
    {
      step: 3,
      title: "Download PDF",
      description: "Build one combined document and save it.",
    },
  ],
  intro: [
    "Image-to-PDF solves a specific, everyday problem: you have several separate pictures that really belong together as one document. A phone full of receipt photos, a two-sided ID captured as two shots, a handful of scanned pages — individually they are awkward to send and easy to lose, but bound into a single PDF they become one tidy file that opens the same way on every device.",
    "The tool treats each image as a page. You add the pictures, arrange them with per-card up and down controls until the sequence is right, and then decide how each page should be laid out on the sheet. Page size is the first choice: A4 and US Letter produce a conventional document that prints predictably, while Fit-to-image sizes every page to the picture it holds, which suits a contact sheet or a set of images you never intend to print. Orientation and margins finish the layout — portrait for upright scans, landscape for wide screenshots, and a margin to keep content clear of the paper's edge.",
    "A detail worth understanding is that the images are embedded, not recompressed. When a photo is placed on a page it is stored at its native resolution inside the PDF rather than being flattened or degraded, so the document is as sharp as the originals you fed in. That makes the output genuinely archival for things like receipts or signed forms, where a blurry page defeats the purpose. It also means the file size of the PDF roughly tracks the combined size of the source images, which is the honest trade for keeping full quality.",
    "Because everything is assembled client-side, there is no practical cap tied to a server timeout — the limiting factor is simply your device's memory for very large sets of high-resolution photos. For the typical job of turning a handful of scans into one document, that is never an issue, and nothing about the pages leaves your computer in the process.",
  ],
  formats: [
    { label: "Input formats", value: "JPG, PNG, WebP, GIF and BMP images." },
    { label: "Output", value: "A single multi-page PDF document." },
    { label: "Page sizes", value: "A4, US Letter or Fit-to-image." },
    { label: "Layout", value: "Portrait or landscape with adjustable margins." },
    { label: "Quality", value: "Images embedded at native resolution, no recompression." },
  ],
  useCases: [
    "Turning a set of receipt or expense photos into one PDF to attach to a reimbursement claim.",
    "Combining the front and back of an ID or a signed form into a single two-page document.",
    "Assembling scanned handwritten notes into one file to submit or archive.",
    "Building a quick photo contact sheet from a shoot using the Fit-to-image option.",
  ],
  howToTitle: "Building a PDF from images, step by step",
  formatsTitle: "Inputs, page options and output",
  useCasesTitle: "Documents people assemble this way",
  privacyTitle: "The document is built on your device",
  privacyNote:
    "Pages are composed in your browser with the pdf-lib library, so the photos and scans that become the document are processed entirely in local memory. Nothing is uploaded to MediaDocks and no copy of the PDF or its source images is kept once you have saved the file and left the page.",
  faqs: [
    {
      q: "How many images can go into one PDF?",
      a: "There is no fixed count. Because the document is assembled in your browser rather than on a server, the practical limit is your device's available memory for the combined set of images. A few dozen typical scans is comfortable; the only thing that slows down is a very large number of high-resolution photos at once.",
    },
    {
      q: "Can I control the order the images appear as pages?",
      a: "Yes. Every image you add becomes a card with up and down controls, so you can shuffle them into the exact sequence you want before building the file. The order you originally selected them in does not lock you in.",
    },
    {
      q: "Does the PDF lower the quality of my photos?",
      a: "No. Each image is embedded at its native resolution rather than being re-compressed, so pages look as sharp as the originals. The trade-off is that the PDF's size roughly reflects the total size of the images you put into it.",
    },
    {
      q: "What does the Fit-to-image page size do?",
      a: "Instead of placing each picture on a fixed A4 or Letter sheet, Fit-to-image makes every page match the dimensions of the image on it. That is ideal for a contact sheet or a gallery you will only ever view on screen, where standard paper proportions would just add empty borders.",
    },
  ],
  relatedGuides: [
    { slug: "optimizing-media-for-web-and-social", label: "Optimizing media for web and social" },
  ],
  relatedTools: [{ href: "/pdf-to-image", label: "PDF to image — go the other direction" }],
  featuresHeading: "Loose images in, one clean PDF out",
  featuresSubline:
    "Merge scans and photos into a single paginated document with the page size, order and margins you choose.",
  privacyBannerTitle: "Composed locally with pdf-lib",
  privacyBannerBody:
    "The PDF is assembled inside your browser using pdf-lib. The source photos stay on your device, are never uploaded to MediaDocks, and leave no trace once the file is saved.",
};
