import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getGuidesForTool } from "@/lib/guides-data";

/**
 * "Related guides" block for a tool page. The links are derived from each
 * guide's relatedTool, so there is no second list to keep in sync. Renders
 * nothing when no guide leads to the tool.
 */
export function ToolGuides({ toolPath }: { toolPath: string }) {
  const guides = getGuidesForTool(toolPath);
  if (guides.length === 0) return null;

  return (
    <section aria-labelledby="tool-guides-heading" className="border-t border-border py-12">
      <div className="section-shell max-w-4xl">
        <h2
          id="tool-guides-heading"
          className="flex items-center gap-2 text-lg font-bold text-foreground sm:text-xl"
        >
          <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>Guides that go with this tool</span>
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {guides.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/guides/${guide.slug}`}
                className="group block h-full rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/40 hover:shadow-soft"
              >
                <span className="text-[0.7rem] font-mono font-semibold uppercase text-primary">
                  {guide.category}
                </span>
                <span className="mt-2 block text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                  {guide.title}
                </span>
                <span className="mt-2 block text-xs text-muted-foreground line-clamp-2">
                  {guide.summary}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
