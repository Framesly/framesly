-- A record of each photographer agreeing to the Terms of service and the
-- Privacy policy: who, which versions (the documents' "last updated" dates,
-- see apps/web/src/lib/legal.ts), when, and from which browser.
--
-- Rows are only ever added; a new version means a new row. Members can add
-- and read their own rows; nobody can change or delete them through the API.
-- They go with the account when the user is deleted.

create table public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  terms_version text not null check (terms_version ~ '^\d{4}-\d{2}-\d{2}$'),
  privacy_version text not null check (privacy_version ~ '^\d{4}-\d{2}-\d{2}$'),
  accepted_at timestamptz not null default now(),
  user_agent text check (char_length(user_agent) <= 500)
);

create index legal_acceptances_user_idx on public.legal_acceptances (user_id, accepted_at desc);

alter table public.legal_acceptances enable row level security;

create policy "Members add their own acceptance"
  on public.legal_acceptances for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Members read their own acceptances"
  on public.legal_acceptances for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.legal_acceptances from anon, authenticated;
grant select, insert on public.legal_acceptances to authenticated;
grant all on public.legal_acceptances to service_role;
