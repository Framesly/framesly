# Framesly design guide

One page. The code in `apps/web/src` is the source of truth; this tells you where to look and which rules to follow. Full audit: `docs/DESIGN-FIX-PLAN.md`. Specs for unbuilt surfaces: `docs/specs/`.

## Idea

A photographer's darkroom: warm paper, a marigold safelight, film grain, viewfinder brackets, a shutter for transitions. Photography is the hero; chrome stays quiet. Voice: sentence case, plain words, no emoji. State always has a word, never only a colour.

## Themes (`app/globals.css`)

Every theme defines the same token names, so any component works in any theme.

| Theme | Where | Notes |
|---|---|---|
| Ivory (`:root`) | Marketing site, auth | Default; follows the device's dark mode until the visitor chooses |
| Darkroom (`html[data-theme=dark]`, `.theme-darkroom`) | The app (`/app`), lightbox, toasts | The app is Darkroom by default, whatever the device says |
| Print (`.theme-print`) | Client galleries, password and expiry screens | Light; follows dark mode with Darkroom values |
| Espresso, Maroon | Contrast bands, the page-transition curtain, footer | Use sparingly |

A studio's brand colour only replaces the accent, via `brandAccentStyle()` in `lib/color.ts`, which keeps it readable on the surface it sits on. Never use the raw brand colour for text.

## Tokens

- **Colour:** `surface`, `surface-raised`, `surface-sunken`, `line`, `line-strong`, `ink`, `ink-muted`, `safelight` (accent), `safelight-text`, `safelight-soft`, `on-safelight`, `success`, `danger`, `warning`, `info`. Fixed (do not change with theme): `fixed-dark`, `fixed-light`.
- **Type:** classes `type-display-xl`, `type-display-l`, `type-heading-1`, `type-heading-2`, `type-body-l`, `type-body`, `type-caption`, `type-label` (mono, uppercase), `type-metric` (mono numbers). Small UI text outside the scale: `text-micro` (11), `text-caption` (13), `text-small` (14), `text-body` (15), `text-lead` (16), `text-stat` (22). Nothing under 11px. Hero display sizes of 24px and up may be arbitrary.
- **Fonts:** Bricolage Grotesque (headings), Figtree (UI and body), JetBrains Mono (labels and numbers).
- **Radius:** `--radius-chip` 6 (inputs, chips), `--radius-control` 10 (buttons, cards), `--radius-cover` 16 (covers, dialogs), full for pills.
- **Elevation:** cards are flat with a border; floating layers use `shadow-float`; photos use `--shadow-print`.
- **Layers:** `z-(--z-sticky | nav | header | banner | viewer | toast | dialog | transition)`. Local stacking inside one component (`z-10`, `z-20`) is fine.
- **Motion:** `duration-(--duration-fast | base | slow | slower)`; easings `--ease-develop` (enter) and `--ease-shutter`. Animate `transform` and `opacity` only. Everything respects `prefers-reduced-motion`.
- **Spacing and layout:** Tailwind's scale; page container `--container-content` (1200px) with `gutter`; client gallery up to 1600px.

## Components (`components/ui/`)

`Button` (primary, ink, secondary, quiet, danger; sizes sm, md, lg, icon; one primary per screen), `ButtonLink`, `TextLink`, `Field`, `Select`, `Checkbox`, `Card` (+ `EdgeLabel`, `Chip`), `Badge`, `Dialog`, `Toast` (`useToast`), `Progress`, `Skeleton`, `Icon` (one icon set; add names in `icon.tsx`), `SkipLink`, `Viewfinder`, `useFocusTrap`. Reach for these before writing markup. If you need a new control, add it here first.

## Rules (CI enforces the first three: `pnpm lint:design`)

1. No hard-coded hex colours in `.tsx` (exceptions are listed in `scripts/check-design-tokens.mjs` with reasons).
2. No `z-[n]`; use the `--z-*` layers.
3. No `text-[Npx]` under 24px; use the scale above.
4. Every tap target is at least 44px (the small button is 44px on touch screens, 40px only with a mouse).
5. Every control has a visible focus ring (the global `:focus-visible` rule); never `outline-none` without a replacement.
6. State uses words and icons, not colour alone. Errors say what happened and what to do.
7. Every screen has loading, empty, normal, partial-failure and full-failure states.
8. Contrast: 4.5:1 for text, 3:1 for controls and graphics, in every theme the screen can appear in.
9. Motion never blocks work: the page-transition curtain is for marketing and auth only; nothing in `/app` waits for an animation.
10. Server-only code stays server-only. Files marked `"use server"` export only the actions they mean to expose.

## Per-PR checklist

- [ ] Contrast checked in each theme touched (Ivory, Darkroom, Print)
- [ ] Keyboard-only pass and visible focus
- [ ] 44px targets at 360px width
- [ ] Reduced motion respected
- [ ] `pnpm lint`, `pnpm lint:design`, `pnpm typecheck`, `pnpm build`
