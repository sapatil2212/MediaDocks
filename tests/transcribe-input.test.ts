import { describe, expect, it } from "vitest";
import {
  acceptAttribute,
  exceedsUploadLimit,
  isAcceptedUpload,
  MAX_UPLOAD_MB,
  variantCopy,
} from "@/src/lib/transcribe-input";

/**
 * The audio and video tools share one endpoint, so these rules are what keep
 * each page asking for the files it actually promises to handle.
 */

describe("isAcceptedUpload — audio tool", () => {
  it("accepts common audio containers", () => {
    for (const name of ["talk.mp3", "memo.wav", "call.m4a", "master.flac", "voice.ogg", "clip.aac"]) {
      expect(isAcceptedUpload(name, "", "audio"), name).toBe(true);
    }
  });

  it("accepts an audio MIME type even when the name has no extension", () => {
    expect(isAcceptedUpload("recording", "audio/mpeg", "audio")).toBe(true);
  });

  it("rejects video files, because the audio tool does not offer them", () => {
    expect(isAcceptedUpload("lecture.mp4", "video/mp4", "audio")).toBe(false);
    expect(isAcceptedUpload("clip.mov", "video/quicktime", "audio")).toBe(false);
  });

  it("rejects unrelated files", () => {
    expect(isAcceptedUpload("notes.pdf", "application/pdf", "audio")).toBe(false);
    expect(isAcceptedUpload("archive.zip", "", "audio")).toBe(false);
  });

  it("is case-insensitive about extensions", () => {
    expect(isAcceptedUpload("INTERVIEW.MP3", "", "audio")).toBe(true);
  });
});

describe("isAcceptedUpload — video tool", () => {
  it("accepts video containers", () => {
    for (const name of ["a.mp4", "b.mov", "c.mkv", "d.webm", "e.avi"]) {
      expect(isAcceptedUpload(name, "", "video"), name).toBe(true);
    }
  });

  it("also accepts audio, so an MP3 on the video page still works", () => {
    expect(isAcceptedUpload("podcast.mp3", "audio/mpeg", "video")).toBe(true);
  });

  it("rejects unrelated files", () => {
    expect(isAcceptedUpload("resume.docx", "application/msword", "video")).toBe(false);
  });
});

describe("acceptAttribute", () => {
  it("offers only audio on the audio tool", () => {
    const accept = acceptAttribute("audio");
    expect(accept).toContain("audio/*");
    expect(accept).toContain(".mp3");
    expect(accept).not.toContain("video/*");
    expect(accept).not.toContain(".mp4");
  });

  it("offers both on the video tool", () => {
    const accept = acceptAttribute("video");
    expect(accept).toContain("video/*");
    expect(accept).toContain("audio/*");
    expect(accept).toContain(".mp4");
    expect(accept).toContain(".mp3");
  });
});

describe("exceedsUploadLimit", () => {
  it("allows a file at the limit and rejects one past it", () => {
    expect(exceedsUploadLimit(MAX_UPLOAD_MB * 1024 * 1024)).toBe(false);
    expect(exceedsUploadLimit(MAX_UPLOAD_MB * 1024 * 1024 + 1)).toBe(true);
  });

  it("treats unusable sizes as acceptable and lets the server decide", () => {
    expect(exceedsUploadLimit(0)).toBe(false);
    expect(exceedsUploadLimit(Number.NaN)).toBe(false);
  });
});

describe("variantCopy", () => {
  it("describes each tool distinctly", () => {
    expect(variantCopy("audio").dropzoneTitle).toMatch(/audio/i);
    expect(variantCopy("audio").dropzoneTitle).not.toMatch(/video/i);
    expect(variantCopy("video").dropzoneTitle).toMatch(/video/i);
  });

  it("states the upload ceiling in the hint", () => {
    expect(variantCopy("audio").dropzoneHint).toContain(String(MAX_UPLOAD_MB));
    expect(variantCopy("video").dropzoneHint).toContain(String(MAX_UPLOAD_MB));
  });
});
