import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Promotions", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Promotions" milestone="M6" description="Coupons, flash deals and banners." />;
}
