import { describe, expect, it } from "vitest";
import { convert, displayPrice, formatMoney, isCurrency, percentOff, toMinor } from "@/lib/money";

const rates = { USD: 1, GHS: 15, NGN: 1500 };

describe("money", () => {
  it("converts major to minor units without float drift", () => {
    expect(toMinor(249)).toBe(24900);
    expect(toMinor(0.1 + 0.2)).toBe(30);
    expect(toMinor(2.4)).toBe(240);
  });

  it("converts between currencies via USD", () => {
    expect(convert(1500, "GHS", "USD", rates)).toBe(100); // GHS 15.00 → $1.00
    expect(convert(100, "USD", "NGN", rates)).toBe(150000); // $1 → ₦1,500
    expect(convert(1500, "GHS", "NGN", rates)).toBe(150000);
    expect(convert(12345, "GHS", "GHS", rates)).toBe(12345);
  });

  it("formats each currency correctly", () => {
    expect(formatMoney(24900, "GHS")).toBe("GHS 249.00");
    expect(formatMoney(1234567, "USD")).toBe("$12,345.67");
    expect(formatMoney(3934200, "NGN")).toBe("₦39,342");
  });

  it("converts then formats for display", () => {
    expect(displayPrice(1500, "GHS", "USD", rates)).toBe("$1.00");
  });

  it("computes percent off", () => {
    expect(percentOff(29900, 24900)).toBe(17);
    expect(percentOff(100, 100)).toBe(0);
    expect(percentOff(0, 10)).toBe(0);
  });

  it("guards currency codes", () => {
    expect(isCurrency("GHS")).toBe(true);
    expect(isCurrency("EUR")).toBe(false);
    expect(isCurrency(undefined)).toBe(false);
  });

  it("rejects non-finite amounts", () => {
    expect(() => convert(Number.NaN, "GHS", "USD", rates)).toThrow();
  });
});
