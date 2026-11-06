import type { PublicMetadata } from "./metadata";

/**
 * Parser for the Pin data Pinterest embeds in its public pages and returns from
 * its public PinResource endpoint.
 *
 * Pinterest serves the same Pin in several shapes, and which one a response
 * uses varies by Pin and by request:
 *
 *   - relay: `window.__PWS_RELAY_REGISTER_COMPLETED_REQUEST__("<request>", {data:
 *     {v3GetPinQueryv2: {__typename: "PinResponse", data: {...}}}})` scripts,
 *     camelCase (`images_orig`, `videos.videoList`, `storyPinData`)
 *   - legacy: `<script id="__PWS_INITIAL_PROPS__">` with
 *     `initialReduxState.pins[<id>]`, snake_case (`images.orig`, `videos.video_list`)
 *   - PinResource API: `resource_response.data`, the same snake_case record
 *
 * Every reader here is shape-tolerant and never throws: a bad script is skipped
 * and the others still count. No I/O happens in this module.
 */

export type PinRecord = Record<string, unknown>;

export type PinDataSource = "relay" | "legacy" | "api";

export interface PinterestPageData {
  /** Pinterest said the Pin does not exist (relay `PinNotFound`). */
  notFound: boolean;
  /** Structured records for the requested Pin, most complete first. */
  records: PinRecord[];
  sources: PinDataSource[];
}

export interface VideoRendition {
  /** Property name the rendition sat under, e.g. `v720P`, `V_HLSV4`. */
  key: string;
  url: string;
  width?: number;
  height?: number;
  durationMs?: number;
}

export interface ImageCandidate {
  url: string;
  width?: number;
  height?: number;
  source: string;
}

// ── small typed readers ────────────────────────────────────────────────────

function obj(value: unknown): PinRecord | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as PinRecord)
    : undefined;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function num(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : undefined;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }
  return undefined;
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** First defined field among several spellings (camelCase / snake_case). */
function field(record: PinRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function tryJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

// ── page parsing ───────────────────────────────────────────────────────────

const RELAY_SCRIPT_RE = /<script\b[^>]*\bdata-relay-completed-request\b[^>]*>([\s\S]*?)<\/script>/gi;
const RELAY_CALL_RE =
  /^\s*window\.__PWS_RELAY_REGISTER_COMPLETED_REQUEST__\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*([\s\S]*)\)\s*;?\s*$/;
const INITIAL_PROPS_RE =
  /<script\b[^>]*\bid="(?:__PWS_INITIAL_PROPS__|__PWS_DATA__)"[^>]*>([\s\S]*?)<\/script>/gi;

interface RelayEntry {
  pinId?: string;
  record?: PinRecord;
  notFound: boolean;
}

function readRelayRequestPinId(rawArg: string): string | undefined {
  // The first argument is a JS string literal holding a URL-encoded JSON request.
  const literal = tryJson(`"${rawArg}"`);
  if (typeof literal !== "string") return undefined;
  let decoded: string;
  try {
    decoded = decodeURIComponent(literal);
  } catch {
    return undefined;
  }
  const request = obj(tryJson(decoded));
  const variables = obj(request?.variables);
  const pinId = variables?.pinId ?? variables?.pin_id ?? variables?.id;
  return typeof pinId === "string" || typeof pinId === "number" ? String(pinId) : undefined;
}

function readRelayEntries(html: string): RelayEntry[] {
  const entries: RelayEntry[] = [];
  for (const script of html.matchAll(RELAY_SCRIPT_RE)) {
    const call = (script[1] ?? "").match(RELAY_CALL_RE);
    if (!call) continue;

    const pinId = readRelayRequestPinId(call[1] ?? "");
    const payload = obj(tryJson(call[2] ?? ""));
    const data = obj(payload?.data);
    if (!data) continue;

    // The query name has changed before (v3GetPinQuery → v3GetPinQueryv2), so
    // any response object that types itself as a Pin result counts.
    for (const value of Object.values(data)) {
      const response = obj(value);
      if (!response) continue;
      const typename = str(response.__typename);
      if (typename === "PinNotFound" || str(response.__isError) === "PinNotFound") {
        entries.push({ ...(pinId ? { pinId } : {}), notFound: true });
        continue;
      }
      const record = obj(response.data);
      if (typename === "PinResponse" && record) {
        entries.push({ ...(pinId ? { pinId } : {}), record, notFound: false });
      }
    }
  }
  return entries;
}

function recordId(record: PinRecord): string | undefined {
  const id = field(record, "entityId", "entity_id", "id");
  return typeof id === "string" || typeof id === "number" ? String(id) : undefined;
}

