import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "RFQs", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="RFQs" milestone="M5" description="Respond to buyers' requests for quote." />;
}
