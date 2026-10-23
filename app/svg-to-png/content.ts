import type { ConverterContent } from "@/components/converters/content-types";

export const content: ConverterContent = {
  features: [
    {
      icon: "fileCode",
      title: "Clean rasterization",
      description:
        "Vector paths, gradients and text are drawn into pixels through the browser's renderer, so the PNG keeps the smooth edges of the original artwork.",
    },
    {
      icon: "zap",
      title: "1x to 8x scaling",
      description:
        "Export at one to eight times the source dimensions so the same vector yields anything from a small icon to a large high-DPI asset.",
    },
    {
      icon: "image",
      title: "Transparent or solid background",
      description:
        "Keep the alpha channel for a cut-out graphic, or flatten onto a solid colour when the destination needs an opaque background.",
    },
  ],
  featureList: [
    "Rasterize SVG to PNG in the browser",
    "Scale factors from 1x up to 8x",
    "Transparent or solid-colour background",
    "Auto-detected source dimensions and viewBox",
  ],
  howTo: [
    {
      title: "Load the SVG",
      body: "Add your .svg file and the converter reads its dimensions and viewBox automatically, giving you a known base size that every scale factor multiplies.",
    },
    {
      title: "Choose a scale factor",
      body: "Pick 1x to keep the native size, or step up to 2x, 4x or 8x when you need a larger raster for a retina screen, a print asset or a slide at full width.",
    },
    {
      title: "Set the background",
      body: "Leave the background transparent to preserve the artwork's alpha channel, or choose a solid colour when the target cannot handle transparency and needs a flat fill behind the graphic.",
    },
    {
      title: "Download the PNG",
      body: "Render and save the result. The PNG is produced at the exact pixel dimensions implied by your chosen scale factor.",
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Upload SVG",
      description: "Dimensions and viewBox are detected on load.",
    },
    {
      step: 2,
      title: "Pick scale and background",
      description: "Choose 1x–8x and transparent or solid.",
    },
    {
      step: 3,
      title: "Download PNG",
      description: "Save the rasterized graphic.",
    },
  ],
  intro: [
    "SVG and PNG answer two different questions. An SVG is a set of instructions — draw this path, fill it with that gradient, place this text here — so it can be scaled to any size and stay perfectly sharp, which is what makes it ideal for logos and icons on the web. A PNG is a fixed grid of pixels. Converting from the first to the second is called rasterization: the instructions are executed once, at a chosen size, and the result is frozen into pixels. This tool does exactly that, drawing the SVG through the browser's renderer and handing back a PNG.",
    "You reach for a PNG whenever the place the graphic is going cannot handle a vector. Plenty of destinations fall into that camp: most social platforms accept PNG but reject SVG uploads, older image editors and office software have patchy or no SVG support, and many slide and document tools expect a raster image. In all of those cases a crisp PNG rendered at the right size is the pragmatic answer, letting a vector asset live comfortably outside the web where it was designed.",
    "Because rasterization bakes in the size, the scale factor is the decision that determines quality. The converter reads the SVG's native dimensions and multiplies them by the factor you pick, so 2x doubles each edge and 8x produces an image eight times as wide and tall. A higher factor means more pixels and a sharper result on high-density displays or in print, at the cost of a larger file. The right choice is driven by where the PNG will be shown: 1x or 2x for ordinary screen use, 4x or more when the image must survive enlargement or land on a retina display without looking soft.",
    "Background handling is the other meaningful control. SVGs frequently have transparent areas, and a PNG can preserve that alpha channel so the graphic drops cleanly onto any colour — a sticker, a logo over a photo, an icon on a coloured panel. When the destination cannot cope with transparency, flattening the artwork onto a solid background colour avoids the ugly black or checkerboard fill that some viewers substitute, giving you an opaque image that looks intentional rather than broken.",
  ],
  formats: [
    { label: "Input", value: "A single SVG vector file." },
    { label: "Output", value: "A PNG raster image." },
    { label: "Scale factors", value: "1x, 2x, 4x and 8x of the source dimensions." },
    { label: "Background", value: "Transparent alpha channel or a solid colour fill." },
    { label: "Sizing", value: "Source width, height and viewBox detected automatically." },
  ],
  useCases: [
    "Exporting a vector logo as PNG to upload to a social platform that rejects SVG files.",
    "Rendering an icon at 4x so it stays crisp on a retina display or in a high-DPI app.",
    "Producing a transparent sticker PNG of an illustration to overlay on photos or slides.",
    "Flattening an SVG onto a white background for an older editor that mishandles transparency.",
  ],
  howToTitle: "Rasterizing an SVG, step by step",
  formatsTitle: "Input, output, scale and background",
  useCasesTitle: "When a vector has to become a PNG",
  privacyTitle: "Rendered on your device",
  privacyNote:
    "The SVG is drawn to a Canvas inside your browser and exported as a PNG locally, so the vector file and the image it produces stay on your machine. Nothing is uploaded to MediaDocks, the artwork is not logged, and the rendered PNG exists only until you save it and move on.",
  faqs: [
    {
      q: "Why would I convert an SVG to PNG at all?",
      a: "Because many destinations do not accept vectors. Social platforms, older image editors and a lot of presentation software expect a raster image, so a PNG lets a vector logo or icon travel anywhere. You keep the SVG as your master copy and render a PNG whenever a specific tool or upload needs one.",
    },
    {
      q: "Does the PNG keep the transparency from my SVG?",
      a: "Yes, by default. The exported PNG preserves the alpha channel, so transparent areas of the artwork stay transparent and the graphic drops cleanly onto any colour. If the destination cannot handle transparency, you can instead flatten the image onto a solid background colour of your choosing.",
    },
    {
      q: "What does the scale factor change?",
      a: "It multiplies the SVG's native dimensions before rendering, so a higher factor produces a larger, sharper PNG with more pixels. Use 1x or 2x for ordinary screen use and 4x or 8x when the image needs to stay crisp on a retina display, in print, or when scaled up, accepting a bigger file in return.",
    },
    {
      q: "Can I rasterize a very detailed SVG?",
      a: "Yes. The browser renders the vector paths, gradients and text to pixels at your chosen size, so complex artwork comes through with smooth edges. The practical ceiling is your device's memory at the largest 8x sizes, which you would notice as slower rendering rather than a failure.",
    },
  ],
  relatedGuides: [
    { slug: "optimizing-media-for-web-and-social", label: "Optimizing media for web and social" },
  ],
  relatedTools: [
    { href: "/image-converter", label: "Image converter — change the raster format" },
    { href: "/qr-code-generator", label: "QR code generator — export a vector code" },
  ],
  featuresHeading: "From scalable vector to pixel-perfect PNG",
  featuresSubline:
    "Rasterize an SVG at up to 8x with transparency preserved, so the artwork works anywhere a vector cannot.",
  privacyBannerTitle: "Drawn to Canvas, kept on your machine",
  privacyBannerBody:
    "Your SVG is rendered to a Canvas and exported as PNG inside the browser. The file is never sent to MediaDocks and the rendered image is discarded as soon as you leave the page.",
};
