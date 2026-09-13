/**
 * Renders schema.org structured data. Server-rendered so crawlers see it in the
 * initial HTML.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // Content is built from static, trusted page data.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
