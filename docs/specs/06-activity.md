# 6. Activity

**Who:** the photographer, to know when the couple has looked, hearted and downloaded, and who to nudge. **Principle:** answer "what should I do next?", not "here is a chart".

## Surfaces

1. **Gallery activity strip** (top of a gallery page): `Opened 14 times · 31 hearts · 6 downloads · last seen 2 hours ago`, using `type-metric`. Replaces nothing; it sits under the existing stat tiles.
2. **Activity tab on a gallery:** a timeline list (newest first): "Aarohi hearted 12 photos in Ceremony", "Someone downloaded the full gallery", "Link opened from a phone". Group repeats ("Opened 5 times today"). Each row has a time, an icon and words.
3. **Dashboard summary:** the three existing tiles plus "Needs a nudge" (galleries published with no opens after 3 days), as a list with a **Remind** button that opens a prefilled email (see spec 7).
4. **Charts, only two:** opens per day (bar) and downloads per photo (ranked list). Nothing else until a photographer asks.

## Chart style (define it once)

- Colour: one data colour, `--safelight`; comparisons use `--ink-muted`. No rainbow palettes.
- Marks: 2px lines, bars with 4px radius, no gridlines except a baseline and 3 light value lines (`--line`).
- Labels: `type-label` (mono) for axes, `type-metric` for values; direct labels instead of legends wherever possible.
- Interaction: hover or focus shows a value tooltip; every chart has a **table view** toggle ("Show as table") for screen readers and exact numbers.
- Motion: bars rise once on first view; none under reduced motion.
- States: empty ("No visits yet. Share the link to start."), loading skeleton in the chart's shape, error with retry.

## Privacy

Show counts and first names the couple typed; never IP addresses or device fingerprints. Respect the gallery's visitor cookie only.

## New components

`Chart` (bar, line, ranked list) with a data-table fallback, `Timeline`, `Stat`.

## Data

`gallery_events (gallery_id, visitor_id, kind, photo_id?, created_at)`; kinds: `open`, `heart`, `download_photo`, `download_zip`, `share`. Aggregates computed on read at first, materialised later.
