import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/database.types";
import { localDate, localDayStart, weekStart } from "./math";

export type DashboardParams = {
  seasons: Tables<"seasons">[];
  season: Tables<"seasons"> | null;
  /** Mondays ("YYYY-MM-DD") of the season's weeks up to today, newest first. */
  weeks: string[];
  week: string;
  /** End of the selected week, or now for the current week. */
  at: Date;
  /** Just before the selected week, to compute its goal. */
  weekStartsAt: Date;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function addDays(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Season (default: current) and week (default: the current one) from the query string (004-AC4). */
export async function resolveDashboard(
  supabase: SupabaseClient<Database>,
  params: { season?: string | string[]; week?: string | string[] },
  now: Date,
): Promise<DashboardParams> {
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .order("starts_on", { ascending: false });
  const seasons = data ?? [];
  const season =
    seasons.find((s) => s.id === params.season) ??
    seasons.find((s) => s.is_current) ??
    seasons[0] ??
    null;

  const today = localDate(now);
  const currentMonday = localDate(weekStart(now));
  const weeks: string[] = [];
  if (season) {
    const first = localDate(weekStart(localDayStart(season.starts_on)));
    const lastDay = season.ends_on < today ? season.ends_on : today;
    for (let monday = first; monday <= lastDay; monday = addDays(monday, 7)) weeks.unshift(monday);
  }
  if (!weeks.length) weeks.push(currentMonday);

  const requested = typeof params.week === "string" && DAY.test(params.week) ? params.week : null;
  const week = requested && weeks.includes(requested) ? requested : weeks[0];
  const nextMonday = localDayStart(addDays(week, 7));
  const at = nextMonday.getTime() > now.getTime() ? now : new Date(nextMonday.getTime() - 1);
  return {
    seasons,
    season,
    weeks,
    week,
    at,
    weekStartsAt: new Date(localDayStart(week).getTime() - 1),
  };
}
