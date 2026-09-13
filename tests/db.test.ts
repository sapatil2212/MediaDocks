import type { Prisma } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { cleanupExpired } from "@/lib/cleanup";
import { prisma } from "@/lib/db/prisma";
import { loadMediaReference } from "@/lib/download/downloader";
import { hashUrl } from "@/lib/download/security";

const reachable = await prisma
  .$queryRaw`SELECT 1`.then(() => true)
  .catch(() => false);

if (!reachable) {
  console.warn(
    "[tests] MySQL is not reachable — skipping database tests. " +
      "Start MySQL and run `npm run prisma:push` to exercise them.",
  );
}

/** Mirrors what putReference stores: post shape plus typed media items. */
const payload = {
  postKind: "video",
  descriptor: "Reel",
  items: [
    {
      id: "test-video",
      kind: "video",
      mediaUrl: "https://video.twimg.com/vid/1280x720/test.mp4",
      mimeType: "video/mp4",
      extension: "mp4",
      label: "MP4",
      quality: "720p",
    },
    {
      id: "test-image",
      kind: "image",
      mediaUrl: "https://pbs.twimg.com/media/test.webp",
      mimeType: "image/webp",
      extension: "webp",
      label: "WEBP",
    },
  ],
} as unknown as Prisma.InputJsonValue;

describe.skipIf(!reachable)("MediaRequest lifecycle", () => {
  const sourceUrlHash = hashUrl(`https://instagram.com/reel/test-${Date.now()}`);

  afterAll(async () => {
    await prisma.mediaRequest.deleteMany({ where: { sourceUrlHash } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  it("stores a video post shape and its typed items", async () => {
    const created = await prisma.mediaRequest.create({
      data: {
        platform: "x",
        sourceUrlHash,
        mediaType: "video",
        title: "Test post",
        creator: "@tester",
        formats: payload,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const found = await prisma.mediaRequest.findUnique({ where: { id: created.id } });
    expect(found?.platform).toBe("x");
    // The column carries image | video | carousel.
    expect(found?.mediaType).toBe("video");
    expect(found?.status).toBe("resolved");
  });

  it("resolves a {mediaId, itemId} reference to the right media type", async () => {
    const record = await prisma.mediaRequest.findUniqueOrThrow({ where: { sourceUrlHash } });

    const video = await loadMediaReference(record.id, "test-video");
    expect(video.item.kind).toBe("video");
    expect(video.item.mimeType).toBe("video/mp4");
    expect(video.item.extension).toBe("mp4");

    const image = await loadMediaReference(record.id, "test-image");
    expect(image.item.kind).toBe("image");
    expect(image.item.extension).toBe("webp");

    await expect(loadMediaReference(record.id, "missing-item")).rejects.toThrow(
      /available for download/i,
    );
  });

  it("expires a record and deletes it", async () => {
    const record = await prisma.mediaRequest.findUniqueOrThrow({ where: { sourceUrlHash } });

    await prisma.mediaRequest.update({
      where: { id: record.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await expect(loadMediaReference(record.id, "test-video")).rejects.toThrow(/expired/i);
    expect(await prisma.mediaRequest.findUnique({ where: { id: record.id } })).toBeNull();
  });

  it("cleans up expired records", async () => {
    const created = await prisma.mediaRequest.create({
      data: {
        platform: "pinterest",
        sourceUrlHash: hashUrl(`https://pinterest.com/pin/test-${Date.now()}`),
        mediaType: "image",
        formats: payload,
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const { records } = await cleanupExpired();
    expect(records).toBeGreaterThanOrEqual(1);
    expect(await prisma.mediaRequest.findUnique({ where: { id: created.id } })).toBeNull();
  });
});
