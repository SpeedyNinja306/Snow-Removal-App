import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/lib/auth/config";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/auth/schemas";
import { db } from "@/lib/db";

// Credentials only, no self-service signup: users are created by OWNER/DISPATCH
// and the first OWNER comes from the seed script (ADR-010).
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            role: true,
            active: true,
            hashedPassword: true,
          },
        });

        if (!user || !user.active) {
          return null;
        }

        if (!(await verifyPassword(user.hashedPassword, password))) {
          return null;
        }

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
});
