import { z } from "zod";

/** Shared by the login form and the login server action. */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Enter a valid email address." })),
  password: z.string().min(1, { error: "Enter your password." }),
});

export type LoginInput = z.infer<typeof loginSchema>;
