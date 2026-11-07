import { describe, expect, it } from "vitest";
import { MAX_SLOTS, placeSlots } from "@/src/lib/ads/placement";

const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");

describe("placeSlots", () => {
  it("places nothing before 400 words have accumulated", () => {
    expect(placeSlots([{ paragraphs: [words(100), words(100), words(100)] }])).toEqual([]);
  });

  it("places a slot between paragraphs once 400 words accumulated", () => {
    const slots = placeSlots([{ paragraphs: [words(250), words(250), words(50)] }]);
    expect(slots).toEqual([{ section: 0, paragraph: 1 }]);
  });

  it("never places a slot after the last paragraph of a section", () => {
    const slots = placeSlots([
      { paragraphs: [words(500)] },
      { paragraphs: [words(500)] },
      { paragraphs: [words(500)] },
    ]);
    expect(slots).toEqual([]);
  });

  it("never places a slot in a one-paragraph section", () => {
    expect(placeSlots([{ paragraphs: [words(900)] }, { paragraphs: [words(900)] }])).toEqual([]);
  });

  it("caps the number of slots", () => {
    const section = { paragraphs: Array.from({ length: 12 }, () => words(450)) };
    expect(placeSlots([section]).length).toBe(MAX_SLOTS);
  });

  it("spaces slots by at least 400 words of running text", () => {
    const section = { paragraphs: Array.from({ length: 12 }, () => words(200)) };
    const slots = placeSlots([section]);
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i].paragraph - slots[i - 1].paragraph).toBeGreaterThanOrEqual(2);
    }
  });

  it("is deterministic and tolerates empty input", () => {
    expect(placeSlots([])).toEqual([]);
    expect(placeSlots([{ paragraphs: [] }])).toEqual([]);
    const input = [{ paragraphs: [words(300), words(300), words(300)] }];
    expect(placeSlots(input)).toEqual(placeSlots(input));
  });
});
