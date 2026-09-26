import {
  BookOpen,
  Film,
  GraduationCap,
  Megaphone,
  Newspaper,
  Video,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";

const USE_CASES = [
  {
    title: "Content Creators & YouTubers",
    icon: Video,
    desc: "Archive published clips for highlight reels, extract royalty-free public music tracks, and generate synchronized subtitles for YouTube Shorts and Instagram Reels to capture viewers watching on mute.",
    relevantTools: "Downloader · Subtitle Studio · YouTube to MP3",
  },
  {
    title: "Students & Educators",
    icon: GraduationCap,
    desc: "Convert recorded webinars, university lectures, and tutorials into readable plain-text transcripts. Generate concise bullet-point summaries and Q&A pairs for rapid exam revision.",
    relevantTools: "Video to Text · Audio Summarizer · Audio to Text",
  },
  {
    title: "Social Media Managers",
    icon: Megaphone,
    desc: "Collect high-resolution campaign assets from X, Pinterest, Facebook, and Instagram. Extract audio tracks to analyze trending audio and export clean WebVTT caption files.",
    relevantTools: "Instagram Downloader · Pinterest Downloader · Subtitle Studio",
  },
  {
    title: "Journalists & Researchers",
    icon: Newspaper,
    desc: "Archive public press briefings, interviews, and investigative footage. Produce verbatim written transcripts with automatic language detection to quote sources accurately.",
    relevantTools: "Audio to Text · Video to Text · X Downloader",
  },
  {
    title: "Video & Audio Editors",
    icon: Film,
    desc: "Extract pristine audio streams (original M4A) without double-transcode generation loss. Download full resolution ladders (1080p/4K) with synchronized audio tracks for offline assembly.",
    relevantTools: "Precision Downloader · YouTube to MP3 · Capabilities Studio",
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="scroll-mt-24 border-t border-border py-20 lg:py-24">
      <div className="section-shell">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Real-World Workflows</p>
          <h2 className="section-title mt-2">Who uses MediaDocks?</h2>
          <p className="mt-3 text-muted-foreground">
            Authentic, practical workflows enabled by our stream multiplexing and AI transcription
            tools.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((uc, idx) => {
            const Icon = uc.icon;
            return (
              <Reveal key={uc.title} delay={idx * 50}>
                <div className="panel flex h-full flex-col justify-between p-6">
                  <div>
                    <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-primary shadow-soft">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-foreground">
                      {uc.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {uc.desc}
                    </p>
                  </div>
                  <div className="mt-6 border-t border-border pt-4">
                    <span className="block text-[0.7rem] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                      Tools used:
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-primary">
                      {uc.relevantTools}
                    </span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
