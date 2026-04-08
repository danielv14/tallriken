# Tallriken

Personal recipe bank with AI assistant, built with TanStack Start on Cloudflare Workers.

## Tech stack

- **Framework:** TanStack Start (React) with TanStack Router (file-based routing)
- **Styling:** Tailwind CSS 4 with custom theme (sage/terracotta palette)
- **UI components:** Base UI (headless) wrapped with CVA in `src/components/ui/`
- **Database:** Cloudflare D1 (SQLite) via Drizzle ORM
- **Object storage:** Cloudflare R2 for recipe images
- **AI chat:** TanStack AI with OpenAI GPT-4o-mini, Zustand for panel state
- **AI import:** OpenAI GPT-4o for URL/OCR extraction, DALL-E 3 for image generation
- **Auth:** Simple password auth with HMAC-signed session cookies
- **Testing:** Vitest with better-sqlite3 for in-memory database tests

## Project structure

- `src/auth/` -- session management, cookies, auth server functions
- `src/chat/` -- AI chat panel, Zustand store, tool definitions
- `src/components/` -- shared UI components and recipe form
- `src/db/` -- Drizzle schema, client, shared Database type
- `src/images/` -- R2 upload/retrieval, DALL-E generation
- `src/import/` -- URL/OCR/AI recipe extraction pipeline
- `src/recipes/` -- recipe CRUD, server functions, form utilities
- `src/tags/` -- tag CRUD and server functions
- `src/routes/` -- TanStack file-based routes

## Development

```
npm run dev          # Start dev server on port 3000
npm test             # Run tests
npm run db:generate  # Generate Drizzle migration from schema
npm run db:push      # Push schema to local D1 (miniflare)
```

Local environment variables go in `.dev.vars` (gitignored):
- `APP_PASSWORD` -- login password
- `APP_SECRET` -- HMAC signing key for session cookies
- `OPENAI_API_KEY` -- OpenAI API key

## Database

Schema defined in `src/db/schema.ts`. Drizzle generates migrations to `drizzle/`.

Two config files:
- `drizzle.config.ts` -- remote D1 via d1-http driver
- `drizzle.config.local.ts` -- local miniflare SQLite file

Ingredients are stored as JSON arrays of `{ group: string | null, items: string[] }`.

## Testing patterns

Tests use in-memory SQLite via better-sqlite3. Shared utilities in `src/test-utils.ts`:
- `createTestDb()` -- creates database with all tables
- `createTestTag(db, name)` -- creates a tag
- `createTestRecipe(db, overrides)` -- creates a recipe with sensible defaults

## Key conventions

- Path alias `#/*` maps to `src/*`
- Server functions use Zod validation via `.inputValidator()`
- Recipe form data uses strings for numbers (converted via `formDataToRecipeInput`/`recipeToFormData`)
- AI extraction returns `RecipeDraft` with nullable fields (OpenAI structured outputs requirement)
- Chat page context injected as `[KONTEXT: ...]` prefix in user messages, stripped on render
