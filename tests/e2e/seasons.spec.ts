import { expect, test, type Page } from "@playwright/test";
import { db } from "./db";
import { devLogin } from "./helpers";

// Far-future seasons so they never clash with the seeded 2026–2027 season.
const FIRST = "E2E 2040–2041";
const SECOND = "E2E 2041–2042";

async function createSeason(page: Page, name: string, startsOn: string, endsOn: string) {
  await page.goto("/admin/temporadas");
  const form = page.getByTestId("create-season-form");
  await form.getByLabel("Nome").fill(name);
  await form.getByLabel("Início").fill(startsOn);
  await form.getByLabel("Fim").fill(endsOn);
  await form.getByRole("button", { name: "Criar temporada" }).click();
  await expect(page.getByRole("heading", { name: `Temporada ${name}` })).toBeVisible();
}

async function addPhase(page: Page, name: string, startsOn: string, endsOn: string, hours: string) {
  const form = page.getByTestId("new-phase-form");
  await form.getByLabel("Nome da fase").fill(name);
  await form.getByLabel("Início").fill(startsOn);
  await form.getByLabel("Fim").fill(endsOn);
  await form.getByLabel("Horas/semana").fill(hours);
  await form.getByRole("button", { name: "Adicionar fase" }).click();
}

test.describe("seasons and phases", () => {
  test.beforeEach(async () => {
    await db.from("seasons").delete().like("name", "E2E %");
  });

  test("[003-AC1][003-AC2][003-AC3][003-AC4][003-AC5] configure a season per track and copy phases", async ({
    page,
  }) => {
    await devLogin(page, "admin@local.test", "/admin/temporadas");
    await createSeason(page, FIRST, "2040-10-01", "2041-04-30");

    // 003-AC5: FRC template, clamped to the season, then totals (003-AC4).
    await page.getByRole("button", { name: /modelo FRC/ }).click();
    await expect(page.getByTestId("phase-row")).toHaveCount(3);
    await expect(page.getByTestId("expected-full")).toHaveText("917,4 h");

    // 003-AC3: overlaps and out-of-season phases are rejected with a clear message.
    await addPhase(page, "Overlap", "2041-01-01", "2041-01-20", "10");
    await expect(page.getByTestId("new-phase-form")).toContainText("se sobrepõe a outra fase");
    // Outside the season: the date inputs carry the season bounds, so the browser blocks it
    // (the database trigger also rejects it: supabase/tests/06_ranking_test.sql).
    const lateStart = page.getByTestId("new-phase-form").getByLabel("Início");
    await lateStart.fill("2041-05-01");
    expect(await lateStart.evaluate((el: HTMLInputElement) => el.validity.rangeOverflow)).toBe(
      true,
    );

    // 003-AC2: each track has its own table; copy FRC into the empty FTC track.
    await page.getByRole("link", { name: "Alunos FTC" }).click();
    await expect(page.getByText("Nenhuma fase neste grupo")).toBeVisible();
    await page.getByRole("button", { name: "Copiar de Alunos FRC" }).click();
    await expect(page.getByTestId("phase-row")).toHaveCount(3);

    // Mentors keep their own phases.
    await page.getByRole("link", { name: "Mentores" }).click();
    await addPhase(page, "Temporada", "2040-10-01", "2041-04-30", "6");
    await expect(page.getByTestId("phase-row")).toHaveCount(1);

    // 003-AC5: copy from the previous season shifts the dates by one year.
    await createSeason(page, SECOND, "2041-10-01", "2042-04-30");
    await page.getByRole("button", { name: /temporada anterior/ }).click();
    await expect(page.getByTestId("phase-row")).toHaveCount(3);
    await expect(
      page.getByTestId("phase-row").first().locator('input[name="startsOn"]'),
    ).toHaveValue("2041-10-01");

    // 003-AC1: make current, then hand "current" back to the seeded season.
    await page.getByRole("button", { name: "Tornar atual" }).click();
    await expect(page.getByText("Atual", { exact: true })).toBeVisible();
    await page.goto("/admin/temporadas");
    await page
      .getByTestId("season-row")
      .filter({ hasText: "2026–2027" })
      .getByRole("button", { name: "Tornar atual" })
      .click();
    await expect(page.getByTestId("season-row").filter({ hasText: "2026–2027" })).toContainText(
      "Atual",
    );

    // 003-AC1: edit dates that would orphan phases is refused; deleting works.
    await page.getByTestId("season-row").filter({ hasText: SECOND }).getByRole("link").click();
    const seasonForm = page.getByTestId("season-form");
    await seasonForm.getByLabel("Fim").fill("2042-02-01");
    await seasonForm.getByRole("button", { name: "Salvar" }).click();
    await expect(seasonForm).toContainText("Algumas fases ficariam fora das novas datas");
    await page.getByRole("button", { name: "Excluir temporada" }).click();
    await expect(page).toHaveURL(/\/admin\/temporadas$/);
    await expect(page.getByTestId("season-row").filter({ hasText: SECOND })).toHaveCount(0);
  });
});
