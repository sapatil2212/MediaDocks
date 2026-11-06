import type { ConverterContent } from "@/components/converters/content-types";

export const content: ConverterContent = {
  features: [
    {
      icon: "eraser",
      title: "AI cutout in one step",
      description:
        "A segmentation model finds the main subject — a person, a product, a pet — and erases everything behind it, leaving a clean PNG with a real alpha channel.",
    },
    {
      icon: "layers",
      title: "Bulk mode for 25 images",
      description:
        "Queue a whole shoot, watch each picture move from queued to done, retry the odd failure, and collect every cutout in a single ZIP archive.",
    },
    {
      icon: "shield",
      title: "Runs on your device",
      description:
        "The model executes inside a background thread of your browser tab. Your photos are never sent to MediaDocks or to any other server.",
    },
  ],
  featureList: [
    "Transparent PNG output from JPG, PNG and WebP photos",
    "Single-image mode with a side-by-side before and after preview",
    "Bulk mode for up to 25 images with per-image status, retry and ZIP download",
    "On-device AI model: no upload, and the model is cached after the first use",
  ],
  howTo: [
    {
      title: "Choose Single or Bulk",
      body: "Single image gives you a large before and after comparison for one picture. Bulk is built for a folder of product shots or headshots and takes up to twenty-five files in one pass.",
    },
    {
      title: "Add your images",
      body: "Drop JPG, PNG or WebP files onto the upload area, or press Enter on it to open the file picker. Anything over 15 MB, empty, or in another format is skipped with a note explaining why.",
    },
    {
      title: "Let the model load, then watch progress",
      body: "On your very first visit the page fetches the AI model and its runtime, and a progress bar shows how much has arrived. After that each image is processed in turn, and its row changes from Queued to Processing to Done.",
    },
    {
      title: "Download a PNG or the whole ZIP",
      body: "Save a single cutout with its own button, or press Download all as ZIP to bundle every finished image. Files are named after the originals with a -no-bg suffix, and clashing names get a number added.",
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Pick a mode",
      description: "One image with a preview, or a batch of up to 25.",
    },
    {
      step: 2,
      title: "Drop your photos",
      description: "The on-device model cuts out the subject of each picture.",
    },
    {
      step: 3,
      title: "Save the cutouts",
      description: "Download one transparent PNG or a ZIP of the batch.",
    },
  ],
  intro: [
    "The background remover separates the main subject of a photo from whatever surrounds it. It uses a salient-object segmentation model, a neural network trained to estimate, for every single pixel, how likely that pixel is to belong to the thing a viewer would look at first. That estimate becomes the alpha channel of a new PNG: confident subject pixels stay fully opaque, clear background pixels turn fully transparent, and the soft band along the edge keeps partial transparency so the cutout does not look stamped out with scissors.",
    "Results are always delivered as PNG because a cutout is only useful if the empty area stays empty. JPG has no alpha channel at all, so a transparent region saved as JPG would simply be painted a solid colour. PNG keeps the transparency losslessly, which makes it the dependable choice for slides, storefronts and design tools. If the file is too heavy for a web page, run it through the image converter and choose WebP, which also supports transparency at a much smaller size.",
    "The model does best when the subject is clearly distinct from its surroundings: a person against a wall, a shoe on a table, a dog on grass. It finds harder material more challenging. Wispy hair, glass, smoke, mesh fabric and very busy scenes with several competing subjects can leave a halo or remove a little too much. The prediction is made at 1024 by 1024 pixels and then stretched to the size of your photo, so extremely fine strands may soften slightly on a large original.",
    "A few limits keep the tab quick and stable. Bulk mode holds 25 images, each file can be up to 15 MB, and anything larger than 16 megapixels is scaled down proportionally before the cutout is drawn. Images are processed one after another in a separate thread so scrolling and typing stay smooth. The first image takes longer because the roughly 44 MB model and 14 MB runtime have to download; your browser keeps both for the next visit.",
  ],
  formats: [
    { label: "Input formats", value: "JPG, JPEG, PNG and WebP." },
    { label: "Output", value: "PNG with a transparent background (alpha channel)." },
    {
      label: "Single vs bulk",
      value: "One image with a preview, or up to 25 per batch, re-runnable as often as you like.",
    },
    {
      label: "Per-file limit",
      value: "15 MB per file; images above 16 megapixels are scaled down to fit.",
    },
    { label: "Delivery", value: "Each PNG on its own, or every finished cutout in one ZIP." },
    {
      label: "Engine",
      value:
        "Open-source Apache-2.0 model running via WebAssembly; about 44 MB, downloaded once and cached.",
    },
  ],
  useCases: [
    "Placing e-commerce product shots on a plain white or fully transparent canvas so a catalogue looks consistent.",
    "Cleaning up profile pictures and team headshots so every face sits on the same brand-coloured backdrop.",
    "Making stickers, thumbnails and slide graphics where the subject has to float over other artwork.",
    "Running a whole folder of catalogue photos through bulk mode and handing the ZIP straight to a designer.",
  ],
  howToTitle: "Removing a background, step by step",
  formatsTitle: "Supported files, output and limits",
  useCasesTitle: "Where a clean cutout helps",
  privacyTitle: "Your photos never leave this tab",
  privacyNote:
    "Every image you add is decoded and processed by a background thread on your own device; the picture is never transmitted to MediaDocks or to anyone else. The only network traffic this tool creates is a one-time download of the AI model from Hugging Face and of the inference runtime, which MediaDocks serves from its own domain. Your browser stores those two files in its cache so later visits start faster — that cache holds the model, never your images. Cutouts exist only inside this tab until you download them or close the page.",
  faqs: [
    {
      q: "Is my photo uploaded anywhere?",
      a: "No. The segmentation model runs inside your browser, so the image is read and cut out on your own computer or phone. The only thing fetched from the internet is the model itself, a one-time download that your browser then keeps for future visits.",
    },
    {
      q: "Why is the first image so slow?",
      a: "Before anything can be processed, the page has to fetch a model of about 44 MB and a runtime of about 14 MB. Once they are cached, later images and later visits skip that wait, and each picture typically finishes within a few seconds depending on your device.",
    },
    {
      q: "Why did it cut off some hair or keep part of the background?",
      a: "The model predicts the subject at a fixed resolution and has to guess where soft or see-through edges end. Busy backgrounds, low contrast and fine strands are the usual culprits. A photo with more separation between subject and background, good lighting and the subject filling more of the frame usually gives a cleaner edge.",
    },
    {
      q: "Why is the result a PNG, and can I get a JPG?",
      a: "Transparency needs an alpha channel, and JPG does not have one. If you need a JPG anyway, open the PNG in the image converter and pick JPG; the transparent area will be flattened onto white.",
    },
    {
      q: "How many images can I process?",
      a: "Bulk mode holds 25 images per batch. When it is full, download the ZIP, press Clear all and start another batch; there is no daily cap.",
    },
  ],
  relatedGuides: [
    { slug: "optimizing-media-for-web-and-social", label: "Optimizing media for web and social" },
    {
      slug: "how-video-compression-affects-quality",
      label: "How video compression works: lossy vs lossless",
    },
  ],
  relatedTools: [
    { href: "/image-converter", label: "Image converter — turn the PNG into WebP" },
    { href: "/image-resizer", label: "Image resizer — fit the cutout to any size" },
  ],
  featuresHeading: "Clean cutouts without sending a single photo away",
  featuresSubline:
    "Lift people, products and pets off their background with an AI model that runs on your own device, one image or a batch at a time.",
  privacyBannerTitle: "On-device AI, zero image uploads",
  privacyBannerBody:
    "The cutout is computed by a model running in your browser. Apart from a one-time model download that your browser caches, nothing leaves your device, and your images are gone when you close the tab.",
};
