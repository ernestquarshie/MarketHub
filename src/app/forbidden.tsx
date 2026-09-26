import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function Forbidden() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <Logo />
      <p className="text-sm font-semibold tracking-wide text-muted uppercase">Error 403</p>
      <h1 className="text-3xl font-bold">You don&apos;t have access to this page</h1>
      <p className="max-w-md text-muted">
        This area is for a different kind of account. If you think this is a mistake, sign in with the right account.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-md bg-primary px-5 font-semibold text-primary-fg no-underline hover:no-underline"
        >
          Go to the homepage
        </Link>
        <Link
          href="/account"
          className="inline-flex h-11 items-center rounded-md border border-border-strong px-5 font-semibold text-text no-underline hover:no-underline"
        >
          Your account
        </Link>
      </div>
    </main>
  );
}
