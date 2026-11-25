# Framesly design fix plan

**Aim:** the best-designed website for photographers and videographers on the internet.
**Source:** design audit of 25 Nov 2026 (code review; no visual pass yet).
**Rules:** follow `CLAUDE.md` (branch `tanishq/<feature>` or `abhishek/<feature>`, pnpm only, PR into `main`, no `.env` commits, DB changes only as new migrations).

**The bar for "#1"** (what each item below is measured against):
- WCAG 2.2 AA everywhere; every tap target 44px or more; visible focus on every control.
- One source of truth: every colour, size, z-index and duration comes from a token; every control comes from `components/ui/`.
- Photos are the hero: the gallery and the dashboard show real photos, loading gracefully.
- Fast: motion never slows daily work.

Size: S = under half a day, M = about a day, L = several days.

---

## A. Defects (fix first, one PR: `design-fixes`)

| # | Fix | Where | Done when | Size |
|---|---|---|---|---|
| A1 | Studio badge text unreadable on Ink, Maroon, Indigo, Emerald, Sindoor | `components/app/studio-badge.tsx`; reuse `readableOn()` from `components/studio/brand-controls.tsx` (move it to `lib/`) | Initials at 4.5:1 or better on all 8 presets | S |
| A2 | Studio colour never reaches client galleries | `components/gallery/client-gallery.tsx`, `lib/data/client-gallery.ts` (add `brand_color` to the payload) | Accent, active section underline, hearts and buttons use the studio colour, with a contrast-safe fallback to marigold | M |
| A3 | Dashboard cards never show a photo | `components/app/gallery-card.tsx`, `lib/data/galleries.ts` | Card shows the cover (or first photo) via a signed web copy; initials stay as the empty state | M |
| A4 | Lightbox has `aria-modal` but no focus trap, and no zoom | `components/gallery/lightbox.tsx` | Tab stays inside; double-tap and pinch zoom; Esc and focus return still work | M |
| A5 | Focus removed (`outline-none` with no replacement) | `components/app/gallery-editor.tsx`, `components/gallery/gallery-gate.tsx` | Visible 2px focus ring on every control; gate uses `Field` and `Button` | S |
| A6 | Tap targets under 44px | Theme switch (36px), sample notice (36px), gallery bar buttons (40px), `Button size="sm"` on mobile | Nothing interactive under 44px on touch; keep `sm` for desktop toolbars only | S |
| A7 | Text below the scale (9 to 10px) | 13 spots, e.g. "Sample" pill, tab-bar labels | Nothing under the `type-label` 11px floor | S |
| A8 | Page-transition curtain slows the app (about 1.3s) | `components/transition/page-transition.tsx`, `ui/button.tsx` (`ButtonLink`), `app/(app)/app/upload/page.tsx` | Curtain on marketing and auth only; in `/app/*` navigation is instant | S |
| A9 | OS dark mode ignored | `components/theme/theme.tsx` (`themeScript`) | **Superseded: full Darkroom.** The whole product is dark by default, so there is nothing to follow; the switch and `theme.tsx` are removed | S |

## B. Design system (make it hard to be inconsistent)

1. **Extract primitives into `components/ui/`:** `Dialog` (from `new-gallery-dialog.tsx`), `Toast` (from `gallery/toast.tsx`, then use it in the app instead of inline "Saved"), `Icon` (use the already-installed `lucide-react`, delete the ~30 hand-drawn duplicates), `Select`, `Checkbox`, `Badge` (replace the hand-rolled pills in `gallery-card.tsx` and `publish-panel.tsx` with `Chip`), `Progress`, `Skeleton`. (L)
2. **Replace hand-rolled controls** on the gate, client gallery and editor with `Button` and `Field`. (M)
3. **Add missing tokens in `globals.css`:** `--warning` and `--info` (all themes), a z-index scale (replace `z-[60]` through `z-[200]`), duration tokens, an elevation scale (replace the two ad hoc shadows). (M)
4. **Kill off-token values:** the 31 hard-coded hex values and the arbitrary `text-[Npx]` sizes. Add a lint check (grep in CI) so they can't return. (M)
5. **Write `DESIGN.md`** (one page): themes and where each is used, type scale, spacing, motion rules, component list, accessibility rules. (S)

## C. Missing states and surfaces

| Area | Add | Size |
|---|---|---|
| Errors | `app/error.tsx`, `(app)/app/error.tsx`, `global-error.tsx`; route-level `loading.tsx` for gallery pages | S |
| Uploader | Thumbnails, cancel and remove per file, "keep this tab open" guard (`beforeunload`), virtualised list for 2,000+ files, resume after refresh (matches the plan's promise) | L |
| Gallery editor | Full photo grid with reorder, delete, set cover, assign to section | L |
| Dashboard | Search, filter by status, sort; stat tiles stack on narrow phones | M |
| Client gallery | Blur placeholders, slideshow, calmer touch UI (one action per tile, not two), image loading polish | M |
| Accessibility | Skip link in app, client gallery and auth; `prefers-contrast` and forced-colors pass | S |
| Mobile | Web manifest and Apple touch icon (home-screen app is in the plan) | S |

## D. Roadmap surfaces (design first, build later)

Produce a Figma or HTML spec for each before building, reusing the tokens above.

1. **AI cull review screen** (needed by week 3): grid, keyboard-driven keep and reject, reason chips (blur, closed eyes, duplicate), "cull to N" control, override, compare view. Highest priority.
2. Proofing comments and picks; watermark settings and preview.
3. Video: player, chaptered highlights, comments pinned to the second (Bunny).
4. Face and selfie search flow for guests.
5. Print store: product picker, cart, checkout, order status.
6. Activity: views, downloads and favourites. Define the chart style first.
7. Branded email templates (delivery, expiry reminder, upsell).
8. Regional pricing and currency switcher; RTL and locale readiness for Middle East markets.
9. Team accounts, roles and invite UI.

Also: the pricing page lists features as "Yes" that are not built yet (AI culling, ZIP downloads, PIN). Mark them "Coming soon" until they ship.

---

## Order of work

1. **Week 1:** all of A, then B1 to B3 (A8 and A9 first, because they touch every page).
2. **Week 2:** B4 and B5, C errors, uploader and editor.
3. **Week 3:** C dashboard, client gallery, accessibility and mobile; D1 spec in parallel.
4. **Then:** build D by roadmap order; each ships with a spec, tokens only, and an accessibility check.

## Per-PR checklist

- [ ] Contrast checked in all themes touched (light, Darkroom, Print)
- [ ] Keyboard-only pass and visible focus
- [ ] Tap targets 44px or more on a phone width (360px)
- [ ] Reduced-motion respected
- [ ] No new hard-coded hex, pixel font sizes or z-index numbers
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` pass
