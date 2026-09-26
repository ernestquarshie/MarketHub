import { convert, formatMoney, type Currency, type Rates } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Currency-aware price with optional strike-through reference price. */
export function Price({
  amount,
  from,
  to,
  rates,
  was,
  className,
  wasClassName,
  suffix,
}: {
  amount: number;
  from: Currency;
  to: Currency;
  rates: Rates;
  was?: number | null;
  className?: string;
  wasClassName?: string;
  suffix?: string;
}) {
  const now = formatMoney(convert(amount, from, to, rates), to);
  const before = was && was > amount ? formatMoney(convert(was, from, to, rates), to) : null;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className={cn("font-bold tabular", className)}>
        {now}
        {suffix ? <span className="text-xs font-medium"> {suffix}</span> : null}
      </span>
      {before ? (
        <span className={cn("text-[13px] text-muted tabular line-through", wasClassName)}>
          <span className="sr-only">Was </span>
          {before}
        </span>
      ) : null}
    </span>
  );
}
