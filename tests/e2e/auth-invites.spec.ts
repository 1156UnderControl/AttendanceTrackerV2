import { expect, test } from "@playwright/test";
import { devLogin, uniqueCode, uniqueEmail } from "./helpers";

test.describe("auth", () => {
  test("protected pages redirect to login", async ({ page }) => {
    await page.goto("/minha-presenca");
    await expect(page).toHaveURL(/\/login\?next=%2Fminha-presenca$/);
    await expect(page.getByRole("button", { name: "Continuar com Google" })).toBeVisible();
  });

  test("[004-AC9] non-admins get 404 on admin pages", async ({ page }) => {
    await devLogin(page, "ana@local.test");
    const response = await page.goto("/admin");
    expect(response?.status()).toBe(404);
  });
});

test.describe("invites", () => {
  test("[002-AC1][002-AC3][002-AC7][002-AC10] admin invites, newcomer joins in English", async ({
    page,
    browser,
  }) => {
    await devLogin(page, "admin@local.test", "/admin/convites");
    const label = `E2E ${Date.now()}`;
    await page.getByLabel("Descrição (opcional)").fill(label);
    await page.getByRole("button", { name: "Criar convite" }).click();
    const link = await page.getByTestId("invite-link").inputValue();
    expect(link).toMatch(/\/convite\/[A-Za-z0-9_-]{40,}$/);

    // The newcomer uses an English browser.
    const context = await browser.newContext({ locale: "en-US" });
    const newcomer = await context.newPage();
    const invitePath = new URL(link).pathname;
    await devLogin(newcomer, uniqueEmail("newcomer"), invitePath);
    await expect(
      newcomer.getByText("You've been invited to join the team as Student."),
    ).toBeVisible();

    const code = uniqueCode();
    await newcomer.getByLabel("Full name").fill("New Member E2E");
    await newcomer.getByLabel("FTC").check();
    await newcomer.getByLabel("Entrance code").fill(code);
    await newcomer.getByRole("main").getByLabel("Language").selectOption("en");
    await newcomer.getByRole("button", { name: "Join the team" }).click();

    await expect(newcomer).toHaveURL(/\/minha-presenca$/);
    await expect(newcomer.getByRole("heading", { name: "My attendance" })).toBeVisible();
    await expect(newcomer.getByLabel("Entrance code")).toHaveValue(code);
    await expect(newcomer.getByText(/in FTC students/)).toBeVisible();
    await context.close();

    // 002-AC7: the list shows the redemption.
    await page.reload();
    const row = page.getByTestId("invite-row").filter({ hasText: label });
    await expect(row).toContainText("1/1");
    await expect(row).toContainText("Esgotado");
    await expect(row).toContainText("New Member E2E");
  });

  test("[002-AC5] an invalid invite link shows a clear message", async ({ page }) => {
    await page.goto("/convite/this-token-does-not-exist");
    await expect(page.getByRole("heading", { name: "Convite inválido" })).toBeVisible();
  });

  test("[002-AC6] a member opening an invite is redirected and doesn't consume it", async ({
    page,
    browser,
  }) => {
    await devLogin(page, "admin@local.test", "/admin/convites");
    const label = `Unused ${Date.now()}`;
    await page.getByLabel("Descrição (opcional)").fill(label);
    await page.getByRole("button", { name: "Criar convite" }).click();
    const link = await page.getByTestId("invite-link").inputValue();

    const context = await browser.newContext();
    const member = await context.newPage();
    await devLogin(member, "ana@local.test");
    await member.goto(new URL(link).pathname);
    await expect(member).toHaveURL(/\/minha-presenca$/);
    await context.close();

    await page.reload();
    await expect(page.getByTestId("invite-row").filter({ hasText: label })).toContainText("0/1");
  });
});

test.describe("my attendance", () => {
  test("[005-AC1][005-AC2] shows stats, position and sessions", async ({ page }) => {
    await devLogin(page, "ana@local.test");
    await expect(page.getByRole("heading", { name: "Minha presença" })).toBeVisible();
    await expect(page.getByText(/Posição \d+ de \d+ em Alunos FRC/)).toBeVisible();
    expect(await page.getByTestId("session-row").count()).toBeGreaterThanOrEqual(3);
  });

  test("[005-AC4] edits own profile and rejects a duplicate code", async ({ page }) => {
    await devLogin(page, "ana@local.test");
    await page.getByLabel("Nome", { exact: true }).fill("Ana FRC (e2e)");
    await page.getByLabel("Código de entrada").fill("111111");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Perfil salvo.")).toBeVisible();

    await page.getByLabel("Código de entrada").fill("111112");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Código já em uso. Escolha outro.")).toBeVisible();
  });

  test("[005-AC7] the language choice follows the member to a new device", async ({
    page,
    browser,
  }) => {
    const email = "admin@local.test";
    await devLogin(page, email);
    await page.getByRole("button", { name: "English" }).click();
    await expect(page.getByRole("heading", { name: "My attendance" })).toBeVisible();

    const context = await browser.newContext({ locale: "pt-BR" });
    const other = await context.newPage();
    await devLogin(other, email);
    await expect(other.getByRole("heading", { name: "My attendance" })).toBeVisible();
    await other.getByRole("button", { name: "Português" }).click();
    await expect(other.getByRole("heading", { name: "Minha presença" })).toBeVisible();
    await context.close();
  });
});

test.describe("member management", () => {
  test("[002-AC8] admin edits a member and can't remove their own admin access", async ({
    page,
  }) => {
    await devLogin(page, "admin@local.test", "/admin/membros");
    await page
      .getByTestId("member-row")
      .filter({ hasText: "Bruno FRC (demo)" })
      .getByRole("link")
      .click();
    const memberForm = page.getByTestId("member-form");
    await memberForm.getByLabel("Categoria").selectOption("FTC");
    await memberForm.getByRole("button", { name: "Salvar" }).click();
    await expect(memberForm.getByText("Alterações salvas.")).toBeVisible();

    await page.goto("/admin/membros?track=FTC_STUDENTS&status=active");
    await expect(
      page.getByTestId("member-row").filter({ hasText: "Bruno FRC (demo)" }),
    ).toBeVisible();

    await page.goto("/admin/membros");
    await page
      .getByTestId("member-row")
      .filter({ hasText: "Admin Local" })
      .getByRole("link")
      .click();
    await expect(page.getByRole("button", { name: "Remover admin" })).toBeDisabled();
  });
});
