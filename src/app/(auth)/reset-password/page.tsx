import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p role="alert" className="text-sm text-danger">
          This reset link is missing its token. <Link href="/forgot-password">Request a new link</Link>.
        </p>
      )}
    </div>
  );
}
