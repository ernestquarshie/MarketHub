import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, gt, lte, ne, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getProductCardsByIds } from "./catalog";

export const getProductBySlug = cache(async (slug: string) => {
  const now = new Date();
  const p = await db.query.product.findFirst({
    where: and(eq(schema.product.slug, slug), eq(schema.product.status, "published")),
    with: {
      seller: true,
      category: { with: { parent: { columns: { slug: true, name: true } } } },
      images: { orderBy: asc(schema.productImage.sortOrder) },
      variants: { orderBy: asc(schema.productVariant.sku) },
      tiers: { orderBy: asc(schema.priceTier.minQty) },
      flashDeals: {
        where: and(lte(schema.flashDeal.startsAt, now), gt(schema.flashDeal.endsAt, now)),
        limit: 1,
      },
    },
  });
  if (!p || p.seller.status !== "approved") return null;
  return p;
});
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getPriceHistory(productId: string) {
  return db
    .select({ price: schema.priceHistory.price, recordedAt: schema.priceHistory.recordedAt })
    .from(schema.priceHistory)
    .where(
      and(
        eq(schema.priceHistory.productId, productId),
        gt(schema.priceHistory.recordedAt, sql`now() - interval '13 months'`),
      ),
    )
    .orderBy(asc(schema.priceHistory.recordedAt));
}

export async function getReviewStats(productId: string) {
  const rows = await db
    .select({ rating: schema.review.rating, n: sql<number>`count(*)::int` })
    .from(schema.review)
    .where(and(eq(schema.review.productId, productId), eq(schema.review.status, "visible")))
    .groupBy(schema.review.rating);
  const total = rows.reduce((a, r) => a + r.n, 0);
  const histogram = [5, 4, 3, 2, 1].map((star) => {
    const n = rows.find((r) => r.rating === star)?.n ?? 0;
    return { star, count: n, pct: total ? Math.round((n / total) * 100) : 0 };
  });
  const avg = total ? rows.reduce((a, r) => a + r.rating * r.n, 0) / total : 0;
  return { total, avg, histogram };
}

export type ReviewSort = "helpful" | "newest";

export async function getReviews(
  productId: string,
  opts: { stars?: number; sort: ReviewSort; limit?: number; viewerId?: string | null },
) {
  const where = and(
    eq(schema.review.productId, productId),
    eq(schema.review.status, "visible"),
    opts.stars ? eq(schema.review.rating, opts.stars) : undefined,
  );
  const rows = await db
    .select({
      id: schema.review.id,
      rating: schema.review.rating,
      title: schema.review.title,
      body: schema.review.body,
      images: schema.review.images,
      variantLabel: schema.review.variantLabel,
      helpfulCount: schema.review.helpfulCount,
      sellerReply: schema.review.sellerReply,
      createdAt: schema.review.createdAt,
      verified: sql<boolean>`true`,
      author: schema.user.name,
      voted: opts.viewerId
        ? sql<boolean>`exists (select 1 from review_vote rv where rv.review_id = ${schema.review.id} and rv.user_id = ${opts.viewerId})`
        : sql<boolean>`false`,
    })
    .from(schema.review)
    .innerJoin(schema.user, eq(schema.user.id, schema.review.userId))
    .where(where)
    .orderBy(
      opts.sort === "newest" ? desc(schema.review.createdAt) : desc(schema.review.helpfulCount),
      desc(schema.review.createdAt),
    )
    .limit(opts.limit ?? 8);
  return rows;
}

/** Top themes from review text — a lightweight, deterministic "Customers say" summary. */
export async function getReviewThemes(productId: string) {
  const THEMES: { label: string; pattern: RegExp }[] = [
    { label: "Quality", pattern: /quality|well made|original|solid/i },
    { label: "Value for money", pattern: /value|price|cheaper|budget/i },
    { label: "Delivery speed", pattern: /deliver|arriv|quick|fast|late/i },
    { label: "Seller service", pattern: /seller|replied|question|help/i },
    { label: "Packaging", pattern: /pack/i },
    { label: "Bulk orders", pattern: /bulk|resale|shop|tier/i },
  ];
  const rows = await db
    .select({ body: schema.review.body, rating: schema.review.rating })
    .from(schema.review)
    .where(and(eq(schema.review.productId, productId), eq(schema.review.status, "visible")));
  const themes = THEMES.map((t) => {
    const hits = rows.filter((r) => t.pattern.test(r.body));
    const positive = hits.filter((r) => r.rating >= 4).length;
    return { label: t.label, count: hits.length, positiveShare: hits.length ? positive / hits.length : 0 };
  })
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
  return themes;
}

