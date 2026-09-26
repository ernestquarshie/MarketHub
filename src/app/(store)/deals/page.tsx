import type { Metadata } from "next";
import Link from "next/link";
import { Zap } from "lucide-react";
import { getPrefs } from "@/server/prefs";
import { getActiveDeals, getRates } from "@/server/queries/catalog";
import { DealCard } from "@/components/store/deal-card";
import { Countdown } from "@/components/product/countdown";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export const metadata: Metadata = {
  title: "Today's Deals",
  description: "Limited-time flash deals from verified sellers. Real countdowns, real stock limits.",
  alternates: { canonical: "/deals" },
};

export default async function DealsPage() {
  const [prefs, rates, deals] = await Promise.all([getPrefs(), getRates(), getActiveDeals(48)]);
  return (
    <div className="container-page flex flex-col gap-6 py-6">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Today's Deals" }]} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-deal">
          <Zap className="size-7 fill-current" aria-hidden /> Today&apos;s Deals
        </h1>
        {deals[0] ? (
          <span className="rounded-full bg-deal-soft px-3 py-1 text-sm font-semibold text-deal-strong">
            Next deal ends in <Countdown endsAt={deals[0].endsAt.toISOString()} />
          </span>
        ) : null}
      </div>
      <p className="max-w-2xl text-muted">
        Every deal has a real end time and a limited number of units. When a deal sells out or ends, the price goes back
        to normal.
      </p>
      {deals.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {deals.map((d) => (
            <li key={d.card.id}>
              <DealCard card={d.card} claimedPct={d.claimedPct} currency={prefs.currency} rates={rates} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border-strong p-10 text-center text-muted">
          No deals are running right now. <Link href="/search">Browse all products</Link>.
        </p>
      )}
    </div>
  );
}
