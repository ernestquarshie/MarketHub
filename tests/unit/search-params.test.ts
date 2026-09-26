import { describe, expect, it } from "vitest";
import { activeFilterCount, parseSearchParams, toQueryString } from "@/lib/search-params";

describe("parseSearchParams", () => {
  it("applies sensible defaults", () => {
    const p = parseSearchParams({});
    expect(p).toMatchObject({ sort: "bestselling", page: 1, type: "products", brands: [], readyToShip: false });
    expect(parseSearchParams({ q: "kettle" }).sort).toBe("relevance");
  });

  it("parses filters and swaps an inverted price range", () => {
    const p = parseSearchParams({
      q: " power bank ",
      min: "500",
      max: "100",
      rating: "4",
      brand: "VoltCell,Deskline",
      country: "gh,ng",
      readyToShip: "1",
      moqMax: "50",
    });
    expect(p).toMatchObject({
      q: "power bank",
      minPrice: 100,
      maxPrice: 500,
      minRating: 4,
      brands: ["VoltCell", "Deskline"],
      countries: ["GH", "NG"],
      readyToShip: true,
      moqMax: 50,
    });
  });

  it("drops invalid values instead of throwing", () => {
    const p = parseSearchParams({
      min: "abc",
      rating: "9",
      sort: "cheapest",
      page: "-3",
      c: "../etc",
      country: "Ghana",
    });
    expect(p.minPrice).toBeUndefined();
    expect(p.minRating).toBeUndefined();
    expect(p.sort).toBe("bestselling");
    expect(p.page).toBe(1);
    expect(p.category).toBeUndefined();
    expect(p.countries).toEqual([]);
  });

  it("takes the first value of repeated params and caps query length", () => {
    const p = parseSearchParams({ q: ["a", "b"] });
    expect(p.q).toBe("a");
    expect(parseSearchParams({ q: "x".repeat(500) }).q).toBeUndefined();
  });

  it("uses a forced category (category pages)", () => {
    expect(parseSearchParams({ c: "fashion" }, "electronics").category).toBe("electronics");
  });
});

describe("toQueryString", () => {
  it("round-trips and omits defaults", () => {
    const p = parseSearchParams({ q: "mouse", brand: "Deskline", verified: "1", sort: "price_asc", page: "3" });
    const qs = toQueryString(p, { page: p.page });
    expect(qs).toBe("?q=mouse&brand=Deskline&verified=1&sort=price_asc&page=3");
    expect(parseSearchParams(Object.fromEntries(new URLSearchParams(qs)))).toEqual(p);
  });

  it("resets the page when filters change", () => {
    const p = parseSearchParams({ q: "mouse", page: "4" });
    expect(toQueryString(p, { inStock: true })).toBe("?q=mouse&inStock=1");
  });

  it("keeps the category only when asked", () => {
    const p = parseSearchParams({ c: "electronics" });
    expect(toQueryString(p)).toBe("");
    expect(toQueryString(p, {}, { keepCategory: true })).toBe("?c=electronics");
  });
});

describe("activeFilterCount", () => {
  it("counts each removable filter", () => {
    const p = parseSearchParams({ min: "10", max: "20", brand: "A,B", verified: "1", q: "x" });
    expect(activeFilterCount(p)).toBe(4);
  });
});
