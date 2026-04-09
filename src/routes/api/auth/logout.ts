import { createFileRoute } from '@tanstack/react-router'
import { logoutSession } from '#/auth/responses'

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      POST: async () => logoutSession(),
    },
  },
})
