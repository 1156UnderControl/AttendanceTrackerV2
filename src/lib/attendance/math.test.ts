// Same worked examples as supabase/tests/01_attendance_math_test.sql (003-AC6, 008-AC3).
import { describe, expect, it } from "vitest";
import {
  attendancePct,
  expectedFullMinutes,
  expectedMinutes,
  localDate,
  localDayStart,
  sessionMinutes,
  weekStart,
  type Phase,
  type Session,
} from "./math";

const frc: Phase[] = [
  { startsOn: "2026-10-01", endsOn: "2027-01-08", weeklyHours: 8 },
  { startsOn: "2027-01-09", endsOn: "2027-02-28", weeklyHours: 60 },
  { startsOn: "2027-03-01", endsOn: "2027-04-30", weeklyHours: 42 },
];

const at = (iso: string) => new Date(iso);
const hours = (minutes: number) => Math.round((minutes / 60) * 100) / 100;
const closed = (
  checkIn: string,
  checkOut: string,
  creditedMinutes: number | null = null,
): Session => ({
  checkIn: at(checkIn),
  checkOut: at(checkOut),
  creditedMinutes,
  discarded: false,
});

describe("time zone helpers", () => {
  it("local midnight is in America/Sao_Paulo (UTC-3)", () => {
    expect(localDayStart("2026-10-01").toISOString()).toBe("2026-10-01T03:00:00.000Z");
  });

  it("local date of an instant near midnight", () => {
    expect(localDate(at("2026-10-12T02:30:00Z"))).toBe("2026-10-11");
  });

  it("weeks start on Monday", () => {
    expect(weekStart(at("2026-10-11T22:00:00-03:00")).toISOString()).toBe(
      "2026-10-05T03:00:00.000Z",
    );
    expect(weekStart(at("2026-10-12T00:30:00-03:00")).toISOString()).toBe(
      "2026-10-12T03:00:00.000Z",
    );
  });
});

describe("[003-AC6] attendance-math worked examples", () => {
  it("example 1: 7 days into pre-season = 8 h, and 6 h worked = 75%", () => {
    const expected = expectedMinutes(frc, at("2026-10-07T12:00:00-03:00"));
    expect(expected).toBe(480);
    expect(attendancePct(360, expected)).toBe(75);
  });

  it("example 2: all of pre-season + 7 days of build = 174.29 h", () => {
    expect(hours(expectedMinutes(frc, at("2027-01-15T12:00:00-03:00")))).toBe(174.29);
  });

  it("example 3: before any phase = 0, shown as —", () => {
    const expected = expectedMinutes(frc, at("2026-09-20T12:00:00-03:00"));
    expect(expected).toBe(0);
    expect(attendancePct(0, expected)).toBeNull();
  });

  it("example 4: a session across midnight Sunday is split between weeks", () => {
    const s = closed("2026-10-11T22:00:00-03:00", "2026-10-12T01:00:00-03:00");
    expect(sessionMinutes(s, localDayStart("2026-10-05"), localDayStart("2026-10-12"))).toBe(120);
    expect(sessionMinutes(s, localDayStart("2026-10-12"), localDayStart("2026-10-19"))).toBe(60);
  });

  it("example 5: auto-closed counts 0 until corrected to 21:00 (180 min)", () => {
    const from = localDayStart("2026-10-01");
    const to = localDayStart("2026-10-08");
    expect(
      sessionMinutes(closed("2026-10-02T18:00:00-03:00", "2026-10-03T04:00:00-03:00", 0), from, to),
    ).toBe(0);
    expect(
      sessionMinutes(closed("2026-10-02T18:00:00-03:00", "2026-10-02T21:00:00-03:00"), from, to),
    ).toBe(180);
  });

  it("example 6: full FRC season = 917.43 h", () => {
    expect(hours(expectedFullMinutes(frc))).toBe(917.43);
  });
});

describe("sessionMinutes", () => {
  it("counts open sessions until now", () => {
    const open: Session = {
      checkIn: at("2026-10-07T18:00:00-03:00"),
      checkOut: null,
      creditedMinutes: null,
      discarded: false,
    };
    expect(
      sessionMinutes(
        open,
        localDayStart("2026-10-01"),
        localDayStart("2026-10-08"),
        at("2026-10-07T19:30:00-03:00"),
      ),
    ).toBe(90);
  });

  it("ignores discarded sessions", () => {
    const s = {
      ...closed("2026-10-02T09:00:00-03:00", "2026-10-02T12:00:00-03:00"),
      discarded: true,
    };
    expect(sessionMinutes(s, localDayStart("2026-10-01"), localDayStart("2026-10-08"))).toBe(0);
  });
});
