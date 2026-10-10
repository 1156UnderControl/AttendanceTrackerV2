import { describe, expect, it } from "vitest";
import { rankWeekly } from "./weekly-ranking";

const row = (name: string, week: number, season = week) => ({
  member_id: name,
  name,
  week_minutes: week,
  season_minutes: season,
  pct_to_date: null,
});

describe("[004-AC2] rankWeekly", () => {
  it("ranks by the week's %, ties share a position", () => {
    const ranked = rankWeekly(
      [row("Bia", 240), row("Ana", 480), row("Caio", 240), row("Duda", 0)],
      480,
    );
    expect(ranked.map((r) => [r.position, r.name, r.weekPct])).toEqual([
      [1, "Ana", 100],
      [2, "Bia", 50],
      [2, "Caio", 50],
      [3, "Duda", 0],
    ]);
  });

  it("without a weekly goal the % is null and hours decide the order", () => {
    const ranked = rankWeekly([row("Ana", 60), row("Bia", 120)], 0);
    expect(ranked.map((r) => [r.name, r.weekPct])).toEqual([
      ["Bia", null],
      ["Ana", null],
    ]);
  });
});
