import { describe, expect, it } from "vitest";
import { parseSort, rankWeekly, sortWeekly } from "./weekly-ranking";

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

describe("sortWeekly (clickable headers)", () => {
  const ranked = rankWeekly(
    [
      { member_id: "a", name: "Ana", week_minutes: 480, season_minutes: 600, pct_to_date: 80 },
      { member_id: "b", name: "Bia", week_minutes: 240, season_minutes: 900, pct_to_date: 120 },
      { member_id: "c", name: "Caio", week_minutes: 0, season_minutes: 0, pct_to_date: null },
    ],
    480,
  );

  it("sorts by season hours, keeping the weekly positions", () => {
    const sorted = sortWeekly(ranked, "season", "desc");
    expect(sorted.map((r) => [r.name, r.position])).toEqual([
      ["Bia", 2],
      ["Ana", 1],
      ["Caio", 3],
    ]);
  });

  it("puts empty values last in both directions", () => {
    expect(sortWeekly(ranked, "season_pct", "asc").map((r) => r.name)).toEqual([
      "Ana",
      "Bia",
      "Caio",
    ]);
    expect(sortWeekly(ranked, "season_pct", "desc").map((r) => r.name)).toEqual([
      "Bia",
      "Ana",
      "Caio",
    ]);
  });

  it("sorts by name and defaults sensibly", () => {
    expect(sortWeekly(ranked, "name", "desc").map((r) => r.name)).toEqual(["Caio", "Bia", "Ana"]);
    expect(parseSort("name", undefined)).toEqual({ key: "name", dir: "asc" });
    expect(parseSort("bogus", "sideways")).toEqual({ key: "week_pct", dir: "desc" });
  });
});
