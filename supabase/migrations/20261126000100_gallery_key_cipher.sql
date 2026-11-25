-- Let photographers see their gallery key again.
--
-- The key stays verified against its bcrypt hash. Alongside it we keep the key
-- encrypted with AES-256-GCM by the app server (the encryption key never
-- reaches the database), so the dashboard can show it to studio members and
-- offer a one-click reset. Both are written in the same statement, so they
-- can't drift apart. gallery_secrets stays unreadable to every API role;
-- members read the cipher only through gallery_key_cipher().

alter table public.gallery_secrets
  add column if not exists password_cipher text;

-- Replaces the five-argument version: a sixth argument with a default would
-- make named calls ambiguous between the two overloads.
drop function if exists public.publish_gallery(uuid, text, text, boolean, timestamptz);

create function public.publish_gallery(
  p_gallery_id uuid,
  p_slug text,
  p_password_hash text default null,
  p_remove_password boolean default false,
  p_expires_at timestamptz default null,
  p_password_cipher text default null
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
    insert into public.gallery_secrets (gallery_id, password_hash, password_cipher)
    values (p_gallery_id, p_password_hash, p_password_cipher)
    on conflict (gallery_id) do update
      set password_hash = excluded.password_hash, password_cipher = excluded.password_cipher, updated_at = now();
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

-- The encrypted key of one gallery, for members of its studio only.
create or replace function public.gallery_key_cipher(p_gallery_id uuid)
returns text
language plpgsql
stable
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
  return (select s.password_cipher from public.gallery_secrets s where s.gallery_id = p_gallery_id);
end;
$$;

revoke execute on function public.publish_gallery(uuid, text, text, boolean, timestamptz, text) from public, anon;
revoke execute on function public.gallery_key_cipher(uuid) from public, anon;
grant execute on function public.publish_gallery(uuid, text, text, boolean, timestamptz, text) to authenticated;
grant execute on function public.gallery_key_cipher(uuid) to authenticated;
