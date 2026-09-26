import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toQueryString, type SearchParams } from "@/lib/search-params";
import { cn } from "@/lib/utils";

function pages(current: number, count: number): (number | "…")[] {
  const set = new Set([1, count, current - 1, current, current + 1].filter((p) => p >= 1 && p <= count));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export function Pagination({
  params,
  pageCount,
  basePath,
}: {
  params: SearchParams;
  pageCount: number;
  basePath: string;
}) {
  if (pageCount <= 1) return null;
  const keep = basePath === "/search";
  const to = (page: number) => `${basePath}${toQueryString(params, { page }, { keepCategory: keep })}`;
  const cur = params.page;
  const btn =
    "inline-flex size-10 items-center justify-center rounded-md border border-border text-sm font-semibold no-underline hover:bg-surface hover:no-underline";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
      {cur > 1 ? (
        <Link href={to(cur - 1) as never} className={cn(btn, "text-text")} aria-label="Previous page">
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : null}
      {pages(cur, pageCount).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-muted" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={to(p) as never}
            aria-current={p === cur ? "page" : undefined}
            className={cn(btn, p === cur ? "border-primary bg-primary text-primary-fg hover:bg-primary" : "text-text")}
          >
            {p}
          </Link>
        ),
      )}
      {cur < pageCount ? (
        <Link href={to(cur + 1) as never} className={cn(btn, "text-text")} aria-label="Next page">
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : null}
    </nav>
  );
}
