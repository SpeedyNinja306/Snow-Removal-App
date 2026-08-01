import { z } from "zod";

/**
 * Validated server-side configuration.
 *
 * Only the variables this slice actually uses are validated. `.env.example`
 * documents the full set (R2, MapTiler, cron, tax); those are validated by the
 * features that introduce them so the app can boot without unrelated secrets.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters (openssl rand -base64 32)"),
  // ADR-015: 12 hours by default, inside the approved 8–24h window.
  AUTH_SESSION_MAX_AGE_SECONDS: z.coerce
    .number()
    .int()
    .min(28_800)
    .max(86_400)
    .default(43_200),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Report which variables are wrong, never their values.
  const problems = Object.entries(z.flattenError(parsed.error).fieldErrors)
    .map(([key, errors]) => `  - ${key}: ${errors?.join("; ")}`)
    .join("\n");

  throw new Error(
    `Invalid server environment configuration:\n${problems}\n\nCopy .env.example to .env.local and fill it in.`,
  );
}

export const env = parsed.data;
