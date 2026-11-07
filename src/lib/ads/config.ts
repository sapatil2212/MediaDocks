/**
 * Ad configuration. Everything here is read at call time so tests can vary the
 * environment with vi.stubEnv. NEXT_PUBLIC_* values are inlined by Next at
 * build time, so changing them needs a rebuild and deploy.
 *
 * Ads are OFF unless NEXT_PUBLIC_ADS_ENABLED is exactly the string "true".
 */

/** AdSense publisher/client ID. Never print this in logs, tests or reports. */
export const ADSENSE_CLIENT_ID = "ca-pub-9958631141158615";

/** The only origin the ad script is ever loaded from. */
export const ADSENSE_SCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

/** The same publisher ID in the "pub-..." form used by ads.txt and the consent tool tag. */
export const ADSENSE_PUBLISHER_ID = ADSENSE_CLIENT_ID.replace(/^ca-/, "");

/**
 * Google's consent tool (AdSense Privacy & messaging, formerly Funding Choices).
 * This tag shows the messages published for the site (European regulations and
 * US state messages) and exposes the IAB TCF API (__tcfapi) and googlefc.
 */
export const FUNDING_CHOICES_SCRIPT_URL = `https://fundingchoicesmessages.google.com/i/${ADSENSE_PUBLISHER_ID}?ers=1`;

/** True only when the owner has explicitly switched ads on for this build. */
export function adsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
}

/** Ad unit slot IDs are 6 to 20 digits. Anything else is treated as missing. */
export function isValidSlotId(value: unknown): value is string {
  return typeof value === "string" && /^\d{6,20}$/.test(value);
}

/**
 * Slot ID of the in-article ad unit. The owner creates the unit in AdSense and
 * supplies the ID; there is no default. The literal property access is kept so
 * Next can inline the value at build time.
 */
export function getArticleSlotId(): string | undefined {
  return process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT;
}
