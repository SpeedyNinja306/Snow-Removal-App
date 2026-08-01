import { SurfaceShell } from "@/components/surface-shell";
import { requireRoles } from "@/lib/authz";
import { Role } from "@/lib/generated/prisma/enums";

export default async function FieldLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireRoles([Role.FIELD_AGENT]);

  return (
    <SurfaceShell surface="Field agent" user={user}>
      {children}
    </SurfaceShell>
  );
}
