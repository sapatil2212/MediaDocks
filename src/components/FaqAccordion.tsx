import { ChevronDown } from "lucide-react";

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * Shared FAQ list, built on native <details>/<summary>.
 *
 * This used to wrap Radix's Accordion, which unmounts the panel of every
 * collapsed item. The visible markup therefore contained all of the questions
 * and none of the answers — on /faq that was roughly 4,000 words of the page
 * reachable only through the RSC payload, and the same was true of the home
 * page and all five platform pages. A crawler fetching the HTML saw a long list
 * of questions with nothing under them, which is a textbook thin-content shape.
 *
 * <details> keeps every answer in the DOM whether it is open or shut, needs no
 * JavaScript to work, and gets correct expand/collapse semantics from the
 * browser instead of hand-rolled ARIA. It also moves this off the client
 * bundle entirely.
 */
export function FaqAccordion({ items }: { items: ReadonlyArray<FaqItem> }) {
  return (
    <div className="w-full border-b border-border">
      {items.map((item) => (
        <details key={item.q} className="group border-t border-border">
          <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-semibold transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</div>
        </details>
      ))}
    </div>
  );
}
