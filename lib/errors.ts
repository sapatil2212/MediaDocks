export type ErrorCode =
  | "INVALID_URL"
  | "UNSUPPORTED_PLATFORM"
  | "INVALID_PLATFORM_URL"
  | "UNSAFE_URL"
  | "PLATFORM_ACCESS_UNAVAILABLE"
  | "MEDIA_NOT_FOUND"
  | "MEDIA_NOT_AVAILABLE"
  | "IMAGE_MEDIA_UNAVAILABLE"
  | "VIDEO_MEDIA_UNAVAILABLE"
  | "MEDIA_TYPE_UNKNOWN"
  | "INVALID_MEDIA_RESPONSE"
  | "FORMAT_NOT_AVAILABLE"
  | "MEDIA_REFERENCE_EXPIRED"
  | "DOWNLOAD_FAILED"
  | "FILE_TOO_LARGE"
  | "RATE_LIMITED"
  | "REQUEST_TIMEOUT"
  | "INTERNAL_ERROR";

export const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  INVALID_URL: 400,
  UNSUPPORTED_PLATFORM: 400,
  INVALID_PLATFORM_URL: 400,
  UNSAFE_URL: 403,
  PLATFORM_ACCESS_UNAVAILABLE: 502,
  MEDIA_NOT_FOUND: 404,
  MEDIA_NOT_AVAILABLE: 404,
  IMAGE_MEDIA_UNAVAILABLE: 404,
  VIDEO_MEDIA_UNAVAILABLE: 404,
  MEDIA_TYPE_UNKNOWN: 415,
  INVALID_MEDIA_RESPONSE: 502,
  FORMAT_NOT_AVAILABLE: 404,
  MEDIA_REFERENCE_EXPIRED: 410,
  DOWNLOAD_FAILED: 502,
  FILE_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  REQUEST_TIMEOUT: 504,
  INTERNAL_ERROR: 500,
};

export class MediaFlowError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "MediaFlowError";
    this.code = code;
    this.statusCode = ERROR_STATUS_MAP[code];
    this.details = details;
  }

  toJSON(): { code: ErrorCode; message: string; details?: Record<string, unknown> } {
    return {
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

export function toMediaFlowError(err: unknown): MediaFlowError {
  if (err instanceof MediaFlowError) return err;
  return new MediaFlowError("INTERNAL_ERROR", "Something went wrong. Please try again.");
}
