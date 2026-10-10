import { expect, test } from "@playwright/test";
import { enterCode, ensureCheckedOut, unlockKiosk } from "./helpers";

test.describe("kiosk", () => {
  test("[001-AC6] a browser that wasn't unlocked can't use the kiosk", async ({ page }) => {
    await page.goto("/kiosk");
    await expect(page.getByRole("heading", { name: "Quiosque não autorizado" })).toBeVisible();
    await expect(page.locator('input[name="code"]')).toHaveCount(0);
  });

  test("[001-AC7] an admin unlocks the kiosk and it keeps working after logout", async ({
    page,
  }) => {
    await unlockKiosk(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Sair" }).click();
    await page.goto("/kiosk");
    await expect(page.locator('input[name="code"]')).toBeVisible();
  });

  test("[001-AC1][001-AC2][001-AC11] code entry checks in, then out, on the V1-style kiosk", async ({
    page,
  }) => {
    await unlockKiosk(page);
    await ensureCheckedOut(page, "Diego FTC (demo)");
    await expect(page.locator(".kiosk-code-box")).toBeVisible();
    await expect(page.locator(".kiosk-pixel-button")).toHaveText("BATER PONTO");

    await enterCode(page, "222222");
    await expect(page.getByRole("status")).toHaveText("Bem-vindo(a), Diego FTC (demo)!");
    await expect(
      page.getByTestId("present-bubble").filter({ hasText: "Diego FTC (demo)" }),
    ).toBeVisible();
    await expect(page.locator('input[name="code"]')).toHaveValue("");
    await expect(page.locator('input[name="code"]')).toBeFocused();

    // Repeats within 5 s are ignored by the database, so wait before checking out.
    await page.waitForTimeout(5_500);
    await enterCode(page, "222222");
    await expect(page.getByRole("status")).toHaveText(
      /^Até logo, Diego FTC \(demo\)! 0h \d+min hoje\.$/,
    );
    await expect(
      page.getByTestId("present-bubble").filter({ hasText: "Diego FTC (demo)" }),
    ).toHaveCount(0);
  });

  test("[001-AC3] clicking a name and confirming checks the member out", async ({ page }) => {
    await unlockKiosk(page);
    await ensureCheckedOut(page, "Bruno FRC (demo)");
    await enterCode(page, "111112");
    const bubble = page.getByTestId("present-bubble").filter({ hasText: "Bruno FRC (demo)" });
    await expect(bubble).toBeVisible();

    await bubble.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Registrar a saída de Bruno FRC (demo)?");
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(bubble).toBeVisible();

    await bubble.click();
    await page.getByRole("button", { name: "Sim, registrar saída" }).click();
    await expect(bubble).toHaveCount(0);
    await expect(page.getByRole("status")).toContainText("Até logo, Bruno FRC (demo)!");
  });

  test("[001-AC4] an unknown code shows an error and writes nothing", async ({ page }) => {
    await unlockKiosk(page);
    await enterCode(page, "000000");
    await expect(
      page.getByRole("alert").filter({ hasText: "Código não encontrado." }),
    ).toBeVisible();
  });

  test("[001-AC8] the code field accepts digits only", async ({ page }) => {
    await unlockKiosk(page);
    const input = page.locator('input[name="code"]');
    await input.pressSequentially("12ab34");
    await expect(input).toHaveValue("1234");
    await expect(page.locator(".kiosk-pixel-button")).toBeDisabled();
  });

  test("[001-AC9] without a connection the kiosk says so and keeps the code", async ({
    page,
    context,
  }) => {
    await unlockKiosk(page);
    await context.setOffline(true);
    await enterCode(page, "333331");
    await expect(
      page.getByRole("alert").filter({ hasText: "Sem conexão, tente novamente." }),
    ).toBeVisible();
    await expect(page.locator('input[name="code"]')).toHaveValue("333331");
    await context.setOffline(false);
  });

  test("[001-AC10] greetings use the member's language; the toggle switches the kiosk", async ({
    page,
  }) => {
    await unlockKiosk(page, "pt-BR");
    await ensureCheckedOut(page, "Carla FTC (demo)");
    await enterCode(page, "222221");
    await expect(page.getByRole("status")).toHaveText("Welcome, Carla FTC (demo)!");
    await expect(
      page.getByRole("heading", { name: "Pessoas no laboratório agora:" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "English" }).click();
    await expect(page.getByRole("heading", { name: "In the lab right now:" })).toBeVisible();
    await ensureCheckedOut(page, "Carla FTC (demo)");
    await page.getByRole("button", { name: "Português" }).click();
    await expect(
      page.getByRole("heading", { name: "Pessoas no laboratório agora:" }),
    ).toBeVisible();
  });
});
