import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import { toMinor, type Currency, type Rates } from "@/lib/money";
import { PAGE_SIZE, type SearchParams } from "@/lib/search-params";
import { getProductCardsByIds, type ProductCardData, type SellerCardData } from "@/server/queries/catalog";

/**
 * Product search on PostgreSQL: full-text (tsvector, weighted title > brand > description)
 * plus trigram similarity for typos and partial words. Prices are compared in USD minor units
 * so filters work across GHS/NGN/USD listings. Kept behind this module so it can be swapped
 * for a dedicated engine (e.g. Meilisearch) later without touching pages.
 */

export interface FacetValue {
  value: string;
  label: string;
  count: number;
}

export interface SearchResult {
  items: ProductCardData[];
  total: number;
  page: number;
  pageCount: number;
  facets: {
    categories: FacetValue[];
    brands: FacetValue[];
    countries: FacetValue[];
    ratings: FacetValue[];
    readyToShip: number;
    verified: number;
    inStock: number;
    priceRangeUsdMinor: { min: number; max: number } | null;
  };
  didYouMean: string | null;
}

const COUNTRY_NAMES: Record<string, string> = {
  GH: "Ghana",
  NG: "Nigeria",
  CN: "China",
  GB: "United Kingdom",
  US: "United States",
};

/** Effective price in USD minor units: active flash deal price, else retail. */
const priceUsd = sql`(coalesce(fd.deal_price, p.retail_price) / cr.per_usd)`;

function baseFrom() {
  return sql`
    from product p
    join seller s on s.id = p.seller_id and s.status = 'approved'
    join currency_rate cr on cr.code = p.currency
    left join lateral (
      select f.deal_price from flash_deal f
      where f.product_id = p.id and f.starts_at <= now() and f.ends_at > now() and f.claimed < f.stock_cap
      order by f.deal_price asc limit 1
    ) fd on true
    left join lateral (
      select coalesce(sum(v.stock - v.reserved), 0)::int as stock from product_variant v where v.product_id = p.id
    ) st on true`;
}

function textMatch(q: string): SQL {
  return sql`(p.search_vector @@ websearch_to_tsquery('english', ${q})
    or p.title ilike ${"%" + q + "%"}
    or similarity(p.title, ${q}) > 0.2
    or word_similarity(${q}, p.title) > 0.45
    or p.brand ilike ${q + "%"})`;
}

async function categoryIds(slug: string): Promise<string[] | null> {
  const rows = await db.execute<{ id: string }>(sql`
    with recursive tree as (
      select id from category where slug = ${slug}
      union all
      select c.id from category c join tree t on c.parent_id = t.id
    ) select id from tree`);
  return rows.length ? rows.map((r) => r.id) : null;
}

function andAll(parts: SQL[]): SQL {
  return parts.length ? sql.join(parts, sql` and `) : sql`true`;
}

