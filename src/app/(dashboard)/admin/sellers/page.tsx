import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Sellers", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Sellers" milestone="M6" description="Approve applications and manage badges." />;
}
