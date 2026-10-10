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
  "INVALID_TIME",
  "INVITE_INVALID",
  "LOCALE_INVALID",
  "NAME_INVALID",
  "NOT_AUTHENTICATED",
  "NOT_CORRECTABLE",
  "REQUEST_NOT_PENDING",
  "SESSION_NOT_FOUND",
  "SESSION_OVERLAP",
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
  if (error?.code === "23P01") return "SESSION_OVERLAP";
  if (error?.code === "23514" && message.includes("sessions_check")) return "INVALID_TIME";
  if (error?.code === "42501") return "FORBIDDEN";
  return "UNKNOWN";
}
