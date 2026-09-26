import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Wishlist" milestone="M2" description="Saved items and price alerts." />;
}
