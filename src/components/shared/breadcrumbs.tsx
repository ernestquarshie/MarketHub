import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  name: string;
  href?: string;
}

/** Visible breadcrumb trail plus BreadcrumbList JSON-LD for search engines. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.href ? { item: new URL(c.href, base).toString() } : {}),
    })),
  };
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-muted">
        {items.map((c, i) => (
          <li key={`${c.name}-${i}`} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="size-3.5" aria-hidden /> : null}
            {c.href && i < items.length - 1 ? (
              <Link href={c.href as never}>{c.name}</Link>
            ) : (
              <span aria-current={i === items.length - 1 ? "page" : undefined} className="text-text">
                {c.name}
              </span>
            )}
          </li>
        ))}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </nav>
  );
}
