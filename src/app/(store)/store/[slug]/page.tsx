import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { BadgeCheck, Clock, MapPin, MessageSquare, Search, Star } from "lucide-react";
import { db, schema } from "@/server/db";
import { parseSearchParams } from "@/lib/search-params";
import { getPrefs } from "@/server/prefs";
import { getRates } from "@/server/queries/catalog";
import { searchProducts } from "@/server/services/search";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ProductCard } from "@/components/store/product-card";
import { Pagination } from "@/components/search/pagination";
import { SortSelect } from "@/components/search/sort-select";
import { Badge } from "@/components/ui/badge";
import { yearsOnPlatform } from "@/components/store/seller-card";
import { initials } from "@/lib/utils";

const COUNTRY: Record<string, string> = {
  GH: "Ghana",
  NG: "Nigeria",
  CN: "China",
  GB: "United Kingdom",
  US: "United States",
};

const getSeller = cache(async (slug: string) => {
  const s = await db.query.seller.findFirst({
    where: and(eq(schema.seller.slug, slug), eq(schema.seller.status, "approved")),
  });
  return s ?? null;
});

export async function generateMetadata({ params }: PageProps<"/store/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSeller(slug);
  if (!s) return { title: "Store not found" };
  return {
    title: `${s.name} — store`,
    description: s.story ?? `Shop ${s.name} on MarketHub.`,
    alternates: { canonical: `/store/${slug}` },
  };
}

export default async function StorePage({ params, searchParams }: PageProps<"/store/[slug]">) {
  const { slug } = await params;
  const seller = await getSeller(slug);
  if (!seller) notFound();
  const sp = parseSearchParams(await searchParams);
  const [prefs, rates] = await Promise.all([getPrefs(), getRates()]);
  const result = await searchProducts(sp, prefs.currency, rates, { sellerId: seller.id });

  return (
    <div className="container-page flex flex-col gap-6 py-6">
      <Breadcrumbs
        items={[{ name: "Home", href: "/" }, { name: "Suppliers", href: "/sellers" }, { name: seller.name }]}
      />

      <header className="overflow-hidden rounded-lg border border-border">
        <div className="h-24 bg-gradient-to-r from-primary-soft to-business-soft md:h-32" aria-hidden />
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-end md:p-7">
          <span className="-mt-14 flex size-24 shrink-0 items-center justify-center rounded-2xl border-4 border-bg bg-primary font-display text-3xl font-extrabold text-primary-fg md:-mt-20">
            {initials(seller.name)}
          </span>
          <div className="flex flex-1 flex-col gap-2">
            <h1 className="text-2xl font-bold md:text-3xl">{seller.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span className="flex items-center gap-1">
                <MapPin className="size-4" aria-hidden /> {seller.city}, {COUNTRY[seller.country] ?? seller.country}
              </span>
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-star text-star" aria-hidden /> {seller.ratingAvg.toFixed(1)} (
                {seller.ratingCount} reviews)
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-4" aria-hidden /> {seller.responseRate}% response rate
              </span>
              <span>{yearsOnPlatform(seller.joinedAt)} years on MarketHub</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {seller.isVerified ? (
                <Badge tone="verified">
                  <BadgeCheck className="size-3.5" aria-hidden /> Verified supplier
                </Badge>
              ) : null}
              {seller.isStarSeller ? <Badge tone="star">Star Seller</Badge> : null}
              <Badge tone="neutral">{seller.onTimeRate}% on-time delivery</Badge>
            </div>
          </div>
          <Link
            href={`/account/messages?seller=${seller.slug}` as never}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 font-semibold text-primary-fg no-underline hover:bg-primary-hover hover:no-underline"
          >
            <MessageSquare className="size-4" aria-hidden /> Message seller
          </Link>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-5 text-sm leading-relaxed">
          {seller.story ? (
            <section className="flex flex-col gap-1.5">
              <h2 className="font-sans text-base font-bold">About</h2>
              <p className="text-muted">{seller.story}</p>
            </section>
          ) : null}
          {seller.policies.shipping ? (
            <section className="flex flex-col gap-1.5">
              <h2 className="font-sans text-base font-bold">Shipping</h2>
              <p className="text-muted">{seller.policies.shipping}</p>
            </section>
          ) : null}
          <section className="flex flex-col gap-1.5">
            <h2 className="font-sans text-base font-bold">Returns</h2>
            <p className="text-muted">
              {seller.policies.returns ?? `Returns accepted within ${seller.returnWindowDays} days.`}
            </p>
          </section>
        </aside>

        <section aria-labelledby="store-products" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="store-products" className="text-xl font-bold">
              Products <span className="text-base font-normal text-muted">({result.total})</span>
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <form
                role="search"
                action={`/store/${seller.slug}`}
                className="flex h-10 overflow-hidden rounded-md border border-border-strong"
              >
                <label htmlFor="store-q" className="sr-only">
                  Search this store
                </label>
                <input
                  id="store-q"
                  name="q"
                  type="search"
                  defaultValue={sp.q}
                  placeholder="Search this store"
                  className="w-44 bg-bg px-3 text-sm outline-none"
                />
                <button
                  type="submit"
                  aria-label="Search this store"
                  className="flex w-10 items-center justify-center bg-surface"
                >
                  <Search className="size-4" aria-hidden />
                </button>
              </form>
              <SortSelect value={sp.sort} hasQuery={!!sp.q} />
            </div>
          </div>
          {result.items.length ? (
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {result.items.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} currency={prefs.currency} rates={rates} view={prefs.view} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-border-strong p-10 text-center text-muted">
              No products match.
            </p>
          )}
          <Pagination params={sp} pageCount={result.pageCount} basePath={`/store/${seller.slug}`} />
        </section>
      </div>
    </div>
  );
}
