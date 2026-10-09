export const locales = ["pt-BR", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt-BR";
export const LOCALE_COOKIE = "locale";
export const TIME_ZONE = "America/Sao_Paulo";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** Maps a BCP 47 tag such as "pt", "pt-PT" or "en-US" to a supported locale. */
function matchTag(tag: string): Locale | undefined {
  const lower = tag.trim().toLowerCase();
  const exact = locales.find((l) => l.toLowerCase() === lower);
  if (exact) return exact;
  const language = lower.split("-")[0];
  return locales.find((l) => l.toLowerCase().split("-")[0] === language);
}

/** Picks the best supported locale from an Accept-Language header, honoring q-values. */
export function matchAcceptLanguage(header: string | null | undefined): Locale | undefined {
  if (!header) return undefined;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag, q: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter(({ tag, q }) => tag && tag !== "*" && q > 0)
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const match = matchTag(tag);
    if (match) return match;
  }
  return undefined;
}

/**
 * Locale resolution order (ADR 0006):
 * member preference → locale cookie → Accept-Language → default.
 */
export function resolveLocale(input: {
  memberLocale?: string | null;
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(input.memberLocale)) return input.memberLocale;
  if (isLocale(input.cookieLocale)) return input.cookieLocale;
  return matchAcceptLanguage(input.acceptLanguage) ?? defaultLocale;
}