/** Items most often bought in the same orders; falls back to popular items in the same category. */
export async function getFrequentlyBoughtTogether(productId: string, categoryId: string, limit = 2) {
  const co = await db.execute<{ id: string }>(sql`
    select oi2.product_id as id, count(*) as n
    from order_item oi1
    join order_item oi2 on oi2.seller_order_id in (select id from seller_order where order_id = (select order_id from seller_order where id = oi1.seller_order_id))
    where oi1.product_id = ${productId} and oi2.product_id <> ${productId}
    group by oi2.product_id order by n desc limit ${limit}`);
  let ids = co.map((r) => r.id);
  if (ids.length < limit) {
    const fill = await db
      .select({ id: schema.product.id })
      .from(schema.product)
      .innerJoin(schema.category, eq(schema.category.id, schema.product.categoryId))
      .where(
        and(
          eq(schema.product.status, "published"),
          ne(schema.product.id, productId),
          sql`${schema.category.parentId} = (select parent_id from category where id = ${categoryId})`,
          ne(schema.product.categoryId, categoryId),
        ),
      )
      .orderBy(desc(schema.product.soldCount))
      .limit(limit - ids.length);
    ids = [...ids, ...fill.map((f) => f.id)];
  }
  return getProductCardsByIds(ids);
}

export async function getSimilarProducts(productId: string, categoryId: string, limit = 6) {
  const rows = await db
    .select({ id: schema.product.id })
    .from(schema.product)
    .where(
      and(
        eq(schema.product.status, "published"),
        eq(schema.product.categoryId, categoryId),
        ne(schema.product.id, productId),
      ),
    )
    .orderBy(desc(schema.product.soldCount))
    .limit(limit);
  let ids = rows.map((r) => r.id);
  if (ids.length < limit) {
    const more = await db
      .select({ id: schema.product.id })
      .from(schema.product)
      .innerJoin(schema.category, eq(schema.category.id, schema.product.categoryId))
      .where(
        and(
          eq(schema.product.status, "published"),
          ne(schema.product.id, productId),
          sql`${schema.category.parentId} = (select parent_id from category where id = ${categoryId})`,
        ),
      )
      .orderBy(desc(schema.product.ratingAvg))
      .limit(limit);
    ids = [...new Set([...ids, ...more.map((m) => m.id)])].slice(0, limit);
  }
  return getProductCardsByIds(ids);
}

export async function getMoreFromSeller(sellerId: string, productId: string, limit = 6) {
  const rows = await db
    .select({ id: schema.product.id })
    .from(schema.product)
    .where(
      and(
        eq(schema.product.status, "published"),
        eq(schema.product.sellerId, sellerId),
        ne(schema.product.id, productId),
      ),
    )
    .orderBy(desc(schema.product.soldCount))
    .limit(limit);
  return getProductCardsByIds(rows.map((r) => r.id));
}

export async function getViewerState(productId: string, userId: string | null) {
  if (!userId) return { inWishlist: false, alert: null as null | { targetPrice: number | null } };
  const [w, a] = await Promise.all([
    db.query.wishlistItem.findFirst({
      where: and(eq(schema.wishlistItem.userId, userId), eq(schema.wishlistItem.productId, productId)),
    }),
    db.query.priceAlert.findFirst({
      where: and(
        eq(schema.priceAlert.userId, userId),
        eq(schema.priceAlert.productId, productId),
        eq(schema.priceAlert.active, true),
      ),
    }),
  ]);
  return { inWishlist: !!w, alert: a ? { targetPrice: a.targetPrice } : null };
}

/** Zone used for the delivery estimate, from the shopper's currency (a proxy for location until checkout). */
export async function getDeliveryEstimate(currency: "GHS" | "NGN" | "USD") {
  const zoneName = currency === "GHS" ? "Greater Accra" : currency === "NGN" ? "Lagos" : "International";
  const zone = await db.query.shippingZone.findFirst({
    where: eq(schema.shippingZone.name, zoneName),
    with: { pickupStations: { limit: 1 } },
  });
  return zone ?? null;
}
