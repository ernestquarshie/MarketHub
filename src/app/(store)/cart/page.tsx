import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default function Page() {
  return (
    <ComingSoon
      title="Your cart"
      milestone="M3"
      description="Cart grouped by seller, coupons and all costs shown up front."
    />
  );
}
