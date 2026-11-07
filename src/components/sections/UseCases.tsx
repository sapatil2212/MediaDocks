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
    title: "Content creators",
    icon: Video,
    desc: "Add subtitles to your own clips so they read well for viewers watching on mute, and pull the audio track out of a recording you made.",
    relevantTools: "Subtitle Studio · Video to Audio",
  },
  {
    title: "Students & educators",
    icon: GraduationCap,
    desc: "Turn a recorded lecture or webinar into a readable transcript, then condense it into key points for revision.",
    relevantTools: "Video to Text · Audio Summarizer · Audio to Text",
  },
  {
    title: "Social media managers",
    icon: Megaphone,
    desc: "Prepare images for each channel: resize, convert formats, cut out a background, and export clean caption files for video posts.",
    relevantTools: "Image Resizer · Background Remover · Subtitle Studio",
  },
  {
    title: "Journalists & researchers",
    icon: Newspaper,
    desc: "Transcribe your own interview recordings so you can search them and quote the speaker accurately.",
    relevantTools: "Audio to Text · Video to Text",
  },
  {
    title: "Editors & designers",
    icon: Film,
    desc: "Convert images and PDFs, build QR codes, and extract audio from long video files you already have.",
    relevantTools: "Video to Audio · Image Converter · PDF to Image",
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
            Practical examples of the jobs these tools are built for.
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
