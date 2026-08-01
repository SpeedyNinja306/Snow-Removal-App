import { type Algorithm, hash, verify } from "@node-rs/argon2";

// `Algorithm` is an ambient const enum, which `isolatedModules` forbids reading
// as a value; 2 is `Algorithm.Argon2id`.
const ARGON2ID: Algorithm = 2;

// argon2id with the OWASP-recommended second configuration (19 MiB, 2 passes,
// 1 lane). Kept in one place so a future parameter change is a single edit.
const ARGON2ID_OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2ID_OPTIONS);
}

export async function verifyPassword(
  hashedPassword: string,
  password: string,
): Promise<boolean> {
  try {
    // Parameters are read from the stored hash, so none are passed here.
    return await verify(hashedPassword, password);
  } catch {
    // A malformed or foreign hash is a failed login, not a crash.
    return false;
  }
}
