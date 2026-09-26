import Link from "next/link";
import { ArrowLeft, BookOpen, FileQuestion, Home, Search, Sparkles } from "lucide-react";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[75vh] items-center justify-center overflow-hidden py-20">
      <InteractiveBackground />
      <div
        className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[34rem] opacity-40"
        aria-hidden="true"
      />

      <div className="section-shell relative z-10 max-w-xl text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-border/80 bg-surface/80 text-primary shadow-soft backdrop-blur-md">
          <FileQuestion className="h-8 w-8" />
        </div>

        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-primary font-bold">
          404 — Page Not Found
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          The requested page does not exist
        </h1>

        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          The address you navigated to may have moved, been renamed, or does not exist. Explore our
          available tools and educational guides below.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="rounded-xl shadow-glow">
            <Link href="/" className="inline-flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span>Return to Homepage</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/guides" className="inline-flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Browse Guides</span>
            </Link>
          </Button>
        </div>

        <div className="mt-12 rounded-2xl border border-border/70 bg-surface/50 p-5 text-left text-xs">
          <p className="font-semibold text-foreground">Popular Utilities:</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              • Universal Video Downloader
            </Link>
            <Link href="/youtube-to-mp3" className="hover:text-primary transition-colors">
              • YouTube to MP3 Converter
            </Link>
            <Link href="/video-to-text" className="hover:text-primary transition-colors">
              • AI Video to Text
            </Link>
            <Link href="/add-subtitles-to-video" className="hover:text-primary transition-colors">
              • Subtitle Studio
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
