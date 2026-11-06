/**
 * Pinterest URL rules shared by the server detector, the browser-side detector
 * and the resolvers.
 *
 * This module is bundled into the client, so it must stay pure: no Node
 * imports and no server config.
 */

/**
 * Country domains Pinterest serves Pins on. Taken from yt-dlp's
 * PinterestBaseIE, plus `se`. An explicit list (rather than "pinterest.<any>")
 * keeps hosts like `pinterest.evil.com` from being treated as Pinterest.
 */
export const PINTEREST_TLDS: readonly string[] = [
  "com",
  "fr",
  "de",
  "ch",
  "jp",
  "cl",
  "ca",
  "it",
  "co.uk",
  "nz",
  "ru",
  "com.au",
  "at",
  "pt",
  "co.kr",
  "es",
  "com.mx",
  "dk",
  "ph",
  "th",
  "com.uy",
  "co",
  "nl",
  "info",
  "kr",
  "ie",
  "vn",
  "com.vn",
  "ec",
  "mx",
  "in",
  "pe",
  "co.at",
  "hu",
  "co.in",
  "co.nz",
  "id",
  "com.ec",
  "com.py",
  "tw",
  "be",
  "uk",
  "com.bo",
  "com.pe",
  "se",
];

const HOST_RE = new RegExp(
  `^(?:[a-z0-9-]+\\.)*pinterest\\.(?:${PINTEREST_TLDS.map((tld) => tld.replace(/\./g, "\\.")).join("|")})$`,
);

function cleanHost(host: string): string {
  return host.trim().toLowerCase().replace(/\.$/, "");
}

/** True for pinterest.com, its subdomains (in., uk., api.) and country domains. */
export function isPinterestHost(host: string): boolean {
  return HOST_RE.test(cleanHost(host));
}

/** True for the pin.it shortener. */
export function isPinterestShortHost(host: string): boolean {
  const clean = cleanHost(host);
  return clean === "pin.it" || clean === "www.pin.it";
}

/**
 * Reads the Pin id from a Pin path.
 *
 * Covers `/pin/<id>/`, `/pin/<id>/sent/` and `/pin/<slug>--<id>/`. Non-numeric
 * Pin tokens are returned as-is.
 */
export function extractPinId(pathname: string): string | undefined {
  const numeric = pathname.match(/^\/pin\/(?:[\w-]+--)?(\d+)(?:\/|$)/);
  if (numeric?.[1]) return numeric[1];
  const opaque = pathname.match(/^\/pin\/([A-Za-z0-9_-]+)(?:\/|$)/);
  return opaque?.[1];
}

/**
 * The one URL every Pin link is read through: `https://www.pinterest.com/pin/<id>/`.
 *
 * Country domains, share parameters (`invite_code`, `sender`, `sfo`, `utm_*`)
 * and `/sent/` suffixes all collapse into it. Returns undefined when the URL is
 * not a Pin on a Pinterest host.
 */
export function canonicalPinUrl(input: string | URL): URL | undefined {
  let url: URL;
  try {
    url = input instanceof URL ? input : new URL(input);
  } catch {
    return undefined;
  }
  if (!isPinterestHost(url.hostname)) return undefined;
  const id = extractPinId(url.pathname);
  if (!id) return undefined;
  return new URL(`https://www.pinterest.com/pin/${id}/`);
}
