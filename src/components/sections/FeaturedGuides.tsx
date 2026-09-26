import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Tag } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { GUIDE_ARTICLES } from "@/lib/guides-data";

export function FeaturedGuides() {
  const featured = GUIDE_ARTICLES.slice(0, 3);

  return (
    <section id="guides" className="scroll-mt-24 border-t border-border py-20 lg:py-24">
      <div className="section-shell">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Knowledge Center</p>
            <h2 className="section-title mt-2">Media engineering guides</h2>
            <p className="mt-3 text-muted-foreground">
              Educational documentation on codecs, container formats, audio bitrates, and web video
              performance written by our engineering team.
            </p>
          </Reveal>
          <Reveal delay={60}>
            <Link
              href="/guides"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-4"
            >
              <span>View all 10 guides</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((article, idx) => (
            <Reveal key={article.slug} delay={idx * 60}>
              <article className="panel group flex h-full flex-col justify-between p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 font-medium text-foreground">
                      <Tag className="h-3 w-3 text-primary" />
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[0.7rem]">
                      <Clock className="h-3 w-3" />
                      {article.readTime}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-foreground transition-colors group-hover:text-primary">
                    <Link href={`/guides/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {article.summary}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
                  <span className="text-[0.7rem] text-muted-foreground">
                    By {article.author}
                  </span>
                  <Link
                    href={`/guides/${article.slug}`}
                    className="inline-flex items-center gap-1 font-semibold text-primary transition-transform group-hover:translate-x-1"
                  >
                    <span>Read guide</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
