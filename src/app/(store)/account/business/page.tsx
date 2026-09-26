import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Business account", robots: { index: false } };

export default function Page() {
  return (
    <ComingSoon
      title="Business account"
      milestone="M4"
      description="Verify your business for bulk pricing, RFQs and samples."
    />
  );
}
