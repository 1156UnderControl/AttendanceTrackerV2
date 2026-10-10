import Link from "next/link";
import { getFormatter, getNow, getTranslations } from "next-intl/server";
import { Button, Card, inputClass, PageTitle, Section, Table, Td, Th, Tr } from "@/components/ui";
import { resolveDashboard } from "@/lib/attendance/dashboard-params";
import { TRACKS } from "@/lib/attendance/track";
import { parseThresholds, pctTone, toneClass } from "@/lib/format/attendance";
import { createClient } from "@/lib/supabase/server";
import { presentNow } from "./actions";
import { PresentPanel } from "./present-panel";

// Spec 004: three rankings, live presence, filters and CSV export.
export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const [t, format, now] = await Promise.all([getTranslations(), getFormatter(), getNow()]);
  const supabase = await createClient();
  const { seasons, season, at, atDay } = await resolveDashboard(supabase, sp, now);
  const pctMode = sp.pct === "season" ? "season" : "toDate";

  const [present, settings, rankings] = await Promise.all([
    presentNow(),
    supabase.from("settings").select("value").eq("key", "color_thresholds").maybeSingle(),
    season
      ? Promise.all(
          TRACKS.map(async (track) => {
            const { data } = await supabase.rpc("ranking", {
              p_season_id: season.id,
              p_track: track,
              p_at: at.toISOString(),
            });
            return { track, rows: data ?? [] };
          }),
        )
      : Promise.resolve([]),
  ]);
  const thresholds = parseThresholds(settings.data?.value);
  const hours = (minutes: number | null) =>
    minutes === null
      ? t("common.empty")
      : t("common.hours", { value: format.number(minutes / 60, { maximumFractionDigits: 1 }) });
  const pct = (value: number | null) =>
    value === null ? t("common.empty") : `${format.number(value, { maximumFractionDigits: 0 })}%`;
  const exportQuery = new URLSearchParams({ season: season?.id ?? "", at: atDay });

  return (
    <>
      <PageTitle>{t("admin.dashboard.title")}</PageTitle>

      {/* 004-AC4: filters in one row above the data */}
      <form className="flex flex-wrap items-end gap-3" data-testid="dashboard-filters">
        <label className="flex flex-col gap-1 font-bold">
          {t("admin.dashboard.season")}
          <select name="season" defaultValue={season?.id} className={inputClass}>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-bold">
          {t("admin.dashboard.asOf")}
          <input type="date" name="at" defaultValue={atDay} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 font-bold">
          {t("admin.dashboard.pctMode")}
          <select name="pct" defaultValue={pctMode} className={inputClass}>
            <option value="toDate">{t("admin.dashboard.pctToDate")}</option>
            <option value="season">{t("admin.dashboard.pctSeason")}</option>
          </select>
        </label>
        <Button type="submit" variant="secondary">
          {t("admin.dashboard.apply")}
        </Button>
      </form>

      <PresentPanel initial={present} />

      {!season ? (
        <Card>
          <p>{t("admin.dashboard.noSeason")}</p>
        </Card>
      ) : (
        rankings.map(({ track, rows }) => {
          const values = rows
            .map((r) => (pctMode === "season" ? r.pct_season : r.pct_to_date))
            .filter((v): v is number => v !== null);
          const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
          const atGoal = values.filter((v) => v >= thresholds.green).length;
          return (
            <Section key={track} title={t(`labels.${track}`)}>
              <div
                className="flex flex-wrap items-center justify-between gap-3"
                data-testid={`summary-${track}`}
              >
                {/* 004-AC6 */}
                <p className="font-semibold">
                  {t("admin.dashboard.summary", {
                    active: rows.length,
                    avg: pct(avg),
                    atGoal,
                    green: thresholds.green,
                  })}
                  {rows[0] && (
                    <>
                      {" · "}
                      {rows[0].current_phase
                        ? t("admin.dashboard.currentPhase", { phase: rows[0].current_phase })
                        : t("admin.dashboard.noPhase")}
                    </>
                  )}
                </p>
                <a
                  href={`/admin/exportar/ranking?${exportQuery}&track=${track}`}
                  className="rounded-brutal border-2 border-ink bg-white px-3 py-1.5 font-bold shadow-brutal"
                >
                  {t("admin.dashboard.exportRanking")}
                </a>
              </div>
              {rows.length === 0 ? (
                <p className="opacity-80">{t("admin.dashboard.none")}</p>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>{t("admin.dashboard.position")}</Th>
                      <Th>{t("admin.dashboard.name")}</Th>
                      <Th>{t("admin.dashboard.week")}</Th>
                      <Th>{t("admin.dashboard.phase")}</Th>
                      <Th>{t("admin.dashboard.seasonHours")}</Th>
                      <Th>{t("admin.dashboard.expected")}</Th>
                      <Th>{t("admin.dashboard.pct")}</Th>
                    </tr>
                  </thead>
                  <tbody data-testid={`ranking-${track}`}>
                    {rows.map((r) => {
                      const value = pctMode === "season" ? r.pct_season : r.pct_to_date;
                      return (
                        <Tr key={r.member_id} data-testid="ranking-row">
                          <Td className="font-black">{r.position}</Td>
                          <Td>
                            <Link
                              href={`/admin/membros/${r.member_id}`}
                              className="font-bold underline-offset-4 hover:underline"
                            >
                              {r.name}
                            </Link>
                          </Td>
                          <Td className="tabular-nums">{hours(r.week_minutes)}</Td>
                          <Td className="tabular-nums">{hours(r.phase_minutes)}</Td>
                          <Td className="tabular-nums">{hours(r.season_minutes)}</Td>
                          <Td className="tabular-nums">
                            {hours(
                              pctMode === "season" ? r.expected_full_minutes : r.expected_minutes,
                            )}
                          </Td>
                          <Td
                            className={`font-black tabular-nums ${toneClass[pctTone(value, thresholds)]}`}
                          >
                            {pct(value)}
                          </Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Section>
          );
        })
      )}

      {season && (
        <Card title={t("admin.dashboard.sessionsExportTitle")}>
          <form action="/admin/exportar/sessoes" className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 font-bold">
              {t("admin.dashboard.from")}
              <input
                type="date"
                name="from"
                defaultValue={season.starts_on}
                required
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 font-bold">
              {t("admin.dashboard.to")}
              <input type="date" name="to" defaultValue={atDay} required className={inputClass} />
            </label>
            <Button type="submit" variant="secondary">
              {t("admin.dashboard.exportSessions")}
            </Button>
          </form>
        </Card>
      )}
    </>
  );
}
