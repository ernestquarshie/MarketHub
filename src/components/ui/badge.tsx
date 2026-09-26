import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-semibold", {
  variants: {
    tone: {
      verified: "bg-primary-soft text-primary-hover dark:text-primary",
      star: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
      deal: "bg-deal text-white",
      "deal-soft": "bg-deal-soft text-deal-strong",
      business: "bg-business-soft text-business",
      neutral: "bg-surface-2 text-text",
      success: "bg-primary-soft text-success",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
