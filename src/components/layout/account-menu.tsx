"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Heart,
  Bell,
  Store,
  ShieldCheck,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/server/actions/auth";

export interface AccountMenuUser {
  name: string;
  role: "customer" | "seller" | "admin";
  isBusiness: boolean;
  hasSellerStore: boolean;
}

export function AccountMenu({ user }: { user: AccountMenuUser | null }) {
  if (!user) {
    return (
      <Link href="/login" className="flex flex-col leading-tight text-text no-underline hover:no-underline">
        <span className="text-xs text-muted">Hello, sign in</span>
        <span className="text-sm font-semibold whitespace-nowrap">Account &amp; orders</span>
      </Link>
    );
  }
  return <SignedInMenu user={user} />;
}

function SignedInMenu({ user }: { user: AccountMenuUser }) {
  const [, startTransition] = useTransition();
  const first = user.name.split(" ")[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 rounded-md px-1 text-left leading-tight hover:bg-surface">
        <span className="flex flex-col">
          <span className="text-xs text-muted">Hello, {first}</span>
          <span className="text-sm font-semibold whitespace-nowrap">Account &amp; orders</span>
        </span>
        <ChevronDown className="size-4 text-muted" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          {user.name}
          {user.isBusiness ? " · Business" : ""}
        </DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/account">
            <LayoutDashboard aria-hidden /> Your account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/orders">
            <Package aria-hidden /> Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/wishlist">
            <Heart aria-hidden /> Wishlist
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/messages">
            <MessageSquare aria-hidden /> Messages
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/rfqs">
            <FileText aria-hidden /> Requests for quote
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/notifications">
            <Bell aria-hidden /> Notifications
          </Link>
        </DropdownMenuItem>
        {user.role === "seller" || user.role === "admin" ? <DropdownMenuSeparator /> : null}
        {user.role === "seller" ? (
          <DropdownMenuItem asChild>
            <Link href="/seller">
              <Store aria-hidden /> Seller Centre
            </Link>
          </DropdownMenuItem>
        ) : null}
        {user.role === "admin" ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldCheck aria-hidden /> Admin
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => startTransition(() => signOutAction())}>
          <LogOut aria-hidden /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
