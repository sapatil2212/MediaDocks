import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CMP_TIMEOUT_MS,
  consentFromTcData,
  consentModeFor,
  createGoogleCmpAdapter,
  getConsentAdapter,
  GOOGLE_VENDOR_ID,
  resetAdapterForTests,
} from "@/src/lib/ads/adapter";
import { FUNDING_CHOICES_SCRIPT_URL } from "@/src/lib/ads/config";
import {
  getConsent,
  registerAdapter,
  reopenConsent,
  resetConsentForTests,
  setConsent,
  type ConsentState,
} from "@/src/lib/ads/consent";
import { nextAction } from "@/src/lib/ads/eligibility";
import { ALLOWLISTED_GUIDE_SLUGS } from "@/src/lib/ads/allowlist-data";

const GUIDE = `/guides/${ALLOWLISTED_GUIDE_SLUGS[0]}`;
const SCRIPT_URL = "https://consent.test/tag.js";

/** TC data as Google's consent tool reports it for a GDPR visitor. */
function tc(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    tcString: "CP-test",
    tcfPolicyVersion: 5,
    cmpId: 300,
    cmpVersion: 1,
    gdprApplies: true,
    eventStatus: "tcloaded",
    cmpStatus: "loaded",
    listenerId: 1,
    purpose: { consents: { 1: true, 3: true, 4: true, 7: true }, legitimateInterests: { 2: true } },
    vendor: { consents: { [GOOGLE_VENDOR_ID]: true }, legitimateInterests: {}, disclosedVendors: { [GOOGLE_VENDOR_ID]: true } },
    ...overrides,
  };
}

describe("consentFromTcData (TCF -> ConsentState)", () => {
  const cases: Array<[string, unknown, unknown, ConsentState | null]> = [
    ["gdprApplies false", { gdprApplies: false, tcfPolicyVersion: 5, cmpId: 300, cmpVersion: 1 }, true, "not-required"],
    ["tcloaded with Purpose 1 and Google consent", tc(), true, "granted"],
    ["useractioncomplete with Purpose 1 and Google consent", tc({ eventStatus: "useractioncomplete" }), true, "granted"],
    ["Purpose 1 refused", tc({ purpose: { consents: { 1: false, 3: true, 4: true } } }), true, "denied"],
    ["Purpose 1 absent", tc({ purpose: { consents: {} } }), true, "denied"],
    ["Google (755) refused", tc({ vendor: { consents: { [GOOGLE_VENDOR_ID]: false } } }), true, "denied"],
    ["Google (755) missing from vendor consents", tc({ vendor: { consents: { 1: true, 2: true } } }), true, "denied"],
    ["Purpose 1 as the string 'true'", tc({ purpose: { consents: { 1: "true" } } }), true, "denied"],
    ["user declined everything", tc({ eventStatus: "useractioncomplete", purpose: { consents: {} }, vendor: { consents: {} } }), true, "denied"],
    ["cmpuishown (visitor not decided yet)", tc({ eventStatus: "cmpuishown" }), true, null],
    ["stub / loading status", tc({ eventStatus: undefined, cmpStatus: "loading" }), true, null],
    ["unknown eventStatus", tc({ eventStatus: "something" }), true, null],
    ["success false", tc(), false, null],
    ["success missing", tc(), undefined, null],
    ["gdprApplies undefined", tc({ gdprApplies: undefined }), true, null],
    ["gdprApplies as a string", tc({ gdprApplies: "false" }), true, null],
    ["null data", null, true, null],
    ["array data", [tc()], true, null],
    ["string data", "tcloaded", true, null],
    ["purpose missing", tc({ purpose: undefined }), true, null],
    ["purpose.consents not an object", tc({ purpose: { consents: "1111" } }), true, null],
    ["vendor missing", tc({ vendor: undefined }), true, null],
    ["vendor.consents is an array", tc({ vendor: { consents: [true] } }), true, null],
  ];
  it.each(cases)("%s", (_label, data, success, expected) => {
    expect(consentFromTcData(data, success)).toBe(expected);
  });

  it("gdprApplies false wins over any eventStatus", () => {
    expect(consentFromTcData({ gdprApplies: false, eventStatus: "cmpuishown" }, true)).toBe("not-required");
  });
});

