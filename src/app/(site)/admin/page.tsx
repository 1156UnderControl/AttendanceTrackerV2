import Link from "next/link";
import { getFormatter, getNow, getTranslations } from "next-intl/server";
import { Button, Card, inputClass, PageTitle, Section, Table, Td, Th, Tr } from "@/components/ui";
import { resolveDashboard } from "@/lib/attendance/dashboard-params";
import { TRACKS } from "@/lib/attendance/track";
import { rankWeekly } from "@/lib/attendance/weekly-ranking";
import { parseThresholds, pctTone, toneClass } from "@/lib/format/attendance";
import { createClient } from "@/lib/supabase/server";
import { presentNow } from "./actions";
import { PresentPanel } from "./present-panel";

const navClass = "rounded-brutal border-2 border-ink bg-white px-3 py-2 font-bold shadow-brutal";

// Spec 004: one week at a time (like V1), per track, with live presence and CSV export.
export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const [t, format, now] = await Promise.all([getTranslations(), getFormatter(), getNow()]);
  const supabase = await createClient();
  const { seasons, season, weeks, week, at, weekStartsAt } = await resolveDashboard(
    supabase,
    sp,
    now,
  );

  const [present, settings, rankings] = await Promise.all([
    presentNow(),
    supabase.from("settings").select("value").eq("key", "color_thresholds").maybeSingle(),
    season
      ? Promise.all(
          TRACKS.map(async (track) => {
            const [{ data }, { data: toEnd }, { data: toStart }] = await Promise.all([
              supabase.rpc("ranking", {
                p_season_id: season.id,
                p_track: track,
                p_at: at.toISOString(),
              }),
              supabase.rpc("expected_minutes", {
                p_season_id: season.id,
                p_track: track,
                p_at: at.toISOString(),
              }),
              supabase.rpc("expected_minutes", {
                p_season_id: season.id,
                p_track: track,
                p_at: weekStartsAt.toISOString(),
              }),
            ]);
            const weekGoal = Math.max(0, (toEnd ?? 0) - (toStart ?? 0));
            return { track, rows: rankWeekly(data ?? [], weekGoal) };
          }),
        )
      : Promise.resolve([]),
  ]);
  const thresholds = parseThresholds(settings.data?.value);
  const hours = (minutes: number) =>
    t("common.hours", { value: format.number(minutes / 60, { maximumFractionDigits: 1 }) });
  const pct = (value: number | null) =>
    value === null ? t("common.empty") : `${format.number(value, { maximumFractionDigits: 0 })}%`;
  const weekLabel = (monday: string) => {
    const from = new Date(`${monday}T12:00:00`);
    const to = new Date(from.getTime() + 6 * 86_400_000);
    const day = { day: "2-digit", month: "short" } as const;
    return t("admin.dashboard.weekOption", {
      from: format.dateTime(from, day),
      to: format.dateTime(to, day),
    });
  };
  const index = weeks.indexOf(week);
  const older = weeks[index + 1];
  const newer = weeks[index - 1];
  const link = (monday: string) =>
    `?${new URLSearchParams({ season: season?.id ?? "", week: monday })}`;
  const exportQuery = new URLSearchParams({ season: season?.id ?? "", week });

  return (
    <>
      <PageTitle>{t("admin.dashboard.title")}</PageTitle>

      {/* 004-AC4: season and week, in one row above the data */}
      <div className="flex flex-wrap items-end gap-3">
        {/* key: remount so the selects show the new values after ◀ / ▶ navigation. */}
        <form
          key={`${season?.id}-${week}`}
          className="flex flex-wrap items-end gap-3"
          data-testid="dashboard-filters"
        >
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
            {t("admin.dashboard.weekFilter")}
            <select name="week" defaultValue={week} className={inputClass}>
              {weeks.map((monday) => (
                <option key={monday} value={monday}>
                  {weekLabel(monday)}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="secondary">
            {t("admin.dashboard.apply")}
          </Button>
        </form>
        <div className="flex gap-2">
          {older ? (
            <Link
              href={link(older)}
              className={navClass}
              aria-label={t("admin.dashboard.previousWeek")}
              title={t("admin.dashboard.previousWeek")}
            >
              ◀
            </Link>
          ) : null}
          {newer ? (
            <Link
              href={link(newer)}
              className={navClass}
              aria-label={t("admin.dashboard.nextWeek")}
              title={t("admin.dashboard.nextWeek")}
            >
              ▶
            </Link>
          ) : null}
        </div>
      </div>

      <PresentPanel initial={present} />

      {!season ? (
        <Card>
          <p>{t("admin.dashboard.noSeason")}</p>
        </Card>
      ) : (
        rankings.map(({ track, rows }) => {
          return (
            <Section
              key={track}
              title={`${t(`labels.${track}`)} · ${weekLabel(week)}`}
              actions={
                <a
                  href={`/admin/exportar/ranking?${exportQuery}&track=${track}`}
                  data-testid={`export-${track}`}
                  className="rounded-brutal border-2 border-ink bg-white px-3 py-1.5 font-bold shadow-brutal"
                >
                  {t("admin.dashboard.exportRanking")}
                </a>
              }
            >
              {rows.length === 0 ? (
                <p className="opacity-80">{t("admin.dashboard.none")}</p>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>{t("admin.dashboard.position")}</Th>
                      <Th>{t("admin.dashboard.name")}</Th>
                      <Th>{t("admin.dashboard.weekHours")}</Th>
                      <Th>{t("admin.dashboard.weekGoal")}</Th>
                      <Th>{t("admin.dashboard.weekPct")}</Th>
                      <Th>{t("admin.dashboard.seasonHours")}</Th>
                      <Th>{t("admin.dashboard.seasonPct")}</Th>
                    </tr>
                  </thead>
                  <tbody data-testid={`ranking-${track}`}>
                    {rows.map((r) => (
                      <Tr key={r.memberId} data-testid="ranking-row">
                        <Td className="font-black">{r.position}</Td>
                        <Td>
                          <Link
                            href={`/admin/membros/${r.memberId}`}
                            className="font-bold underline-offset-4 hover:underline"
                          >
                            {r.name}
                          </Link>
                        </Td>
                        <Td className="tabular-nums">{hours(r.weekMinutes)}</Td>
                        <Td className="tabular-nums">{hours(r.weekGoalMinutes)}</Td>
                        <Td
                          className={`font-black tabular-nums ${toneClass[pctTone(r.weekPct, thresholds)]}`}
                        >
                          {pct(r.weekPct)}
                        </Td>
                        <Td className="tabular-nums">{hours(r.seasonMinutes)}</Td>
                        <Td
                          className={`tabular-nums ${toneClass[pctTone(r.seasonPct, thresholds)]}`}
                        >
                          {pct(r.seasonPct)}
                        </Td>
                      </Tr>
                    ))}
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
              <input type="date" name="from" defaultValue={week} required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 font-bold">
              {t("admin.dashboard.to")}
              <input
                type="date"
                name="to"
                defaultValue={new Date(Date.parse(`${week}T12:00:00Z`) + 6 * 86_400_000)
                  .toISOString()
                  .slice(0, 10)}
                required
                className={inputClass}
              />
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
