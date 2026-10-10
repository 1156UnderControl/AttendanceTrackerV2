"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { ChartFrame } from "./chart-frame";
import { useWidth } from "./use-width";
import { niceTicks } from "./scale";

export type CumulativePoint = { weekStart: string; workedHours: number; expectedHours: number };

const H = 240;
const M = { top: 12, right: 64, bottom: 30, left: 44 };
const WORKED = "var(--color-chart-worked)";
const GOAL = "var(--color-chart-goal)";

/** Cumulative hours worked vs expected over the season, with crosshair tooltip (004-AC7). */
export function CumulativeChart({ points }: { points: CumulativePoint[] }) {
  const t = useTranslations("charts");
  const format = useFormatter();
  const [hover, setHover] = useState<number | null>(null);
  const [ref, W] = useWidth<HTMLDivElement>();

  if (!points.length) return <p className="opacity-80">{t("empty")}</p>;

  const hours = (v: number) =>
    t("hours", { value: format.number(v, { maximumFractionDigits: 1 }) });
  const week = (d: string) =>
    format.dateTime(new Date(`${d}T12:00:00`), { day: "2-digit", month: "short" });
  const ticks = niceTicks(Math.max(...points.map((p) => Math.max(p.workedHours, p.expectedHours))));
  const max = ticks.at(-1)!;
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const x = (i: number) =>
    M.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => M.top + plotH - (v / max) * plotH;
  const line = (key: "workedHours" | "expectedHours") =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p[key])}`).join(" ");
  const last = points.at(-1)!;
  const labelsCollide = Math.abs(y(last.workedHours) - y(last.expectedHours)) < 14;
  const labelEvery = Math.ceil(
    points.length / Math.max(2, Math.floor((W - M.left - M.right) / 70)),
  );

  return (
    <ChartFrame
      title={t("cumulativeTitle")}
      legend={[
        { label: t("cumulativeWorked"), kind: "line", color: WORKED },
        { label: t("cumulativeGoal"), kind: "line", color: GOAL },
      ]}
      table={{
        head: [t("week"), t("cumulativeWorked"), t("cumulativeGoal")],
        rows: points.map((p) => [week(p.weekStart), hours(p.workedHours), hours(p.expectedHours)]),
      }}
    >
      <div ref={ref}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${t("cumulativeTitle")}: ${t("cumulativeWorked")} ${hours(last.workedHours)}, ${t("cumulativeGoal")} ${hours(last.expectedHours)}.`}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const px = ((event.clientX - rect.left) / rect.width) * W;
            const i =
              points.length === 1 ? 0 : Math.round(((px - M.left) / plotW) * (points.length - 1));
            setHover(Math.max(0, Math.min(points.length - 1, i)));
          }}
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
          {points.map(
            (p, i) =>
              i % labelEvery === 0 && (
                <text
                  key={p.weekStart}
                  x={x(i)}
                  y={H - 10}
                  textAnchor="middle"
                  className="fill-foreground text-[11px]"
                >
                  {week(p.weekStart)}
                </text>
              ),
          )}
          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={M.top}
              y2={M.top + plotH}
              stroke="var(--color-foreground)"
              strokeWidth={1}
              opacity={0.4}
            />
          )}
          <path
            d={line("expectedHours")}
            fill="none"
            stroke={GOAL}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={line("workedHours")}
            fill="none"
            stroke={WORKED}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {(["expectedHours", "workedHours"] as const).map((key) => {
            const i = hover ?? points.length - 1;
            return (
              <circle
                key={key}
                cx={x(i)}
                cy={y(points[i][key])}
                r={4}
                fill={key === "workedHours" ? WORKED : GOAL}
                stroke="white"
                strokeWidth={2}
              />
            );
          })}
          {/* End labels only when they don't collide; the legend and tooltip carry the rest. */}
          {!labelsCollide && hover === null && (
            <>
              <text
                x={x(points.length - 1) + 8}
                y={y(last.workedHours)}
                dominantBaseline="middle"
                className="fill-foreground text-[12px] font-bold"
              >
                {hours(last.workedHours)}
              </text>
              <text
                x={x(points.length - 1) + 8}
                y={y(last.expectedHours)}
                dominantBaseline="middle"
                className="fill-foreground text-[12px]"
              >
                {hours(last.expectedHours)}
              </text>
            </>
          )}
        </svg>
      </div>
      {hover !== null && (
        <div
          role="tooltip"
          className="pointer-events-none absolute top-2 rounded-brutal border-2 border-ink bg-white px-3 py-2 text-sm shadow-brutal"
          style={{ left: `clamp(0px, calc(${(x(hover) / W) * 100}% - 70px), calc(100% - 170px))` }}
        >
          <p className="font-bold">{t("weekOf", { date: week(points[hover].weekStart) })}</p>
          <p>
            {t("cumulativeWorked")}: {hours(points[hover].workedHours)}
          </p>
          <p>
            {t("cumulativeGoal")}: {hours(points[hover].expectedHours)}
          </p>
        </div>
      )}
    </ChartFrame>
  );
}
