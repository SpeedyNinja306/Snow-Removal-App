// Must run before anything reads process.env.
import "../lib/load-env-files";

import { z } from "zod";

import { hashPassword } from "../lib/auth/password";
import { db } from "../lib/db";
import { Role } from "../lib/generated/prisma/enums";

/**
 * Creates the first OWNER (ADR-010) — there is no self-service signup, so this
 * is the only bootstrap path. Idempotent: re-running never overwrites an
 * existing account or its password.
 */
const seedEnvSchema = z.object({
  SEED_OWNER_EMAIL: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "SEED_OWNER_EMAIL must be a valid email address." })),
  SEED_OWNER_PASSWORD: z
    .string()
    .min(12, "SEED_OWNER_PASSWORD must be at least 12 characters."),
});

async function main(): Promise<void> {
  const parsed = seedEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const problems = Object.entries(z.flattenError(parsed.error).fieldErrors)
      .map(([key, errors]) => `  - ${key}: ${errors?.join("; ")}`)
      .join("\n");

    throw new Error(`Cannot seed the first OWNER:\n${problems}`);
  }

  const { SEED_OWNER_EMAIL: email, SEED_OWNER_PASSWORD: password } = parsed.data;

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (existing) {
    console.log(`Seed skipped: ${email} already exists (${existing.role}).`);
    return;
  }

  const owner = await db.user.create({
    data: {
      email,
      hashedPassword: await hashPassword(password),
      role: Role.OWNER,
    },
    select: { id: true, email: true },
  });

  console.log(`Seeded OWNER ${owner.email} (${owner.id}).`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
