import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Request a quote" };

export default function Page() {
  return (
    <ComingSoon
      title="Request a quote"
      milestone="M4"
      description="Post one request and compare quotes from verified suppliers."
    />
  );
}
