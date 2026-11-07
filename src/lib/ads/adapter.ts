/**
 * The single provisioning seam for a consent management platform, wired to
 * Google's certified consent tool (AdSense Privacy & messaging, IAB TCF v2).
 *
 * AdRuntime calls install() only where decideCmp() allows it, before any ad
 * script. The adapter then:
 *   1. sets Google Consent Mode v2 defaults to denied,
 *   2. loads Google's consent tool tag for this publisher,
 *   3. listens through the TCF API (__tcfapi addEventListener) and reports a
 *      consent state on every page load once the tool has one.
 *
 * Fail closed: until a valid TCF signal arrives the state stays "unknown", so
 * no ad script loads. A tag that fails to load, never answers within
 * CMP_TIMEOUT_MS, or sends malformed data leaves it "unknown".
 *
 * With NEXT_PUBLIC_ADS_ENABLED not exactly "true" there is no adapter at all.
 * Nothing a visitor controls can swap the adapter or the tag URL at runtime.
 */
import type { ConsentAdapter, ConsentState } from "./consent";
import { adsEnabled, FUNDING_CHOICES_SCRIPT_URL } from "./config";

/** Google Advertising Products in the IAB Global Vendor List. */
export const GOOGLE_VENDOR_ID = 755;

/** How long the consent tool has to answer before the state stays unknown. */
export const CMP_TIMEOUT_MS = 10_000;

const CMP_SCRIPT_ATTR = "data-consent-tool";
const FC_PRESENT_FRAME = "googlefcPresent";

type TcfListener = (tcData: unknown, success: unknown) => void;
type GoogleFcQueueEntry = Record<string, () => void>;

interface GoogleFc {
  callbackQueue?: { push(entry: GoogleFcQueueEntry): unknown };
  showRevocationMessage?: () => void;
}

