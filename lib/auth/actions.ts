"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/lib/auth/schemas";
import { LOGIN_PATH } from "@/lib/authz/routes";

export type LoginResult =
  | { ok: true }
  | {
      ok: false;
      error?: string;
      fieldErrors?: { email?: string[]; password?: string[] };
    };

export async function login(
  _previous: LoginResult | undefined,
  formData: FormData,
): Promise<LoginResult> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      // Same message for unknown email, wrong password and deactivated user:
      // the login screen must not confirm which accounts exist.
      return { ok: false, error: "Invalid email or password." };
    }
    throw error;
  }

  // The root route sends each role to its own surface.
  redirect("/");
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: LOGIN_PATH });
}
