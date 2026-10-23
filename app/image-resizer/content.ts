import type { ConverterContent } from "@/components/converters/content-types";

export const content: ConverterContent = {
  features: [
    {
      icon: "scaling",
      title: "Pixels or percentages",
      description:
        "Type an exact width and height when a target size is fixed, or snap to a preset like 50% when you just need the picture smaller by a known amount.",
    },
    {
      icon: "lock",
      title: "Aspect-ratio lock",
      description:
        "With the lock on, changing one dimension recalculates the other so the picture keeps its proportions and never looks stretched.",
    },
    {
      icon: "shield",
      title: "Smooth in-memory scaling",
      description:
        "Resampling uses the browser's high-quality smoothing, so downscaled edges stay clean and upscaled images avoid the worst of the blur.",
    },
  ],
  featureList: [
    "Resize by exact pixels or by percentage presets",
    "Aspect-ratio lock that updates the paired dimension",
    "High-quality bicubic-style resampling in the browser",
    "Optional format change to PNG, JPEG or WebP on export",
  ],
  howTo: [
    {
      title: "Drop in a photo",
      body: "Add a single image and the resizer reads its current width, height and format immediately, giving you a known starting point before you change anything.",
    },
    {
      title: "Choose pixels or a percentage",
      body: "Enter the exact dimensions a platform asks for, or click a preset such as 25%, 50% or 150% when you only need the image a fixed amount smaller or larger.",
    },
    {
      title: "Keep the ratio honest",
      body: "Leave the aspect-ratio lock enabled so one value drives the other; unlock it only when you deliberately want to stretch an image to fill a non-matching box.",
    },
    {
      title: "Export, optionally reformatting",
      body: "Download the resized picture in its original format, or switch to PNG, JPEG or WebP on the way out if the destination needs a different container.",
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Upload a photo",
      description: "Dimensions and format are detected the moment it loads.",
    },
    {
      step: 2,
      title: "Set the size",
      description: "Enter pixels or tap a percentage preset with the ratio locked.",
    },
    {
      step: 3,
      title: "Download",
      description: "Save the resized image, reformatting it if you like.",
    },
  ],
  intro: [
    "The image resizer changes how many pixels a picture contains. That sounds obvious, but it is the one operation people most often confuse with compression: resizing alters the width and height, while quality settings alter how those pixels are stored. This tool is firmly about dimensions — give it a photo and it will produce the same picture at a size you specify.",
    "There are two honest ways to express a new size. Pixel entry is absolute: when an upload form demands a 400 by 400 avatar or a print house wants 3000 pixels on the long edge, you type the number and get exactly that. Percentage scaling is relative: picking 50% halves both dimensions whatever the original was, which is the fastest way to make a stack of camera photos uniformly smaller without doing arithmetic. The aspect-ratio lock ties the two fields together so a width change recalculates the height automatically, preserving the proportions that stop faces and logos from looking squashed.",
    "Direction matters more than people expect. Downscaling throws pixels away and almost always looks good, because the resampler has more information than it needs and can average neighbouring pixels into clean, smooth edges. Upscaling is the hard direction: there is no hidden detail to recover, so the tool interpolates new pixels from the ones around them. The high-quality smoothing used here keeps that interpolation as gentle as possible, but the realistic expectation for enlarging is a softer image, not a sharper one — which is why starting from the largest original you have always beats blowing up a small copy.",
    "Common targets fall into a few buckets. Avatars and thumbnails want small, square or near-square dimensions; social platforms publish recommended sizes you can type in directly; print wants a high pixel count on the long edge so the dots-per-inch stay high at physical size. Because the whole operation runs locally, you can experiment with sizes freely and only keep the export you are happy with.",
  ],
  formats: [
    { label: "Input formats", value: "Common raster images including JPG, PNG, WebP and GIF." },
    { label: "Resize modes", value: "Exact pixel width/height or percentage presets." },
    { label: "Aspect ratio", value: "Locked by default; unlock to stretch deliberately." },
    { label: "Export formats", value: "Keep the original, or switch to PNG, JPEG or WebP." },
    { label: "Resampling", value: "High-quality browser smoothing for clean downscales." },
  ],
  useCases: [
    "Trimming a camera photo down to the pixel dimensions a job application or marketplace upload form allows.",
    "Producing a perfectly square profile picture by resizing to matched width and height.",
    "Halving an entire set of phone photos with a single 50% preset before sharing them.",
    "Enlarging a small logo to the largest clean size it will bear for a banner.",
  ],
  howToTitle: "Resizing a picture, step by step",
  formatsTitle: "Inputs, resize modes and export options",
  useCasesTitle: "Everyday resizing jobs",
  privacyTitle: "The picture is resampled locally",
  privacyNote:
    "The image you load is resampled in your browser's memory using Canvas; the resized result is handed back as a download without ever being sent to a server. MediaDocks does not receive, log or keep the picture or its dimensions, and the working copy disappears when you leave the page.",
  faqs: [
    {
      q: "Will resizing blur my image?",
      a: "Making an image smaller keeps it sharp because the resampler has pixels to spare and blends them smoothly. Making it larger is where softness creeps in, since the tool has to invent pixels that were never captured. For the cleanest result, downscale from the biggest original you have rather than upscaling a small one.",
    },
    {
      q: "Can I change the file format while I resize?",
      a: "Yes. On export you can keep the original container or switch to PNG, JPEG or WebP, which is handy when the destination both wants a specific size and a specific format. The resize and the format change happen together in a single save.",
    },
    {
      q: "What does the aspect-ratio lock actually do?",
      a: "It links the width and height fields so editing one recalculates the other to keep the original proportions. That stops the common mistake of typing mismatched numbers and ending up with a stretched picture. Turn it off only when you genuinely want to distort the image to fit a fixed box.",
    },
    {
      q: "Does resizing reduce the file size too?",
      a: "Usually, because fewer pixels means less data to store, but the two are separate ideas. Resizing changes dimensions; compression changes how those pixels are encoded. If your goal is purely a smaller file at the same dimensions, convert to a leaner format instead of shrinking the picture.",
    },
  ],
  relatedGuides: [
    { slug: "optimizing-media-for-web-and-social", label: "Optimizing media for web and social" },
    {
      slug: "video-resolution-guide-720p-1080p-4k",
      label: "Resolutions explained: how dimensions work",
    },
  ],
  relatedTools: [{ href: "/image-converter", label: "Image converter — change the format" }],
  featuresHeading: "The right dimensions, without the distortion",
  featuresSubline:
    "Resize by pixels or percentage with the aspect ratio locked, and reformat on export if you need to.",
  privacyBannerTitle: "Resampled in memory, never uploaded",
  privacyBannerBody:
    "Your photo is scaled inside the browser using Canvas on your own device. It is not sent to MediaDocks, and the working copy is discarded the moment you leave the page.",
};