export async function searchProducts(
  params: SearchParams,
  displayCurrency: Currency,
  rates: Rates,
  opts: { sellerId?: string } = {},
): Promise<SearchResult> {
  const core: SQL[] = [sql`p.status = 'published'`];
  if (opts.sellerId) core.push(sql`p.seller_id = ${opts.sellerId}::uuid`);
  if (params.q) core.push(textMatch(params.q));
  if (params.category) {
    const ids = await categoryIds(params.category);
    if (!ids) return emptyResult(params.page);
    core.push(
      sql`p.category_id in (${sql.join(
        ids.map((id) => sql`${id}::uuid`),
        sql`, `,
      )})`,
    );
  }

  // Facet filters (each facet's counts ignore its own filter, so options don't vanish when picked).
  const f: Record<string, SQL | null> = {
    price: null,
    rating: params.minRating ? sql`p.rating_avg >= ${params.minRating}` : null,
    brand: params.brands.length
      ? sql`p.brand in (${sql.join(
          params.brands.map((b) => sql`${b}`),
          sql`, `,
        )})`
      : null,
    country: params.countries.length
      ? sql`s.country in (${sql.join(
          params.countries.map((c) => sql`${c}`),
          sql`, `,
        )})`
      : null,
    readyToShip: params.readyToShip ? sql`p.ready_to_ship` : null,
    verified: params.verifiedOnly ? sql`s.is_verified` : null,
    inStock: params.inStock ? sql`st.stock > 0` : null,
    moq: params.moqMax ? sql`p.moq <= ${params.moqMax}` : null,
  };
  const perUsd = rates[displayCurrency];
  const priceParts: SQL[] = [];
  if (params.minPrice !== undefined) priceParts.push(sql`${priceUsd} >= ${toMinor(params.minPrice) / perUsd}`);
  if (params.maxPrice !== undefined) priceParts.push(sql`${priceUsd} <= ${toMinor(params.maxPrice) / perUsd}`);
  if (priceParts.length) f.price = andAll(priceParts);

  const except = (key: string) =>
    andAll([
      ...core,
      ...Object.entries(f)
        .filter(([k, v]) => k !== key && v)
        .map(([, v]) => v!),
    ]);
  const where = except("__none__");

  const q = params.q ?? "";
  const order: Record<SearchParams["sort"], SQL> = {
    relevance: q
      ? sql`(ts_rank(p.search_vector, websearch_to_tsquery('english', ${q})) * 2 + similarity(p.title, ${q}) + p.sold_count::float / 1e6) desc`
      : sql`p.sold_count desc`,
    price_asc: sql`${priceUsd} asc`,
    price_desc: sql`${priceUsd} desc`,
    rating: sql`p.rating_avg desc, p.rating_count desc`,
    newest: sql`p.created_at desc`,
    bestselling: sql`p.sold_count desc`,
  };

  const offset = (params.page - 1) * PAGE_SIZE;
  const [idRows, totalRows, catRows, brandRows, countryRows, ratingRows, flagRows, priceRows] = await Promise.all([
    db.execute<{ id: string }>(
      sql`select p.id ${baseFrom()} where ${where} order by ${order[params.sort]}, p.id limit ${PAGE_SIZE} offset ${offset}`,
    ),
    db.execute<{ n: number }>(sql`select count(*)::int as n ${baseFrom()} where ${where}`),
    db.execute<{ value: string; label: string; count: number }>(sql`
      select c.slug as value, c.name as label, count(*)::int as count ${baseFrom()}
      join category c on c.id = p.category_id where ${where} group by c.slug, c.name order by count desc, c.name limit 12`),
    db.execute<{ value: string; count: number }>(sql`
      select p.brand as value, count(*)::int as count ${baseFrom()} where ${except("brand")} and p.brand is not null
      group by p.brand order by count desc, p.brand limit 12`),
    db.execute<{ value: string; count: number }>(sql`
      select s.country as value, count(*)::int as count ${baseFrom()} where ${except("country")}
      group by s.country order by count desc`),
    db.execute<{ value: number; count: number }>(sql`
      select r.v as value, count(p.id)::int as count from (values (4),(3),(2),(1)) r(v)
      left join lateral (select p.id ${baseFrom()} where ${except("rating")} and p.rating_avg >= r.v) p on true
      group by r.v order by r.v desc`),
    db.execute<{ rts: number; ver: number; stock: number }>(sql`
      select
        (select count(*)::int ${baseFrom()} where ${except("readyToShip")} and p.ready_to_ship) as rts,
        (select count(*)::int ${baseFrom()} where ${except("verified")} and s.is_verified) as ver,
        (select count(*)::int ${baseFrom()} where ${except("inStock")} and st.stock > 0) as stock`),
    db.execute<{ min: number | null; max: number | null }>(sql`
      select floor(min(${priceUsd}))::int as min, ceil(max(${priceUsd}))::int as max ${baseFrom()} where ${except("price")}`),
  ]);

  const total = totalRows[0]?.n ?? 0;
  const items = await getProductCardsByIds(idRows.map((r) => r.id));

  let didYouMean: string | null = null;
  if (q && total === 0) {
    const [best] = await db.execute<{ title: string }>(sql`
      select title from product where status = 'published' order by word_similarity(${q}, title) desc limit 1`);
    didYouMean = best ? best.title.split(/[,(]/)[0]!.split(" ").slice(0, 4).join(" ") : null;
  }

  const flags = flagRows[0];
  const price = priceRows[0];
  return {
    items,
    total,
    page: params.page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    facets: {
      categories: catRows.map((r) => ({ value: r.value, label: r.label, count: r.count })),
      brands: brandRows.map((r) => ({ value: r.value, label: r.value, count: r.count })),
      countries: countryRows.map((r) => ({ value: r.value, label: COUNTRY_NAMES[r.value] ?? r.value, count: r.count })),
      ratings: ratingRows.map((r) => ({ value: String(r.value), label: `${r.value} stars & up`, count: r.count })),
      readyToShip: flags?.rts ?? 0,
      verified: flags?.ver ?? 0,
      inStock: flags?.stock ?? 0,
      priceRangeUsdMinor: price && price.min != null && price.max != null ? { min: price.min, max: price.max } : null,
    },
    didYouMean,
  };
}

function emptyResult(page: number): SearchResult {
  return {
    items: [],
    total: 0,
    page,
    pageCount: 1,
    facets: {
      categories: [],
      brands: [],
      countries: [],
      ratings: [],
      readyToShip: 0,
      verified: 0,
      inStock: 0,
      priceRangeUsdMinor: null,
    },
    didYouMean: null,
  };
}

/** Supplier search ("Suppliers" tab): sellers whose name/story match, or who sell matching products. */
export async function searchSuppliers(
  q: string | undefined,
  category?: string,
): Promise<(SellerCardData & { matchingProducts: number })[]> {
  const catIds = category ? await categoryIds(category) : null;
  const productFilter = andAll([
    sql`p.status = 'published'`,
    ...(q ? [textMatch(q)] : []),
    ...(catIds
      ? [
          sql`p.category_id in (${sql.join(
            catIds.map((id) => sql`${id}::uuid`),
            sql`, `,
          )})`,
        ]
      : []),
  ]);
  const rows = await db.execute<Record<string, unknown> & SellerCardData & { matchingProducts: number }>(sql`
    select s.id, s.slug, s.name, s.country, s.city, s.is_verified as "isVerified", s.is_star_seller as "isStarSeller",
      s.rating_avg as "ratingAvg", s.rating_count as "ratingCount", s.response_rate as "responseRate",
      s.joined_at as "joinedAt", s.logo_url as "logoUrl",
      (select count(*)::int from product p where p.seller_id = s.id and p.status = 'published') as "productCount",
      (select count(*)::int from product p where p.seller_id = s.id and ${productFilter}) as "matchingProducts"
    from seller s
    where s.status = 'approved'
      and (${q ? sql`s.name ilike ${"%" + q + "%"} or s.story ilike ${"%" + q + "%"} or ` : sql``}
           exists (select 1 from product p where p.seller_id = s.id and ${productFilter}))
    order by "matchingProducts" desc, s.is_verified desc, s.rating_avg desc
    limit 24`);
  return rows.map((r) => ({ ...r, joinedAt: new Date(r.joinedAt) }));
}

export interface Suggestion {
  products: { slug: string; title: string; image: string | null }[];
  categories: { slug: string; name: string }[];
  suppliers: { slug: string; name: string; isVerified: boolean }[];
}

/** Autocomplete: prefix + trigram matches, fast and small. */
export async function suggest(q: string): Promise<Suggestion> {
  const term = q.trim().slice(0, 60);
  if (term.length < 2) return { products: [], categories: [], suppliers: [] };
  const [products, categories, suppliers] = await Promise.all([
    db.execute<{ slug: string; title: string; image: string | null }>(sql`
      select p.slug, p.title,
        (select url from product_image i where i.product_id = p.id order by sort_order limit 1) as image
      from product p join seller s on s.id = p.seller_id and s.status = 'approved'
      where p.status = 'published' and ${textMatch(term)}
      order by (p.title ilike ${term + "%"}) desc, word_similarity(${term}, p.title) desc, p.sold_count desc
      limit 6`),
    db.execute<{ slug: string; name: string }>(sql`
      select slug, name from category where name ilike ${"%" + term + "%"} or similarity(name, ${term}) > 0.3
      order by similarity(name, ${term}) desc limit 3`),
    db.execute<{ slug: string; name: string; isVerified: boolean }>(sql`
      select slug, name, is_verified as "isVerified" from seller
      where status = 'approved' and (name ilike ${"%" + term + "%"} or similarity(name, ${term}) > 0.3)
      order by similarity(name, ${term}) desc limit 3`),
  ]);
  return { products: [...products], categories: [...categories], suppliers: [...suppliers] };
}
