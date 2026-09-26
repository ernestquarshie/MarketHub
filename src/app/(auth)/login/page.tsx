import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const notice = sp.reset === "1" ? "Your password has been changed. Sign in with your new password." : undefined;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="text-sm text-muted">Track orders, save items and get quotes from suppliers.</p>
      </div>
      <LoginForm next={next} notice={notice} />
      {process.env.DEMO_MODE === "true" ? (
        <p className="rounded-md bg-surface px-3 py-2.5 text-xs leading-relaxed text-muted">
          Demo: use <strong className="text-text">Try as…</strong> in the top bar, or sign in with{" "}
          <code className="text-text">shopper@demo.markethub.test</code> / <code className="text-text">Demo1234!</code>
        </p>
      ) : null}
      <p className="border-t border-border pt-5 text-center text-sm text-muted">
        New to MarketHub?{" "}
        <Link href={next ? (`/register?next=${encodeURIComponent(next)}` as never) : "/register"}>
          Create an account
        </Link>
      </p>
    </div>
  );
}
