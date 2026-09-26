import type { Metadata } from "next";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminOverviewPage() {
  const [[users], [sellersPending], [bizPending], [reported], [gmv]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(schema.user),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.seller)
      .where(eq(schema.seller.status, "pending")),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.businessProfile)
      .where(eq(schema.businessProfile.status, "pending")),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.review)
      .where(eq(schema.review.status, "reported")),
    db
      .select({ usd: sql<number>`coalesce(sum(${schema.order.grandTotal} / ${schema.order.fxRateToUsd}), 0)::float` })
      .from(schema.order)
      .where(eq(schema.order.paymentStatus, "paid")),
  ]);

  const kpis = [
    { label: "GMV (paid orders, USD)", value: formatMoney(Math.round(gmv?.usd ?? 0), "USD") },
    { label: "Users", value: users?.n ?? 0 },
    { label: "Seller applications", value: sellersPending?.n ?? 0 },
    { label: "Business verifications", value: bizPending?.n ?? 0 },
    { label: "Reported reviews", value: reported?.n ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Overview</h1>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((k) => (
          <li key={k.label} className="rounded-lg border border-border bg-bg p-5">
            <p className="text-sm text-muted">{k.label}</p>
            <p className="mt-1 text-3xl font-bold tabular">{k.value}</p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">Charts, approval queues and management tools are built in milestone M6.</p>
    </div>
  );
}
