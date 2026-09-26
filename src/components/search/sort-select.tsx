"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SORT_LABELS, SORTS, type Sort } from "@/lib/search-params";

export function SortSelect({ value, hasQuery }: { value: Sort; hasQuery: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const options = SORTS.filter((s) => s !== "relevance" || hasQuery);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-muted">
        Sort by
      </label>
      <select
        id="sort"
        value={value}
        aria-busy={pending}
        onChange={(e) => {
          const next = new URLSearchParams(sp.toString());
          next.set("sort", e.target.value);
          next.delete("page");
          start(() => router.push(`${pathname}?${next.toString()}` as never, { scroll: false }));
        }}
        className="h-10 rounded-md border border-border-strong bg-bg px-2.5 text-sm font-medium"
      >
        {options.map((s) => (
          <option key={s} value={s}>
            {SORT_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
