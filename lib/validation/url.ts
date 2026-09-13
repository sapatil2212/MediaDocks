import { z } from "zod";
import { config } from "@/lib/config";
import { MediaFlowError, type ErrorCode } from "@/lib/errors";
import { detectPlatform } from "@/lib/platforms/detector";
import type { Platform } from "@/lib/platforms/types";

export interface ValidMediaUrl {
  ok: true;
  url: URL;
  normalizedUrl: string;
  platform: Platform;
  typeHint: string | null;
}

export interface InvalidMediaUrl {
  ok: false;
  field: "url";
  code: ErrorCode;
  message: string;
}

export type MediaUrlValidation = ValidMediaUrl | InvalidMediaUrl;

function invalid(code: ErrorCode, message: string): InvalidMediaUrl {
  return { ok: false, field: "url", code, message };
}

/**
 * Structural + platform validation for a user supplied link.
 *
 * Order: type -> not empty -> length -> parseable -> protocol -> hostname ->
 * supported platform. Network-level checks (DNS / private ranges) happen later
 * in `assertSafeUrl`, right before any outbound request.
 */
export function validateMediaUrl(
  input: unknown,
  maxLength: number = config.maxUrlLength,
): MediaUrlValidation {
  if (typeof input !== "string") {
    return invalid("INVALID_URL", "Please enter a valid media URL.");
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return invalid("INVALID_URL", "Please enter a media URL.");
  }
  if (trimmed.length > maxLength) {
    return invalid("INVALID_URL", `That URL is longer than ${maxLength} characters.`);
  }

  const detection = detectPlatform(trimmed);
  if (!detection.normalizedUrl) {
    return invalid("INVALID_URL", "Please enter a valid media URL.");
  }

  let url: URL;
  try {
    url = new URL(detection.normalizedUrl);
  } catch {
    return invalid("INVALID_URL", "Please enter a valid media URL.");
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return invalid("INVALID_URL", "Only HTTP and HTTPS links are supported.");
  }
  if (!url.hostname || !url.hostname.includes(".")) {
    return invalid("INVALID_URL", "Please enter a valid media URL.");
  }
  if (!detection.platform) {
    return invalid("UNSUPPORTED_PLATFORM", "We don't support this platform yet.");
  }

  return {
    ok: true,
    url,
    normalizedUrl: detection.normalizedUrl,
    platform: detection.platform,
    typeHint: detection.typeHint,
  };
}

/** Same checks, but throws a typed MediaFlowError instead of returning it. */
export function assertValidMediaUrl(input: unknown): ValidMediaUrl {
  const result = validateMediaUrl(input);
  if (!result.ok) throw new MediaFlowError(result.code, result.message);
  return result;
}

export const resolveRequestSchema = z.object({
  url: z.string({ required_error: "Please enter a media URL." }),
});

export const downloadRequestSchema = z.object({
  mediaId: z.string().trim().min(1, "A media reference is required.").max(64),
  itemId: z.string().trim().min(1, "A media item reference is required.").max(64),
});

export type ResolveRequest = z.infer<typeof resolveRequestSchema>;
export type DownloadRequest = z.infer<typeof downloadRequestSchema>;
