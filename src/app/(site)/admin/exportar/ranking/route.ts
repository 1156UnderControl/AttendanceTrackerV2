import { getNow, getTranslations } from "next-intl/server";
import { resolveDashboard } from "@/lib/attendance/dashboard-params";
import { TRACKS, type Track } from "@/lib/attendance/track";
import { getAuth } from "@/lib/auth/session";
import { csvResponse } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// 004-AC8: ranking of one track as CSV, same filters as the dashboard.
export async function GET(request: Request) {
  if (!(await getAuth()).isAdmin) return new Response("Not found", { status: 404 });
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const track = TRACKS.find((tr) => tr === params.track) as Track | undefined;
  if (!track) return new Response("Bad request", { status: 400 });

  const supabase = await createClient();
  const { season, at, atDay } = await resolveDashboard(supabase, params, await getNow());
  if (!season) return new Response("No season", { status: 404 });
  const [{ data }, t] = await Promise.all([
    supabase.rpc("ranking", { p_season_id: season.id, p_track: track, p_at: at.toISOString() }),
    getTranslations("admin.dashboard"),
  ]);
  const h = (minutes: number | null) =>
    minutes === null ? null : Math.round((minutes / 60) * 10) / 10;

  return csvResponse(`ranking-${track.toLowerCase()}-${atDay}.csv`, [
    [
      t("position"),
      t("name"),
      `${t("week")} (h)`,
      `${t("phase")} (h)`,
      `${t("seasonHours")} (h)`,
      `${t("expected")} (h)`,
      `% ${t("pctToDate")}`,
      `% ${t("pctSeason")}`,
    ],
    ...(data ?? []).map((r) => [
      r.position,
      r.name,
      h(r.week_minutes),
      h(r.phase_minutes),
      h(r.season_minutes),
      h(r.expected_minutes),
      r.pct_to_date,
      r.pct_season,
    ]),
  ]);
}