function readLegacyRecords(html: string, pinId: string): PinRecord[] {
  const records: PinRecord[] = [];
  for (const script of html.matchAll(INITIAL_PROPS_RE)) {
    const root = obj(tryJson(script[1] ?? ""));
    const redux = obj(root?.initialReduxState) ?? obj(obj(root?.props)?.initialReduxState);
    const pins = obj(redux?.pins);
    if (!pins) continue;
    const direct = obj(pins[pinId]);
    if (direct) {
      records.push(direct);
      continue;
    }
    const all = Object.values(pins).map(obj).filter((entry): entry is PinRecord => Boolean(entry));
    if (all.length === 1 && all[0]) records.push(all[0]);
  }
  return records;
}

/**
 * Reads every structured record Pinterest embedded for `pinId`.
 *
 * Relay requests carry the Pin id they were made for; records for other Pins
 * (related content) are ignored. When no request names the id, a lone
 * PinResponse is used, since the page then describes a single Pin.
 */
export function parsePinterestPage(html: string, pinId: string): PinterestPageData {
  const result: PinterestPageData = { notFound: false, records: [], sources: [] };
  if (!html) return result;

  const relay = readRelayEntries(html);
  const forPin = relay.filter(
    (entry) => entry.pinId === pinId || (entry.record && recordId(entry.record) === pinId),
  );
  let relayRecords = forPin.flatMap((entry) => (entry.record ? [entry.record] : []));

  if (relayRecords.length === 0) {
    const responses = relay.filter((entry) => entry.record && !entry.pinId);
    const ids = new Set(responses.map((entry) => (entry.record ? recordId(entry.record) : undefined)));
    if (responses.length > 0 && ids.size === 1) {
      relayRecords = responses.flatMap((entry) => (entry.record ? [entry.record] : []));
    }
  }

  const legacy = readLegacyRecords(html, pinId);

  if (relayRecords.length > 0) result.sources.push("relay");
  if (legacy.length > 0) result.sources.push("legacy");
  result.records = [...relayRecords, ...legacy];

  const notFoundForPin = relay.some(
    (entry) => entry.notFound && (entry.pinId === undefined || entry.pinId === pinId),
  );
  result.notFound = result.records.length === 0 && notFoundForPin;
  return result;
}

/** Reads a PinResource API response (`resource_response`). */
export function pinRecordFromResource(json: unknown): { notFound: boolean; record?: PinRecord } {
  const response = obj(obj(json)?.resource_response);
  if (!response) return { notFound: false };
  const error = obj(response.error);
  const code = num(error?.api_error_code) ?? num(error?.code);
  const status = num(response.http_status) ?? num(error?.http_status);
  if (code === 50 || status === 404) return { notFound: true };
  const record = obj(response.data);
  return record ? { notFound: false, record } : { notFound: false };
}

// ── videos ─────────────────────────────────────────────────────────────────

const VIDEO_URL_RE = /^https:\/\/v\d*\.pinimg\.com\/videos\/.+\.(?:mp4|m3u8)(?:\?|$)/i;

/** Sub-objects that describe other entities (boards, people, related Pins). */
const SKIP_KEYS = new Set([
  "pinner",
  "originPinner",
  "origin_pinner",
  "board",
  "pinJoin",
  "pin_join",
  "nativeCreator",
  "native_creator",
  "canonicalPin",
  "canonical_pin",
  "collectionPin",
  "collection_pin",
  "aggregatedPinData",
  "aggregated_pin_data",
  "promoter",
  "via_pinner",
]);

const MAX_DEPTH = 14;

/**
 * Collects every Pinterest video rendition in the records, whatever the field
 * is called (`video_list`, `videoList`, `videoList720P`, `v_hlsv4_video_list`,
 * `videoDataV2`, story pages and blocks). A rendition is any object whose `url`
 * is a v*.pinimg.com/videos/ MP4 or HLS manifest.
 */
