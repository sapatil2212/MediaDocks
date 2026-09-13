import { describe, expect, it } from "vitest";
import { groupFormats } from "@/lib/engine/format-groups";
import type { YtdlpInfo } from "@/lib/engine/ytdlp";

/** A realistic YouTube-style info blob: separate video-only + audio-only streams. */
const youtubeInfo: YtdlpInfo = {
  id: "dQw4w9WgXcQ",
  title: "Never Gonna Give You Up",
  duration: 213,
  thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.webp",
  formats: [
    { format_id: "140", ext: "m4a", vcodec: "none", acodec: "mp4a.40.2", abr: 130, filesize: 3_400_000, protocol: "https" },
    { format_id: "251", ext: "webm", vcodec: "none", acodec: "opus", abr: 141, protocol: "https" },
    { format_id: "160", ext: "mp4", vcodec: "avc1", acodec: "none", height: 144, width: 256, filesize: 2_000_000, protocol: "https" },
    { format_id: "133", ext: "mp4", vcodec: "avc1", acodec: "none", height: 240, width: 426, protocol: "https" },
    { format_id: "134", ext: "mp4", vcodec: "avc1", acodec: "none", height: 360, width: 640, protocol: "https" },
    { format_id: "135", ext: "mp4", vcodec: "avc1", acodec: "none", height: 480, width: 854, protocol: "https" },
    { format_id: "136", ext: "mp4", vcodec: "avc1", acodec: "none", height: 720, width: 1280, protocol: "https" },
    { format_id: "137", ext: "mp4", vcodec: "avc1", acodec: "none", height: 1080, width: 1920, protocol: "https" },
    { format_id: "18", ext: "mp4", vcodec: "avc1", acodec: "mp4a.40.2", height: 360, width: 640, filesize: 10_000_000, protocol: "https" },
  ],
};

describe("groupFormats — video ladder", () => {
  it("produces one video option per resolution, highest first", () => {
    const { postKind, options } = groupFormats(youtubeInfo, true);
    expect(postKind).toBe("video");
    const video = options.filter((o) => o.kind === "video");
    expect(video.map((o) => o.height)).toEqual([1080, 720, 480, 360, 240, 144]);
    expect(video.every((o) => o.container === "mp4")).toBe(true);
    expect(video.every((o) => o.label.endsWith("p"))).toBe(true);
  });

  it("prefers a progressive format over a mux for the same height", () => {
    const { options } = groupFormats(youtubeInfo, true);
    const p360 = options.find((o) => o.kind === "video" && o.height === 360);
    // format 18 is progressive (has both codecs) at 360p.
    expect(p360?.spec).toEqual({ strategy: "engine-format", formatId: "18" });
  });

  it("muxes video-only with the best audio when no progressive exists", () => {
    const { options } = groupFormats(youtubeInfo, true);
    const p1080 = options.find((o) => o.kind === "video" && o.height === 1080);
    expect(p1080?.spec).toEqual({
      strategy: "engine-mux",
      videoFormatId: "137",
      audioFormatId: "251", // opus 141 is the highest-bitrate audio
    });
  });

  it("drops mux options when FFmpeg is unavailable, keeps progressive", () => {
    const { options } = groupFormats(youtubeInfo, false);
    const video = options.filter((o) => o.kind === "video");
    // Only the progressive 360p survives without FFmpeg.
    expect(video.map((o) => o.height)).toEqual([360]);
    expect(video[0]?.spec.strategy).toBe("engine-format");
  });
});

describe("groupFormats — audio menu", () => {
  it("offers the original audio plus MP3 renditions with FFmpeg", () => {
    const { options } = groupFormats(youtubeInfo, true);
    const audio = options.filter((o) => o.kind === "audio");

    const source = audio.find((o) => o.id === "a-source");
    expect(source?.spec).toEqual({ strategy: "engine-audio", formatId: "251", audioCodec: "source" });

    const mp3s = audio.filter((o) => o.container === "mp3");
    expect(mp3s.length).toBeGreaterThan(0);
    expect(mp3s.every((o) => o.mimeType === "audio/mpeg")).toBe(true);
    for (const mp3 of mp3s) {
      expect(mp3.spec).toMatchObject({ strategy: "engine-audio", audioCodec: "mp3" });
      // Never transcode above the source bitrate (+small headroom).
      expect(mp3.abr).toBeLessThanOrEqual(141 + 64);
    }
  });

  it("carries the chosen bitrate in the spec so each MP3 rung differs", () => {
    const { options } = groupFormats(youtubeInfo, true);
    const mp3s = options.filter((o) => o.container === "mp3");

    // Without a bitrate on the spec the download pipeline falls back to
    // FFmpeg's "best" setting and every rung yields an identical file.
    for (const mp3 of mp3s) {
      expect(mp3.spec).toMatchObject({ audioCodec: "mp3", bitrateKbps: mp3.abr });
    }

    const bitrates = mp3s.map((o) => (o.spec as { bitrateKbps?: number }).bitrateKbps);
    expect(new Set(bitrates).size).toBe(mp3s.length);
    expect(bitrates.every((b) => typeof b === "number" && b > 0)).toBe(true);
  });

  it("offers only the original audio without FFmpeg (no MP3 transcode)", () => {
    const { options } = groupFormats(youtubeInfo, false);
    const audio = options.filter((o) => o.kind === "audio");
    expect(audio.map((o) => o.id)).toEqual(["a-source"]);
  });
});

describe("groupFormats — audio-only source", () => {
  it("reports postKind audio when there is no video", () => {
    const audioOnly: YtdlpInfo = {
      title: "A podcast",
      duration: 1800,
      formats: [
        { format_id: "a1", ext: "m4a", vcodec: "none", acodec: "mp4a", abr: 128, protocol: "https" },
      ],
    };
    const { postKind, options } = groupFormats(audioOnly, true);
    expect(postKind).toBe("audio");
    expect(options.every((o) => o.kind === "audio")).toBe(true);
  });
});
