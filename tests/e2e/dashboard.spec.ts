import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { db, memberId } from "./db";
import { devLogin } from "./helpers";

const SEASON = "00000000-0000-4000-8000-000000002026";
// A fixed "as of" date inside the seeded season keeps the numbers deterministic.
const AS_OF = `/admin?season=${SEASON}&at=2026-10-07`;

test.describe("dashboard", () => {
  test("[004-AC1][004-AC2][004-AC3][004-AC6] three rankings per track with summaries", async ({
    page,
  }) => {
    await devLogin(page, "admin@local.test", AS_OF);

    const frc = page.getByTestId("ranking-FRC_STUDENTS");
    // Ana: 12 h by Oct 7 against 8 h expected = 150%, colored as "at goal".
    const ana = frc.getByTestId("ranking-row").filter({ hasText: "Ana FRC" });
    await expect(ana).toContainText("12 h");
    await expect(ana).toContainText("8 h");
    await expect(ana.getByText("150%")).toHaveClass(/text-success/);

    // Students never appear in the mentors' ranking, and vice versa.
    await expect(page.getByTestId("ranking-MENTORS")).toContainText("Admin Local");
    await expect(page.getByTestId("ranking-MENTORS")).not.toContainText("Ana FRC");
    await expect(frc).not.toContainText("Mentor");
    await expect(page.getByTestId("ranking-FTC_STUDENTS")).toContainText("Carla FTC (demo)");

    await expect(page.getByTestId("summary-FRC_STUDENTS")).toContainText(/\d+ ativos · média/);
  });

  test("[004-AC4] filters change the date and the percentage mode", async ({ page }) => {
    await devLogin(page, "admin@local.test", AS_OF);
    const ana = page
      .getByTestId("ranking-FRC_STUDENTS")
      .getByTestId("ranking-row")
      .filter({ hasText: "Ana FRC" });
    await expect(ana).toContainText("150%");

    // As of Oct 2: only the Oct 1 session (4 h) against 2 days × 8 h / 7.
    await page.locator('input[name="at"]').fill("2026-10-02");
    await page.getByRole("button", { name: "Atualizar" }).click();
    await expect(ana).toContainText("4 h");
    await expect(ana).toContainText("175%");

    // Whole-season percentage: 4 h of 917.4 h.
    await page.locator('select[name="pct"]').selectOption("season");
    await page.getByRole("button", { name: "Atualizar" }).click();
    await expect(ana).toContainText("917,4 h");
    await expect(ana).toContainText("0%");
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
    await devLogin(page, "admin@local.test", AS_OF);

    const rankingDownload = page.waitForEvent("download");
    await page
      .getByTestId("summary-FRC_STUDENTS")
      .getByRole("link", { name: "Exportar CSV" })
      .click();
    const bytes = readFileSync(await (await rankingDownload).path());
    // Raw bytes: text decoding would strip the BOM.
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const rankingCsv = bytes.toString("utf8");
    expect(rankingCsv).toContain("#;Nome;Semana (h)");
    expect(rankingCsv).toMatch(/Ana FRC[^\r\n]*;12;/);

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
    await devLogin(page, "admin@local.test", AS_OF);
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
