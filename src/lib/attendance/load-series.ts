import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { Track } from "./track";
import { weeklySeries, type WeekPoint } from "./series";

/**
 * Loads one member's sessions and their track's phases for a season and builds the
 * weekly series. Runs with the caller's client, so RLS applies (members: own data).
 */
export async function loadMemberSeries(
  supabase: SupabaseClient<Database>,
  memberId: string,
  track: Track,
  seasonId: string | null,
  at: Date,
): Promise<WeekPoint[]> {
  if (!seasonId) return [];
  const { data: season } = await supabase
    .from("seasons")
    .select("starts_on, ends_on")
    .eq("id", seasonId)
    .maybeSingle();
  if (!season) return [];
  const [{ data: phases }, { data: sessions }] = await Promise.all([
    supabase
      .from("season_phases")
      .select("starts_on, ends_on, weekly_hours")
      .eq("season_id", seasonId)
      .eq("track", track),
    supabase
      .from("sessions")
      .select("check_in, check_out, credited_minutes, discarded")
      .eq("member_id", memberId)
      .eq("discarded", false)
      .lt("check_in", `${season.ends_on}T23:59:59-03:00`)
      .or(`check_out.gte.${season.starts_on}T00:00:00-03:00,check_out.is.null`),
  ]);
  return weeklySeries(
    (sessions ?? []).map((s) => ({
      checkIn: new Date(s.check_in),
      checkOut: s.check_out ? new Date(s.check_out) : null,
      creditedMinutes: s.credited_minutes,
      discarded: s.discarded,
    })),
    (phases ?? []).map((p) => ({
      startsOn: p.starts_on,
      endsOn: p.ends_on,
      weeklyHours: p.weekly_hours,
    })),
    { startsOn: season.starts_on, endsOn: season.ends_on },
    at,
  );
}
