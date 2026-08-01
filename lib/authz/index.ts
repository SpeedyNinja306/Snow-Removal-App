import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { LOGIN_PATH, NO_ACCESS_PATH } from "@/lib/authz/routes";
import { db } from "@/lib/db";
import type { Role } from "@/lib/generated/prisma/enums";

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
};

/**
 * Resolves the signed-in user for the current request.
 *
 * The role in the JWT is not trusted on its own: ADR-015 accepts that sessions
 * survive a role change or deactivation for up to 12h, so `role` and `active`
 * are re-read from the database. Memoized per render pass, so a layout and its
 * page share one query.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, active: true },
  });

  if (!user || !user.active) {
    return null;
  }

  return { id: user.id, email: user.email, role: user.role };
});

/**
 * Server-side gate for a role-restricted surface. Deny by default: no session
 * goes to the login screen, an insufficient role goes to the access-denied
 * screen.
 */
export async function requireRoles(
  allowedRoles: readonly Role[],
): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect(LOGIN_PATH);
  }

  if (!allowedRoles.includes(user.role)) {
    redirect(NO_ACCESS_PATH);
  }

  return user;
}
