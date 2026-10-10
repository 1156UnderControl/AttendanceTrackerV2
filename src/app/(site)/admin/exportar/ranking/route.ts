import { getNow, getTranslations } from "next-intl/server";
import { resolveDashboard } from "@/lib/attendance/dashboard-params";
import { TRACKS, type Track } from "@/lib/attendance/track";
import { parseSort, rankWeekly, sortWeekly } from "@/lib/attendance/weekly-ranking";
import { getAuth } from "@/lib/auth/session";
import { csvResponse } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// 004-AC8: one track's ranking for the selected week, as CSV (same filters as the dashboard).
export async function GET(request: Request) {
  if (!(await getAuth()).isAdmin) return new Response("Not found", { status: 404 });
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const track = TRACKS.find((tr) => tr === params.track) as Track | undefined;
  if (!track) return new Response("Bad request", { status: 400 });

  const supabase = await createClient();
  const { season, week, at, weekStartsAt } = await resolveDashboard(
    supabase,
    params,
    await getNow(),
  );
  if (!season) return new Response("No season", { status: 404 });
  const [{ data }, { data: toEnd }, { data: toStart }, t] = await Promise.all([
    supabase.rpc("ranking", { p_season_id: season.id, p_track: track, p_at: at.toISOString() }),
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
    getTranslations("admin.dashboard"),
  ]);
  const sort = parseSort(params.sort, params.dir);
  // Same order as the dashboard's clickable headers.
  const rows = sortWeekly(
    rankWeekly(data ?? [], Math.max(0, (toEnd ?? 0) - (toStart ?? 0))),
    sort.key,
    sort.dir,
  );
  const h = (minutes: number) => Math.round((minutes / 60) * 10) / 10;

  return csvResponse(`ranking-${track.toLowerCase()}-${week}.csv`, [
    [
      t("position"),
      t("name"),
      `${t("weekHours")} (h)`,
      `${t("weekGoal")} (h)`,
      t("weekPct"),
      `${t("seasonHours")} (h)`,
      t("seasonPct"),
    ],
    ...rows.map((r) => [
      r.position,
      r.name,
      h(r.weekMinutes),
      h(r.weekGoalMinutes),
      r.weekPct,
      h(r.seasonMinutes),
      r.seasonPct,
    ]),
  ]);
}
