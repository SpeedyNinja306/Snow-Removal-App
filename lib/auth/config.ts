import type { NextAuthConfig } from "next-auth";

import { env } from "@/lib/env";

/**
 * Auth.js options that contain no database or password-hashing code, so they can
 * also build the lightweight instance used by `proxy.ts`. The Credentials
 * provider lives in `lib/auth/index.ts`.
 */
export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: env.AUTH_SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      // `user` is only present on sign-in; afterwards the claim is already set.
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? session.user.id;
      session.user.role = token.role;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