export function collectVideoRenditions(records: PinRecord[]): VideoRendition[] {
  const found = new Map<string, VideoRendition>();
  const seen = new Set<object>();

  const visit = (value: unknown, key: string, depth: number) => {
    if (depth > MAX_DEPTH || typeof value !== "object" || value === null) return;
    if (seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
      for (const entry of value) {
        // `videoUrls` holds bare strings.
        if (typeof entry === "string" && VIDEO_URL_RE.test(entry)) {
          if (!found.has(entry)) found.set(entry, { key, url: entry });
        } else {
          visit(entry, key, depth + 1);
        }
      }
      return;
    }

    const record = value as PinRecord;
    const url = str(record.url);
    if (url && VIDEO_URL_RE.test(url)) {
      const existing = found.get(url);
      const width = num(record.width);
      const height = num(record.height);
      const durationMs = num(record.duration);
      // A later copy may carry dimensions an earlier, trimmed copy lacked.
      if (!existing || (!existing.width && width)) {
        found.set(url, {
          key: existing && existing.key !== "videoUrls" ? existing.key : key,
          url,
          ...(width ? { width } : {}),
          ...(height ? { height } : {}),
          ...(durationMs ? { durationMs } : (existing?.durationMs ? { durationMs: existing.durationMs } : {})),
        });
      } else if (existing.key === "videoUrls") {
        existing.key = key;
      }
    }

    for (const [childKey, child] of Object.entries(record)) {
      if (SKIP_KEYS.has(childKey)) continue;
      visit(child, childKey, depth + 1);
    }
  };

  for (const record of records) visit(record, "", 0);
  return [...found.values()];
}

/** Paths Pinterest uses for HEVC/HDR encodes, which many players cannot open. */
export function isHevcVideoUrl(url: string): boolean {
  return /\/(?:hdr|hdrct|hevc[^/]*|h265)\//i.test(url);
}

// ── images ─────────────────────────────────────────────────────────────────

interface SizedUrl {
  url: string;
  width?: number;
  height?: number;
}

function sized(value: unknown): SizedUrl | undefined {
  const record = obj(value);
  const url = str(record?.url);
  if (!record || !url) return undefined;
  const width = num(record.width);
  const height = num(record.height);
  return { url, ...(width ? { width } : {}), ...(height ? { height } : {}) };
}

/** The original-size image of a record or slot, in either naming style. */
function originalImage(record: PinRecord): SizedUrl | undefined {
  const images = obj(record.images);
  return (
    sized(images?.orig) ??
    sized(images?.originals) ??
    sized(record.images_orig) ??
    sized(record.images_originals) ??
    sized(obj(obj(record.image)?.images)?.originals) ??
    sized(obj(obj(record.image)?.images)?.orig)
  );
}

function largeImage(record: PinRecord): SizedUrl | undefined {
  const large = str(record.imageLargeUrl) ?? str(record.image_large_url);
  return large ? { url: large } : undefined;
}

function previewImage(record: PinRecord): SizedUrl | undefined {
  const images = obj(record.images);
  const nested = obj(obj(record.image)?.images);
  return (
    sized(images?.["736x"]) ??
    sized(record.images_736x) ??
    sized(nested?.["736x"]) ??
    sized(images?.["564x"]) ??
    sized(record.images_564x)
  );
}

/** Merges dimensions seen in other copies of the same URL. */
function withDims(candidate: SizedUrl, all: SizedUrl[]): SizedUrl {
  if (candidate.width && candidate.height) return candidate;
  const match = all.find((entry) => entry.url === candidate.url && entry.width && entry.height);
  return match ?? candidate;
}

function jsonLdNodes(metadata: PublicMetadata | undefined, type: string): PinRecord[] {
  return (metadata?.jsonLd ?? []).filter((node) => {
    const value = node["@type"];
    return Array.isArray(value) ? value.includes(type) : value === type;
  });
}

/**
 * Image candidates for the Pin, best first:
 *   1. the original from the records (`images.orig`, `images_orig`)
 *   2. JSON-LD SocialMediaPosting.image when it is an /originals/ URL
 *   3. `imageLargeUrl` (1200x)
 *   4. the 736x derivative from the records
 *   5. og:image, then twitter:image
 */
export function pickImageCandidates(
  records: PinRecord[],
  metadata: PublicMetadata | undefined,
): ImageCandidate[] {
  const out: ImageCandidate[] = [];
  const push = (entry: SizedUrl | undefined, source: string) => {
    if (!entry || out.some((existing) => existing.url === entry.url)) return;
    out.push({ ...entry, source });
  };

  const originals = records.map(originalImage).filter((entry): entry is SizedUrl => Boolean(entry));
  for (const original of originals) push(withDims(original, originals), "pinterest:images.orig");

  for (const node of jsonLdNodes(metadata, "SocialMediaPosting")) {
    const image = typeof node.image === "string" ? node.image : str(obj(node.image)?.url);
    if (image && image.includes("/originals/")) push({ url: image }, "json-ld");
  }

  for (const record of records) push(largeImage(record), "pinterest:imageLargeUrl");

  const previews = records.map(previewImage).filter((entry): entry is SizedUrl => Boolean(entry));
  for (const preview of previews) push(withDims(preview, previews), "pinterest:images.736x");

  if (metadata?.image) {
    push(
      {
        url: metadata.image,
        ...(metadata.imageWidth ? { width: metadata.imageWidth } : {}),
        ...(metadata.imageHeight ? { height: metadata.imageHeight } : {}),
      },
      "og:image",
    );
  }
  const twitter = metadata?.tags["twitter:image"] ?? metadata?.tags["twitter:image:src"];
  if (twitter) push({ url: twitter }, "twitter:image");

  return out;
}

