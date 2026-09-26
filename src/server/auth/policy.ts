/**
 * Authorization policy. Every server action and route handler must go through these
 * helpers so role and ownership rules live in one place.
 */
import type { Role } from "@/server/db/schema";

export interface Actor {
  id: string;
  role: Role;
  isBusiness: boolean;
  sellerId: string | null;
  sellerApproved: boolean;
  banned: boolean;
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthenticatedError extends Error {
  readonly status = 401;
  constructor(message = "Please sign in to continue.") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export const can = {
  accessAccount: (a: Actor | null) => !!a && !a.banned,
  accessSellerCentre: (a: Actor | null) => !!a && !a.banned && a.role === "seller" && !!a.sellerId && a.sellerApproved,
  applyAsSeller: (a: Actor | null) => !!a && !a.banned && !a.sellerId && a.role !== "admin",
  accessAdmin: (a: Actor | null) => !!a && !a.banned && a.role === "admin",
  useBusinessFeatures: (a: Actor | null) => !!a && !a.banned && (a.isBusiness || a.role === "admin"),
  editProduct: (a: Actor | null, product: { sellerId: string }) =>
    !!a &&
    !a.banned &&
    (a.role === "admin" || (a.role === "seller" && a.sellerApproved && a.sellerId === product.sellerId)),
  manageSellerOrder: (a: Actor | null, so: { sellerId: string }) =>
    !!a && !a.banned && (a.role === "admin" || (a.role === "seller" && a.sellerApproved && a.sellerId === so.sellerId)),
  viewOrder: (a: Actor | null, order: { userId: string | null }) =>
    !!a && !a.banned && (a.role === "admin" || (!!order.userId && order.userId === a.id)),
  quoteOnRfq: (a: Actor | null, rfq: { buyerId: string; status: string }) =>
    !!a && !a.banned && a.role === "seller" && a.sellerApproved && rfq.status === "open" && rfq.buyerId !== a.id,
};

/** Throw unless `allowed`; distinguishes signed-out (401) from forbidden (403). */
export function assertCan(actor: Actor | null, allowed: boolean): asserts actor is Actor {
  if (!actor) throw new UnauthenticatedError();
  if (!allowed) throw new ForbiddenError();
}
