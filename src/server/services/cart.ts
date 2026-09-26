import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { GUEST_CART_COOKIE } from "@/server/queries/layout";

/** Find the current cart (user's, or guest's by cookie); optionally create it. */
export async function getCart(userId: string | null, create = false) {
  const jar = await cookies();
  if (userId) {
    const existing = await db.query.cart.findFirst({ where: eq(schema.cart.userId, userId) });
    if (existing || !create) return existing ?? null;
    const [row] = await db.insert(schema.cart).values({ userId }).onConflictDoNothing().returning();
    return row ?? (await db.query.cart.findFirst({ where: eq(schema.cart.userId, userId) }))!;
  }
  const token = jar.get(GUEST_CART_COOKIE)?.value;
  if (token) {
    const existing = await db.query.cart.findFirst({ where: eq(schema.cart.guestToken, token) });
    if (existing || !create) return existing ?? null;
  }
  if (!create) return null;
  const newToken = randomUUID();
  const [row] = await db.insert(schema.cart).values({ guestToken: newToken }).returning();
  jar.set(GUEST_CART_COOKIE, newToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return row!;
}

/** Add qty of a variant, merging with an existing line of the same kind (sample vs normal). */
export async function addLine(cartId: string, variantId: string, qty: number, isSample: boolean) {
  const existing = await db.query.cartItem.findFirst({
    where: and(
      eq(schema.cartItem.cartId, cartId),
      eq(schema.cartItem.variantId, variantId),
      eq(schema.cartItem.isSample, isSample),
    ),
  });
  if (existing) {
    const [row] = await db
      .update(schema.cartItem)
      .set({ qty: existing.qty + qty })
      .where(eq(schema.cartItem.id, existing.id))
      .returning();
    return row!;
  }
  const [row] = await db.insert(schema.cartItem).values({ cartId, variantId, qty, isSample }).returning();
  return row!;
}
