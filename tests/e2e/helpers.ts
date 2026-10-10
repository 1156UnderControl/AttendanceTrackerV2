import { expect, type Page } from "@playwright/test";

/** Signs in through the dev login form (ENABLE_DEV_LOGIN, local/CI only; ADR 0008). */
export async function devLogin(page: Page, email: string, next = "/minha-presenca") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('form:has(input[name="email"]) button[type="submit"]').click();
  await expect(page).toHaveURL(new RegExp(`${next.replace(/[/?]/g, "\\$&")}$`));
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@local.test`;
}

export function uniqueCode() {
  return String(Math.floor(400000 + Math.random() * 500000));
}
