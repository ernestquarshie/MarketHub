import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-muted">Shop retail, or upgrade to a business account for bulk pricing and quotes.</p>
      </div>
      <RegisterForm next={next} />
      <p className="border-t border-border pt-5 text-center text-sm text-muted">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
