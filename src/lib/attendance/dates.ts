import { addYears, format, parseISO } from "date-fns";

/** Shifts a "YYYY-MM-DD" date by whole years (Feb 29 becomes Feb 28), for copying phases. */
export function shiftYears(day: string, years: number): string {
  return format(addYears(parseISO(day), years), "yyyy-MM-dd");
}
