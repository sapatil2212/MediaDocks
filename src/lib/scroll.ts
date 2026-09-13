export const DOWNLOADER_ID = "downloader";
export const SET_URL_EVENT = "mediaflow:set-url";

export function scrollToDownloader() {
  if (typeof document === "undefined") return;
  const el = document.getElementById(DOWNLOADER_ID);
  if (!el) {
    window.location.href = `/#${DOWNLOADER_ID}`;
    return;
  }
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
}

/** Fill the downloader input from anywhere without global state. */
export function requestUrl(url: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>(SET_URL_EVENT, { detail: url }));
  scrollToDownloader();
}
