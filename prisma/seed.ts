// Must run before anything reads process.env.
import "../lib/load-env-files";

import { z } from "zod";

import { hashPassword } from "../lib/auth/password";
import { db } from "../lib/db";
import { JobStatus, Role } from "../lib/generated/prisma/enums";

const SAMPLE_CUSTOMER_NAME = "Riverside Plaza Management";

// Local-dev team accounts (dispatcher + field agents). Representative data only
// (technical/database-prisma-postgres.md): they share the bootstrap
// SEED_OWNER_PASSWORD so a developer can sign in as each role without new env
// vars. Production users are created by DISPATCH/OWNER, never seeded.
const SEED_DISPATCH_EMAIL = "dispatch@example.com";
const SEED_FIELD_AGENT_EMAILS = ["agent1@example.com", "agent2@example.com"] as const;

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

/** Creates a user if the email is unseen; otherwise returns the existing id. */
async function ensureUser(
  email: string,
  role: Role,
  hashedPassword: string,
): Promise<string> {
  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (existing) {
    console.log(`Seed skipped: ${email} already exists (${existing.role}).`);
    return existing.id;
  }

  const created = await db.user.create({
    data: { email, hashedPassword, role },
    select: { id: true, email: true },
  });
  console.log(`Seeded ${role} ${created.email} (${created.id}).`);
  return created.id;
}

/**
 * Seeds the OWNER plus a dispatcher and two field agents, returning the id of
 * the first field agent so the sample data can assign a job to a real user.
 */
async function seedTeam(): Promise<{ firstAgentId: string }> {
  const parsed = seedEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const problems = Object.entries(z.flattenError(parsed.error).fieldErrors)
      .map(([key, errors]) => `  - ${key}: ${errors?.join("; ")}`)
      .join("\n");

    throw new Error(`Cannot seed users:\n${problems}`);
  }

  const { SEED_OWNER_EMAIL: ownerEmail, SEED_OWNER_PASSWORD: password } = parsed.data;
  const hashedPassword = await hashPassword(password);

  await ensureUser(ownerEmail, Role.OWNER, hashedPassword);
  await ensureUser(SEED_DISPATCH_EMAIL, Role.DISPATCH, hashedPassword);

  const agentIds = await Promise.all(
    SEED_FIELD_AGENT_EMAILS.map((email) =>
      ensureUser(email, Role.FIELD_AGENT, hashedPassword),
    ),
  );

  return { firstAgentId: agentIds[0] };
}

/**
 * Sample data: one Customer + ServiceLocation with two Jobs — a DRAFT the
 * dispatcher can assign, and one already ASSIGNED to a field agent so the field
 * surface has a row to show. Idempotent: no-op if the sample customer exists.
 */
async function seedSampleJob(assignedAgentId: string): Promise<void> {
  const existing = await db.customer.findFirst({
    where: { name: SAMPLE_CUSTOMER_NAME },
    select: { id: true },
  });

  if (existing) {
    console.log(`Seed skipped: sample customer "${SAMPLE_CUSTOMER_NAME}" already exists.`);
    return;
  }

  const customer = await db.customer.create({
    data: {
      name: SAMPLE_CUSTOMER_NAME,
      phone: "218-555-0100",
      email: "ops@riversideplaza.example",
      billingNotes: "Net 30. PO number required on invoices.",
      serviceLocations: {
        create: {
          addressLine1: "482 Riverside Ave",
          city: "Duluth",
          state: "MN",
          postalCode: "55802",
          latitude: 46.7867,
          longitude: -92.1005,
          geocoded: true,
          jobs: {
            create: [
              { status: JobStatus.DRAFT },
              { status: JobStatus.ASSIGNED, assignedUserId: assignedAgentId },
            ],
          },
        },
      },
    },
    select: { id: true, name: true },
  });

  console.log(
    `Seeded sample customer "${customer.name}" (${customer.id}) with 1 location + 2 jobs.`,
  );
}

async function main(): Promise<void> {
  const { firstAgentId } = await seedTeam();
  await seedSampleJob(firstAgentId);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