describe("consentModeFor", () => {
  it("denies everything for denied and unknown", () => {
    for (const state of ["denied", "unknown"] as const) {
      expect(consentModeFor(state, tc())).toEqual({
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
      });
    }
  });

  it("maps granted purposes with Google's TCF mapping and keeps analytics denied", () => {
    expect(consentModeFor("granted", tc())).toEqual({
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "denied",
    });
    expect(consentModeFor("granted", tc({ purpose: { consents: { 1: true } } }))).toEqual({
      ad_storage: "granted",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
  });

  it("grants ad signals where consent is not required", () => {
    expect(consentModeFor("not-required", { gdprApplies: false })).toMatchObject({
      ad_storage: "granted",
      analytics_storage: "denied",
    });
  });
});

/* ───────────────────────────── fake browser ───────────────────────────── */

interface FakeNode {
  tagName: string;
  attrs: Record<string, string>;
  style: { cssText: string };
  name?: string;
  src?: string;
  async?: boolean;
  onerror?: (() => void) | null;
  setAttribute(key: string, value: string): void;
}

function fakeBrowser() {
  const head: FakeNode[] = [];
  const body: FakeNode[] = [];
  const order: string[] = [];
  const createElement = (tag: string): FakeNode => ({
    tagName: tag.toUpperCase(),
    attrs: {},
    style: { cssText: "" },
    setAttribute(key, value) {
      this.attrs[key] = value;
    },
  });
  const doc = {
    createElement,
    head: {
      appendChild: (node: FakeNode) => {
        order.push(`append:${node.tagName}`);
        head.push(node);
        return node;
      },
    },
    body: {
      appendChild: (node: FakeNode) => {
        body.push(node);
        return node;
      },
    },
    querySelector: (selector: string) => {
      const attr = /^script\[([^\]]+)\]$/.exec(selector)?.[1];
      if (attr) return head.find((n) => n.tagName === "SCRIPT" && attr in n.attrs) ?? null;
      if (selector.startsWith("iframe[name=")) return body.find((n) => n.tagName === "IFRAME") ?? null;
      return null;
    },
  };
  const win: Record<string, any> = {};
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", doc);

  let listener: ((data: unknown, success: unknown) => void) | null = null;
  let addEventListenerCalls = 0;

  /** Simulates Google's tag finishing loading: defines __tcfapi and drains the queue. */
  const loadCmp = () => {
    win.__tcfapi = (command: string, version: number, cb: (d: unknown, s: unknown) => void) => {
      if (command === "addEventListener" && version === 2) {
        addEventListenerCalls += 1;
        listener = cb;
      }
    };
    win.googlefc.showRevocationMessage = vi.fn();
    const queued = win.googlefc.callbackQueue as Array<Record<string, () => void>>;
    win.googlefc.callbackQueue = {
      push(entry: Record<string, () => void>) {
        for (const fn of Object.values(entry)) fn();
        return 0;
      },
    };
    for (const entry of queued) win.googlefc.callbackQueue.push(entry);
  };

  const emit = (data: unknown, success: unknown = true) => listener?.(data, success);
  const dataLayer = () => ((win.dataLayer ?? []) as IArguments[]).map((a) => Array.from(a));

  return { win, head, body, order, loadCmp, emit, dataLayer, listenerCount: () => addEventListenerCalls };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.unstubAllEnvs();
  resetConsentForTests();
  resetAdapterForTests();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  resetConsentForTests();
  resetAdapterForTests();
});

