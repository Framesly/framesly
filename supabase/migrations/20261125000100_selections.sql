-- Client favourites (build map stage 5).
--
-- A couple hearts photos in their gallery. Couples have no account: each
-- browser gets an anonymous visitor id in a cookie, and only the server (the
-- client gallery API, using the service role after checking the gallery is
-- published, not expired and unlocked) writes here.
-- Photographers read the picks of their own studio's galleries.

create table public.selections (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries (id) on delete cascade,
  photo_id uuid not null references public.photos (id) on delete cascade,
  visitor_id uuid not null,
  client_name text check (client_name is null or char_length(client_name) <= 80),
  created_at timestamptz not null default now(),
  unique (photo_id, visitor_id)
);

create index selections_gallery_idx on public.selections (gallery_id, created_at);

alter table public.selections enable row level security;

-- Photographers: read picks for galleries of their studio. No client writes.
create policy "selections: members read" on public.selections
  for select to authenticated
  using (public.is_member(public.gallery_studio_id(gallery_id)));

revoke all on public.selections from anon, authenticated;
grant select on public.selections to authenticated;
grant all on public.selections to service_role;
