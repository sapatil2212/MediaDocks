import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { config } from "@/lib/config";
import { prisma } from "@/lib/db/prisma";
import { debugLog } from "@/lib/debug";
import { MediaFlowError } from "@/lib/errors";
import type { PostKind, ResolvedMedia, ResolvedResult } from "@/lib/platforms/types";

/**
 * Short-lived store for resolved media references.
 *
 * MySQL is the durable store. When it is unavailable an in-memory map takes over
 * so a single instance still works end to end during development; those ids are
 * prefixed with `m_` and vanish on restart. Either way the reference is temporary
 * and no media file is ever stored — only the URL to stream from.
 */
export type StoredMediaItem = ResolvedMedia;

export interface StoredReference {
  mediaId: string;
  platform: string;
  postKind: PostKind;
  /** Human label used in download filenames, e.g. "Reel" or "Pin". */
  descriptor: string;
  items: StoredMediaItem[];
  expiresAt: Date;
}

const MEMORY_PREFIX = "m_";

/**
 * Held on globalThis on purpose: Next builds each route handler as its own
 * module graph, so a plain module-level Map would not be visible to
 * /api/download after /api/resolve wrote to it.
 */
const globalStore = globalThis as typeof globalThis & {
  mediaflowReferences?: Map<string, StoredReference>;
};
const memory: Map<string, StoredReference> = (globalStore.mediaflowReferences ??= new Map());

export function isMemoryReference(mediaId: string): boolean {
  return mediaId.startsWith(MEMORY_PREFIX);
}

function pruneMemory(): void {
  const now = Date.now();
  for (const [id, reference] of memory) {
    if (reference.expiresAt.getTime() < now) memory.delete(id);
  }
}

interface StoredPayload {
  postKind: PostKind;
  descriptor: string;
  items: StoredMediaItem[];
}

/** Persists the resolved media items and returns the reference id. */
export async function putReference(
  result: ResolvedResult,
  sourceUrlHash: string,
): Promise<{ mediaId: string; store: "mysql" | "memory" } | null> {
  if (result.media.length === 0) return null;

  const expiresAt = new Date(Date.now() + config.mediaTtlMinutes * 60 * 1000);
  const payload: StoredPayload = {
    postKind: result.postKind,
    descriptor: result.kind ?? result.postKind,
    items: result.media,
  };

  const data = {
    platform: result.platform,
    // The column carries the post shape: "image", "video" or "carousel".
    mediaType: result.postKind,
    status: "resolved",
    title: truncate(result.title, 255),
    creator: truncate(result.creator, 190),
    thumbnail: result.thumbnail ?? null,
    formats: payload as unknown as Prisma.InputJsonValue,
    expiresAt,
  };

  try {
    const record = await prisma.mediaRequest.upsert({
      where: { sourceUrlHash },
      create: { sourceUrlHash, ...data },
      update: data,
    });
    return { mediaId: record.id, store: "mysql" };
  } catch (err) {
    debugLog("PERSIST", { store: "memory", reason: err instanceof Error ? err.name : "unknown" });

    pruneMemory();
    const mediaId = `${MEMORY_PREFIX}${crypto.randomBytes(9).toString("hex")}`;
    memory.set(mediaId, {
      mediaId,
      platform: result.platform,
      postKind: payload.postKind,
      descriptor: payload.descriptor,
      items: payload.items,
      expiresAt,
    });
    return { mediaId, store: "memory" };
  }
}

export interface ReferencedItem {
  mediaId: string;
  platform: string;
  descriptor: string;
  item: StoredMediaItem;
  /** 1-based position, used to keep multi-item filenames distinct. */
  itemIndex: number;
  itemCount: number;
}

/** Looks a reference up and returns the requested media item. */
export async function getReferenceItem(mediaId: string, itemId: string): Promise<ReferencedItem> {
  const reference = isMemoryReference(mediaId)
    ? readFromMemory(mediaId)
    : await readFromDatabase(mediaId);

  if (reference.expiresAt.getTime() < Date.now()) {
    await forget(mediaId);
    throw new MediaFlowError(
      "MEDIA_REFERENCE_EXPIRED",
      "This link has expired. Please resolve the media again.",
    );
  }

  const index = reference.items.findIndex((entry) => entry.id === itemId);
  const item = index >= 0 ? reference.items[index] : undefined;
  if (!item) {
    throw new MediaFlowError("FORMAT_NOT_AVAILABLE", "This media isn't available for download.");
  }

  return {
    mediaId: reference.mediaId,
    platform: reference.platform,
    descriptor: reference.descriptor,
    item,
    itemIndex: index + 1,
    itemCount: reference.items.length,
  };
}

function readFromMemory(mediaId: string): StoredReference {
  const reference = memory.get(mediaId);
  if (!reference) {
    throw new MediaFlowError("MEDIA_NOT_FOUND", "We couldn't find the requested media.");
  }
  return reference;
}

async function readFromDatabase(mediaId: string): Promise<StoredReference> {
  let record;
  try {
    record = await prisma.mediaRequest.findUnique({ where: { id: mediaId } });
  } catch (err) {
    // A reference we cannot verify is, to the user, simply not available.
    console.error(
      JSON.stringify({
        at: new Date().toISOString(),
        event: "media_reference_lookup_failed",
        reason: err instanceof Error ? err.message.split("\n")[0] : "unknown",
      }),
    );
    throw new MediaFlowError("MEDIA_NOT_FOUND", "We couldn't find the requested media.");
  }

  if (!record) {
    throw new MediaFlowError("MEDIA_NOT_FOUND", "We couldn't find the requested media.");
  }

  const payload = parseStoredPayload(record.formats);
  return {
    mediaId: record.id,
    platform: record.platform,
    postKind: payload.postKind,
    descriptor: payload.descriptor,
    items: payload.items,
    expiresAt: record.expiresAt,
  };
}

async function forget(mediaId: string): Promise<void> {
  if (isMemoryReference(mediaId)) {
    memory.delete(mediaId);
    return;
  }
  await prisma.mediaRequest.delete({ where: { id: mediaId } }).catch(() => undefined);
}

/** Validates the stored JSON before it is trusted. */
export function parseStoredPayload(value: unknown): StoredPayload {
  const empty: StoredPayload = { postKind: "image", descriptor: "media", items: [] };
  if (typeof value !== "object" || value === null) return empty;

  const record = value as Record<string, unknown>;
  const items = Array.isArray(record.items) ? record.items : [];

  return {
    postKind: (typeof record.postKind === "string" ? record.postKind : "image") as PostKind,
    descriptor: typeof record.descriptor === "string" ? record.descriptor : "media",
    items: items.filter((entry): entry is StoredMediaItem => {
      if (typeof entry !== "object" || entry === null) return false;
      const candidate = entry as Record<string, unknown>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.mediaUrl === "string" &&
        typeof candidate.mimeType === "string" &&
        typeof candidate.extension === "string" &&
        (candidate.kind === "image" || candidate.kind === "video")
      );
    }),
  };
}

/** Test helper. */
export function clearMemoryReferences(): void {
  memory.clear();
}

function truncate(value: string | undefined, max: number): string | null {
  if (!value) return null;
  return value.length > max ? value.slice(0, max) : value;
}
