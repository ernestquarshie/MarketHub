import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Category" };

export default function Page() {
  return (
    <ComingSoon
      title="Category"
      milestone="M2"
      description="Category pages with facets, sorting and business pricing."
    />
  );
}
