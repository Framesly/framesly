# Framesly

Upload a wedding once; cull, deliver and sell from the same files.

## Repo layout

```
apps/web      Next.js 16 app: marketing site, sample gallery, sign-up/login, onboarding, dashboard
supabase/     Database migrations, auth settings (config.toml), email templates, RLS tests
SETUP.md      Supabase project setup and admin tasks
```

## Run it locally (new teammates start here)

You only need Node, pnpm and the two public Supabase values below. You do **not** need Docker, the Supabase CLI, or to run `supabase db push` / `config push`: the shared database is already set up.

**1. Install Node 22** (20.9+ works; 22 avoids a Supabase warning). Check with `node -v`.

**2. Install pnpm 9** so the `pnpm` command exists on your PATH:

```bash
npm install -g pnpm@9.15.4
pnpm -v        # should print 9.15.4
```

(`corepack enable` also works but may need `sudo` on macOS. Don't run `corepack pnpm dev`: Turbo needs a real `pnpm` binary and fails with "Unable to find package manager binary".)

**3. Get the code and install dependencies** (from the repo root):

```bash
git clone https://github.com/Abhishekkx/Framesly-Parvathy.git
cd Framesly-Parvathy
pnpm install
```

**4. Create `apps/web/.env.local`** with the shared project's public values (both are safe to share; the app never uses a secret key):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://kburqswwvlbfziplwndd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xb6McNUwKs3TN7xPrJF4Sg_jFTcpiW7
```

Without this file the app stops with "Site photos load from Supabase", because every page loads its photos and sign-in from Supabase. `apps/web/.env.example` lists every other variable (not needed yet).

**5. Start it:**

```bash
pnpm dev
```

Open http://localhost:3000. Sign up with any email (no confirmation email in this phase), set up a studio, and you land on the dashboard.

| Route | What it is |
|---|---|
| `/` | Landing page |
| `/pricing` | Plans and billing FAQ |
| `/sample` | Sample client gallery |
| `/signup`, `/login`, `/forgot-password` | Auth (Supabase) |
| `/onboarding` | Studio setup after first sign-up |
| `/galleries` | Dashboard: your galleries |
| `/galleries/[id]`, `/galleries/[id]/picks` | One gallery, and the couple's picks |
| `/uploads` | Pick a gallery to upload into |
| `/studio`, `/profile` | Studio branding, photographer profile |

### Troubleshooting

| You see | Fix |
|---|---|
| `Unable to find package manager binary` | Step 2: install pnpm globally, then use `pnpm dev`, not `corepack pnpm dev`. |
| `Site photos load from Supabase…` or a blank error page | Step 4: `apps/web/.env.local` is missing or misspelled; restart `pnpm dev` after creating it. |
| `Remote migration versions not found in local migrations directory` | Your copy is behind. Run `git pull`. **Do not** run `supabase migration repair` or `supabase db pull`: they rewrite the shared database's history. Database changes are applied by the project admin (see SETUP.md). |
| `Another next dev server is already running` | A dev server is already open for this folder (another terminal or editor). Use that one, or stop it and run `pnpm dev` again. |
| Port 3000 busy | `pnpm --filter @framesly/web dev -- --port 3001` |

Other checks: `pnpm lint`, `pnpm typecheck`, `pnpm build`.

## Design system (Darkroom)

- Tokens live in `apps/web/src/app/globals.css`. The public site is light by default and the app (`/app`) uses Darkroom; people can switch either way.
- Type scale utilities: `type-display-xl`, `type-display-l`, `type-heading-1`, `type-heading-2`, `type-body-l`, `type-body`, `type-caption`, `type-label`, `type-metric`.
- Primitives in `apps/web/src/components/ui`: `Button`/`ButtonLink` (shutter press feedback), `Viewfinder` (selection brackets), `Card`, `Chip`, `EdgeLabel`, `Field`.
- Motion helpers in `apps/web/src/components/motion`; everything respects `prefers-reduced-motion`.

## Demo content

Photos are real weddings by Wow Films, stored in Supabase (bucket `site-media`, table `site_photos`; see SETUP.md). Get the studio's written permission (and releases for the couples shown) before public launch. Prices in `apps/web/src/config/plans.ts` and the proof numbers on the landing page are drafts.
