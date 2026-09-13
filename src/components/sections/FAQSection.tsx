import { FaqAccordion } from "@/components/FaqAccordion";
import { Reveal } from "@/components/Reveal";

/**
 * Home-page FAQ. Also feeds FAQPage structured data from app/page.tsx, so every
 * answer has to stay factually true — the previous "Facebook and YouTube publish
 * no downloadable file" answer described the app before the extraction engine
 * existed and was being published as schema.org markup.
 */
export const FAQ_ITEMS = [
  {
    q: "What can I actually download?",
    a: "Public videos as MP4 at any resolution the source publishes, from 144p up to 4K; audio on its own as MP3 or as the original M4A track; and images as JPEG or PNG. YouTube, Instagram, X, Pinterest and Facebook are supported.",
  },
  {
    q: "Can I choose the video quality?",
    a: "Yes. After a link resolves you get every resolution the source actually offers — a 4K upload lists eight rungs from 2160p down to 144p. The list is built from the source, so a 720p video never shows a fake 1080p option.",
  },
  {
    q: "Can I download just the audio, or convert to MP3?",
    a: "Yes. Every video also offers its original audio track as M4A plus MP3 at 128, 192 or 320 kbps. MP3 rungs stop at the source bitrate, because transcoding upward adds size without adding quality.",
  },
  {
    q: "Do I need an account, an app or an extension?",
    a: "None of them. There is no sign up, no email and nothing to install. Paste a link in your browser and pick a format.",
  },
  {
    q: "Can I download private or age-restricted content?",
    a: "No. MediaDocks reads only what a signed-out visitor can already see. It does not log in, use cookies, or work around private accounts, age gates, CAPTCHA or DRM. Instagram and Facebook hide a lot behind a login, and those links report as unavailable rather than silently failing.",
  },
  {
    q: "Are my links or files stored?",
    a: "No files are kept. A download is assembled in a temporary folder, streamed to your browser and deleted immediately. The resolved link reference itself expires after 30 minutes.",
  },
  {
    q: "Is there a size limit?",
    a: "A single download is capped at 500 MB, which covers about an hour of 1080p. Larger sources still resolve — choose a lower resolution or take the audio only.",
  },
  {
    q: "Why is a big download slow to start?",
    a: "Higher resolutions arrive as separate video and audio streams that are combined before the first byte reaches you. A 10-minute 1080p video takes roughly two minutes; smaller rungs are much quicker.",
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
            Scope, quality, privacy and limits — including what it will not do.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <FaqAccordion items={FAQ_ITEMS} />
        </Reveal>
      </div>
    </section>
  );
}
