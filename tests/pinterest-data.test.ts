import { describe, expect, it } from "vitest";
import { parsePublicMetadata } from "@/lib/platforms/metadata";
import {
  collectVideoRenditions,
  isVideoPin,
  parsePinterestPage,
  pickCarouselSlots,
  pickImageCandidates,
  pinCreator,
  pinRecordFromResource,
  pinTitle,
  type PinRecord,
} from "@/lib/platforms/pinterest-data";
import { readFixture, readJsonFixture } from "./helpers/fixtures";

function page(name: string, pinId: string) {
  const html = readFixture(name);
  return { html, metadata: parsePublicMetadata(html), parsed: parsePinterestPage(html, pinId) };
}

function resourceRecord(name: string): PinRecord {
  const { record } = pinRecordFromResource(readJsonFixture(name));
  if (!record) throw new Error(`no record in ${name}`);
  return record;
}

describe("parsePinterestPage", () => {
  it("reads the legacy __PWS_INITIAL_PROPS__ shape", () => {
    const { parsed, metadata } = page("image-pin-legacy-initial-props.html", "311241024270560610");

    expect(parsed.notFound).toBe(false);
    expect(parsed.records).toHaveLength(1);
    expect(parsed.sources).toEqual(["legacy"]);
    expect(pickImageCandidates(parsed.records, metadata)[0]).toMatchObject({
      url: "https://i.pinimg.com/originals/44/12/19/441219cffb210a6af2ad959717f6f199.jpg",
      width: 1024,
      height: 1536,
    });
  });

  it("reads the relay shape and finds the original image", () => {
    const { parsed, metadata } = page("image-pin-relay.html", "350295677252925156");

    expect(parsed.sources).toEqual(["relay"]);
    expect(parsed.records.length).toBeGreaterThanOrEqual(2);
    const [first, ...rest] = pickImageCandidates(parsed.records, metadata);
    expect(first?.url).toBe(
      "https://i.pinimg.com/originals/be/f1/1f/bef11fca4fc07e7d09928ce2b774bfd0.jpg",
    );
    // Dimensions come from whichever relay copy carried them.
    expect(first).toMatchObject({ width: 1280, height: 996 });
    // Smaller derivatives stay available as fallbacks, original first.
    expect(rest.map((entry) => entry.url)).toContain(
      "https://i.pinimg.com/1200x/be/f1/1f/bef11fca4fc07e7d09928ce2b774bfd0.jpg",
    );
    expect(isVideoPin(parsed.records, metadata)).toBe(false);
  });

  it("finds both the MP4 and the HLS manifest of a classic video Pin", () => {
    const { parsed, metadata } = page("video-pin-classic-videos-videolist.html", "664281013778109217");
    const renditions = collectVideoRenditions(parsed.records);

    expect(renditions).toContainEqual(
      expect.objectContaining({
        key: "v720P",
        url: "https://v1.pinimg.com/videos/mc/720p/12/83/f0/1283f06c1c8fa040011cd7231f33f069.mp4",
        width: 1080,
        height: 1920,
        durationMs: 57700,
      }),
    );
    expect(renditions).toContainEqual(
      expect.objectContaining({ key: "vHLSV4", url: expect.stringMatching(/mc\/hls\/.+\.m3u8$/) }),
    );
    // isVideo is false on this record even though it is a video Pin.
    expect(isVideoPin(parsed.records, metadata)).toBe(true);
  });

  it("finds story Pin video blocks", () => {
    const { parsed } = page("video-pin-story-separate-audio.html", "873909502709617339");
    const urls = collectVideoRenditions(parsed.records).map((entry) => entry.url);

    expect(urls.some((url) => /iht\/hls\/.+\.m3u8$/.test(url))).toBe(true);
    expect(urls.some((url) => /_720w\.mp4$/.test(url))).toBe(true);
  });

  it("flags a removed Pin served as a 200 shell", () => {
    const { parsed, metadata } = page("removed-pin-200-pinnotfound.html", "824721750502199491");
    expect(parsed.notFound).toBe(true);
    expect(parsed.records).toEqual([]);
    // It is also an empty shell, which is why notFound must be checked first.
    expect(metadata.isEmptyShell).toBe(true);
  });

  it("drops the pin.it share title in favour of the Pin's own title", () => {
    const { parsed, metadata } = page("video-pin-pinit-sent-page.html", "32580797303002442");
    expect(metadata.title).toMatch(/^Check out this Pin from/);
    const title = pinTitle(parsed.records, metadata);
    expect(title ?? "").not.toMatch(/^Check out this Pin/i);
  });

  it("reads the creator from JSON-LD or the pinner", () => {
    const { parsed, metadata } = page("video-pin-classic-videos-videolist.html", "664281013778109217");
    expect(pinCreator(parsed.records, metadata)).toBe("Thandie Sibanda");
  });

  it("never throws on garbage relay or state scripts", () => {
    const html = `<script data-relay-completed-request="true">window.__PWS_RELAY_REGISTER_COMPLETED_REQUEST__("%7Bnot-json", {"data": {oops</script>
      <script id="__PWS_INITIAL_PROPS__" type="application/json">{broken</script>`;
    expect(() => parsePinterestPage(html, "1")).not.toThrow();
    expect(parsePinterestPage(html, "1")).toEqual({ notFound: false, records: [], sources: [] });
    expect(parsePinterestPage("", "1").records).toEqual([]);
  });

  it("ignores relay records for other Pins", () => {
    const html = readFixture("image-pin-relay.html");
    expect(parsePinterestPage(html, "111").records).toEqual([]);
  });
});

