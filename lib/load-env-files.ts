// Side-effect module: loads `.env.local` then `.env` into `process.env`.
//
// Next.js loads these files itself, so app code must NOT import this. It exists
// for tooling that runs outside Next (the Prisma CLI config and the seed
// script), because Prisma 7 no longer reads `.env` on its own.
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });
