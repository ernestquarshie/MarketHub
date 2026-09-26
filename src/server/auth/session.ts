import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "./index";
import { db, schema } from "@/server/db";
import type { Actor } from "./policy";
import type { Role } from "@/server/db/schema";

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** The signed-in user as an authorization Actor (null when signed out). Cached per request. */
export const getActor = cache(async (): Promise<(Actor & { name: string; email: string }) | null> => {
  const session = await getSession();
  if (!session) return null;
  const u = session.user;
  const s = await db.query.seller.findFirst({
    where: eq(schema.seller.userId, u.id),
    columns: { id: true, status: true },
  });
  const role = (["customer", "seller", "admin"].includes(u.role ?? "") ? u.role : "customer") as Role;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role,
    isBusiness: !!u.isBusiness,
    sellerId: s?.id ?? null,
    sellerApproved: s?.status === "approved",
    banned: !!u.banned,
  };
});

/** For pages: redirect signed-out users to login, return the actor otherwise. */
export async function requireActor(nextPath: string) {
  const actor = await getActor();
  if (!actor) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return actor;
}

/** For pages: require a capability; signed-out → login, otherwise → 403 page. */
export async function requirePage(nextPath: string, check: (a: Actor) => boolean) {
  const actor = await requireActor(nextPath);
  if (!check(actor)) forbidden();
  return actor;
}
