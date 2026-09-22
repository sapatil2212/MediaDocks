import { describe, expect, it } from "vitest";
import {
  cleanList,
  cleanQaPairs,
  countWords,
  isSummarizable,
  isSummaryFormat,
  isSummaryLength,
  MIN_TRANSCRIPT_WORDS,
  splitForModel,
  summaryFileName,
  summaryToText,
  type SummaryResult,
} from "@/src/lib/summarize";

describe("input validation", () => {
  it("accepts only known formats and lengths", () => {
    expect(isSummaryFormat("brief")).toBe(true);
    expect(isSummaryFormat("qa")).toBe(true);
    expect(isSummaryFormat("chapters")).toBe(false);
    expect(isSummaryFormat(null)).toBe(false);

    expect(isSummaryLength("detailed")).toBe(true);
    expect(isSummaryLength("tweet")).toBe(false);
  });
});

describe("countWords", () => {
  it("counts words, ignoring punctuation", () => {
    expect(countWords("Hello there, world!")).toBe(3);
  });

  it("handles empty and non-string input", () => {
    expect(countWords("")).toBe(0);
    expect(countWords(undefined as unknown as string)).toBe(0);
  });

  it("counts non-Latin scripts", () => {
    expect(countWords("こんにちは 世界")).toBeGreaterThan(0);
  });
});

describe("isSummarizable", () => {
  it("rejects transcripts that are too short to condense", () => {
    expect(isSummarizable("just a few words here")).toBe(false);
  });

  it("accepts a transcript at the threshold", () => {
    expect(isSummarizable(Array.from({ length: MIN_TRANSCRIPT_WORDS }, () => "word").join(" "))).toBe(
      true,
    );
  });
});

describe("splitForModel", () => {
  it("returns a single section when the text fits", () => {
    expect(splitForModel("Short transcript.", 100)).toEqual(["Short transcript."]);
  });

  it("returns nothing for blank input", () => {
    expect(splitForModel("   ")).toEqual([]);
  });

  it("splits on sentence boundaries rather than mid-sentence", () => {
    const text = `${"A".repeat(40)}. ${"B".repeat(40)}. ${"C".repeat(40)}.`;
    const sections = splitForModel(text, 60);
    expect(sections.length).toBeGreaterThan(1);
    // No section should begin mid-word from a hard cut at the window edge.
    for (const section of sections) expect(section.trim()).toBe(section);
    expect(sections.join(" ").replace(/\s+/g, "")).toBe(text.replace(/\s+/g, ""));
  });

  it("still splits text that has no sentence boundaries", () => {
    const sections = splitForModel("x".repeat(250), 100);
    expect(sections).toHaveLength(3);
    expect(sections.every((section) => section.length <= 100)).toBe(true);
  });
});

describe("cleanList", () => {
  it("trims, strips bullet glyphs, and drops blanks", () => {
    expect(cleanList(["- First point", "  • Second  ", "", "   ", "3. Third"])).toEqual([
      "First point",
      "Second",
      "Third",
    ]);
  });

  it("removes case-insensitive duplicates", () => {
    expect(cleanList(["Ship the release", "ship the release"])).toEqual(["Ship the release"]);
  });

  it("honours the limit and rejects non-arrays", () => {
    expect(cleanList(["a", "b", "c"], 2)).toEqual(["a", "b"]);
    expect(cleanList("not an array")).toEqual([]);
    expect(cleanList(undefined)).toEqual([]);
  });

  it("ignores non-string entries", () => {
    expect(cleanList([1, {}, null, "kept"])).toEqual(["kept"]);
  });
});

describe("cleanQaPairs", () => {
  it("keeps complete pairs only", () => {
    expect(
      cleanQaPairs([
        { question: "What shipped?", answer: "The summarizer." },
        { question: "Missing answer", answer: "   " },
        { question: "", answer: "orphan" },
        "nonsense",
      ]),
    ).toEqual([{ question: "What shipped?", answer: "The summarizer." }]);
  });

  it("rejects non-arrays", () => {
    expect(cleanQaPairs(null)).toEqual([]);
  });
});

const result: SummaryResult = {
  title: "Team sync",
  summary: "The team agreed to ship on Friday.",
  keyPoints: ["Release is on track", "Docs still pending"],
  actionItems: ["Ana updates the changelog"],
  qa: [{ question: "Who signs off?", answer: "Ana." }],
  format: "keyPoints",
  length: "medium",
  language: "en",
  sourceWords: 480,
};

describe("summaryToText", () => {
  it("renders every populated section as readable text", () => {
    const text = summaryToText(result);
    expect(text).toContain("Team sync");
    expect(text).toContain("The team agreed to ship on Friday.");
    expect(text).toContain("Key points");
    expect(text).toContain("- Release is on track");
    expect(text).toContain("Action items");
    expect(text).toContain("Q: Who signs off?");
    expect(text).toContain("A: Ana.");
  });

  it("omits empty sections and collapses blank runs", () => {
    const text = summaryToText({
      ...result,
      keyPoints: [],
      actionItems: [],
      qa: [],
      format: "brief",
    });
    expect(text).not.toContain("Key points");
    expect(text).not.toContain("Action items");
    expect(text).not.toMatch(/\n{3,}/);
  });
});

describe("summaryFileName", () => {
  it("builds a safe txt filename", () => {
    expect(summaryFileName("Team sync")).toBe("Team sync.txt");
    expect(summaryFileName('bad/name:with*chars?')).toBe("bad-name-with-chars-.txt");
  });

  it("falls back when the title is empty", () => {
    expect(summaryFileName("")).toBe("summary.txt");
    expect(summaryFileName("   ")).toBe("summary.txt");
  });
});
