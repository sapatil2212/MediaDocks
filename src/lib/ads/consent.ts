/**
 * In-memory consent store (client only). State starts "unknown" on every page
 * load and only a consent adapter can move it, so first paint never has ads.
 */

export type ConsentState = "unknown" | "granted" | "denied" | "not-required";

export interface ConsentAdapter {
  /** Must call `report` on every page load, including for returning visitors. */
  install(report: (state: ConsentState) => void): void;
  /** Shows the consent tool's change/withdraw UI. */
  reopen(): void;
}

const VALID: readonly ConsentState[] = ["unknown", "granted", "denied", "not-required"];

let current: ConsentState = "unknown";
let adapterInstalled = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const fn of Array.from(listeners)) {
    try {
      fn();
    } catch {
      // A failing subscriber must not block the others.
    }
  }
}

export function getConsent(): ConsentState {
  return current;
}

/** Invalid input is ignored. Subscribers are notified only on change. */
export function setConsent(state: ConsentState): void {
  if (!VALID.includes(state) || state === current) return;
  current = state;
  notify();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function hasAdapter(): boolean {
  return adapterInstalled;
}

export function setHasAdapter(): void {
  if (adapterInstalled) return;
  adapterInstalled = true;
  notify();
}

let installedAdapter: ConsentAdapter | null = null;

/** Called by AdRuntime after a successful install. */
export function registerAdapter(adapter: ConsentAdapter): void {
  installedAdapter = adapter;
  setHasAdapter();
}

/** Opens the consent tool's change/withdraw UI. Returns false if none is installed. */
export function reopenConsent(): boolean {
  if (!installedAdapter) return false;
  try {
    installedAdapter.reopen();
    return true;
  } catch {
    return false;
  }
}

/** Test helper: resets module state. */
export function resetConsentForTests(): void {
  current = "unknown";
  adapterInstalled = false;
  installedAdapter = null;
  listeners.clear();
}
