import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 34" aria-hidden className={cn("size-8", className)}>
      <rect width="34" height="34" rx="9" fill="var(--primary)" />
      <path
        d="M9 23V12l8 6 8-6v11"
        fill="none"
        stroke="var(--primary-fg)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="MarketHub home"
      className={cn("flex shrink-0 items-center gap-2.5 text-text no-underline", className)}
    >
      <LogoMark />
      <span className="font-display text-xl font-extrabold tracking-tight">MarketHub</span>
    </Link>
  );
}
