"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { CURRENCIES } from "@/lib/money";
import { db, schema } from "@/server/db";
import { getActor } from "@/server/auth/session";
import { CURRENCY_COOKIE, VIEW_COOKIE } from "@/server/prefs";

const ONE_YEAR = 60 * 60 * 24 * 365;
const cookieOpts = { path: "/", maxAge: ONE_YEAR, sameSite: "lax" as const, httpOnly: false };

const currencySchema = z.enum(CURRENCIES);
const viewSchema = z.enum(["retail", "business"]);

export async function setCurrency(formData: FormData) {
  const parsed = currencySchema.safeParse(formData.get("currency"));
  if (!parsed.success) return;
  (await cookies()).set(CURRENCY_COOKIE, parsed.data, cookieOpts);
  const actor = await getActor();
  if (actor) await db.update(schema.user).set({ preferredCurrency: parsed.data }).where(eq(schema.user.id, actor.id));
  refresh();
}

export async function setPricingView(formData: FormData) {
  const parsed = viewSchema.safeParse(formData.get("view"));
  if (!parsed.success) return;
  (await cookies()).set(VIEW_COOKIE, parsed.data, cookieOpts);
  refresh();
}
