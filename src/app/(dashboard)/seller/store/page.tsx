import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Storefront", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Storefront" milestone="M5" description="Edit your banner, story and policies." />;
}