describe("Google consent tool adapter", () => {
  it("sets Consent Mode defaults to denied before loading the consent tool tag", () => {
    const b = fakeBrowser();
    createGoogleCmpAdapter({ scriptUrl: SCRIPT_URL }).install(vi.fn());
    expect(b.dataLayer()[0]).toEqual([
      "consent",
      "default",
      { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" },
    ]);
    expect(b.head).toHaveLength(1);
    expect(b.head[0].tagName).toBe("SCRIPT");
    expect(b.head[0].src).toBe(SCRIPT_URL);
    expect(b.head[0].async).toBe(true);
    expect(b.body.map((n) => n.name)).toEqual(["googlefcPresent"]);
    expect(b.body[0].style.cssText).toContain("display:none");
  });

  it("reports nothing until the consent tool answers", () => {
    const b = fakeBrowser();
    const report = vi.fn();
    createGoogleCmpAdapter({ scriptUrl: SCRIPT_URL }).install(report);
    b.loadCmp();
    b.emit(tc({ eventStatus: undefined, cmpStatus: "loading" }));
    expect(report).not.toHaveBeenCalled();
  });

  it.each([
    ["gdprApplies false", { gdprApplies: false }, "not-required"],
    ["consent granted", tc(), "granted"],
    ["consent denied", tc({ eventStatus: "useractioncomplete", purpose: { consents: {} } }), "denied"],
    ["Google vendor missing", tc({ vendor: { consents: {} } }), "denied"],
  ] as const)("%s -> reports %s and updates Consent Mode", (_label, data, expected) => {
    const b = fakeBrowser();
    const report = vi.fn();
    createGoogleCmpAdapter({ scriptUrl: SCRIPT_URL }).install(report);
    b.loadCmp();
    b.emit(data);
    expect(report.mock.calls).toEqual([[expected]]);
    const updates = b.dataLayer().filter((e) => e[1] === "update");
    expect(updates).toEqual([["consent", "update", consentModeFor(expected, data)]]);
  });

  it("malformed data stays unknown", () => {
    const b = fakeBrowser();
    const report = vi.fn();
    createGoogleCmpAdapter({ scriptUrl: SCRIPT_URL }).install(report);
    b.loadCmp();
    b.emit(tc({ purpose: "broken" }));
    b.emit(null);
    b.emit(tc(), false);
    expect(report).not.toHaveBeenCalled();
    expect(b.dataLayer().some((e) => e[1] === "update")).toBe(false);
  });

  it("reports once per page load for repeated identical signals", () => {
    const b = fakeBrowser();
    const report = vi.fn();
    const adapter = createGoogleCmpAdapter({ scriptUrl: SCRIPT_URL });
    adapter.install(report);
    adapter.install(report);
    b.loadCmp();
    b.emit(tc());
    b.emit(tc());
    expect(report.mock.calls).toEqual([["granted"]]);
    expect(b.head).toHaveLength(1);
    expect(b.listenerCount()).toBe(1);
  });

  it("reports a later change, such as withdrawing consent", () => {
    const b = fakeBrowser();
    const report = vi.fn();
    createGoogleCmpAdapter({ scriptUrl: SCRIPT_URL }).install(report);
    b.loadCmp();
    b.emit(tc());
    b.emit(tc({ eventStatus: "cmpuishown", purpose: { consents: {} } }));
    b.emit(tc({ eventStatus: "useractioncomplete", purpose: { consents: {} } }));
    expect(report.mock.calls).toEqual([["granted"], ["denied"]]);
  });

  it("times out to unknown when the consent tool never answers", () => {
    const b = fakeBrowser();
    const report = vi.fn();
    createGoogleCmpAdapter({ scriptUrl: SCRIPT_URL }).install(report);
    vi.advanceTimersByTime(CMP_TIMEOUT_MS);
    b.loadCmp();
    b.emit(tc());
    expect(report).not.toHaveBeenCalled();
    expect(b.listenerCount()).toBe(0);
  });

  it("uses a 10 second timeout", () => {
    expect(CMP_TIMEOUT_MS).toBe(10_000);
  });

  it("keeps waiting while the message is shown to the visitor", () => {
    const b = fakeBrowser();
    const report = vi.fn();
    createGoogleCmpAdapter({ scriptUrl: SCRIPT_URL }).install(report);
    b.loadCmp();
    b.emit(tc({ eventStatus: "cmpuishown", purpose: { consents: {} }, vendor: { consents: {} } }));
    vi.advanceTimersByTime(CMP_TIMEOUT_MS * 3);
    b.emit(tc({ eventStatus: "useractioncomplete" }));
    expect(report.mock.calls).toEqual([["granted"]]);
  });

  it("stays unknown when the consent tool tag fails to load", () => {
    const b = fakeBrowser();
    const report = vi.fn();
    createGoogleCmpAdapter({ scriptUrl: SCRIPT_URL }).install(report);
    b.head[0].onerror?.();
    b.loadCmp();
    b.emit(tc());
    expect(report).not.toHaveBeenCalled();
  });

  it("reopen calls googlefc.showRevocationMessage when available", () => {
    const b = fakeBrowser();
    const adapter = createGoogleCmpAdapter({ scriptUrl: SCRIPT_URL });
    adapter.install(vi.fn());
    expect(adapter.reopen()).toBe(false);
    b.loadCmp();
    b.emit(tc());
    expect(adapter.reopen()).toBe(true);
    expect(b.win.googlefc.showRevocationMessage).toHaveBeenCalledTimes(1);
  });

  it("reopen reports nothing to show when no consent applies", () => {
    const b = fakeBrowser();
    const adapter = createGoogleCmpAdapter({ scriptUrl: SCRIPT_URL });
    adapter.install(vi.fn());
    b.loadCmp();
    b.emit({ gdprApplies: false });
    expect(adapter.reopen()).toBe(false);
    expect(b.win.googlefc.showRevocationMessage).not.toHaveBeenCalled();
  });

  it("creating the adapter touches no browser globals (server-safe)", () => {
    expect(typeof window).toBe("undefined");
    expect(() => createGoogleCmpAdapter({ scriptUrl: SCRIPT_URL })).not.toThrow();
  });
});

describe("getConsentAdapter", () => {
  it("returns no adapter unless ads are enabled", () => {
    expect(getConsentAdapter()).toBeNull();
    for (const value of ["false", "TRUE", "1", " true", ""]) {
      vi.stubEnv("NEXT_PUBLIC_ADS_ENABLED", value);
      expect(getConsentAdapter(), value).toBeNull();
    }
  });

  it("returns one Google consent tool adapter when ads are enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_ADS_ENABLED", "true");
    const adapter = getConsentAdapter();
    expect(adapter).not.toBeNull();
    expect(getConsentAdapter()).toBe(adapter);
  });

  it("loads the publisher's Funding Choices tag from config", () => {
    vi.stubEnv("NEXT_PUBLIC_ADS_ENABLED", "true");
    const b = fakeBrowser();
    getConsentAdapter()!.install(vi.fn());
    const src = b.head[0].src ?? "";
    // Compared as booleans so a failure never prints the publisher ID.
    expect(src === FUNDING_CHOICES_SCRIPT_URL).toBe(true);
    expect(/^https:\/\/fundingchoicesmessages\.google\.com\/i\/pub-\d{10,20}\?ers=1$/.test(src)).toBe(true);
  });
});

