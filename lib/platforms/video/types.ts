import type { MediaCandidate } from "@/lib/media/candidates";
import type { PublicMetadata } from "../metadata";

/**
 * What a video extractor gets to work with. The platform resolver has already
 * fetched the public page / JSON, so extractors do no I/O of their own and are
 * trivially unit-testable against fixtures.
 */
export interface VideoResolverInput {
  url: URL;
  /** Raw public page HTML, when the platform resolver fetched one. */
  html?: string;
  /** Parsed public metadata for that page. */
  metadata?: PublicMetadata;
  /** Platform JSON payload, e.g. the X syndication response. */
  payload?: unknown;
}

/**
 * Per-platform video extraction.
 *
 * `resolve` returns *candidates*, not finished media: classification is done
 * centrally by `validateCandidates` so an extractor can never mislabel a file
 * (see lib/media/candidates.ts).
 */
export interface VideoResolver {
  readonly name: string;
  canResolve(input: VideoResolverInput): boolean;
  resolve(input: VideoResolverInput): Promise<MediaCandidate[]>;
}
