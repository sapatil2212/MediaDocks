import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { POST as summarizeRoute } from "@/app/api/summarize/route";
import { MIN_TRANSCRIPT_WORDS } from "@/src/lib/summarize";

/**
 * Validation-only coverage: these cases must be rejected before any paid model
 * call is made, so they run without contacting the provider.
 */

let ipCounter = 10;

function post(body: unknown): NextRequest {
  ipCounter += 1;
  return new NextRequest("http://localhost:3000/api/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": `198.51.100.${ipCounter % 250}`,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/summarize — input validation", () => {
  it("rejects a missing transcript", async () => {
    const response = await summarizeRoute(post({}));
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.code).toBe("INVALID_URL");
  });

  it("rejects a blank transcript", async () => {
    const response = await summarizeRoute(post({ text: "    " }));
    expect(response.status).toBe(400);
  });

  it("rejects a transcript with too little speech to condense", async () => {
    const response = await summarizeRoute(post({ text: "only a handful of words" }));
    expect(response.status).toBe(422);
    const payload = await response.json();
    expect(payload.code).toBe("SUMMARY_FAILED");
    expect(payload.error).toContain(String(MIN_TRANSCRIPT_WORDS));
  });

  it("rejects an oversized request body", async () => {
    const response = await summarizeRoute(post({ text: "word ".repeat(200_000) }));
    expect(response.status).toBe(413);
    const payload = await response.json();
    expect(payload.code).toBe("FILE_TOO_LARGE");
  });

  it("never echoes the provider key value in an error", async () => {
    const response = await summarizeRoute(post({ text: "too short" }));
    const raw = JSON.stringify(await response.json());
    const key = process.env.GEMINI_API_KEY?.trim();
    if (key) expect(raw).not.toContain(key);
    expect(raw.toLowerCase()).not.toContain("x-goog-api-key");
  });

  it("sets no-store headers so summaries are not cached", async () => {
    const response = await summarizeRoute(post({}));
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});
