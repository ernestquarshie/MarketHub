import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Business verifications", robots: { index: false } };

export default function Page() {
  return (
    <ComingSoon title="Business verifications" milestone="M6" description="Review business account applications." />
  );
}