declare global {
  interface Window {
    googlefc?: GoogleFc;
    __tcfapi?: (command: string, version: number, callback: TcfListener, parameter?: unknown) => void;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type ConsentModeValue = "granted" | "denied";
export interface ConsentModeUpdate {
  ad_storage: ConsentModeValue;
  ad_user_data: ConsentModeValue;
  ad_personalization: ConsentModeValue;
  analytics_storage: ConsentModeValue;
}

/** Consent Mode v2 defaults, set before the consent tool or any ad script loads. */
export const CONSENT_MODE_DEFAULTS: ConsentModeUpdate = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reads `obj[key]` as a record, or null if it is missing or not an object. */
function recordAt(obj: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const value = obj[key];
  return isRecord(value) ? value : null;
}

/**
 * Maps one TCF addEventListener callback to a consent state.
 *
 * - success !== true, non-object data, gdprApplies not a boolean: null (no
 *   decision; the state stays as it is).
 * - gdprApplies === false: "not-required".
 * - eventStatus "tcloaded" or "useractioncomplete" with well-formed purpose and
 *   vendor consent maps: "granted" only if Purpose 1 and Google (vendor 755)
 *   both have consent, otherwise "denied".
 * - Any other event (stub, loading, "cmpuishown") or malformed maps: null.
 */
export function consentFromTcData(tcData: unknown, success: unknown): ConsentState | null {
  if (success !== true || !isRecord(tcData)) return null;
  if (tcData.gdprApplies === false) return "not-required";
  if (tcData.gdprApplies !== true) return null;
  if (tcData.eventStatus !== "tcloaded" && tcData.eventStatus !== "useractioncomplete") return null;

  const purpose = recordAt(tcData, "purpose");
  const vendor = recordAt(tcData, "vendor");
  const purposeConsents = purpose && recordAt(purpose, "consents");
  const vendorConsents = vendor && recordAt(vendor, "consents");
  if (!purposeConsents || !vendorConsents) return null;

  const granted = purposeConsents["1"] === true && vendorConsents[String(GOOGLE_VENDOR_ID)] === true;
  return granted ? "granted" : "denied";
}

/**
 * Consent Mode values for a reported state, using Google's TCF purpose mapping
 * (Purpose 1 -> ad_storage and ad_user_data, 3 and 4 -> ad_personalization,
 * 7 -> ad_user_data). analytics_storage stays denied: MediaDocks loads no
 * Google Analytics tag.
 */
export function consentModeFor(state: ConsentState, tcData: unknown): ConsentModeUpdate {
  if (state === "not-required") {
    return { ...CONSENT_MODE_DEFAULTS, ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" };
  }
  if (state !== "granted" || !isRecord(tcData)) return { ...CONSENT_MODE_DEFAULTS };
  const purpose = recordAt(tcData, "purpose");
  const consents = (purpose && recordAt(purpose, "consents")) ?? {};
  const has = (id: number) => consents[String(id)] === true;
  const value = (ok: boolean): ConsentModeValue => (ok ? "granted" : "denied");
  return {
    ad_storage: value(has(1)),
    ad_user_data: value(has(1) && has(7)),
    ad_personalization: value(has(3) && has(4)),
    analytics_storage: "denied",
  };
}

/** gtag() as Google documents it: pushes the arguments object to dataLayer. */
function gtagFor(w: Window): (...args: unknown[]) => void {
  if (typeof w.gtag === "function") return w.gtag;
  const gtag = function gtag() {
    // Google's tag reads the arguments object itself, not an array copy.
    (w.dataLayer = w.dataLayer || []).push(arguments);
  };
  w.gtag = gtag;
  return gtag;
}

/** Google's tag adds this hidden frame so ad frames can find the consent tool. */
function signalGooglefcPresent(doc: Document): void {
  if (doc.querySelector(`iframe[name="${FC_PRESENT_FRAME}"]`)) return;
  const frame = doc.createElement("iframe");
  frame.name = FC_PRESENT_FRAME;
  frame.title = "";
  frame.tabIndex = -1;
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "display:none;width:0;height:0;border:none;";
  doc.body.appendChild(frame);
}

export interface GoogleCmpOptions {
  scriptUrl: string;
  timeoutMs?: number;
}

/** Builds the adapter. Touches window and document only inside install()/reopen(). */
export function createGoogleCmpAdapter({ scriptUrl, timeoutMs = CMP_TIMEOUT_MS }: GoogleCmpOptions): ConsentAdapter {
  let installed = false;
  let listening = false;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let reported: ConsentState | null = null;

  const clearTimer = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  return {
    install(report) {
      if (installed) return;
      installed = true;
      const w = window;
      const doc = document;

      const gtag = gtagFor(w);
      gtag("consent", "default", { ...CONSENT_MODE_DEFAULTS });

      const onTcData: TcfListener = (tcData, success) => {
        if (stopped) return;
        const state = consentFromTcData(tcData, success);
        if (state === null) {
          // The tool is up and asking the visitor: their answer may take longer
          // than the timeout, so stop the clock but report nothing yet.
          if (success === true && isRecord(tcData) && tcData.eventStatus === "cmpuishown") clearTimer();
          return;
        }
        clearTimer();
        if (state === reported) return;
        reported = state;
        try {
          gtag("consent", "update", consentModeFor(state, tcData));
        } catch {
          // Consent Mode is a signal for Google tags; the decision still stands.
        }
        report(state);
      };

      const attach = () => {
        if (listening || stopped || typeof w.__tcfapi !== "function") return;
        listening = true;
        try {
          w.__tcfapi("addEventListener", 2, onTcData);
        } catch {
          listening = false;
        }
      };

      const fc = (w.googlefc = w.googlefc || {});
      const queue = (fc.callbackQueue = fc.callbackQueue || ([] as GoogleFcQueueEntry[]));
      queue.push({ CONSENT_API_READY: attach });
      queue.push({ CONSENT_DATA_READY: attach });

      timer = setTimeout(() => {
        timer = null;
        stopped = true;
      }, timeoutMs);

      if (!doc.querySelector(`script[${CMP_SCRIPT_ATTR}]`)) {
        const script = doc.createElement("script");
        script.async = true;
        script.src = scriptUrl;
        script.setAttribute(CMP_SCRIPT_ATTR, "");
        script.onerror = () => {
          clearTimer();
          stopped = true;
        };
        doc.head.appendChild(script);
      }
      signalGooglefcPresent(doc);
      attach();
    },

    reopen() {
      // No EU regulations message applies to this visitor, so there is nothing
      // to reopen; the caller shows the privacy page's choices instead.
      if (reported === "not-required") return false;
      const fc = typeof window === "undefined" ? undefined : window.googlefc;
      if (!fc || typeof fc.showRevocationMessage !== "function") return false;
      fc.showRevocationMessage();
      return true;
    },
  };
}

let adapter: ConsentAdapter | null = null;

/**
 * Returns Google's consent tool adapter when ads are enabled for this build,
 * otherwise null. AdRuntime installs it only where decideCmp() permits.
 */
export function getConsentAdapter(): ConsentAdapter | null {
  if (!adsEnabled()) return null;
  adapter ??= createGoogleCmpAdapter({ scriptUrl: FUNDING_CHOICES_SCRIPT_URL });
  return adapter;
}

/** Test helper: forgets the adapter so the next call builds a fresh one. */
export function resetAdapterForTests(): void {
  adapter = null;
}
