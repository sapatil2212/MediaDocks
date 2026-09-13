import dns from "dns/promises";
import crypto from "crypto";
import { MediaFlowError } from "@/lib/errors";

/**
 * Hosts the server is allowed to fetch actual media bytes from. Resolvers may
 * read public platform pages, but a download only ever happens against one of
 * these CDNs — this is what keeps /api/download from becoming an open proxy.
 */
export const ALLOWED_MEDIA_HOSTS: readonly string[] = [
  "instagram.com",
  "cdninstagram.com",
  "fbcdn.net",
  "facebook.com",
  "fbsbx.com",
  "youtube.com",
  "youtu.be",
  "googlevideo.com",
  "ytimg.com",
  "pinterest.com",
  "pinimg.com",
  "pin.it",
  "x.com",
  "twitter.com",
  "twimg.com",
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "broadcasthost",
]);

const BLOCKED_SUFFIXES = [".local", ".localhost", ".internal", ".intranet", ".home.arpa", ".lan"];

function ipv4ToLong(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value;
}

const IPV4_BLOCKED_RANGES: ReadonlyArray<[string, number]> = [
  ["0.0.0.0", 8], // "this host on this network"
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved
];

/** True for loopback, private, link-local, CGNAT, multicast and reserved addresses. */
export function isPrivateAddress(address: string): boolean {
  const ip = address.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (!ip) return true;

  const asLong = ipv4ToLong(ip);
  if (asLong !== null) {
    if (ip === "255.255.255.255") return true;
    return IPV4_BLOCKED_RANGES.some(([base, bits]) => {
      const baseLong = ipv4ToLong(base);
      if (baseLong === null) return false;
      const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
      return (asLong & mask) === (baseLong & mask);
    });
  }

  if (!ip.includes(":")) return false; // hostname, not an IP literal

  // IPv4-mapped / IPv4-compatible IPv6
  const mapped = ip.match(/(?:^::ffff:|^::)((?:\d{1,3}\.){3}\d{1,3})$/);
  if (mapped?.[1]) return isPrivateAddress(mapped[1]);

  if (ip === "::" || ip === "::1") return true;

  const head = ip.split(":")[0] ?? "";
  if (/^f[cd]/.test(head)) return true; // fc00::/7 unique local
  if (/^fe[89ab]/.test(head)) return true; // fe80::/10 link-local
  if (/^ff/.test(head)) return true; // multicast

  return false;
}

export function isAllowedMediaHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_MEDIA_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

export interface SafeUrlOptions {
  /** Restrict to known platform CDNs. Required before downloading bytes. */
  requireMediaHost?: boolean;
  /** Skip DNS resolution (used by unit tests / offline environments). */
  skipDnsCheck?: boolean;
}

/**
 * Protocol -> hostname -> literal IP -> DNS resolved IP. Throws before any
 * network request is made for anything that is not a public, external host.
 */
export async function assertSafeUrl(
  input: string | URL,
  options: SafeUrlOptions = {},
): Promise<URL> {
  let parsed: URL;
  try {
    parsed = input instanceof URL ? input : new URL(String(input).trim());
  } catch {
    throw new MediaFlowError("INVALID_URL", "That URL is malformed.");
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    throw new MediaFlowError("INVALID_URL", "Only HTTP and HTTPS URLs are supported.");
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!hostname) {
    throw new MediaFlowError("INVALID_URL", "That URL has no hostname.");
  }

  if (BLOCKED_HOSTNAMES.has(hostname) || BLOCKED_SUFFIXES.some((s) => hostname.endsWith(s))) {
    throw new MediaFlowError("UNSAFE_URL", "Internal hostnames are not allowed.");
  }

  const isIpLiteral = /^[\d.]+$/.test(hostname) || hostname.includes(":");
  if (isIpLiteral && isPrivateAddress(hostname)) {
    throw new MediaFlowError("UNSAFE_URL", "Private network addresses are not allowed.");
  }

  // A hostname without a dot cannot be public DNS — treat it as internal.
  if (!isIpLiteral && !hostname.includes(".")) {
    throw new MediaFlowError("UNSAFE_URL", "Internal hostnames are not allowed.");
  }

  if (options.requireMediaHost && !isAllowedMediaHost(hostname)) {
    throw new MediaFlowError("UNSAFE_URL", "That media host is not allowed.");
  }

  if (!isIpLiteral && !options.skipDnsCheck) {
    let records: Array<{ address: string }>;
    try {
      records = await dns.lookup(hostname, { all: true });
    } catch {
      throw new MediaFlowError("INVALID_URL", "That hostname could not be resolved.");
    }
    if (records.some((record) => isPrivateAddress(record.address))) {
      throw new MediaFlowError("UNSAFE_URL", "That hostname resolves to a private address.");
    }
  }

  return parsed;
}

export function hashUrl(url: string): string {
  return crypto.createHash("sha256").update(url.trim()).digest("hex");
}

// Download filenames are built by lib/media/detect-media-type.ts, which derives
// the extension from the media's real type.
