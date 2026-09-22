/**
 * Errors caused by what was submitted rather than a service delivery failure.
 *
 * This module deliberately has no server imports so both the metrics collector
 * and the client-rendered dashboard can classify failures without pulling
 * Prisma, fs, or extraction binaries into the browser bundle.
 */
const INPUT_ERROR_CODES = new Set([
  "INVALID_URL",
  "INVALID_PLATFORM_URL",
  "UNSUPPORTED_PLATFORM",
  "RATE_LIMITED",
  "MEDIA_NOT_FOUND",
  "MEDIA_REFERENCE_EXPIRED",
  "FORMAT_NOT_AVAILABLE",
  "UNSAFE_URL",
]);

export function isInputError(code: string | null | undefined): boolean {
  return code ? INPUT_ERROR_CODES.has(code) : false;
}
