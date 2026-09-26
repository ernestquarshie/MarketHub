/**
 * Pricing rules — the single source of truth for what a buyer pays per unit.
 * See docs/03-design.md §3 "Pricing rules". Pure functions: safe on server and client.
 */

export interface TierInput {
  minQty: number;
  maxQty: number | null;
  unitPrice: number; // minor units, product currency
}

export interface PricingInput {
  retailPrice: number; // product retail price (minor units)
  variantPriceOverride?: number | null;
  compareAtPrice?: number | null;
  moq: number;
  tiers: TierInput[];
  flashDeal?: { dealPrice: number; startsAt: Date; endsAt: Date; stockCap: number; claimed: number } | null;
  sample?: { enabled: boolean; price: number | null; maxQty: number } | null;
}

export interface PricingContext {
  qty: number;
  isBusinessBuyer: boolean;
  isSample?: boolean;
  now?: Date;
}

export type PriceSource = "retail" | "tier" | "flash_deal" | "sample";

export interface PriceResult {
  unitPrice: number;
  lineTotal: number;
  source: PriceSource;
  tier: TierInput | null;
  /** Reference price for strike-through display, when lower than it. */
  wasPrice: number | null;
  /** Validation problem, if the quantity is not allowed. */
  error:
    | null
    | { code: "BELOW_MOQ"; moq: number }
    | { code: "SAMPLE_UNAVAILABLE" }
    | { code: "SAMPLE_MAX"; max: number }
    | { code: "INVALID_QTY" };
}

/** Tiers sorted ascending by minQty. */
export function sortTiers(tiers: TierInput[]): TierInput[] {
  return [...tiers].sort((a, b) => a.minQty - b.minQty);
}

export function findTier(tiers: TierInput[], qty: number): TierInput | null {
  for (const t of sortTiers(tiers).reverse()) {
    if (qty >= t.minQty && (t.maxQty == null || qty <= t.maxQty)) return t;
  }
  return null;
}

export function isDealActive(deal: PricingInput["flashDeal"], now: Date): boolean {
  return !!deal && deal.startsAt <= now && now < deal.endsAt && deal.claimed < deal.stockCap;
}

/**
 * Minimum quantity for a normal (non-sample) line.
 * - Retail terms: always 1 (every product has a retail price).
 * - Business terms: the seller's MOQ, or the lowest tier's minimum if that is higher.
 *   A business buyer who wants fewer units switches to retail terms.
 */
export function effectiveMoq(input: PricingInput, isBusinessBuyer: boolean): number {
  if (!isBusinessBuyer) return 1;
  const lowestTier = sortTiers(input.tiers)[0];
  return Math.max(1, input.moq, lowestTier?.minQty ?? 1);
}

export function priceLine(input: PricingInput, ctx: PricingContext): PriceResult {
  const now = ctx.now ?? new Date();
  const base = input.variantPriceOverride ?? input.retailPrice;
  const empty = { tier: null, wasPrice: null } as const;

  if (!Number.isInteger(ctx.qty) || ctx.qty < 1) {
    return { unitPrice: base, lineTotal: 0, source: "retail", ...empty, error: { code: "INVALID_QTY" } };
  }

  // Samples: fixed price, capped quantity, ignore MOQ.
  if (ctx.isSample) {
    if (!input.sample?.enabled || input.sample.price == null) {
      return { unitPrice: base, lineTotal: 0, source: "sample", ...empty, error: { code: "SAMPLE_UNAVAILABLE" } };
    }
    if (ctx.qty > input.sample.maxQty) {
      return {
        unitPrice: input.sample.price,
        lineTotal: input.sample.price * ctx.qty,
        source: "sample",
        ...empty,
        error: { code: "SAMPLE_MAX", max: input.sample.maxQty },
      };
    }
    return {
      unitPrice: input.sample.price,
      lineTotal: input.sample.price * ctx.qty,
      source: "sample",
      ...empty,
      error: null,
    };
  }

  const moq = effectiveMoq(input, ctx.isBusinessBuyer);
  const moqError = ctx.qty < moq ? ({ code: "BELOW_MOQ", moq } as const) : null;

  // Business buyers get tier pricing when a tier matches.
  if (ctx.isBusinessBuyer) {
    const tier = findTier(input.tiers, ctx.qty);
    if (tier && tier.unitPrice < base) {
      return {
        unitPrice: tier.unitPrice,
        lineTotal: tier.unitPrice * ctx.qty,
        source: "tier",
        tier,
        wasPrice: base,
        error: moqError,
      };
    }
  }

  // Retail: an active flash deal wins when cheaper, within the deal's remaining stock.
  if (!ctx.isBusinessBuyer && input.flashDeal && isDealActive(input.flashDeal, now)) {
    const remaining = input.flashDeal.stockCap - input.flashDeal.claimed;
    if (input.flashDeal.dealPrice < base && ctx.qty <= remaining) {
      return {
        unitPrice: input.flashDeal.dealPrice,
        lineTotal: input.flashDeal.dealPrice * ctx.qty,
        source: "flash_deal",
        tier: null,
        wasPrice: input.compareAtPrice && input.compareAtPrice > base ? input.compareAtPrice : base,
        error: moqError,
      };
    }
  }

  const wasPrice = input.compareAtPrice && input.compareAtPrice > base ? input.compareAtPrice : null;
  return { unitPrice: base, lineTotal: base * ctx.qty, source: "retail", tier: null, wasPrice, error: moqError };
}
