import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/database.types";
import { localDate, localDayStart } from "./math";

export type DashboardParams = {
  seasons: Tables<"seasons">[];
  season: Tables<"seasons"> | null;
  /** The instant the numbers are computed at: now, or the end of the chosen day. */
  at: Date;
  atDay: string;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Season (default: current) and "as of" date (default: today) from the query string (004-AC4). */
export async function resolveDashboard(
  supabase: SupabaseClient<Database>,
  params: { season?: string | string[]; at?: string | string[] },
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
  const requested = typeof params.at === "string" && DAY.test(params.at) ? params.at : today;
  if (requested >= today) return { seasons, season, at: now, atDay: today };
  const [y, m, d] = requested.split("-").map(Number);
  const nextDay = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  return { seasons, season, at: new Date(localDayStart(nextDay).getTime() - 1), atDay: requested };
}
