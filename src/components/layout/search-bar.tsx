import { Search } from "lucide-react";
import type { CategoryNode } from "@/server/queries/layout";
import { cn } from "@/lib/utils";

/**
 * Search form (GET /search). Autocomplete is layered on in M2; this works without JS.
 */
export function SearchBar({ categories, className }: { categories: CategoryNode[]; className?: string }) {
  return (
    <form
      role="search"
      action="/search"
      className={cn(
        "flex h-12 w-full overflow-hidden rounded-[10px] border-2 border-primary bg-bg focus-within:ring-2 focus-within:ring-primary/30",
        className,
      )}
    >
      <label htmlFor="search-scope" className="sr-only">
        Search in
      </label>
      <select
        id="search-scope"
        name="c"
        defaultValue=""
        className="hidden max-w-40 cursor-pointer border-r border-border bg-surface px-3 text-sm font-medium text-text outline-none md:block"
      >
        <option value="">All</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <label htmlFor="search-q" className="sr-only">
        Search MarketHub
      </label>
      <input
        id="search-q"
        name="q"
        type="search"
        autoComplete="off"
        placeholder="Search products, suppliers and categories"
        className="min-w-0 flex-1 bg-transparent px-4 text-[15px] text-text outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        aria-label="Search"
        className="flex w-14 shrink-0 items-center justify-center bg-primary text-primary-fg hover:bg-primary-hover"
      >
        <Search className="size-5" aria-hidden />
      </button>
    </form>
  );
}
