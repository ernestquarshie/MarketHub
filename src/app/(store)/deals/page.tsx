import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Today's Deals" };

export default function Page() {
  return <ComingSoon title="Today's Deals" milestone="M2" description="Flash deals with honest countdowns." />;
}
