"use client";

import { ChevronDown, ShieldCheck, Store, Briefcase, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { signInAsDemo } from "@/server/actions/demo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLES = [
  { role: "shopper", label: "Shopper", sub: "Ama · retail buyer in Accra", icon: ShoppingBag },
  { role: "business", label: "Business buyer", sub: "Chidi · bulk buyer in Lagos", icon: Briefcase },
  { role: "seller", label: "Seller", sub: "Kwame · VoltHub store", icon: Store },
  { role: "admin", label: "Admin", sub: "Efua · platform operator", icon: ShieldCheck },
] as const;

export function DemoBar({ demoMode }: { demoMode: boolean }) {
  const [pending, startTransition] = useTransition();
  const switchTo = (role: string) => {
    const fd = new FormData();
    fd.set("role", role);
    startTransition(() => signInAsDemo(fd));
  };
  return (
    <div className="bg-ink text-[13px] text-ink-fg">
      <div className="container-page flex min-h-9 items-center justify-between gap-4 py-1">
        <p className="flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-[#34d3a6]">Demo</span>
          <span className="hidden sm:inline">Payments run in test mode. No real money moves.</span>
          <span className="sm:hidden">Test-mode payments</span>
        </p>
        <div className="flex items-center gap-5">
          {demoMode ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex min-h-8 items-center gap-1 rounded-md px-2 font-semibold hover:bg-white/10"
                  aria-busy={pending}
                >
                  {pending ? "Switching…" : "Try as…"} <ChevronDown className="size-4" aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Sign in as a demo user</DropdownMenuLabel>
                  {ROLES.map((r) => (
                    <DropdownMenuItem key={r.role} onSelect={() => switchTo(r.role)}>
                      <r.icon aria-hidden className="text-primary" />
                      <span className="flex flex-col">
                        <span className="font-semibold">{r.label}</span>
                        <span className="text-xs text-muted">{r.sub}</span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}
          <Link href="/seller/apply" className="hidden text-ink-fg hover:text-white md:inline">
            Sell on MarketHub
          </Link>
          <Link href="/account/orders" className="hidden text-ink-fg hover:text-white md:inline">
            Track an order
          </Link>
        </div>
      </div>
    </div>
  );
}
