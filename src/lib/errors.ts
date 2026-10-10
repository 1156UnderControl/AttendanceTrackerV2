// Maps Supabase/Postgres errors to the stable codes that messages/*.json translate
// under "errors" (ADR 0006: the database returns codes, the UI translates them).
export const ERROR_CODES = [
  "ALREADY_MEMBER",
  "ALREADY_PENDING",
  "CATEGORY_MISMATCH",
  "CATEGORY_REQUIRED",
  "CODE_INVALID",
  "CODE_IN_USE",
  "FORBIDDEN",
  "FORBIDDEN_FIELD",
  "INVALID_DATES",
  "INVALID_TIME",
  "INVITE_INVALID",
  "LOCALE_INVALID",
  "NAME_INVALID",
  "NOT_AUTHENTICATED",
  "NOT_CORRECTABLE",
  "NO_PREVIOUS_SEASON",
  "PHASES_OUTSIDE_SEASON",
  "PHASE_OUTSIDE_SEASON",
  "PHASE_OVERLAP",
  "REQUEST_NOT_PENDING",
  "SESSION_NOT_FOUND",
  "SEASON_NAME_IN_USE",
  "SESSION_OVERLAP",
  "TRACK_NOT_EMPTY",
  "UNKNOWN",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export type ActionState = { ok?: boolean; error?: ErrorCode; link?: string };

type DbError = { message?: string; code?: string } | null | undefined;

export function errorCode(error: DbError): ErrorCode {
  const message = error?.message ?? "";
  const known = ERROR_CODES.find((code) => code === message);
  if (known) return known;
  if (error?.code === "23505" && message.includes("members_code_key")) return "CODE_IN_USE";
  if (error?.code === "23514" && message.includes("members_code_check")) return "CODE_INVALID";
  if (error?.code === "23514" && message.includes("members_name_check")) return "NAME_INVALID";
  if (error?.code === "23P01" && message.includes("season_phases_no_overlap"))
    return "PHASE_OVERLAP";
  if (error?.code === "23P01") return "SESSION_OVERLAP";
  if (error?.code === "23505" && message.includes("seasons_name_key")) return "SEASON_NAME_IN_USE";
  if (error?.code === "23514" && /seasons_check|season_phases_check/.test(message))
    return "INVALID_DATES";
  if (error?.code === "23514" && message.includes("sessions_check")) return "INVALID_TIME";
  if (error?.code === "42501") return "FORBIDDEN";
  return "UNKNOWN";
}
