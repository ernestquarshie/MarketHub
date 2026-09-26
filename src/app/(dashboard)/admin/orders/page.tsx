import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Orders", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Orders" milestone="M6" description="Search orders, update status and refund." />;
}
