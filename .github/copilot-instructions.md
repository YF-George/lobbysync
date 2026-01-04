## LobbySync — AI agent runtime notes

This file gives an AI coding agent the minimal, practical knowledge to be productive in this repo.

**Quick summary**

- Stack: SvelteKit (Svelte) frontend + Node server build artifacts. DB: PostgreSQL via Drizzle ORM. Realtime/Sessions use Supabase in parts of the codebase.
- Key runtime: dev with `pnpm dev`; builds output into `build/` (both `client/` and `server/`).

**Essential files & places to read first**

- Project root: `drizzle.config.ts` — Drizzle/migration config.
- DB schema: `src/lib/server/db/schema.ts` and SQL snapshots in the `drizzle/` folder.
- Server helpers: `src/lib/server/supabase.ts` and `src/lib/server/auth.ts`.
- Client Supabase helper: `src/lib/supabaseClient.ts`.
- Route patterns: see `src/routes/` — resource routes and API endpoints follow SvelteKit conventions (`+page.svelte`, `+layout.svelte`, `+server.ts`).
- Seed script: `scripts/seed-test-data.ts`.

**Architecture & patterns (observable in code)**

- Server-only code lives under `src/lib/server/` and must not be imported by browser code. Server endpoints use `+server.ts` and load functions.
- Page components use `+page.svelte` / `+layout.svelte`. Any module named `*.svelte.ts` in `src/routes/` is a server module.
- Database logic: `src/lib/server/db/index.ts` initializes the Drizzle client; all schema definitions are in `schema.ts`. Migrations live in `drizzle/*` as SQL snapshots.
- Realtime: there is a `src/lib/realtime.ts` and Supabase helpers; realtime behavior and presence are implemented via Supabase client in server and client code — ensure environment keys are available when running.

**Developer workflows & helpful commands**

- Start dev: `pnpm dev` (hot reload). Use this first to reproduce runtime behavior.
- Build for production: `pnpm build` → outputs `build/` (check `build/server/` and `build/client/`).
- Type-check & Svelte checks: `pnpm check` (run before larger refactors).
- Lint & format: `pnpm lint` / `pnpm format`.
- Drizzle migrations: `pnpm db:generate` then `pnpm db:push`. Migrations are also viewable under `drizzle/`.

Notes: the repo uses `pnpm` tooling; do not assume `npm` or `yarn` scripts behave identically.

**Project-specific conventions**

- Server-only modules: place under `src/lib/server/`. When you need secrets or DB, add code here and call via `+server.ts` endpoints.
- Database access: always through the initialized Drizzle client in `src/lib/server/db/index.ts` — avoid creating ad-hoc connections.
- Seed + snapshots: use `scripts/seed-test-data.ts` and the `drizzle/` SQL files for tests/dev data; don't hardcode IDs from snapshots.
- Build artifacts: prebuilt app files live in `build/` — useful for reproduction of production behavior without building locally.

**Integration & environment**

- Required env vars: `DATABASE_URL` (Drizzle/Postgres) and Supabase keys (check `.env` or deployment secrets). See `drizzle.config.ts` and `src/lib/server/supabase.ts`.
- External services: Supabase (auth + realtime). Be cautious when editing auth-related code in `src/lib/server/auth.ts` and client helpers.

**How AI agents should operate here (practical rules)**

1. Read `src/lib/server/db/schema.ts` and `drizzle.config.ts` before proposing DB changes. If adding/removing columns, include migration steps (`pnpm db:generate` + `pnpm db:push`).
2. Prefer server-side changes under `src/lib/server/` and expose via `+server.ts` endpoints; do not import server-only modules into client bundles.
3. Run `pnpm check` and `pnpm lint` after edits; include small test runs (manual page load) for UI changes if possible.
4. When modifying Realtime/Supabase code, list required env vars and adjust `scripts/seed-test-data.ts` if seeds need Supabase interactions.

**Quick examples**

- Add a new API endpoint: create `src/routes/api/your-resource/+server.ts` and use the Drizzle client from `src/lib/server/db/index.ts`.
- Add a DB column: update `src/lib/server/db/schema.ts`, run `pnpm db:generate`, commit migration in `drizzle/`, then `pnpm db:push` for your dev DB.

If anything above is unclear or you'd like a different emphasis (tests, CI, or deployment), tell me which area to expand.
