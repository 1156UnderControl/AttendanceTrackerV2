import "server-only";

/** Dev login with seeded accounts: local and CI only (ADR 0008). */
export function devLoginEnabled(): boolean {
  return process.env.ENABLE_DEV_LOGIN === "true";
}
