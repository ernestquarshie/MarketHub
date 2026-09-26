import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Messages" milestone="M4" description="Conversations with sellers." />;
}