function slotImage(slot: PinRecord): ImageCandidate | undefined {
  const best = originalImage(slot) ?? largeImage(slot) ?? previewImage(slot);
  if (best) return { ...best, source: "pinterest:slot" };
  // Some shapes put the URL on the slot itself.
  const url = str(slot.url) ?? str(slot.image_url) ?? str(slot.imageUrl);
  return url && /\.(?:jpe?g|png|webp|gif)(?:\?|$)/i.test(url) ? { url, source: "pinterest:slot" } : undefined;
}

/** First array of objects inside a container, e.g. `carousel_slots`/`carouselSlots`. */
function firstObjectArray(container: PinRecord): PinRecord[] {
  for (const value of Object.values(container)) {
    const list = arr(value).map(obj).filter((entry): entry is PinRecord => Boolean(entry));
    if (list.length > 0) return list;
  }
  return [];
}

/** One image per carousel slot, only when the Pin really has several. */
export function pickCarouselSlots(records: PinRecord[]): ImageCandidate[] {
  for (const record of records) {
    const carousel = obj(field(record, "carousel_data", "carouselData"));
    if (!carousel) continue;
    const images = firstObjectArray(carousel)
      .map(slotImage)
      .filter((entry): entry is ImageCandidate => Boolean(entry));
    if (images.length >= 2) return images;
  }
  return [];
}

function storyPages(record: PinRecord): PinRecord[] {
  const story = obj(field(record, "story_pin_data", "storyPinData"));
  return arr(story?.pages).map(obj).filter((entry): entry is PinRecord => Boolean(entry));
}

/** Image pages of a story (Idea) Pin that has no video, one image per page. */
export function pickStoryImagePages(records: PinRecord[]): ImageCandidate[] {
  for (const record of records) {
    const pages = storyPages(record);
    if (pages.length < 2) continue;
    if (collectVideoRenditions(pages).length > 0) return [];
    const images = pages
      .map((page) => {
        const blockImage = arr(page.blocks)
          .map(obj)
          .filter((entry): entry is PinRecord => Boolean(entry))
          .map(slotImage)
          .find(Boolean);
        return slotImage(page) ?? blockImage;
      })
      .filter((entry): entry is ImageCandidate => Boolean(entry));
    if (images.length >= 2) return images;
  }
  return [];
}

// ── classification and metadata ────────────────────────────────────────────

/** True when anything says this Pin is a video, even if no file is usable. */
export function isVideoPin(records: PinRecord[], metadata: PublicMetadata | undefined): boolean {
  for (const record of records) {
    if (field(record, "is_video", "isVideo") === true) return true;
    if (obj(field(record, "videos"))) return true;
  }
  if (collectVideoRenditions(records).length > 0) return true;
  return jsonLdNodes(metadata, "VideoObject").length > 0;
}

const SHARE_TITLE_RE = /^check out this pin from /i;

/** The Pin's own title, never the "Check out this Pin from <sender>" share title. */
export function pinTitle(records: PinRecord[], metadata: PublicMetadata | undefined): string | undefined {
  const candidates: unknown[] = [];
  for (const key of ["title", "gridTitle", "grid_title", "closeupUnifiedTitle", "seoTitle", "seo_title"]) {
    for (const record of records) candidates.push(record[key]);
  }
  candidates.push(metadata?.title);
  for (const candidate of candidates) {
    const title = str(candidate);
    if (title && !SHARE_TITLE_RE.test(title)) return title;
  }
  return undefined;
}

function personName(value: unknown): string | undefined {
  if (typeof value === "string") return str(value);
  const record = obj(value);
  return record ? str(record.name) : undefined;
}

export function pinCreator(records: PinRecord[], metadata: PublicMetadata | undefined): string | undefined {
  for (const node of jsonLdNodes(metadata, "SocialMediaPosting")) {
    const name = personName(node.author);
    if (name) return name;
  }
  for (const record of records) {
    const pinner = obj(record.pinner);
    const name =
      str(pinner?.fullName) ?? str(pinner?.full_name) ?? str(pinner?.username) ?? str(pinner?.userName);
    if (name) return name;
  }
  return metadata?.creator;
}
