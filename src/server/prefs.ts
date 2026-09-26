import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { isCurrency, type Currency } from "@/lib/money";

export const CURRENCY_COOKIE = "mh_currency";
export const VIEW_COOKIE = "mh_view";
export type PricingView = "retail" | "business";

export interface Prefs {
  currency: Currency;
  view: PricingView;
}

/** Shopper display preferences (currency, retail/business view), from cookies. */
export const getPrefs = cache(async (): Promise<Prefs> => {
  const jar = await cookies();
  const c = jar.get(CURRENCY_COOKIE)?.value;
  const v = jar.get(VIEW_COOKIE)?.value;
  return {
    currency: isCurrency(c) ? c : "GHS",
    view: v === "business" ? "business" : "retail",
  };
});
