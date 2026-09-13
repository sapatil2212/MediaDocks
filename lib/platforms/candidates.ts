import {
  validateCandidates,
  type MediaCandidate,
  type ValidationResult,
} from "@/lib/media/candidates";
import { isDownloadableMediaUrl, probeMediaContentType } from "./base";

export type { MediaCandidate, CandidateReport, ValidationResult } from "@/lib/media/candidates";

/**
 * Wires the central validator to this project's transport and allow-list.
 *
 * Every media item in the app is produced through here, so classification rules
 * live in exactly one place.
 */
export async function resolveMediaCandidates(
  candidates: MediaCandidate[],
  options: { probe?: boolean } = {},
): Promise<ValidationResult> {
  return validateCandidates(candidates, {
    probeContentType: probeMediaContentType,
    isAllowedMediaUrl: (url) => isDownloadableMediaUrl(url),
    ...(options.probe === undefined ? {} : { probe: options.probe }),
  });
}
