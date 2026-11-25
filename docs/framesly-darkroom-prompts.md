# Framesly · Full Darkroom: Claude Code prompts

Two prompts to paste into Claude Code, **one at a time, in order**. Each one is self-contained.

- **Prompt 1** changes the *structure*: Darkroom becomes the only default, everywhere.
- **Prompt 2** changes the *values*: the refined Darkroom brand-kit colours.

Run both on the same branch and open one PR when done.

Decision (Tanishq, 25 Nov 2026): **framesly.app goes full Darkroom.** The website, auth, onboarding, app and client galleries are all dark by default. The light "Ivory" default is retired.

---

## Prompt 1: Apply the Darkroom theme everywhere

```text
You are working in the Framesly monorepo (pnpm + Turborepo, Next.js app in apps/web).
Read CLAUDE.md and docs/DESIGN.md first and follow them.

## Setup
1. git checkout main && git pull && pnpm install
2. git checkout -b tanishq/full-darkroom

## Decision
Framesly is going "full Darkroom". Every part of the product is dark by default:
marketing site, auth, onboarding, the app (/app), and client galleries (/g/...).
The light "Ivory" theme stops being the default. There is no light/dark switch on the site.

## Current state (verify before changing)
- apps/web/src/app/globals.css: `:root, .theme-ivory` holds the light Ivory tokens;
  Darkroom lives in `html[data-theme="dark"], ... , .theme-darkroom`.
  Extra themes: .theme-espresso, .theme-maroon (contrast bands, footer, page-transition curtain),
  .theme-print (client galleries, light), .theme-ivory (the "lights on" band).
- apps/web/src/components/theme/theme.tsx: themeScript + resolveTheme() pick light/dark
  from localStorage ("framesly-theme"), the route (/app = dark) and prefers-color-scheme.
  It also exports ThemeArea, useTheme and ThemeSwitch (sun / moon segmented control).
  META = { light: "#f4efe6", dark: "#121417" }.
- apps/web/src/app/layout.tsx: viewport themeColor "#f4efe6", colorScheme "light dark".
- apps/web/src/app/manifest.ts: background_color / theme_color "#121417".
- apps/web/src/lib/color.ts: ACCENT_SURFACES { print, darkroom, darkroomRaised } must stay in
  sync with the tokens; brandAccentStyle() is called with these surfaces.

## What to do
1. Tokens (globals.css)
   - Move the Darkroom token block onto `:root` so dark is the base theme with no attribute needed.
     Keep `.theme-darkroom` as an alias selector on the same block. Set `color-scheme: dark` on :root.
   - Delete the Ivory block and the `.theme-ivory` class. Wherever `.theme-ivory` is used
     (grep the whole src), remove the class so that section simply uses Darkroom.
     Keep the section's layout and copy; only its colours change.
   - Retire `.theme-espresso` and `.theme-maroon`. Replace their usages with Darkroom surfaces:
     contrast bands → `bg-surface-raised` or `bg-surface-sunken` with `border-y border-line`;
     footer → `bg-surface-sunken`; page-transition curtain → `bg-surface-sunken`.
     Then delete both theme blocks and their grain rules.
   - Keep `.theme-print` in the CSS (a future per-gallery "light gallery" option), but stop
     applying it by default anywhere. Client galleries, password and expiry screens render in Darkroom.
     Remove the `html[data-theme="dark"] .theme-print` / `.theme-ivory` selectors that only existed
     for the old switch.
   - Update the `@media (prefers-contrast: more)` selector list to match the themes that remain.
   - Remove the theme-switch view-transition CSS (`html[data-theme-switching]`, `theme-reveal`)
     if nothing uses it after step 2.
   - Rewrite the comment block at the top of globals.css to describe the new rule:
     "Darkroom everywhere. .theme-print is an opt-in light gallery theme, not used by default."

2. Theme logic (components/theme/theme.tsx)
   - The theme is always "dark". Simplify: themeScript sets data-theme="dark" and
     colorScheme "dark" (or remove the script entirely if :root alone is enough; keep
     whatever avoids a flash and hydration warnings).
   - Remove the localStorage preference, prefers-color-scheme handling and ThemeSwitch.
     Remove every <ThemeSwitch /> usage (site header, mobile menu, app menus, settings).
     Keep the header layout balanced after removing it (no empty gap).
   - Keep ThemeArea / useTheme only if something still needs them; otherwise delete them and
     their usages in route-group layouts. Clear the old "framesly-theme" localStorage key once
     (one line, wrapped in try/catch) so returning visitors don't keep a stale value.
   - META / theme-color: dark only.

3. Browser + PWA colours
   - layout.tsx viewport: themeColor = the Darkroom --surface value, colorScheme = "dark".
   - manifest.ts: background_color and theme_color = the Darkroom --surface value.
   - Check app/opengraph-image.tsx, app/apple-icon.tsx, lib/brand-icon.tsx and app/pwa-icon:
     if they use Ivory colours, switch them to Darkroom values.

4. Studio brand accent (lib/color.ts and callers)
   - Client galleries are now Darkroom: wherever brandAccentStyle() is called with the Print
     surface (or with a light + dark pair), call it with the Darkroom surfaces instead.
   - Keep ACCENT_SURFACES in sync with the final tokens (Prompt 2 changes the values;
     reference them in one place so that is a one-line update).

5. Hard-coded light colours
   - grep apps/web/src for leftover Ivory values (#f4efe6, #fffcf7, #eae3d7, #dcd3c4, #1c1714,
     #645a50, #d18200, #8f5200, #f8e3bf) and for light-only Tailwind classes
     (bg-white, text-black, bg-neutral-50/100, etc.). Replace them with tokens.
   - Check that photo scrims, the WhatsApp mock-up (components/landing/gallery-track.tsx), the Google
     button (components/auth/primitives.tsx) and email templates (supabase/templates) still read
     well on dark. Email templates may stay light (email clients); leave them unless broken.

6. Docs
   - docs/DESIGN.md: update the Themes table (Darkroom everywhere; Print = opt-in light gallery,
     not used yet; Espresso, Maroon, Ivory removed) and the per-PR checklist.
   - docs/design-fix-plan.md: mark A9 (follow OS dark mode) as "Superseded: full Darkroom".

## Rules
- Tokens only: no new hard-coded hex in .tsx (pnpm lint:design must pass).
- Do not change copy, layout or motion beyond what removing the switch requires.
- Every text pair must still meet 4.5:1; controls and graphics 3:1.

## Done when
- Every route (/, /pricing, auth, onboarding, /app/*, /g/[slug], gate screens, 404, error pages)
  renders dark on first paint, with no flash of light, whatever the device setting.
- No theme switch anywhere; no references to Ivory, Espresso or Maroon remain in src.
- pnpm lint, pnpm lint:design, pnpm typecheck and pnpm build pass.
- You ran the dev server and checked the pages above at 1440px and 360px widths.
- Commit with a clear message, push the branch, and summarise for me: files changed,
  anything you were unsure about, and any screens that still look wrong.
  Do not merge; I will review the PR.
```

