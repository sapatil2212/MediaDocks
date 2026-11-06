import { describe, expect, it } from "vitest";
import { groupFormats } from "@/lib/engine/format-groups";
import { classifyError, type YtdlpInfo } from "@/lib/engine/ytdlp";
import { readJsonFixture } from "./helpers/fixtures";

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

describe("groupFormats — Pinterest (saved yt-dlp -J output)", () => {
  const classic = readJsonFixture<YtdlpInfo>("ytdlp-J-664281013778109217.json");
  const separateAudio = readJsonFixture<YtdlpInfo>("ytdlp-J-32580797303002442.json");
  const separateAudioWithMp4 = readJsonFixture<YtdlpInfo>("ytdlp-J-1052575744158055904.json");

  it("labels portrait renditions by their short side and prefers the direct V_720P file", () => {
    const { postKind, options } = groupFormats(classic, true);
    const video = options.filter((o) => o.kind === "video");

    expect(postKind).toBe("video");
    expect(video.map((o) => o.id)).toEqual(["v-720", "v-480", "v-360", "v-240"]);
    // yt-dlp reports V_720P as 1080x1920; the file is 720x1280.
    expect(video[0]).toMatchObject({
      label: "720p",
      width: 720,
      height: 1280,
      spec: { strategy: "engine-format", formatId: "V_720P" },
    });
    // 640x1136 beats 480x852 on the 480 rung by frame size.
    expect(video[1]?.spec).toEqual({ strategy: "engine-format", formatId: "V_HLSV4-1613" });
    expect(video[1]).toMatchObject({ width: 640, height: 1136 });
  });

  it("pairs video-only HLS with the separate audio rendition that has no acodec", () => {
    const { postKind, options } = groupFormats(separateAudio, true);

    expect(postKind).toBe("video");
    const p720 = options.find((o) => o.id === "v-720");
    expect(p720?.spec).toEqual({
      strategy: "engine-mux",
      videoFormatId: "V_HLSV3_MOBILE-1442",
      audioFormatId: "V_HLSV3_MOBILE-audio1-1",
    });
    expect(options.some((o) => o.id === "a-source")).toBe(true);
  });

  it("uses V_720P for 720p and muxes the lower rungs with the HLS audio", () => {
    const { options } = groupFormats(separateAudioWithMp4, true);
    const video = options.filter((o) => o.kind === "video");

    expect(video[0]).toMatchObject({
      id: "v-720",
      spec: { strategy: "engine-format", formatId: "V_720P" },
    });
    for (const lower of video.slice(1)) {
      expect(lower.spec).toMatchObject({ strategy: "engine-mux", audioFormatId: "V_HLSV4-audio1-1" });
    }
  });

  it("offers no mux options without FFmpeg", () => {
    const { options } = groupFormats(separateAudio, false);
    expect(options.some((o) => o.spec.strategy === "engine-mux")).toBe(false);
  });

  it("labels a portrait 1080x1920 progressive format 1080p", () => {
    const { options } = groupFormats(
      {
        formats: [
          { format_id: "22", ext: "mp4", vcodec: "avc1", acodec: "mp4a", width: 1080, height: 1920, protocol: "https" },
        ],
      },
      true,
    );
    expect(options[0]).toMatchObject({ id: "v-1080", label: "1080p", width: 1080, height: 1920 });
  });
});

describe("classifyError", () => {
  it("does not mistake an ordinary download error for private content", () => {
    expect(classifyError("ERROR: Unable to download webpage: HTTP Error 404: Not Found")).not.toBe(
      "private",
    );
    expect(classifyError("ERROR: Unable to extract image url")).not.toBe("private");
  });

  it("still recognises age-restricted and missing-format errors", () => {
    expect(classifyError("ERROR: This video is age-restricted")).toBe("private");
    expect(classifyError("ERROR: No video formats found!")).toBe("unsupported");
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
