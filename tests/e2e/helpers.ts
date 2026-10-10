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

/** Signs in as the seeded admin and activates this browser context as the kiosk. */
export async function unlockKiosk(page: Page, locale: "pt-BR" | "en" = "pt-BR") {
  await devLogin(page, "admin@local.test", "/kiosk/unlock");
  await page.locator('select[name="locale"]').selectOption(locale);
  await page.locator('form:has(select[name="locale"]) button[type="submit"]').click();
  await expect(page).toHaveURL(/\/kiosk$/);
}

/** Types a code at the kiosk and submits it. */
export async function enterCode(page: Page, code: string) {
  const input = page.locator('input[name="code"]');
  await input.fill(code);
  await input.press("Enter");
}

/** Makes sure a member is not checked in, so tests can run repeatedly on one database. */
export async function ensureCheckedOut(page: Page, name: string) {
  const bubble = page.getByTestId("present-bubble").filter({ hasText: name });
  if (await bubble.count()) {
    await bubble.click();
    await page.getByRole("dialog").getByRole("button").last().click();
    await expect(bubble).toHaveCount(0);
  }
}
