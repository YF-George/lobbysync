# LobbySync AI Coding Agent Instructions

## Project Overview
LobbySync is a SvelteKit-based full-stack web application with PostgreSQL database backend. The project uses Drizzle ORM for database operations and Tailwind CSS for styling.

## Architecture

### Stack & Key Dependencies
- **Frontend Framework**: SvelteKit 2.49.1 with Svelte 5.45.6
- **Build Tool**: Vite 7.2.6 with Tailwind 4.1.17
- **Database**: PostgreSQL with Drizzle ORM 0.45.0
- **Server Adapter**: Node.js adapter (`@sveltejs/adapter-node`)
- **Type Safety**: TypeScript with strict mode enabled
- **Code Quality**: ESLint (TypeScript + Svelte) + Prettier

### Directory Structure
- `src/lib/` - Shared reusable code and server utilities
  - `lib/server/db/` - Database schema and client initialization (Drizzle)
  - `lib/assets/` - Static assets
- `src/routes/` - SvelteKit page components and layouts (file-based routing)
- `src/app.html`, `app.d.ts` - App entry point and global types

### Data Flow
Database operations are server-side only. Routes use SvelteKit's server-side data loading (`+layout.svelte`, `+page.svelte`). Client components call server endpoints or load functions for data—never directly import server utilities in client code.

## Development Workflows

### Essential Commands
```bash
pnpm dev              # Start dev server (with hot reload)
pnpm build            # Production build (outputs Node.js app)
pnpm check            # Type-check + Svelte validation
pnpm lint             # ESLint + Prettier check
pnpm format           # Auto-format code
pnpm db:generate      # Generate Drizzle migrations
pnpm db:push          # Apply schema changes to database
pnpm db:studio        # Interactive Drizzle Studio web UI
```

### Database Setup
1. Set `DATABASE_URL` environment variable (PostgreSQL connection string required in `drizzle.config.ts`)
2. Define schema in `src/lib/server/db/schema.ts` using Drizzle's `pgTable()`
3. Run `pnpm db:generate` for migrations, then `pnpm db:push` to apply

## Project-Specific Patterns

### File Organization Conventions
- Server-side code: `src/lib/server/` (imports work only in `+server.ts` files and load functions)
- Client-safe code: `src/lib/` root level (exported from `lib/index.ts`)
- Routes: `src/routes/+page.svelte`, `src/routes/+layout.svelte`

### Database Pattern (Drizzle ORM)
All tables defined in `src/lib/server/db/schema.ts` using `pgTable()`. Example:
```typescript
export const user = pgTable('user', { 
  id: serial('id').primaryKey(), 
  age: integer('age') 
});
```
Access database in server-side context only (load functions, `+server.ts` endpoints).

### Type Safety
- `tsconfig.json` has `strict: true` - enforce strict null checking and all strict settings
- Import styles: Use `$lib` alias for `src/lib/` imports
- `.svelte.ts` files are server modules when in `src/routes/`, client modules in `src/lib/`

## Code Quality Standards
- **Linting**: ESLint runs on JavaScript/TypeScript and Svelte files; Prettier for formatting
- **Pre-commit Check**: Run `pnpm lint` before committing
- **Type Checking**: Use `pnpm check:watch` for continuous validation during development
- **Svelte-specific**: `svelte-check` validates all `.svelte` files

## Integration Points
- PostgreSQL connection via `DATABASE_URL` env variable
- Drizzle Kit CLI for migrations (see `drizzle.config.ts`)
- SvelteKit adapters: currently Node.js, may swap for other environments

## Notes for AI Agents
- Always run `pnpm check` and `pnpm lint` before suggesting code changes
- When modifying routes, remember SvelteKit uses file-based routing
- Database changes require migration: generate, review, then push
- Client code cannot import from `src/lib/server/` directly
- Tailwind CSS is integrated via `@tailwindcss/vite` and typography/forms plugins
