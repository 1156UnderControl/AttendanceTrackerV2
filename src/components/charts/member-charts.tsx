import type { WeekPoint } from "@/lib/attendance/series";
import { CumulativeChart } from "./cumulative-chart";
import { WeeklyHoursChart } from "./weekly-hours-chart";

const toHours = (minutes: number) => Math.round((minutes / 60) * 10) / 10;

/** Server wrapper: converts the weekly series to chart points (hours). */
export function MemberCharts({
  series,
  cumulative = true,
}: {
  series: WeekPoint[];
  cumulative?: boolean;
}) {
  return (
    <div className="grid gap-6">
      <WeeklyHoursChart
        points={series.map((p) => ({
          weekStart: p.weekStart,
          workedHours: toHours(p.workedMinutes),
          goalHours: toHours(p.expectedMinutes),
        }))}
      />
      {cumulative && (
        <CumulativeChart
          points={series.map((p) => ({
            weekStart: p.weekStart,
            workedHours: toHours(p.cumulativeWorked),
            expectedHours: toHours(p.cumulativeExpected),
          }))}
        />
      )}
    </div>
  );
}
