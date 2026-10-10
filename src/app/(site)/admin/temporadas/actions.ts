"use server";

import { format, lastDayOfMonth, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { shiftYears } from "@/lib/attendance/dates";
import { TRACKS } from "@/lib/attendance/track";
import { requireAdmin } from "@/lib/auth/session";
import { errorCode, type ActionState } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const track = z
  .enum(TRACKS as [string, ...string[]])
  .transform((t) => t as (typeof TRACKS)[number]);

const seasonSchema = z
  .object({ name: z.string().trim().min(1).max(40), startsOn: day, endsOn: day })
  .refine((s) => s.endsOn >= s.startsOn, { message: "INVALID_DATES" });

function revalidateSeasons(id?: string) {
  revalidatePath("/admin/temporadas");
  if (id) revalidatePath(`/admin/temporadas/${id}`);
}

// 003-AC1
export async function createSeason(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = seasonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "INVALID_DATES" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seasons")
    .insert({
      name: parsed.data.name,
      starts_on: parsed.data.startsOn,
      ends_on: parsed.data.endsOn,
    })
    .select("id")
    .single();
  if (error) return { error: errorCode(error) };
  revalidateSeasons();
  redirect(`/admin/temporadas/${data.id}`);
}

// 003-AC1: new dates must still contain every phase of the season.
export async function updateSeason(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const parsed = seasonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "INVALID_DATES" };
  const supabase = await createClient();
  const { count } = await supabase
    .from("season_phases")
    .select("id", { count: "exact", head: true })
    .eq("season_id", id)
    .or(`starts_on.lt.${parsed.data.startsOn},ends_on.gt.${parsed.data.endsOn}`);
  if (count) return { error: "PHASES_OUTSIDE_SEASON" };
  const { error } = await supabase
    .from("seasons")
    .update({
      name: parsed.data.name,
      starts_on: parsed.data.startsOn,
      ends_on: parsed.data.endsOn,
    })
    .eq("id", id);
  if (error) return { error: errorCode(error) };
  revalidateSeasons(id);
  return { ok: true };
}

export async function deleteSeason(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("seasons").delete().eq("id", id);
  revalidateSeasons();
  redirect("/admin/temporadas");
}

export async function makeCurrent(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.rpc("set_current_season", { p_season_id: id });
  revalidateSeasons(id);
}

const phaseSchema = z
  .object({
    seasonId: z.uuid(),
    phaseId: z.uuid().optional(),
    track,
    name: z.string().trim().min(1).max(60),
    startsOn: day,
    endsOn: day,
    weeklyHours: z.coerce.number().min(0).max(168),
  })
  .refine((p) => p.endsOn >= p.startsOn, { message: "INVALID_DATES" });

// 003-AC2, AC3: overlaps and out-of-season phases are rejected by the database.
export async function savePhase(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = phaseSchema.safeParse({
    ...Object.fromEntries(formData),
    phaseId: formData.get("phaseId") || undefined,
  });
  if (!parsed.success) return { error: "INVALID_DATES" };
  const { seasonId, phaseId, name, startsOn, endsOn, weeklyHours } = parsed.data;
  const values = { name, starts_on: startsOn, ends_on: endsOn, weekly_hours: weeklyHours };
  const supabase = await createClient();
  const { error } = phaseId
    ? await supabase.from("season_phases").update(values).eq("id", phaseId)
    : await supabase
        .from("season_phases")
        .insert({ ...values, season_id: seasonId, track: parsed.data.track });
  if (error) return { error: errorCode(error) };
  revalidateSeasons(seasonId);
  return { ok: true };
}

export async function deletePhase(formData: FormData) {
  await requireAdmin();
  const phaseId = z.uuid().parse(formData.get("phaseId"));
  const seasonId = z.uuid().parse(formData.get("seasonId"));
  const supabase = await createClient();
  await supabase.from("season_phases").delete().eq("id", phaseId);
  revalidateSeasons(seasonId);
}

type PhaseInput = { name: string; starts_on: string; ends_on: string; weekly_hours: number };

/** The FRC defaults from the mentors (docs/sdd.md §1.5), clamped to the season. */
function frcTemplate(season: { starts_on: string; ends_on: string }): PhaseInput[] {
  const y = parseISO(season.starts_on).getFullYear();
  const febEnd = format(lastDayOfMonth(new Date(y + 1, 1, 1)), "yyyy-MM-dd");
  const phases: PhaseInput[] = [
    { name: "Pré-temporada", starts_on: `${y}-10-01`, ends_on: `${y + 1}-01-08`, weekly_hours: 8 },
    { name: "Build season", starts_on: `${y + 1}-01-09`, ends_on: febEnd, weekly_hours: 60 },
    {
      name: "Competições",
      starts_on: `${y + 1}-03-01`,
      ends_on: `${y + 1}-04-30`,
      weekly_hours: 42,
    },
  ];
  return phases
    .map((p) => ({
      ...p,
      starts_on: p.starts_on < season.starts_on ? season.starts_on : p.starts_on,
      ends_on: p.ends_on > season.ends_on ? season.ends_on : p.ends_on,
    }))
    .filter((p) => p.starts_on <= p.ends_on);
}

// 003-AC5: copy into an empty track from another track, the previous season, or the FRC template.
export async function copyPhases(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const seasonId = z.uuid().parse(formData.get("seasonId"));
  const target = track.parse(formData.get("track"));
  const source = z.string().parse(formData.get("source"));
  const supabase = await createClient();

  const [{ data: season }, { count }] = await Promise.all([
    supabase.from("seasons").select("id, starts_on, ends_on").eq("id", seasonId).single(),
    supabase
      .from("season_phases")
      .select("id", { count: "exact", head: true })
      .eq("season_id", seasonId)
      .eq("track", target),
  ]);
  if (!season) return { error: "UNKNOWN" };
  if (count) return { error: "TRACK_NOT_EMPTY" };

  let phases: PhaseInput[];
  if (source === "template-frc") {
    phases = frcTemplate(season);
  } else if (source === "previous") {
    const { data: previous } = await supabase
      .from("seasons")
      .select("id, starts_on")
      .lt("starts_on", season.starts_on)
      .order("starts_on", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!previous) return { error: "NO_PREVIOUS_SEASON" };
    const years =
      parseISO(season.starts_on).getFullYear() - parseISO(previous.starts_on).getFullYear();
    const { data } = await supabase
      .from("season_phases")
      .select("name, starts_on, ends_on, weekly_hours")
      .eq("season_id", previous.id)
      .eq("track", target);
    if (!data?.length) return { error: "NO_PREVIOUS_SEASON" };
    phases = data.map((p) => ({
      ...p,
      starts_on: shiftYears(p.starts_on, years),
      ends_on: shiftYears(p.ends_on, years),
    }));
  } else {
    const from = track.parse(source.replace(/^track:/, ""));
    const { data } = await supabase
      .from("season_phases")
      .select("name, starts_on, ends_on, weekly_hours")
      .eq("season_id", seasonId)
      .eq("track", from);
    phases = data ?? [];
  }

  if (phases.length) {
    // One insert statement: all phases or none.
    const { error } = await supabase
      .from("season_phases")
      .insert(phases.map((p) => ({ ...p, season_id: seasonId, track: target })));
    if (error) return { error: errorCode(error) };
  }
  revalidateSeasons(seasonId);
  return { ok: true };
}
