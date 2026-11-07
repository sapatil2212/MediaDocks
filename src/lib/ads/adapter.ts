import type { ConsentAdapter } from "./consent";

/**
 * The single provisioning seam for a consent management platform.
 *
 * It returns null until the owner picks a CMP (Google's consent tool under
 * AdSense Privacy & messaging, or another Google-certified CMP). With no
 * adapter the consent state stays "unknown", so no ad is ever requested. That is
 * a valid, safe shipped state. Nothing a visitor controls can swap this at
 * runtime.
 */
export function getConsentAdapter(): ConsentAdapter | null {
  return null;
}
