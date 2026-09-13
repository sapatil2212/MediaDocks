import type { CandidateReport, MediaCandidate } from "@/lib/media/candidates";
import type { ResolvedMedia } from "../types";
import { resolveMediaCandidates } from "../candidates";
import { FacebookVideoResolver } from "./facebook";
import { InstagramVideoResolver } from "./instagram";
import { PinterestVideoResolver } from "./pinterest";
import { TwitterVideoResolver } from "./x";
import type { VideoResolver, VideoResolverInput } from "./types";

export type { VideoResolver, VideoResolverInput } from "./types";
export type { CandidateReport, MediaCandidate } from "@/lib/media/candidates";

/** One instance each; extractors are stateless. */
export const videoResolvers = {
  instagram: new InstagramVideoResolver(),
  x: new TwitterVideoResolver(),
  pinterest: new PinterestVideoResolver(),
  facebook: new FacebookVideoResolver(),
} as const;

export interface VideoExtraction {
  items: ResolvedMedia[];
  candidates: MediaCandidate[];
  report: CandidateReport[];
  resolverName: string;
}

/**
 * Runs a platform's video extractor, then validates every candidate centrally.
 *
 * Extraction and validation stay separate on purpose: the extractor may guess,
 * the validator decides.
 */
export async function extractVideo(
  resolver: VideoResolver,
  input: VideoResolverInput,
  options: { probe?: boolean } = {},
): Promise<VideoExtraction> {
  const candidates = resolver.canResolve(input) ? await resolver.resolve(input) : [];
  const { items, report } = await resolveMediaCandidates(candidates, options);

  // Only genuine video items count as a video result.
  const videoItems = items.filter((item) => item.kind === "video");

  return { items: videoItems, candidates, report, resolverName: resolver.name };
}
