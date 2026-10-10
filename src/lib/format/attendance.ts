export type Thresholds = { green: number; yellow: number };

export const DEFAULT_THRESHOLDS: Thresholds = { green: 100, yellow: 75 };

export function parseThresholds(value: unknown): Thresholds {
  const v = value as Partial<Thresholds> | null;
  return typeof v?.green === "number" && typeof v?.yellow === "number"
    ? { green: v.green, yellow: v.yellow }
    : DEFAULT_THRESHOLDS;
}

/** Color band for an attendance % (004-AC3 / 005-AC1). */
export function pctTone(
  pct: number | null,
  thresholds: Thresholds,
): "green" | "yellow" | "red" | "none" {
  if (pct === null) return "none";
  if (pct >= thresholds.green) return "green";
  if (pct >= thresholds.yellow) return "yellow";
  return "red";
}

export const toneClass = {
  green: "text-success",
  yellow: "text-[#b26a00]",
  red: "text-danger",
  none: "opacity-60",
} as const;
