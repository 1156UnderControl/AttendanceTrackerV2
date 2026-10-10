// Weekly ranking for the dashboard (attendance-math.md, "Weekly view"; 004-AC2).
import { attendancePct } from "./math";

// Fields are nullable because generated types treat composite (ranking_row) fields so.
export type RankingInput = {
  member_id: string | null;
  name: string | null;
  week_minutes: number | null;
  season_minutes: number | null;
  pct_to_date: number | null;
};

export type WeeklyRow = {
  position: number;
  memberId: string;
  name: string;
  weekMinutes: number;
  weekGoalMinutes: number;
  weekPct: number | null;
  seasonMinutes: number;
  seasonPct: number | null;
};

/** Orders by the week's %, then week hours, then name; equal results share a position. */
export function rankWeekly(rows: RankingInput[], weekGoalMinutes: number): WeeklyRow[] {
  const items = rows.map((r) => {
    const weekMinutes = r.week_minutes ?? 0;
    return {
      memberId: r.member_id ?? "",
      name: r.name ?? "",
      weekMinutes,
      weekGoalMinutes,
      weekPct: attendancePct(weekMinutes, weekGoalMinutes),
      seasonMinutes: r.season_minutes ?? 0,
      seasonPct: r.pct_to_date,
    };
  });
  items.sort(
    (a, b) =>
      (b.weekPct ?? -1) - (a.weekPct ?? -1) ||
      b.weekMinutes - a.weekMinutes ||
      a.name.localeCompare(b.name, "pt-BR"),
  );
  let position = 0;
  let previous: string | null = null;
  return items.map((item) => {
    const key = `${item.weekPct}|${item.weekMinutes}`;
    if (key !== previous) position += 1;
    previous = key;
    return { ...item, position };
  });
}
