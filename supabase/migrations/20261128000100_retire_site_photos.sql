-- These photos are no longer shown anywhere on the site. Retire them from
-- the catalogue; the code no longer references these keys.
update public.site_photos
set is_active = false
where key in ('afghanLaugh', 'pathTogether', 'shawlCanopy', 'emeraldAttire', 'gardenArch', 'steppingStones');
