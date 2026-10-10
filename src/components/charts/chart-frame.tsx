"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export type LegendItem = { label: string; kind: "bar" | "line"; color: string };

/** Title, legend, the plot, and a table view (identity is never color alone). */
export function ChartFrame({
  title,
  legend,
  table,
  children,
}: {
  title: string;
  legend: LegendItem[];
  table: { head: string[]; rows: (string | number)[][] };
  children: ReactNode;
}) {
  const t = useTranslations("charts");
  return (
    <figure className="flex flex-col gap-3 rounded-brutal border-2 border-ink bg-white p-4 shadow-brutal">
      <figcaption className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-lg font-black">{title}</span>
        <ul className="flex flex-wrap gap-4 text-sm">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              {item.kind === "bar" ? (
                <span
                  className="inline-block h-3 w-3 rounded-[3px]"
                  style={{ background: item.color }}
                />
              ) : (
                <span
                  className="inline-block h-0.5 w-5 rounded"
                  style={{ background: item.color }}
                />
              )}
              {item.label}
            </li>
          ))}
        </ul>
      </figcaption>
      <div className="relative">{children}</div>
      <details className="text-sm">
        <summary className="cursor-pointer font-bold">{t("showTable")}</summary>
        <div className="mt-2 max-h-64 overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                {table.head.map((h) => (
                  <th key={h} className="sticky top-0 bg-brand px-2 py-1">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i} className="even:bg-paper">
                  {row.map((cell, j) => (
                    <td key={j} className="px-2 py-1 tabular-nums">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
