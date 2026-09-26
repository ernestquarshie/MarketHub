/**
 * Parse and serialise search/category URL parameters. Pure (shared by server and client),
 * so filters live in the URL and every result page is shareable and bookmarkable.
 */
import { z } from "zod";

export const SORTS = ["relevance", "price_asc", "price_desc", "rating", "newest", "bestselling"] as const;
export type Sort = (typeof SORTS)[number];

export const SORT_LABELS: Record<Sort, string> = {
  relevance: "Relevance",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  rating: "Avg. customer rating",
  newest: "Newest arrivals",
  bestselling: "Best selling",
};

export const PAGE_SIZE = 24;

const csv = z
  .string()
  .transform((s) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 20),
  )
  .optional();

const positiveNumber = z.coerce.number().finite().positive().max(1e9).optional().catch(undefined);
const flag = z
  .string()
  .optional()
  .transform((v) => v === "1" || v === "true")
  .catch(false);

const schema = z.object({
  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => v || undefined)
    .catch(undefined),
  c: z
    .string()
    .regex(/^[a-z0-9-]{1,80}$/)
    .optional()
    .catch(undefined),
  min: positiveNumber,
  max: positiveNumber,
  rating: z.coerce.number().int().min(1).max(5).optional().catch(undefined),
  brand: csv.catch(undefined),
  country: csv.catch(undefined),
  readyToShip: flag,
  verified: flag,
  inStock: flag,
  moqMax: z.coerce.number().int().positive().max(1e6).optional().catch(undefined),
  sort: z.enum(SORTS).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
  type: z.enum(["products", "suppliers"]).optional().catch(undefined),
});

export type SearchParams = {
  q?: string;
  category?: string;
  minPrice?: number; // major units, in the shopper's display currency
  maxPrice?: number;
  minRating?: number;
  brands: string[];
  countries: string[];
  readyToShip: boolean;
  verifiedOnly: boolean;
  inStock: boolean;
  moqMax?: number;
  sort: Sort;
  page: number;
  type: "products" | "suppliers";
};

type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export function parseSearchParams(raw: RawParams, forcedCategory?: string): SearchParams {
  const flat: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(raw)) flat[k] = first(v);
  const p = schema.parse(flat);
  let min = p.min;
  let max = p.max;
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];
  return {
    q: p.q,
    category: forcedCategory ?? p.c,
    minPrice: min,
    maxPrice: max,
    minRating: p.rating,
    brands: p.brand ?? [],
    countries: (p.country ?? []).map((c) => c.toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c)),
    readyToShip: p.readyToShip,
    verifiedOnly: p.verified,
    inStock: p.inStock,
    moqMax: p.moqMax,
    sort: p.sort ?? (p.q ? "relevance" : "bestselling"),
    page: p.page ?? 1,
    type: p.type ?? "products",
  };
}

/** Serialise back to a query string, omitting defaults. `patch` overrides fields; page resets unless given. */
export function toQueryString(
  params: SearchParams,
  patch: Partial<SearchParams> = {},
  opts: { keepCategory?: boolean } = {},
) {
  const next = { ...params, page: 1, ...patch };
  const qs = new URLSearchParams();
  if (next.q) qs.set("q", next.q);
  if (opts.keepCategory && next.category) qs.set("c", next.category);
  if (next.minPrice !== undefined) qs.set("min", String(next.minPrice));
  if (next.maxPrice !== undefined) qs.set("max", String(next.maxPrice));
  if (next.minRating) qs.set("rating", String(next.minRating));
  if (next.brands.length) qs.set("brand", next.brands.join(","));
  if (next.countries.length) qs.set("country", next.countries.join(","));
  if (next.readyToShip) qs.set("readyToShip", "1");
  if (next.verifiedOnly) qs.set("verified", "1");
  if (next.inStock) qs.set("inStock", "1");
  if (next.moqMax) qs.set("moqMax", String(next.moqMax));
  const defaultSort: Sort = next.q ? "relevance" : "bestselling";
  if (next.sort !== defaultSort) qs.set("sort", next.sort);
  if (next.page > 1) qs.set("page", String(next.page));
  if (next.type === "suppliers") qs.set("type", "suppliers");
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/** Number of active (removable) filters, for the mobile "Filters (n)" button. */
export function activeFilterCount(p: SearchParams): number {
  return (
    (p.minPrice !== undefined || p.maxPrice !== undefined ? 1 : 0) +
    (p.minRating ? 1 : 0) +
    p.brands.length +
    p.countries.length +
    (p.readyToShip ? 1 : 0) +
    (p.verifiedOnly ? 1 : 0) +
    (p.inStock ? 1 : 0) +
    (p.moqMax ? 1 : 0)
  );
}
