-- Exact table privileges, whatever the project's defaults.
--
-- Some Supabase projects grant every table in public to anon and
-- authenticated by default; others grant nothing. Row-level security already
-- protects the rows either way, but privileges are a second lock: reset them
-- and grant only what the app uses (same list as 20261121000100 and the
-- site_photos migration).

revoke all on all tables in schema public from anon, authenticated;

-- Signed-out visitors: public marketing photos only.
grant select on public.site_photos to anon;

-- Signed-in photographers
grant select on public.site_photos to authenticated;
grant select, update on public.profiles to authenticated;
grant select, update, delete on public.studios to authenticated;        -- insert only via create_studio()
grant select on public.studio_members to authenticated;                  -- insert only via create_studio()
grant select, insert, update, delete on public.galleries to authenticated;
grant select, insert, update, delete on public.sections to authenticated;
grant select, insert, update, delete on public.photos to authenticated;
grant select on public.renditions to authenticated;                      -- written by the processing job
grant select on public.gallery_overview to authenticated;

-- New tables start with no API access until a migration grants it.
alter default privileges in schema public revoke all on tables from anon, authenticated;
