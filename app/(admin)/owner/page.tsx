import Link from "next/link";

import { SessionProof } from "@/components/session-proof";
import { requireRoles } from "@/lib/authz";
import { DISPATCH_HOME } from "@/lib/authz/routes";
import { Role } from "@/lib/generated/prisma/enums";

// Owner oversight nests inside the admin surface, so DISPATCH reaches the group
// layout but is denied here.
const ALLOWED_ROLES = [Role.OWNER] as const;

export const metadata = {
  title: "Owner · SR-App",
};

export default async function OwnerHomePage() {
  const user = await requireRoles(ALLOWED_ROLES);

  return (
    <section>
      <h1 className="text-xl font-semibold">Owner oversight</h1>
      <p className="mt-1 text-sm text-slate-400">
        Placeholder surface. Operational and financial reporting plus user
        management arrive with their own feature tickets.
      </p>
      <SessionProof user={user} allowedRoles={ALLOWED_ROLES} />

      <Link
        href={DISPATCH_HOME}
        className="mt-4 inline-flex min-h-12 items-center rounded-lg border border-slate-700 px-4 text-sm font-semibold hover:bg-slate-800"
      >
        Dispatch
      </Link>
    </section>
  );
}
