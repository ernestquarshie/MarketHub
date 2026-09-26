import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Products", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Products" milestone="M6" description="Moderate and feature products." />;
}
