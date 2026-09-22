import { describe, expect, it } from "vitest";
import {
  buildCuesForWindow,
  formatSrtTimecode,
  formatVttTimecode,
  MAX_CHARS_PER_LINE,
  normalizeCues,
  parseSubtitleFile,
  parseTimecode,
  renumberCues,
  shiftCues,
  splitTextIntoCueChunks,
  subtitleCoverage,
  subtitleFileName,
  toPlainText,
  toSrt,
  toVtt,
  validateCues,
  wrapCueText,
  type SubtitleCue,
} from "@/src/lib/subtitles";

describe("timecode formatting", () => {
  it("formats SRT with a comma and VTT with a period", () => {
    expect(formatSrtTimecode(0)).toBe("00:00:00,000");
    expect(formatVttTimecode(0)).toBe("00:00:00.000");
    expect(formatSrtTimecode(3661.5)).toBe("01:01:01,500");
    expect(formatVttTimecode(3661.5)).toBe("01:01:01.500");
  });

  it("never emits a negative timecode", () => {
    expect(formatSrtTimecode(-5)).toBe("00:00:00,000");
  });
});

describe("parseTimecode", () => {
  it("accepts both separators and optional hours", () => {
    expect(parseTimecode("00:00:01,500")).toBe(1.5);
    expect(parseTimecode("00:00:01.500")).toBe(1.5);
    expect(parseTimecode("01:02.250")).toBe(62.25);
  });

  it("pads short millisecond fields", () => {
    expect(parseTimecode("00:00:02.5")).toBe(2.5);
  });

  it("rejects nonsense", () => {
    expect(parseTimecode("not a time")).toBeNull();
    expect(parseTimecode("")).toBeNull();
  });
});

describe("wrapCueText", () => {
  it("keeps short text on one line", () => {
    expect(wrapCueText("Hello there")).toBe("Hello there");
  });

  it("wraps onto two lines without breaking words", () => {
    const wrapped = wrapCueText(
      "This sentence is deliberately long enough that it must wrap across two lines",
    );
    const lines = wrapped.split("\n");
    expect(lines.length).toBe(2);
    for (const line of lines) expect(line).not.toMatch(/^\s|\s$/);
    expect(wrapped.replace(/\n/g, " ")).toBe(
      "This sentence is deliberately long enough that it must wrap across two lines",
    );
  });

  it("never loses words when the text exceeds two lines", () => {
    const text = Array.from({ length: 40 }, (_, index) => `word${index}`).join(" ");
    const wrapped = wrapCueText(text);
    expect(wrapped.split("\n").length).toBeLessThanOrEqual(2);
    expect(wrapped.replace(/\n/g, " ").split(/\s+/)).toHaveLength(40);
  });

  it("returns an empty string for blank input", () => {
    expect(wrapCueText("   ")).toBe("");
  });
});

describe("splitTextIntoCueChunks", () => {
  it("returns one chunk when the text already fits", () => {
    expect(splitTextIntoCueChunks("Short line.")).toEqual(["Short line."]);
  });

  it("prefers sentence boundaries", () => {
    const chunks = splitTextIntoCueChunks(
      "First sentence ends here. Second sentence continues for a while longer.",
      40,
    );
    expect(chunks[0].endsWith(".")).toBe(true);
  });

  it("never emits an empty chunk and preserves all words", () => {
    const text = Array.from({ length: 60 }, (_, index) => `w${index}`).join(" ");
    const chunks = splitTextIntoCueChunks(text, 30);
    expect(chunks.every((chunk) => chunk.trim().length > 0)).toBe(true);
    expect(chunks.join(" ").split(/\s+/)).toHaveLength(60);
  });
});

