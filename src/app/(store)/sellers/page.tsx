import type { Metadata } from "next";
import { getTopSellers } from "@/server/queries/catalog";
import { SellerCard } from "@/components/store/seller-card";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export const metadata: Metadata = {
  title: "Top suppliers",
  description: "Verified sellers and manufacturers on MarketHub, rated by buyers.",
  alternates: { canonical: "/sellers" },
};

export default async function SellersPage() {
  const sellers = await getTopSellers(60);
  return (
    <div className="container-page flex flex-col gap-6 py-6">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Top suppliers" }]} />
      <h1 className="text-3xl font-bold">Top suppliers</h1>
      <p className="max-w-2xl text-muted">
        Verified sellers have passed business checks. Star Sellers keep high ratings, fast replies and on-time delivery.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sellers.map((s) => (
          <li key={s.id}>
            <SellerCard seller={s} />
          </li>
        ))}
      </ul>
    </div>
  );
}
