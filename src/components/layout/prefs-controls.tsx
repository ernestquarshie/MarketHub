import { CURRENCIES, type Currency } from "@/lib/money";
import { setCurrency, setPricingView } from "@/server/actions/prefs";
import type { PricingView } from "@/server/prefs";
import { cn } from "@/lib/utils";

/** Segmented currency switcher. Plain forms: works without JavaScript. */
export function CurrencySwitcher({ current, className }: { current: Currency; className?: string }) {
  return (
    <form
      action={setCurrency}
      className={cn("flex rounded-full border border-border bg-surface p-0.5", className)}
      aria-label="Currency"
    >
      {CURRENCIES.map((c) => (
        <button
          key={c}
          type="submit"
          name="currency"
          value={c}
          aria-pressed={c === current}
          className={cn(
            "min-h-9 rounded-full px-3 text-[13px] font-semibold transition-colors",
            c === current ? "bg-ink text-ink-fg dark:bg-text dark:text-bg" : "text-muted hover:text-text",
          )}
        >
          {c}
        </button>
      ))}
    </form>
  );
}

/** Retail / Business pricing view toggle. */
export function PricingViewToggle({ current, className }: { current: PricingView; className?: string }) {
  return (
    <form
      action={setPricingView}
      className={cn("flex rounded-full border border-border bg-surface p-0.5", className)}
      aria-label="Pricing view"
    >
      <button
        type="submit"
        name="view"
        value="retail"
        aria-pressed={current === "retail"}
        className={cn(
          "min-h-9 rounded-full px-3.5 text-[13px] font-semibold transition-colors",
          current === "retail" ? "bg-primary text-primary-fg" : "text-muted hover:text-text",
        )}
      >
        Retail
      </button>
      <button
        type="submit"
        name="view"
        value="business"
        aria-pressed={current === "business"}
        className={cn(
          "min-h-9 rounded-full px-3.5 text-[13px] font-semibold transition-colors",
          current === "business"
            ? "bg-business text-white dark:bg-business-soft dark:text-business-strong"
            : "text-muted hover:text-text",
        )}
      >
        Business
      </button>
    </form>
  );
}
