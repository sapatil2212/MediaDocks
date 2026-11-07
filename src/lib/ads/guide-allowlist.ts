/**
 * Server and test only. Never import this from eligibility.ts or any client
 * component: it pulls in all guide text. It computes which guides qualify for
 * ads; the result must equal ALLOWLISTED_GUIDE_SLUGS (a test fails on drift).
 */
import { GUIDE_ARTICLES, type GuideArticle } from "../guides-data";
import { classifyPath } from "./eligibility";

/** Engineering floor for long-form running text, not a claim about Google. */
export const MIN_GUIDE_WORDS = 800;

function words(text: string): number {
  const t = text.trim();
  return t.length === 0 ? 0 : t.split(/\s+/).length;
}

/** Running text: paragraphs, bullet points and callout bodies. Tables and FAQs excluded. */
export function guideRunningWords(article: GuideArticle): number {
  let total = 0;
  for (const section of article.sections) {
    for (const p of section.paragraphs) total += words(p);
    for (const b of section.bulletPoints ?? []) total += words(b);
    if (section.callout) total += words(section.callout.body);
  }
  return total;
}

export function guideHasFirstPartyTool(article: GuideArticle): boolean {
  const target = article.relatedTool?.path;
  if (!target) return false;
  const { category } = classifyPath(target);
  return category === "converter-tool" || category === "ai-tool";
}

export function computeAllowlist(): string[] {
  return GUIDE_ARTICLES.filter(
    (g) => guideRunningWords(g) >= MIN_GUIDE_WORDS && guideHasFirstPartyTool(g),
  ).map((g) => g.slug);
}
