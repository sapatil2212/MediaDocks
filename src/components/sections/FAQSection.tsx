import { FaqAccordion } from "@/components/FaqAccordion";
import { Reveal } from "@/components/Reveal";

/**
 * Home-page FAQ. Also feeds FAQPage structured data from app/page.tsx, so every
 * answer has to stay true against the code and match what is visible here.
 */
export const FAQ_ITEMS = [
  {
    q: "What can I do with MediaDocks?",
    a: "Transcribe speech from audio and video files into editable text, generate timed SRT or WebVTT subtitles, summarize a long recording into key points, extract audio from a video file, and use image, PDF, SVG, Base64 and QR code tools.",
  },
  {
    q: "Do I need an account, an app or an extension?",
    a: "No. There is no sign-up, no email and nothing to install. Open a tool in your browser and use it.",
  },
  {
    q: "Are my files stored?",
    a: "MediaDocks does not keep a media library. Files that have to be processed on the server are handled in a temporary location scoped to the request. The image, PDF, SVG, Base64 and QR tools and the Background Remover run in your browser.",
  },
  {
    q: "How accurate is the transcription?",
    a: "It is best on clear speech with one speaker and drops with background noise, overlapping voices and unfamiliar names. Treat a transcript as a first draft and proofread it in the editor before using it.",
  },
  {
    q: "Which subtitle formats can I export?",
    a: "SRT and WebVTT. SRT is accepted by most editors and platforms. WebVTT is the format used by the HTML5 track element.",
  },
  {
    q: "Is there a size limit for transcription?",
    a: "By default uploads for AI transcription can be up to 100 MB and two hours long. Each tool page lists the limits that apply to it.",
  },
  {
    q: "Who is responsible for the files I use?",
    a: "You are. Only upload or save material you have the right to use. The terms of service and the copyright page explain how rights holders can contact us.",
  },
];

export function FAQSection({ heading = "Questions, answered" }: { heading?: string }) {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-border py-20">
      <div className="section-shell grid gap-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <Reveal>
          <p className="eyebrow">FAQ</p>
          <h2 className="section-title mt-3">{heading}</h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Scope, accuracy, privacy and limits.
          </p>
        </Reveal>
        <Reveal delay={100}>
          <FaqAccordion items={FAQ_ITEMS} />
        </Reveal>
      </div>
    </section>
  );
}
