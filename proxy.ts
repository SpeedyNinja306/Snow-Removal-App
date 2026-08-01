import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth/config";
import {
  LOGIN_PATH,
  NO_ACCESS_PATH,
  requiredRolesForPath,
} from "@/lib/authz/routes";

/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts` (ADR-019).
 *
 * This is a cheap pre-check that keeps unauthorized requests — including direct
 * URL entry — from ever reaching a role-restricted segment. It reads the signed
 * session cookie only; the authoritative check is `requireRoles()` in each
 * surface layout and page, which re-reads role and `active` from the database.
 */
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const requiredRoles = requiredRolesForPath(request.nextUrl.pathname);

  if (!requiredRoles) {
    return NextResponse.next();
  }

  const role = request.auth?.user?.role;

  if (!role) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.nextUrl.origin));
  }

  if (!requiredRoles.includes(role)) {
    return NextResponse.redirect(
      new URL(NO_ACCESS_PATH, request.nextUrl.origin),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
