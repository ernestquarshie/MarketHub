"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/server/auth";

/** Demo accounts (seeded). Only usable when DEMO_MODE=true. */
const DEMO_ACCOUNTS = {
  shopper: { email: "shopper@demo.markethub.test", home: "/" },
  business: { email: "business@demo.markethub.test", home: "/" },
  seller: { email: "seller@demo.markethub.test", home: "/seller" },
  admin: { email: "admin@demo.markethub.test", home: "/admin" },
} as const;

const DEMO_PASSWORD = "Demo1234!";

export async function signInAsDemo(formData: FormData) {
  if (process.env.DEMO_MODE !== "true") throw new Error("Demo mode is disabled.");
  const role = z.enum(["shopper", "business", "seller", "admin"]).parse(formData.get("role"));
  const account = DEMO_ACCOUNTS[role];
  const h = await headers();
  // Switch accounts cleanly.
  await auth.api.signOut({ headers: h }).catch(() => undefined);
  await auth.api.signInEmail({ body: { email: account.email, password: DEMO_PASSWORD }, headers: h });
  redirect(account.home as never);
}
