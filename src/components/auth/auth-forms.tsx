"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  forgotPasswordAction,
  registerAction,
  resetPasswordAction,
  signInAction,
  type FormState,
} from "@/server/actions/auth";

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending} aria-disabled={pending}>
      {pending ? "Please wait…" : children}
    </Button>
  );
}

function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={
        state.ok
          ? "rounded-md bg-primary-soft px-3 py-2.5 text-sm font-medium text-primary-hover dark:text-primary"
          : "rounded-md bg-deal-soft px-3 py-2.5 text-sm font-medium text-danger"
      }
    >
      {state.message}
    </p>
  );
}

function inputProps(name: string, state: FormState) {
  const error = state.fieldErrors?.[name];
  return {
    id: name,
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${name}-error` : undefined,
  } as const;
}

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState(signInAction, {} as FormState);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {notice ? (
        <p
          role="status"
          className="rounded-md bg-primary-soft px-3 py-2.5 text-sm font-medium text-primary-hover dark:text-primary"
        >
          {notice}
        </p>
      ) : null}
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field id="email" label="Email" error={state.fieldErrors?.email}>
        <Input
          {...inputProps("email", state)}
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          required
        />
      </Field>
      <Field id="password" label="Password" error={state.fieldErrors?.password}>
        <Input {...inputProps("password", state)} type="password" autoComplete="current-password" required />
      </Field>
      <div className="-mt-1 text-right text-sm">
        <Link href="/forgot-password">Forgot your password?</Link>
      </div>
      <Submit>Sign in</Submit>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState(registerAction, {} as FormState);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field id="name" label="Full name" error={state.fieldErrors?.name}>
        <Input {...inputProps("name", state)} autoComplete="name" defaultValue={state.values?.name} required />
      </Field>
      <Field id="email" label="Email" error={state.fieldErrors?.email}>
        <Input
          {...inputProps("email", state)}
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          required
        />
      </Field>
      <Field
        id="password"
        label="Password"
        error={state.fieldErrors?.password}
        hint="At least 8 characters, with a letter and a number."
      >
        <Input {...inputProps("password", state)} type="password" autoComplete="new-password" required />
      </Field>
      <Submit>Create account</Submit>
      <p className="text-xs leading-relaxed text-muted">
        By creating an account you agree to MarketHub&apos;s <Link href={"/help/terms" as never}>Terms</Link> and{" "}
        <Link href={"/help/privacy" as never}>Privacy notice</Link>.
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, {} as FormState);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
      <Field id="email" label="Email" error={state.fieldErrors?.email}>
        <Input {...inputProps("email", state)} type="email" autoComplete="email" required />
      </Field>
      <Submit>Send reset link</Submit>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, {} as FormState);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <Field
        id="password"
        label="New password"
        error={state.fieldErrors?.password}
        hint="At least 8 characters, with a letter and a number."
      >
        <Input {...inputProps("password", state)} type="password" autoComplete="new-password" required />
      </Field>
      <Submit>Set new password</Submit>
    </form>
  );
}
