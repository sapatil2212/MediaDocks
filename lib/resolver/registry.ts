import type { PlatformResolver } from "@/lib/platforms/base";
import { InstagramResolver } from "@/lib/platforms/instagram";
import { YouTubeResolver } from "@/lib/platforms/youtube";
import { PinterestResolver } from "@/lib/platforms/pinterest";
import { FacebookResolver } from "@/lib/platforms/facebook";
import { XResolver } from "@/lib/platforms/x";
import type { Platform } from "@/lib/platforms/types";

/**
 * One instance per platform, created once at module load. Resolvers are
 * stateless, so nothing needs to be re-instantiated per request.
 */
const resolvers: Readonly<Record<Platform, PlatformResolver>> = Object.freeze({
  instagram: new InstagramResolver(),
  youtube: new YouTubeResolver(),
  pinterest: new PinterestResolver(),
  facebook: new FacebookResolver(),
  x: new XResolver(),
});

export function getResolver(platform: Platform): PlatformResolver {
  return resolvers[platform];
}

export const supportedPlatforms = Object.keys(resolvers) as Platform[];
