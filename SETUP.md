# Framesly setup

How to run the web app against Supabase: auth, onboarding, studios and galleries.

## 1. Install

```powershell
corepack enable
pnpm install
```

## 2. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com). Pick the region closest to most studios (Mumbai for India).
2. Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from **Project Settings → API**.
3. Link the CLI and push the schema:

```powershell
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

`db push` applies everything in `supabase/migrations`: tables, row-level security, the `create_studio` / `create_gallery` / `slug_available` functions, and the `studio-assets` storage bucket for logos and avatars.

## 3. Auth settings

Auth settings live in `supabase/config.toml` and are applied with:

```powershell
npx supabase config push
```

That sets the Site URL (the Vercel production URL), the allowed redirect URLs (production, Vercel previews, `framesly.app`, localhost), and passwords of 8+ characters with letters and digits.

**Email confirmation is off for now.** New photographers go straight from sign-up to onboarding. Turn it back on once Resend is set up (below): set `enable_confirmations = true` under `[auth.email]` in `supabase/config.toml` and run `npx supabase config push`. The app handles both modes. Run `npx supabase config diff` first to preview. If you change auth settings in the dashboard, copy them into `config.toml` too, or the next push will undo them.

No credentials belong in `config.toml`: secrets are referenced as `env(NAME)` or set in the dashboard.

**Email sending.** Without your own SMTP, Supabase sends a few emails per hour, only to members of your Supabase organisation, using its default templates. Real signups need Resend:

1. In Resend, verify a sending domain and create an API key.
2. Supabase → **Project Settings → Authentication → SMTP**: host `smtp.resend.com`, port `465`, user `resend`, password = the API key, sender e.g. `hello@framesly.app`.
3. In `supabase/config.toml`, set `enable_confirmations = true` and uncomment the two `[auth.email.template.*]` blocks, then run `npx supabase config push`. This switches to the branded emails in `supabase/templates/`, whose links work on any device.

**Google sign-in**

1. In Google Cloud Console, create an OAuth client (Web application).
2. Authorised redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. Paste the client ID and secret into **Authentication → Providers → Google** and enable it.

## 4. Run

```powershell
pnpm dev
```

Open http://localhost:3000/signup. The flow is: sign up → confirm email → onboarding (studio name and address, brand, data region) → galleries dashboard.

## Database work

Regenerate TypeScript types after changing the schema:

```powershell
npx supabase gen types typescript --linked > apps/web/src/lib/supabase/database.types.ts
```

Run the row-level security tests (needs Docker running):

```powershell
npx supabase start
npx supabase test db
```

The tests in `supabase/tests/rls_test.sql` check that one studio can never read or change another studio's data.

## Site photos (marketing, login pages, sample gallery)

The photos are not in the repo. They live in Supabase:

- **Files:** Storage bucket `site-media`, folder `showcase/`, each photo as `name-400.webp`, `name-800.webp`, `name-1200.webp` and `name-1800.webp`, plus `sample-og.jpg` for the sample gallery share image. The bucket is public to read; only the service role can upload.
- **Catalogue:** table `public.site_photos` (key, file, width, height, alt, credit, sort order, active). The root layout loads it once (cached for an hour) and hands it to every page.

To **replace a photo**: upload the four new WebP sizes under the same file name (or a new name and update `file` in the row), then update `width`, `height` and `alt`. To **add a photo**, add its key to `SITE_PHOTO_KEYS` in `apps/web/src/lib/photos.ts`, insert the row, and use `photos.yourKey` in a component. Upload with:

```powershell
npx supabase storage cp -r .\my-photos ss:///site-media/showcase --remote --experimental --cache-control "public, max-age=31536000, immutable"
```

Changes show within an hour, or straight away after the next deploy.

## User and studio files

Bucket `studio-assets`, one folder per owner. Row-level security on Storage lets users write only their own folder and studio members only their studio's:

- `users/{userId}/avatar/…`: a photographer's profile photo (`profiles.avatar_path`)
- `studios/{studioId}/logo/…`: a studio's logo (`studios.logo_path`)

Replacing either removes the old file.

## How the pieces fit

| Area | Where |
| --- | --- |
| Schema, RLS, storage policies, site photo catalogue | `supabase/migrations/` |
| Supabase clients (server, browser, proxy) | `apps/web/src/lib/supabase/` |
| Session refresh and `/app` protection | `apps/web/src/proxy.ts` |
| Current user and studio for server code | `apps/web/src/lib/auth/dal.ts` |
| Server actions by feature | `apps/web/src/features/{auth,studio,galleries,profile}/` |
| Shared form validation | `apps/web/src/lib/validation.ts` |
| Email link handlers | `apps/web/src/app/auth/{callback,confirm}/` |

Security rules: the browser only ever gets the anon key. Studio creation runs through a database function, so the web app never needs the service-role key. Photos will live on Cloudflare R2 (FR-05); Supabase Storage only holds small brand assets.
