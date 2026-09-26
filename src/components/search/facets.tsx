import Link from "next/link";
import { Check, Star } from "lucide-react";
import type { SearchResult } from "@/server/services/search";
import { toQueryString, type SearchParams } from "@/lib/search-params";
import { convert, CURRENCY_META, type Currency, type Rates } from "@/lib/money";
import { cn } from "@/lib/utils";

interface FacetProps {
  params: SearchParams;
  result: SearchResult;
  basePath: string;
  currency: Currency;
  rates: Rates;
  showCategories: boolean;
}

function href(basePath: string, params: SearchParams, patch: Partial<SearchParams>, keepCategory: boolean) {
  return `${basePath}${toQueryString(params, patch, { keepCategory })}`;
}

function Option({
  to,
  selected,
  label,
  count,
  radio = false,
}: {
  to: string;
  selected: boolean;
  label: React.ReactNode;
  count?: number;
  radio?: boolean;
}) {
  return (
    <li>
      <Link
        href={to as never}
        scroll={false}
        rel="nofollow"
        aria-current={selected ? "true" : undefined}
        className="group flex min-h-9 items-center gap-2.5 rounded-sm px-1 text-sm text-text no-underline hover:bg-surface hover:no-underline"
      >
        <span
          aria-hidden
          className={cn(
            "flex size-[18px] shrink-0 items-center justify-center border",
            radio ? "rounded-full" : "rounded-[4px]",
            selected ? "border-primary bg-primary text-primary-fg" : "border-border-strong bg-bg",
          )}
        >
          {selected ? <Check className="size-3" strokeWidth={3} /> : null}
        </span>
        <span className="flex-1">
          {label}
          {selected ? <span className="sr-only"> (selected)</span> : null}
        </span>
        {count !== undefined ? <span className="text-xs text-muted tabular">{count}</span> : null}
      </Link>
    </li>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-b border-border py-4 first:pt-0 last:border-b-0">
      <h3 className="font-sans text-sm font-bold">{title}</h3>
      {children}
    </section>
  );
}

export function Facets({ params, result, basePath, currency, rates, showCategories }: FacetProps) {
  const keep = basePath === "/search";
  const f = result.facets;
  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const range = f.priceRangeUsdMinor
    ? {
        min: Math.floor(convert(f.priceRangeUsdMinor.min, "USD", currency, rates) / 100),
        max: Math.ceil(convert(f.priceRangeUsdMinor.max, "USD", currency, rates) / 100),
      }
    : null;

  return (
    <div className="flex flex-col">
      {showCategories && f.categories.length ? (
        <Group title="Category">
          <ul className="flex flex-col">
            {f.categories.map((c) => (
              <Option
                key={c.value}
                to={href("/search", params, { category: params.category === c.value ? undefined : c.value }, true)}
                selected={params.category === c.value}
                label={c.label}
                count={c.count}
                radio
              />
            ))}
          </ul>
        </Group>
      ) : null}

      <Group title={`Price (${CURRENCY_META[currency].symbol})`}>
        <form action={basePath} method="get" className="flex flex-col gap-2">
          {/* Preserve the other filters when applying a price range. */}
          {Object.entries(
            Object.fromEntries(
              new URLSearchParams(
                toQueryString(params, { minPrice: undefined, maxPrice: undefined }, { keepCategory: keep }).slice(1),
              ),
            ),
          ).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="price-min">
              Minimum price
            </label>
            <input
              id="price-min"
              name="min"
              type="number"
              inputMode="decimal"
              min={0}
              defaultValue={params.minPrice}
              placeholder={range ? `Min ${range.min}` : "Min"}
              className="h-10 w-full min-w-0 rounded-md border border-border-strong bg-bg px-2.5 text-sm"
            />
            <span aria-hidden className="text-muted">
              –
            </span>
            <label className="sr-only" htmlFor="price-max">
              Maximum price
            </label>
            <input
              id="price-max"
              name="max"
              type="number"
              inputMode="decimal"
              min={0}
              defaultValue={params.maxPrice}
              placeholder={range ? `Max ${range.max}` : "Max"}
              className="h-10 w-full min-w-0 rounded-md border border-border-strong bg-bg px-2.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="h-9 rounded-md border border-border-strong text-sm font-semibold hover:bg-surface"
          >
            Apply
          </button>
        </form>
      </Group>

      <Group title="Customer rating">
        <ul className="flex flex-col">
          {f.ratings.map((r) => {
            const n = Number(r.value);
            return (
              <Option
                key={r.value}
                to={href(basePath, params, { minRating: params.minRating === n ? undefined : n }, keep)}
                selected={params.minRating === n}
                radio
                count={r.count}
                label={
                  <span className="flex items-center gap-1">
                    <span className="flex" aria-hidden>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={cn("size-3.5", i <= n ? "fill-star text-star" : "fill-border text-border")}
                        />
                      ))}
                    </span>
                    <span>& up</span>
                    <span className="sr-only">{n} stars and up</span>
                  </span>
                }
              />
            );
          })}
        </ul>
      </Group>

      <Group title="Buying options">
        <ul className="flex flex-col">
          <Option
            to={href(basePath, params, { readyToShip: !params.readyToShip }, keep)}
            selected={params.readyToShip}
            label="Ready to ship"
            count={f.readyToShip}
          />
          <Option
            to={href(basePath, params, { verifiedOnly: !params.verifiedOnly }, keep)}
            selected={params.verifiedOnly}
            label="Verified suppliers"
            count={f.verified}
          />
          <Option
            to={href(basePath, params, { inStock: !params.inStock }, keep)}
            selected={params.inStock}
            label="In stock"
            count={f.inStock}
          />
        </ul>
      </Group>

      <Group title="Minimum order (MOQ)">
        <ul className="flex flex-col">
          {[1, 10, 50, 100].map((m) => (
            <Option
              key={m}
              to={href(basePath, params, { moqMax: params.moqMax === m ? undefined : m }, keep)}
              selected={params.moqMax === m}
              radio
              label={m === 1 ? "No minimum (1 unit)" : `${m} units or fewer`}
            />
          ))}
        </ul>
      </Group>

      {f.brands.length ? (
        <Group title="Brand">
          <ul className="flex flex-col">
            {f.brands.map((b) => (
              <Option
                key={b.value}
                to={href(basePath, params, { brands: toggle(params.brands, b.value) }, keep)}
                selected={params.brands.includes(b.value)}
                label={b.label}
                count={b.count}
              />
            ))}
          </ul>
        </Group>
      ) : null}

      {f.countries.length ? (
        <Group title="Supplier location">
          <ul className="flex flex-col">
            {f.countries.map((c) => (
              <Option
                key={c.value}
                to={href(basePath, params, { countries: toggle(params.countries, c.value) }, keep)}
                selected={params.countries.includes(c.value)}
                label={c.label}
                count={c.count}
              />
            ))}
          </ul>
        </Group>
      ) : null}
    </div>
  );
}

