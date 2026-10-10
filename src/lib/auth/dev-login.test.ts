import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { devLoginEnabled } = await import("./dev-login");

describe("devLoginEnabled (ADR 0008)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is on locally and in CI when ENABLE_DEV_LOGIN=true", () => {
    vi.stubEnv("ENABLE_DEV_LOGIN", "true");
    vi.stubEnv("VERCEL_ENV", "");
    expect(devLoginEnabled()).toBe(true);
  });

  it.each(["production", "preview"])("is always off on Vercel (%s)", (env) => {
    vi.stubEnv("ENABLE_DEV_LOGIN", "true");
    vi.stubEnv("VERCEL_ENV", env);
    expect(devLoginEnabled()).toBe(false);
  });

  it("is off when the flag is missing", () => {
    vi.stubEnv("ENABLE_DEV_LOGIN", "");
    vi.stubEnv("VERCEL_ENV", "");
    expect(devLoginEnabled()).toBe(false);
  });
});
