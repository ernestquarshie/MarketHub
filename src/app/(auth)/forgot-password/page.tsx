import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-sm text-muted">Enter your email and we&apos;ll send you a link to choose a new password.</p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm">
        <Link href="/login">Back to sign in</Link>
      </p>
    </div>
  );
}
