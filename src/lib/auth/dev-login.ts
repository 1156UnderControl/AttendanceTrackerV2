import "server-only";

/**
 * Dev login with seeded accounts: local and CI only (ADR 0008).
 * Never on a Vercel deployment: Vercel sets VERCEL_ENV on every build and runtime
 * (production and preview), so a stray ENABLE_DEV_LOGIN there has no effect.
 */
export function devLoginEnabled(): boolean {
  return process.env.ENABLE_DEV_LOGIN === "true" && !process.env.VERCEL_ENV;
}
