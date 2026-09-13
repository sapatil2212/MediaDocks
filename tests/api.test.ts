import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as resolveRoute } from "@/app/api/resolve/route";
import { POST as downloadRoute } from "@/app/api/download/route";
import { GET as healthRoute } from "@/app/api/health/route";
import { config } from "@/lib/config";

interface Envelope {
  success: boolean;
  data?: Record<string, unknown>;
  error?: { code: string; message: string };
}

let ipCounter = 0;

function postRequest(path: string, body: unknown): NextRequest {
  ipCounter += 1;
  return new NextRequest(`http://localhost:3000${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // A fresh IP per call keeps the rate limiter out of the way.
      "x-forwarded-for": `203.0.113.${ipCounter % 250}`,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/resolve", () => {
  it("rejects a missing url", async () => {
    const res = await resolveRoute(postRequest("/api/resolve", {}));
    const body = (await res.json()) as Envelope;

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe("INVALID_URL");
  });

  it("rejects an unsupported platform", async () => {
    const res = await resolveRoute(postRequest("/api/resolve", { url: "https://example.com/v/1" }));
    const body = (await res.json()) as Envelope;

    expect(res.status).toBe(400);
    expect(body.error?.code).toBe("UNSUPPORTED_PLATFORM");
  });

  it("rejects SSRF style targets", async () => {
    for (const url of ["http://localhost", "http://127.0.0.1", "file:///etc/passwd"]) {
      const res = await resolveRoute(postRequest("/api/resolve", { url }));
      const body = (await res.json()) as Envelope;

      expect(res.status, url).toBeGreaterThanOrEqual(400);
      expect(body.success, url).toBe(false);
    }
  });

  it("returns 429 once the rate limit is exceeded", async () => {
    const request = () =>
      new NextRequest("http://localhost:3000/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.7" },
        body: JSON.stringify({ url: "https://example.com/blocked" }),
      });

    // Derived from configuration rather than assuming a specific limit.
    const attempts = config.resolveLimit + 2;
    let limited = false;

    for (let attempt = 0; attempt < attempts && !limited; attempt++) {
      const res = await resolveRoute(request());
      if (res.status === 429) {
        const body = (await res.json()) as Envelope;
        expect(body.error?.code).toBe("RATE_LIMITED");
        expect(res.headers.get("retry-after")).toBeTruthy();
        limited = true;
      }
    }

    expect(limited, `no 429 within ${attempts} requests (limit ${config.resolveLimit})`).toBe(true);
  });
});

describe("POST /api/download", () => {
  it("requires a media reference", async () => {
    const res = await downloadRoute(postRequest("/api/download", {}));
    const body = (await res.json()) as Envelope;

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("refuses a raw URL instead of a reference", async () => {
    const res = await downloadRoute(
      postRequest("/api/download", { url: "https://evil.example.com/x.mp4" }),
    );

    expect(res.status).toBe(400);
  });

  it("does not serve an unknown reference", async () => {
    const res = await downloadRoute(
      postRequest("/api/download", { mediaId: "does-not-exist", itemId: "item-1" }),
    );
    const body = (await res.json()) as Envelope;

    // 404 when MySQL is reachable, 500 when it is not — never a 200.
    expect([404, 500]).toContain(res.status);
    expect(body.success).toBe(false);
  });
});

describe("GET /api/health", () => {
  it("reports the database state", async () => {
    const res = await healthRoute();
    const body = (await res.json()) as { status: string; database: string };

    expect(["ok", "degraded"]).toContain(body.status);
    expect(["ok", "unavailable"]).toContain(body.database);
    expect(res.status).toBe(body.database === "ok" ? 200 : 503);
  }, 10000);
});

describe("mock resolver", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns demo results without any external request", async () => {
    vi.resetModules();
    vi.stubEnv("MOCK_RESOLVER", "true");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { resolveMedia } = await import("@/lib/resolver/resolver-service");
    const { result, platform } = await resolveMedia("https://www.instagram.com/p/abc123");

    expect(platform).toBe("instagram");
    expect(result.isMock).toBe(true);
    expect(result.mediaId).toBeUndefined();
    expect(result.media.length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("marks demo media as not downloadable", async () => {
    vi.resetModules();
    vi.stubEnv("MOCK_RESOLVER", "true");

    const { resolveMedia } = await import("@/lib/resolver/resolver-service");
    const { result } = await resolveMedia("https://x.com/user/status/123456789");

    for (const item of result.media) {
      expect(item.downloadable).toBe(false);
      expect(item.kind === "image" || item.kind === "video").toBe(true);
      expect(item.extension).toBeTruthy();
    }
  });
});
