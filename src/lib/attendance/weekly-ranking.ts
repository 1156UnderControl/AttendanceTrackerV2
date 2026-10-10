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

export const SORT_KEYS = ["name", "week", "week_pct", "season", "season_pct"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";

export function parseSort(sort: unknown, dir: unknown): { key: SortKey; dir: SortDir } {
  const key = SORT_KEYS.find((k) => k === sort) ?? "week_pct";
  const fallback: SortDir = key === "name" ? "asc" : "desc";
  return { key, dir: dir === "asc" || dir === "desc" ? dir : fallback };
}

const value: Record<Exclude<SortKey, "name">, (r: WeeklyRow) => number | null> = {
  week: (r) => r.weekMinutes,
  week_pct: (r) => r.weekPct,
  season: (r) => r.seasonMinutes,
  season_pct: (r) => r.seasonPct,
};

/**
 * Re-orders an already ranked list by a column (clickable headers). Positions keep the
 * official weekly ranking; empty values ("—") always go last; ties fall back to name.
 */
export function sortWeekly(rows: WeeklyRow[], key: SortKey, dir: SortDir): WeeklyRow[] {
  const sign = dir === "asc" ? 1 : -1;
  const byName = (a: WeeklyRow, b: WeeklyRow) => a.name.localeCompare(b.name, "pt-BR");
  return [...rows].sort((a, b) => {
    if (key === "name") return sign * byName(a, b);
    const va = value[key](a);
    const vb = value[key](b);
    if (va === null || vb === null) return va === vb ? byName(a, b) : va === null ? 1 : -1;
    return sign * (va - vb) || byName(a, b);
  });
}
