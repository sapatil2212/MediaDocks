import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy",
  description:
    "How MediaDocks handles the links you paste: browser-only history, no accounts, no tracking and no permanent storage of media.",
  path: "/privacy",
  keywords: ["private video downloader", "no tracking downloader", "downloader privacy policy"],
});

const sections = [
  {
    h: "What we handle",
    p: "MediaDocks processes public links to detect the platform and resolve available public media formats.",
  },
  {
    h: "Recent list",
    p: "Your recent links live in your browser's local storage only. Removing an item or clearing the list deletes it immediately, and clearing site data removes everything.",
  },
  {
    h: "Analytics",
    p: "No advertising or cross-site tracking is used. If basic usage measurement is enabled, it is strictly anonymous and aggregate.",
  },
  {
    h: "Third-party platforms",
    p: "MediaDocks does not act on your behalf inside Instagram, YouTube, Pinterest, Facebook or X, and does not store credentials or session tokens.",
  },
  {
    h: "Contact",
    p: "Questions about this page can be sent to the address published on the project repository.",
  },
];

export default function PrivacyPage() {
  return (
    <section className="py-16">
      <div className="section-shell max-w-2xl">
        <Reveal>
          <h1 className="text-4xl font-semibold sm:text-5xl">Privacy</h1>
          <p className="mt-4 text-sm text-muted-foreground">Last updated: January 2026</p>
        </Reveal>
        <div className="mt-10 space-y-8">
          {sections.map((s, i) => (
            <Reveal key={s.h} delay={i * 60}>
              <h2 className="text-xl font-semibold">{s.h}</h2>
              <p className="mt-2 text-muted-foreground">{s.p}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
