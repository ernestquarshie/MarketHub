/**
 * Money helpers. All amounts are integers in minor units (1/100 of the major unit).
 * GHS → pesewas, NGN → kobo, USD → cents.
 */
export const CURRENCIES = ["GHS", "NGN", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_META: Record<
  Currency,
  { symbol: string; locale: string; label: string; fractionDigits: number }
> = {
  GHS: { symbol: "GHS", locale: "en-GH", label: "Ghana cedi", fractionDigits: 2 },
  NGN: { symbol: "₦", locale: "en-NG", label: "Nigerian naira", fractionDigits: 0 },
  USD: { symbol: "$", locale: "en-US", label: "US dollar", fractionDigits: 2 },
};

/** Units of each currency per 1 USD. Overridden by admin-set rates from the database. */
export type Rates = Record<Currency, number>;
export const DEFAULT_RATES: Rates = { USD: 1, GHS: 15.2, NGN: 1580 };

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

/** Convert whole major units (e.g. 12.5) into minor units (1250). */
export function toMinor(major: number): number {
  return Math.round(major * 100);
}

/** Convert an amount in minor units between currencies using per-USD rates. */
export function convert(amountMinor: number, from: Currency, to: Currency, rates: Rates = DEFAULT_RATES): number {
  if (!Number.isFinite(amountMinor)) throw new Error("amount must be finite");
  if (from === to) return Math.round(amountMinor);
  const usd = amountMinor / rates[from];
  return Math.round(usd * rates[to]);
}

/** Format minor units for display, e.g. 24900 GHS → "GHS 249.00", NGN → "₦393,420". */
export function formatMoney(amountMinor: number, currency: Currency): string {
  const meta = CURRENCY_META[currency];
  const major = amountMinor / 100;
  const n = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: meta.fractionDigits,
    maximumFractionDigits: meta.fractionDigits,
  }).format(meta.fractionDigits === 0 ? Math.round(major) : major);
  return currency === "GHS" ? `GHS ${n}` : `${meta.symbol}${n}`;
}

/** Convert then format; the common case in the storefront. */
export function displayPrice(amountMinor: number, from: Currency, to: Currency, rates: Rates = DEFAULT_RATES): string {
  return formatMoney(convert(amountMinor, from, to, rates), to);
}

/** Percentage saved going from `was` to `now`, rounded to a whole number (0 if no saving). */
export function percentOff(was: number, now: number): number {
  if (was <= 0 || now >= was) return 0;
  return Math.round(((was - now) / was) * 100);
}
