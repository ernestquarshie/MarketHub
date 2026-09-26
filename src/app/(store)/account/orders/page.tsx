import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Your orders", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Your orders" milestone="M3" description="Order history with a tracking timeline." />;
}
