# Framesly

Upload a wedding once; cull, deliver and sell from the same files.

## Repo layout

```
apps/web      Next.js 16 frontend: marketing site, sample client gallery, auth screens
```

## Run the frontend

Requires Node 20.9+ and pnpm 9 (`corepack enable pnpm`).

```bash
pnpm install
pnpm --filter @framesly/web dev
```

Then open http://localhost:3000.

| Route | What it is |
|---|---|
| `/` | Landing page |
| `/pricing` | Plans, comparison table, billing FAQ |
| `/sample` | Sample client gallery (photographer branding, favourites, lightbox) |
| `/login`, `/signup` | Auth screens (UI only, not wired to Supabase yet) |
| `/video` | Videographer teaser (coming after beta) |
| `/legal/terms`, `/legal/privacy` | Placeholders |

## Design system (Darkroom)

- Tokens live in `apps/web/src/app/globals.css`. Darkroom (dark) is the default; add `.theme-print` to any element for the light theme.
- Type scale utilities: `type-display-xl`, `type-display-l`, `type-heading-1`, `type-heading-2`, `type-body-l`, `type-body`, `type-caption`, `type-label`, `type-metric`.
- Primitives in `apps/web/src/components/ui`: `Button`/`ButtonLink` (shutter press feedback), `Viewfinder` (selection brackets), `Card`, `Chip`, `EdgeLabel`, `Field`.
- Motion helpers in `apps/web/src/components/motion`; everything respects `prefers-reduced-motion`.

## Demo content

Photos are real weddings by Wow Films, stored as WebP in `apps/web/public/photos` and listed in `apps/web/src/lib/photos.ts`. Get the studio's written permission (and releases for the couples shown) before public launch. Prices in `apps/web/src/config/plans.ts` and the proof numbers on the landing page are drafts.
