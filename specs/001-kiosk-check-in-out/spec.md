# 001 — Kiosk check-in/out

- Status: Approved
- Requirements: FR-1.1 – FR-1.5
- Related ADRs: [0005](../../docs/adr/0005-kiosk-device-token.md)

## Problem / motivation

Members arriving at the lab need to register attendance in seconds, without logging in, on a shared computer. This keeps V1's flow: type a code to enter, click your name to leave.

## User stories

- As a **member arriving**, I type my code and press Enter so my entrance time is recorded.
- As a **member leaving**, I click my name in the "in the lab" list so my exit time is recorded.
- As an **admin**, I want only the lab computer to be able to use the kiosk.

## Acceptance criteria

- **001-AC1**: Given an unlocked kiosk and an active member with no open session, when they type their code and press Enter, then a session opens with `check_in = now()` (DB time) and the screen shows "Bem-vindo(a), {nome}!" for about 3 s.
- **001-AC2**: Given a member with an open session, when they type their code, then the session closes and the screen shows "Até logo, {nome}! {Xh Ymin} hoje".
- **001-AC3**: Given members with open sessions, the kiosk lists them as cards (name + elapsed time), sorted by check-in time. Clicking a card opens a confirmation, and confirming closes that session.
- **001-AC4**: Given an unknown code or an inactive member, then an error "Código não encontrado" is shown, and nothing is written.
- **001-AC5**: A member can never have two open sessions, even with concurrent submits (DB unique partial index).
- **001-AC6**: Given a browser without a valid kiosk cookie, when it opens `/kiosk` or calls a kiosk action, then it sees "Quiosque não autorizado" and the action is rejected.
- **001-AC7**: Given an admin at `/kiosk/unlock`, when they click "Ativar este computador como quiosque", then the kiosk cookie is set and `/kiosk` works after logout.
- **001-AC8**: The input accepts only digits, auto-focuses, re-focuses after each action, and supports the numpad and Enter. The list and clock refresh at least every 30 s.
- **001-AC9**: On network or server failure, the kiosk shows "Sem conexão, tente novamente" and keeps the typed code.
- **001-AC10**: The kiosk's default language is set at unlock (`pt-BR` or `en`) and can be switched with a toggle on screen. Welcome and goodbye messages use the language of the member who typed their code (from `members.locale`); then the screen returns to the kiosk's default.

- **001-AC11**: The kiosk recreates the V1 attendance page: the tilted 3D code box with the "CÓDIGO" tag, the pixel-style "BATER PONTO" button, and floating name bubbles for people in the lab ([design-system.md](../../docs/architecture/design-system.md#kiosk-spec-001)).

## Edge cases

- Double Enter or double click: idempotent, so it doesn't close a session that was just opened. Ignore repeats of the same code for 5 s.
- A session left open past midnight is handled by spec 006, not here.
- Many people present (30+): the grid scrolls, with a search-by-name filter.

## Out of scope

- Photo, NFC or QR check-in.
- Showing anything beyond names and times on the kiosk.
