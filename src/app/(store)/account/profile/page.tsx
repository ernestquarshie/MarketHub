import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Login & security", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Login & security" milestone="M3" description="Update your name, email and password." />;
}
