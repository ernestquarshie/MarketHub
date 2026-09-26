import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Globe2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActor } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Sell on MarketHub",
  description: "Reach retail shoppers and business buyers across Ghana, Nigeria and worldwide.",
};

const POINTS = [
  {
    icon: Globe2,
    title: "Retail and wholesale in one listing",
    sub: "Set a retail price plus tiered bulk prices and MOQs.",
  },
  {
    icon: Wallet,
    title: "Local and global payments",
    sub: "Mobile money, cards and pay-on-delivery, handled for you.",
  },
  { icon: BadgeCheck, title: "Earn trust badges", sub: "Verified and Star Seller badges help buyers choose you." },
];

export default async function SellerApplyPage() {
  const actor = await getActor();
  return (
    <div className="container-page grid gap-10 py-12 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <h1 className="text-4xl leading-tight font-extrabold">Sell to shoppers and businesses on MarketHub</h1>
        <p className="text-lg text-muted">
          List once, sell retail and wholesale, and get paid in cedis, naira or dollars.
        </p>
        <ul className="flex flex-col gap-4">
          {POINTS.map((p) => (
            <li key={p.title} className="flex gap-3">
              <p.icon className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
              <span>
                <strong className="block">{p.title}</strong>
                <span className="text-muted">{p.sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col justify-center gap-4 rounded-lg border border-border bg-surface p-8">
        <h2 className="text-xl font-bold">Start your application</h2>
        <p className="text-muted">The seller application form arrives in milestone M5 (Seller Centre).</p>
        {actor ? (
          actor.sellerId ? (
            <Button asChild>
              <Link href="/seller">Go to Seller Centre</Link>
            </Button>
          ) : (
            <Button disabled>Application form coming in M5</Button>
          )
        ) : (
          <Button asChild>
            <Link href="/register?next=/seller/apply">Create an account to apply</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
