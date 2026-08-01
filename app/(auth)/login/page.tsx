import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/authz";
import { homePathForRole } from "@/lib/authz/routes";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in · SR-App",
};

export default async function LoginPage() {
  const user = await getSessionUser();

  if (user) {
    redirect(homePathForRole(user.role));
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <h1 className="text-2xl font-semibold">SR-App</h1>
      <p className="mt-1 text-sm text-slate-400">
        Sign in to continue. Accounts are created by dispatch or the owner.
      </p>
      <LoginForm />
    </div>
  );
}
