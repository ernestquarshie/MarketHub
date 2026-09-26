import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Logo } from "./logo";
import { signOutAction } from "@/server/actions/auth";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Shared shell for Seller Centre and Admin: top bar + sidebar. */
export function DashboardShell({
  area,
  userName,
  nav,
  children,
}: {
  area: string;
  userName: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg"
      >
        Skip to content
      </a>
      <header className="flex h-16 items-center gap-4 border-b border-border bg-bg px-4 md:px-6">
        <Logo />
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">{area}</span>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <Link href="/" className="hidden sm:inline">
            View store
          </Link>
          <span className="hidden text-muted md:inline">{userName}</span>
          <form action={signOutAction}>
            <button type="submit" className="min-h-9 rounded-md px-2 font-semibold hover:bg-surface">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <nav
          aria-label={`${area} navigation`}
          className="border-b border-border bg-bg md:w-60 md:border-r md:border-b-0"
        >
          <ul className="flex gap-1 overflow-x-auto p-2 md:flex-col md:p-3">
            {nav.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href as never}
                  className="flex min-h-10 items-center gap-2.5 rounded-md px-3 text-sm font-medium whitespace-nowrap text-text no-underline hover:bg-surface hover:no-underline"
                >
                  <n.icon className="size-4 text-muted" aria-hidden />
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main id="main" className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
