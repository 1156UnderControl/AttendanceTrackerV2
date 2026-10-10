import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { db, memberId } from "./db";
import { devLogin } from "./helpers";

const SEASON = "00000000-0000-4000-8000-000000002026";
// A past week of the seeded season keeps the numbers deterministic.
const WEEK = `/admin?season=${SEASON}&week=2026-09-28`;

test.describe("dashboard", () => {
  test("[004-AC1][004-AC2][004-AC3] three rankings per track with summaries", async ({ page }) => {
    await devLogin(page, "admin@local.test", WEEK);

    const frc = page.getByTestId("ranking-FRC_STUDENTS");
    // Week of Sep 28: Ana worked 8 h (Oct 1 and 3); the goal covers Thu–Sun (season
    // starts Oct 1): 4 days × 8 h / 7 = 4.6 h → 175%, colored as "at goal".
    const ana = frc.getByTestId("ranking-row").filter({ hasText: "Ana FRC" });
    await expect(ana).toContainText("8 h");
    await expect(ana).toContainText("4,6 h");
    await expect(ana.getByText("175%").first()).toHaveClass(/text-success/);

    // Students never appear in the mentors' ranking, and vice versa.
    await expect(page.getByTestId("ranking-MENTORS")).toContainText("Admin Local");
    await expect(page.getByTestId("ranking-MENTORS")).not.toContainText("Ana FRC");
    await expect(frc).not.toContainText("Mentor");
    await expect(page.getByTestId("ranking-FTC_STUDENTS")).toContainText("Carla FTC (demo)");
  });

  test("[004-AC4] choose the week from the list or step with the arrows", async ({ page }) => {
    await devLogin(page, "admin@local.test", WEEK);
    const ana = () =>
      page
        .getByTestId("ranking-FRC_STUDENTS")
        .getByTestId("ranking-row")
        .filter({ hasText: "Ana FRC" });
    await expect(ana()).toContainText("175%");

    // Next week: Ana's Oct 6 session (4 h).
    await page.getByRole("link", { name: "Próxima semana" }).click();
    await expect(page).toHaveURL(/week=2026-10-05/);
    await expect(page.locator('select[name="week"]')).toHaveValue("2026-10-05");
    await expect(ana().getByRole("cell").nth(2)).toHaveText("4 h");

    // Back to Sep 28 through the list.
    await page.locator('select[name="week"]').selectOption("2026-09-28");
    await page.getByRole("button", { name: "Atualizar" }).click();
    await expect(ana()).toContainText("175%");
    await expect(page.getByRole("link", { name: "Semana anterior" })).toHaveCount(0);
  });

  test("[004-AC5] 'Agora no lab' lists open sessions", async ({ page }) => {
    const elisa = await memberId("333331");
    await db.from("sessions").delete().eq("member_id", elisa).is("check_out", null);
    await db
      .from("sessions")
      .insert({ member_id: elisa, check_in: new Date(Date.now() - 30 * 60_000).toISOString() });

    await devLogin(page, "admin@local.test", "/admin");
    await expect(page.getByTestId("present-now")).toContainText("Elisa Mentora (demo)");
    await db.from("sessions").delete().eq("member_id", elisa).is("check_out", null);
  });

  test("[004-AC8] CSV exports have a BOM and the expected columns", async ({ page }) => {
    await devLogin(page, "admin@local.test", WEEK);

    const rankingDownload = page.waitForEvent("download");
    await page
      .getByTestId("ranking-actions-FRC_STUDENTS")
      .getByRole("link", { name: "Exportar CSV" })
      .click();
    const bytes = readFileSync(await (await rankingDownload).path());
    // Raw bytes: text decoding would strip the BOM.
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const rankingCsv = bytes.toString("utf8");
    expect(rankingCsv).toContain("#;Nome;Semana (h);Meta da semana (h);% semana");
    expect(rankingCsv).toMatch(/Ana FRC[^;]*;8;4,6;175;/);

    const sessions = await page.request.get(
      "/admin/exportar/sessoes?from=2026-10-01&to=2026-10-07",
    );
    const sessionsCsv = await sessions.text();
    expect(sessions.headers()["content-type"]).toContain("text/csv");
    expect(sessionsCsv).toContain("Membro;Código;Grupo;Entrada;Saída");
    expect(sessionsCsv).toContain("2026-10-01 14:00;2026-10-01 18:00;4");
  });

  test("[004-AC7][004-AC9][005-AC3] charts render; non-admins can't export", async ({
    page,
    browser,
  }) => {
    await devLogin(page, "admin@local.test", WEEK);
    await page
      .getByTestId("ranking-FRC_STUDENTS")
      .getByRole("link", { name: /Ana FRC/ })
      .click();
    await expect(page.getByRole("img", { name: /^Horas por semana\./ })).toBeVisible();
    await expect(page.getByRole("img", { name: /^Horas acumuladas na temporada/ })).toBeVisible();

    const context = await browser.newContext();
    const member = await context.newPage();
    await devLogin(member, "ana@local.test");
    await expect(member.getByRole("img", { name: /^Horas por semana\./ })).toBeVisible();
    expect(
      (await member.request.get("/admin/exportar/sessoes?from=2026-10-01&to=2026-10-07")).status(),
    ).toBe(404);
    await context.close();
  });
});
