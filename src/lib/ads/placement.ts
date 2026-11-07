/**
 * Where in-article ad slots may go. Pure and independent of render order.
 *
 * A slot is only ever placed between two paragraphs of the same section, so it
 * is never next to a heading, table, list, callout, CTA card or FAQ. The 400
 * word spacing and the cap of 3 are engineering choices to keep ads sparse,
 * not Google requirements.
 */
export const MIN_WORDS_BETWEEN_SLOTS = 400;
export const MAX_SLOTS = 3;

export interface SlotPosition {
  /** Index of the section. */
  section: number;
  /** Render the slot immediately after this paragraph index. */
  paragraph: number;
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

export function placeSlots(sections: ReadonlyArray<{ paragraphs: readonly string[] }>): SlotPosition[] {
  const slots: SlotPosition[] = [];
  let words = 0;

  sections.forEach((section, s) => {
    const isLastSection = s === sections.length - 1;
    section.paragraphs.forEach((paragraph, p) => {
      words += wordCount(paragraph);
      const isLastParagraph = p === section.paragraphs.length - 1;
      if (isLastParagraph) return;
      if (isLastSection && isLastParagraph) return;
      if (slots.length >= MAX_SLOTS) return;
      if (words < MIN_WORDS_BETWEEN_SLOTS) return;
      slots.push({ section: s, paragraph: p });
      words = 0;
    });
  });

  return slots;
}
