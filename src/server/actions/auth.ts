"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { auth } from "@/server/auth";

export type FormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
  values?: Record<string, string>;
};

/** Only allow same-site relative redirects (prevents open-redirects via ?next=). */
function safeNext(value: FormDataEntryValue | null, fallback = "/account"): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : fallback;
}

function fieldErrors(error: z.ZodError): Partial<Record<string, string>> {
  const out: Partial<Record<string, string>> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
  } catch (e) {
    if (e instanceof APIError) return { message: "That email and password don't match an account.", values };
    throw e;
  }
  redirect(safeNext(formData.get("next")) as never);
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(128)
    .regex(/[A-Za-z]/, "Include at least one letter.")
    .regex(/[0-9]/, "Include at least one number."),
});

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? "") };
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  try {
    await auth.api.signUpEmail({ body: parsed.data, headers: await headers() });
  } catch (e) {
    if (e instanceof APIError) {
      const exists = String(e.body?.code ?? "").includes("USER_ALREADY_EXISTS");
      return {
        message: exists
          ? "An account with this email already exists. Try signing in."
          : "We couldn't create your account. Please try again.",
        values,
      };
    }
    throw e;
  }
  redirect(safeNext(formData.get("next")) as never);
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ email: z.email("Enter a valid email address.") })
    .safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  try {
    await auth.api.requestPasswordReset({
      body: { email: parsed.data.email, redirectTo: "/reset-password" },
      headers: await headers(),
    });
  } catch {
    // Never reveal whether the email exists.
  }
  return { ok: true, message: "If an account exists for that email, we've sent a link to reset your password." };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ token: z.string().min(1), password: registerSchema.shape.password })
    .safeParse({ token: formData.get("token"), password: formData.get("password") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  try {
    await auth.api.resetPassword({ body: { token: parsed.data.token, newPassword: parsed.data.password } });
  } catch {
    return { message: "This reset link is invalid or has expired. Request a new one." };
  }
  redirect("/login?reset=1" as never);
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
