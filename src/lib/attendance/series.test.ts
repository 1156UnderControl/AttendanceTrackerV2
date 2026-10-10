import { describe, expect, it } from "vitest";
import type { Phase, Session } from "./math";
import { weeklySeries } from "./series";

const phases: Phase[] = [
  { startsOn: "2026-10-01", endsOn: "2027-01-08", weeklyHours: 8 },
  { startsOn: "2027-01-09", endsOn: "2027-02-28", weeklyHours: 60 },
];
const season = { startsOn: "2026-10-01", endsOn: "2027-04-30" };
const session = (checkIn: string, checkOut: string): Session => ({
  checkIn: new Date(checkIn),
  checkOut: new Date(checkOut),
  creditedMinutes: null,
  discarded: false,
});

describe("[004-AC7][005-AC3] weeklySeries", () => {
  const sessions = [
    session("2026-10-01T14:00:00-03:00", "2026-10-01T18:00:00-03:00"), // Thu, 4 h
    session("2026-10-06T14:00:00-03:00", "2026-10-06T18:00:00-03:00"), // Tue next week, 4 h
  ];

  it("starts on the Monday before the season and stops at `at`", () => {
    const points = weeklySeries(sessions, phases, season, new Date("2026-10-07T12:00:00-03:00"));
    expect(points.map((p) => p.weekStart)).toEqual(["2026-09-28", "2026-10-05"]);
  });

  it("counts worked minutes per week and expected for elapsed phase days", () => {
    const [first, second] = weeklySeries(
      sessions,
      phases,
      season,
      new Date("2026-10-07T12:00:00-03:00"),
    );
    // Season starts Thursday Oct 1: 4 days (Thu–Sun) × 8 h / 7.
    expect(first.workedMinutes).toBe(240);
    expect(first.expectedMinutes).toBeCloseTo((8 * 60 * 4) / 7);
    // Through Wednesday Oct 7: 3 days.
    expect(second.workedMinutes).toBe(240);
    expect(second.expectedMinutes).toBeCloseTo((8 * 60 * 3) / 7);
  });

  it("cumulative expected matches attendance-math example 1 (8 h at Oct 7)", () => {
    const points = weeklySeries(sessions, phases, season, new Date("2026-10-07T12:00:00-03:00"));
    expect(points.at(-1)!.cumulativeExpected).toBeCloseTo(480);
    expect(points.at(-1)!.cumulativeWorked).toBe(480);
  });

  it("is empty before the season", () => {
    expect(weeklySeries(sessions, phases, season, new Date("2026-09-20T12:00:00-03:00"))).toEqual(
      [],
    );
  });
});
