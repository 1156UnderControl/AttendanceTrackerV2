# 0006 — Internationalization with next-intl

- Status: Accepted
- Date: 2026-10-09

## Context

Most users speak Portuguese, but the team wants an English option too (for exchange students, visiting mentors, and sharing the project). Adding i18n later would mean touching every screen, so we decide now, before any UI exists.

## Decision

- Use **[next-intl](https://next-intl.dev)** for all UI strings and for date/number formatting.
- Supported locales: **`pt-BR` (default)** and **`en`**. Adding a language is one new `messages/<locale>.json` file plus an entry in the locale list.
- **No locale in the URL.** This is an internal app, so routes stay `/admin`, `/kiosk`, and so on. The locale is resolved per request in this order:
  1. the logged-in member's `members.locale`
  2. the `locale` cookie (set by the language switcher)
  3. the browser's `Accept-Language` header
  4. `pt-BR`
- **Kiosk:** the device default comes from the `locale` cookie, which is set at `/kiosk/unlock` and can be changed with a 🇧🇷/🇺🇸 toggle on the kiosk screen. Welcome and goodbye messages use the **member's own locale**, which `kiosk_toggle` returns.
- **The database is language-neutral.** Enums and error codes are stable English identifiers (e.g. `FRC_STUDENTS`, `CODE_IN_USE`). Server actions return error **codes**, and the UI translates them.
- Messages are type-checked (next-intl `AppConfig` typing). CI fails if any locale is missing a key that `pt-BR` has.

## Consequences

- Every new screen must add strings to both files. CI enforces this.
- Admin-entered content (season and phase names, invite labels) isn't translated.
- Supabase Auth emails (password reset) use one template per project on the free plan, so they are written in both languages in a single email.

## Alternatives considered

- Locale-prefixed routes (`/en/admin`): useful for public SEO sites, but unnecessary noise here.
- react-i18next: works, but has weaker App Router and server component integration.
- No i18n (pt-BR only): the cheapest option now, but retrofitting later would touch every screen.
