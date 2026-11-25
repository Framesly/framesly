-- Photographer-chosen photo order.
--
-- Until now a gallery showed photos by capture time. Photographers want to
-- move a hero shot to the front or tidy a sequence, so each photo can carry a
-- sort_order. Photos without one (everything uploaded so far) keep the old
-- order, after any that have one:
--   order by sort_order asc nulls last, taken_at asc nulls last, created_at asc
--
-- Nothing breaks if this is applied after the app is deployed: the app falls
-- back to the old order until the column exists, and only the reorder button
-- needs it.

alter table public.photos add column if not exists sort_order int;

create index if not exists photos_gallery_sort_idx on public.photos (gallery_id, sort_order);

-- Write a whole order in one call: p_photo_ids is the gallery's photos in the
-- new order (first = 1). Runs as the caller, so RLS limits it to photos in
-- studios the caller belongs to.
create or replace function public.reorder_photos(p_gallery_id uuid, p_photo_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.photos p
     set sort_order = t.position
    from unnest(p_photo_ids) with ordinality as t(id, position)
   where p.id = t.id
     and p.gallery_id = p_gallery_id;
$$;

revoke execute on function public.reorder_photos(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_photos(uuid, uuid[]) to authenticated;
