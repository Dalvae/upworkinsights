# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal analytics dashboard for Upwork job market data. Three-part system: browser extension captures jobs, Hono backend ingests/analyzes data, Svelte 5 SPA displays insights. Single-user, privacy-first design — all data lives in the user's own Supabase instance.

## Commands

```bash
# Development (run both in separate terminals)
bun run dev              # Backend on :8787
npx vite dev             # Frontend on :5173 (proxies /api to backend)

# Build
bun run build            # Full build (client + backend → dist/)
bun run build:client     # Frontend only → dist/client/

# Deploy
wrangler deploy          # Deploy to Cloudflare Workers

# Database
bun run import           # Bulk JSONL import (scripts/import.ts)
```

No test framework is configured.

## Architecture

### Backend (`src/`)
Hono 4 framework deployed to Cloudflare Workers. Entry point `src/index.ts` sets up CORS, injects Supabase clients (anon for reads, service role for writes) via middleware, and mounts routes under `/api`.

- **`routes/ingest.ts`** — POST `/api/ingest` and `/api/import/bulk`. The `upsertJobAndSkills()` function detects changes between existing and incoming jobs, creates `job_snapshots` when proposals/hiring changes are detected, and maintains the `job_skills` many-to-many relationship.
- **`routes/jobs.ts`** — Paginated, filterable job listing with safe-sort whitelist. Joins skills. Single job endpoint computes match score against user profile.
- **`routes/analytics.ts`** — Overview stats, skill demand, budget distributions, trend aggregates, proposal velocity analysis.
- **`routes/profile.ts`** — User preferences (skills, rate, tiers, min budget).
- **`lib/matching.ts`** — Score 0-100: skill overlap (40%), tier match (20%), budget fit (20%), client quality (20%).
- **`lib/scoring.ts`** — Client quality score 0-10 based on payment verification, spend, reviews, feedback, hire rate.
- **`lib/normalize.ts`** — Transforms raw Upwork GraphQL data to database schema. Strips HTML from descriptions.
- **`middleware/auth.ts`** — Bearer token validation against `INGEST_API_KEY`.

### Frontend (`client/`)
Svelte 5 SPA using runes (`$state`, `$effect`). Routing via `svelte-spa-router`. Styled with TailwindCSS 4 (dark theme). Charts via Chart.js. Accessible UI primitives from bits-ui.

- **`lib/api.ts`** — Centralized fetch wrapper for all `/api` endpoints.
- **`lib/table/`** — TanStack Table integration with custom Svelte 5 adapter (`createSvelteTable.svelte.ts`) and `FlexRender.svelte`.
- **`components/ui/`** — bits-ui wrappers (Checkbox, Combobox, Select, Tooltip) styled with Tailwind.
- **Pages:** Dashboard (stat cards + charts), Jobs (sortable/filterable table), JobDetail (match score + proposal history), Analytics (tabbed: budgets, hottest jobs, velocity), Profile (user preferences form).

**Important:** Use `$state.snapshot()` to unwrap Svelte 5 proxies before passing data to Chart.js — Chart.js cannot handle Svelte proxies.

### Browser Extension (`extension/`)
Manifest v2 WebExtension. Dual capture: intercepts GraphQL API responses via `background.js` fetch patching, and extracts SSR data from `window.__NUXT__` via `content.js`. Sends captured jobs to backend via POST `/api/ingest`.

### Database (Supabase PostgreSQL)
Schema in `scripts/migration.sql`, RLS policies in `scripts/rls.sql`. Key tables: `jobs` (40+ columns), `skills` (with auto-updated `job_count` via trigger), `job_skills` (many-to-many), `job_snapshots` (time-series competition tracking), `user_profile`, `daily_stats`.

## Environment Variables

Defined in `.env` (local) or Cloudflare Workers secrets (production):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `INGEST_API_KEY`

## Key Conventions

- TypeScript throughout, strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- No ORM — direct Supabase client queries
- Backend uses Hono's type-safe `Bindings` and `Variables` for environment/context
- Frontend components use Svelte 5 runes, not legacy `$:` reactive statements
- All API routes are prefixed with `/api`
- Bun is the package manager (`bunfig.toml` with `exact = true`)
