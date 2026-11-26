-- How the client gallery's cover shows: one photo (the chosen cover), or a
-- slideshow that cross-fades through the gallery's photos. Members change it
-- with a normal update (RLS and the table grants already cover new columns).

alter table public.galleries
  add column if not exists cover_mode text not null default 'single'
  check (cover_mode in ('single', 'slideshow'));
