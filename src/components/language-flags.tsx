"use client";

import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";

// Inline SVG flags: emoji flags render as plain letters on Windows (maybe the lab PC).
// Language names are written in their own language, so they need no translation.
const NAMES: Record<Locale, string> = { "pt-BR": "Português", en: "English" };

function BrazilFlag() {
  return (
    <svg viewBox="0 0 28 20" aria-hidden className="h-full w-full">
      <rect width="28" height="20" fill="#009c3b" />
      <path d="M14 2.2 25.6 10 14 17.8 2.4 10Z" fill="#ffdf00" />
      <circle cx="14" cy="10" r="4.6" fill="#002776" />
      <path d="M9.6 9.1q4.6-1.2 8.8 1.6" stroke="#fff" strokeWidth="0.9" fill="none" />
    </svg>
  );
}

function UsFlag() {
  const stripe = 20 / 13;
  return (
    <svg viewBox="0 0 28 20" aria-hidden className="h-full w-full">
      <rect width="28" height="20" fill="#fff" />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} y={i * 2 * stripe} width="28" height={stripe} fill="#b22234" />
      ))}
      <rect width="11.6" height={stripe * 7} fill="#3c3b6e" />
    </svg>
  );
}

const FLAGS: Record<Locale, () => React.JSX.Element> = { "pt-BR": BrazilFlag, en: UsFlag };

/** Two flag buttons; the current language is outlined, the other dimmed. */
export function LanguageFlags({
  current,
  onSelect,
  disabled,
}: {
  current: string;
  onSelect: (locale: Locale) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Idioma / Language">
      {locales.map((locale) => {
        const Flag = FLAGS[locale];
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            aria-label={NAMES[locale]}
            title={NAMES[locale]}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => !active && onSelect(locale)}
            className={`h-7 w-10 cursor-pointer overflow-hidden rounded-[3px] border-2 transition ${
              active
                ? "border-white opacity-100"
                : "border-transparent opacity-50 hover:opacity-100"
            }`}
          >
            <Flag />
          </button>
        );
      })}
    </div>
  );
}
