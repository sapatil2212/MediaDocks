/**
 * Build-time ad state, used to word the privacy policy so it never claims more
 * or less than the shipped build does. Pure, server-safe, no ad bytes: it reads
 * the same inputs as the runtime (flag, slot ID, consent adapter) and nothing else.
 */
import { getConsentAdapter } from "./adapter";
import { adsEnabled, getArticleSlotId, isValidSlotId } from "./config";

export type AdState = "off" | "enabled-no-cmp" | "enabled-with-cmp";

/** "off" wins if the flag is off or the slot is invalid, since neither can show an ad. */
export function adStateFrom(enabled: boolean, slotValid: boolean, hasAdapter: boolean): AdState {
  if (!enabled || !slotValid) return "off";
  return hasAdapter ? "enabled-with-cmp" : "enabled-no-cmp";
}

export function getAdState(): AdState {
  return adStateFrom(adsEnabled(), isValidSlotId(getArticleSlotId()), getConsentAdapter() !== null);
}

export interface AdStateCopy {
  /** One sentence for the advertising section. */
  summary: string;
  /** Text for the ad-choices section. */
  choices: string;
}

export function adStateCopy(state: AdState): AdStateCopy {
  switch (state) {
    case "off":
      return {
        summary: "The version of MediaDocks you are reading does not request any ads.",
        choices:
          "This version of MediaDocks does not request ads, so there is no ad consent control to change. The links below still let you manage ad personalization on the web in general.",
      };
    case "enabled-no-cmp":
      return {
        summary:
          "Ads are configured for long-form guide pages, but no consent tool is installed in this version, so no ads are requested.",
        choices:
          "Ads are configured for guide pages, but no consent tool is installed in this version, so no ads are requested and there is nothing to withdraw on MediaDocks. The links below let you manage ad personalization on the web in general.",
      };
    case "enabled-with-cmp":
      return {
        summary:
          "Ads appear only on long-form guide pages, and only after the consent tool reports your choice where one is required.",
        choices:
          "On guide pages a consent tool lets you accept, decline or change your choice, including withdrawing consent you gave earlier. Use the “Privacy choices” control in the footer of a guide page to reopen it. The links below let you manage ad personalization on the web in general.",
      };
  }
}
