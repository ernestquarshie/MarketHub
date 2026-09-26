import { describe, expect, it } from "vitest";
import { assertCan, can, ForbiddenError, UnauthenticatedError, type Actor } from "@/server/auth/policy";

const actor = (over: Partial<Actor> = {}): Actor => ({
  id: "u1",
  role: "customer",
  isBusiness: false,
  sellerId: null,
  sellerApproved: false,
  banned: false,
  ...over,
});

const shopper = actor();
const business = actor({ id: "u2", isBusiness: true });
const seller = actor({ id: "u3", role: "seller", sellerId: "s1", sellerApproved: true });
const pendingSeller = actor({ id: "u4", role: "seller", sellerId: "s2", sellerApproved: false });
const admin = actor({ id: "u5", role: "admin" });
const banned = actor({ id: "u6", role: "admin", banned: true });

describe("policy — areas", () => {
  it("account area requires a signed-in, non-banned user", () => {
    expect(can.accessAccount(null)).toBe(false);
    expect(can.accessAccount(shopper)).toBe(true);
    expect(can.accessAccount(banned)).toBe(false);
  });

  it("seller centre requires an approved seller", () => {
    expect(can.accessSellerCentre(shopper)).toBe(false);
    expect(can.accessSellerCentre(pendingSeller)).toBe(false);
    expect(can.accessSellerCentre(seller)).toBe(true);
    expect(can.accessSellerCentre(admin)).toBe(false);
  });

  it("admin area requires the admin role", () => {
    for (const a of [null, shopper, business, seller]) expect(can.accessAdmin(a)).toBe(false);
    expect(can.accessAdmin(admin)).toBe(true);
    expect(can.accessAdmin(banned)).toBe(false);
  });

  it("business features require a verified business (or admin)", () => {
    expect(can.useBusinessFeatures(shopper)).toBe(false);
    expect(can.useBusinessFeatures(business)).toBe(true);
    expect(can.useBusinessFeatures(admin)).toBe(true);
  });
});

describe("policy — ownership", () => {
  it("sellers can edit only their own products", () => {
    expect(can.editProduct(seller, { sellerId: "s1" })).toBe(true);
    expect(can.editProduct(seller, { sellerId: "other" })).toBe(false);
    expect(can.editProduct(pendingSeller, { sellerId: "s2" })).toBe(false);
    expect(can.editProduct(admin, { sellerId: "anything" })).toBe(true);
    expect(can.editProduct(shopper, { sellerId: "s1" })).toBe(false);
  });

  it("buyers can view only their own orders; guest orders are admin-only", () => {
    expect(can.viewOrder(shopper, { userId: "u1" })).toBe(true);
    expect(can.viewOrder(shopper, { userId: "u2" })).toBe(false);
    expect(can.viewOrder(shopper, { userId: null })).toBe(false);
    expect(can.viewOrder(admin, { userId: null })).toBe(true);
  });

  it("sellers can quote on open RFQs from other users only", () => {
    expect(can.quoteOnRfq(seller, { buyerId: "u2", status: "open" })).toBe(true);
    expect(can.quoteOnRfq(seller, { buyerId: "u2", status: "closed" })).toBe(false);
    expect(can.quoteOnRfq(seller, { buyerId: "u3", status: "open" })).toBe(false);
    expect(can.quoteOnRfq(business, { buyerId: "u9", status: "open" })).toBe(false);
  });
});

describe("assertCan", () => {
  it("throws 401 when signed out and 403 when forbidden", () => {
    expect(() => assertCan(null, false)).toThrow(UnauthenticatedError);
    expect(() => assertCan(shopper, false)).toThrow(ForbiddenError);
    expect(() => assertCan(shopper, true)).not.toThrow();
  });
});
