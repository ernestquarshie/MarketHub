"use server";

import { and, eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/server/db";
import { getActor } from "@/server/auth/session";
import { getPrefs } from "@/server/prefs";
import { priceLine } from "@/lib/pricing";
import { addLine, getCart } from "@/server/services/cart";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string; needsLogin?: boolean };

const addSchema = z.object({
  variantId: z.uuid(),
  qty: z.coerce.number().int().min(1).max(100_000),
  sample: z.boolean().default(false),
});

/** Add to cart, validating stock, MOQ and sample limits with the shared pricing rules. */
export async function addToCart(input: { variantId: string; qty: number; sample?: boolean }): Promise<ActionResult> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Choose a valid option and quantity." };
  const { variantId, qty, sample } = parsed.data;

  const variant = await db.query.productVariant.findFirst({
    where: eq(schema.productVariant.id, variantId),
    with: { product: { with: { tiers: true, seller: { columns: { status: true } } } } },
  });
  if (!variant || variant.product.status !== "published" || variant.product.seller.status !== "approved")
    return { ok: false, message: "This item is no longer available." };

  const [actor, prefs] = await Promise.all([getActor(), getPrefs()]);
  if (sample && !actor) return { ok: false, message: "Sign in to order samples.", needsLogin: true };
  if (prefs.view === "business" && !sample && !actor?.isBusiness)
    return {
      ok: false,
      message: actor
        ? "Business prices are for verified business accounts. Verify your business, or switch to Retail."
        : "Sign in with a verified business account to buy at business prices, or switch to Retail.",
      needsLogin: !actor,
    };
  const businessTerms = prefs.view === "business" && !sample;

  const p = variant.product;
  const result = priceLine(
    {
      retailPrice: p.retailPrice,
      variantPriceOverride: variant.priceOverride,
      compareAtPrice: p.compareAtPrice,
      moq: p.moq,
      tiers: p.tiers,
      sample: { enabled: p.sampleEnabled, price: p.samplePrice, maxQty: p.sampleMaxQty },
    },
    { qty, isBusinessBuyer: businessTerms, isSample: sample },
  );
  if (result.error) {
    const e = result.error;
    const message =
      e.code === "BELOW_MOQ"
        ? `The minimum order at business prices is ${e.moq} units. Switch to Retail to buy fewer.`
        : e.code === "SAMPLE_MAX"
          ? `You can order up to ${e.max} samples.`
          : e.code === "SAMPLE_UNAVAILABLE"
            ? "This seller doesn't offer samples."
            : "Choose a valid quantity.";
    return { ok: false, message };
  }

  const available = variant.stock - variant.reserved;
  const cart = await getCart(actor?.id ?? null, true);
  const existing = await db.query.cartItem.findFirst({
    where: and(
      eq(schema.cartItem.cartId, cart!.id),
      eq(schema.cartItem.variantId, variantId),
      eq(schema.cartItem.isSample, sample),
    ),
  });
  if ((existing?.qty ?? 0) + qty > available)
    return { ok: false, message: available > 0 ? `Only ${available} left in stock.` : "This option is out of stock." };

  await addLine(cart!.id, variantId, qty, sample);
  refresh();
  return { ok: true, message: sample ? "Sample added to your cart." : `Added ${qty} to your cart.` };
}

export async function toggleWishlist(productId: string): Promise<ActionResult & { saved?: boolean }> {
  if (!z.uuid().safeParse(productId).success) return { ok: false, message: "Invalid product." };
  const actor = await getActor();
  if (!actor) return { ok: false, message: "Sign in to save items to your wishlist.", needsLogin: true };
  const existing = await db.query.wishlistItem.findFirst({
    where: and(eq(schema.wishlistItem.userId, actor.id), eq(schema.wishlistItem.productId, productId)),
  });
  if (existing) {
    await db
      .delete(schema.wishlistItem)
      .where(and(eq(schema.wishlistItem.userId, actor.id), eq(schema.wishlistItem.productId, productId)));
    refresh();
    return { ok: true, message: "Removed from your wishlist.", saved: false };
  }
  await db.insert(schema.wishlistItem).values({ userId: actor.id, productId }).onConflictDoNothing();
  refresh();
  return { ok: true, message: "Saved to your wishlist.", saved: true };
}

const alertSchema = z.object({
  productId: z.uuid(),
  targetMajor: z.number().positive().max(1e9).nullable(),
});

/** Watch a product's price. `targetMajor` is in the shopper's display currency; null = any drop. */
export async function setPriceAlert(input: { productId: string; targetMajor: number | null }): Promise<ActionResult> {
  const parsed = alertSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Enter a valid target price." };
  const actor = await getActor();
  if (!actor) return { ok: false, message: "Sign in to get price alerts.", needsLogin: true };
  const { currency } = await getPrefs();
  const target = parsed.data.targetMajor === null ? null : Math.round(parsed.data.targetMajor * 100);
  await db
    .insert(schema.priceAlert)
    .values({ userId: actor.id, productId: parsed.data.productId, targetPrice: target, currency, active: true })
    .onConflictDoUpdate({
      target: [schema.priceAlert.userId, schema.priceAlert.productId],
      set: { targetPrice: target, currency, active: true, updatedAt: new Date() },
    });
  refresh();
  return {
    ok: true,
    message: target ? "We'll notify you when the price hits your target." : "We'll notify you when the price drops.",
  };
}

export async function removePriceAlert(productId: string): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, message: "Sign in first.", needsLogin: true };
  await db
    .update(schema.priceAlert)
    .set({ active: false })
    .where(and(eq(schema.priceAlert.userId, actor.id), eq(schema.priceAlert.productId, productId)));
  refresh();
  return { ok: true, message: "Price alert removed." };
}

export async function voteHelpful(reviewId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(reviewId).success) return { ok: false, message: "Invalid review." };
  const actor = await getActor();
  if (!actor) return { ok: false, message: "Sign in to vote.", needsLogin: true };
  const review = await db.query.review.findFirst({ where: eq(schema.review.id, reviewId), columns: { userId: true } });
  if (!review) return { ok: false, message: "Review not found." };
  if (review.userId === actor.id) return { ok: false, message: "You can't vote on your own review." };
  const inserted = await db
    .insert(schema.reviewVote)
    .values({ reviewId, userId: actor.id })
    .onConflictDoNothing()
    .returning();
  if (inserted.length) {
    await db
      .update(schema.review)
      .set({ helpfulCount: sql`${schema.review.helpfulCount} + 1` })
      .where(eq(schema.review.id, reviewId));
  }
  refresh();
  return { ok: true, message: "Thanks for your feedback." };
}

export async function reportReview(reviewId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(reviewId).success) return { ok: false, message: "Invalid review." };
  const actor = await getActor();
  if (!actor) return { ok: false, message: "Sign in to report a review.", needsLogin: true };
  await db
    .update(schema.review)
    .set({ status: "reported" })
    .where(and(eq(schema.review.id, reviewId), eq(schema.review.status, "visible")));
  refresh();
  return { ok: true, message: "Thanks — our team will review it." };
}
