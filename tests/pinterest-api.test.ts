import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Pinterest through the real API routes: POST /api/resolve and POST
 * /api/download, with saved Pinterest responses and no live network. Every
 * fetch is routed to a fixture; anything unrouted fails the test.
 */

const engine = vi.hoisted(() => ({ available: false }));

vi.mock("dns/promises", () => ({
  default: { lookup: async () => [{ address: "93.184.216.34", family: 4 }] },
}));

// No database in unit tests: every Prisma call rejects, so references use the
// in-memory store, exactly as in development without MySQL.
vi.mock("@/lib/db/prisma", () => {
  const model = new Proxy(
    {},
    { get: () => async () => Promise.reject(new Error("database offline (test)")) },
  );
  return { prisma: new Proxy({}, { get: () => model }) };
});

vi.mock("@/lib/engine/binaries", () => ({
  engineAvailable: async () => engine.available,
  ytdlpCommand: async () => (engine.available ? { bin: "yt-dlp-test-double", prefixArgs: [] } : null),
  ffmpegPath: async () => (engine.available ? "/usr/bin/ffmpeg" : null),
  describeEngineTools: async () => ({
    engineEnabled: true,
    ytdlp: engine.available ? "yt-dlp-test-double" : null,
    ffmpeg: engine.available ? "/usr/bin/ffmpeg" : null,
    ffprobe: null,
    ready: engine.available,
    muxCapable: engine.available,
  }),
}));

vi.mock("@/lib/engine/ytdlp", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/engine/ytdlp")>();
  return { ...actual, probeUrl: vi.fn() };
});

const { POST: resolveRoute } = await import("@/app/api/resolve/route");
const { POST: downloadRoute } = await import("@/app/api/download/route");
const ytdlp = await import("@/lib/engine/ytdlp");
const { readFixture, readJsonFixture } = await import("./helpers/fixtures");

interface Envelope {
  success: boolean;
  data?: {
    postKind: string;
    sourceUrl: string;
    title?: string;
    mediaId?: string;
    media: Array<{ id: string; kind: string; extension: string; mediaUrl: string; quality?: string }>;
  };
  error?: { code: string; message: string };
}

let ipCounter = 0;
function postRequest(path: string, body: unknown): NextRequest {
  ipCounter += 1;
  return new NextRequest(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `198.18.${ipCounter % 250}.9` },
    body: JSON.stringify(body),
  });
}

type Route = [RegExp, () => Response];

function routeFetch(routes: Route[]) {
  const calls: string[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    calls.push(url);
    const route = routes.find(([pattern]) => pattern.test(url));
    if (!route) throw new Error(`unrouted fetch ${url}`);
    return route[1]();
  });
  return calls;
}

const html = (body: string, status = 200) => () =>
  new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8" } });
const fixture = (name: string) => html(readFixture(name));
const redirect = (location: string, status = 302) => () =>
  new Response(null, { status, headers: { location } });

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const jpeg = () =>
  new Response(JPEG, {
    status: 200,
    headers: { "content-type": "image/jpeg", "content-length": String(JPEG.byteLength) },
  });

const exact = (url: string) => new RegExp(`^${url.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}$`);

beforeEach(() => {
  engine.available = false;
  vi.mocked(ytdlp.probeUrl).mockReset();
});

afterEach(() => vi.restoreAllMocks());

