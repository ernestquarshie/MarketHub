import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, gt, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { DEFAULT_RATES, type Currency, type Rates } from "@/lib/money";

export const getRates = cache(async (): Promise<Rates> => {
  const rows = await db.select().from(schema.currencyRate);
  const rates = { ...DEFAULT_RATES };
  for (const r of rows) rates[r.code] = r.perUsd;
  return rates;
});

export interface ProductCardData {
  id: string;
  slug: string;
  title: string;
  currency: Currency;
  retailPrice: number;
  compareAtPrice: number | null;
  dealPrice: number | null;
  lowestTierPrice: number | null;
  moq: number;
  leadTimeDays: number;
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  image: { url: string; alt: string } | null;
  seller: { name: string; slug: string; isVerified: boolean };
}

const cardColumns = {
  id: true,
  slug: true,
  title: true,
  currency: true,
  retailPrice: true,
  compareAtPrice: true,
  moq: true,
  leadTimeDays: true,
  ratingAvg: true,
  ratingCount: true,
  soldCount: true,
} as const;

function toCard(p: {
  id: string;
  slug: string;
  title: string;
  currency: Currency;
  retailPrice: number;
  compareAtPrice: number | null;
  moq: number;
  leadTimeDays: number;
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  images: { url: string; alt: string }[];
  tiers: { unitPrice: number }[];
  flashDeals: { dealPrice: number }[];
  seller: { name: string; slug: string; isVerified: boolean };
}): ProductCardData {
  return {
    ...p,
    image: p.images[0] ?? null,
    lowestTierPrice: p.tiers.length ? Math.min(...p.tiers.map((t) => t.unitPrice)) : null,
    dealPrice: p.flashDeals[0]?.dealPrice ?? null,
  };
}

const cardWith = (now: Date) =>
  ({
    images: { columns: { url: true, alt: true }, orderBy: asc(schema.productImage.sortOrder), limit: 1 },
    tiers: { columns: { unitPrice: true } },
    flashDeals: {
      columns: { dealPrice: true },
      where: and(lte(schema.flashDeal.startsAt, now), gt(schema.flashDeal.endsAt, now)),
      limit: 1,
    },
    seller: { columns: { name: true, slug: true, isVerified: true } },
  }) as const;

export const getFeaturedProducts = cache(async (limit = 12): Promise<ProductCardData[]> => {
  const now = new Date();
  const rows = await db.query.product.findMany({
    where: eq(schema.product.status, "published"),
    orderBy: [desc(schema.product.isFeatured), desc(schema.product.soldCount)],
    limit,
    columns: cardColumns,
    with: cardWith(now),
  });
  return rows.map(toCard);
});

/** Card data for a list of product ids, preserving the given order. */
export async function getProductCardsByIds(ids: string[]): Promise<ProductCardData[]> {
  if (!ids.length) return [];
  const rows = await db.query.product.findMany({
    where: and(inArray(schema.product.id, ids), eq(schema.product.status, "published")),
    columns: cardColumns,
    with: cardWith(new Date()),
  });
  const byId = new Map(rows.map((r) => [r.id, toCard(r)]));
  return ids.map((id) => byId.get(id)).filter((x): x is ProductCardData => !!x);
}

/** Products currently in an active flash deal, with deal progress. */
export const getActiveDeals = cache(async (limit = 12) => {
  const now = new Date();
  const deals = await db.query.flashDeal.findMany({
    where: and(lte(schema.flashDeal.startsAt, now), gt(schema.flashDeal.endsAt, now)),
    orderBy: asc(schema.flashDeal.endsAt),
    limit,
  });
  const cards = await getProductCardsByIds(deals.map((d) => d.productId));
  return cards.map((card) => {
    const d = deals.find((x) => x.productId === card.id)!;
    return { card, endsAt: d.endsAt, claimedPct: Math.round((d.claimed / d.stockCap) * 100) };
  });
});

/** Ready-to-ship products with bulk tiers, for the Alibaba-style bulk rail. */
export const getBulkProducts = cache(async (limit = 8): Promise<(ProductCardData & { tiers: { minQty: number; maxQty: number | null; unitPrice: number }[] })[]> => {
  const rows = await db.query.product.findMany({
    where: and(eq(schema.product.status, "published"), eq(schema.product.readyToShip, true), gt(schema.product.moq, 1)),
    orderBy: desc(schema.product.soldCount),
    limit,
    columns: cardColumns,
    with: { ...cardWith(new Date()), tiers: { columns: { minQty: true, maxQty: true, unitPrice: true }, orderBy: asc(schema.priceTier.minQty) } },
  });
  return rows.filter((r) => r.tiers.length).map((r) => ({ ...toCard(r), tiers: r.tiers }));
});

export interface SellerCardData {
  id: string;
  slug: string;
  name: string;
  country: string;
  city: string;
  isVerified: boolean;
  isStarSeller: boolean;
  ratingAvg: number;
  ratingCount: number;
  responseRate: number;
  joinedAt: Date;
  productCount: number;
  logoUrl: string | null;
}

export const getTopSellers = cache(async (limit = 8): Promise<SellerCardData[]> => {
  const rows = await db
    .select({
      id: schema.seller.id,
      slug: schema.seller.slug,
      name: schema.seller.name,
      country: schema.seller.country,
      city: schema.seller.city,
      isVerified: schema.seller.isVerified,
      isStarSeller: schema.seller.isStarSeller,
      ratingAvg: schema.seller.ratingAvg,
      ratingCount: schema.seller.ratingCount,
      responseRate: schema.seller.responseRate,
      joinedAt: schema.seller.joinedAt,
      logoUrl: schema.seller.logoUrl,
      productCount: sql<number>`(select count(*)::int from product p where p.seller_id = ${schema.seller.id} and p.status = 'published')`,
    })
    .from(schema.seller)
    .where(eq(schema.seller.status, "approved"))
    .orderBy(desc(schema.seller.isStarSeller), desc(schema.seller.ratingAvg))
    .limit(limit);
  return rows;
});

export const getActiveBanners = cache(async () => {
  const now = new Date();
  return db
    .select()
    .from(schema.banner)
    .where(
      and(
        eq(schema.banner.placement, "home_hero"),
        or(isNull(schema.banner.activeFrom), lte(schema.banner.activeFrom, now)),
        or(isNull(schema.banner.activeTo), gt(schema.banner.activeTo, now)),
      ),
    )
    .orderBy(asc(schema.banner.sortOrder));
});
