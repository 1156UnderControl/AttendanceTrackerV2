// Maps Supabase/Postgres errors to the stable codes that messages/*.json translate
// under "errors" (ADR 0006: the database returns codes, the UI translates them).
export const ERROR_CODES = [
  "ALREADY_MEMBER",
  "CATEGORY_MISMATCH",
  "CATEGORY_REQUIRED",
  "CODE_INVALID",
  "CODE_IN_USE",
  "FORBIDDEN",
  "FORBIDDEN_FIELD",
  "INVITE_INVALID",
  "LOCALE_INVALID",
  "NAME_INVALID",
  "NOT_AUTHENTICATED",
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
  if (error?.code === "42501") return "FORBIDDEN";
  return "UNKNOWN";
}
