# Framesly team rules

Two of us work in this repo (Tanishq and Abhishek). These rules keep our work from colliding.

## Git workflow

- **Never commit directly to `main`.** Always work on a branch named `tanishq/<feature>` or `abhishek/<feature>`.
- **Before starting work**, run these in order, then create a new branch:
  1. `git checkout main`
  2. `git pull`
  3. `pnpm install`
  4. `git checkout -b <your-name>/<feature>`
- **Keep branches small.** Open a Pull Request to merge into `main`.

## Tooling

- **Use pnpm, never npm.** The repo is a pnpm workspace; npm will fight with its lockfile and `node_modules`.

## Database

- **Database changes only as new files in `supabase/migrations/`.** Never edit an old migration, because it may already be applied to a live project.

## Secrets

- **Never commit `.env` files or secret keys.** The repo is public. `apps/web/.env.local` is git-ignored; keep it that way. Only publishable keys (`NEXT_PUBLIC_*`) are safe in the browser; the Supabase secret / service-role key stays on the server and out of git.
