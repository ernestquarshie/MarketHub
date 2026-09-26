import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Product details" };

export default function Page() {
  return (
    <ComingSoon
      title="Product details"
      milestone="M2"
      description="Gallery, variants, retail and bulk buy boxes, reviews and recommendations."
    />
  );
}
