import { cn } from "@/lib/utils";

const STAR = "M9 1l2.4 5 5.4.7-4 3.8 1 5.3L9 13.3l-4.8 2.5 1-5.3-4-3.8 5.4-.7z";

function Row({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 18" className={className} aria-hidden>
      {[0, 20, 40, 60, 80].map((x) => (
        <path key={x} d={STAR} transform={`translate(${x} 0)`} />
      ))}
    </svg>
  );
}

/** 5-star rating display with fractional fill. */
export function RatingStars({
  value,
  size = "sm",
  className,
}: {
  value: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const dims = size === "md" ? "h-[17px] w-[92px]" : "h-[14px] w-[76px]";
  return (
    <span
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
      className={cn("relative inline-block", dims, className)}
    >
      <Row className={cn("absolute inset-0 fill-border", dims)} />
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>
        <Row className={cn("fill-star", dims)} />
      </span>
    </span>
  );
}
