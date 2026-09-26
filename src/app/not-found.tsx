import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <Logo />
      <p className="text-sm font-semibold tracking-wide text-muted uppercase">Error 404</p>
      <h1 className="text-3xl font-bold">We couldn&apos;t find that page</h1>
      <p className="max-w-md text-muted">The link may be broken, or the page may have moved.</p>
      <form action="/search" role="search" className="flex w-full max-w-md gap-2">
        <label htmlFor="nf-q" className="sr-only">
          Search MarketHub
        </label>
        <input
          id="nf-q"
          name="q"
          type="search"
          placeholder="Search products"
          className="h-11 flex-1 rounded-md border border-border-strong bg-bg px-3"
        />
        <button type="submit" className="h-11 rounded-md bg-primary px-5 font-semibold text-primary-fg">
          Search
        </button>
      </form>
      <Link href="/">Go to the homepage</Link>
    </main>
  );
}
