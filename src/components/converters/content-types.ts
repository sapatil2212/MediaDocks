import type { FeatureItem } from "@/components/converters/ConverterSections";
import type {
  FormatRow,
  RelatedGuide,
  RelatedTool,
} from "@/components/converters/ContentSections";
import type { FaqItem } from "@/components/FaqAccordion";

/**
 * Shape every `app/<route>/content.ts` module exports. Authored in the
 * helper-compatible shapes so the JSON-LD helpers (`howToJsonLd({ steps })`,
 * `softwareAppJsonLd({ featureList })`) consume them with no field remapping.
 */
export interface ConverterContent {
  /** Short feature cards for ConverterSections. */
  features: FeatureItem[];
  /** Feature list for softwareAppJsonLd — plain strings. */
  featureList: string[];
  /** Steps for the on-page "how to" AND howToJsonLd({ steps }). */
  howTo: Array<{ title: string; body: string }>;
  /** Compact step cards for ConverterSections (numbered). */
  howItWorks: Array<{ step: number; title: string; description: string }>;
  /** "What it does" + deeper prose paragraphs. */
  intro: string[];
  /** Supported formats & limits rows. */
  formats: FormatRow[];
  /** Common use cases. */
  useCases: string[];
  /** Section titles authored per page so they are not shared chrome. */
  howToTitle: string;
  formatsTitle: string;
  useCasesTitle: string;
  privacyTitle: string;
  /** Honest, per-page privacy note. */
  privacyNote: string;
  /** Tool-specific FAQ. */
  faqs: FaqItem[];
  /** Converter → guide links. */
  relatedGuides: RelatedGuide[];
  /** Converter → sibling tool links. */
  relatedTools: RelatedTool[];
  /** ConverterSections copy — required, per page, no shared defaults. */
  featuresHeading: string;
  featuresSubline: string;
  privacyBannerTitle: string;
  privacyBannerBody: string;
}
