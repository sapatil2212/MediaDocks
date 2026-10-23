import type { ConverterContent } from "@/components/converters/content-types";

export const content: ConverterContent = {
  features: [
    {
      icon: "qrcode",
      title: "Vector and raster export",
      description:
        "Download scalable SVG, EPS and PDF for print and design software, or high-resolution PNG when a flat raster image is what you need.",
    },
    {
      icon: "image",
      title: "Logo-aware error correction",
      description:
        "Add a brand logo and the generator raises the error-correction level so the extra redundancy keeps the code scannable despite the obscured centre.",
    },
    {
      icon: "zap",
      title: "Multiple payload types",
      description:
        "Encode a URL, a Wi-Fi network, a vCard contact, plain text and more — the data is written into the pattern itself.",
    },
  ],
  featureList: [
    "Static QR codes that never expire",
    "SVG, EPS and PDF vector output plus high-res PNG",
    "URL, Wi-Fi, vCard and text payloads",
    "Logo overlay with automatic error-correction boost",
  ],
  howTo: [
    {
      title: "Pick what the code should carry",
      body: "Choose the payload type — a website URL, Wi-Fi credentials, a vCard, an email or phone number, or plain text — and fill in the fields for it. The content is encoded directly into the pattern.",
    },
    {
      title: "Style and brand it",
      body: "Set the foreground and background colours for contrast, and optionally drop a logo into the centre. Adding a logo automatically increases the error-correction level so the code still reads.",
    },
    {
      title: "Choose vector or raster",
      body: "Pick SVG, EPS or PDF when the code is destined for a print shop or design software, or high-resolution PNG when you need a ready-to-place image.",
    },
    {
      title: "Download",
      body: "Save the single format you want, or grab the all-in-one bundle to keep both the vector and raster versions together for later.",
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Choose payload",
      description: "URL, Wi-Fi, vCard, text and more.",
    },
    {
      step: 2,
      title: "Brand it",
      description: "Set colours and optionally add a logo.",
    },
    {
      step: 3,
      title: "Export",
      description: "Download vector SVG/EPS/PDF or high-res PNG.",
    },
  ],
  intro: [
    "A QR code is a two-dimensional barcode that stores data as a grid of black and white modules a camera can read in an instant. The codes this tool produces are static, which is the single most important thing to understand about them: the information is written directly into the pattern, so the code resolves to its destination forever with no account, no subscription and no dashboard behind it. Dynamic QR services, by contrast, encode a redirect through their own servers and can expire or go dark if that service does — a static code has nothing to break.",
    "That permanence shapes how you should use it. Because the payload is baked in, a static code pointing at a specific URL cannot be edited after it is printed, so it suits destinations that are themselves stable — a homepage, a menu page, a Wi-Fi network. The upside is total independence: a poster printed years ago keeps working, and no third party sits between the scanner and the destination.",
    "Error correction is the quiet feature that makes branded codes possible. The QR standard builds redundancy into every code so it still scans when part of it is dirty, creased or covered, and there are several levels of it. When you drop a logo into the centre you are deliberately obscuring modules, so the generator raises the correction level — up to the highest, which reserves roughly a third of the code for recovery data — to compensate. That is why a logo can sit in the middle without breaking the scan, and why a heavily branded code is physically denser than a plain one.",
    "Output format is a print-versus-screen decision. Vector formats — SVG, EPS and PDF — describe the code as mathematical shapes, so they scale to any size with perfectly crisp edges and import cleanly into design and prepress software; they are the right choice for anything that will be printed large, from a business card to a banner. A high-resolution PNG is a flat raster image, ideal when you simply need to place the code into a slide, a web page or a document and the final size is already known.",
  ],
  formats: [
    { label: "Code type", value: "Static — the data lives in the pattern and never expires." },
    { label: "Payloads", value: "URL, Wi-Fi, vCard, email, phone and plain text." },
    { label: "Vector output", value: "SVG, EPS and PDF for print and design tools." },
    { label: "Raster output", value: "High-resolution PNG up to very large pixel sizes." },
    { label: "Branding", value: "Logo overlay with an automatic error-correction boost." },
  ],
  useCases: [
    "Printing a QR on a poster or business card that links to a page and still scans years later.",
    "Sharing guest Wi-Fi with a single code so visitors join without typing a password.",
    "Putting a vCard code on a name badge so a scan drops your contact details straight into a phone.",
    "Exporting a vector EPS of a product-label code for a commercial print shop.",
  ],
  howToTitle: "Generating a QR code, step by step",
  formatsTitle: "Payloads, formats and branding",
  useCasesTitle: "Where a static QR earns its place",
  privacyTitle: "Generated entirely in your browser",
  privacyNote:
    "The code is drawn on your device from the data you type, so whatever you encode — a URL, a Wi-Fi password, the contact details in a vCard — is never sent to MediaDocks. There is no server-side record of the codes you create and nothing is retained after you download the file and leave the page.",
  faqs: [
    {
      q: "Do these QR codes expire or need an account?",
      a: "No. Every code is static, meaning the destination is encoded directly into the pattern rather than routed through a server. There is nothing to renew, no subscription, and no third party that could take it offline — a printed code keeps resolving to the same destination indefinitely.",
    },
    {
      q: "Will the code still scan with my logo in the middle?",
      a: "Yes, because adding a logo automatically raises the error-correction level. The QR standard reserves part of every code for recovery data, and at the highest level roughly a third of the pattern can be reconstructed, which is enough to cover a central logo while leaving the code readable to any scanner.",
    },
    {
      q: "Can I open the vector file in Illustrator or CorelDRAW?",
      a: "Yes. The SVG and EPS exports describe the code as scalable shapes rather than pixels, so they import into Adobe Illustrator, CorelDRAW and other design or prepress software as clean editable curves, ready to resize for anything from a label to a billboard.",
    },
    {
      q: "Which format should I download for printing?",
      a: "Use a vector format — SVG, EPS or PDF — for anything printed, because it stays perfectly sharp at any physical size. Reserve PNG for on-screen placement or cases where you already know the exact pixel dimensions and do not need to scale the code afterwards.",
    },
  ],
  relatedGuides: [
    { slug: "optimizing-media-for-web-and-social", label: "Optimizing media for web and social" },
  ],
  relatedTools: [
    { href: "/url-shortener", label: "URL shortener — pair a short link with a code" },
    { href: "/svg-to-png", label: "SVG to PNG — rasterize the vector export" },
  ],
  featuresHeading: "Codes that outlive the service that made them",
  featuresSubline:
    "Static QR codes for URLs, Wi-Fi and contacts, exported as print-ready vectors or high-resolution PNG.",
  privacyBannerTitle: "Drawn on your device from your data",
  privacyBannerBody:
    "The QR pattern is generated in your browser from whatever you type. The encoded content never reaches MediaDocks, no record of your codes is kept, and nothing persists once you leave.",
};
