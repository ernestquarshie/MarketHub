import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Categories", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Categories" milestone="M6" description="Edit the category tree and filter attributes." />;
}
