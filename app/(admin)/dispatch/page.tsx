import Link from "next/link";

import { SessionProof } from "@/components/session-proof";
import { requireRoles } from "@/lib/authz";
import { ADMIN_ROLES, OWNER_HOME } from "@/lib/authz/routes";
import { Role } from "@/lib/generated/prisma/enums";

export const metadata = {
  title: "Dispatch · SR-App",
};

export default async function DispatchHomePage() {
  const user = await requireRoles(ADMIN_ROLES);

  return (
    <section>
      <h1 className="text-xl font-semibold">Dispatch</h1>
      <p className="mt-1 text-sm text-slate-400">
        Placeholder surface. Customers, service locations, the job board, truck
        assignment, invoices and payments arrive with their own feature tickets.
      </p>
      <SessionProof user={user} allowedRoles={ADMIN_ROLES} />

      {user.role === Role.OWNER && (
        <Link
          href={OWNER_HOME}
          className="mt-4 inline-flex min-h-12 items-center rounded-lg border border-slate-700 px-4 text-sm font-semibold hover:bg-slate-800"
        >
          Owner oversight
        </Link>
      )}
    </section>
  );
}
