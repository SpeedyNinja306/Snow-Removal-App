import type { SessionUser } from "@/lib/authz";
import type { Role } from "@/lib/generated/prisma/enums";

/**
 * Placeholder panel for the scaffold: it prints only values the server resolved
 * (session → database), so the page rendering at all is evidence the role gate
 * ran server-side rather than hiding anything in the browser.
 */
export function SessionProof({
  user,
  allowedRoles,
}: Readonly<{
  user: SessionUser;
  allowedRoles: readonly Role[];
}>) {
  return (
    <dl className="mt-4 grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm sm:grid-cols-3">
      <div>
        <dt className="text-slate-400">Signed in as</dt>
        <dd className="font-medium break-all">{user.email}</dd>
      </div>
      <div>
        <dt className="text-slate-400">Role (re-read from database)</dt>
        <dd className="font-medium">{user.role}</dd>
      </div>
      <div>
        <dt className="text-slate-400">Roles allowed here</dt>
        <dd className="font-medium">{allowedRoles.join(", ")}</dd>
      </div>
    </dl>
  );
}