---

## Prompt 2: Apply the refined Darkroom brand-kit colours

```text
Continue on the branch tanishq/full-darkroom (Prompt 1 is done: Darkroom is the only default).
Read docs/DESIGN.md and apps/web/src/app/globals.css first.

## Goal
Replace the Darkroom token values with the refined brand-kit palette below, add the few
missing tokens, and wire them into the components that should use them.

## Why these values (keep these principles in the code comments)
- Neutral greys, not blue-tinted: the colour around a photo changes how its colours look,
  so the photo bed is a true neutral (R = G = B) and the chrome only has a 1–3 point cool lean.
- Never pure black (#000) or pure white (#fff): pure black hides elevation and smears on OLED,
  and pure white "vibrates" on dark. Ink on page is about 15.8:1, the level Material's dark
  theme recommends.
- Elevation = lighter surface: sunken (photos) < page < raised (cards) < overlay (menus, dialogs).
- One accent. Safelight amber is for one primary action per screen, favourites, selections and
  AI picks. Accent *text* uses a lighter, softer amber so it doesn't glare.

## Final Darkroom tokens (put these on the :root / .theme-darkroom block)

| Token | Value | Use |
|---|---|---|
| --surface-sunken | #0B0B0C | Photo bed: behind every photo and video (neutral) |
| --surface | #121315 | Page background |
| --surface-raised | #1A1B1E | Cards, panels, sidebar, header |
| --surface-overlay | #222428 | NEW. Menus, popovers, dialogs, toasts |
| --line | #2B2D31 | Decorative dividers only |
| --line-strong | #6E727A | Input, button and control borders (3.2:1+ on every surface) |
| --ink | #ECECEE | Main text |
| --ink-muted | #9EA1A8 | Metadata, captions, EXIF (6:1+) |
| --safelight | #F2A93B | Primary button fill, favourite heart, selection, AI pick |
| --safelight-hover | #F5B95E | NEW. Primary hover |
| --safelight-pressed | #D99530 | NEW. Primary pressed / active |
| --safelight-text | #F4C27A | Links and accent text on dark (9.5:1+) |
| --safelight-soft | #2B2113 | Badge, selected-row and "AI pick" fills |
| --on-safelight | #15120D | Text and icons on safelight fills (7.3:1+) |
| --success | #66C2D6 | Done states (teal, colour-blind safe; always with a word or icon) |
| --danger | #FF8577 | Errors (always with a word or icon) |
| --warning | #FF9A5C | Warnings (always with a word or icon) |
| --info | #8CBCFF | Info notes |
| --scrim | 11 11 12 | rgb() triplet for overlays: rgb(var(--scrim) / 0.7) |
| --print-border | #ECECEE | Paper border on loose "prints" |
| --shadow-print | 0 24px 50px -24px rgb(0 0 0 / 0.75) | Photo contact shadow |
| --hero-glow | rgb(242 169 59 / 0.06) | Faint safelight glow behind the hero |
| --grain-opacity | 0.05 | Film grain on page backgrounds (never on photos) |
| --canvas-grey | #4A4A4A | NEW. Neutral mid-grey canvas for colour checking (cull/lightbox option, later) |

Fixed colours in @theme inline:
- --color-fixed-dark: #15120D
- --color-fixed-light: #EEEEF0 (neutral; text on photo scrims)

## Steps
1. globals.css
   - Replace the Darkroom values with the table above; add the four NEW tokens.
   - Expose the new tokens in `@theme inline`: --color-surface-overlay, --color-safelight-hover,
     --color-safelight-pressed, --color-canvas-grey.
   - Update `--shadow-float` if needed so it still shows on --surface-overlay.
   - Keep `.theme-print` working: give it matching --surface-overlay, --safelight-hover and
     --safelight-pressed values (light equivalents) so components never break if it is used later.
2. Components (components/ui and friends)
   - Primary button: bg-safelight, hover:bg-safelight-hover, active:bg-safelight-pressed,
     text-on-safelight. Secondary buttons: transparent with border-line-strong and text-ink;
     hover bg-surface-raised. One primary per screen (already a rule).
   - Dialog, Toast, dropdowns/menus, popovers, the mobile menu and the lightbox's controls:
     use bg-surface-overlay (not surface-raised) with border-line.
   - Photo grids, gallery covers, the lightbox stage and the image area of dashboard gallery cards:
     bg-surface-sunken.
   - Selected / picked photo: 2px safelight outline (outline-offset 2px) plus a soft
     safelight-soft glow; the favourite heart filled with safelight. Add a small reusable
     utility or variant (e.g. `@utility selected-frame`) rather than repeating classes.
   - Badges / "AI pick" chips: bg-safelight-soft, text-safelight-text.
   - Links (TextLink): text-safelight-text, underline on hover.
3. Keep in sync
   - lib/color.ts ACCENT_SURFACES: darkroom = #0B0B0C, darkroomRaised = #1A1B1E
     (add overlay = #222428 and make brandAccentStyle check the lightest surface it can sit on).
   - layout.tsx viewport themeColor, manifest.ts and theme.tsx META: #121315.
   - opengraph-image / brand-icon / apple-icon: use the new surface and safelight values.
4. Verify contrast in code
   - Add `scripts/check-contrast.mjs` (and a `pnpm lint:contrast` script) that parses the
     Darkroom block in globals.css and asserts, using WCAG 2.2 maths:
     ink, ink-muted, safelight-text, success, danger, warning, info ≥ 4.5:1 on sunken, surface,
     raised and overlay; line-strong and safelight ≥ 3:1 on all four; on-safelight ≥ 4.5:1 on
     safelight, safelight-hover and safelight-pressed. Run it and include the output in the PR.
     Add it to .github/workflows/ci.yml next to lint:design.
5. Docs
   - docs/DESIGN.md: update the Tokens section with the new names (surface-overlay,
     safelight-hover, safelight-pressed, canvas-grey) and the usage rules:
     ~70% page, ~25% raised panels, under 5% safelight; one amber button per screen;
     never tint or colour-grade around photos; grain on backgrounds only.

## Rules
- No new hard-coded hex in .tsx (pnpm lint:design).
- Don't change layout, copy or motion.
- Status is never colour alone: always a word or icon.

## Done when
- pnpm lint, pnpm lint:design, pnpm lint:contrast, pnpm typecheck and pnpm build pass.
- You checked in the dev server, at 1440px and 360px: home, pricing, login, dashboard,
  gallery editor, upload, a client gallery (grid + lightbox), a dialog and a toast.
  Photos sit on the neutral sunken surface; menus and dialogs float on overlay; only one
  amber button per screen.
- Commit, push, and open one PR "Full Darkroom: theme + refined palette" against main with a
  before/after summary and the contrast script output. Do not merge.
```

---

## Reference: the palette at a glance

| Layer | Hex |
|---|---|
| Photo bed | `#0B0B0C` |
| Page | `#121315` |
| Raised | `#1A1B1E` |
| Overlay | `#222428` |
| Line / Line strong | `#2B2D31` / `#6E727A` |
| Ink / Muted | `#ECECEE` / `#9EA1A8` |
| Safelight / hover / pressed | `#F2A93B` / `#F5B95E` / `#D99530` |
| Safelight text / soft / on | `#F4C27A` / `#2B2113` / `#15120D` |
| Success / Danger / Warning / Info | `#66C2D6` / `#FF8577` / `#FF9A5C` / `#8CBCFF` |

All text pairs were checked against WCAG AA on every surface: ink 13.2–16.7:1, muted 6.0–7.6:1,
safelight text 9.5–12.0:1, line-strong 3.2–4.1:1, text on safelight 7.4–10.7:1.
