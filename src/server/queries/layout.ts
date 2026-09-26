import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { asc, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getActor } from "@/server/auth/session";

export interface CategoryNode {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  children: { id: string; slug: string; name: string }[];
}

export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  const rows = await db.query.category.findMany({
    where: isNull(schema.category.parentId),
    orderBy: asc(schema.category.sortOrder),
    columns: { id: true, slug: true, name: true, imageUrl: true },
    with: { children: { columns: { id: true, slug: true, name: true }, orderBy: asc(schema.category.sortOrder) } },
  });
  return rows;
});

export const GUEST_CART_COOKIE = "mh_cart";

/** Total quantity in the current user's (or guest's) cart. */
export const getCartCount = cache(async (): Promise<number> => {
  const actor = await getActor();
  const guestToken = (await cookies()).get(GUEST_CART_COOKIE)?.value;
  const where = actor ? eq(schema.cart.userId, actor.id) : guestToken ? eq(schema.cart.guestToken, guestToken) : null;
  if (!where) return 0;
  const [row] = await db
    .select({ n: sql<number>`coalesce(sum(${schema.cartItem.qty}), 0)::int` })
    .from(schema.cart)
    .leftJoin(schema.cartItem, eq(schema.cartItem.cartId, schema.cart.id))
    .where(where);
  return row?.n ?? 0;
});

export const getUnreadNotificationCount = cache(async (): Promise<number> => {
  const actor = await getActor();
  if (!actor) return 0;
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.notification)
    .where(sql`${schema.notification.userId} = ${actor.id} and ${schema.notification.readAt} is null`);
  return row?.n ?? 0;
});