describe("adapter with the consent store and runtime sequencing", () => {
  const state = (cmpInstalled: boolean, adScriptLoaded = false) => ({
    pathname: GUIDE,
    consent: getConsent(),
    denyMarkerPresent: false,
    cmpInstalled,
    adScriptLoaded,
  });

  function enable(): void {
    vi.stubEnv("NEXT_PUBLIC_ADS_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT", "1234567890");
  }

  it("flag off: the runtime never asks to install the consent tool", () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT", "1234567890");
    expect(nextAction(state(false))).toBe("none");
    setConsent("granted");
    expect(nextAction(state(false))).toBe("none");
    expect(getConsentAdapter()).toBeNull();
  });

  it.each([
    ["granted", tc(), "load-ad-script"],
    ["not-required", { gdprApplies: false }, "load-ad-script"],
    ["denied", tc({ eventStatus: "useractioncomplete", vendor: { consents: {} } }), "none"],
  ] as const)("consent tool first; %s -> %s", (expected, data, action) => {
    enable();
    const b = fakeBrowser();
    expect(nextAction(state(false))).toBe("install-cmp");
    const adapter = getConsentAdapter()!;
    adapter.install(setConsent);
    registerAdapter(adapter);
    expect(nextAction(state(true))).toBe("none");
    b.loadCmp();
    b.emit(data);
    expect(getConsent()).toBe(expected);
    expect(nextAction(state(true))).toBe(action);
  });

  it("timeout leaves consent unknown, so no ad script", () => {
    enable();
    fakeBrowser();
    const adapter = createGoogleCmpAdapter({ scriptUrl: SCRIPT_URL });
    adapter.install(setConsent);
    vi.advanceTimersByTime(CMP_TIMEOUT_MS + 1);
    expect(getConsent()).toBe("unknown");
    expect(nextAction(state(true))).toBe("none");
  });

  it("reopenConsent forwards the adapter's answer", () => {
    const b = fakeBrowser();
    const adapter = createGoogleCmpAdapter({ scriptUrl: SCRIPT_URL });
    adapter.install(setConsent);
    registerAdapter(adapter);
    expect(reopenConsent()).toBe(false);
    b.loadCmp();
    b.emit(tc());
    expect(reopenConsent()).toBe(true);
  });
});
