import Link from "next/link";
import { Heart, MapPin, ShoppingCart } from "lucide-react";
import { getActor } from "@/server/auth/session";
import { getPrefs } from "@/server/prefs";
import { getCartCount, getCategoryTree } from "@/server/queries/layout";
import { Logo } from "./logo";
import { SearchBar } from "./search-bar";
import { CurrencySwitcher, PricingViewToggle } from "./prefs-controls";
import { AccountMenu } from "./account-menu";
import { CategoryMenu } from "./category-menu";
import { DemoBar } from "./demo-bar";

const NAV = [
  { href: "/deals", label: "Today's Deals", className: "text-deal font-semibold" },
  { href: "/search?readyToShip=1", label: "Ready to Ship", className: "text-text" },
  { href: "/rfq/new", label: "Request a Quote", className: "text-business font-semibold" },
  { href: "/sellers", label: "Top Suppliers", className: "text-text" },
  { href: "/search?sort=newest", label: "New Arrivals", className: "text-text" },
] as const;

export async function SiteHeader() {
  const [actor, prefs, categories, cartCount] = await Promise.all([
    getActor(),
    getPrefs(),
    getCategoryTree(),
    getCartCount(),
  ]);
  const demoMode = process.env.DEMO_MODE === "true";

  return (
    <header className="border-b border-border bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg"
      >
        Skip to content
      </a>
      <DemoBar demoMode={demoMode} />

      {/* Main row */}
      <div className="container-page flex flex-wrap items-center gap-x-4 gap-y-3 py-3 lg:flex-nowrap lg:gap-6 lg:py-3.5">
        <div className="flex items-center gap-1 lg:hidden">
          <CategoryMenu categories={categories} variant="mobile" />
        </div>
        <Logo />
        <div className="order-last w-full lg:order-none lg:flex-1">
          <SearchBar categories={categories} />
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:gap-4">
          <CurrencySwitcher current={prefs.currency} className="hidden sm:flex" />
          <div className="hidden md:block">
            <AccountMenu
              user={
                actor
                  ? {
                      name: actor.name,
                      role: actor.role,
                      isBusiness: actor.isBusiness,
                      hasSellerStore: !!actor.sellerId,
                    }
                  : null
              }
            />
          </div>
          <Link
            href="/account/wishlist"
            aria-label="Wishlist"
            className="hidden size-11 items-center justify-center rounded-md text-text hover:bg-surface sm:flex"
          >
            <Heart className="size-6" aria-hidden />
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            className="relative flex min-h-11 items-center gap-1.5 rounded-md px-2 text-text no-underline hover:bg-surface hover:no-underline"
          >
            <ShoppingCart className="size-6" aria-hidden />
            <span className="hidden pl-1 text-sm font-semibold sm:inline">Cart</span>
            <span className="absolute -top-0.5 left-5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-fg tabular">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          </Link>
          <div className="md:hidden">
            <Link href={actor ? "/account" : "/login"} className="text-sm font-semibold">
              {actor ? "Account" : "Sign in"}
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary nav (desktop) */}
      <nav aria-label="Primary" className="hidden border-t border-surface-2 lg:block">
        <div className="container-page flex h-11 items-center gap-7 text-sm">
          <CategoryMenu categories={categories} />
          {NAV.map((n) => (
            <Link key={n.href} href={n.href as never} className={n.className}>
              {n.label}
            </Link>
          ))}
          <PricingViewToggle current={prefs.view} className="ml-auto" />
          <span className="flex items-center gap-1.5 text-muted">
            <MapPin className="size-4" aria-hidden />
            Deliver to{" "}
            <strong className="text-text">
              {prefs.currency === "NGN" ? "Lagos, NG" : prefs.currency === "USD" ? "United States" : "Accra, GH"}
            </strong>
          </span>
        </div>
      </nav>

      {/* Compact prefs row (mobile/tablet) */}
      <div className="border-t border-surface-2 lg:hidden">
        <div className="container-page flex items-center justify-between gap-3 py-2">
          <CurrencySwitcher current={prefs.currency} className="sm:hidden" />
          <PricingViewToggle current={prefs.view} className="ml-auto" />
        </div>
      </div>
    </header>
  );
}
