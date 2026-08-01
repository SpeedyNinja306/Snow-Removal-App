import Link from "next/link";

import { getSessionUser } from "@/lib/authz";
import { LOGIN_PATH, homePathForRole } from "@/lib/authz/routes";

export const metadata = {
  title: "Access denied · SR-App",
};

export default async function NoAccessPage() {
  const user = await getSessionUser();

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-slate-400">
          {user
            ? `Your role (${user.role}) is not permitted on that screen.`
            : "Sign in to continue."}
        </p>
        <Link
          href={user ? homePathForRole(user.role) : LOGIN_PATH}
          className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-sky-500 px-4 text-sm font-semibold text-slate-950 hover:bg-sky-400"
        >
          {user ? "Back to my screen" : "Go to sign in"}
        </Link>
      </div>
    </main>
  );
}
