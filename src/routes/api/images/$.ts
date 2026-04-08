import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

export const Route = createFileRoute('/api/images/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = params._splat
        if (!key) {
          return new Response('Not found', { status: 404 })
        }

        const object = await env.R2.get(key)
        if (!object) {
          return new Response('Not found', { status: 404 })
        }

        const headers = new Headers()
        headers.set('Content-Type', object.httpMetadata?.contentType ?? 'image/png')
        headers.set('Cache-Control', 'public, max-age=31536000, immutable')

        return new Response(object.body, { headers })
      },
    },
  },
})
