import Link from "next/link";
import { SearchX } from "lucide-react";
import type { SearchResult } from "@/server/services/search";
import type { SellerCardData } from "@/server/queries/catalog";
import { activeFilterCount, toQueryString, type SearchParams } from "@/lib/search-params";
import type { Currency, Rates } from "@/lib/money";
import type { PricingView } from "@/server/prefs";
import { ProductCard } from "@/components/store/product-card";
import { SellerCard } from "@/components/store/seller-card";
import { ActiveFilters, Facets } from "./facets";
import { FilterSheet } from "./filter-sheet";
import { Pagination } from "./pagination";
import { SortSelect } from "./sort-select";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  breadcrumb?: React.ReactNode;
  params: SearchParams;
  basePath: string;
  result: SearchResult;
  suppliers?: (SellerCardData & { matchingProducts: number })[] | null;
  currency: Currency;
  rates: Rates;
  view: PricingView;
  subcategories?: { slug: string; name: string }[];
}

export function ResultsView({
  title,
  breadcrumb,
  params,
  basePath,
  result,
  suppliers,
  currency,
  rates,
  view,
  subcategories,
}: Props) {
  const keep = basePath === "/search";
  const facets = (
    <Facets
      params={params}
      result={result}
      basePath={basePath}
      currency={currency}
      rates={rates}
      showCategories={basePath === "/search"}
    />
  );
  const tab = (type: "products" | "suppliers") =>
    `${basePath}${toQueryString(params, { type }, { keepCategory: keep })}`;
  const showingSuppliers = params.type === "suppliers" && suppliers;
  const count = showingSuppliers ? suppliers.length : result.total;

  return (
    <div className="container-page flex flex-col gap-5 py-6">
      {breadcrumb}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        <p className="text-sm text-muted" aria-live="polite">
          {count.toLocaleString("en-US")}{" "}
          {showingSuppliers ? (count === 1 ? "supplier" : "suppliers") : count === 1 ? "result" : "results"}
          {params.q ? (
            <>
              {" "}
              for <strong className="text-text">&ldquo;{params.q}&rdquo;</strong>
            </>
          ) : null}
        </p>
      </div>

      {subcategories?.length ? (
        <nav aria-label="Subcategories" className="flex flex-wrap gap-2">
          {subcategories.map((c) => (
            <Link
              key={c.slug}
              href={`/c/${c.slug}` as never}
              className="rounded-full border border-border bg-bg px-3.5 py-1.5 text-sm font-medium text-text no-underline hover:border-primary hover:no-underline"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div role="tablist" aria-label="Result type" className="flex rounded-md border border-border bg-surface p-0.5">
          {(["products", "suppliers"] as const).map((t) => (
            <Link
              key={t}
              role="tab"
              aria-selected={params.type === t}
              href={tab(t) as never}
              className={cn(
                "inline-flex min-h-9 items-center rounded-[8px] px-4 text-sm font-semibold capitalize no-underline hover:no-underline",
                params.type === t ? "bg-bg text-text shadow-sm" : "text-muted hover:text-text",
              )}
            >
              {t}
            </Link>
          ))}
        </div>
        {!showingSuppliers ? (
          <div className="flex items-center gap-2">
            <FilterSheet count={activeFilterCount(params)}>{facets}</FilterSheet>
            <SortSelect value={params.sort} hasQuery={!!params.q} />
          </div>
        ) : null}
      </div>

      {showingSuppliers ? (
        suppliers.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {suppliers.map((s) => (
              <li key={s.id}>
                <SellerCard
                  seller={s}
                  extra={
                    <p className="text-sm text-muted">
                      {s.matchingProducts} matching {s.matchingProducts === 1 ? "product" : "products"}
                    </p>
                  }
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState q={params.q} />
        )
      ) : (
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside aria-label="Filters" className="hidden lg:block">
            {facets}
          </aside>
          <div className="flex flex-col gap-5">
            <ActiveFilters params={params} basePath={basePath} currency={currency} />
            {result.items.length ? (
              <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {result.items.map((p, i) => (
                  <li key={p.id}>
                    <ProductCard product={p} currency={currency} rates={rates} view={view} priority={i < 4} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState q={params.q} didYouMean={result.didYouMean} basePath={basePath} />
            )}
            <Pagination params={params} pageCount={result.pageCount} basePath={basePath} />
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ q, didYouMean, basePath }: { q?: string; didYouMean?: string | null; basePath?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong px-6 py-14 text-center">
      <SearchX className="size-10 text-muted" aria-hidden />
      <h2 className="text-lg font-bold">No matches{q ? ` for “${q}”` : ""}</h2>
      {didYouMean ? (
        <p>
          Did you mean{" "}
          <Link
            href={`${basePath ?? "/search"}?q=${encodeURIComponent(didYouMean)}` as never}
            className="font-semibold"
          >
            {didYouMean}
          </Link>
          ?
        </p>
      ) : null}
      <p className="max-w-md text-sm text-muted">
        Try fewer filters or a more general word. Buying in bulk? Suppliers can quote on custom requests.
      </p>
      <Link href="/rfq/new" className="font-semibold">
        Post a request for quote
      </Link>
    </div>
  );
}