describe("buildCuesForWindow", () => {
  it("spans exactly the window it was given", () => {
    const cues = buildCuesForWindow("A short line of speech.", 10, 14);
    expect(cues).toHaveLength(1);
    expect(cues[0].start).toBe(10);
    expect(cues[0].end).toBe(14);
  });

  it("splits long text into sequential, non-overlapping cues", () => {
    const text = Array.from({ length: 60 }, (_, index) => `word${index}`).join(" ");
    const cues = buildCuesForWindow(text, 0, 30);

    expect(cues.length).toBeGreaterThan(1);
    for (let index = 0; index < cues.length - 1; index += 1) {
      expect(cues[index].end).toBeLessThanOrEqual(cues[index + 1].start);
    }
    expect(cues[0].start).toBe(0);
    expect(cues.at(-1)?.end).toBe(30);
  });

  it("gives longer cues more time than shorter ones", () => {
    const cues = buildCuesForWindow(
      `${"a".repeat(80)}. ${"b".repeat(10)}.`,
      0,
      20,
    );
    expect(cues.length).toBeGreaterThan(1);
    const durations = cues.map((cue) => cue.end - cue.start);
    expect(durations[0]).toBeGreaterThan(durations.at(-1) as number);
  });

  it("returns nothing for empty text or a zero-length window", () => {
    expect(buildCuesForWindow("", 0, 10)).toEqual([]);
    expect(buildCuesForWindow("Some speech", 5, 5)).toEqual([]);
  });

  it("wraps each cue to the line limit", () => {
    const cues = buildCuesForWindow(
      Array.from({ length: 40 }, () => "long").join(" "),
      0,
      30,
    );
    for (const cue of cues) {
      for (const line of cue.text.split("\n")) {
        expect(line.length).toBeLessThanOrEqual(MAX_CHARS_PER_LINE + 12);
      }
    }
  });
});

describe("shiftCues", () => {
  const cues: SubtitleCue[] = [
    { id: "cue-1", start: 5, end: 7, text: "One" },
    { id: "cue-2", start: 8, end: 10, text: "Two" },
  ];

  it("moves cues later", () => {
    expect(shiftCues(cues, 2)).toEqual([
      { id: "cue-1", start: 7, end: 9, text: "One" },
      { id: "cue-2", start: 10, end: 12, text: "Two" },
    ]);
  });

  it("moves cues earlier without going negative", () => {
    const shifted = shiftCues(cues, -100);
    expect(shifted[0].start).toBe(0);
    expect(shifted[0].end).toBeGreaterThan(shifted[0].start);
  });

  it("ignores a non-finite offset", () => {
    expect(shiftCues(cues, Number.NaN)).toEqual(cues);
  });
});

describe("normalizeCues", () => {
  it("sorts, trims overlaps, drops blanks and renumbers", () => {
    const messy: SubtitleCue[] = [
      { id: "b", start: 5, end: 9, text: "second" },
      { id: "a", start: 0, end: 6, text: "first" },
      { id: "c", start: 10, end: 12, text: "   " },
    ];
    const normalized = normalizeCues(messy);

    expect(normalized.map((cue) => cue.text)).toEqual(["first", "second"]);
    expect(normalized[0].end).toBeLessThanOrEqual(normalized[1].start);
    expect(normalized.map((cue) => cue.id)).toEqual(["cue-1", "cue-2"]);
  });
});

describe("export formats", () => {
  const cues: SubtitleCue[] = [
    { id: "cue-1", start: 0, end: 2.5, text: "First line\nsecond line" },
    { id: "cue-2", start: 3, end: 5, text: "Next cue" },
  ];

  it("writes valid SRT", () => {
    const srt = toSrt(cues);
    expect(srt).toContain("1\n00:00:00,000 --> 00:00:02,500\nFirst line\nsecond line");
    expect(srt).toContain("2\n00:00:03,000 --> 00:00:05,000\nNext cue");
  });

  it("writes valid VTT with the required header", () => {
    const vtt = toVtt(cues);
    expect(vtt.startsWith("WEBVTT\n\n")).toBe(true);
    expect(vtt).toContain("00:00:00.000 --> 00:00:02.500");
  });

  it("writes plain text with cue newlines flattened", () => {
    expect(toPlainText(cues)).toBe("First line second line\nNext cue");
  });

  it("handles an empty cue list", () => {
    expect(toSrt([])).toBe("");
    expect(toVtt([])).toBe("WEBVTT\n\n");
    expect(toPlainText([])).toBe("");
  });
});

