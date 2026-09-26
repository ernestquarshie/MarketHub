import type { Metadata } from "next";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireActor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Seller Centre", robots: { index: false } };

export default async function SellerDashboardPage() {
  const actor = await requireActor("/seller");
  const sellerId = actor.sellerId!;
  const [store, [products], [toShip], [openRfqs]] = await Promise.all([
    db.query.seller.findFirst({
      where: eq(schema.seller.id, sellerId),
      columns: { name: true, ratingAvg: true, ratingCount: true },
    }),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.product)
      .where(eq(schema.product.sellerId, sellerId)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.sellerOrder)
      .where(
        and(eq(schema.sellerOrder.sellerId, sellerId), inArray(schema.sellerOrder.status, ["paid", "processing"])),
      ),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.rfq)
      .where(eq(schema.rfq.status, "open")),
  ]);

  const kpis = [
    { label: "Listed products", value: products?.n ?? 0 },
    { label: "Orders to ship", value: toShip?.n ?? 0 },
    { label: "Open RFQs on MarketHub", value: openRfqs?.n ?? 0 },
    { label: "Store rating", value: store ? `${store.ratingAvg.toFixed(1)} (${store.ratingCount})` : "—" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{store?.name ?? "Your store"}</h1>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <li key={k.label} className="rounded-lg border border-border bg-bg p-5">
            <p className="text-sm text-muted">{k.label}</p>
            <p className="mt-1 text-3xl font-bold tabular">{k.value}</p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">
        The full Seller Centre (products, inventory, orders, RFQs, messages) is built in milestone M5.
      </p>
    </div>
  );
}
