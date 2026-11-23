-- Deleting a user account removes the studio they own.
--
-- studios.owner_id had no ON DELETE rule, so Postgres refused to delete any
-- user who owned a studio (dashboard "Delete user" failed, and account
-- deletion requests could not be honoured). Cascade instead: the studio and,
-- through existing cascades, its members, galleries, sections and photos go
-- with the owner. Files in Storage/R2 are cleaned up separately.

alter table public.studios drop constraint if exists studios_owner_id_fkey;
alter table public.studios
  add constraint studios_owner_id_fkey foreign key (owner_id) references auth.users (id) on delete cascade;
