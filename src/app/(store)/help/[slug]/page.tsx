import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Help centre" };

export default function Page() {
  return <ComingSoon title="Help centre" milestone="M7" description="Help, privacy, terms and cookie pages." />;
}
