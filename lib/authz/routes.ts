import { Role } from "@/lib/generated/prisma/enums";

/**
 * Single source of truth for which roles may reach which URL prefix, shared by
 * `proxy.ts` (pre-check) and the surface layouts/pages (real enforcement).
 * Deliberately free of server-only imports so both can use it.
 */

export const LOGIN_PATH = "/login";
export const NO_ACCESS_PATH = "/no-access";

export const FIELD_HOME = "/field";
export const DISPATCH_HOME = "/dispatch";
export const OWNER_HOME = "/owner";

/** OWNER is a superset of DISPATCH for admin surfaces. */
export const ADMIN_ROLES = [Role.OWNER, Role.DISPATCH] as const;

// Most specific prefix first.
const PROTECTED_PREFIXES: readonly { prefix: string; roles: readonly Role[] }[] = [
  { prefix: OWNER_HOME, roles: [Role.OWNER] },
  { prefix: DISPATCH_HOME, roles: ADMIN_ROLES },
  { prefix: FIELD_HOME, roles: [Role.FIELD_AGENT] },
];

/** Roles allowed on `pathname`, or `null` if the path is not role-gated. */
export function requiredRolesForPath(pathname: string): readonly Role[] | null {
  const match = PROTECTED_PREFIXES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return match?.roles ?? null;
}

export function homePathForRole(role: Role): string {
  switch (role) {
    case Role.OWNER:
      return OWNER_HOME;
    case Role.DISPATCH:
      return DISPATCH_HOME;
    case Role.FIELD_AGENT:
      return FIELD_HOME;
  }
}
