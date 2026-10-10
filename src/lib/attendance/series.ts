// Weekly and cumulative series for the charts (004-AC7, 005-AC3). Built from the same
// rules as the SQL (attendance-math.md): sessions split at window bounds, expected
// hours = weekly_hours × elapsed phase days / 7.
import { TIME_ZONE } from "@/i18n/config";
import {
  localDate,
  localDayStart,
  sessionMinutes,
  weekStart,
  type LocalDate,
  type Phase,
  type Session,
} from "./math";

export type WeekPoint = {
  weekStart: LocalDate;
  workedMinutes: number;
  expectedMinutes: number;
  cumulativeWorked: number;
  cumulativeExpected: number;
};

const MS_PER_DAY = 86_400_000;

function addDays(day: LocalDate, days: number): LocalDate {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function daysBetween(a: LocalDate, b: LocalDate): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / MS_PER_DAY);
}

/** Expected minutes for the local days [from, to] inclusive. */
function expectedBetween(phases: Phase[], from: LocalDate, to: LocalDate): number {
  return phases.reduce((sum, p) => {
    const start = p.startsOn > from ? p.startsOn : from;
    const end = p.endsOn < to ? p.endsOn : to;
    const days = start <= end ? daysBetween(start, end) + 1 : 0;
    return sum + (p.weeklyHours * 60 * days) / 7;
  }, 0);
}

/**
 * One point per week (Monday start) from the season's first week until `at`
 * (or the season end). The current week counts up to `at`; expected counts its
 * elapsed days fully, like expected_minutes() in SQL.
 */
export function weeklySeries(
  sessions: Session[],
  phases: Phase[],
  season: { startsOn: LocalDate; endsOn: LocalDate },
  at: Date,
  timeZone = TIME_ZONE,
): WeekPoint[] {
  const lastDay = localDate(at, timeZone) < season.endsOn ? localDate(at, timeZone) : season.endsOn;
  if (lastDay < season.startsOn) return [];

  const seasonStart = localDayStart(season.startsOn, timeZone);
  const points: WeekPoint[] = [];
  let monday = localDate(weekStart(seasonStart, timeZone), timeZone);
  let cumulativeWorked = 0;
  let cumulativeExpected = 0;

  while (monday <= lastDay) {
    const sunday = addDays(monday, 6);
    const from = new Date(
      Math.max(localDayStart(monday, timeZone).getTime(), seasonStart.getTime()),
    );
    const to = new Date(
      Math.min(localDayStart(addDays(monday, 7), timeZone).getTime(), at.getTime()),
    );
    const worked = sessions.reduce((sum, s) => sum + sessionMinutes(s, from, to, at), 0);
    const firstDay = monday < season.startsOn ? season.startsOn : monday;
    const expected = expectedBetween(phases, firstDay, sunday < lastDay ? sunday : lastDay);
    cumulativeWorked += worked;
    cumulativeExpected += expected;
    points.push({
      weekStart: monday,
      workedMinutes: worked,
      expectedMinutes: expected,
      cumulativeWorked,
      cumulativeExpected,
    });
    monday = addDays(monday, 7);
  }
  return points;
}
