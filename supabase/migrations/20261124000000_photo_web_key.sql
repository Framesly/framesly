-- Photo uploads (build plan step 3).
--
-- Each photo is stored twice on R2: the untouched original (photos.r2_key) and
-- a 2048px web copy the photographer's browser makes before uploading
-- (photos.web_key). Clients are shown the web copy only; originals are for
-- download. This replaces the server-side renditions job for the web copy, so
-- a photographer's own session can record both paths under normal RLS.
--
-- R2 layout:
--   galleries/{gallery_id}/original/{photo_id}.{ext}
--   galleries/{gallery_id}/web/{photo_id}.jpg

alter table public.photos
  add column if not exists web_key text unique;

-- Photos that have been uploaded are looked up by gallery + status often.
-- (photos_gallery_status_idx already exists; no new index needed.)
