import Image from "next/image";
import Link from "next/link";
import { Building2, Zap } from "lucide-react";
import { getPrefs } from "@/server/prefs";
import { getCategoryTree } from "@/server/queries/layout";
import {
  getActiveBanners,
  getActiveDeals,
  getBulkProducts,
  getFeaturedProducts,
  getRates,
  getTopSellers,
} from "@/server/queries/catalog";
import { getActor } from "@/server/auth/session";
import { ProductCard } from "@/components/store/product-card";
import { HeroCarousel } from "@/components/store/hero-carousel";
import { DealCard } from "@/components/store/deal-card";
import { BulkCard } from "@/components/store/bulk-card";
import { SellerCard } from "@/components/store/seller-card";
import { Countdown } from "@/components/product/countdown";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const [prefs, categories, banners, products, rates, actor, deals, bulk, sellers] = await Promise.all([
    getPrefs(),
    getCategoryTree(),
    getActiveBanners(),
    getFeaturedProducts(12),
    getRates(),
    getActor(),
    getActiveDeals(6),
    getBulkProducts(8),
    getTopSellers(4),
  ]);
  const dealsEnd = deals[0]?.endsAt;

  return (
    <div className="container-page flex flex-col gap-12 pt-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <HeroCarousel
          slides={banners.map((b) => ({
            id: b.id,
            eyebrow: b.eyebrow,
            title: b.title,
            subtitle: b.subtitle,
            ctaLabel: b.ctaLabel,
            href: b.href,
            imageUrl: b.imageUrl,
            theme: b.theme,
          }))}
        />
        <aside aria-label="Account and business" className="flex flex-col gap-4 sm:flex-row lg:flex-col">
          <div className="flex flex-1 flex-col gap-3 rounded-lg border border-border p-6">
            <h2 className="text-lg font-bold">
              {actor ? `Welcome back, ${actor.name.split(" ")[0]}` : "Welcome to MarketHub"}
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              {actor
                ? "Pick up where you left off: your orders, saved items and quotes."
                : "Sign in for order tracking, saved addresses and price alerts."}
            </p>
            <Button asChild className="mt-auto">
              <Link href={actor ? "/account" : "/login"}>{actor ? "Your account" : "Sign in"}</Link>
            </Button>
            {!actor ? (
              <Link href="/register" className="text-center text-sm">
                New here? Create an account
              </Link>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col gap-2.5 rounded-lg bg-business-soft p-6">
            <span className="flex items-center gap-2 text-[13px] font-bold tracking-wide text-business">
              <Building2 className="size-[18px]" aria-hidden /> FOR BUSINESS
            </span>
            <h2 className="text-lg font-bold text-business-strong">Buying in bulk?</h2>
            <p className="text-sm leading-relaxed text-business">
              Post one request and compare quotes from verified suppliers side by side.
            </p>
            <Button asChild variant="business" className="mt-auto">
              <Link href="/rfq/new">Post a request for quote</Link>
            </Button>
          </div>
        </aside>
      </div>

      <section aria-labelledby="cat-h" className="flex flex-col gap-4">
        <h2 id="cat-h" className="text-[22px] font-bold">
          Shop by category
        </h2>
        <ul className="grid grid-cols-4 gap-x-3 gap-y-5 lg:grid-cols-8">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/c/${c.slug}`}
                className="flex flex-col items-center gap-2.5 text-center text-[13px] font-medium text-text sm:text-sm"
              >
                <span className="relative block aspect-square w-full max-w-[132px] overflow-hidden rounded-full bg-image">
                  {c.imageUrl ? <Image src={c.imageUrl} alt="" fill sizes="132px" className="object-cover" /> : null}
                </span>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {deals.length ? (
        <section aria-labelledby="deal-h" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="deal-h" className="flex items-center gap-2 text-[22px] font-bold text-deal">
              <Zap className="size-6 fill-current" aria-hidden /> Flash Deals
            </h2>
            {dealsEnd ? (
              <span className="rounded-full bg-deal-soft px-3 py-1 text-sm font-semibold text-deal-strong">
                Ends in <Countdown endsAt={dealsEnd.toISOString()} />
              </span>
            ) : null}
            <Link href="/deals" className="ml-auto text-sm font-semibold">
              See all deals
            </Link>
          </div>
          <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 xl:grid-cols-6">
            {deals.map((d) => (
              <li key={d.card.id} className="w-[46vw] shrink-0 snap-start sm:w-auto">
                <DealCard card={d.card} claimedPct={d.claimedPct} currency={prefs.currency} rates={rates} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="rec-h" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="rec-h" className="text-[22px] font-bold">
            Popular right now
          </h2>
          {prefs.view === "business" ? (
            <span className="rounded-full bg-business-soft px-2.5 py-1 text-[13px] font-semibold text-business">
              Showing business prices
            </span>
          ) : null}
          <Link href="/search?sort=bestselling" className="ml-auto text-sm font-semibold">
            See more popular products
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {products.map((p, i) => (
            <li key={p.id}>
              <ProductCard product={p} currency={prefs.currency} rates={rates} view={prefs.view} priority={i < 2} />
            </li>
          ))}
        </ul>
      </section>

      {bulk.length ? (
        <section aria-labelledby="bulk-h" className="flex flex-col gap-4 rounded-lg bg-business-soft/60 p-5 md:p-7">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 id="bulk-h" className="text-[22px] font-bold text-business-strong">
              Ready to Ship · Bulk pricing
            </h2>
            <span className="text-sm text-business">Low MOQs, tiered prices, samples available</span>
            <Link href="/search?readyToShip=1&sort=bestselling" className="ml-auto text-sm font-semibold text-business">
              View all bulk deals
            </Link>
          </div>
          <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {bulk.map((b) => (
              <li key={b.id}>
                <BulkCard product={b} tiers={b.tiers} currency={prefs.currency} rates={rates} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="sel-h" className="flex flex-col gap-4">
        <div className="flex items-center">
          <h2 id="sel-h" className="text-[22px] font-bold">
            Top-rated sellers
          </h2>
          <Link href="/sellers" className="ml-auto text-sm font-semibold">
            All sellers
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sellers.map((s) => (
            <li key={s.id}>
              <SellerCard seller={s} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
