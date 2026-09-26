"use client";

import Link from "next/link";
import { Menu, ChevronRight } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { CategoryNode } from "@/server/queries/layout";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { href: "/deals", label: "Today's Deals" },
  { href: "/search?readyToShip=1", label: "Ready to Ship" },
  { href: "/rfq/new", label: "Request a Quote" },
  { href: "/sellers", label: "Top Suppliers" },
  { href: "/seller/apply", label: "Sell on MarketHub" },
] as const;

/** "All categories" drawer. Doubles as the mobile navigation. */
export function CategoryMenu({
  categories,
  variant = "desktop",
}: {
  categories: CategoryNode[];
  variant?: "desktop" | "mobile";
}) {
  return (
    <Sheet>
      <SheetTrigger
        className={cn(
          "flex items-center gap-2 rounded-md font-semibold text-text",
          variant === "desktop" ? "min-h-9 px-1 text-sm hover:bg-surface" : "size-11 justify-center hover:bg-surface",
        )}
        aria-label={variant === "mobile" ? "Open menu" : undefined}
      >
        <Menu className="size-5" aria-hidden />
        {variant === "desktop" ? "All categories" : null}
      </SheetTrigger>
      <SheetContent side="left" title="Shop by category">
        <nav aria-label="Categories" className="flex flex-col py-2">
          {variant === "mobile" ? (
            <ul className="border-b border-border pb-2">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <SheetClose asChild>
                    <Link
                      href={l.href as never}
                      className="flex min-h-11 items-center px-4 text-[15px] font-semibold text-text"
                    >
                      {l.label}
                    </Link>
                  </SheetClose>
                </li>
              ))}
            </ul>
          ) : null}
          {categories.map((c) => (
            <details key={c.id} className="group border-b border-border last:border-b-0">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-[15px] font-semibold text-text marker:hidden hover:bg-surface">
                {c.name}
                <ChevronRight className="size-4 text-muted transition-transform group-open:rotate-90" aria-hidden />
              </summary>
              <ul className="pb-2">
                <li>
                  <SheetClose asChild>
                    <Link
                      href={`/c/${c.slug}`}
                      className="flex min-h-10 items-center px-6 text-sm font-semibold text-primary"
                    >
                      All {c.name}
                    </Link>
                  </SheetClose>
                </li>
                {c.children.map((ch) => (
                  <li key={ch.id}>
                    <SheetClose asChild>
                      <Link
                        href={`/c/${ch.slug}`}
                        className="flex min-h-10 items-center px-6 text-sm text-text hover:bg-surface"
                      >
                        {ch.name}
                      </Link>
                    </SheetClose>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
