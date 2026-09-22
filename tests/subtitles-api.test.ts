import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { POST as subtitlesRoute } from "@/app/api/subtitles/route";

/**
 * Contract tests for POST /api/subtitles.
 *
 * These deliberately stop at the request-validation boundary. Anything past it
 * shells out to ffmpeg/yt-dlp and calls a speech model, which belongs in the
 * opt-in live suites rather than the default run.
 */

let ipCounter = 400;

function postJsonRequest(body: unknown): NextRequest {
  ipCounter += 1;
  return new NextRequest("http://localhost:3000/api/subtitles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // A fresh IP per case keeps the shared rate limiter out of the assertions.
      "x-forwarded-for": `203.0.116.${ipCounter % 250}`,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/subtitles", () => {
  it("rejects a payload with no file and no link", async () => {
    const res = await subtitlesRoute(postJsonRequest({}));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.code).toBe("INVALID_URL");
    expect(typeof body.error).toBe("string");
    expect(typeof body.requestId).toBe("string");
  });

  it("rejects a blank link", async () => {
    const res = await subtitlesRoute(postJsonRequest({ url: "" }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("INVALID_URL");
  });

  it("rejects an unparsable body", async () => {
    ipCounter += 1;
    const res = await subtitlesRoute(
      new NextRequest("http://localhost:3000/api/subtitles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `203.0.117.${ipCounter % 250}`,
        },
        body: "{ not json",
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("INVALID_URL");
  });

  it("never allows a subtitle response to be cached", async () => {
    const res = await subtitlesRoute(postJsonRequest({}));
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  // This is the only case here that gets past validation into engine-tool
  // discovery, which sweeps install directories and spawns `-version` probes on
  // a cold process. The default 5s budget is not enough for that on a loaded
  // machine, so it gets an explicit one rather than failing intermittently.
  it(
    "refuses a malformed link without leaking an unhandled error",
    async () => {
      const res = await subtitlesRoute(postJsonRequest({ url: "not-a-valid-url" }));

      // 400 once the engine binaries are found and the URL itself is rejected;
      // 503 on a machine without ffmpeg or a key, reported before URL parsing.
      expect([400, 503]).toContain(res.status);

      const body = await res.json();
      expect(typeof body.code).toBe("string");
      expect(body.code).not.toBe("INTERNAL_ERROR");
    },
    30_000,
  );
});
