import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, gt, isNull, lte, or } from "drizzle-orm";
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
