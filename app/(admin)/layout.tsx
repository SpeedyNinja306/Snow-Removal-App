import { SurfaceShell } from "@/components/surface-shell";
import { requireRoles } from "@/lib/authz";
import { ADMIN_ROLES } from "@/lib/authz/routes";
import { Role } from "@/lib/generated/prisma/enums";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireRoles(ADMIN_ROLES);

  return (
    <SurfaceShell
      surface={user.role === Role.OWNER ? "Owner" : "Dispatch"}
      user={user}
    >
      {children}
    </SurfaceShell>
  );
}
