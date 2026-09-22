/**
 * Input rules for the transcription tools.
 *
 * Both /video-to-text and /audio-to-text post to the same `/api/transcribe`
 * endpoint (it extracts an audio track from whatever it is given), so the only
 * real difference is which files each page invites and how it describes itself.
 * Keeping that in one pure module means the accept attribute, the client-side
 * guard and the copy can never drift apart between the two pages.
 */

export type TranscribeVariant = "video" | "audio";

export const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus", "wma"] as const;
export const VIDEO_EXTENSIONS = ["mp4", "mov", "avi", "mkv", "webm", "m4v", "mpeg", "mpg"] as const;

/** Upload ceiling, mirroring TRANSCRIBE_MAX_FILE_SIZE_MB on the server. */
export const MAX_UPLOAD_MB = 100;

function extensionsFor(variant: TranscribeVariant): readonly string[] {
  // The video page accepts audio too: someone with an MP3 should not be turned
  // away for landing on the wrong tool. The audio page stays audio-only so its
  // promise matches what it asks for.
  return variant === "audio" ? AUDIO_EXTENSIONS : [...VIDEO_EXTENSIONS, ...AUDIO_EXTENSIONS];
}

/** The `accept` attribute for the file input. */
export function acceptAttribute(variant: TranscribeVariant): string {
  const extensions = extensionsFor(variant)
    .map((extension) => `.${extension}`)
    .join(",");
  return variant === "audio" ? `audio/*,${extensions}` : `video/*,audio/*,${extensions}`;
}

/**
 * Whether a chosen file is plausibly transcribable.
 *
 * Extension and MIME type are both checked because neither is reliable alone:
 * browsers report an empty type for some containers, and some systems label an
 * `.m4a` as `video/mp4`. The server re-validates and probes the real stream, so
 * this is a fast courtesy check, not a security boundary.
 */
export function isAcceptedUpload(
  fileName: string,
  mimeType: string,
  variant: TranscribeVariant,
): boolean {
  const extension = (fileName.split(".").pop() ?? "").toLowerCase();
  const allowed = extensionsFor(variant);
  if (extension && allowed.includes(extension)) return true;

  const type = (mimeType ?? "").toLowerCase();
  if (type.startsWith("audio/")) return true;
  return variant === "video" && type.startsWith("video/");
}

/** True when the file exceeds the upload ceiling. */
export function exceedsUploadLimit(sizeBytes: number, maxMb: number = MAX_UPLOAD_MB): boolean {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return false;
  return sizeBytes > maxMb * 1024 * 1024;
}

interface VariantCopy {
  /** Short noun used in sentences, e.g. "audio file". */
  noun: string;
  dropzoneTitle: string;
  dropzoneHint: string;
  emptyFileError: string;
  unsupportedDescription: string;
  linkPlaceholder: string;
  linkHint: string;
}

const COPY: Record<TranscribeVariant, VariantCopy> = {
  video: {
    noun: "video or audio file",
    dropzoneTitle: "Drop a video or audio file here",
    dropzoneHint: `MP4, MOV, WebM, MKV, MP3, WAV and more · up to ${MAX_UPLOAD_MB} MB`,
    emptyFileError: "Select a video or audio file first",
    unsupportedDescription: "Choose a standard video or audio file such as MP4, MOV, WebM, MP3, or WAV.",
    linkPlaceholder: "Paste a public YouTube, Facebook, Instagram, X, or Pinterest video link",
    linkHint: "The video must be public and contain a readable audio track.",
  },
  audio: {
    noun: "audio file",
    dropzoneTitle: "Drop an audio file here",
    dropzoneHint: `MP3, WAV, M4A, FLAC, OGG, AAC and more · up to ${MAX_UPLOAD_MB} MB`,
    emptyFileError: "Select an audio file first",
    unsupportedDescription: "Choose a standard audio file such as MP3, WAV, M4A, FLAC, or OGG.",
    linkPlaceholder: "Paste a public link and we will transcribe its audio track",
    linkHint: "The link must be public. Only its audio track is used for transcription.",
  },
};

export function variantCopy(variant: TranscribeVariant): VariantCopy {
  return COPY[variant];
}
