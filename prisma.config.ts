import "./lib/load-env-files";

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need the DIRECT (unpooled) connection; Prisma 7 dropped the
    // `directUrl` datasource field, so ADR-013's split is expressed here.
    // `process.env` rather than Prisma's `env()` helper: `prisma generate` runs
    // in CI without any database URL and must not fail on a missing variable.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
