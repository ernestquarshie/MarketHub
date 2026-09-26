import Link from "next/link";
import { CreditCard, MapPin, RotateCcw, ShieldCheck, Smartphone } from "lucide-react";

const TRUST = [
  { icon: ShieldCheck, title: "Protected orders", sub: "Refund if it doesn't arrive as described" },
  { icon: MapPin, title: "Pickup stations", sub: "Collect near you and pay less" },
  { icon: Smartphone, title: "Mobile money", sub: "MTN, Telecel and AirtelTigo" },
  { icon: CreditCard, title: "Cards worldwide", sub: "Visa, Mastercard, Amex" },
  { icon: RotateCcw, title: "Easy returns", sub: "Within the seller's return window" },
];

const COLUMNS = [
  {
    title: "Shop",
    links: [
      ["Today's Deals", "/deals"],
      ["Ready to Ship", "/search?readyToShip=1"],
      ["New arrivals", "/search?sort=newest"],
    ],
  },
  {
    title: "Business",
    links: [
      ["Request a quote", "/rfq/new"],
      ["Business account", "/account/business"],
      ["Top suppliers", "/sellers"],
    ],
  },
  {
    title: "Sell",
    links: [
      ["Become a seller", "/seller/apply"],
      ["Seller Centre", "/seller"],
      ["Seller policies", "/help/seller-policies"],
    ],
  },
  {
    title: "Help",
    links: [
      ["Track an order", "/account/orders"],
      ["Returns & refunds", "/help/returns"],
      ["Pickup stations", "/help/pickup-stations"],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16">
      <section aria-label="Why shop with us" className="container-page">
        <ul className="grid grid-cols-1 gap-4 rounded-lg bg-surface p-5 sm:grid-cols-2 lg:grid-cols-5">
          {TRUST.map((t) => (
            <li key={t.title} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg text-primary">
                <t.icon className="size-5" aria-hidden />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{t.title}</span>
                <span className="text-xs text-muted">{t.sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <div className="mt-10 bg-ink text-sm text-slate-300">
        <div className="container-page grid grid-cols-2 gap-8 py-11 md:grid-cols-5">
          <div className="col-span-2 flex flex-col gap-2.5 md:col-span-1">
            <span className="font-display text-xl font-extrabold text-white">MarketHub</span>
            <p className="leading-relaxed">Retail and wholesale from verified sellers in Africa and worldwide.</p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-2.5">
              <h2 className="font-sans text-sm font-bold text-white">{col.title}</h2>
              <ul className="flex flex-col gap-2.5">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href as never} className="text-slate-300 hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10">
          <div className="container-page flex flex-col gap-2 py-5 text-[13px] text-slate-400 sm:flex-row sm:justify-between">
            <span>© {new Date().getFullYear()} MarketHub · Demo project. All sellers and brands are fictional.</span>
            <span className="flex gap-4">
              <Link href={"/help/privacy" as never} className="text-slate-400 hover:text-white">
                Privacy
              </Link>
              <Link href={"/help/terms" as never} className="text-slate-400 hover:text-white">
                Terms
              </Link>
              <Link href={"/help/cookies" as never} className="text-slate-400 hover:text-white">
                Cookies
              </Link>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
