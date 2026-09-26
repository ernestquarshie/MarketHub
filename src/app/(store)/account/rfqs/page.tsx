import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Requests for quote", robots: { index: false } };

export default function Page() {
  return (
    <ComingSoon title="Requests for quote" milestone="M4" description="Your RFQs and the quotes suppliers have sent." />
  );
}
