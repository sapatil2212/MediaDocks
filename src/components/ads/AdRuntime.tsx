"use client";

/**
 * The only code that creates an AdSense <script> or installs a consent adapter.
 *
 * It holds no eligibility logic: it asks nextAction() what to do and executes
 * the answer. Order is always consent tool first, ad script only after consent
 * is reported. Nothing third-party loads on any page that is not an allowlisted
 * guide, and an ad script cannot be unloaded, so leaving a page that has one
 * (or showing an error page) tears down with a full reload.
 */
import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { getConsentAdapter } from "@/lib/ads/adapter";
import { ADSENSE_SCRIPT_URL } from "@/lib/ads/config";
import {
  getConsent,
  registerAdapter,
  setConsent,
  subscribe,
} from "@/lib/ads/consent";
import {
  needsSyncTeardown,
  nextAction,
  type RuntimeState,
} from "@/lib/ads/eligibility";

const GUARD_KEY = "ads-teardown-at";
const GUARD_WINDOW_MS = 10_000;
const SCRIPT_ATTR = "data-adsense-runtime";

let cmpInstalled = false;
let adScriptLoaded = false;
let halted = false;
let reloading = false;
let pendingFrame: number | null = null;
let observer: MutationObserver | null = null;
let currentPathname: string | null = null;

const runtimeListeners = new Set<() => void>();

/** Lets ArticleAd re-check after the runtime changed state. */
export function subscribeRuntime(fn: () => void): () => void {
  runtimeListeners.add(fn);
  return () => {
    runtimeListeners.delete(fn);
  };
}

function notifyRuntime(): void {
  for (const fn of Array.from(runtimeListeners)) {
    try {
      fn();
    } catch {
      // Ignore subscriber errors.
    }
  }
}

function warn(message: string, error: unknown): void {
  if (process.env.NODE_ENV === "development") console.warn(`[ads] ${message}`, error);
}

function readState(): RuntimeState {
  const pathname = currentPathname ?? window.location.pathname;
  const marker = document.querySelector("[data-ad-deny]");
  return {
    pathname,
    consent: getConsent(),
    denyMarkerPresent: marker !== null,
    cmpInstalled,
    adScriptLoaded,
  };
}

function disconnectObserver(): void {
  observer?.disconnect();
  observer = null;
}

function attachObserver(): void {
  if (observer || typeof MutationObserver === "undefined") return;
  observer = new MutationObserver(() => scheduleEvaluate());
  observer.observe(document.body, { childList: true, subtree: true });
}

function teardown(mode: "always" | "guarded"): void {
  if (reloading) return;
  disconnectObserver();

  if (mode === "guarded") {
    try {
      const raw = window.sessionStorage.getItem(GUARD_KEY);
      const last = raw === null ? NaN : Number(raw);
      if (Number.isFinite(last) && Date.now() - last < GUARD_WINDOW_MS) {
        halted = true;
        return;
      }
      window.sessionStorage.setItem(GUARD_KEY, String(Date.now()));
    } catch {
      // Without a usable guard a reload could loop, so do not reload.
      halted = true;
      return;
    }
  }

  try {
    reloading = true;
    window.location.reload();
  } catch (error) {
    reloading = false;
    halted = true;
    warn("reload failed", error);
  }
}

function installCmp(): void {
  const adapter = getConsentAdapter();
  if (adapter === null) return;
  try {
    adapter.install(setConsent);
  } catch (error) {
    warn("consent adapter failed to install", error);
    return;
  }
  cmpInstalled = true;
  registerAdapter(adapter);
  attachObserver();
}

function loadAdScript(): void {
  if (!document.querySelector(`script[${SCRIPT_ATTR}]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = ADSENSE_SCRIPT_URL;
    script.setAttribute(SCRIPT_ATTR, "");
    document.head.appendChild(script);
  }
  adScriptLoaded = true;
  attachObserver();
}

function evaluate(): void {
  if (typeof window === "undefined") return;
  let action = nextAction(readState());

  // Once halted, marker-driven work stops. Navigation teardown still runs.
  if (
    halted &&
    (action === "install-cmp" || action === "load-ad-script" || action === "teardown-guarded")
  ) {
    action = "none";
  }

  switch (action) {
    case "install-cmp":
      installCmp();
      break;
    case "load-ad-script":
      loadAdScript();
      break;
    case "teardown":
      teardown("always");
      break;
    case "teardown-guarded":
      teardown("guarded");
      break;
    default:
      break;
  }
  notifyRuntime();
}

function scheduleEvaluate(): void {
  if (typeof window === "undefined") return;
  if (pendingFrame !== null) window.cancelAnimationFrame(pendingFrame);
  pendingFrame = window.requestAnimationFrame(() => {
    pendingFrame = null;
    evaluate();
  });
}

function cancelPending(): void {
  if (pendingFrame !== null) {
    window.cancelAnimationFrame(pendingFrame);
    pendingFrame = null;
  }
}

export function AdRuntime() {
  const pathname = usePathname();
  const consent = useSyncExternalStore(subscribe, getConsent, () => "unknown" as const);
  currentPathname = pathname;

  // Leaving the allowlist is handled in the same commit as the navigation.
  useLayoutEffect(() => {
    currentPathname = pathname;
    if (needsSyncTeardown(readState())) {
      cancelPending();
      evaluate();
    }
  }, [pathname]);

  // Allow direction: wait a frame so the page child has committed and any deny
  // marker it renders is in the DOM.
  useEffect(() => {
    scheduleEvaluate();
    return () => cancelPending();
  }, [pathname, consent]);

  useEffect(() => {
    return () => {
      currentPathname = null;
    };
  }, []);

  return null;
}
