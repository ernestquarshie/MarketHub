import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Top suppliers" };

export default function Page() {
  return (
    <ComingSoon title="Top suppliers" milestone="M2" description="Browse verified sellers and their storefronts." />
  );
}
