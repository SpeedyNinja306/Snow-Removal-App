// Must run before anything reads process.env.
import "../lib/load-env-files";

import { z } from "zod";

import { hashPassword } from "../lib/auth/password";
import { db } from "../lib/db";
import { JobStatus, Role } from "../lib/generated/prisma/enums";

const SAMPLE_CUSTOMER_NAME = "Riverside Plaza Management";

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

async function seedFirstOwner(): Promise<void> {
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

/**
 * Foundation-ticket sample data (ADR-022): one Customer, one ServiceLocation
 * belonging to it, and one Job against that location, so the dispatch stub
 * has real rows to read through Prisma. Idempotent: no-op if the sample
 * customer already exists.
 */
async function seedSampleJob(): Promise<void> {
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
            create: {
              status: JobStatus.DRAFT,
            },
          },
        },
      },
    },
    select: { id: true, name: true },
  });

  console.log(`Seeded sample customer "${customer.name}" (${customer.id}) with 1 location + 1 job.`);
}

async function main(): Promise<void> {
  await seedFirstOwner();
  await seedSampleJob();
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
