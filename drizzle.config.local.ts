import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/591bbc95322edaa17f4342b951103c98b0577bdd26c4cda6730c3c0980ca9aa3.sqlite',
  },
})
