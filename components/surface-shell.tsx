import { logout } from "@/lib/auth/actions";
import type { SessionUser } from "@/lib/authz";

/** Shared chrome for every signed-in surface: who you are, and a way out. */
export function SurfaceShell({
  surface,
  user,
  children,
}: Readonly<{
  surface: string;
  user: SessionUser;
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
            {surface}
          </p>
          <p className="text-sm text-slate-300">
            {user.email} · {user.role}
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="min-h-12 rounded-lg border border-slate-700 px-4 text-sm font-semibold hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
