-- Site media: the photography shown on the marketing site, login pages and
-- the sample gallery. Files live in Storage (bucket site-media, folder
-- showcase/); this table is the catalogue the website reads.
--
-- Storage layout (all buckets):
--   site-media/showcase/{file}-{400|800|1200|1800}.webp   marketing photos (public)
--   site-media/showcase/sample-og.jpg                      sample gallery share image
--   studio-assets/studios/{studioId}/logo/...             each studio's logo
--   studio-assets/users/{userId}/avatar/...               each user's profile photo

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.site_photos (
  key text primary key check (key ~ '^[a-z][A-Za-z0-9]{1,40}$'),
  file text not null unique check (file ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  width int not null check (width > 0),
  height int not null check (height > 0),
  alt text not null check (char_length(alt) between 1 and 200),
  credit text not null default 'Wow Films' check (char_length(credit) <= 80),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.site_photos is
  'Marketing photography. file is the base name in site-media/showcase/; each photo exists as {file}-400/800/1200/1800.webp.';

create trigger site_photos_updated_at before update on public.site_photos
  for each row execute function public.set_updated_at();

alter table public.site_photos enable row level security;

-- Public marketing content: anyone may read active photos. Only the service
-- role (dashboard, scripts) writes, so there are no write policies.
create policy "site photos: read active" on public.site_photos
  for select to anon, authenticated using (is_active);

grant select on public.site_photos to anon, authenticated;
grant all on public.site_photos to service_role;

-- ---------------------------------------------------------------------------
-- Bucket: public read through the CDN URL, no client writes (no policies on
-- storage.objects for this bucket, so only the service role can upload).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 5242880, array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Initial catalogue: 48 Wow Films photos (Nov 2026)
-- ---------------------------------------------------------------------------
insert into public.site_photos (key, file, width, height, alt, sort_order) values
  ('bridalLaugh', 'bridal-laugh', 1333, 2000, 'Bride laughing in a gold-embroidered lehenga, hands covered in henna', 0),
  ('mandapCouple', 'mandap-couple', 2000, 1333, 'Bride and groom seated in a red floral mandap, garlanded', 10),
  ('hennaHands', 'henna-hands', 1333, 2000, 'Henna-covered hands held up against a blue wall', 20),
  ('beachTwirl', 'beach-twirl', 1333, 2000, 'Bride in a white gown twirling with the groom on the shore', 30),
  ('forestPortrait', 'forest-portrait', 1333, 2000, 'Couple in a sage lehenga and dark suit in a sunlit forest', 40),
  ('avenueWalk', 'avenue-walk', 1333, 2000, 'Bride and groom walking down a tree-lined avenue', 50),
  ('pujaRitual', 'puja-ritual', 2000, 1333, 'Groom seated for a puja with the priest and family', 60),
  ('bridalMirror', 'bridal-mirror', 1333, 2000, 'Bride holding a mirror while getting ready', 70),
  ('ringHands', 'ring-hands', 1333, 2000, 'Bride''s hennaed hand with a ring resting on the groom''s jacket', 80),
  ('bridalPortrait', 'bridal-portrait', 1333, 2000, 'Black and white portrait of a bride in a veil and heavy jewellery', 90),
  ('gardenArch', 'garden-arch', 1333, 2000, 'Couple embracing under a green garden archway', 100),
  ('anandKaraj', 'anand-karaj', 1333, 2000, 'Sikh bride and groom seated together during the Anand Karaj', 110),
  ('gardenProcession', 'garden-procession', 1333, 2000, 'Sikh groom with a kirpan and bride walking through a park', 120),
  ('afghanLaugh', 'afghan-laugh', 1333, 2000, 'Couple in green and white Afghan attire laughing together', 130),
  ('pathTogether', 'path-together', 1333, 2000, 'Couple in Afghan attire walking away down a garden path', 140),
  ('tentDance', 'tent-dance', 2000, 1333, 'Guests dancing under a draped marquee', 150),
  ('dupattaDance', 'dupatta-dance', 2000, 1333, 'Women dancing with dupattas raised at the wedding', 160),
  ('sunglassesDance', 'sunglasses-dance', 1333, 2000, 'Guest in a tuxedo and sunglasses dancing at the reception', 170),
  ('lakeDance', 'lake-dance', 1333, 2000, 'Groom twirling the bride beside a lake', 180),
  ('candleTable', 'candle-table', 2000, 1333, 'Candlelit table for two with roses by the water', 190),
  ('champagne', 'champagne', 1333, 2000, 'Two bottles of champagne on ice', 200),
  ('redAisle', 'red-aisle', 2000, 1333, 'Rows of white chairs along a red petal aisle', 210),
  ('brickArches', 'brick-arches', 1333, 2000, 'Bride and groom standing under brick arches', 220),
  ('skyEmbrace', 'sky-embrace', 2000, 1333, 'Couple embracing against a wide cloudy sky', 230),
  ('tealDoor', 'teal-door', 1333, 2000, 'Bride in an ivory veil beside a teal door', 240),
  ('roseBouquet', 'rose-bouquet', 1333, 2000, 'Bride holding a large bouquet of red and white roses', 250),
  ('duskShore', 'dusk-shore', 2000, 1333, 'Couple close together by the water at dusk', 260),
  ('beachRun', 'beach-run', 1333, 2000, 'Couple running hand in hand along the beach', 270),
  ('horseMono', 'horse-mono', 2000, 1333, 'Black and white portrait of a couple beside a horse', 280),
  ('heartProposal', 'heart-proposal', 1333, 2000, 'Proposal under a heart of red roses in stone ruins', 290),
  ('boatRide', 'boat-ride', 2000, 1333, 'Couple in a small boat on a river', 300),
  ('danceFloor', 'dance-floor', 2000, 1333, 'Guests on the dance floor at a Nikah celebration', 310),
  ('closeEmbrace', 'close-embrace', 1333, 2000, 'Groom resting his head against the bride''s in a close embrace', 320),
  ('veilLaugh', 'veil-laugh', 1333, 2000, 'Bride in a lace veil laughing with the groom', 330),
  ('shawlCanopy', 'shawl-canopy', 2000, 1333, 'Couple sheltering under an embroidered shawl', 340),
  ('emeraldAttire', 'emerald-attire', 1333, 2000, 'Couple in emerald and white Afghan wedding attire', 350),
  ('steppingStones', 'stepping-stones', 1333, 2000, 'Couple standing on stepping stones in a pond', 360),
  ('receptionStage', 'reception-stage', 2000, 1333, 'Couple seated on a floral reception stage with family', 370),
  ('seaBreeze', 'sea-breeze', 1333, 2000, 'Couple cheek to cheek by the sea', 380),
  ('redDressKiss', 'red-dress-kiss', 1333, 2000, 'Groom kissing the bride''s forehead, bride in red', 390),
  ('baraat', 'baraat', 2000, 1333, 'Baraat procession of guests in red and gold', 400),
  ('hallEntrance', 'hall-entrance', 2000, 1333, 'Sikh couple walking into the hall past seated guests', 410),
  ('ceremonyBow', 'ceremony-bow', 2000, 1333, 'Bride and groom bowing together during the ceremony', 420),
  ('familyCheer', 'family-cheer', 2000, 1333, 'Family cheering and dancing around the couple', 430),
  ('jointLaugh', 'joint-laugh', 1333, 2000, 'Groom and bride in red laughing together', 440),
  ('marigoldMandap', 'marigold-mandap', 1333, 2000, 'Couple seated under a marigold-strung mandap', 450),
  ('brideDance', 'bride-dance', 2000, 1333, 'Bride dancing alone in a yellow lehenga', 460),
  ('nikahCouple', 'nikah-couple', 2000, 1467, 'Nikah couple in embroidered attire with guests', 470)
on conflict (key) do update set
  file = excluded.file, width = excluded.width, height = excluded.height,
  alt = excluded.alt, sort_order = excluded.sort_order;
