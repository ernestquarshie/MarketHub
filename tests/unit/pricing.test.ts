import { describe, expect, it } from "vitest";
import { effectiveMoq, findTier, priceLine, type PricingInput } from "@/lib/pricing";

const now = new Date("2026-09-26T12:00:00Z");
const base: PricingInput = {
  retailPrice: 29900,
  compareAtPrice: null,
  moq: 10,
  tiers: [
    { minQty: 10, maxQty: 99, unitPrice: 21500 },
    { minQty: 100, maxQty: 499, unitPrice: 19800 },
    { minQty: 500, maxQty: null, unitPrice: 18200 },
  ],
  flashDeal: {
    dealPrice: 24900,
    startsAt: new Date("2026-09-26T00:00:00Z"),
    endsAt: new Date("2026-09-27T00:00:00Z"),
    stockCap: 200,
    claimed: 124,
  },
  sample: { enabled: true, price: 26000, maxQty: 2 },
};

describe("findTier", () => {
  it("matches the right band, including open-ended top tier", () => {
    expect(findTier(base.tiers, 9)).toBeNull();
    expect(findTier(base.tiers, 10)?.unitPrice).toBe(21500);
    expect(findTier(base.tiers, 99)?.unitPrice).toBe(21500);
    expect(findTier(base.tiers, 100)?.unitPrice).toBe(19800);
    expect(findTier(base.tiers, 5000)?.unitPrice).toBe(18200);
  });
});

describe("priceLine — retail", () => {
  it("uses the active flash deal and shows the retail price as 'was'", () => {
    const r = priceLine(base, { qty: 1, isBusinessBuyer: false, now });
    expect(r).toMatchObject({ unitPrice: 24900, lineTotal: 24900, source: "flash_deal", wasPrice: 29900, error: null });
  });

  it("falls back to retail once the deal has ended", () => {
    const r = priceLine(base, { qty: 1, isBusinessBuyer: false, now: new Date("2026-09-28T00:00:00Z") });
    expect(r).toMatchObject({ unitPrice: 29900, source: "retail", wasPrice: null });
  });

  it("falls back to retail when the deal is sold out or qty exceeds remaining deal stock", () => {
    expect(
      priceLine({ ...base, flashDeal: { ...base.flashDeal!, claimed: 200 } }, { qty: 1, isBusinessBuyer: false, now })
        .source,
    ).toBe("retail");
    expect(priceLine(base, { qty: 77, isBusinessBuyer: false, now }).source).toBe("retail");
  });

  it("never applies tier prices to retail buyers and has no MOQ", () => {
    const r = priceLine(base, { qty: 150, isBusinessBuyer: false, now: new Date("2026-10-01T00:00:00Z") });
    expect(r).toMatchObject({ unitPrice: 29900, source: "retail", error: null });
  });

  it("shows compare-at price as 'was' when higher than retail", () => {
    const r = priceLine({ ...base, flashDeal: null, compareAtPrice: 32900 }, { qty: 1, isBusinessBuyer: false, now });
    expect(r.wasPrice).toBe(32900);
  });
});

describe("priceLine — business", () => {
  it("applies the matching tier", () => {
    expect(priceLine(base, { qty: 10, isBusinessBuyer: true, now })).toMatchObject({
      unitPrice: 21500,
      source: "tier",
      lineTotal: 215000,
      error: null,
    });
    expect(priceLine(base, { qty: 250, isBusinessBuyer: true, now })).toMatchObject({
      unitPrice: 19800,
      source: "tier",
    });
    expect(priceLine(base, { qty: 500, isBusinessBuyer: true, now })).toMatchObject({
      unitPrice: 18200,
      source: "tier",
    });
  });

  it("flags quantities below MOQ", () => {
    const r = priceLine(base, { qty: 5, isBusinessBuyer: true, now });
    expect(r.error).toEqual({ code: "BELOW_MOQ", moq: 10 });
  });

  it("uses the higher of seller MOQ and lowest tier", () => {
    expect(effectiveMoq({ ...base, moq: 20 }, true)).toBe(20);
    expect(effectiveMoq({ ...base, moq: 1 }, true)).toBe(10);
    expect(effectiveMoq(base, false)).toBe(1);
  });

  it("ignores a tier that is not cheaper than retail", () => {
    const r = priceLine(
      { ...base, tiers: [{ minQty: 10, maxQty: null, unitPrice: 30000 }] },
      { qty: 10, isBusinessBuyer: true, now },
    );
    expect(r.source).toBe("retail");
  });
});

describe("priceLine — samples", () => {
  it("prices samples at the sample price, bypassing MOQ", () => {
    expect(priceLine(base, { qty: 1, isBusinessBuyer: true, isSample: true, now })).toMatchObject({
      unitPrice: 26000,
      source: "sample",
      error: null,
    });
  });

  it("caps sample quantity", () => {
    expect(priceLine(base, { qty: 3, isBusinessBuyer: true, isSample: true, now }).error).toEqual({
      code: "SAMPLE_MAX",
      max: 2,
    });
  });

  it("rejects samples when the seller doesn't offer them", () => {
    expect(priceLine({ ...base, sample: null }, { qty: 1, isBusinessBuyer: true, isSample: true, now }).error).toEqual({
      code: "SAMPLE_UNAVAILABLE",
    });
  });
});

describe("priceLine — validation", () => {
  it("rejects zero, negative and fractional quantities", () => {
    for (const qty of [0, -1, 1.5]) {
      expect(priceLine(base, { qty, isBusinessBuyer: false, now }).error).toEqual({ code: "INVALID_QTY" });
    }
  });
});
