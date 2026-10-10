"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { ChartFrame } from "./chart-frame";
import { useWidth } from "./use-width";
import { niceTicks } from "./scale";

export type WeeklyPoint = { weekStart: string; workedHours: number; goalHours: number };

const H = 240;
const M = { top: 12, right: 12, bottom: 30, left: 40 };
const WORKED = "var(--color-chart-worked)";
const GOAL = "var(--color-chart-goal)";

/** Columns of hours worked per week with the weekly goal as a step line (005-AC3, 004-AC7). */
export function WeeklyHoursChart({ points }: { points: WeeklyPoint[] }) {
  const t = useTranslations("charts");
  const format = useFormatter();
  const [hover, setHover] = useState<number | null>(null);
  const [ref, W] = useWidth<HTMLDivElement>();

  if (!points.length) return <p className="opacity-80">{t("empty")}</p>;

  const hours = (v: number) =>
    t("hours", { value: format.number(v, { maximumFractionDigits: 1 }) });
  const week = (d: string) =>
    format.dateTime(new Date(`${d}T12:00:00`), { day: "2-digit", month: "short" });
  const ticks = niceTicks(Math.max(...points.map((p) => Math.max(p.workedHours, p.goalHours))));
  const max = ticks.at(-1)!;
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const band = plotW / points.length;
  const barW = Math.min(24, band * 0.6);
  const y = (v: number) => M.top + plotH - (v / max) * plotH;
  const labelEvery = Math.ceil(
    points.length / Math.max(2, Math.floor((W - M.left - M.right) / 70)),
  );

  const goalPath = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${M.left + i * band},${y(p.goalHours)} H${M.left + (i + 1) * band}`,
    )
    .join(" ");
  const totals = points.reduce((s, p) => ({ w: s.w + p.workedHours, g: s.g + p.goalHours }), {
    w: 0,
    g: 0,
  });

  return (
    <ChartFrame
      title={t("weeklyTitle")}
      legend={[
        { label: t("worked"), kind: "bar", color: WORKED },
        { label: t("goal"), kind: "line", color: GOAL },
      ]}
      table={{
        head: [t("week"), t("worked"), t("goal")],
        rows: points.map((p) => [week(p.weekStart), hours(p.workedHours), hours(p.goalHours)]),
      }}
    >
      <div ref={ref}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${t("weeklyTitle")}. ${t("summary", { weeks: points.length, worked: hours(totals.w), goal: hours(totals.g) })}`}
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((v) => (
            <g key={v}>
              <line
                x1={M.left}
                x2={W - M.right}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--color-chart-grid)"
                strokeWidth={1}
              />
              <text
                x={M.left - 6}
                y={y(v)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-foreground text-[11px]"
              >
                {format.number(v)}
              </text>
            </g>
          ))}
          {points.map((p, i) => {
            const x = M.left + i * band + (band - barW) / 2;
            const top = y(p.workedHours);
            const h = M.top + plotH - top;
            const r = Math.min(4, h);
            return (
              <g key={p.weekStart}>
                {h > 0 && (
                  <path
                    d={`M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`}
                    fill={WORKED}
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                )}
                {i % labelEvery === 0 && (
                  <text
                    x={M.left + i * band + band / 2}
                    y={H - 10}
                    textAnchor="middle"
                    className="fill-foreground text-[11px]"
                  >
                    {week(p.weekStart)}
                  </text>
                )}
                {/* Hit target: the whole band, bigger than the mark. */}
                <rect
                  x={M.left + i * band}
                  y={M.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  tabIndex={-1}
                />
              </g>
            );
          })}
          <path
            d={goalPath}
            fill="none"
            stroke={GOAL}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {hover !== null && (
        <div
          role="tooltip"
          className="pointer-events-none absolute top-2 rounded-brutal border-2 border-ink bg-white px-3 py-2 text-sm shadow-brutal"
          style={{
            left: `clamp(0px, calc(${((M.left + (hover + 0.5) * band) / W) * 100}% - 70px), calc(100% - 160px))`,
          }}
        >
          <p className="font-bold">{t("weekOf", { date: week(points[hover].weekStart) })}</p>
          <p>
            {t("worked")}: {hours(points[hover].workedHours)}
          </p>
          <p>
            {t("goal")}: {hours(points[hover].goalHours)}
          </p>
        </div>
      )}
    </ChartFrame>
  );
}
