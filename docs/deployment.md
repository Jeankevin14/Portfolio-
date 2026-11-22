# Deployment

**Nobody deploys by hand.** Git does it.

| What you do | What happens |
|---|---|
| Open a pull request | GitHub runs **CI** (lint, secrets, build check, tests). Vercel makes a **preview link**. |
| Merge the pull request into `main` | Vercel updates **https://jeankevin.vercel.app** by itself (about 1 minute). Then the **Live site check** opens the site and confirms it works. |

## Hosting details
- Host: **Vercel**, project `jeankevin` (team `smvec`), connected to GitHub repo `Jeankevin14/Portfolio-`.
- Production branch: `main`.
- Framework preset: **Other**. Build command: none. Output directory: the repo root.
- `.vercelignore` keeps tooling folders (`docs/`, `tests/`, `scripts/` …) off the website.
- Secrets needed: **none**.

## Staging
No separate `develop` branch is needed: there is no database, and every pull request already gets its own Vercel preview link. Add `develop` only if a database is added later.

## Check the live site yourself
- In GitHub: **Actions** → **Live site check** → **Run workflow**.
- Or on your computer: `node scripts/smoke.mjs https://jeankevin.vercel.app`

## Releases
1. Add an entry at the top of `CHANGELOG.md` in your pull request.
2. After merging, on GitHub: **Releases** → **Draft a new release** → tag `v1.1.0` (new feature) or `v1.0.1` (small fix) → **Publish release**.

## If something goes wrong
- **CI is red**: click **Details** next to the red cross. The message says which file and line is wrong. Fix it on the same branch and push again.
- **Live site broken after a merge**: in Vercel → project → **Deployments**, open the previous good deployment → **⋯** → **Promote to Production**. Then fix it with a new pull request.

## Protect main (one-time setup)
GitHub → repo **Settings** → **Rules** → **Rulesets** → **New ruleset** → **New branch ruleset**:
- Name: `protect main`, Enforcement status: **Active**
- Target branches: **Add target** → **Include default branch**
- Tick **Restrict deletions**, **Require a pull request before merging** (Required approvals: 0, because you work alone), **Require status checks to pass** → **Add checks** → type `Lint, build and test` → select it, **Block force pushes**
- Click **Create**.
