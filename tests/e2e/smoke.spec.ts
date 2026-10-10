import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("home renders in pt-BR by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await expect(page.getByRole("heading", { name: "Presença Under Control" })).toBeVisible();
  });

  test.describe("with an English browser", () => {
    test.use({ locale: "en-US" });

    test("home follows Accept-Language", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.getByRole("heading", { name: "Under Control Attendance" })).toBeVisible();
    });
  });

  test("language switcher persists the choice", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "English" }).click();
    await expect(page.getByRole("heading", { name: "Under Control Attendance" })).toBeVisible();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("privacy policy is public and linked from the footer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Privacidade" }).click();
    await expect(page).toHaveURL(/\/privacidade$/);
    await expect(page.getByRole("heading", { name: "Política de privacidade" })).toBeVisible();
  });

  test("health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBe(true);
    expect(await response.json()).toMatchObject({ status: "ok" });
  });
});
