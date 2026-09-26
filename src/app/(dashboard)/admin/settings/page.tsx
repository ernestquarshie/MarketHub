import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default function Page() {
  return (
    <ComingSoon
      title="Settings"
      milestone="M6"
      description="Currencies, shipping zones, pickup stations and payments."
    />
  );
}
