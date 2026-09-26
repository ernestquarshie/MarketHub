import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Search results" };

export default function Page() {
  return (
    <ComingSoon
      title="Search results"
      milestone="M2"
      description="Full-text search with filters for price, rating, MOQ, supplier location and more."
    />
  );
}
