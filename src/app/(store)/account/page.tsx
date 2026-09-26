import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Building2, FileText, Heart, MapPin, MessageSquare, Package, UserRound } from "lucide-react";
import { requireActor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

const TILES = [
  { href: "/account/orders", icon: Package, title: "Your orders", sub: "Track, return or buy again" },
  { href: "/account/wishlist", icon: Heart, title: "Wishlist", sub: "Saved items and price alerts" },
  { href: "/account/messages", icon: MessageSquare, title: "Messages", sub: "Conversations with sellers" },
  { href: "/account/rfqs", icon: FileText, title: "Requests for quote", sub: "Compare supplier quotes" },
  { href: "/account/addresses", icon: MapPin, title: "Addresses", sub: "Delivery addresses" },
  { href: "/account/profile", icon: UserRound, title: "Login & security", sub: "Name, email and password" },
  { href: "/account/business", icon: Building2, title: "Business account", sub: "Bulk pricing and verification" },
  { href: "/account/notifications", icon: Bell, title: "Notifications", sub: "Order and quote updates" },
] as const;

export default async function AccountPage() {
  const actor = await requireActor("/account");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-3xl font-bold">Your account</h1>
        {actor.isBusiness ? (
          <span className="rounded-full bg-business-soft px-2.5 py-1 text-xs font-semibold text-business">
            Verified business
          </span>
        ) : null}
      </div>
      <p className="text-muted">
        Signed in as <strong className="text-text">{actor.name}</strong> ({actor.email})
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href as never}
              className="flex h-full items-start gap-3 rounded-lg border border-border p-5 text-text no-underline transition-shadow hover:no-underline hover:shadow-[var(--shadow-card)]"
            >
              <t.icon className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold">{t.title}</span>
                <span className="text-sm text-muted">{t.sub}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">Orders, wishlist, messages and quotes are built in milestones M2–M4.</p>
    </div>
  );
}
