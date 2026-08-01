"use client";

import { useActionState } from "react";

import { login } from "@/lib/auth/actions";

const FIELD_CLASSES =
  "mt-1 block min-h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);
  const failed = state && !state.ok ? state : undefined;

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          aria-invalid={Boolean(failed?.fieldErrors?.email)}
          aria-describedby={failed?.fieldErrors?.email ? "email-error" : undefined}
          className={FIELD_CLASSES}
        />
        {failed?.fieldErrors?.email && (
          <p id="email-error" className="mt-1 text-sm text-red-400">
            {failed.fieldErrors.email.join(" ")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(failed?.fieldErrors?.password)}
          aria-describedby={
            failed?.fieldErrors?.password ? "password-error" : undefined
          }
          className={FIELD_CLASSES}
        />
        {failed?.fieldErrors?.password && (
          <p id="password-error" className="mt-1 text-sm text-red-400">
            {failed.fieldErrors.password.join(" ")}
          </p>
        )}
      </div>

      {failed?.error && (
        <p role="alert" className="text-sm text-red-400">
          {failed.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-lg bg-sky-500 px-4 text-base font-semibold text-slate-950 hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
