import Image from "next/image";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { getPrefs } from "@/server/prefs";
import { getCategoryTree } from "@/server/queries/layout";
import { getActiveBanners, getFeaturedProducts, getRates } from "@/server/queries/catalog";
import { getActor } from "@/server/auth/session";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";

const THEME: Record<string, { bg: string; accent: string }> = {
  teal: { bg: "bg-primary-soft", accent: "bg-primary text-primary-fg" },
  indigo: { bg: "bg-business-soft", accent: "bg-business text-white" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/40", accent: "bg-amber-700 text-white" },
};

export default async function HomePage() {
  const [prefs, categories, banners, products, rates, actor] = await Promise.all([
    getPrefs(),
    getCategoryTree(),
    getActiveBanners(),
    getFeaturedProducts(12),
    getRates(),
    getActor(),
  ]);
  const hero = banners[0];
  const theme = THEME[hero?.theme ?? "teal"] ?? THEME.teal!;

  return (
    <div className="container-page flex flex-col gap-12 pt-6">
      <section aria-label="Featured" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {hero ? (
          <div
            className={`relative grid items-center gap-8 overflow-hidden rounded-lg p-8 md:grid-cols-[1fr_360px] md:p-12 ${theme.bg}`}
          >
            <div className="flex max-w-xl flex-col gap-4">
              {hero.eyebrow ? (
                <span className="self-start rounded-full bg-bg px-3 py-1 text-[13px] font-bold text-primary">
                  {hero.eyebrow}
                </span>
              ) : null}
              <h1 className="text-3xl leading-tight font-extrabold md:text-[44px]">{hero.title}</h1>
              {hero.subtitle ? <p className="text-[17px] leading-relaxed text-muted">{hero.subtitle}</p> : null}
              <div className="mt-2 flex flex-wrap gap-3">
                <Link
                  href={hero.href as never}
                  className={`inline-flex h-12 items-center rounded-md px-6 font-semibold no-underline hover:no-underline ${theme.accent}`}
                >
                  {hero.ctaLabel}
                </Link>
                <Button asChild variant="outline" size="lg">
                  <Link href="/search">Browse all</Link>
                </Button>
              </div>
            </div>
            {hero.imageUrl ? (
              <div className="relative hidden aspect-square overflow-hidden rounded-[14px] bg-image shadow-[var(--shadow-card)] md:block">
                <Image src={hero.imageUrl} alt="" fill sizes="360px" className="object-cover" priority />
              </div>
            ) : null}
          </div>
        ) : null}
        <aside className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-lg border border-border p-6">
            <h2 className="text-lg font-bold">
              {actor ? `Welcome back, ${actor.name.split(" ")[0]}` : "Welcome to MarketHub"}
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              {actor
                ? "Pick up where you left off: your orders, saved items and quotes."
                : "Sign in for order tracking, saved addresses and price alerts."}
            </p>
            <Button asChild>
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
      </section>

      <section aria-labelledby="cat-h" className="flex flex-col gap-4">
        <h2 id="cat-h" className="text-[22px] font-bold">
          Shop by category
        </h2>
        <ul className="grid grid-cols-4 gap-4 sm:grid-cols-4 lg:grid-cols-8">
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

      <section aria-labelledby="rec-h" className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h2 id="rec-h" className="text-[22px] font-bold">
            Popular right now
          </h2>
          {prefs.view === "business" ? (
            <span className="rounded-full bg-business-soft px-2.5 py-1 text-[13px] font-semibold text-business">
              Showing business prices
            </span>
          ) : null}
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {products.map((p, i) => (
            <li key={p.id}>
              <ProductCard product={p} currency={prefs.currency} rates={rates} view={prefs.view} priority={i < 2} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