/** Removable chips for active filters. */
export function ActiveFilters({
  params,
  basePath,
  currency,
}: {
  params: SearchParams;
  basePath: string;
  currency: Currency;
}) {
  const keep = basePath === "/search";
  const chips: { label: string; to: string }[] = [];
  const sym = CURRENCY_META[currency].symbol;
  if (params.minPrice !== undefined || params.maxPrice !== undefined)
    chips.push({
      label: `${sym} ${params.minPrice ?? 0} – ${params.maxPrice ?? "any"}`,
      to: href(basePath, params, { minPrice: undefined, maxPrice: undefined }, keep),
    });
  if (params.minRating)
    chips.push({ label: `${params.minRating}★ & up`, to: href(basePath, params, { minRating: undefined }, keep) });
  if (params.readyToShip)
    chips.push({ label: "Ready to ship", to: href(basePath, params, { readyToShip: false }, keep) });
  if (params.verifiedOnly)
    chips.push({ label: "Verified suppliers", to: href(basePath, params, { verifiedOnly: false }, keep) });
  if (params.inStock) chips.push({ label: "In stock", to: href(basePath, params, { inStock: false }, keep) });
  if (params.moqMax)
    chips.push({ label: `MOQ ≤ ${params.moqMax}`, to: href(basePath, params, { moqMax: undefined }, keep) });
  for (const b of params.brands)
    chips.push({ label: b, to: href(basePath, params, { brands: params.brands.filter((x) => x !== b) }, keep) });
  for (const c of params.countries)
    chips.push({ label: c, to: href(basePath, params, { countries: params.countries.filter((x) => x !== c) }, keep) });
  if (!chips.length) return null;
  const clearAll = `${basePath}${toQueryString(
    {
      ...params,
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      readyToShip: false,
      verifiedOnly: false,
      inStock: false,
      moqMax: undefined,
      brands: [],
      countries: [],
    },
    {},
    { keepCategory: keep },
  )}`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted">Active filters:</span>
      {chips.map((c) => (
        <Link
          key={c.label}
          href={c.to as never}
          scroll={false}
          rel="nofollow"
          className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border-strong bg-bg px-3 text-sm text-text no-underline hover:bg-surface hover:no-underline"
        >
          {c.label}
          <span aria-hidden>×</span>
          <span className="sr-only">— remove filter</span>
        </Link>
      ))}
      <Link href={clearAll as never} scroll={false} className="text-sm font-semibold">
        Clear all
      </Link>
    </div>
  );
}
