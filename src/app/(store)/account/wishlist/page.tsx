import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { BellRing, Heart } from "lucide-react";
import { db, schema } from "@/server/db";
import { requireActor } from "@/server/auth/session";
import { getPrefs } from "@/server/prefs";
import { getProductCardsByIds, getRates } from "@/server/queries/catalog";
import { ProductCard } from "@/components/store/product-card";
import { WishlistRemove } from "@/components/product/wishlist-remove";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const actor = await requireActor("/account/wishlist");
  const [prefs, rates, saved, alerts] = await Promise.all([
    getPrefs(),
    getRates(),
    db
      .select({ productId: schema.wishlistItem.productId })
      .from(schema.wishlistItem)
      .where(eq(schema.wishlistItem.userId, actor.id))
      .orderBy(desc(schema.wishlistItem.createdAt)),
    db.query.priceAlert.findMany({
      where: and(eq(schema.priceAlert.userId, actor.id), eq(schema.priceAlert.active, true)),
    }),
  ]);
  const ids = [...new Set([...saved.map((s) => s.productId), ...alerts.map((a) => a.productId)])];
  const cards = await getProductCardsByIds(ids);
  const savedSet = new Set(saved.map((s) => s.productId));
  const alertBy = new Map(alerts.map((a) => [a.productId, a]));

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ name: "Your account", href: "/account" }, { name: "Wishlist" }]} />
      <h1 className="text-3xl font-bold">Wishlist &amp; price alerts</h1>
      {cards.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {cards.map((c) => {
            const alert = alertBy.get(c.id);
            return (
              <li key={c.id} className="flex flex-col gap-2">
                <ProductCard product={c} currency={prefs.currency} rates={rates} view={prefs.view} />
                {alert ? (
                  <p className="flex items-center gap-1.5 text-xs text-primary">
                    <BellRing className="size-3.5" aria-hidden />
                    {alert.targetPrice
                      ? `Alert at ${formatMoney(alert.targetPrice, alert.currency)}`
                      : "Alert on any price drop"}
                  </p>
                ) : null}
                {savedSet.has(c.id) ? <WishlistRemove productId={c.id} /> : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong p-12 text-center">
          <Heart className="size-10 text-muted" aria-hidden />
          <p className="font-semibold">Your wishlist is empty</p>
          <p className="text-sm text-muted">
            Tap the heart on any product, or use “Watch price” to get an alert when it drops.
          </p>
          <Link href="/search" className="font-semibold">
            Start browsing
          </Link>
        </div>
      )}
    </div>
  );
}