describe("PinResource API records", () => {
  it("reads an image record with its original", () => {
    const record = resourceRecord("pinresource-image-311241024270560610.json");
    expect(pickImageCandidates([record], undefined)[0]?.url).toBe(
      "https://i.pinimg.com/originals/44/12/19/441219cffb210a6af2ad959717f6f199.jpg",
    );
  });

  it("reads an HLS-only story video", () => {
    const record = resourceRecord("pinresource-story-video-hls-only-32580797303002442.json");
    const renditions = collectVideoRenditions([record]);

    expect(renditions.length).toBeGreaterThan(0);
    expect(renditions.every((entry) => entry.url.endsWith(".m3u8"))).toBe(true);
    expect(isVideoPin([record], undefined)).toBe(true);
  });

  it("reports a removed Pin", () => {
    expect(pinRecordFromResource(readJsonFixture("pinresource-removed-404-824721750502199491.json"))).toEqual({
      notFound: true,
    });
    expect(pinRecordFromResource({ unexpected: true })).toEqual({ notFound: false });
  });
});

describe("pickCarouselSlots", () => {
  it("reads every slot of a relay-shaped carousel", () => {
    const { parsed } = page("carousel-relay-synthetic.html", "900000000000000001");
    const slots = pickCarouselSlots(parsed.records);

    expect(slots.map((slot) => slot.url)).toEqual([
      "https://i.pinimg.com/originals/aa/aa/aa/aaaa000000000000000000000000001.jpg",
      "https://i.pinimg.com/originals/bb/bb/bb/bbbb000000000000000000000000002.jpg",
      "https://i.pinimg.com/originals/cc/cc/cc/cccc000000000000000000000000003.png",
    ]);
  });

  it("reads every slot of a PinResource carousel, falling back per slot", () => {
    const record = resourceRecord("carousel-pinresource-synthetic.json");
    const slots = pickCarouselSlots([record]);

    expect(slots).toHaveLength(3);
    expect(slots[0]?.url).toContain("/originals/");
    // Slot 3 has no original, so its 736x derivative is used.
    expect(slots[2]?.url).toContain("/736x/");
  });

  it("returns nothing for a single image Pin", () => {
    const record = resourceRecord("pinresource-image-311241024270560610.json");
    expect(pickCarouselSlots([record])).toEqual([]);
  });
});