describe("POST /api/resolve — Pinterest", () => {
  it("returns the engine's video options for a separate-audio video Pin", async () => {
    engine.available = true;
    vi.mocked(ytdlp.probeUrl).mockResolvedValue({
      ok: true,
      info: readJsonFixture("ytdlp-J-32580797303002442.json"),
    });
    const calls = routeFetch([]);

    const res = await resolveRoute(
      postRequest("/api/resolve", { url: "https://www.pinterest.com/pin/32580797303002442/?utm_source=x" }),
    );
    const body = (await res.json()) as Envelope;

    expect(res.status).toBe(200);
    expect(body.data?.postKind).toBe("video");
    expect(body.data?.media.some((item) => item.id === "v-720")).toBe(true);
    expect(body.data?.media.some((item) => item.extension === "jpg")).toBe(false);
    // The engine reads the canonical Pin URL.
    expect(vi.mocked(ytdlp.probeUrl)).toHaveBeenCalledWith(
      "https://www.pinterest.com/pin/32580797303002442/",
    );
    expect(calls).toEqual([]);
  });

  it("resolves an image Pin to its original and downloads a real JPEG", async () => {
    routeFetch([
      [exact("https://www.pinterest.com/pin/311241024270560610/"), fixture("image-pin-legacy-initial-props.html")],
      [/^https:\/\/i\.pinimg\.com\/originals\//, jpeg],
    ]);

    const res = await resolveRoute(
      postRequest("/api/resolve", { url: "https://www.pinterest.com/pin/311241024270560610/" }),
    );
    const body = (await res.json()) as Envelope;

    expect(res.status).toBe(200);
    expect(body.data?.postKind).toBe("image");
    const item = body.data!.media[0]!;
    expect(item.mediaUrl).toContain("/originals/");
    expect(item.quality).toBe("Original");

    const download = await downloadRoute(
      postRequest("/api/download", { mediaId: body.data!.mediaId, itemId: item.id }),
    );
    expect(download.status).toBe(200);
    expect(download.headers.get("content-type")).toBe("image/jpeg");
    expect(download.headers.get("content-disposition")).toMatch(/\.jpg"$/);
    const bytes = new Uint8Array(await download.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
  });

  it("expands pin.it and reads the canonical Pin, without the share parameters", async () => {
    const sent = "https://www.pinterest.com/pin/32580797303002442/sent/?invite_code=x&sender=y&sfo=1";
    const calls = routeFetch([
      [exact("https://pin.it/6LbkInhRx"), redirect("https://api.pinterest.com/url_shortener/6LbkInhRx/redirect/", 308)],
      [exact("https://api.pinterest.com/url_shortener/6LbkInhRx/redirect/"), redirect(sent)],
      [exact(sent), fixture("video-pin-pinit-sent-page.html")],
      [exact("https://www.pinterest.com/pin/32580797303002442/"), fixture("video-pin-pinit-sent-page.html")],
    ]);

    const res = await resolveRoute(postRequest("/api/resolve", { url: "https://pin.it/6LbkInhRx" }));
    const body = (await res.json()) as Envelope;

    expect(res.status).toBe(200);
    expect(body.data?.sourceUrl).toBe("https://www.pinterest.com/pin/32580797303002442/");
    expect(body.data?.postKind).toBe("video");
    expect(body.data?.media[0]?.extension).toBe("mp4");
    expect(body.data?.title ?? "").not.toMatch(/^Check out this Pin/i);
    // The page the resolver read was the canonical one.
    expect(calls.at(-1)).toBe("https://www.pinterest.com/pin/32580797303002442/");
  });

  it("accepts a country domain and reads the Pin from www.pinterest.com", async () => {
    const calls = routeFetch([
      [exact("https://www.pinterest.com/pin/311241024270560610/"), fixture("image-pin-legacy-initial-props.html")],
      [/^https:\/\/i\.pinimg\.com\/originals\//, jpeg],
    ]);

    const res = await resolveRoute(
      postRequest("/api/resolve", { url: "https://www.pinterest.co.uk/pin/311241024270560610/" }),
    );

    expect(res.status).toBe(200);
    expect(calls).toContain("https://www.pinterest.com/pin/311241024270560610/");
    expect(calls.some((url) => url.includes("pinterest.co.uk"))).toBe(false);
  });

  it("reports a removed Pin as not found with a clear message", async () => {
    routeFetch([
      [exact("https://www.pinterest.com/pin/824721750502199491/"), fixture("removed-pin-200-pinnotfound.html")],
    ]);

    const res = await resolveRoute(
      postRequest("/api/resolve", { url: "https://www.pinterest.com/pin/824721750502199491/" }),
    );
    const body = (await res.json()) as Envelope;

    expect(res.status).toBe(404);
    expect(body.error?.code).toBe("MEDIA_NOT_FOUND");
    expect(body.error?.message).toMatch(/removed, is private, or doesn't exist/);
  });

  it("rejects a board link as not a single Pin", async () => {
    const calls = routeFetch([]);

    const res = await resolveRoute(
      postRequest("/api/resolve", { url: "https://www.pinterest.com/pinterest/official-news/" }),
    );
    const body = (await res.json()) as Envelope;

    expect(res.status).toBe(400);
    expect(body.error?.code).toBe("INVALID_PLATFORM_URL");
    expect(calls).toEqual([]);
  });

  it("reports an unknown pin.it code as an invalid or expired link", async () => {
    routeFetch([
      [exact("https://pin.it/zzzzzzzzzq"), redirect("https://api.pinterest.com/url_shortener/zzzzzzzzzq/redirect/", 308)],
      [exact("https://api.pinterest.com/url_shortener/zzzzzzzzzq/redirect/"), redirect("https://www.pinterest.com")],
      [exact("https://www.pinterest.com/"), html("<!doctype html><html><head><title>Pinterest</title></head></html>")],
    ]);

    const res = await resolveRoute(postRequest("/api/resolve", { url: "https://pin.it/zzzzzzzzzq" }));
    const body = (await res.json()) as Envelope;

    expect(res.status).toBe(404);
    expect(body.error?.code).toBe("MEDIA_NOT_FOUND");
    expect(body.error?.message).toMatch(/pin\.it link is invalid or has expired/);
  });
});
