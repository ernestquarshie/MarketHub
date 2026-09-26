import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Notifications" milestone="M3" description="Order, quote and price-drop updates." />;
}
