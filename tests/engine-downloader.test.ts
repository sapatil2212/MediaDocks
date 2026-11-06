import { describe, expect, it, vi } from "vitest";

// SSRF checks resolve DNS; keep the suite offline and deterministic.
vi.mock("dns/promises", () => ({
  default: { lookup: async () => [{ address: "93.184.216.34", family: 4 }] },
}));

// Never spawn the real engine from a unit test.
vi.mock("@/lib/engine/binaries", () => ({
  ytdlpCommand: async () => ({ bin: "yt-dlp-test-double", prefixArgs: [] }),
  ffmpegPath: async () => "/usr/bin/ffmpeg",
  engineAvailable: async () => true,
}));

const { buildEngineArgs, runEngineDownload } = await import("@/lib/engine/downloader");

describe("engine-hls download spec", () => {
  it("asks yt-dlp for best video + audio from the manifest, merged into MP4", () => {
    const manifest = "https://v1.pinimg.com/videos/iht/hls/5b/10/89/5b1089ac.m3u8";
    const args = buildEngineArgs({ strategy: "engine-hls" }, manifest, "out.%(ext)s", "/usr/bin/ffmpeg");

    const format = args.indexOf("-f");
    expect(format).toBeGreaterThan(-1);
    expect(args[format + 1]).toBe("bv*+ba/b");
    const merge = args.indexOf("--merge-output-format");
    expect(args[merge + 1]).toBe("mp4");
    expect(args[args.length - 1]).toBe(manifest);
  });

  it("refuses a manifest outside the media CDN allow-list before running anything", async () => {
    await expect(
      runEngineDownload({ strategy: "engine-hls" }, "https://example.com/x.m3u8"),
    ).rejects.toMatchObject({ code: "UNSAFE_URL" });
  });
});
