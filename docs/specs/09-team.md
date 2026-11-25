# 9. Team accounts, roles and invites

**Who:** studios with second shooters, editors and an owner who wants control. **Job:** let the right people do the right things in a studio's galleries without sharing one login.

## Roles (start with three)

| Role | Can |
|---|---|
| **Owner** | Everything, including billing, deleting the studio and changing roles |
| **Editor** | Create and edit galleries, upload, cull, publish, see picks and orders; cannot touch billing or members |
| **Shooter** | Upload into galleries they are added to and see their own uploads; cannot publish or delete |

Roles are checked on the server and in RLS, never only in the UI. **`studio_members.role` already exists** with exactly these three values (`owner`, `editor`, `shooter`), but today the database policies only ask "is this person a member?" (`is_member`), so every role currently has the same power. The work is to make the policies and server actions read the role, in a new migration.

## Screens

1. **Settings → Team** (new tab in the app nav): a list of members (avatar, name, email, role Select, last active) and a pending-invites list. The owner row is fixed.
2. **Invite:** a Dialog with an email Field and role Select, "Send invite". Invites expire in 7 days; resend and revoke are text buttons on the pending row. The email follows spec 7 (Framesly-branded account email naming the studio).
3. **Accept:** a short page: "Priya invited you to join Saffron Lane as Editor", with sign in or create account, then lands in that studio. If the person already belongs to other studios, a **studio switcher** appears in the app header (a Select, or a menu with logos).
4. **Per-gallery access (Shooters):** on a gallery, "Who can upload" with a Checkbox list of members.
5. **Activity attribution:** photos show "Uploaded by Ravi", decisions show who made them (ties into cull review "Your pick" vs a teammate's).

## States

Last owner cannot be removed or demoted (inline explanation, control disabled); invite to an email already in the studio (friendly message); seat limit reached (Badge `warning` and an upgrade link to the plan that includes more); removed member loses access immediately, their sessions are re-checked on the next request.

## Accessibility

Role changes confirm with a Toast and are announced; destructive actions (remove member) use the confirm Dialog; the list is a real table or list with column headers.

## New components

`Table`, `Avatar`, `Menu`/`Popover`, `StudioSwitcher`.

## Data

Existing: `studio_members.role`. New: `studio_invites (id, studio_id, email, role, token_hash, expires_at, accepted_at)`, `gallery_members` for Shooter access, and role-aware RLS policies replacing the plain `is_member` checks on galleries, photos and sections.

## Open questions

Is a per-seat price part of the plans? Today the plan tiers differ by storage, branding and support level, and Studio is described as "for second shooters", but no seat limit exists. A "Client" role (read-only picks for a couple's planner) may be worth adding later.
