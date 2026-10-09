# 0002 — Invite-based self-registration, no V1 data migration

- Status: Accepted
- Date: 2026-10-09

## Context

Members should see their own attendance, so each needs an account. The mentors also want every member to choose their category (FRC/FTC) at registration. Open signup would let anyone join or register as a mentor.

## Decision

- Admins create **invites** (single or multi-use, with an expiry). The invite fixes the member **type**, and optionally the category.
- Invitees sign up themselves (Google or email + password) and choose their name, category and entrance code.
- V1 users and history are **not migrated**. Everyone re-registers, and the 2026–2027 season starts fresh.
- Email confirmation is off. Holding the invite is the proof of legitimacy, so the system works without SMTP. Resend is optional, for password reset.

## Consequences

- Less admin data entry, and members own their profile.
- Season one has no historical comparison with V1.
- An invite link leaked inside its validity window allows extra signups. This is mitigated by max uses, expiry, revocation, and the admin seeing all members.