describe("parseSubtitleFile", () => {
  it("parses SRT", () => {
    const cues = parseSubtitleFile(
      "1\n00:00:01,000 --> 00:00:03,000\nHello there\n\n2\n00:00:04,000 --> 00:00:06,000\nSecond cue",
    );
    expect(cues).toHaveLength(2);
    expect(cues[0]).toMatchObject({ start: 1, end: 3, text: "Hello there" });
  });

  it("parses VTT and skips headers, notes and styles", () => {
    const cues = parseSubtitleFile(
      "WEBVTT\n\nNOTE this is ignored\n\nSTYLE\n::cue { color: red }\n\n00:00:02.000 --> 00:00:04.000 align:start\nStyled cue",
    );
    expect(cues).toHaveLength(1);
    expect(cues[0]).toMatchObject({ start: 2, end: 4, text: "Styled cue" });
  });

  it("tolerates CRLF, a BOM and inline tags", () => {
    const cues = parseSubtitleFile(
      "\uFEFF1\r\n00:00:01,000 --> 00:00:02,000\r\n<v Speaker>Tagged</v>\r\n",
    );
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe("Tagged");
  });

  it("skips malformed and zero-length cues", () => {
    const cues = parseSubtitleFile(
      "1\nnot a timing line\ntext\n\n2\n00:00:05,000 --> 00:00:05,000\nzero length\n\n3\n00:00:06,000 --> 00:00:08,000\nkept",
    );
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe("kept");
  });

  it("returns nothing for empty input", () => {
    expect(parseSubtitleFile("")).toEqual([]);
    expect(parseSubtitleFile("   ")).toEqual([]);
  });

  it("round-trips its own SRT output", () => {
    const original: SubtitleCue[] = [
      { id: "cue-1", start: 1.25, end: 3.5, text: "Round trip" },
      { id: "cue-2", start: 4, end: 6, text: "Two lines\nhere" },
    ];
    const parsed = parseSubtitleFile(toSrt(original));
    expect(parsed.map(({ start, end, text }) => ({ start, end, text }))).toEqual(
      original.map(({ start, end, text }) => ({ start, end, text })),
    );
  });

  it("round-trips its own VTT output", () => {
    const original: SubtitleCue[] = [{ id: "cue-1", start: 0.5, end: 2, text: "Vtt cue" }];
    expect(parseSubtitleFile(toVtt(original))).toHaveLength(1);
  });
});

describe("validateCues", () => {
  it("reports short, long, overlapping and over-wide cues", () => {
    const issues = validateCues([
      { id: "cue-1", start: 0, end: 0.4, text: "Too short" },
      { id: "cue-2", start: 0.3, end: 12, text: "x".repeat(60) },
    ]);
    const kinds = issues.map((issue) => issue.kind);
    expect(kinds).toContain("tooShort");
    expect(kinds).toContain("tooLong");
    expect(kinds).toContain("longLine");
    expect(kinds).toContain("overlap");
  });

  it("reports nothing for well-formed cues", () => {
    expect(
      validateCues([
        { id: "cue-1", start: 0, end: 2, text: "Fine cue" },
        { id: "cue-2", start: 2.5, end: 5, text: "Also fine" },
      ]),
    ).toEqual([]);
  });

  it("flags more than two lines", () => {
    const issues = validateCues([{ id: "cue-1", start: 0, end: 3, text: "a\nb\nc" }]);
    expect(issues.some((issue) => issue.kind === "tooManyLines")).toBe(true);
  });
});

describe("helpers", () => {
  it("reports coverage from the last cue end", () => {
    expect(
      subtitleCoverage([
        { id: "cue-1", start: 0, end: 4, text: "a" },
        { id: "cue-2", start: 5, end: 9.5, text: "b" },
      ]),
    ).toBe(9.5);
    expect(subtitleCoverage([])).toBe(0);
  });

  it("renumbers cues sequentially", () => {
    expect(
      renumberCues([
        { id: "x", start: 0, end: 1, text: "a" },
        { id: "y", start: 1, end: 2, text: "b" },
      ]).map((cue) => cue.id),
    ).toEqual(["cue-1", "cue-2"]);
  });

  it("builds safe filenames per format", () => {
    expect(subtitleFileName("My Video", "srt")).toBe("My Video.srt");
    expect(subtitleFileName("bad/name*", "vtt")).toBe("bad-name-.vtt");
    expect(subtitleFileName("", "txt")).toBe("subtitles.txt");
  });
});
