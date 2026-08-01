import { SessionProof } from "@/components/session-proof";
import { requireRoles } from "@/lib/authz";
import { Role } from "@/lib/generated/prisma/enums";

const ALLOWED_ROLES = [Role.FIELD_AGENT] as const;

export const metadata = {
  title: "My work · SR-App",
};

export default async function FieldHomePage() {
  // Re-checked here, not just in the layout: layouts do not re-render on every
  // client-side navigation, so the gate has to sit next to the data too.
  const user = await requireRoles(ALLOWED_ROLES);

  return (
    <section>
      <h1 className="text-xl font-semibold">My work</h1>
      <p className="mt-1 text-sm text-slate-400">
        Placeholder surface. Assigned jobs, status updates, time, notes, photos
        and invoicing arrive with their own feature tickets.
      </p>
      <SessionProof user={user} allowedRoles={ALLOWED_ROLES} />
    </section>
  );
}
