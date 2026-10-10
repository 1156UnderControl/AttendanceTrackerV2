import { expect, test } from "@playwright/test";
import { clearSessions, db, memberId } from "./db";
import { devLogin } from "./helpers";

test.describe("auto-close and corrections", () => {
  test("[006-AC1][006-AC2] the cron route needs the secret and auto-closes once", async ({
    request,
  }) => {
    const elisa = await memberId("333331");
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString();
    await db.from("sessions").delete().eq("member_id", elisa).is("check_out", null);
    await clearSessions(
      elisa,
      new Date(Date.now() - 3 * 86_400_000).toISOString(),
      new Date().toISOString(),
    );
    const { data: session } = await db
      .from("sessions")
      .insert({ member_id: elisa, check_in: twoDaysAgo })
      .select("id")
      .single();

    expect((await request.get("/api/cron/auto-close")).status()).toBe(401);
    expect(
      (
        await request.get("/api/cron/auto-close", { headers: { authorization: "Bearer wrong" } })
      ).status(),
    ).toBe(401);

    const auth = { authorization: `Bearer ${process.env.CRON_SECRET}` };
    const first = await request.get("/api/cron/auto-close", { headers: auth });
    expect(first.status()).toBe(200);
    expect((await first.json()).closed).toBeGreaterThanOrEqual(1);

    const { data: closed } = await db
      .from("sessions")
      .select("auto_closed, credited_minutes, check_out")
      .eq("id", session!.id)
      .single();
    expect(closed).toMatchObject({ auto_closed: true, credited_minutes: 0 });
    expect(closed?.check_out).not.toBeNull();

    const second = await request.get("/api/cron/auto-close", { headers: auth });
    expect(await second.json()).toEqual({ closed: 0 });
  });

  test("[006-AC3][006-AC4][006-AC7] member requests a correction, admin approves", async ({
    page,
    browser,
  }) => {
    const ana = await memberId("111111");
    await clearSessions(ana, "2026-09-20T00:00:00-03:00", "2026-09-22T00:00:00-03:00");
    await db.from("sessions").insert({
      member_id: ana,
      check_in: "2026-09-20T18:00:00-03:00",
      check_out: "2026-09-21T04:00:00-03:00",
      auto_closed: true,
      credited_minutes: 0,
    });

    await devLogin(page, "ana@local.test");
    const row = page.getByTestId("session-row").filter({ hasText: "20 de set. de 2026" });
    await expect(row).toContainText("Saída não registrada");
    await row.getByText("Pedir correção").click();
    await row.getByLabel("Horário real de saída").fill("2026-09-20T22:30");
    await row.getByLabel("Observação (opcional)").fill("Esqueci de bater a saída");
    await row.getByRole("button", { name: "Enviar pedido" }).click();
    // The page re-renders with the request status right away.
    await expect(row).toContainText("Correção pendente");
    await expect(row.getByText("Pedir correção")).toHaveCount(0);

    const context = await browser.newContext();
    const admin = await context.newPage();
    await devLogin(admin, "admin@local.test", "/admin/sessoes");
    const request = admin
      .getByTestId("correction-row")
      .filter({ hasText: "Esqueci de bater a saída" });
    await expect(request).toContainText("Ana FRC");
    await request.getByRole("button", { name: "Aprovar" }).click();
    await expect(request).toHaveCount(0);
    await context.close();

    await page.reload();
    const approved = page.getByTestId("session-row").filter({ hasText: "20 de set. de 2026" });
    await expect(approved).toContainText("22:30");
    await expect(approved).toContainText("Correção aprovada");
    await expect(approved).toContainText("4,5 h");
  });

  test("[006-AC5][006-AC6] admin adds, rejects an overlap, discards, and it's all audited", async ({
    page,
  }) => {
    const fabio = await memberId("333332");
    await clearSessions(fabio, "2026-09-10T00:00:00-03:00", "2026-09-11T00:00:00-03:00");

    await devLogin(page, "admin@local.test", "/admin/membros");
    await page
      .getByTestId("member-row")
      .filter({ hasText: "Fábio Mentor (demo)" })
      .getByRole("link")
      .click();

    const form = page.getByTestId("new-session-form");
    await form.getByLabel("Entrada").fill("2026-09-10T14:00");
    await form.getByLabel("Saída").fill("2026-09-10T16:00");
    await form.getByRole("button", { name: "Adicionar sessão" }).click();
    await expect(form).toContainText("Sessão salva.");
    const row = page.getByTestId("admin-session-row").filter({ hasText: "10 de set. de 2026" });
    await expect(row).toHaveCount(1);

    await form.getByLabel("Entrada").fill("2026-09-10T15:00");
    await form.getByLabel("Saída").fill("2026-09-10T17:00");
    await form.getByRole("button", { name: "Adicionar sessão" }).click();
    await expect(form).toContainText("Esta sessão se sobrepõe a outra do mesmo membro.");

    await row.getByRole("button", { name: "Descartar" }).click();
    await page
      .getByRole("dialog", { name: "Descartar sessão?" })
      .getByRole("button", { name: "Descartar" })
      .click();
    await expect(row).toHaveCount(0);

    await page.goto("/admin/auditoria");
    await expect(
      page.getByTestId("audit-row").filter({ hasText: "discarded: false → true" }).first(),
    ).toBeVisible();
    await expect(page.getByTestId("audit-row").filter({ hasText: "criou" }).first()).toContainText(
      "Admin Local",
    );
  });
});
