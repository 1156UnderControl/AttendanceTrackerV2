// <input type="datetime-local"> values ("YYYY-MM-DDTHH:mm") always mean São Paulo time,
// whatever time zone the browser is in (NFR-5).
import { TZDate } from "@date-fns/tz";
import { TIME_ZONE } from "@/i18n/config";

const pad = (n: number) => String(n).padStart(2, "0");

export function toLocalInput(iso: string | Date, timeZone = TIME_ZONE): string {
  const t = new TZDate(new Date(iso).getTime(), timeZone);
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
}

/** Parses a datetime-local value as São Paulo time; null if malformed. */
export function fromLocalInput(value: string, timeZone = TIME_ZONE): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d, h, min] = match.map(Number);
  return new Date(new TZDate(y, m - 1, d, h, min, timeZone).getTime());
}
