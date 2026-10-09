# 0007 — Cache Components disabled (for now)

- Status: Accepted
- Date: 2026-10-09

## Context

Next.js 16 scaffolds new apps with `cacheComponents: true` and `partialPrefetching: true`. With Cache Components on, any request-time read (`cookies()`, `headers()`) must sit inside a `<Suspense>` boundary or use `use cache: private`. Otherwise validation flags the route as blocking.

Almost every page in this app depends on request data:

- the auth session (member and admin areas)
- the `kiosk_token` cookie (kiosk)
- the `locale` cookie, which the **root layout** reads for `<html lang>` and the next-intl provider (ADR 0006)

A static shell gains little for an internal tool used by about 50 people. Meanwhile, the extra Suspense and caching rules add a learning curve for the student maintainers.

## Decision

Set `cacheComponents: false` in `next.config.ts` and use the previous caching model. Pages render dynamically per request, with no data caching unless explicitly opted in.

## Consequences

- Simpler mental model: server components read cookies and session directly.
- Navigations aren't "instant" (no prefetched static shell). Acceptable at this scale.
- Next.js says both flags will be mandatory in the next major version. When upgrading, follow `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`, then supersede this ADR.

## Alternatives considered

- Keep Cache Components on and wrap every cookie read in Suspense, with `instant = false` on the root layout. This is more code everywhere for no visible benefit today.
