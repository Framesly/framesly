-- Publishing a gallery (build map stage 1).
--
-- A photographer turns a draft gallery into a private client link,
-- framesly.app/g/<public_slug>, with an optional password and expiry date.
--
-- * galleries.public_slug is unique across ALL studios (the per-studio `slug`
--   stays for internal use). It is kept after unpublishing so the link name
--   stays reserved for that gallery.
-- * published_at null = draft (not reachable by clients).
-- * The password is stored only as a bcrypt hash, in gallery_secrets, a table
--   no API role can read. Only the publish functions below and server code
--   using the service role touch it. has_password mirrors it for the UI.
-- * Clients never query these tables; the client gallery API (stage 3) checks
--   published_at, expires_at and the password on the server.

alter table public.galleries
  add column if not exists public_slug text,
  add column if not exists published_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists has_password boolean not null default false;

alter table public.galleries
  add constraint galleries_public_slug_key unique (public_slug),
  add constraint galleries_public_slug_format
    check (public_slug is null or public_slug ~ '^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$');

create index if not exists galleries_published_idx on public.galleries (public_slug) where published_at is not null;

-- ---------------------------------------------------------------------------
-- Password hashes: no policies and no grants for anon/authenticated
-- ---------------------------------------------------------------------------
create table public.gallery_secrets (
  gallery_id uuid primary key references public.galleries (id) on delete cascade,
  password_hash text not null check (password_hash ~ '^\$2[aby]\$\d{2}\$.{53}$'),
  updated_at timestamptz not null default now()
);
alter table public.gallery_secrets enable row level security;
revoke all on public.gallery_secrets from anon, authenticated;
grant all on public.gallery_secrets to service_role;

-- ---------------------------------------------------------------------------
-- Is a link name free? (true also when it already belongs to this gallery)
-- ---------------------------------------------------------------------------
create or replace function public.public_slug_available(p_slug text, p_gallery_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_slug ~ '^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$'
     and not exists (
       select 1 from public.galleries
       where public_slug = p_slug and (p_gallery_id is null or id <> p_gallery_id)
     );
$$;

-- ---------------------------------------------------------------------------
-- Publish (or update a published gallery's link, password and expiry)
-- p_password_hash: new bcrypt hash, or null to keep the current password.
-- p_remove_password: true to remove the password.
-- ---------------------------------------------------------------------------
create or replace function public.publish_gallery(
  p_gallery_id uuid,
  p_slug text,
  p_password_hash text default null,
  p_remove_password boolean default false,
  p_expires_at timestamptz default null
)
returns table (public_slug text, published_at timestamptz, expires_at timestamptz, has_password boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_studio uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  select g.studio_id into v_studio from public.galleries g where g.id = p_gallery_id;
  if v_studio is null or not public.is_member(v_studio) then
    raise exception 'Gallery not found' using errcode = '42501';
  end if;

  if p_slug !~ '^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$' then
    raise exception 'Invalid link name' using errcode = '22023';
  end if;
  if exists (select 1 from public.galleries g where g.public_slug = p_slug and g.id <> p_gallery_id) then
    raise exception 'Link name taken' using errcode = '23505';
  end if;
  if p_expires_at is not null and p_expires_at <= now() then
    raise exception 'Expiry must be in the future' using errcode = '22023';
  end if;

  if p_remove_password then
    delete from public.gallery_secrets s where s.gallery_id = p_gallery_id;
  elsif p_password_hash is not null then
    insert into public.gallery_secrets (gallery_id, password_hash)
    values (p_gallery_id, p_password_hash)
    on conflict (gallery_id) do update set password_hash = excluded.password_hash, updated_at = now();
  end if;

  return query
  update public.galleries g
  set public_slug = p_slug,
      published_at = coalesce(g.published_at, now()),
      expires_at = p_expires_at,
      has_password = exists (select 1 from public.gallery_secrets s where s.gallery_id = p_gallery_id)
  where g.id = p_gallery_id
  returning g.public_slug, g.published_at, g.expires_at, g.has_password;
end;
$$;

-- ---------------------------------------------------------------------------
-- Unpublish: back to draft. The link name stays reserved for this gallery.
-- ---------------------------------------------------------------------------
create or replace function public.unpublish_gallery(p_gallery_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_studio uuid;
begin
  select g.studio_id into v_studio from public.galleries g where g.id = p_gallery_id;
  if v_studio is null or not public.is_member(v_studio) then
    raise exception 'Gallery not found' using errcode = '42501';
  end if;
  update public.galleries g set published_at = null where g.id = p_gallery_id;
end;
$$;

revoke execute on function public.public_slug_available(text, uuid) from public, anon;
revoke execute on function public.publish_gallery(uuid, text, text, boolean, timestamptz) from public, anon;
revoke execute on function public.unpublish_gallery(uuid) from public, anon;
grant execute on function public.public_slug_available(text, uuid) to authenticated;
grant execute on function public.publish_gallery(uuid, text, text, boolean, timestamptz) to authenticated;
grant execute on function public.unpublish_gallery(uuid) to authenticated;
