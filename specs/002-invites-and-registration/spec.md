# 002 — Invites and registration

- Status: Approved
- Requirements: FR-2.1 – FR-2.5
- Related ADRs: [0002](../../docs/adr/0002-invite-based-registration.md)

## Problem / motivation

Members need accounts to see their own attendance, and every member must choose a category (FRC/FTC) at registration. Only invited people may join, and only admins decide who is a mentor.

## User stories

- As an **admin**, I create an invite link (for one person or a whole class) and share it on WhatsApp.
- As an **invitee**, I open the link, sign in with Google or email, and fill in my name, category and entrance code.
- As an **admin**, I manage members: edit, deactivate, promote to admin.

## Acceptance criteria

- **002-AC1**: Given an admin at `/admin/convites`, when they create an invite with a type, an optional category, an expiry (default 7 days) and max uses (default 1), then a link `/convite/<token>` is shown with a copy button. Only the token hash is stored.
- **002-AC2**: Given a valid invite, when the invitee opens it, then they see the invite's type and are asked to sign in or sign up (Google or email + password).
- **002-AC3**: After authentication, the form requires the name (2–80 chars) and a category FRC/FTC, which is pre-selected and locked if the invite fixed it. The code is 6 digits, chosen or "gerar automaticamente". On submit, the member is created and the user lands on `/minha-presenca`.
- **002-AC4**: A duplicate entrance code shows "Código já em uso" and the form keeps its data.
- **002-AC5**: Expired, revoked or used-up invites show "Convite inválido ou expirado", and no member is created. Concurrent redemptions of the last use allow only one.
- **002-AC6**: A user who already has a member profile and opens another invite is redirected to `/minha-presenca` and the invite is not consumed.
- **002-AC7**: The invite list shows its label, type, category, uses/max, expiry, status, and who redeemed it. An admin can revoke it.
- **002-AC8**: At `/admin/membros`, an admin can filter by track and active status, edit name, code, type and category, deactivate or reactivate, and grant or revoke admin. An admin can't revoke their own admin rights. Every change is audited.
- **002-AC9**: A deactivated member can't check in at the kiosk and disappears from rankings. Their history is kept.
- **002-AC10**: The invite page and signup form appear in the browser's language (pt-BR or en, with a switcher). The chosen language is saved as the new member's `locale`.

## Edge cases

- The invitee closes the tab after authenticating but before the profile: on next login they are sent back to the profile step if they hold a valid invite in session. Otherwise they see "Peça um novo convite".
- Google account email differs from the expected one: allowed, because the invite isn't bound to an email.

## Out of scope

- Bulk CSV import of members.
- Emailing invites automatically (optional later, with Resend).
