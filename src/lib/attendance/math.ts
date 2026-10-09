// TypeScript mirror of the SQL attendance math (supabase/migrations/*_attendance_math.sql).
// Single source of truth for the rules: docs/architecture/attendance-math.md.
// Rankings and stats come from the database; this module is for UI-side calculations
// (live elapsed time, previews, charts) and must agree with the SQL on every example.
import { TZDate } from "@date-fns/tz";
import { TIME_ZONE } from "@/i18n/config";

/** A calendar date as "YYYY-MM-DD", interpreted in the app time zone. */
export type LocalDate = string;

export type Phase = {
  startsOn: LocalDate;
  endsOn: LocalDate; // inclusive
  weeklyHours: number;
};

export type Session = {
  checkIn: Date;
  checkOut: Date | null; // null = open
  creditedMinutes: number | null; // null = use the real duration
  discarded: boolean;
};

const MS_PER_DAY = 86_400_000;

function parseLocalDate(day: LocalDate): [number, number, number] {
  const [y, m, d] = day.split("-").map(Number);
  return [y, m, d];
}

/** Days from `a` to `b` (b − a), calendar-based and immune to DST. */
function daysBetween(a: LocalDate, b: LocalDate): number {
  const [ay, am, ad] = parseLocalDate(a);
  const [by, bm, bd] = parseLocalDate(b);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / MS_PER_DAY);
}

/** Local midnight of a calendar date, as an instant. */
export function localDayStart(day: LocalDate, timeZone = TIME_ZONE): Date {
  const [y, m, d] = parseLocalDate(day);
  return new Date(new TZDate(y, m - 1, d, timeZone).getTime());
}

/** The local calendar date of an instant. */
export function localDate(instant: Date, timeZone = TIME_ZONE): LocalDate {
  const t = new TZDate(instant.getTime(), timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

/** Monday 00:00 (local) of the week containing `instant`. */
export function weekStart(instant: Date, timeZone = TIME_ZONE): Date {
  const t = new TZDate(instant.getTime(), timeZone);
  const daysSinceMonday = (t.getDay() + 6) % 7;
  return new Date(
    new TZDate(t.getFullYear(), t.getMonth(), t.getDate() - daysSinceMonday, timeZone).getTime(),
  );
}

/** Minutes a session contributes inside [from, to). Open sessions count until `now`. */
export function sessionMinutes(session: Session, from: Date, to: Date, now = new Date()): number {
  if (session.discarded) return 0;
  if (session.creditedMinutes !== null) {
    const t = session.checkIn.getTime();
    return t >= from.getTime() && t < to.getTime() ? session.creditedMinutes : 0;
  }
  const end = Math.min((session.checkOut ?? now).getTime(), to.getTime());
  const start = Math.max(session.checkIn.getTime(), from.getTime());
  return Math.max(0, (end - start) / 60_000);
}

/** Expected minutes to date: elapsed phase days, with the current day counting fully. */
export function expectedMinutes(phases: Phase[], at: Date, timeZone = TIME_ZONE): number {
  const today = localDate(at, timeZone);
  return phases.reduce((sum, p) => {
    const length = daysBetween(p.startsOn, p.endsOn) + 1;
    const elapsed = Math.max(0, Math.min(daysBetween(p.startsOn, today) + 1, length));
    return sum + (p.weeklyHours * 60 * elapsed) / 7;
  }, 0);
}

export function expectedFullMinutes(phases: Phase[]): number {
  return phases.reduce(
    (sum, p) => sum + (p.weeklyHours * 60 * (daysBetween(p.startsOn, p.endsOn) + 1)) / 7,
    0,
  );
}

/** Attendance % rounded to one decimal; null when nothing is expected ("—"). */
export function attendancePct(workedMinutes: number, expected: number): number | null {
  if (expected <= 0) return null;
  return Math.round((workedMinutes / expected) * 1000) / 10;
}
