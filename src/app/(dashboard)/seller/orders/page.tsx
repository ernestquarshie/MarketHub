import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Orders", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Orders" milestone="M5" description="Fulfil orders and add tracking numbers." />;
}
