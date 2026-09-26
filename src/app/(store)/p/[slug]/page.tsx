import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, MessageSquare, Star, Store, ThumbsUp } from "lucide-react";
import { getActor } from "@/server/auth/session";
import { getPrefs } from "@/server/prefs";
import { getRates } from "@/server/queries/catalog";
import {
  getDeliveryEstimate,
  getFrequentlyBoughtTogether,
  getMoreFromSeller,
  getPriceHistory,
  getProductBySlug,
  getReviewStats,
  getReviews,
  getReviewThemes,
  getSimilarProducts,
  getViewerState,
  type ReviewSort,
} from "@/server/queries/product";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { RatingStars } from "@/components/store/rating-stars";
import { ProductRail } from "@/components/store/product-rail";
import { Price } from "@/components/store/price";
import { Badge } from "@/components/ui/badge";
import { yearsOnPlatform } from "@/components/store/seller-card";
import { PriceHistoryChart } from "@/components/product/price-history";
import { ReviewActions } from "@/components/product/review-actions";
import {
  BuyBox,
  HeadlinePrice,
  MobileBuyBar,
  ProductGallery,
  PurchaseProvider,
  TierTable,
  VariantOptions,
  type PurchaseData,
} from "@/components/product/purchase";
import { compactNumber, initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

const COUNTRY: Record<string, string> = {
  GH: "Ghana",
  NG: "Nigeria",
  CN: "China",
  GB: "United Kingdom",
  US: "United States",
};

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  const image = p.images[0]?.url;
  return {
    title: p.title,
    description: `${p.bullets[0] ?? p.description.slice(0, 120)} Sold by ${p.seller.name}. Retail and bulk prices, delivery across Ghana, Nigeria and worldwide.`,
    alternates: { canonical: `/p/${p.slug}` },
    openGraph: {
      title: p.title,
      images: image ? [{ url: image, width: 480, height: 480 }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params, searchParams }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const p = await getProductBySlug(slug);
  if (!p) notFound();

  const stars = typeof sp.stars === "string" && /^[1-5]$/.test(sp.stars) ? Number(sp.stars) : undefined;
  const reviewSort: ReviewSort = sp.reviews === "newest" ? "newest" : "helpful";

  const [actor, prefs, rates] = await Promise.all([getActor(), getPrefs(), getRates()]);
  const [history, stats, reviews, themes, fbt, similar, moreFromSeller, viewer, zone] = await Promise.all([
    getPriceHistory(p.id),
    getReviewStats(p.id),
    getReviews(p.id, { stars, sort: reviewSort, viewerId: actor?.id }),
    getReviewThemes(p.id),
    getFrequentlyBoughtTogether(p.id, p.categoryId),
    getSimilarProducts(p.id, p.categoryId),
    getMoreFromSeller(p.sellerId, p.id),
    getViewerState(p.id, actor?.id ?? null),
    getDeliveryEstimate(prefs.currency),
  ]);

  const deal = p.flashDeals[0];
  const data: PurchaseData = {
    product: {
      id: p.id,
      slug: p.slug,
      title: p.title,
      currency: p.currency,
      retailPrice: p.retailPrice,
      compareAtPrice: p.compareAtPrice,
      moq: p.moq,
      leadTimeDays: p.leadTimeDays,
      readyToShip: p.readyToShip,
      sample: { enabled: p.sampleEnabled, price: p.samplePrice, maxQty: p.sampleMaxQty },
      tiers: p.tiers.map((t) => ({ minQty: t.minQty, maxQty: t.maxQty, unitPrice: t.unitPrice })),
      deal: deal
        ? {
            dealPrice: deal.dealPrice,
            endsAt: deal.endsAt.toISOString(),
            startsAt: deal.startsAt.toISOString(),
            stockCap: deal.stockCap,
            claimed: deal.claimed,
          }
        : null,
      variants: p.variants.map((v) => ({
        id: v.id,
        options: v.options,
        priceOverride: v.priceOverride,
        available: v.stock - v.reserved,
      })),
      images: p.images.map((i) => ({ url: i.url, alt: i.alt, variantOption: i.variantOption })),
    },
    currency: prefs.currency,
    rates,
    view: prefs.view,
    viewer: { signedIn: !!actor, isBusiness: !!actor?.isBusiness, inWishlist: viewer.inWishlist, alert: viewer.alert },
    delivery: zone
      ? {
          zoneName: zone.name,
          currency: zone.currency,
          doorstepFee: zone.doorstepFee,
          pickupFee: zone.pickupFee,
          etaMin: zone.etaDaysMin,
          etaMax: zone.etaDaysMax,
          stationName: zone.pickupStations[0]?.name ?? null,
          today: new Date().toISOString().slice(0, 10),
        }
      : null,
  };

  const crumbs = [{ name: "Home", href: "/" }];
  if (p.category.parent) crumbs.push({ name: p.category.parent.name, href: `/c/${p.category.parent.slug}` });
  crumbs.push({ name: p.category.name, href: `/c/${p.category.slug}` });

  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    image: p.images.map((i) => new URL(i.url, base).toString()),
    description: p.description,
    sku: p.variants[0]?.sku,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    offers: {
      "@type": "Offer",
      url: new URL(`/p/${p.slug}`, base).toString(),
      priceCurrency: p.currency,
      price: ((deal?.dealPrice ?? p.retailPrice) / 100).toFixed(2),
      availability: data.product.variants.some((v) => v.available > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: p.seller.name },
    },
    aggregateRating: stats.total
      ? { "@type": "AggregateRating", ratingValue: stats.avg.toFixed(1), reviewCount: stats.total }
      : undefined,
    review: reviews.slice(0, 3).map((r) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: r.rating },
      author: { "@type": "Person", name: r.author },
      name: r.title,
      reviewBody: r.body,
    })),
  };

  const reviewHref = (patch: { stars?: number | null; reviews?: ReviewSort }) => {
    const q = new URLSearchParams();
    const s = patch.stars === undefined ? stars : patch.stars;
    const so = patch.reviews ?? reviewSort;
    if (s) q.set("stars", String(s));
    if (so !== "helpful") q.set("reviews", so);
    const qs = q.toString();
    return `/p/${p.slug}${qs ? `?${qs}` : ""}#reviews`;
  };

  return (
    <div className="container-page flex flex-col gap-10 py-5 pb-28 lg:pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Breadcrumbs items={crumbs} />

      <PurchaseProvider data={data}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)_340px]">
          <ProductGallery />

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5">
              <Link href={`/store/${p.seller.slug}` as never} className="text-sm font-semibold">
                Visit the {p.seller.name} store
              </Link>
              <h1 className="text-2xl leading-tight font-bold md:text-[28px]">{p.title}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                {stats.total ? (
                  <a href="#reviews" className="flex items-center gap-1.5 text-text no-underline hover:no-underline">
                    <strong>{stats.avg.toFixed(1)}</strong>
                    <RatingStars value={stats.avg} size="md" />
                    <span className="text-primary">
                      {stats.total} {stats.total === 1 ? "rating" : "ratings"}
                    </span>
                  </a>
                ) : (
                  <span>No reviews yet</span>
                )}
                {p.soldCount ? (
                  <>
                    <span aria-hidden>·</span>
                    <span className="tabular">{compactNumber(p.soldCount)} sold</span>
                  </>
                ) : null}
                {p.seller.isVerified ? (
                  <>
                    <span aria-hidden>·</span>
                    <span className="font-semibold text-success">Verified seller</span>
                  </>
                ) : null}
              </div>
            </div>
            <hr className="border-border" />
            <HeadlinePrice />
            <VariantOptions />
            {p.bullets.length ? (
              <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] leading-relaxed">
                {p.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
            <TierTable rfqHref={`/rfq/new?product=${p.slug}`} />
          </div>

          <aside aria-label="Purchase options" className="flex flex-col gap-4 lg:col-span-2 xl:col-span-1">
            <BuyBox />
            <section
              aria-label="About the seller"
              className="relative flex flex-col gap-3 rounded-lg border border-border p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft font-display font-extrabold text-primary">
                  {initials(p.seller.name)}
                </span>
                <span className="flex flex-col">
                  <strong className="text-[15px]">{p.seller.name}</strong>
                  <span className="flex items-center gap-1 text-[13px] text-muted">
                    <MapPin className="size-3.5" aria-hidden />
                    {p.seller.city}, {COUNTRY[p.seller.country] ?? p.seller.country} ·{" "}
                    {yearsOnPlatform(p.seller.joinedAt)} yrs
                  </span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.seller.isVerified ? (
                  <Badge tone="verified">
                    <BadgeCheck className="size-3.5" aria-hidden /> Verified
                  </Badge>
                ) : null}
                {p.seller.isStarSeller ? <Badge tone="star">Star Seller</Badge> : null}
              </div>
              <dl className="grid grid-cols-3 gap-2 text-xs text-muted tabular">
                <div>
                  <dt>Rating</dt>
                  <dd className="text-[15px] font-bold text-text">{p.seller.ratingAvg.toFixed(1)}</dd>
                </div>
                <div>
                  <dt>Response</dt>
                  <dd className="text-[15px] font-bold text-text">{p.seller.responseRate}%</dd>
                </div>
                <div>
                  <dt>On time</dt>
                  <dd className="text-[15px] font-bold text-text">{p.seller.onTimeRate}%</dd>
                </div>
              </dl>
              <div className="flex gap-2">
                <Link
                  href={`/account/messages?seller=${p.seller.slug}&product=${p.slug}` as never}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-border-strong text-sm font-semibold text-text no-underline hover:no-underline"
                >
                  <MessageSquare className="size-4" aria-hidden /> Message
                </Link>
                <Link
                  href={`/store/${p.seller.slug}` as never}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-border-strong text-sm font-semibold text-text no-underline hover:no-underline"
                >
                  <Store className="size-4" aria-hidden /> Visit store
                </Link>
              </div>
            </section>
          </aside>
        </div>
        <MobileBuyBar />
      </PurchaseProvider>

      {fbt.length ? (
        <section aria-labelledby="fbt-h" className="flex flex-col gap-4 rounded-lg border border-border p-5 md:p-6">
          <h2 id="fbt-h" className="text-xl font-bold">
            Frequently bought together
          </h2>
          <ul className="flex flex-col gap-4 md:flex-row md:items-center">
            {[
              {
                id: p.id,
                slug: p.slug,
                title: `This item: ${p.title}`,
                image: p.images[0],
                price: deal?.dealPrice ?? p.retailPrice,
                currency: p.currency,
              },
              ...fbt.map((f) => ({
                id: f.id,
                slug: f.slug,
                title: f.title,
                image: f.image ?? undefined,
                price: f.dealPrice ?? f.retailPrice,
                currency: f.currency,
              })),
            ].map((f, i) => (
              <li key={f.id} className="flex items-center gap-3 md:w-72">
                {i > 0 ? (
                  <span aria-hidden className="hidden text-2xl text-muted md:inline">
                    +
                  </span>
                ) : null}
                <Link
                  href={`/p/${f.slug}` as never}
                  className="flex items-center gap-3 text-text no-underline hover:no-underline"
                >
                  <span className="relative size-20 shrink-0 overflow-hidden rounded-md bg-image">
                    {f.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.image.url} alt="" className="size-full object-cover" loading="lazy" />
                    ) : null}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="line-clamp-2 text-sm">{f.title}</span>
                    <Price
                      amount={f.price}
                      from={f.currency}
                      to={prefs.currency}
                      rates={rates}
                      className="text-[15px]"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav
        aria-label="On this page"
        className="sticky top-0 z-20 -mx-4 overflow-x-auto border-y border-border bg-bg/95 px-4 backdrop-blur md:mx-0 md:px-0"
      >
        <ul className="flex gap-6 text-sm font-semibold whitespace-nowrap">
          {[
            ["#description", "Description"],
            ["#specifications", "Specifications"],
            ["#shipping", "Shipping & returns"],
            ["#price-history", "Price history"],
            ["#reviews", `Reviews (${stats.total})`],
          ].map(([h, l]) => (
            <li key={h}>
              <a
                href={h}
                className="inline-flex min-h-12 items-center text-text no-underline hover:text-primary hover:no-underline"
              >
                {l}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <section id="description" aria-labelledby="desc-h" className="flex scroll-mt-16 flex-col gap-3">
          <h2 id="desc-h" className="text-xl font-bold">
            Description
          </h2>
          <p className="text-[15px] leading-relaxed">{p.description}</p>
        </section>
        <section id="specifications" aria-labelledby="spec-h" className="flex scroll-mt-16 flex-col gap-3">
          <h2 id="spec-h" className="text-xl font-bold">
            Specifications
          </h2>
          <dl className="grid grid-cols-[minmax(0,160px)_1fr] text-sm">
            {[...(p.brand ? [["Brand", p.brand] as const] : []), ...Object.entries(p.specs)].map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="border-b border-border py-2.5 text-muted">{k}</dt>
                <dd className="border-b border-border py-2.5 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section id="shipping" aria-labelledby="ship-h" className="flex scroll-mt-16 flex-col gap-4">
        <h2 id="ship-h" className="text-xl font-bold">
          Shipping & returns
        </h2>
        <div className="grid gap-4 text-sm leading-relaxed md:grid-cols-3">
          <div className="rounded-lg bg-surface p-5">
            <strong className="mb-1 block">Doorstep delivery</strong>
            {p.readyToShip
              ? "Ships within 1–2 business days."
              : `Made to order: ships in about ${p.leadTimeDays} days.`}{" "}
            Delivery time and fee depend on your region and are shown at checkout.
          </div>
          <div className="rounded-lg bg-surface p-5">
            <strong className="mb-1 block">Pickup stations</strong>
            Collect from pickup stations in Accra, Kumasi, Takoradi, Lagos and Abuja for a lower fee. Parcels are held
            for 7 days.
          </div>
          <div className="rounded-lg bg-surface p-5">
            <strong className="mb-1 block">Returns</strong>
            {p.seller.policies.returns ?? `Returns accepted within ${p.seller.returnWindowDays} days of delivery.`}
          </div>
        </div>
      </section>

      <section id="price-history" aria-labelledby="hist-h" className="flex scroll-mt-16 flex-col gap-4">
        <h2 id="hist-h" className="text-xl font-bold">
          Price history (12 months)
        </h2>
        <PriceHistoryChart points={history} from={p.currency} to={prefs.currency} rates={rates} />
      </section>

      <section
        id="reviews"
        aria-labelledby="rev-h"
        className="grid scroll-mt-16 gap-10 lg:grid-cols-[300px_minmax(0,1fr)]"
      >
        <div className="flex flex-col gap-3">
          <h2 id="rev-h" className="text-[22px] font-bold">
            Customer reviews
          </h2>
          {stats.total ? (
            <>
              <div className="flex items-center gap-3">
                <span className="font-display text-[44px] font-extrabold">{stats.avg.toFixed(1)}</span>
                <span className="flex flex-col gap-1 text-sm text-muted">
                  <RatingStars value={stats.avg} size="md" />
                  {stats.total} global {stats.total === 1 ? "rating" : "ratings"}
                </span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {stats.histogram.map((h) => (
                  <li key={h.star}>
                    <Link
                      href={reviewHref({ stars: stars === h.star ? null : h.star }) as never}
                      scroll={false}
                      aria-current={stars === h.star ? "true" : undefined}
                      aria-label={`${h.star} star: ${h.pct}% of reviews${stars === h.star ? " (filter on)" : ""}`}
                      className={cn(
                        "flex min-h-8 items-center gap-2.5 rounded-sm px-1 text-sm no-underline hover:bg-surface hover:no-underline",
                        stars === h.star && "bg-surface",
                      )}
                    >
                      <span className="w-12 text-primary">{h.star} star</span>
                      <span className="h-3 flex-1 overflow-hidden rounded-full border border-border bg-surface">
                        <span className="block h-full bg-star" style={{ width: `${h.pct}%` }} />
                      </span>
                      <span className="w-10 text-right text-muted tabular">{h.pct}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-muted">No reviews yet.</p>
          )}
          <p className="mt-2 text-sm text-muted">Only customers with a delivered order can review this product.</p>
        </div>

        <div className="flex flex-col gap-5">
          {themes.length ? (
            <div className="flex flex-col gap-2.5 rounded-lg bg-surface p-5">
              <h3 className="font-sans text-[15px] font-bold">Customers mention</h3>
              <ul className="flex flex-wrap gap-2">
                {themes.map((t) => (
                  <li
                    key={t.label}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-bg px-3 py-1 text-[13px]"
                  >
                    {t.positiveShare >= 0.6 ? <ThumbsUp className="size-3.5 text-success" aria-hidden /> : null}
                    <span className="sr-only">{t.positiveShare >= 0.6 ? "Mostly positive:" : "Mixed:"}</span>
                    {t.label} ({t.count})
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted">Summarised from review text.</p>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-muted">
              {stars ? (
                <>
                  Showing {stars}-star reviews ·{" "}
                  <Link href={reviewHref({ stars: null }) as never} scroll={false}>
                    Show all
                  </Link>
                </>
              ) : (
                "Showing all reviews"
              )}
            </span>
            <span className="flex items-center gap-1">
              Sort:
              {(["helpful", "newest"] as const).map((s) => (
                <Link
                  key={s}
                  href={reviewHref({ reviews: s }) as never}
                  scroll={false}
                  aria-current={reviewSort === s ? "true" : undefined}
                  className={cn(
                    "rounded-full px-3 py-1 no-underline hover:no-underline",
                    reviewSort === s ? "bg-ink font-semibold text-ink-fg" : "text-text hover:bg-surface",
                  )}
                >
                  {s === "helpful" ? "Most helpful" : "Newest"}
                </Link>
              ))}
            </span>
          </div>
          {reviews.length ? (
            <ul className="flex flex-col">
              {reviews.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 border-b border-border py-5 first:pt-0">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
                    <span className="flex size-8 items-center justify-center rounded-full bg-surface-2 text-xs font-bold">
                      {initials(r.author)}
                    </span>
                    <strong className="text-sm">{r.author}</strong>
                    <span className="font-semibold text-success">Verified purchase</span>
                    <span className="text-muted">
                      · {r.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center gap-1 rounded-sm bg-amber-50 px-2 py-0.5 text-[13px] font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      {r.rating} <Star className="size-3 fill-current" aria-hidden />
                      <span className="sr-only">out of 5 stars</span>
                    </span>
                    <h3 className="font-sans text-[15px] font-bold">{r.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed">{r.body}</p>
                  {r.sellerReply ? (
                    <p className="rounded-md bg-surface p-3 text-sm">
                      <strong>Seller reply:</strong> {r.sellerReply}
                    </p>
                  ) : null}
                  <ReviewActions reviewId={r.id} helpful={r.helpfulCount} voted={r.voted} slug={p.slug} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No reviews match this filter.</p>
          )}
        </div>
      </section>

      <ProductRail
        id="similar-h"
        title="Customers also viewed"
        products={similar}
        currency={prefs.currency}
        rates={rates}
        view={prefs.view}
      />
      <ProductRail
        id="seller-h"
        title={`More from ${p.seller.name}`}
        products={moreFromSeller}
        currency={prefs.currency}
        rates={rates}
        view={prefs.view}
        href={`/store/${p.seller.slug}`}
      />
    </div>
  );
}
