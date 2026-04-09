# Tallriken

A personal recipe bank with an integrated AI assistant. Save recipes from URLs, cookbooks (via photo), or manual entry. Browse, search, and filter your collection. Chat with an AI that knows your recipes and can suggest meals, create shopping lists, and plan weekly menus.

## Features

- **Recipe import** -- paste a URL (JSON-LD + AI extraction), upload cookbook photos (GPT-4o Vision), or enter manually
- **Auto-tagging** -- AI assigns tags from your taxonomy during import
- **Grouped ingredients** -- supports ingredient sections (e.g. "Dough", "Filling", "Sauce")
- **Search and filter** -- free text search combined with tag filtering
- **Weekly menus** -- plan meals for the week from your recipe collection
- **Shopping lists** -- auto-generate shopping lists from your weekly menu
- **AI chat** -- persistent side panel with recipe search, dietary filtering, meal planning
- **Image support** -- save original images from URLs, upload your own, or generate with DALL-E 3
- **Mobile-first** -- responsive design that works in the kitchen

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React, file-based routing, SSR)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Cloudflare Workers](https://workers.cloudflare.com), [D1](https://developers.cloudflare.com/d1/), [R2](https://developers.cloudflare.com/r2/)
- [Drizzle ORM](https://orm.drizzle.team)
- [TanStack AI](https://tanstack.com/ai) with OpenAI
- [Vitest](https://vitest.dev) for testing

## Getting started

### Prerequisites

- Node.js 22+
- A Cloudflare account with D1 and R2 enabled
- An OpenAI API key

### Setup

```bash
npm install

# Create local environment file
cat > .dev.vars << EOF
APP_PASSWORD=your-password
APP_SECRET=$(openssl rand -hex 32)
OPENAI_API_KEY=your-openai-key
EOF

# Push database schema locally
npm run db:push

# Start dev server
npm run dev
```

The app runs on `http://localhost:3000`.

### Cloudflare deployment

```bash
# Create D1 database and R2 bucket (first time only)
npx wrangler d1 create tallriken-db
npx wrangler r2 bucket create tallriken-images

# Update database_id in wrangler.jsonc

# Set secrets
npx wrangler secret put APP_PASSWORD
npx wrangler secret put APP_SECRET
npx wrangler secret put OPENAI_API_KEY

# Deploy
npm run deploy
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:generate` | Generate Drizzle migration from schema |
| `npm run db:push` | Push schema to local D1 |
| `npm run db:migrate` | Apply migrations to remote D1 |
| `npm run build` | Build for production |
| `npm run deploy` | Build and deploy to Cloudflare |
